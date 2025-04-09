var boilerplate = require('./boilerplate')
var logicHandler = require('./logic-handler')
var templates = require('./templates')

function extractValuesFromAttrs(attrs, fields) {
	var result = {}

	attrs.forEach(function (attr) {
		if (attr.name.type === 'string' && fields.indexOf(attr.name.value) > -1) {
			result[attr.name.value] = attr.value
		}
	})

	return result
}

function handleDefaultTag(node, templateIndex, instructionIndex, ctx) {
	var result = handleTagAttrs(node, templateIndex, instructionIndex, ctx)
	var staticAttributes = result[0]
	var index = result[1]

	return templates.createElement(
		node.name,
		staticAttributes,
		walk(node.firstChild, templateIndex, instructionIndex, ctx),
		instructionIndex,
		index
	)
}

function lightWalkForAssertion(current, ctx) {
	var children = []

	while (current) {
		if (current.type === 'text') {
			children.push(handleText(current))
		} else if (current.type === 'logic-node') {
			children.push('String(' + logicHandler(current, ctx) + ')')
		}

		current = current.nextSibling
	}

	return children.filter(Boolean).join(',\n')
}

function handleAssertionTag(node, templateIndex, instructionIndex, ctx) {
	var result = handleTagAttrs(node, templateIndex, instructionIndex, ctx)
	var staticAttributes = result[0]
	var index = result[1]
	var nextInstructionIndex = ++ctx.index
	var children = lightWalkForAssertion(node.firstChild, ctx)
	var assertion = node.name === 'title' ? 'document.title' : 'layer.attributes[' + instructionIndex + '][' + index + '].element.value'
	var instruction = templates.assertInstruction(children, assertion, ctx.params.type === 'module')

	ctx.executeInstructions[nextInstructionIndex] = instruction
	ctx.dynamicNodes[nextInstructionIndex] = 'EXECUTE'
	ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')

	return templates.createElement(
		node.name,
		staticAttributes,
		[],
		instructionIndex,
		index
	)
}

function logicNodeHandler(node, templateIndex, instructionIndex, ctx) {
	var nextInstructionIndex = ++ctx.index

	if (node.expr.type === 'var' && node.expr.value === 'children') {
		return templates.setChildrenAnchor(instructionIndex, nextInstructionIndex)
	}

	ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')
	ctx.textInstructions[nextInstructionIndex] =
		templates.handleTextNode(nextInstructionIndex, logicHandler(node, ctx))
	ctx.dynamicNodes[nextInstructionIndex] = 'TEXT_NODE'

	return templates.createAnchor(nextInstructionIndex)
}

function handleComponent(node, templateIndex, instructionIndex, ctx) {
	var nextInstructionIndex = ++ctx.index
	var params = []
	var childrenInstructionIndex = ++ctx.index

	node.attrs.forEach(function (attr) {
		params.push(templates.createObjectItem(
			handleNode(attr.name, templateIndex, nextInstructionIndex, ctx),
			attr.value === null ? 'true' : handleNode(attr.value, templateIndex, nextInstructionIndex, ctx)
		))
	})

	ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')
	ctx.componentInstuctions[nextInstructionIndex] = templates.componentInstuction(
		nextInstructionIndex,
		node.name,
		params,
		hasContent(node) ? childrenInstructionIndex : undefined
	)
	ctx.dynamicNodes[nextInstructionIndex] = 'COMPONENT'

	if (hasContent(node)) {
		ctx.templates[templateIndex] += templates.chainStatePush(childrenInstructionIndex, ctx.params.type === 'module')
		ctx.createInstructions[childrenInstructionIndex] = templates.createInstruction(
			walk(node.firstChild, templateIndex, instructionIndex, ctx),
			childrenInstructionIndex
		)
	}

	return templates.createAnchor(nextInstructionIndex)
}

function hasContent(node) {
	if (node.firstChild && node.firstChild === node.lastChild && node.firstChild.type === 'text' && !String(node.firstChild.text).trim().length) {
		return false
	}

	return node.firstChild
}

