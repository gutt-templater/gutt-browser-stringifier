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

function handleDefaultTag(node, template, layer, ctx) {
  if (typeof ctx.tags[layer] === 'undefined') {
    ctx.tags[layer] = -1
    ctx.dynamicAttributes[layer] = {}
  }

  var index = ++ctx.tags[layer]
  var staticAttributes = []

  node.attrs.forEach(function (attr) {
    if (attr.name.type === 'string') {
      if (attr.value === null) {
        staticAttributes.push(
          templates.createObjectItem(
            handleNode(attr.name, template, layer, ctx),
            '""'
          )
        )
      } else if (attr.value.type === 'string') {
        staticAttributes.push(
          templates.createObjectItem(
            handleNode(attr.name, template, layer, ctx),
            handleNode(attr.value, template, layer, ctx)
          )
        )
      } else {
        if (typeof ctx.dynamicAttributes[layer][index] === 'undefined') {
          ctx.dynamicAttributes[layer][index] = []
        }

        ctx.dynamicAttributes[layer][index].push(
          templates.createObjectItem(
            handleNode(attr.name, template, layer, ctx),
            handleNode(attr.value, template, layer, ctx)
          )
        )
      }
    }
  })

  var hasDynamicAttributes = typeof ctx.dynamicAttributes[layer][index] !== 'undefined' && ctx.dynamicAttributes[layer][index].length > 0

  if (hasDynamicAttributes) {
    var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
    var instruction = templates.handleAttributes(
      layer,
      index,
      ctx.dynamicAttributes[layer][index].join(',\n')
    )

    if (ctx.dynamicNodes[ctx.index] === 'EXECUTE') {
      ctx.executeInstructions[ctx.index] += '\n' + instruction
    } else {
      var nextLayer = ++ctx.index

      ctx.executeInstructions[nextLayer] = instruction
      ctx.dynamicNodes[nextLayer] = 'EXECUTE'
      ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')
    }
  }

  return templates.createElement(
    node.name,
    staticAttributes,
    walk(node.firstChild, template, layer, ctx),
    layer,
    index
  )
}

function logicNodeHandler(node, template, layer, ctx) {
  var nextLayer = ++ctx.index

  if (node.expr.type === 'var' && node.expr.value === 'children') {
    return 'layer.anchors[' + nextLayer + '] = childrenAnchor'
  } else {
    ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')
    ctx.textInstructions[nextLayer] =
      templates.handleTextNode(nextLayer, logicHandler(node, ctx))
    ctx.dynamicNodes[nextLayer] = 'TEXT_NODE'
  }

  return templates.createAnchor(nextLayer)
}

function handleComponent(node, template, layer, ctx) {
  var nextLayer = ++ctx.index
  var params = []
  var children
  var childrenLayer = ++ctx.index

  node.attrs.forEach(function (attr) {
    params.push(templates.createObjectItem(
      handleNode(attr.name, template, nextLayer, ctx),
      handleNode(attr.value, template, nextLayer, ctx)
    ))
  })

  ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')
  ctx.componentInstuctions[nextLayer] = templates.componentInstuction(
    nextLayer,
    node.name,
    params.join(','),
    ctx.params.type === 'module',
    childrenLayer
  )
  ctx.dynamicNodes[nextLayer] = 'COMPONENT'

  if (node.firstChild) {
    ctx.templates[template] += templates.chainStatePush(childrenLayer, ctx.params.type === 'module')
    ctx.createInstructions[childrenLayer] = templates.createInstriction(
      walk(node.firstChild, template, layer, ctx),
      childrenLayer
    )
  }

  return templates.createAnchor(nextLayer)
}

function handleImportStatement(node, template, layer, ctx) {
  var params = extractValuesFromAttrs(node.attrs, ['name', 'from'])

  if (ctx.params.type === 'module') {
    params.from.value += '.js'
  }

  ctx.imports[params.name.value] = handleNode(params.from, template, layer, ctx)

  return ''
}

