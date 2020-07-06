module.exports = {
	chainStatePush: function (layer) {
		return 'chainState.push(' + layer + ')\n'
	},

	createAnchor: function (layer) {
		return 'createAnchor(layer, ' + layer + ')\n'
	},

	handleArray: function (layer, from, item, field) {
		return 'handleArray(layer, data, ' + layer + ', function (iteration) {\nforEach(' + from + ', function (field, item) {\n' + item + ' = item\n' + field + '\niteration(field, item)\n})\n})\n'
	},

	createElement: function (name, attributes, children, dynamic, layer, index) {
		return 'createElement(\'' + name + '\', {' + attributes + '}, [\n' + children + '\n]' + (dynamic ? ', layer, ' + layer + ', ' + index : '') + ')'
	},

	handleAttributes: function (layer, index, attributes) {
		return 'handleAttributes(layer.attributes[' + layer + '][' + index + '], {\n' + attributes + '\n})'
	},

	createObjectItem: function (field, value) {
		return field + ': ' + value
	},

	componentInstuction: function (layer, name, params, childrenLayer) {
		return (typeof childrenLayer !== 'undefined' ? 'var anchor = createAnchor(layer, ' + childrenLayer + ')\n' : '') +
		'var params = {' + params + '}\n\
\n\
		if (typeof layer.components[' + layer + '] === \'undefined\') {\n\
			var result = imports[\'' + name + '\'](layer.anchors[' + layer + '].parentNode, layer.anchors[' + layer + '], params, state' +
			(typeof childrenLayer !== 'undefined' ? ', anchor' : '')+ ') \n\
			layer.components[' + layer + '] = result.setState\n\
			layer.elements[' + layer + '] = result.elements\n\
		} else {\n\
			layer.elements[' + layer + '] = layer.components[' + layer + '](params, state)\n\
			\n\
		}'
	}
}