function handleImportStatement(node, templateIndex, instructionIndex, ctx) {
	var params = extractValuesFromAttrs(node.attrs, ['name', 'from'])

	if (ctx.params.type === 'module') {
		params.from.value += '.js'
	}

	ctx.imports[params.name.value] = handleNode(params.from, templateIndex, instructionIndex, ctx)

	return ''
}

function handleUseStateStatement(node, templateIndex, instructionIndex, ctx) {
	var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
	var instruction = templates.useStateStatement(
		params.name.expr.value,
		logicHandler(params.name, ctx, true),
		typeof params.value !== 'undefined' ? handleNode(params.value, templateIndex, instructionIndex, ctx) : ''
	)

	if (ctx.dynamicNodes[ctx.index] === 'EXECUTE') {
		ctx.executeInstructions[ctx.index] += instruction
	} else {
		var nextInstructionIndex = ++ctx.index

		ctx.executeInstructions[nextInstructionIndex] = instruction
		ctx.dynamicNodes[nextInstructionIndex] = 'EXECUTE'
		ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')
	}

	return ''
}

function handleVariableStatement(node, templateIndex, instructionIndex, ctx) {
	var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
	var instruction = templates.assertion(
		logicHandler(params.name, ctx, true),
		handleNode(params.value, templateIndex, instructionIndex, ctx)
	)

	if (ctx.dynamicNodes[ctx.index] === 'EXECUTE') {
		ctx.executeInstructions[ctx.index] += instruction
	} else {
		var nextInstructionIndex = ++ctx.index

		ctx.executeInstructions[nextInstructionIndex] = instruction
		ctx.dynamicNodes[nextInstructionIndex] = 'EXECUTE'
		ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')
	}

	return ''
}

function handleParamStatement(node, templateIndex, instructionIndex, ctx) {
	var nextInstructionIndex = ++ctx.index
	var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])

	ctx.executeInstructions[nextInstructionIndex] = templates.executeInstruction(
		logicHandler(params.name, ctx),
		handleNode(params.value, templateIndex, instructionIndex, ctx)
	)

	ctx.dynamicNodes[nextInstructionIndex] = 'EXECUTE'
	ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')

	return ''
}

function handleSwitchStatement(node, templateIndex, instructionIndex, ctx) {
	return walk(node.firstChild, templateIndex, instructionIndex, ctx)
}

function handleCaseStatement(node, templateIndex, instructionIndex, ctx) {
	if (node.firstChild) {
		var params = extractValuesFromAttrs(node.attrs, ['test'])
		var nextInstructionIndex = ++ctx.index

		ctx.templates[templateIndex] += (node.previousSibling ? 'else ' : '') + 'if (' + logicHandler(params.test, ctx) + ') {\n' +
			templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')

		handleTemplate(node.firstChild, templateIndex, nextInstructionIndex, ctx)

		ctx.templates[templateIndex] += '}\n'
		ctx.index++

		return templates.createAnchor(nextInstructionIndex)
	}
}

function handleDefaultStatement(node, templateIndex, instructionIndex, ctx) {
	if (node.firstChild) {
		var nextInstructionIndex = ++ctx.index

		ctx.templates[templateIndex] += 'else {\n' +
			templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')

		handleTemplate(node.firstChild, templateIndex, nextInstructionIndex, ctx)

		ctx.templates[templateIndex] += '}\n'
		ctx.index++

		return templates.createAnchor(nextInstructionIndex)
	}
}

function handleIfStatement(node, templateIndex, instructionIndex, ctx) {
	if (node.firstChild) {
		var params = extractValuesFromAttrs(node.attrs, ['test'])
		var nextInstructionIndex = ++ctx.index

		ctx.templates[templateIndex] += 'if (' + logicHandler(params.test, ctx) + ') {\n' +
			templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')

		handleTemplate(node.firstChild, templateIndex, nextInstructionIndex, ctx)

		ctx.templates[templateIndex] += '}\n'
		ctx.index++

		return templates.createAnchor(nextInstructionIndex)
	}

	return ''
}