function handleUseStateStatement(node, template, layer, ctx) {
  var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
  var name = handleNode(params.name, template, layer, ctx)
  var instruction = (
    typeof params.value !== 'undefined'
      ? 'if (typeof state[\'' + params.name.expr.value + '\'] === \'undefined\') ' +
        logicHandler(params.name, ctx, true) + ' = ' + handleNode(params.value, template, layer, ctx) + '; else '
      : ''
    ) +
    logicHandler(params.name, ctx, true) + ' = state[\'' + params.name.expr.value + '\']'

  if (ctx.dynamicNodes[ctx.index] === 'EXECUTE') {
    ctx.executeInstructions[ctx.index] += '\n' + instruction
  } else {
    var nextLayer = ++ctx.index

    ctx.executeInstructions[nextLayer] = instruction
    ctx.dynamicNodes[nextLayer] = 'EXECUTE'
    ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')
  }

  return ''
}

function handleVariableStatement(node, template, layer, ctx) {
  var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
  var instruction = logicHandler(params.name, ctx, true) + ' = ' + handleNode(params.value, template, layer, ctx)

  if (ctx.dynamicNodes[ctx.index] === 'EXECUTE') {
    ctx.executeInstructions[ctx.index] += '\n' + instruction
  } else {
    var nextLayer = ++ctx.index

    ctx.executeInstructions[nextLayer] = instruction
    ctx.dynamicNodes[nextLayer] = 'EXECUTE'
    ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')
  }

  return ''
}

function handleParamStatement(node, template, layer, ctx) {
  var nextLayer = ++ctx.index
  var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
  var name = handleNode(params.name, template, layer, ctx)

  ctx.executeInstructions[nextLayer] = 'if (typeof ' + logicHandler(params.name, ctx) + ' === \'undefined\') ' +
    logicHandler(params.name, ctx, true) + ' = ' + handleNode(params.value, template, layer, ctx) + '; else ' +
    logicHandler(params.name, ctx, true) + ' = ' + name

  ctx.dynamicNodes[nextLayer] = 'EXECUTE'
  ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')

  return ''
}

function handleSwitchStatement(node, template, layer, ctx) {
  return walk(node.firstChild, template, layer, ctx)
}

function handleCaseStatement(node, template, layer, ctx) {
  if (node.firstChild) {
    var params = extractValuesFromAttrs(node.attrs, ['test'])
    var nextLayer = ++ctx.index

    ctx.templates[template] += (node.previousSibling ? 'else ' : '') + 'if (' + logicHandler(params.test, ctx) + ') {\n' +
      templates.chainStatePush(nextLayer, ctx.params.type === 'module')

    handleTemplate(node.firstChild, template, nextLayer, ctx)

    ctx.templates[template] += '}\n'
    ctx.index++

    return templates.createAnchor(nextLayer)
  }
}

function handleDefaultStatement(node, template, layer, ctx) {
  if (node.firstChild) {
    var nextLayer = ++ctx.index

    ctx.templates[template] += 'else {\n' +
      templates.chainStatePush(nextLayer, ctx.params.type === 'module')

    handleTemplate(node.firstChild, template, nextLayer, ctx)

    ctx.templates[template] += '}\n'
    ctx.index++

    return templates.createAnchor(nextLayer)
  }
}

function handleIfStatement(node, template, layer, ctx) {
  if (node.firstChild) {
    var params = extractValuesFromAttrs(node.attrs, ['test'])
    var nextLayer = ++ctx.index

    ctx.templates[template] += 'if (' + logicHandler(params.test, ctx) + ') {\n' +
      templates.chainStatePush(nextLayer, ctx.params.type === 'module')

    handleTemplate(node.firstChild, template, nextLayer, ctx)

    ctx.templates[template] += '}\n'
    ctx.index++

    return templates.createAnchor(nextLayer)
  }

  return ''
}

