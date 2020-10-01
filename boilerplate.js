module.exports = function (ctx) {
	var createInstructions = [],
		templates = [],
		instructions = [],
		dynamicNodes = [],
		imports = [],
		field

	for (field in ctx.dynamicNodes) {
		if (ctx.dynamicNodes.hasOwnProperty(field)) {
			dynamicNodes.push(
				field + ': ' + ctx.dynamicNodes[field]
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

	for (field in ctx.createInstructions) {
		if (ctx.createInstructions.hasOwnProperty(field)) {
			instructions[field] = field + ': function (layer) {\n\
	return ' + ctx.createInstructions[field] + '\n\
}'
		}
	}

	for (field in ctx.arrayInstructions) {
		if (ctx.arrayInstructions.hasOwnProperty(field)) {
			instructions[field] = field + ': function (layer, data) {\n\
' + ctx.arrayInstructions[field] + '\n\
}'
		}
	}

	for (field in ctx.executeInstructions) {
		if (ctx.executeInstructions.hasOwnProperty(field)) {
			instructions[field] = field + ': function (layer, data) {\n\
				' + ctx.executeInstructions[field] + '\n\
			}'
		}
	}

	for (field in ctx.componentInstuctions) {
		if (ctx.componentInstuctions.hasOwnProperty(field)) {
			instructions.push(
				field + ': function (layer, data) {\n\
					' + ctx.componentInstuctions[field] + '\n\
				}'
			)
		}
	}

	for (field in ctx.textInstructions) {
		if (ctx.textInstructions.hasOwnProperty(field)) {
			instructions[field] = field + ': function (layer, data) {\n\
				' + ctx.textInstructions[field] + '\n\
			}'
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
	var MKARR_OPEN = 2 << 1;\n\
	var MKARR_CLOSE = 1 << 1;\n\
	function mkArr(start, end, flag) {\n\
		var arr = [], i;\n\
		if (flag & MKARR_OPEN) {\n\
			if (start <= end) {\n\
				for (i = start; i < end; i++) {\n\
					arr.push(i);\n\
				}\n\
			} else {\n\
				for (i = start; i > end; i--) {\n\
					arr.push(i);\n\
				}\n\
			}\n\
		} else if (flag & MKARR_CLOSE) {\n\
			if (start <= end) {\n\
				for (i = start; i <= end; i++) {\n\
					arr.push(i);\n\
				}\n\
			} else {\n\
				for (i = start; i >= end; i--) {\n\
					arr.push(i);\n\
				}\n\
			}\n\
		}\n\
		return arr;\n\
	}\n\
	function str(str, len, sprtr) {\n\
		if (!len) len = 0;\n\
		if (typeof str.toString === \'function\') str = str.toString();\n\
		if (!sprtr) sprtr = \'.\';\n\
		if (~str.indexOf(\'.\')) {\n\
			if (len > 0) {\n\
				str = str.substr(0, str.indexOf(\'.\') + len + 1);\n\
			} else {\n\
				str = str.substr(0, str.indexOf(\'.\') + len);\n\
			}\n\
		} else {\n\
			str = str_pad(str + \'.\', str.length + 1 + len, \'0\');\n\
		}\n\
		return str.replace(\'.\', sprtr);\n\
	}\n\
	function str_replace(str, src, rep) {\n\
		while (~str.indexOf(src)) {\n\
			str = str.replace(src, rep);\n\
		}\n\
		return str;\n\
	}\n\
	var STRPADRIGHT = 1 << 1;\n\
	var STRPADLEFT = 2 << 1;\n\
	var STRPADBOTH = 4 << 1;\n\
	function __str_pad_repeater(str, len) {\n\
		var collect = \'\', i;\n\
		while(collect.length < len) collect += str;\n\
		collect = collect.substr(0, len);\n\
		return collect;\n\
	}\n\
	function str_pad_left(str, len, sub) {\n\
		return str_pad(str, len, sub, STRPADLEFT);\n\
	}\n\
	function str_pad_right(str, len, sub) {\n\
		return str_pad(str, len, sub, STRPADRIGHT);\n\
	}\n\
	function str_pad_both(str, len, sub) {\n\
		return str_pad(str, len, sub, STRPADBOTH);\n\
	}\n\
	function str_pad(str, len, sub, type) {\n\
		if (typeof type === \'undefined\') type = STRPADRIGHT;\n\
		var half = \'\', pad_to_go;\n\
		if ((pad_to_go = len - str.length) > 0) {\n\
			if (type & STRPADLEFT) { str = __str_pad_repeater(sub, pad_to_go) + str; }\n\
			else if (type & STRPADRIGHT) {str = str + __str_pad_repeater(sub, pad_to_go); }\n\
			else if (type & STRPADBOTH) {\n\
				half = __str_pad_repeater(sub, Math.ceil(pad_to_go/2));\n\
				str = half + str + half;\n\
				str = str.substr(0, len);\n\
			}\n\
		}\n\
		return str;\n\
	}\n\
	function str_htmlescape(html) {\n\
		return html.replace(/&/g, "&amp;")\n\
		.replace(/\\</g, "&lt;")\n\
		.replace(/\\>/g, "&gt;")\n\
		.replace(/\\"/g, "&quot;");\n\
	}\n\
	function str_upfirst(str) {\n\
		return str.split(/[\\s\\n\\t]+/).map(function (item) {\n\
			return item.substr(0, 1).toUpperCase() + item.substr(1).toLowerCase();\n\
		}).join(\' \');\n\
	}\n\
	function str_camel(str) {\n\
		return str.split(/[\\s\\n\\t]+/).map(function (item, index) {\n\
			if (!index) return item;\n\
			return item.substr(0, 1).toUpperCase() + item.substr(1).toLowerCase();\n\
		}).join(\'\');\n\
	}\n\
	function str_kebab(str) {\n\
		return str.split(/[\\s\\n\\t]+/).join(\'-\');\n\
	}\n\
	function arr_values(obj) {\n\
		var values = [], i;\n\
		for(i in obj) if (Object.prototype.hasOwnProperty.call(obj, i)) values.push(obj[i]);\n\
		return values;\n\
	}\n\
	function arr_contain(obj, value) {\n\
		if(typeof obj.indexOf === \'function\') return obj.indexOf(value) !== -1;\n\
		var i;\n\
		for(i in obj) if (Object.prototype.hasOwnProperty.call(obj, i)) if (obj[i] === value) return true;\n\
		return false;\n\
	}\n\
	function arr_len(obj) {\n\
		if(typeof obj.length !== \'undefined\') return obj.length;\n\
		var i, length = 0;\n\
		for(i in obj) if (Object.prototype.hasOwnProperty.call(obj, i)) length++;\n\
		return length;\n\
	}\n\
	function arr_push(arr, value) {\n\
		arr.push(value);\n\
		return \'\';\n\
	}\n\
	function arr_unshift(arr, value) {\n\
		arr.unshift(value);\n\
		return \'\';\n\
	}\n\
	function arr_rand(arr, value) {\n\
		var keys = Object.keys(arr);\n\
		return arr[keys[parseInt(Math.random() * arr_len(arr) - 1)]];\n\
	}\n\
	function arr_splice(arr, st, en, els) {\n\
		var prms = [st];\n\
		if (typeof en !== \'undefined\') prms.push(en);\n\
		return Array.prototype.splice.apply(arr, prms.concat(els));\n\
	}\n\
	function arr_pad(src, len, el) {\n\
		var i, arr = src.slice(0);\n\
		if(len > 0) for(i = arr_len(arr);i < len;i++) arr.push(el);\n\
		if(len < 0) for(i = arr_len(arr);i < -len;i++) arr.unshift(el);\n\
		return arr;\n\
	}\n\
	function arr_reverse(src) {\n\
		var arr = src.slice(0);\n\
		arr.reverse();\n\
		return arr;\n\
	}\n\
	function arr_sort(src) {\n\
		var arr = src.slice(0);\n\
		arr.sort();\n\
		return arr;\n\
	}\n\
	function arr_sort_reverse(src) {\n\
		var arr = src.slice(0);\n\
		arr.sort();\n\
		arr.reverse();\n\
		return arr;\n\
	}\n\
	function arr_unique(src) {\n\
		var i, arr = [];\n\
		for(i in src) if (Object.prototype.hasOwnProperty.call(src, i)) if (!~arr.indexOf(src[i])) arr.push(src[i]);\n\
		return arr;\n\
	}\n\
	function arr_key(arr, value) {\n\
		var i;\n\
		for(i in arr) if (Object.prototype.hasOwnProperty.call(arr, i)) if (value == arr[i]) return i;\n\
		return -1;\n\
	}\n\
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
	var instructions = {\n\
' + instructions.filter(Boolean).join(',\n') + '\n\
	}\n\
	var templates = {\n\
' + templates.join(',\n') + '\n\
	}\n\
	var layers = {\n\
		0: createLayer()\n\
	}\n\
	var avatarTextarea = document.createElement(\'textarea\')\n\
	var avatarDiv = document.createElement(\'div\')\n\
\n\
	function createLayer() {\n\
		return {\n\
			index: 0,\n\
			state: [],\n\
			elements: {},\n\
			anchors: {},\n\
			children: {},\n\
			attributes: {},\n\
			components: {},\n\
			textCache: {}\n\
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
	function handleTextNode(layer, index, content) {\n\
		if (typeof layer.textCache[index] !== \'undefined\' && layer.textCache[index] !== content) {\n\
			remove(TEXT_NODE, layer, index)\n\
		}\n\
\n\
		if (typeof layer.textCache[index] === \'undefined\' || layer.textCache[index] !== content) {\n\
			layer.elements[index] = createElementsFromVariable(content)\n\
			layer.elements[index].forEach(function (element) { insertElement(layer, index, element) })\n\
		}\n\
\n\
		layer.textCache[index] = content\n\
	}\n\
\n\
	function createTextElement(content) {\n\
		if (String(content).indexOf(\'&\') === -1) {\n\
			return document.createTextNode(content)\n\
		}\n\
\n\
		avatarTextarea.innerHTML = content\n\
\n\
		return document.createTextNode(avatarTextarea.value)\n\
	}\n\
\n\
	function createElementsFromVariable(content) {\n\
		content = String(content)\n\
\n\
		if (content.indexOf(\'<\') !== -1 || content.indexOf(\'&\') !== -1) {\n\
			avatarDiv.innerHTML = content\n\
\n\
			return Array.prototype.slice.call(avatarDiv.childNodes, 0, avatarDiv.childNodes.length)\n\
		}\n\
\n\
		return [createTextElement(content)]\n\
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
	function insert(type, layer, index, data) {\n\
		switch (type) {\n\
			case ARRAY: \n\
			case EXECUTE:\n\
			case COMPONENT:\n\
			case TEXT_NODE:\n\
				return instructions[index](layer,data)\n\
			default:\n\
				layer.elements[index] = instructions[index](layer, data)\n\
				layer.elements[index].forEach(function (element) { insertElement(layer, index, element) })\n\
		}\n\
	}\n\
\n\
	function remove(type, layer, index) {\n\
		switch (type) {\n\
			case ARRAY: \n\
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
				break\n\
			case TEXT_NODE:\n\
				delete layer.textCache[index]\n\
			default:\n\
				layer.elements[index].forEach(removeElement)\n\
				delete layer.elements[index]\n\
\n\
				if (type === COMPONENT) {\n\
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
			insert(dynamicNodes[construction], layer, construction, data)\n\
		} else if (construction > layer.state[layer.index]) {\n\
			remove(dynamicNodes[layer.state[layer.index]], layer, layer.state[layer.index])\n\
			layer.state.splice(layer.index, 1)\n\
			layer.index--\n\
			handleTemplate(construction, layer, data)\n\
		} else if (typeof dynamicNodes[construction] !== \'undefined\') {\n\
			insert(dynamicNodes[construction], layer, construction, data)\n\
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
		} else {\n\
			state = data\n\
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