function handleForEachStatement(node, templateIndex, instructionIndex, ctx) {
	var nextInstructionIndex = ++ctx.index
	var params = extractValuesFromAttrs(node.attrs, ['item', 'from', 'key'])

	ctx.useForEach = true
	ctx.arrayInstructions[nextInstructionIndex] = templates.handleArray(
		nextInstructionIndex,
		logicHandler(params.from, ctx),
		logicHandler(params.item, ctx, true),
		ctx.params.type === 'module',
		typeof params.key !== 'undefined' ? logicHandler(params.key, ctx, true) + ' = field' : ''
	)
	ctx.dynamicNodes[nextInstructionIndex] = 'ARRAY'

	if (node.firstChild) {
		ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')

		handleTemplate(node.firstChild, ++ctx.index, ctx.index, ctx)
	}

	return templates.createAnchor(nextInstructionIndex)
}

function handleAttributeStatement(node, templateIndex, instructionIndex, ctx) {
	var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
	var previousInstictionIndex = instructionIndex
	var index = ctx.tags[--previousInstictionIndex]

	while (typeof index === 'undefined') {
		index = ctx.tags[--previousInstictionIndex]
	}

	if (!ctx.dynamicAttributes[previousInstictionIndex]) {
		ctx.dynamicAttributes[previousInstictionIndex] = {}
	}

	if (typeof ctx.dynamicAttributes[previousInstictionIndex][index] === 'undefined') {
		ctx.dynamicAttributes[previousInstictionIndex][index] = []
	}

	ctx.dynamicAttributes[previousInstictionIndex][index].push(
		templates.createObjectItem(
			handleNode(params.name, templateIndex, instructionIndex, ctx),
			handleNode(params.value, templateIndex, instructionIndex, ctx)
		)
	)

	var instruction = templates.handleAttributes(
		previousInstictionIndex,
		index,
		ctx.dynamicAttributes[previousInstictionIndex][index]
	)

	if (ctx.dynamicNodes[ctx.index] === 'EXECUTE') {
		ctx.executeInstructions[ctx.index] += instruction
	} else {
		var nextInstructionIndex = ++ctx.index

		ctx.executeInstructions[nextInstructionIndex] = instruction
		ctx.dynamicNodes[nextInstructionIndex] = 'EXECUTE'
		ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')
	}

	return ''
}

function scriptNodeHandler(node, templateIndex, instructionIndex, ctx) {
	var nextInstructionIndex = ++ctx.index
	var result = handleTagAttrs(node, templateIndex, instructionIndex, ctx)
	var staticAttributes = result[0]

	ctx.createInstructions[nextInstructionIndex] = templates.createScript(
		staticAttributes,
		escapeString(node.body.str),
		nextInstructionIndex
	)
	ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')

	return templates.createAnchor(nextInstructionIndex)
}

function styleNodeHandler(node, templateIndex, instructionIndex, ctx) {
	var nextInstructionIndex = ++ctx.index
	var result = handleTagAttrs(node, templateIndex, instructionIndex, ctx)
	var staticAttributes = result[0]

	ctx.createInstructions[nextInstructionIndex] = templates.createStyle(
		staticAttributes,
		escapeString(node.body.str),
		nextInstructionIndex
	)
	ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')

	return templates.createAnchor(nextInstructionIndex)
}