function handleForEachStatement(node, template, layer, ctx) {
  var nextLayer = ++ctx.index
  var params = extractValuesFromAttrs(node.attrs, ['item', 'from', 'key'])

  ctx.arrayInstructions[nextLayer] = templates.handleArray(
    nextLayer,
    logicHandler(params.from, ctx),
    logicHandler(params.item, ctx, true),
    ctx.params.type === 'module',
    typeof params.key !== 'undefined' ? logicHandler(params.key, ctx, true) + ' = field' : ''
  )
  ctx.dynamicNodes[nextLayer] = 'ARRAY'

  if (node.firstChild) {
    ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')

    handleTemplate(node.firstChild, ++ctx.index, ctx.index, ctx)
  }

  return templates.createAnchor(nextLayer)
}

function handleAttributeStatement(node, template, layer, ctx) {
  var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
  var index = ctx.tags[layer]

  console.log(node.name)
  if (!ctx.dynamicAttributes[layer]) {
    console.log(ctx.dynamicAttributes, layer)
    console.log(ctx.tags)
  }

  if (typeof ctx.dynamicAttributes[layer][index] === 'undefined') {
    ctx.dynamicAttributes[layer][index] = []
  }

  ctx.dynamicAttributes[layer][index].push(
    templates.createObjectItem(
      handleNode(params.name, template, layer, ctx),
      handleNode(params.value, template, layer, ctx)
    )
  )

  return ''
}

function scriptNodeHandler(node, template, layer, ctx) {
  var nextLayer = ++ctx.index

  if (typeof ctx.tags[layer] === 'undefined') {
    ctx.tags[layer] = -1
    ctx.dynamicAttributes[layer] = {}
  }

  var index = ++ctx.tags[layer]
  var staticAttributes = []

  node.attrs.forEach(function (attr) {
    if (attr.name.type === 'string') {
      if (attr.value === null) {
        staticAttributes.push(
          templates.createObjectItem(
            handleNode(attr.name, template, layer, ctx),
            '""'
          )
        )
      } else if (attr.value.type === 'string') {
        staticAttributes.push(
          templates.createObjectItem(
            handleNode(attr.name, template, layer, ctx),
            handleNode(attr.value, template, layer, ctx)
          )
        )
      } else {
        if (typeof ctx.dynamicAttributes[layer][index] === 'undefined') {
          ctx.dynamicAttributes[layer][index] = []
        }

        ctx.dynamicAttributes[layer][index].push(
          templates.createObjectItem(
            handleNode(attr.name, template, layer, ctx),
            handleNode(attr.value, template, layer, ctx)
          )
        )
      }
    }
  })

  var hasDynamicAttributes = typeof ctx.dynamicAttributes[layer][index] !== 'undefined' && ctx.dynamicAttributes[layer][index].length > 0

  if (hasDynamicAttributes) {
    var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
    var instruction = templates.handleAttributes(
      layer,
      index,
      ctx.dynamicAttributes[layer][index].join(',\n')
    )

    if (ctx.dynamicNodes[ctx.index] === 'EXECUTE') {
      ctx.executeInstructions[ctx.index] += '\n' + instruction
    } else {
      var nextLayer = ++ctx.index

      ctx.executeInstructions[nextLayer] = instruction
      ctx.dynamicNodes[nextLayer] = 'EXECUTE'
      ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')
    }
  }

  ctx.createInstructions[nextLayer] = templates.createScript(
    staticAttributes,
    escapeString(node.body.str),
    nextLayer
  )
  ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')

  return templates.createAnchor(nextLayer)
}

