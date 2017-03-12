/* global Promise */

var path = require('path')
var fs = require('fs')
var parser = require('gutt')
var stringifier = require('../../index')
var writeFile = require('./write-file')
var generateName = require('./generate-name')

var tmpFilesDirPath = path.resolve(__dirname, '../../tmp')

function runTemplate (templatePath, params) {
  if (!params) {
    params = {}
  }

  return new Promise(function (resolve) {
    var template = require(path.resolve(tmpFilesDirPath, templatePath))

    resolve(template(params))
  })
}

function parseAndWriteFile (test, tmpFileName) {
  var resultFile

  try {
    fs.accessSync(tmpFilesDirPath, fs.F_OK)
  } catch (e) {
    fs.mkdir(tmpFilesDirPath)
  }

  resultFile = parser.parse(test).stringifyWith(stringifier)

  return writeFile(path.resolve(tmpFilesDirPath, tmpFileName), resultFile)
}

function parse (test, data) {
  var tmpFileName = generateName() + '.js'

  if (!data) {
    data = {}
  }

  return parseAndWriteFile(test, tmpFileName)
    .then(function () {
      return runTemplate(path.basename(tmpFileName, path.extname(tmpFileName)), data)
    })
}

module.exports = {
  parse: parse,
  parseAndWriteFile: parseAndWriteFile,
  runTemplate: runTemplate
}