function handleTagAttrs(node, templateIndex, instructionIndex, ctx) {
	if (typeof ctx.tags[instructionIndex] === 'undefined') {
		ctx.tags[instructionIndex] = -1
		ctx.dynamicAttributes[instructionIndex] = {}
	}

	var index = ++ctx.tags[instructionIndex]
	var staticAttributes = []

	node.attrs.forEach(function (attr) {
		if (attr.name.type === 'string') {
			if (attr.value === null) {
				staticAttributes.push(
					templates.createObjectItem(
						handleNode(attr.name, templateIndex, instructionIndex, ctx),
						'""'
					)
				)
			} else if (attr.value.type === 'string') {
				staticAttributes.push(
					templates.createObjectItem(
						handleNode(attr.name, templateIndex, instructionIndex, ctx),
						handleNode(attr.value, templateIndex, instructionIndex, ctx)
					)
				)
			} else {
				if (typeof ctx.dynamicAttributes[instructionIndex][index] === 'undefined') {
					ctx.dynamicAttributes[instructionIndex][index] = []
				}

				if (ctx.usedAttributes.indexOf(attr.name.value) === -1) {
					ctx.usedAttributes.push(attr.name.value)
				}

				ctx.dynamicAttributes[instructionIndex][index].push(
					templates.createObjectItem(
						handleNode(attr.name, templateIndex, instructionIndex, ctx),
						handleNode(attr.value, templateIndex, instructionIndex, ctx)
					)
				)
			}
		}
	})

	var hasDynamicAttributes = typeof ctx.dynamicAttributes[instructionIndex][index] !== 'undefined' && ctx.dynamicAttributes[instructionIndex][index].length > 0

	if (hasDynamicAttributes) {
		var instruction = templates.handleAttributes(
			instructionIndex,
			index,
			ctx.dynamicAttributes[instructionIndex][index]
		)

		if (ctx.dynamicNodes[ctx.index] === 'EXECUTE') {
			ctx.executeInstructions[ctx.index] += instruction
		} else {
			var nextInstructionIndex = ++ctx.index

			ctx.executeInstructions[nextInstructionIndex] = instruction
			ctx.dynamicNodes[nextInstructionIndex] = 'EXECUTE'
			ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')
		}
	}

	if (ctx.usedNodes.indexOf(node.name) === -1) {
		ctx.usedNodes.push(node.name)
	}

	return [
		staticAttributes,
		index
	]
}

function handleSlotStatement(node, templateIndex, instructionIndex, ctx) {
	var nextInstructionIndex = ++ctx.index

	if (hasContent(node)) {
		ctx.templates[templateIndex] += 'if (!childrenAnchor) {\n' +
			templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')

		handleTemplate(node.firstChild, templateIndex, nextInstructionIndex, ctx)

		ctx.templates[templateIndex] += '}\n'
		ctx.index++
	}

	return templates.setChildrenAnchor(instructionIndex, nextInstructionIndex)
}

function handleSelfStatement(node, templateIndex, instructionIndex, ctx) {
	var nextInstructionIndex = ++ctx.index
	var params = []
	var childrenInstructionIndex = ++ctx.index

	node.attrs.forEach(function (attr) {
		params.push(templates.createObjectItem(
			handleNode(attr.name, templateIndex, nextInstructionIndex, ctx),
			handleNode(attr.value, templateIndex, nextInstructionIndex, ctx)
		))
	})

	ctx.templates[templateIndex] += templates.chainStatePush(nextInstructionIndex, ctx.params.type === 'module')
	ctx.componentInstuctions[nextInstructionIndex] = templates.selfInstuction(
		nextInstructionIndex,
		params,
		hasContent(node) ? childrenInstructionIndex : undefined
	)
	ctx.dynamicNodes[nextInstructionIndex] = 'COMPONENT'

	if (hasContent(node)) {
		ctx.templates[templateIndex] += templates.chainStatePush(childrenInstructionIndex, ctx.params.type === 'module')
		ctx.createInstructions[childrenInstructionIndex] = templates.createInstruction(
			walk(node.firstChild, templateIndex, instructionIndex, ctx),
			childrenInstructionIndex
		)
	}

	return templates.createAnchor(nextInstructionIndex)
}

function escapeString(text) {
	return text.replace(/\r/g, '').replace(/\n/g, '\\n').replace(/\'/g, '\\\'')
}

function handleText(node) {
	var text = escapeString(node.text)

	if (!String(node.text).trim().length) {
		return ''
	}

	return '\'' + text + '\''
}

