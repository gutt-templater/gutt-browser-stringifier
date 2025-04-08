module.exports = {
	chainStatePush: function (layer, isModule) {
		return '\t' + (isModule ? 'await ' : '') + 'handleTemplate(' + layer + ', layer)\n'
	},

	createInstruction(children, layer) {
		return 'createNodes([' + children + '], layer.lookahead[' + layer + '][0])\n'
	},

	createAnchor: function (layer) {
		return '[layer, ' + layer + ']\n'
	},

	handleArray: function (layer, from, item, isModule, field) {
		return (isModule ? 'await ' : '') + 'handleArray(layer, ' + layer + ', ' + (isModule ? 'async ' : '') + 'function (iteration) {\n' +
		(isModule ? 'await ' : '') + 'forEach(' + from + ', ' + (isModule ? 'async ' : '') + 'function (item, field) {\n' + item + ' = item\n' + field + '\n' + (isModule ? 'await ' : '') + 'iteration(field, item)\n})\n})\n'
	},

	createElement: function (name, attributes, children, layer, index) {
		return '[\'' + name + '\', {' + attributes.join(', ') + '}, [\n' + children + '\n], layer, ' + layer + ', ' + index + ']\n'
	},

	createScript: function (attributes, body, layer) {
		return 'createTag(\'script\', {' + attributes.join(', ') + '}, \'' + body + '\', layer, layer.lookahead[' + layer + '][0])\n'
	},

	createStyle: function (attributes, body, layer) {
		return 'createTag(\'style\', {' + attributes.join(', ') + '}, \'' + body + '\', layer, layer.lookahead[' + layer + '][0])\n'
	},

	handleAttributes: function (layer, index, attributes) {
		return 'applyAttributes(layer.attributes[' + layer + '][' + index + '].element, {\n' + attributes.join(',\n') + '\n})\n'
	},

	createObjectItem: function (field, value) {
		return field + ': ' + value
	},

	componentInstuction: function (layer, name, params, childrenLayer) {
		return 'handleComponent(imports[\'' + name + '\'], layer, ' + layer + ', {' + params.join(',') + '}' + (typeof childrenLayer !== 'undefined' ? ', ' + childrenLayer : '') + ')'
	},

	selfInstuction: function (layer, params, childrenLayer) {
		return 'handleComponent(main, layer, ' + layer + ', {' + params.join(',') + '}' + (typeof childrenLayer !== 'undefined' ? ', ' + childrenLayer : '') + ')'
	},

	handleTextNode: function (index, content) {
		return 'handleTextNode(layer, ' + index + ', ' + content + ')\n'
	},

	setChildrenAnchor: function (instructionIndex, nextInstructionIndex) {
		return 'childrenAnchor ? [layer.anchors[' + nextInstructionIndex + '] = childrenAnchor, layer.lookahead[' + instructionIndex + '][0]] : [layer, ' + nextInstructionIndex + ']\n'
	},

	assertion: function (name, value) {
		return name + ' = ' + value + ';'
	},

	useStateStatement: function (nameExprValue, name, value) {
		return (
			value.length
				? 'if (!exists(state[\'' + nameExprValue + '\'])) ' +
					this.assertion(
						name,
						value
					) + ' else '
				: ''
		) + name + ' = state[\'' + nameExprValue + '\'];'
	},

	executeInstruction: function (name, value) {
		return 'if (!exists(' + name + ')) ' +
			this.assertion(
				name,
				value
			)
	},

	titleInstruction: function (children, isModule) {
		return 'var temp = createElementNS(\'div\')\n' +
			'var children = ' + (isModule ? 'await ' : '') + 'createNodes([' + children + '], [])\n' +
			'forEach(children, function(child) { temp.appendChild(child) })\n' +
			'if (document.title !== temp.outerText) document.title = temp.outerText;'
	}
}
