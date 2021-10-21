module.exports = {
	chainStatePush: function (layer, isModule) {
		return (isModule ? 'await ' : '') + 'handleTemplate(' + layer + ', layer)\n'
	},

	createAnchor: function (layer) {
		return '[layer, ' + layer + ']\n'
	},

	handleArray: function (layer, from, item, isModule, field) {
		return (isModule ? 'await ' : '') + 'handleArray(layer, ' + layer + ', ' + (isModule ? 'async ' : '') + 'function (iteration) {\nforEach(' + from + ', ' + (isModule ? 'async ' : '') + 'function (item, field) {\n' + item + ' = item\n' + field + (isModule ? 'await ' : '') + 'iteration(field, item)\n})\n})\n'
	},

	createElement: function (name, attributes, children, layer, index) {
		return '[\'' + name + '\', {' + attributes + '}, [\n' + children + '\n], layer, ' + layer + ', ' + index + ']'
	},

	handleAttributes: function (layer, index, attributes) {
		return 'handleAttributes(layer.attributes[' + layer + '][' + index + '], {\n' + attributes + '\n})'
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
		'var initialScope = {' + params + '}\n\
\n\
		if (typeof layer.components[' + layer + '] === \'undefined\') {\n\
			var result =' + (isModule ? 'await ' : '') + ' imports[\'' + name + '\'](layer.anchors[' + layer + '].parentNode, layer.anchors[' + layer + '], initialScope, state, layer.lookahead[' + layer + '][0]' +
			(typeof childrenLayer !== 'undefined' ? ', anchor' : '')+ ') \n\
			layer.components[' + layer + '] = result.setState\n\
			layer.elements[' + layer + '] = result.elements\n\
		} else {\n\
			layer.elements[' + layer + '] = layer.components[' + layer + '](initialScope, state)\n\
			\n\
		}'
	},

	handleTextNode: function (index, content) {
		return 'handleTextNode(layer, ' + index + ', ' + content + ')'
	}
}
