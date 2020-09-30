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

  var children = walk(node.firstChild, template, layer, ctx)
  var hasDynamicAttributes = typeof ctx.dynamicAttributes[layer][index] !== 'undefined' && ctx.dynamicAttributes[layer][index].length > 0

  if (hasDynamicAttributes) {
    var nextLayer = ++ctx.index
    var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])

    ctx.templates[template] += templates.chainStatePush(nextLayer)
    ctx.executeInstructions[nextLayer] = templates.handleAttributes(
      layer,
      index,
      ctx.dynamicAttributes[layer][index].join(',\n')
    )
    ctx.dynamicNodes[nextLayer] = 'EXECUTE'
  }

  return templates.createElement(
    node.name,
    staticAttributes.join(', '),
    children,
    hasDynamicAttributes,
    layer,
    index
  )
}

function logicNodeHandler(node, template, layer, ctx) {
  var nextLayer = ++ctx.index

  if (node.expr.type === 'var' && node.expr.value === 'children') {
    return 'layer.anchors[' + nextLayer + '] = childrenAnchor'
  } else {
    ctx.templates[template] += templates.chainStatePush(nextLayer)
    ctx.createInstructions[nextLayer] =
      templates.createElementsFromVariable(logicHandler(node, ctx))
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

  ctx.templates[template] += templates.chainStatePush(nextLayer)
  ctx.componentInstuctions[nextLayer] = templates.componentInstuction(nextLayer, node.name, params.join(','), childrenLayer)
  ctx.dynamicNodes[nextLayer] = 'COMPONENT'

  if (node.firstChild) {
    ctx.templates[template] += templates.chainStatePush(childrenLayer)
    ctx.createInstructions[childrenLayer] = '[' + walk(node.firstChild, template, layer, ctx) + ']'
  }

  return templates.createAnchor(nextLayer)
}

function handleImportStatement(node, template, layer, ctx) {
  var params = extractValuesFromAttrs(node.attrs, ['name', 'from'])

  ctx.imports[params.name.value] = handleNode(params.from, template, layer, ctx)

  return ''
}

function handleUseStateStatement(node, template, layer, ctx) {
  var nextLayer = ++ctx.index
  var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
  var name = handleNode(params.name, template, layer, ctx)

  ctx.executeInstructions[nextLayer] = 'if (typeof state[\'' + params.name.expr.value + '\'] === \'undefined\') ' +
    logicHandler(params.name, ctx, true) + ' = ' + handleNode(params.value, template, layer, ctx) + '; else ' +
    logicHandler(params.name, ctx, true) + ' = state[\'' + params.name.expr.value + '\']'

  ctx.dynamicNodes[nextLayer] = 'EXECUTE'
  ctx.templates[template] += templates.chainStatePush(nextLayer)

  return ''
}

function handleVariableStatement(node, template, layer, ctx) {
  var nextLayer = ++ctx.index
  var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])

  ctx.executeInstructions[nextLayer] = logicHandler(params.name, ctx, true) + ' = ' + handleNode(params.value, template, layer, ctx)
  ctx.dynamicNodes[nextLayer] = 'EXECUTE'
  ctx.templates[template] += templates.chainStatePush(nextLayer)

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
  ctx.templates[template] += templates.chainStatePush(nextLayer)

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
      templates.chainStatePush(nextLayer)

    handleTemplate(node.firstChild, template, nextLayer, ctx)

    ctx.templates[template] += '}\n'

    return templates.createAnchor(nextLayer)
  }
}

function handleDefaultStatement(node, template, layer, ctx) {
  if (node.firstChild) {
    var nextLayer = ++ctx.index

    ctx.templates[template] += 'else {\n' +
      templates.chainStatePush(nextLayer)

    handleTemplate(node.firstChild, template, nextLayer, ctx)

    ctx.templates[template] += '}\n'

    return templates.createAnchor(nextLayer)
  }
}

function handleIfStatement(node, template, layer, ctx) {
  if (node.firstChild) {
    var params = extractValuesFromAttrs(node.attrs, ['test'])
    var nextLayer = ++ctx.index

    ctx.templates[template] += 'if (' + logicHandler(params.test, ctx) + ') {\n' +
      templates.chainStatePush(nextLayer)

    handleTemplate(node.firstChild, template, nextLayer, ctx)

    ctx.templates[template] += '}\n'

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
    typeof params.key !== 'undefined' ? logicHandler(params.key, ctx, true) + ' = field' : ''
  )
  ctx.dynamicNodes[nextLayer] = 'ARRAY'

  if (node.firstChild) {
    ctx.templates[template] += templates.chainStatePush(nextLayer)

    handleTemplate(node.firstChild, ++ctx.index, ctx.index, ctx)
  }

  return templates.createAnchor(nextLayer)
}

function handleAttributeStatement(node, template, layer, ctx) {
  var params = extractValuesFromAttrs(node.attrs, ['name', 'value'])
  var index = ctx.tags[layer]

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

function escapeString(text) {
  return text.replace(/\n/g, '\\n').replace(/\'/g, '\\\'')
}

function handleText(node) {
  return 'createTextElement(\'' + escapeString(node.text) + '\')'
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
    default:
      return ''
  }
}

function handleTemplate(node, template, layer, ctx) {
  if (!ctx.templates[template]) {
    ctx.templates[template] = templates.chainStatePush(layer)
  }

  ctx.createInstructions[layer] = '[\n' + walk(node, template, layer, ctx) + '\n]'
}

function walk(node, template, layer, ctx) {
  var result = []

  while (node) {
    result.push(handleNode(node, template, layer, ctx))

    node = node.nextSibling
  }

  return result.filter(Boolean).join(',\n')
}

module.exports = function (ast, source, filepath) {
  var ctx = {
    createInstructions: {},
    templates: {},
    arrayInstructions: {},
    dynamicNodes: {},
    dynamicAttributes: {},
    executeInstructions: {},
    imports: {},
    componentInstuctions: {},
    tags: {},
    filepath: filepath,
    stack: [],
    index: 0
  }

  handleTemplate(ast.result, 0, 0, ctx)

  return boilerplate(ctx)
}
