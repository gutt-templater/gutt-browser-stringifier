const main = async function (mountNode) {
	var MKARR_OPEN = 2 << 1;
	var MKARR_CLOSE = 1 << 1;
	function mkArr(start, end, flag) {
		var arr = [], i;
		if (flag & MKARR_OPEN) {
			if (start <= end) {
				for (i = start; i < end; i++) {
					arr.push(i);
				}
			} else {
				for (i = start; i > end; i--) {
					arr.push(i);
				}
			}
		} else if (flag & MKARR_CLOSE) {
			if (start <= end) {
				for (i = start; i <= end; i++) {
					arr.push(i);
				}
			} else {
				for (i = start; i >= end; i--) {
					arr.push(i);
				}
			}
		}
		return arr;
	}
	function str(str, len, sprtr) {
		if (!len) len = 0;
		if (typeof str.toString === 'function') str = str.toString();
		if (!sprtr) sprtr = '.';
		if (~str.indexOf('.')) {
			if (len > 0) {
				str = str.substr(0, str.indexOf('.') + len + 1);
			} else {
				str = str.substr(0, str.indexOf('.') + len);
			}
		} else {
			str = str_pad(str + '.', str.length + 1 + len, '0');
		}
		return str.replace('.', sprtr);
	}
	function str_replace(str, src, rep) {
		while (~str.indexOf(src)) {
			str = str.replace(src, rep);
		}
		return str;
	}
	var STRPADRIGHT = 1 << 1;
	var STRPADLEFT = 2 << 1;
	var STRPADBOTH = 4 << 1;
	var booleanAttributes = [
		'autofocus',
		'autoplay',
		'async',
		'checked',
		'defer',
		'disabled',
		'hidden',
		'loop',
		'multiple',
		'muted',
		'nomodule',
		'open',
		'preload',
		'required',
		'selected'
	]
	function __str_pad_repeater(str, len) {
		var collect = '', i;
		while(collect.length < len) collect += str;
		collect = collect.substr(0, len);
		return collect;
	}
	function str_pad_left(str, len, sub) {
		return str_pad(str, len, sub, STRPADLEFT);
	}
	function str_pad_right(str, len, sub) {
		return str_pad(str, len, sub, STRPADRIGHT);
	}
	function str_pad_both(str, len, sub) {
		return str_pad(str, len, sub, STRPADBOTH);
	}
	function str_pad(str, len, sub, type) {
		if (typeof type === 'undefined') type = STRPADRIGHT;
		var half = '', pad_to_go;
		if ((pad_to_go = len - str.length) > 0) {
			if (type & STRPADLEFT) { str = __str_pad_repeater(sub, pad_to_go) + str; }
			else if (type & STRPADRIGHT) {str = str + __str_pad_repeater(sub, pad_to_go); }
			else if (type & STRPADBOTH) {
				half = __str_pad_repeater(sub, Math.ceil(pad_to_go/2));
				str = half + str + half;
				str = str.substr(0, len);
			}
		}
		return str;
	}
	function str_htmlescape(html) {
		return html.replace(/&/g, "&amp;")
		.replace(/\</g, "&lt;")
		.replace(/\>/g, "&gt;")
		.replace(/\"/g, "&quot;");
	}
	function str_upfirst(str) {
		return str.split(/[\s\n\t]+/).map(function (item) {
			return item.substr(0, 1).toUpperCase() + item.substr(1).toLowerCase();
		}).join(' ');
	}
	function str_camel(str) {
		return str.split(/[\s\n\t]+/).map(function (item, index) {
			if (!index) return item;
			return item.substr(0, 1).toUpperCase() + item.substr(1).toLowerCase();
		}).join('');
	}
	function str_kebab(str) {
		return str.split(/[\s\n\t]+/).join('-');
	}
	function arr_values(obj) {
		var values = [], i;
		for(i in obj) if (Object.prototype.hasOwnProperty.call(obj, i)) values.push(obj[i]);
		return values;
	}
	function arr_contain(obj, value) {
		if(typeof obj.indexOf === 'function') return obj.indexOf(value) !== -1;
		var i;
		for(i in obj) if (Object.prototype.hasOwnProperty.call(obj, i)) if (obj[i] === value) return true;
		return false;
	}
	function arr_len(obj) {
		if(typeof obj.length !== 'undefined') return obj.length;
		var i, length = 0;
		for(i in obj) if (Object.prototype.hasOwnProperty.call(obj, i)) length++;
		return length;
	}
	function arr_push(arr, value) {
		arr.push(value);
		return '';
	}
	function arr_unshift(arr, value) {
		arr.unshift(value);
		return '';
	}
	function arr_rand(arr, value) {
		var keys = Object.keys(arr);
		return arr[keys[parseInt(Math.random() * arr_len(arr) - 1)]];
	}
	function arr_splice(arr, st, en, els) {
		var prms = [st];
		if (typeof en !== 'undefined') prms.push(en);
		return Array.prototype.splice.apply(arr, prms.concat(els));
	}
	function arr_pad(src, len, el) {
		var i, arr = src.slice(0);
		if(len > 0) for(i = arr_len(arr);i < len;i++) arr.push(el);
		if(len < 0) for(i = arr_len(arr);i < -len;i++) arr.unshift(el);
		return arr;
	}
	function arr_reverse(src) {
		var arr = src.slice(0);
		arr.reverse();
		return arr;
	}
	function arr_sort(src) {
		var arr = src.slice(0);
		arr.sort();
		return arr;
	}
	function arr_sort_reverse(src) {
		var arr = src.slice(0);
		arr.sort();
		arr.reverse();
		return arr;
	}
	function arr_unique(src) {
		var i, arr = [];
		for(i in src) if (Object.prototype.hasOwnProperty.call(src, i)) if (!~arr.indexOf(src[i])) arr.push(src[i]);
		return arr;
	}
	function arr_key(arr, value) {
		var i;
		for(i in arr) if (Object.prototype.hasOwnProperty.call(arr, i)) if (value == arr[i]) return i;
		return -1;
	}
	var scope = {}
	var state = {}
	var childrenAnchor
	var lookahead
	var ATTRIBUTES = 1
	var TEXT_NODE = 2
	var ARRAY = 4
	var EXECUTE = 8
	var COMPONENT = 16
	var rootElements = []
	var imports = {
'x-input': import("../input/input.gutt.js")
	}
	var dynamicNodes = {
1: EXECUTE,
2: COMPONENT
	}
	var layers = {
		0: createLayer()
	}

	if (arguments.length === 2) {
		state = arguments[1]
	} else if (arguments.length > 2) {
		layers[0].anchors[0] = arguments[1]
		scope = arguments[2]
		state = arguments[3]
		lookahead = arguments[4]
		childrenAnchor = arguments[5]
	}

	var instructions = {
0: async function (layer) {
	layer.elements[0] = await createNodes([
'\n\n',
['form', {"data-component": "fast-search"}, [
[layer, 2]
,
'\n'
], layer, 0, 0]
], layer.lookahead[0][0])
	insertLayerElements(layer, 0)
},
1: function (layer) {
				if (typeof scope['placeholder'] === 'undefined') scope['placeholder'] = ""; else scope['placeholder'] = scope['placeholder']
			},
2: async function (layer) {
				var anchor = createAnchor(layer, 3)
			layer.lookahead[3] = layer.lookahead[2]
var initialScope = {"type": "search","value": "","name": "search","placeholder": scope['placeholder']}

		if (typeof layer.components[2] === 'undefined') {
			var result =await  imports['x-input'](layer.anchors[2].parentNode, layer.anchors[2], initialScope, state, layer.lookahead[2][0], anchor) 
			layer.components[2] = result.setState
			layer.elements[2] = result.elements
		} else {
			layer.elements[2] = layer.components[2](initialScope, state)
			
		}
			}
	}
	var templates = {
0: async function (layer) {
	layer.index = -1
await handleTemplate(0, layer)
await handleTemplate(1, layer)
await handleTemplate(2, layer)

	await handleTail(layer)
}
	}
	var avatarTextarea = document.createElement('textarea')
	var avatarDiv = document.createElement('div')
	var copy = Function.prototype.call.bind(Array.prototype.slice)

	function createLayer() {
		return {
			index: 0,
			state: [],
			elements: {},
			lookahead: {},
			anchors: {},
			children: {},
			attributes: {},
			components: {},
			textCache: {}
		}
	}

	async function forEach(data, callback) {
		var field

		for (field in data) {
			if (data.hasOwnProperty(field)) {
				await callback(data[field], field)
			}
		}
	}

	function indexOf(items, item, usedIndexes) {
		var i

		for (i = 0; i < items.length; i++) {
			if (items[i] === item && usedIndexes.indexOf(i) === -1) {
				return i
			}
		}

		return -1
	}

	function handleArray(parentLayer, layerIndex, iterator) {
		var index = 0, layer, preservedIndex, nextSibling, moveElement
		var usedIndexes = []
		var unusedIndexes = []
		var children = createChildren(parentLayer, layerIndex)

		iterator(async function (field, item) {
			preservedIndex = indexOf(children.items, item, usedIndexes)

			if (preservedIndex === -1) {
				layer = createLayer()

				var anchor = createAnchor(layer, layerIndex + 1)

				if (index < children.items.length) {
					nextSibling = children.layers[index].elements[layerIndex + 1]

					if (typeof nextSibling === 'undefined') {
						nextSibling = children.layers[index].anchors[layerIndex + 1]
					} else if (nextSibling instanceof Array) {
						nextSibling = nextSibling[0]
					}

					insertBefore(nextSibling.parentNode, anchor, nextSibling)
				} else {
					nextSibling = parentLayer.anchors[layerIndex]
					insertBefore(nextSibling.parentNode, anchor, nextSibling)
				}

				children.layers.splice(index, 0, layer)
				children.items.splice(index, 0, item)
				usedIndexes.push(index)
				layer.lookahead[layerIndex + 1] = { 0: parentLayer.lookahead[layerIndex][0] }

				await templates[layerIndex + 1](layer)
			} else {
				if (preservedIndex !== index) {
					nextSibling = children.layers[index].anchors[layerIndex + 1]
					moveElement = children.layers[preservedIndex].anchors[layerIndex + 1]
					insertBefore(nextSibling.parentNode, moveElement, nextSibling)

					moveElement = children.layers[preservedIndex].elements[layerIndex + 1]

					if (typeof moveElement !== 'undefined') {
						moveElement.forEach(function (element) { insertBefore(nextSibling.parentNode, element, nextSibling) })
					}

					children.items.splice(index, 0, children.items.splice(preservedIndex, 1)[0])
					children.layers.splice(index, 0, children.layers.splice(preservedIndex, 1)[0])
				}

				usedIndexes.push(index)
				await templates[layerIndex + 1](children.layers[index])
			}

			index++
		})

		usedIndexes.sort(function (a, b) { return a - b })

		for (index = 0; index < usedIndexes.length; index++) {
			if (usedIndexes[index] !== index) {
				usedIndexes.splice(index, 0, index)
				unusedIndexes.push(index)
			}
		}

		for (; index < children.items.length; index++) {
			unusedIndexes.push(index)
		}

		for (index = unusedIndexes.length - 1; index >= 0; index--) {
			removeArrayLayer(children.layers[unusedIndexes[index]])
			children.layers.splice(unusedIndexes[index], 1)
			children.items.splice(unusedIndexes[index], 1)
		}
	}

	function removeArrayLayer(layer) {
		var childrenIndex, layerIndex, elementIndex

		forEach(layer.children, function (children, childrenIndex) {
			forEach(children.layers, function (layerIndex, layer) {
				removeArrayLayer(layer)
			})
		})
		forEach(layer.anchors, removeElement)
		forEach(layer.elements, function (element, elementIndex) {
			remove(dynamicNodes[layer.state[layer.index]], layer, elementIndex)
		})
	}

	function createChildren(layer, index) {
		if (typeof layer.children[index] === 'undefined') {
			layer.children[index] = {
				layers: [],
				items: []
			}
		}

		return layer.children[index]
	}

	function findLookaheadNode(lookahead, child) {
		var index
		var lookaheadNode
		var childType = typeof child === 'string'
			? 3
			: child.length == 2
				? 8
				: 1

		for (index = 0; index < lookahead.length; index++) {
			lookaheadNode = lookahead[index]

			if (lookaheadNode.nodeType !== 1 && lookaheadNode.nodeType !== 3) {
				lookahead.splice(index, 1)
				index--
				continue
			}

			if (
				childType === lookaheadNode.nodeType &&
				(childType !== 1 || lookaheadNode.nodeName.toLowerCase() === child[0])
			) {
				lookahead.splice(index, 1)

				return lookaheadNode
			} else {
				continue
			}
		}

		return null
	}

	async function createNodes(children, lookahead) {
		var nodes = []
		var index
		var child
		var lookaheadNode

		for (index = 0; index < children.length; index++) {
			child = children[index]
			lookaheadNode = findLookaheadNode(lookahead, child)

	    	if (typeof child === 'string') {
	    		nodes.push(createTextElement(child, lookaheadNode))
	    	} else if (child.nodeType && child.nodeType === 8) {
	    		nodes.push(child)
	    	} else if (child.length == 2) {
	    		nodes.push(createAnchor.apply(null, child))
	    		child[0].lookahead[child[1]] = { 0: lookahead }
	    	} else if (child[0] !== '!DOCTYPE') {
	    		var element = await createElement(child, lookaheadNode)
	    		nodes.push(element)
	    	}
		}

		return nodes
	}

	async function createElement(child, lookaheadNode) {
		var nodeType = child[0]
		var attributes = child[1]
		var children = child[2]
		var layer = child[3]
		var layerIndex = child[4]
		var index = child[5]
		var element = lookaheadNode || document.createElement(nodeType)
		var nextSibling
		var nodes

		applyAttributes(element, attributes)

		if (typeof layer.attributes[layerIndex] === 'undefined') {
			layer.attributes[layerIndex] = {}
		}

		layer.attributes[layerIndex][index] = {
			cache: {},
			element: element
		}

		nextSibling = element.firstChild
		nodes = await createNodes(children, layer.lookahead[layerIndex][index + 1] = copy(element.childNodes))
		nodes.forEach(function (child) {
			if (!child.parentNode) {
				if (nextSibling) {
					element.insertBefore(child, nextSibling)
				} else {
					element.appendChild(child)
				}
			} else {
				nextSibling = child.nextSibling
			}
		})

		return element
	}

	function createTextElement(content, lookaheadNode) {
		var value = content

		if (String(content).indexOf('&') !== -1) {
			avatarTextarea.innerHTML = content
			value = avatarTextarea.value
		}

		if (lookaheadNode !== null) {
			lookaheadNode.nodeValue = value

			return lookaheadNode
		}

		return document.createTextNode(value)
	}

	function createAnchor(layer, index) {
		var anchor = document.createComment(index)

		layer.anchors[index] = anchor

		return anchor
	}

	function applyAttributes(element, attributes) {
		forEach(attributes, function (value, attribute) {
			element.setAttribute(attribute, value)
		})
	}

	function handleAttributes(layerAttributes, attributes) {
		forEach(attributes, function (value, attribute) {
			if (booleanAttributes.indexOf(attribute) !== -1) {
				layerAttributes.element[attribute] = value
			} else {
				layerAttributes.element.setAttribute(attribute, value)
			}

			layerAttributes.cache[attribute] = true
		})

		forEach(layerAttributes.cache, function (value, attribute) {
			if (typeof attributes[attribute] === 'undefined') {
				layerAttributes.element.removeAttribute(attribute)
				delete attributes[attribute]
			}
		})
	}

	function handleTextNode(layer, index, content) {
		if (typeof layer.textCache[index] !== 'undefined' && layer.textCache[index] !== content) {
			remove(TEXT_NODE, layer, index)
		}

		if (typeof layer.textCache[index] === 'undefined' || layer.textCache[index] !== content) {
			layer.elements[index] = createElementsFromContent(String(content))
			insertLayerElements(layer, index)
			layer.textCache[index] = content
		}
	}

	function createElementsFromContent(content) {
		if (content.indexOf('<') !== -1 || content.indexOf('&') !== -1) {
			avatarDiv.innerHTML = content

			return copy(avatarDiv.childNodes)
		}

		return [createTextElement(content, null)]
	}

	function insertLayerElements(layer, index) {
		var previousSibling = layer.anchors[index]

		layer.elements[index].forEach(function (element) {
			if (!element.parentNode || element.parentNode !== document || previousSibling && element.previousSibling !== previousSibling) {
				insertAfter(element, previousSibling)
			}

			if (element.parentNode && element.parentNode !== document) {
				previousSibling = element
			}
		})
	}

	function insertElement(layer, index, element) {
		if (layer.anchors[index]) {
			insertBefore(layer.anchors[index].parentNode, element, layer.anchors[index])
		} else {
			mountNode.appendChild(element)

			if (rootElements.indexOf(element) === -1) {
				rootElements.push(element)
			}
		}
	}

	function insertAfter(element, anchor) {
		var parent = mountNode

		if (anchor) {
			parent = anchor.parentNode
		} else if (rootElements.indexOf(element) === -1) {
			rootElements.push(element)
		}

		if (anchor && anchor.nextSibling) {
			insertBefore(parent, element, anchor.nextSibling)
		} else if (parent !== document || element.nodeType === 8)  {
			parent.appendChild(element)
		}
	}

	function insertBefore(parent, element, anchorRef) {
		if (parent !== document || element.nodeType !== 3) parent.insertBefore(element, anchorRef)

		if (parent === mountNode && rootElements.indexOf(element) === -1) {
			rootElements.push(element)
		}
	}

	function removeElement(element) {
		if (element.parentNode !== null) {
			element.parentNode.removeChild(element)
		}
	}

	function remove(type, layer, index) {
		switch (type) {
			case ARRAY: 
				var layerIndex, elementIndex, element 

				forEach(layer.children[index].layers, function (sublayer) {
					forEach(layer.elements, removeElement)
				})

				delete layer.children[index]
				break
			case EXECUTE:
				break
			case TEXT_NODE:
				delete layer.textCache[index]
			default:
				layer.elements[index].forEach(removeElement)
				delete layer.elements[index]

				if (type === COMPONENT) {
					delete layer.components[index]
				}
		}
	}

	async function handleTemplate(instructionIndex, layer) {
		layer.index++

		if (layer.index >= layer.state.length || instructionIndex < layer.state[layer.index]) {
			layer.state.splice(layer.index, 0, instructionIndex)
			await instructions[instructionIndex](layer)
		} else if (instructionIndex > layer.state[layer.index]) {
			remove(dynamicNodes[layer.state[layer.index]], layer, layer.state[layer.index])
			layer.state.splice(layer.index, 1)
			layer.index--
			handleTemplate(instructionIndex, layer)
		} else if (typeof dynamicNodes[instructionIndex] !== 'undefined') {
			instructions[instructionIndex](layer)
		}

	}

	function handleTail(layer) {
		layer.index++

		for (; layer.index < layer.state.length;) {
			remove(dynamicNodes[layer.state[layer.index]], layer, layer.state[layer.index])
			layer.state.splice(layer.index, 1)
		}
	}

	async function removeLookahead(layer) {
		await forEach(layer.lookahead, async function (lookaheads) {
			await forEach(lookaheads, async function (localLookahead) {
				if (lookahead !== localLookahead) {
					await forEach(localLookahead, removeElement)

					localLookahead.splice(0, localLookahead.length)
				}
			})
		})

		await forEach(layer.children, async function (children) {
			await forEach(children.layers, removeLookahead)
		})
	}

	if (typeof templates[0] !== 'undefined' && typeof layers[0] !== 'undefined') {
		var componentNames = Object.keys(imports)
		var modules = await Promise.all(Object.values(imports))

		imports = modules.map(function (module) { return module.default })
			.reduce(function (result, module, index) {
				result[componentNames[index]] = module
				return result
			}, {})
		
		layers[0].lookahead[0] = { 0: lookahead ? lookahead : copy(mountNode.childNodes) }
		await templates[0](layers[0])
		removeLookahead(layers[0])
	}

	function setState(data) {
		if (arguments.length === 2) {
			scope = data
			state = arguments[1]
		} else {
			scope = {}
			state = data
		}

		if (typeof templates[0] !== 'undefined' && typeof layers[0] !== 'undefined') {
			templates[0](layers[0])
		}

		return rootElements
	}

	if (arguments.length === 2) {
		return setState
	} else {
		return { setState: setState, elements: rootElements }
	}
}
export default main