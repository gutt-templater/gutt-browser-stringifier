module.exports = function (ctx) {
	var createInstructions = [],
		templates = [],
		arrayInstructions = [],
		dynamicNodes = [],
		executeInstructions = [],
		componentInstuctions = [],
		imports = [],
		field

	for (field in ctx.createInstructions) {
		if (ctx.createInstructions.hasOwnProperty(field)) {
			createInstructions.push(
				field + ': function (layer) {\n\
	return ' + ctx.createInstructions[field] + '\n\
}'
			)
		}
	}

	for (field in ctx.templates) {
		if (ctx.templates.hasOwnProperty(field)) {
			templates.push(
				field + ': function (layer, data) {\n\
	layer.index = -1\n\
' + ctx.templates[field] + '\n\
	handleTail(layer)\n\
}'
			)
		}
	}

	for (field in ctx.arrayInstructions) {
		if (ctx.arrayInstructions.hasOwnProperty(field)) {
			arrayInstructions.push(
				field + ': function (layer, data) {\n\
' + ctx.arrayInstructions[field] + '\n\
}'
			)
		}
	}

	for (field in ctx.dynamicNodes) {
		if (ctx.dynamicNodes.hasOwnProperty(field)) {
			dynamicNodes.push(
				field + ': ' + ctx.dynamicNodes[field]
			)
		}
	}

	for (field in ctx.executeInstructions) {
		if (ctx.executeInstructions.hasOwnProperty(field)) {
			executeInstructions.push(
				field + ': function (layer, data) {\n\
					' + ctx.executeInstructions[field] + '\n\
				}'
			)
		}
	}

	for (field in ctx.componentInstuctions) {
		if (ctx.componentInstuctions.hasOwnProperty(field)) {
			componentInstuctions.push(
				field + ': function (layer, data) {\n\
					' + ctx.componentInstuctions[field] + '\n\
				}'
			)
		}
	}

	for (field in ctx.imports) {
		if (ctx.imports.hasOwnProperty(field)) {
			imports.push(
				'\'' + field + '\': require(' + ctx.imports[field] + ')'
			)
		}
	}

	return 'module.exports = function (mountNode) {\n\
	var refNode\n\
	var data\n\
	var state\n\
	var childrenAnchor\n\
	var stack = {}\n\
	var ATTRIBUTES = 1\n\
	var TEXT_NODE = 2\n\
	var ARRAY = 4\n\
	var EXECUTE = 8\n\
	var COMPONENT = 16\n\
	var rootElements = []\n\
	var imports = {\n\
' + imports.join(',\n') + '\n\
	}\n\
	var dynamicNodes = {\n\
' + dynamicNodes.join(',\n') + '\n\
	}\n\
\n\
	if (arguments.length === 2) {\n\
		data = arguments[1]\n\
		state = arguments[1]\n\
	} else {\n\
		refNode = arguments[1]\n\
		data = arguments[2]\n\
		state = arguments[3]\n\
		childrenAnchor = arguments[4]\n\
	}\n\
\n\
	var createInstructions = {\n\
' + createInstructions.join(',\n') + '\n\
	}\n\
	var arrayInstructions = {\n\
' + arrayInstructions.join(',\n') + '\n\
	}\n\
	var executeInstructions = {\n\
' + executeInstructions.join(',\n') + '\n\
	}\n\
	var componentInstuctions = {\n\
' + componentInstuctions.join(',\n') + '\n\
	}\n\
	var templates = {\n\
' + templates.join(',\n') + '\n\
	}\n\
	var layers = {\n\
		0: createLayer()\n\
	}\n\
	var avatarTextarea = document.createElement(\'textarea\')\n\
\n\
	function createLayer() {\n\
		return {\n\
			index: 0,\n\
			state: [],\n\
			elements: {},\n\
			anchors: {},\n\
			children: {},\n\
			attributes: {},\n\
			components: {}\n\
		}\n\
	}\n\
\n\
	function forEach(data, callback) {\n\
		var field\n\
\n\
		for (field in data) {\n\
			if (data.hasOwnProperty(field)) {\n\
				callback(field, data[field])\n\
			}\n\
		}\n\
	}\n\
\n\
	function indexOf(items, item, usedIndexes) {\n\
		var i\n\
\n\
		for (i = 0; i < items.length; i++) {\n\
			if (items[i] === item && usedIndexes.indexOf(i) === -1) {\n\
				return i\n\
			}\n\
		}\n\
\n\
		return -1\n\
	}\n\
\n\
	function handleArray(parentLayer, data, layerIndex, iterator) {\n\
		var index = 0, layer, preservedIndex, nextSibling, moveElement\n\
		var usedIndexes = []\n\
		var unusedIndexes = []\n\
\n\
		createChildren(parentLayer, layerIndex)\n\
\n\
		var children = parentLayer.children[layerIndex]\n\
\n\
		iterator(function (field, item) {\n\
			preservedIndex = indexOf(children.items, item, usedIndexes)\n\
\n\
			if (preservedIndex === -1) {\n\
				layer = createLayer()\n\
\n\
				var anchor = createAnchor(layer, layerIndex + 1)\n\
\n\
				if (index < children.items.length) {\n\
					nextSibling = children.layers[index].elements[layerIndex + 1]\n\
\n\
					if (typeof nextSibling === \'undefined\') {\n\
						nextSibling = children.layers[index].anchors[layerIndex + 1]\n\
					} else if (nextSibling instanceof Array) {\n\
						nextSibling = nextSibling[0]\n\
					}\n\
\n\
					insertBefore(anchor, nextSibling)\n\
				} else {\n\
					insertElement(parentLayer, layerIndex, anchor)\n\
				}\n\
\n\
				children.layers.splice(index, 0, layer)\n\
				children.items.splice(index, 0, item)\n\
				usedIndexes.push(index)\n\
\n\
				templates[layerIndex + 1](layer, data)\n\
			} else {\n\
				if (preservedIndex !== index) {\n\
					nextSibling = children.layers[index].elements[layerIndex + 1]\n\
\n\
					if (typeof nextSibling === \'undefined\') {\n\
						nextSibling = children.layers[index].anchors[layerIndex + 1]\n\
					} else if (nextSibling instanceof Array) {\n\
						nextSibling = nextSibling[0]\n\
					}\n\
\n\
					moveElement = children.layers[preservedIndex].elements[layerIndex + 1]\n\
\n\
					if (typeof moveElement !== \'undefined\') {\n\
						moveElement.forEach(function (element) { insertBefore(element, nextSibling) })\n\
					}\n\
\n\
					moveElement = children.layers[preservedIndex].anchors[layerIndex + 1]\n\
					insertBefore(moveElement, nextSibling)\n\
\n\
					children.items.splice(index, 0, children.items.splice(preservedIndex, 1)[0])\n\
					children.layers.splice(index, 0, children.layers.splice(preservedIndex, 1)[0])\n\
				}\n\
\n\
				usedIndexes.push(index)\n\
				templates[layerIndex + 1](children.layers[index], data)\n\
			}\n\
\n\
			index++\n\
		})\n\
\n\
		usedIndexes.sort(function (a, b) { return a - b })\n\
\n\
		for (index = 0; index < usedIndexes.length; index++) {\n\
			if (usedIndexes[index] !== index) {\n\
				usedIndexes.splice(index, 0, index)\n\
				unusedIndexes.push(index)\n\
			}\n\
		}\n\
\n\
		for (; index < children.items.length; index++) {\n\
			unusedIndexes.push(index)\n\
		}\n\
\n\
		for (index = unusedIndexes.length - 1; index >= 0; index--) {\n\
			removeArrayLayer(children.layers[unusedIndexes[index]])\n\
			children.layers.splice(unusedIndexes[index], 1)\n\
			children.items.splice(unusedIndexes[index], 1)\n\
		}\n\
	}\n\
\n\
	function removeArrayLayer(layer) {\n\
		var childrenIndex, layerIndex, elementIndex\n\
\n\
		forEach(layer.children, function (childrenIndex, children) {\n\
			forEach(children.layers, function (layerIndex, layer) {\n\
				removeArrayLayer(layer)\n\
			})\n\
		})\n\
\n\
		forEach(layer.anchors, function (elementIndex, anchor) {\n\
			removeElement(anchor)\n\
		})\n\
\n\
		forEach(layer.elements, function (elementIndex, element) {\n\
			remove(layer, elementIndex)\n\
		})\n\
	}\n\
\n\
	function createChildren(layer, index) {\n\
		if (typeof layer.children[index] === \'undefined\') {\n\
			layer.children[index] = {\n\
				layers: [],\n\
				items: []\n\
			}\n\
		}\n\
	}\n\
\n\
	function createElement(nodeType, attributes, children, layer, layerIndex, index) {\n\
		var element = document.createElement(nodeType)\n\
		var attribute\n\
\n\
		applyAttributes(element, attributes)\n\
\n\
		if (typeof layer !== \'undefined\') {\n\
			if (typeof layer.attributes[layerIndex] === \'undefined\') {\n\
				layer.attributes[layerIndex] = {}\n\
			}\n\
\n\
			layer.attributes[layerIndex][index] = {\n\
				cache: {},\n\
				element: element\n\
			}\n\
		}\n\
\n\
		children.forEach(function (child) { element.appendChild(child) })\n\
\n\
		return element\n\
	}\n\
\n\
	function applyAttributes(element, attributes) {\n\
		forEach(attributes, function (attribute, value) {\n\
			element.setAttribute(attribute, value)\n\
		})\n\
	}\n\
\n\
	\n\
	function handleAttributes(layerAttributes, attributes) {\n\
		forEach(attributes, function (attribute, value) {\n\
			switch (attribute) {\n\
				case \'disabled\':\n\
					layerAttributes.element.disabled = value\n\
					break\n\
				default:\n\
					layerAttributes.element.setAttribute(attribute, value)\n\
			}\n\
			layerAttributes.cache[attribute] = true\n\
		})\n\
\n\
		forEach(layerAttributes.cache, function (attribute) {\n\
			if (typeof attributes[attribute] === \'undefined\') {\n\
				layerAttributes.element.removeAttribute(attribute)\n\
				delete attributes[attribute]\n\
			}\n\
		})\n\
	}\n\
\n\
	function createTextElement(content) {\n\
		avatarTextarea.innerHTML = content\n\
		return document.createTextNode(avatarTextarea.value)\n\
	}\n\
\n\
	function createAnchor(layer, index) {\n\
		var anchor = document.createComment(\'\')\n\
\n\
		layer.anchors[index] = anchor\n\
\n\
		return anchor\n\
	}\n\
\n\
	function insertElement(layer, index, element) {\n\
		if (layer.anchors[index]) {\n\
			insertBefore(element, layer.anchors[index])\n\
		} else {\n\
			mountNode.appendChild(element)\n\
\n\
			if (rootElements.indexOf(element) === -1) {\n\
				rootElements.push(element)\n\
			}\n\
		}\n\
	}\n\
\n\
	function insertBefore(element, anchorRef) {\n\
		var parentNode = anchorRef.parentNode\n\
		parentNode.insertBefore(element, anchorRef)\n\
\n\
		if (parentNode === mountNode && rootElements.indexOf(element) === -1) {\n\
			rootElements.push(element)\n\
		}\n\
	}\n\
\n\
	function removeElement(element) {\n\
		if (element.parentNode !== null) {\n\
			element.parentNode.removeChild(element)\n\
		}\n\
	}\n\
\n\
	function insert(layer, index, data) {\n\
		if (typeof arrayInstructions[index] !== \'undefined\') {\n\
			arrayInstructions[index](layer, data)\n\
		} else if (typeof executeInstructions[index] !== \'undefined\') {\n\
			executeInstructions[index](layer, data)\n\
		} else if (typeof componentInstuctions[index] !== \'undefined\') {\n\
			componentInstuctions[index](layer, data)\n\
		} else {\n\
			var elements = createInstructions[index](layer, data)\n\
\n\
			layer.elements[index] = elements\n\
			elements.forEach(function (element) { insertElement(layer, index, element) })\n\
		}\n\
	}\n\
\n\
	function remove(layer, index) {\n\
		if (typeof arrayInstructions[index] !== \'undefined\') {\n\
			var layerIndex, elementIndex, element \n\
\n\
			for (layerIndex in layer.children[index].layers) {\n\
				if (layer.children[index].layers.hasOwnProperty(layerIndex)) {\n\
					for (elementIndex in layer.children[index].layers[layerIndex].elements) {\n\
						if (layer.children[index].layers[layerIndex].elements.hasOwnProperty(elementIndex)) {\n\
							layer.children[index].layers[layerIndex].elements[elementIndex].forEach(removeElement)\n\
						}\n\
					}\n\
				}\n\
			}\n\
\n\
			delete layer.children[index]\n\
		} else if (typeof executeInstructions[index] === \'undefined\') {\n\
			layer.elements[index].forEach(removeElement)\n\
\n\
			delete layer.elements[index]\n\
\n\
			if (typeof componentInstuctions[index] !==\'undefined\') {\n\
				delete layer.components[index]\n\
			}\n\
		}\n\
	}\n\
\n\
	function handleTemplate(construction, layer, data) {\n\
		layer.index++\n\
\n\
		if (layer.index >= layer.state.length || construction < layer.state[layer.index]) {\n\
			layer.state.splice(layer.index, 0, construction)\n\
			insert(layer, construction, data)\n\
		} else if (construction > layer.state[layer.index]) {\n\
			remove(layer, layer.state[layer.index])\n\
			layer.state.splice(layer.index, 1)\n\
			layer.index--\n\
			handleTemplate(construction, layer, data)\n\
		} else if (typeof dynamicNodes[construction] !== \'undefined\') {\n\
			if (dynamicNodes[construction] & ARRAY) {\n\
				arrayInstructions[construction](layer, data)\n\
			} else if (dynamicNodes[construction] & TEXT_NODE) {\n\
				remove(layer, construction)\n\
				insert(layer, construction, data)\n\
			} else if (dynamicNodes[construction] & EXECUTE) {\n\
				executeInstructions[construction](layer, data)\n\
			} else if (dynamicNodes[construction] & COMPONENT) {\n\
				componentInstuctions[construction](layer, data)\n\
			}\n\
		}\n\
\n\
	}\n\
\n\
	function handleTail(layer) {\n\
		layer.index++\n\
\n\
		for (; layer.index < layer.state.length;) {\n\
			remove(layer, layer.state[layer.index])\n\
			layer.state.splice(layer.index, 1)\n\
		}\n\
	}\n\
\n\
	if (typeof templates[0] !== \'undefined\' && typeof typeof layers[0] !== \'undefined\') {\n\
		templates[0](layers[0], data)\n\
	}\n\
\n\
	function setState(data) {\n\
		stack = {}\n\
\n\
		if (arguments.length === 2) {\n\
			state = arguments[1]\n\
		}\n\
\n\
		if (typeof templates[0] !== \'undefined\' && typeof typeof layers[0] !== \'undefined\') {\n\
			templates[0](layers[0], data)\n\
		}\n\
\n\
		return rootElements\n\
	}\n\
\n\
	if (arguments.length === 2) {\n\
		return setState\n\
	} else {\n\
		return { setState: setState, elements: rootElements }\n\
	}\n\
}'
}