function handleString(node) {
	return '"' + node.value + '"'
}

function handleTag(node, templateIndex, instructionIndex, ctx) {
	switch (node.name) {
		case 'inline-svg':
		case 'template':
		case 'state-provider':
			return ''
		case 'import':
			return handleImportStatement(node, templateIndex, instructionIndex, ctx)
		case 'use-state':
			return handleUseStateStatement(node, templateIndex, instructionIndex, ctx)
		case 'param':
			return handleParamStatement(node, templateIndex, instructionIndex, ctx)
		case 'variable':
			return handleVariableStatement(node, templateIndex, instructionIndex, ctx)
		case 'switch':
			return handleSwitchStatement(node, templateIndex, instructionIndex, ctx)
		case 'case':
			return handleCaseStatement(node, templateIndex, instructionIndex, ctx)
		case 'default':
			return handleDefaultStatement(node, templateIndex, instructionIndex, ctx)
		case 'attribute':
			return handleAttributeStatement(node, templateIndex, instructionIndex, ctx)
		case 'for-each':
			return handleForEachStatement(node, templateIndex, instructionIndex, ctx)
		case 'if':
			return handleIfStatement(node, templateIndex, instructionIndex, ctx)
		case 'slot':
			return handleSlotStatement(node, templateIndex, instructionIndex, ctx)
		case 'self':
			return handleSelfStatement(node, templateIndex, instructionIndex, ctx)

		default:
			if (typeof ctx.imports[node.name] !== 'undefined') {
				return handleComponent(node, templateIndex, instructionIndex, ctx)
			}

			if (['title', 'textarea'].indexOf(node.name.toLowerCase()) !== -1) {
				return handleAssertionTag(node, templateIndex, instructionIndex, ctx)
			}

			return handleDefaultTag(node, templateIndex, instructionIndex, ctx)
	}
}

function handleNode(node, templateIndex, instructionIndex, ctx) {
	switch (node.type) {
		case 'logic':
			return logicHandler(node, ctx)
		case 'text':
			return handleText(node)
		case 'string':
			return handleString(node)
		case 'tag':
			return handleTag(node, templateIndex, instructionIndex, ctx)
		case 'logic-node':
			return logicNodeHandler(node, templateIndex, instructionIndex, ctx)
		case 'script':
			return scriptNodeHandler(node, templateIndex, instructionIndex, ctx)
		case 'style':
			return styleNodeHandler(node, templateIndex, instructionIndex, ctx)
		default:
			return ''
	}
}

function handleTemplate(node, templateIndex, instructionIndex, ctx) {
	if (!ctx.templates[templateIndex]) {
		ctx.templates[templateIndex] = templates.chainStatePush(instructionIndex, ctx.params.type === 'module')
	}

	ctx.createInstructions[instructionIndex] = templates.createInstruction(walk(node, templateIndex, instructionIndex, ctx), instructionIndex)
}

function walk(node, templateIndex, instructionIndex, ctx) {
	var result = []

	while (node) {
		result.push(handleNode(node, templateIndex, instructionIndex, ctx))

		node = node.nextSibling
	}

	return result.filter(Boolean).join(',\n')
}

function main(args) {
	const params = Object.assign({ type: 'es' }, args)

	return function (ast, source, filepath) {
		var ctx = {
			createInstructions: {},
			templates: {},
			arrayInstructions: {},
			dynamicNodes: {},
			dynamicAttributes: {},
			executeInstructions: {},
			imports: {},
			componentInstuctions: {},
			textInstructions: {},
			tags: {},
			filepath: filepath,
			stack: [],
			index: 0,
			params: params,
			usedFunctions: [],
			useForEach: false,
			usedAttributes: [],
			usedNodes: []
		}

		handleTemplate(ast, 0, 0, ctx)

		return boilerplate(ctx, params)
	}
}

module.exports = function () {
	if (arguments.length === 1) {
		return main(arguments[0])
	}

	return main({}).apply(null, arguments)
}
