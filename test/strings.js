/* globals describe, it */

var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var parse = require('./helpers/parse').parse

chai.use(chaiAsPromised)
chai.should()

describe ('JS string functions', function () {
  it ('str with no params', function () {
    return parse('<component>{ str(11/3) }</component>').should.eventually.deep.equal(['3'])
  })

  it ('str with one param', function () {
    return parse('<component>{ str(11/3, 2) }</component>').should.eventually.deep.equal(['3.66'])
  })

  it ('str with nulls after coma', function () {
    return parse('<component>{ str(12/3, 2) }</component>').should.eventually.deep.equal(['4.00'])
  })

  it ('str with two params', function () {
    return parse('<component>{ str(11/3, 3, \',\') }</component>')
      .should.eventually.deep.equal(['3,666'])
  })

  it ('str_sub with one param', function () {
    return parse('<component>{ str_sub(\'string\', 2) }</component>')
      .should.eventually.deep.equal(['ring'])
  })

  it ('str_sub with two param', function () {
    return parse('<component>{ str_sub(\'string\', 2, 2) }</component>')
      .should.eventually.deep.equal(['ri'])
  })

  it ('str_sub with negative second param', function () {
    return parse('<component>{ str_sub(\'string\', 2, -2) }</component>')
      .should.eventually.deep.equal(['ri'])
  })

  it ('str_len for not empty string', function () {
    return parse('<component>{ str_len(\'string\') }</component>')
      .should.eventually.deep.equal([6])
  })

  it ('str_len for empty string', function () {
    return parse('<component>{ str_len(\'\') }')
      .should.eventually.deep.equal([0])
  })

  it ('str_replace symbol to another symbol', function () {
    return parse('<component>{ str_replace(\'replace all symbols\', \'l\', \'1\') }</component>')
      .should.eventually.deep.equal(['rep1ace a11 symbo1s'])
  })

  it ('str_replace symbol to empty string', function () {
    return parse('<component>{ str_replace(\'replace all symbols\', \'l\', \'\') }</component>')
      .should.eventually.deep.equal(['repace a symbos'])
  })

  it ('str_pad for right side', function () {
    return parse('<component>{ str_pad(\'string\', 10, \'~\') }</component>')
      .should.eventually.deep.equal(['string~~~~'])
  })

  it ('str_pad for right side with param', function () {
    return parse('<component>{ str_pad(\'string\', 10, \'~\', STRPADRIGHT) }</component>')
      .should.eventually.deep.equal(['string~~~~'])
  })

  it ('str_pad for left side', function () {
    return parse('<component>{ str_pad(\'string\', 10, \'~\', STRPADLEFT) }</component>')
      .should.eventually.deep.equal(['~~~~string'])
  })

  it ('str_pad for both sides', function () {
    return parse('<component>{ str_pad(\'string\', 10, \'~\', STRPADBOTH) }</component>')
      .should.eventually.deep.equal(['~~string~~'])
  })

  it ('str_pad with string longer than length param', function () {
    return parse('<component>{ str_pad(\'accessabillity\', 10, \'~\', STRPADBOTH) }</component>')
      .should.eventually.deep.equal(['accessabillity'])
  })

  it ('str_split returns array with origin string', function () {
    var template =
      '<component>' +
      '<variable name={arr} value={str_split(\'string\', \'wrong splitter\') } />' +
      '<for-each item={letter} from={arr}>' +
      '{ letter },' +
      '</for-each>' +
      '</component>'
    var result = [
      'string',
      ','
    ]

    return parse(template).should.eventually.deep.equal(result)
  })

  it ('str_split with empty splitter, returns array of letter', function () {
    var template =
      '<component>' +
      '<variable name={arr} value={str_split(\'string\', \'\') } />' +
      '<for-each item={letter} from={arr}>' +
      '{ letter },' +
      '</for-each>' +
      '</component>'
    var result = [
      's',
      ',',
      't',
      ',',
      'r',
      ',',
      'i',
      ',',
      'n',
      ',',
      'g',
      ','
    ]

    return parse(template).should.eventually.deep.equal(result)
  })

  it ('str_split with not empty splitter, returns array of substrings', function () {
    var template =
      '<component>' +
      '<variable name={arr} value={str_split(\'London is The Capital of Greate Britan\', \' \') } />' +
      '<for-each item={letter} from={arr}>' +
      '{ letter }-' +
      '</for-each>' +
      '</component>'
    var result = [
      'London',
      '-',
      'is',
      '-',
      'The',
      '-',
      'Capital',
      '-',
      'of',
      '-',
      'Greate',
      '-',
      'Britan',
      '-'
    ]

    return parse(template).should.eventually.deep.equal(result)
  })

  it ('str_pos returns negative', function () {
    return parse('<component>{ str_pos(\'accessabillity\', \'~\') }</component>')
      .should.eventually.deep.equal([-1])
  })

  it ('str_pos returns zero', function () {
    return parse('<component>{ str_pos(\'accessabillity\', \'a\') }</component>')
      .should.eventually.deep.equal([0])
  })

  it ('str_pos returns positive', function () {
    return parse('<component>{ str_pos(\'accessabillity\', \'llity\') }</component>')
      .should.eventually.deep.equal([9])
  })

  it ('str_lower', function () {
    return parse('<component>{ str_lower(\'aCCeSSaBiLLiTy\') }</component>')
      .should.eventually.deep.equal(['accessabillity'])
  })

  it ('str_upper', function () {
    return parse('<component>{ str_upper(\'aCCeSSaBiLLiTy\') }</component>')
      .should.eventually.deep.equal(['ACCESSABILLITY'])
  })

  it ('str_upfirst', function () {
    return parse('<component>{ str_upfirst(\'first  second # third\') }</component>')
      .should.eventually.deep.equal(['First Second # Third'])
  })

  it ('str_camel', function () {
    return parse('<component>{ str_camel(\'first  second # third\') }</component>')
      .should.eventually.deep.equal(['firstSecond#Third'])
  })

  it ('str_kebab', function () {
    return parse('<component>{ str_kebab(\'first  second # third\') }</component>')
      .should.eventually.deep.equal(['first-second-#-third'])
  })

  it ('str_trim', function () {
    return parse('<component>{ str_trim(\'  \\n  \\t  first  second # third  \\n  \\t  \') }</component>')
      .should.eventually.deep.equal(['first  second # third'])
  })

  it ('str_ltrim', function () {
    return parse('<component>{ str_ltrim(\'  \\n  \\t  first  second # third  \\n  \\t  \') }</component>')
      .should.eventually.deep.equal(['first  second # third  \n  \t  '])
  })

  it ('str_rtrim', function () {
    return parse('<component>{ str_rtrim(\'  \\n  \\t  first  second # third  \\n  \\t  \') }</component>')
      .should.eventually.deep.equal(['  \n  \t  first  second # third'])
  })

  it ('str_htmlescape', function () {
    return parse('<component>{ str_htmlescape(\'<html lang="en">text</html>\') }</component>')
      .should.eventually.deep.equal(['&lt;html lang=&quot;en&quot;&gt;text&lt;/html&gt;'])
  })

  it ('str_urlencode', function () {
    return parse('<component>{ str_urlencode(\'http://localhost:8080/index.html?param=value&param=value\') }</component>')
      .should.eventually.deep.equal(['http%3A%2F%2Flocalhost%3A8080%2Findex.html%3Fparam%3Dvalue%26param%3Dvalue'])
  })

  it ('str_urldecode', function () {
    return parse('<component>{ str_urldecode(\'http%3A%2F%2Flocalhost%3A8080%2Findex.html%3Fparam%3Dvalue%26param%3Dvalue\') }</component>')
      .should.eventually.deep.equal(['http://localhost:8080/index.html?param=value&param=value'])
  })
})
