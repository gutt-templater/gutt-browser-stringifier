module.exports = {
	chainStatePush: function (layer, isModule) {
		return '\t' + (isModule ? 'await ' : '') + 'handleTemplate(' + layer + ', layer)\n'
	},

	createInstriction(children, layer) {
		return 'createNodes([' + children + '], layer.lookahead[' + layer + '][0])\n'
	},

	createAnchor: function (layer) {
		return '[layer, ' + layer + ']\n'
	},

	handleArray: function (layer, from, item, isModule, field) {
		return (isModule ? 'await ' : '') + 'handleArray(layer, ' + layer + ', ' + (isModule ? 'async ' : '') + 'function (iteration) {\nforEach(' + from + ', ' + (isModule ? 'async ' : '') + 'function (item, field) {\n' + item + ' = item\n' + field + '\n' + (isModule ? 'await ' : '') + 'iteration(field, item)\n})\n})\n'
	},

	createElement: function (name, attributes, children, layer, index) {
		return '[\'' + name + '\', {' + attributes.join(', ') + '}, [\n' + children + '\n], layer, ' + layer + ', ' + index + ']\n'
	},

	createScript: function (attributes, body, layer) {
		return 'createScript({' + attributes.join(', ') + '}, \'' + body + '\', layer, layer.lookahead[' + layer + '][0])\n'
	},

	createStyle: function (attributes, body, layer) {
		return 'createStyle({' + attributes.join(', ') + '}, \'' + body + '\', layer, layer.lookahead[' + layer + '][0])\n'
	},

	handleAttributes: function (layer, index, attributes) {
		return 'handleAttributes(layer.attributes[' + layer + '][' + index + '], {\n' + attributes.join(',\n') + '\n})\n'
	},

	createObjectItem: function (field, value) {
		return field + ': ' + value
	},

	componentInstuction: function (layer, name, params, isModule, childrenLayer) {
		return (typeof childrenLayer !== 'undefined' ?
			'var anchor = createAnchor(layer, ' + childrenLayer + ')\n\
			layer.lookahead[' + childrenLayer + '] = layer.lookahead[' + layer + ']\n' :
			''
		) +
		'var initialScope = {' + params.join(',') + '}\n\
\n\
		if (typeof layer.components[' + layer + '] === \'undefined\') {\n\
			var result =' + (isModule ? 'await ' : '') + ' imports[\'' + name + '\'](layer.anchors[' + layer + '].parentNode, layer.anchors[' + layer + '], initialScope, state, layer.lookahead[' + layer + '][0]' +
			(typeof childrenLayer !== 'undefined' ? ', anchor' : '')+ ') \n\
			layer.components[' + layer + '] = result.setState\n\
			layer.elements[' + layer + '] = result.elements\n\
		} else {\n\
			layer.elements[' + layer + '] = layer.components[' + layer + '](initialScope, state)\n\
			\n\
		}\n'
	},

	handleTextNode: function (index, content) {
		return 'handleTextNode(layer, ' + index + ', ' + content + ')\n'
	},

	setChildrenAnchor: function (instructionIndex, nextInstructionIndex) {
		return '[layer.anchors[' + nextInstructionIndex + '] = childrenAnchor, layer.lookahead[' + instructionIndex + '][0]]\n'
	},

	assertion: function (name, value) {
		return name + ' = ' + value + ';'
	},

	useStateStatement: function (nameExprValue, name, value) {
		return (
			value.length
				? 'if (typeof state[\'' + nameExprValue + '\'] === \'undefined\') ' +
					this.assertion(
						name,
						value
					) + ' else '
				: ''
		) + name + ' = state[\'' + nameExprValue + '\'];'
	},

	executeInstruction: function (name, value) {
		return 'if (typeof ' + name + ' === \'undefined\') ' +
			this.assertion(
				name,
				value
			)
	}
}