function styleNodeHandler(node, template, layer, ctx) {
  var nextLayer = ++ctx.index

  if (typeof ctx.tags[layer] === 'undefined') {
    ctx.tags[layer] = -1
    ctx.dynamicAttributes[layer] = {}
  }

  var index = ++ctx.tags[layer]
  var staticAttributes = []

  node.attrs.forEach(function (attr) {
    if (attr.name.type === 'string') {
      if (attr.value === null) {
        staticAttributes.push(
          templates.createObjectItem(
            handleNode(attr.name, template, layer, ctx),
            '""'
          )
        )
      } else if (attr.value.type === 'string') {
        staticAttributes.push(
          templates.createObjectItem(
            handleNode(attr.name, template, layer, ctx),
            handleNode(attr.value, template, layer, ctx)
          )
        )
      } else {
        if (typeof ctx.dynamicAttributes[layer][index] === 'undefined') {
          ctx.dynamicAttributes[layer][index] = []
        }

        ctx.dynamicAttributes[layer][index].push(
          templates.createObjectItem(
            handleNode(attr.name, template, layer, ctx),
            handleNode(attr.value, template, layer, ctx)
          )
        )
      }
    }
  })

  var hasDynamicAttributes = typeof ctx.dynamicAttributes[layer][index] !== 'undefined' && ctx.dynamicAttributes[layer][index].length > 0

  if (hasDynamicAttributes) {
    var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
    var instruction = templates.handleAttributes(
      layer,
      index,
      ctx.dynamicAttributes[layer][index].join(',\n')
    )

    if (ctx.dynamicNodes[ctx.index] === 'EXECUTE') {
      ctx.executeInstructions[ctx.index] += '\n' + instruction
    } else {
      var nextLayer = ++ctx.index

      ctx.executeInstructions[nextLayer] = instruction
      ctx.dynamicNodes[nextLayer] = 'EXECUTE'
      ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')
    }
  }

  ctx.createInstructions[nextLayer] = templates.createStyle(
    staticAttributes,
    escapeString(node.body.str),
    nextLayer
  )
  ctx.templates[template] += templates.chainStatePush(nextLayer, ctx.params.type === 'module')

  return templates.createAnchor(nextLayer)
}

function escapeString(text) {
  return text.replace(/\n/g, '\\n').replace(/\'/g, '\\\'')
}

function handleText(node) {
  return '\'' + escapeString(node.text) + '\''
}

function handleString(node) {
  return '"' + node.value + '"'
}

function handleTag(node, template, layer, ctx) {
  switch (node.name) {
    case 'inline-svg':
    case 'template':
      return ''
    case 'import':
      return handleImportStatement(node, template, layer, ctx)
    case 'use-state':
      return handleUseStateStatement(node, template, layer, ctx)
    case 'param':
      return handleParamStatement(node, template, layer, ctx)
    case 'variable':
      return handleVariableStatement(node, template, layer, ctx)
    case 'switch':
      return handleSwitchStatement(node, template, layer, ctx)
    case 'case':
      return handleCaseStatement(node, template, layer, ctx)
    case 'default':
      return handleDefaultStatement(node, template, layer, ctx)
    case 'attribute':
      return handleAttributeStatement(node, template, layer, ctx)
    case 'for-each':
      return handleForEachStatement(node, template, layer, ctx)
    case 'if':
      return handleIfStatement(node, template, layer, ctx)

    default:
      if (typeof ctx.imports[node.name] !== 'undefined') {
        return handleComponent(node, template, layer, ctx)
      }

      return handleDefaultTag(node, template, layer, ctx)
  }
}

function handleNode(node, template, layer, ctx) {
  switch (node.type) {
    case 'logic':
      return logicHandler(node, ctx)
    case 'text':
      return handleText(node)
    case 'string':
      return handleString(node)
    case 'tag':
      return handleTag(node, template, layer, ctx)
    case 'logic-node':
      return logicNodeHandler(node, template, layer, ctx)
    case 'script':
      return scriptNodeHandler(node, template, layer, ctx)
    case 'style':
      return styleNodeHandler(node, template, layer, ctx)
    default:
      return ''
  }
}

function handleTemplate(node, template, layer, ctx) {
  if (!ctx.templates[template]) {
    ctx.templates[template] = templates.chainStatePush(layer, ctx.params.type === 'module')
  }

  ctx.createInstructions[layer] = templates.createInstriction(walk(node, template, layer, ctx), layer)
}

function walk(node, template, layer, ctx) {
  var result = []

  while (node) {
    result.push(handleNode(node, template, layer, ctx))

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
      params: params
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