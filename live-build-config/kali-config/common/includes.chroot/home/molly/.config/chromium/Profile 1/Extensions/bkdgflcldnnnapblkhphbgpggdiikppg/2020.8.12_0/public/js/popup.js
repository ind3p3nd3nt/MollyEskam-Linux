(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var document = require('global/document')
var hyperx = require('hyperx')
var onload = require('on-load')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = {
  autofocus: 1,
  checked: 1,
  defaultchecked: 1,
  disabled: 1,
  formnovalidate: 1,
  indeterminate: 1,
  readonly: 1,
  required: 1,
  selected: 1,
  willvalidate: 1
}
var COMMENT_TAG = '!--'
var SVG_TAGS = [
  'svg',
  'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
  'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB',
  'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
  'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'font', 'font-face',
  'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri',
  'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image', 'line',
  'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // If adding onload events
  if (props.onload || props.onunload) {
    var load = props.onload || function () {}
    var unload = props.onunload || function () {}
    onload(el, function belOnload () {
      load(el)
    }, function belOnunload () {
      unload(el)
    },
    // We have to use non-standard `caller` to find who invokes `belCreateElement`
    belCreateElement.caller.caller.caller)
    delete props.onload
    delete props.onunload
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS[key]) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  function appendChild (childs) {
    if (!Array.isArray(childs)) return
    for (var i = 0; i < childs.length; i++) {
      var node = childs[i]
      if (Array.isArray(node)) {
        appendChild(node)
        continue
      }

      if (typeof node === 'number' ||
        typeof node === 'boolean' ||
        typeof node === 'function' ||
        node instanceof Date ||
        node instanceof RegExp) {
        node = node.toString()
      }

      if (typeof node === 'string') {
        if (el.lastChild && el.lastChild.nodeName === '#text') {
          el.lastChild.nodeValue += node
          continue
        }
        node = document.createTextNode(node)
      }

      if (node && node.nodeType) {
        el.appendChild(node)
      }
    }
  }
  appendChild(children)

  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement

},{"global/document":7,"hyperx":11,"on-load":21}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
var upperCase = require('upper-case')
var noCase = require('no-case')

/**
 * Camel case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale, mergeNumbers) {
  var result = noCase(value, locale)

  // Replace periods between numeric entities with an underscore.
  if (!mergeNumbers) {
    result = result.replace(/ (?=\d)/g, '_')
  }

  // Replace spaces between words with an upper cased character.
  return result.replace(/ (.)/g, function (m, $1) {
    return upperCase($1, locale)
  })
}

},{"no-case":17,"upper-case":30}],4:[function(require,module,exports){
exports.no = exports.noCase = require('no-case')
exports.dot = exports.dotCase = require('dot-case')
exports.swap = exports.swapCase = require('swap-case')
exports.path = exports.pathCase = require('path-case')
exports.upper = exports.upperCase = require('upper-case')
exports.lower = exports.lowerCase = require('lower-case')
exports.camel = exports.camelCase = require('camel-case')
exports.snake = exports.snakeCase = require('snake-case')
exports.title = exports.titleCase = require('title-case')
exports.param = exports.paramCase = require('param-case')
exports.header = exports.headerCase = require('header-case')
exports.pascal = exports.pascalCase = require('pascal-case')
exports.constant = exports.constantCase = require('constant-case')
exports.sentence = exports.sentenceCase = require('sentence-case')
exports.isUpper = exports.isUpperCase = require('is-upper-case')
exports.isLower = exports.isLowerCase = require('is-lower-case')
exports.ucFirst = exports.upperCaseFirst = require('upper-case-first')
exports.lcFirst = exports.lowerCaseFirst = require('lower-case-first')

},{"camel-case":3,"constant-case":5,"dot-case":6,"header-case":9,"is-lower-case":12,"is-upper-case":13,"lower-case":15,"lower-case-first":14,"no-case":17,"param-case":22,"pascal-case":23,"path-case":24,"sentence-case":25,"snake-case":26,"swap-case":27,"title-case":28,"upper-case":30,"upper-case-first":29}],5:[function(require,module,exports){
var upperCase = require('upper-case')
var snakeCase = require('snake-case')

/**
 * Constant case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return upperCase(snakeCase(value, locale), locale)
}

},{"snake-case":26,"upper-case":30}],6:[function(require,module,exports){
var noCase = require('no-case')

/**
 * Dot case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '.')
}

},{"no-case":17}],7:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

var doccy;

if (typeof document !== 'undefined') {
    doccy = document;
} else {
    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }
}

module.exports = doccy;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":2}],8:[function(require,module,exports){
(function (global){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
var noCase = require('no-case')
var upperCase = require('upper-case')

/**
 * Header case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '-').replace(/^.|-./g, function (m) {
    return upperCase(m, locale)
  })
}

},{"no-case":17,"upper-case":30}],10:[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],11:[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12
var COMMENT = 13

module.exports = function (h, opts) {
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }
  if (opts.attrToProp !== false) {
    h = attrToProp(h)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        if (xstate === OPEN) {
          if (reg === '/') {
            p.push([ OPEN, '/', arg ])
            reg = ''
          } else {
            p.push([ OPEN, arg ])
          }
        } else {
          p.push([ VAR, xstate, arg ])
        }
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else parts[i][1]==="" || (cur[1][key] = concat(cur[1][key], parts[i][1]));
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2]));
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            if (parts[i][0] === CLOSE) {
              i--
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state) && state !== COMMENT) {
          if (state === OPEN && reg.length) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
          if (opts.comments) {
            res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)],[CLOSE])
          }
          reg = ''
          state = TEXT
        } else if (state === OPEN && /^!--$/.test(reg)) {
          if (opts.comments) {
            res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
          }
          reg = c
          state = COMMENT
        } else if (state === TEXT || state === COMMENT) {
          reg += c
        } else if (state === OPEN && c === '/' && reg.length) {
          // no-op, self closing tag without a space <br/>
        } else if (state === OPEN && /\s/.test(c)) {
          if (reg.length) {
            res.push([OPEN, reg])
          }
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var hasOwn = Object.prototype.hasOwnProperty
function has (obj, key) { return hasOwn.call(obj, key) }

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr', '!--',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":10}],12:[function(require,module,exports){
var lowerCase = require('lower-case')

/**
 * Check if a string is lower case.
 *
 * @param  {String}  string
 * @param  {String}  [locale]
 * @return {Boolean}
 */
module.exports = function (string, locale) {
  return lowerCase(string, locale) === string
}

},{"lower-case":15}],13:[function(require,module,exports){
var upperCase = require('upper-case')

/**
 * Check if a string is upper case.
 *
 * @param  {String}  string
 * @param  {String}  [locale]
 * @return {Boolean}
 */
module.exports = function (string, locale) {
  return upperCase(string, locale) === string
}

},{"upper-case":30}],14:[function(require,module,exports){
var lowerCase = require('lower-case')

/**
 * Lower case the first character of a string.
 *
 * @param  {String} str
 * @return {String}
 */
module.exports = function (str, locale) {
  if (str == null) {
    return ''
  }

  str = String(str)

  return lowerCase(str.charAt(0), locale) + str.substr(1)
}

},{"lower-case":15}],15:[function(require,module,exports){
/**
 * Special language-specific overrides.
 *
 * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
 *
 * @type {Object}
 */
var LANGUAGES = {
  tr: {
    regexp: /\u0130|\u0049|\u0049\u0307/g,
    map: {
      '\u0130': '\u0069',
      '\u0049': '\u0131',
      '\u0049\u0307': '\u0069'
    }
  },
  az: {
    regexp: /[\u0130]/g,
    map: {
      '\u0130': '\u0069',
      '\u0049': '\u0131',
      '\u0049\u0307': '\u0069'
    }
  },
  lt: {
    regexp: /[\u0049\u004A\u012E\u00CC\u00CD\u0128]/g,
    map: {
      '\u0049': '\u0069\u0307',
      '\u004A': '\u006A\u0307',
      '\u012E': '\u012F\u0307',
      '\u00CC': '\u0069\u0307\u0300',
      '\u00CD': '\u0069\u0307\u0301',
      '\u0128': '\u0069\u0307\u0303'
    }
  }
}

/**
 * Lowercase a string.
 *
 * @param  {String} str
 * @return {String}
 */
module.exports = function (str, locale) {
  var lang = LANGUAGES[locale]

  str = str == null ? '' : String(str)

  if (lang) {
    str = str.replace(lang.regexp, function (m) { return lang.map[m] })
  }

  return str.toLowerCase()
}

},{}],16:[function(require,module,exports){
assert.notEqual = notEqual
assert.notOk = notOk
assert.equal = equal
assert.ok = assert

module.exports = assert

function equal (a, b, m) {
  assert(a == b, m) // eslint-disable-line eqeqeq
}

function notEqual (a, b, m) {
  assert(a != b, m) // eslint-disable-line eqeqeq
}

function notOk (t, m) {
  assert(!t, m)
}

function assert (t, m) {
  if (!t) throw new Error(m || 'AssertionError')
}

},{}],17:[function(require,module,exports){
var lowerCase = require('lower-case')

var NON_WORD_REGEXP = require('./vendor/non-word-regexp')
var CAMEL_CASE_REGEXP = require('./vendor/camel-case-regexp')
var CAMEL_CASE_UPPER_REGEXP = require('./vendor/camel-case-upper-regexp')

/**
 * Sentence case a string.
 *
 * @param  {string} str
 * @param  {string} locale
 * @param  {string} replacement
 * @return {string}
 */
module.exports = function (str, locale, replacement) {
  if (str == null) {
    return ''
  }

  replacement = typeof replacement !== 'string' ? ' ' : replacement

  function replace (match, index, value) {
    if (index === 0 || index === (value.length - match.length)) {
      return ''
    }

    return replacement
  }

  str = String(str)
    // Support camel case ("camelCase" -> "camel Case").
    .replace(CAMEL_CASE_REGEXP, '$1 $2')
    // Support odd camel case ("CAMELCase" -> "CAMEL Case").
    .replace(CAMEL_CASE_UPPER_REGEXP, '$1 $2')
    // Remove all non-word characters and replace with a single space.
    .replace(NON_WORD_REGEXP, replace)

  // Lower case the entire string.
  return lowerCase(str, locale)
}

},{"./vendor/camel-case-regexp":18,"./vendor/camel-case-upper-regexp":19,"./vendor/non-word-regexp":20,"lower-case":15}],18:[function(require,module,exports){
module.exports = /([a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u13F8-\u13FD\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A0-9\xB2\xB3\xB9\xBC-\xBE\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u09F4-\u09F9\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0B72-\u0B77\u0BE6-\u0BF2\u0C66-\u0C6F\u0C78-\u0C7E\u0CE6-\u0CEF\u0D66-\u0D75\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F33\u1040-\u1049\u1090-\u1099\u1369-\u137C\u16EE-\u16F0\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1946-\u194F\u19D0-\u19DA\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\u2070\u2074-\u2079\u2080-\u2089\u2150-\u2182\u2185-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3007\u3021-\u3029\u3038-\u303A\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA620-\uA629\uA6E6-\uA6EF\uA830-\uA835\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19])([A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A])/g

},{}],19:[function(require,module,exports){
module.exports = /([A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A])([A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A][a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u13F8-\u13FD\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A])/g

},{}],20:[function(require,module,exports){
module.exports = /[^A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC0-9\xB2\xB3\xB9\xBC-\xBE\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u09F4-\u09F9\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0B72-\u0B77\u0BE6-\u0BF2\u0C66-\u0C6F\u0C78-\u0C7E\u0CE6-\u0CEF\u0D66-\u0D75\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F33\u1040-\u1049\u1090-\u1099\u1369-\u137C\u16EE-\u16F0\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1946-\u194F\u19D0-\u19DA\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\u2070\u2074-\u2079\u2080-\u2089\u2150-\u2182\u2185-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3007\u3021-\u3029\u3038-\u303A\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA620-\uA629\uA6E6-\uA6EF\uA830-\uA835\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19]+/g

},{}],21:[function(require,module,exports){
/* global MutationObserver */
var document = require('global/document')
var window = require('global/window')
var assert = require('assert')
var watch = Object.create(null)
var KEY_ID = 'onloadid' + (new Date() % 9e6).toString(36)
var KEY_ATTR = 'data-' + KEY_ID
var INDEX = 0

if (window && window.MutationObserver) {
  var observer = new MutationObserver(function (mutations) {
    if (Object.keys(watch).length < 1) return
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === KEY_ATTR) {
        eachAttr(mutations[i], turnon, turnoff)
        continue
      }
      eachMutation(mutations[i].removedNodes, turnoff)
      eachMutation(mutations[i].addedNodes, turnon)
    }
  })
  if (document.body) {
    beginObserve(observer)
  } else {
    document.addEventListener('DOMContentLoaded', function (event) {
      beginObserve(observer)
    })
  }
}

function beginObserve (observer) {
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [KEY_ATTR]
  })
}

module.exports = function onload (el, on, off, caller) {
  assert(document.body, 'on-load: will not work prior to DOMContentLoaded')
  on = on || function () {}
  off = off || function () {}
  el.setAttribute(KEY_ATTR, 'o' + INDEX)
  watch['o' + INDEX] = [on, off, 0, caller || onload.caller]
  INDEX += 1
  return el
}

module.exports.KEY_ATTR = KEY_ATTR
module.exports.KEY_ID = KEY_ID

function turnon (index, el) {
  if (watch[index][0] && watch[index][2] === 0) {
    watch[index][0](el)
    watch[index][2] = 1
  }
}

function turnoff (index, el) {
  if (watch[index][1] && watch[index][2] === 1) {
    watch[index][1](el)
    watch[index][2] = 0
  }
}

function eachAttr (mutation, on, off) {
  var newValue = mutation.target.getAttribute(KEY_ATTR)
  if (sameOrigin(mutation.oldValue, newValue)) {
    watch[newValue] = watch[mutation.oldValue]
    return
  }
  if (watch[mutation.oldValue]) {
    off(mutation.oldValue, mutation.target)
  }
  if (watch[newValue]) {
    on(newValue, mutation.target)
  }
}

function sameOrigin (oldValue, newValue) {
  if (!oldValue || !newValue) return false
  return watch[oldValue][3] === watch[newValue][3]
}

function eachMutation (nodes, fn) {
  var keys = Object.keys(watch)
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && nodes[i].getAttribute && nodes[i].getAttribute(KEY_ATTR)) {
      var onloadid = nodes[i].getAttribute(KEY_ATTR)
      keys.forEach(function (k) {
        if (onloadid === k) {
          fn(k, nodes[i])
        }
      })
    }
    if (nodes[i].childNodes.length > 0) {
      eachMutation(nodes[i].childNodes, fn)
    }
  }
}

},{"assert":16,"global/document":7,"global/window":8}],22:[function(require,module,exports){
var noCase = require('no-case')

/**
 * Param case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '-')
}

},{"no-case":17}],23:[function(require,module,exports){
var camelCase = require('camel-case')
var upperCaseFirst = require('upper-case-first')

/**
 * Pascal case a string.
 *
 * @param  {string}  value
 * @param  {string}  [locale]
 * @param  {boolean} [mergeNumbers]
 * @return {string}
 */
module.exports = function (value, locale, mergeNumbers) {
  return upperCaseFirst(camelCase(value, locale, mergeNumbers), locale)
}

},{"camel-case":3,"upper-case-first":29}],24:[function(require,module,exports){
var noCase = require('no-case')

/**
 * Path case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '/')
}

},{"no-case":17}],25:[function(require,module,exports){
var noCase = require('no-case')
var upperCaseFirst = require('upper-case-first')

/**
 * Sentence case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return upperCaseFirst(noCase(value, locale), locale)
}

},{"no-case":17,"upper-case-first":29}],26:[function(require,module,exports){
var noCase = require('no-case')

/**
 * Snake case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale, '_')
}

},{"no-case":17}],27:[function(require,module,exports){
var upperCase = require('upper-case')
var lowerCase = require('lower-case')

/**
 * Swap the case of a string. Manually iterate over every character and check
 * instead of replacing certain characters for better unicode support.
 *
 * @param  {String} str
 * @param  {String} [locale]
 * @return {String}
 */
module.exports = function (str, locale) {
  if (str == null) {
    return ''
  }

  var result = ''

  for (var i = 0; i < str.length; i++) {
    var c = str[i]
    var u = upperCase(c, locale)

    result += u === c ? lowerCase(c, locale) : u
  }

  return result
}

},{"lower-case":15,"upper-case":30}],28:[function(require,module,exports){
var noCase = require('no-case')
var upperCase = require('upper-case')

/**
 * Title case a string.
 *
 * @param  {string} value
 * @param  {string} [locale]
 * @return {string}
 */
module.exports = function (value, locale) {
  return noCase(value, locale).replace(/^.| ./g, function (m) {
    return upperCase(m, locale)
  })
}

},{"no-case":17,"upper-case":30}],29:[function(require,module,exports){
var upperCase = require('upper-case')

/**
 * Upper case the first character of a string.
 *
 * @param  {String} str
 * @return {String}
 */
module.exports = function (str, locale) {
  if (str == null) {
    return ''
  }

  str = String(str)

  return upperCase(str.charAt(0), locale) + str.substr(1)
}

},{"upper-case":30}],30:[function(require,module,exports){
/**
 * Special language-specific overrides.
 *
 * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
 *
 * @type {Object}
 */
var LANGUAGES = {
  tr: {
    regexp: /[\u0069]/g,
    map: {
      '\u0069': '\u0130'
    }
  },
  az: {
    regexp: /[\u0069]/g,
    map: {
      '\u0069': '\u0130'
    }
  },
  lt: {
    regexp: /[\u0069\u006A\u012F]\u0307|\u0069\u0307[\u0300\u0301\u0303]/g,
    map: {
      '\u0069\u0307': '\u0049',
      '\u006A\u0307': '\u004A',
      '\u012F\u0307': '\u012E',
      '\u0069\u0307\u0300': '\u00CC',
      '\u0069\u0307\u0301': '\u00CD',
      '\u0069\u0307\u0303': '\u0128'
    }
  }
}

/**
 * Upper case a string.
 *
 * @param  {String} str
 * @return {String}
 */
module.exports = function (str, locale) {
  var lang = LANGUAGES[locale]

  str = str == null ? '' : String(str)

  if (lang) {
    str = str.replace(lang.regexp, function (m) { return lang.map[m] })
  }

  return str.toUpperCase()
}

},{}],31:[function(require,module,exports){
"use strict";

module.exports = {
    "entityList": "https://duckduckgo.com/contentblocking.js?l=entitylist2",
    "entityMap": "data/tracker_lists/entityMap.json",
    "displayCategories": ["Analytics", "Advertising", "Social Network"],
    "requestListenerTypes": ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"],
    "feedbackUrl": "https://duckduckgo.com/feedback.js?type=extension-feedback",
    "tosdrMessages": {
        "A": "Good",
        "B": "Mixed",
        "C": "Poor",
        "D": "Poor",
        "E": "Poor",
        "good": "Good",
        "bad": "Poor",
        "unknown": "Unknown",
        "mixed": "Mixed"
    },
    "httpsService": "https://duckduckgo.com/smarter_encryption.js",
    "httpsMessages": {
        "secure": "Encrypted Connection",
        "upgraded": "Forced Encryption",
        "none": "Unencrypted Connection"
    },
    /**
     * Major tracking networks data:
     * percent of the top 1 million sites a tracking network has been seen on.
     * see: https://webtransparency.cs.princeton.edu/webcensus/
     */
    "majorTrackingNetworks": {
        "google": 84,
        "facebook": 36,
        "twitter": 16,
        "amazon": 14,
        "appnexus": 10,
        "oracle": 10,
        "mediamath": 9,
        "oath": 9,
        "maxcdn": 7,
        "automattic": 7
    },
    /*
     * Mapping entity names to CSS class name for popup icons
     */
    "entityIconMapping": {
        "Google LLC": "google",
        "Facebook, Inc.": "facebook",
        "Twitter, Inc.": "twitter",
        "Amazon Technologies, Inc.": "amazon",
        "AppNexus, Inc.": "appnexus",
        "MediaMath, Inc.": "mediamath",
        "StackPath, LLC": "maxcdn",
        "Automattic, Inc.": "automattic",
        "Adobe Inc.": "adobe",
        "Quantcast Corporation": "quantcast",
        "The Nielsen Company": "nielsen"
    },
    "httpsDBName": "https",
    "httpsLists": [{
        "type": "upgrade bloom filter",
        "name": "httpsUpgradeBloomFilter",
        "url": "https://staticcdn.duckduckgo.com/https/https-bloom.json"
    }, {
        "type": "don\'t upgrade bloom filter",
        "name": "httpsDontUpgradeBloomFilters",
        "url": "https://staticcdn.duckduckgo.com/https/negative-https-bloom.json"
    }, {
        "type": "upgrade safelist",
        "name": "httpsUpgradeList",
        "url": "https://staticcdn.duckduckgo.com/https/negative-https-whitelist.json"
    }, {
        "type": "don\'t upgrade safelist",
        "name": "httpsDontUpgradeList",
        "url": "https://staticcdn.duckduckgo.com/https/https-whitelist.json"
    }],
    "tdsLists": [{
        "name": "surrogates",
        "url": "/data/surrogates.txt",
        "format": "text",
        "source": "local"
    }, {
        "name": "tds",
        "url": "https://staticcdn.duckduckgo.com/trackerblocking/v2.1/tds.json",
        "format": "json",
        "source": "external"
    }, {
        "name": "brokenSiteList",
        "url": "https://duckduckgo.com/contentblocking/trackers-whitelist-temporary.txt",
        "format": "text",
        "source": "external"
    }],
    "httpsErrorCodes": {
        "net::ERR_CONNECTION_REFUSED": 1,
        "net::ERR_ABORTED": 2,
        "net::ERR_SSL_PROTOCOL_ERROR": 3,
        "net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH": 4,
        "net::ERR_NAME_NOT_RESOLVED": 5,
        "NS_ERROR_CONNECTION_REFUSED": 6,
        "NS_ERROR_UNKNOWN_HOST": 7,
        "An additional policy constraint failed when validating this certificate.": 8,
        "Unable to communicate securely with peer: requested domain name does not match the server’s certificate.": 9,
        "Cannot communicate securely with peer: no common encryption algorithm(s).": 10,
        "SSL received a record that exceeded the maximum permissible length.": 11,
        "The certificate is not trusted because it is self-signed.": 12,
        "downgrade_redirect_loop": 13
    }
};

},{}],32:[function(require,module,exports){
'use strict';

var fetch = function fetch(message) {
    return new Promise(function (resolve, reject) {
        window.chrome.runtime.sendMessage(message, function (result) {
            return resolve(result);
        });
    });
};

var backgroundMessage = function backgroundMessage(thisModel) {
    // listen for messages from background and
    // // notify subscribers
    window.chrome.runtime.onMessage.addListener(function (req, sender) {
        if (sender.id !== chrome.runtime.id) return;
        if (req.whitelistChanged) thisModel.send('whitelistChanged');
        if (req.updateTabData) thisModel.send('updateTabData');
        if (req.didResetTrackersData) thisModel.send('didResetTrackersData', req.didResetTrackersData);
        if (req.closePopup) window.close();
    });
};

var getBackgroundTabData = function getBackgroundTabData() {
    return new Promise(function (resolve, reject) {
        fetch({ getCurrentTab: true }).then(function (tab) {
            if (tab) {
                fetch({ getTab: tab.id }).then(function (backgroundTabObj) {
                    resolve(backgroundTabObj);
                });
            }
        });
    });
};

var search = function search(url) {
    window.chrome.tabs.create({ url: 'https://duckduckgo.com/?q=' + url + '&bext=' + window.localStorage['os'] + 'cr' });
};

var getExtensionURL = function getExtensionURL(path) {
    return chrome.extension.getURL(path);
};

var openExtensionPage = function openExtensionPage(path) {
    window.chrome.tabs.create({ url: getExtensionURL(path) });
};

var openOptionsPage = function openOptionsPage(browser) {
    if (browser === 'moz') {
        openExtensionPage('/html/options.html');
        window.close();
    } else if (browser === 'chrome') {
        window.chrome.runtime.openOptionsPage();
    }
};

var reloadTab = function reloadTab(id) {
    window.chrome.tabs.reload(id);
};

var closePopup = function closePopup() {
    var w = window.chrome.extension.getViews({ type: 'popup' })[0];
    w.close();
};

module.exports = {
    fetch: fetch,
    reloadTab: reloadTab,
    closePopup: closePopup,
    backgroundMessage: backgroundMessage,
    getBackgroundTabData: getBackgroundTabData,
    search: search,
    openOptionsPage: openOptionsPage,
    openExtensionPage: openExtensionPage,
    getExtensionURL: getExtensionURL
};

},{}],33:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;

function Autocomplete(attrs) {
    Parent.call(this, attrs);
}

Autocomplete.prototype = window.$.extend({}, Parent.prototype, {

    modelName: 'autocomplete',

    fetchSuggestions: function fetchSuggestions(searchText) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            // TODO: ajax call here to ddg autocomplete service
            // for now we'll just mock up an async xhr query result:
            _this.suggestions = [searchText + ' world', searchText + ' united', searchText + ' famfam'];
            resolve();
        });
    }
});

module.exports = Autocomplete;

},{}],34:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

/**
 * Background messaging is done via two methods:
 *
 * 1. Passive messages from background -> backgroundMessage model -> subscribing model
 *
 *  The background sends these messages using chrome.runtime.sendMessage({'name': 'value'})
 *  The backgroundMessage model (here) receives the message and forwards the
 *  it to the global event store via model.send(msg)
 *  Other modules that are subscribed to state changes in backgroundMessage are notified
 *
 * 2. Two-way messaging using this.model.fetch() as a passthrough
 *
 *  Each model can use a fetch method to send and receive a response from the background.
 *  Ex: this.model.fetch({'name': 'value'}).then((response) => console.log(response))
 *  Listeners must be registered in the background to respond to messages with this 'name'.
 *
 *  The common fetch method is defined in base/model.es6.js
 */
function BackgroundMessage(attrs) {
    Parent.call(this, attrs);
    var thisModel = this;
    browserUIWrapper.backgroundMessage(thisModel);
}

BackgroundMessage.prototype = window.$.extend({}, Parent.prototype, {
    modelName: 'backgroundMessage'
});

module.exports = BackgroundMessage;

},{"./../base/chrome-ui-wrapper.es6.js":32}],35:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;

function HamburgerMenu(attrs) {
    attrs = attrs || {};
    attrs.tabUrl = '';
    Parent.call(this, attrs);
}

HamburgerMenu.prototype = window.$.extend({}, Parent.prototype, {
    modelName: 'hamburgerMenu'
});

module.exports = HamburgerMenu;

},{}],36:[function(require,module,exports){
'use strict';

module.exports = {
    // Fixes cases like "Amazon.com", which break the company icon
    normalizeCompanyName: function normalizeCompanyName(companyName) {
        companyName = companyName || '';
        var normalizedName = companyName.toLowerCase().replace(/\.[a-z]+$/, '');
        return normalizedName;
    }
};

},{}],37:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

function Search(attrs) {
    Parent.call(this, attrs);
}

Search.prototype = window.$.extend({}, Parent.prototype, {

    modelName: 'search',

    doSearch: function doSearch(s) {
        this.searchText = s;
        s = encodeURIComponent(s);

        console.log('doSearch() for ' + s);

        browserUIWrapper.search(s);
    }
});

module.exports = Search;

},{"./../base/chrome-ui-wrapper.es6.js":32}],38:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var normalizeCompanyName = require('./mixins/normalize-company-name.es6');

function SiteCompanyList(attrs) {
    attrs = attrs || {};
    attrs.tab = null;
    attrs.companyListMap = [];
    Parent.call(this, attrs);
}

SiteCompanyList.prototype = window.$.extend({}, Parent.prototype, normalizeCompanyName, {

    modelName: 'siteCompanyList',

    fetchAsyncData: function fetchAsyncData() {
        var _this = this;

        return new Promise(function (resolve, reject) {
            _this.fetch({ getCurrentTab: true }).then(function (tab) {
                if (tab) {
                    _this.fetch({ getTab: tab.id }).then(function (bkgTab) {
                        _this.tab = bkgTab;
                        _this.domain = _this.tab && _this.tab.site ? _this.tab.site.domain : '';
                        _this._updateCompaniesList();
                        resolve();
                    });
                } else {
                    console.debug('SiteDetails model: no tab');
                    resolve();
                }
            });
        });
    },

    _updateCompaniesList: function _updateCompaniesList() {
        var _this2 = this;

        // list of all trackers on page (whether we blocked them or not)
        this.trackers = this.tab.trackers || {};
        var companyNames = Object.keys(this.trackers);
        var unknownSameDomainCompany = null;

        // set trackerlist metadata for list display by company:
        this.companyListMap = companyNames.map(function (companyName) {
            var company = _this2.trackers[companyName];
            var urlsList = company.urls ? Object.keys(company.urls) : [];
            // Unknown same domain trackers need to be individually fetched and put
            // in the unblocked list
            if (companyName === 'unknown' && _this2.hasUnblockedTrackers(company, urlsList)) {
                unknownSameDomainCompany = _this2.createUnblockedList(company, urlsList);
            }

            // calc max using pixels instead of % to make margins easier
            // max width: 300 - (horizontal padding in css) = 260
            return {
                name: companyName,
                displayName: company.displayName || companyName,
                normalizedName: _this2.normalizeCompanyName(companyName),
                count: _this2._setCount(company, companyName, urlsList),
                urls: company.urls,
                urlsList: urlsList
            };
        }, this).sort(function (a, b) {
            return b.count - a.count;
        });

        if (unknownSameDomainCompany) {
            this.companyListMap.push(unknownSameDomainCompany);
        }
    },

    // Make ad-hoc unblocked list
    // used to cherry pick unblocked trackers from unknown companies
    // the name is the site domain, count is -2 to show the list at the bottom
    createUnblockedList: function createUnblockedList(company, urlsList) {
        var unblockedTrackers = this.spliceUnblockedTrackers(company, urlsList);
        return {
            name: this.domain,
            iconName: '', // we won't have an icon for unknown first party trackers
            count: -2,
            urls: unblockedTrackers,
            urlsList: Object.keys(unblockedTrackers)
        };
    },

    // Return an array of unblocked trackers
    // and remove those entries from the specified company
    // only needed for unknown trackers, so far
    spliceUnblockedTrackers: function spliceUnblockedTrackers(company, urlsList) {
        if (!company || !company.urls || !urlsList) return null;

        return urlsList.filter(function (url) {
            return company.urls[url].isBlocked === false;
        }).reduce(function (unblockedTrackers, url) {
            unblockedTrackers[url] = company.urls[url];

            // Update the company urls and urlsList
            delete company.urls[url];
            urlsList.splice(urlsList.indexOf(url), 1);

            return unblockedTrackers;
        }, {});
    },

    // Return true if company has unblocked trackers in the current tab
    hasUnblockedTrackers: function hasUnblockedTrackers(company, urlsList) {
        if (!company || !company.urls || !urlsList) return false;

        return urlsList.some(function (url) {
            return company.urls[url].isBlocked === false;
        });
    },

    // Determines sorting order of the company list
    _setCount: function _setCount(company, companyName, urlsList) {
        var count = company.count;
        // Unknown trackers, followed by unblocked first party,
        // should be at the bottom of the list
        if (companyName === 'unknown') {
            count = -1;
        } else if (this.hasUnblockedTrackers(company, urlsList)) {
            count = -2;
        }

        return count;
    }
});

module.exports = SiteCompanyList;

},{"./mixins/normalize-company-name.es6":36}],39:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var constants = require('../../../data/constants');
var httpsMessages = constants.httpsMessages;
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

// for now we consider tracker networks found on more than 7% of sites
// as "major"
var MAJOR_TRACKER_THRESHOLD_PCT = 7;

function Site(attrs) {
    attrs = attrs || {};
    attrs.disabled = true; // disabled by default
    attrs.tab = null;
    attrs.domain = '-';
    attrs.isWhitelisted = false;
    attrs.whitelistOptIn = false;
    attrs.isCalculatingSiteRating = true;
    attrs.siteRating = {};
    attrs.httpsState = 'none';
    attrs.httpsStatusText = '';
    attrs.trackersCount = 0; // unique trackers count
    attrs.majorTrackerNetworksCount = 0;
    attrs.totalTrackerNetworksCount = 0;
    attrs.trackerNetworks = [];
    attrs.tosdr = {};
    attrs.isaMajorTrackingNetwork = false;
    Parent.call(this, attrs);

    this.bindEvents([[this.store.subscribe, 'action:backgroundMessage', this.handleBackgroundMsg]]);
}

Site.prototype = window.$.extend({}, Parent.prototype, {

    modelName: 'site',

    getBackgroundTabData: function getBackgroundTabData() {
        var _this = this;

        return new Promise(function (resolve) {
            browserUIWrapper.getBackgroundTabData().then(function (tab) {
                if (tab) {
                    _this.set('tab', tab);
                    _this.domain = tab.site.domain;
                    _this.fetchSiteRating();
                    _this.set('tosdr', tab.site.tosdr);
                    _this.set('isaMajorTrackingNetwork', tab.site.parentPrevalence >= MAJOR_TRACKER_THRESHOLD_PCT);

                    _this.fetch({ getSetting: { name: 'tds-etag' } }).then(function (etag) {
                        return _this.set('tds', etag);
                    });
                } else {
                    console.debug('Site model: no tab');
                }

                _this.setSiteProperties();
                _this.setHttpsMessage();
                _this.update();
                resolve();
            });
        });
    },

    fetchSiteRating: function fetchSiteRating() {
        var _this2 = this;

        // console.log('[model] fetchSiteRating()')
        if (this.tab) {
            this.fetch({ getSiteGrade: this.tab.id }).then(function (rating) {
                console.log('fetchSiteRating: ', rating);
                if (rating) _this2.update({ siteRating: rating });
            });
        }
    },

    setSiteProperties: function setSiteProperties() {
        if (!this.tab) {
            this.domain = 'new tab'; // tab can be null for firefox new tabs
            this.set({ isCalculatingSiteRating: false });
        } else {
            this.isWhitelisted = this.tab.site.whitelisted;
            this.whitelistOptIn = this.tab.site.whitelistOptIn;
            if (this.tab.site.specialDomainName) {
                this.domain = this.tab.site.specialDomainName; // eg "extensions", "options", "new tab"
                this.set({ isCalculatingSiteRating: false });
            } else {
                this.set({ 'disabled': false });
            }
        }

        if (this.domain && this.domain === '-') this.set('disabled', true);
    },

    setHttpsMessage: function setHttpsMessage() {
        if (!this.tab) return;

        if (this.tab.upgradedHttps) {
            this.httpsState = 'upgraded';
        } else if (/^https/.exec(this.tab.url)) {
            this.httpsState = 'secure';
        } else {
            this.httpsState = 'none';
        }

        this.httpsStatusText = httpsMessages[this.httpsState];
    },

    handleBackgroundMsg: function handleBackgroundMsg(message) {
        var _this3 = this;

        // console.log('[model] handleBackgroundMsg()')
        if (!this.tab) return;
        if (message.action && message.action === 'updateTabData') {
            this.fetch({ getTab: this.tab.id }).then(function (backgroundTabObj) {
                _this3.tab = backgroundTabObj;
                _this3.update();
                _this3.fetchSiteRating();
            });
        }
    },

    // calls `this.set()` to trigger view re-rendering
    update: function update(ops) {
        // console.log('[model] update()')
        if (this.tab) {
            // got siteRating back from background process
            if (ops && ops.siteRating && ops.siteRating.site && ops.siteRating.enhanced) {
                var before = ops.siteRating.site.grade;
                var after = ops.siteRating.enhanced.grade;

                // we don't currently show D- grades
                if (before === 'D-') before = 'D';
                if (after === 'D-') after = 'D';

                if (before !== this.siteRating.before || after !== this.siteRating.after) {
                    var newSiteRating = {
                        cssBefore: before.replace('+', '-plus').toLowerCase(),
                        cssAfter: after.replace('+', '-plus').toLowerCase(),
                        before: before,
                        after: after
                    };

                    this.set({
                        'siteRating': newSiteRating,
                        'isCalculatingSiteRating': false
                    });
                } else if (this.isCalculatingSiteRating) {
                    // got site rating from background process
                    this.set('isCalculatingSiteRating', false);
                }
            }

            var newTrackersCount = this.getUniqueTrackersCount();
            if (newTrackersCount !== this.trackersCount) {
                this.set('trackersCount', newTrackersCount);
            }

            var newTrackersBlockedCount = this.getUniqueTrackersBlockedCount();
            if (newTrackersBlockedCount !== this.trackersBlockedCount) {
                this.set('trackersBlockedCount', newTrackersBlockedCount);
            }

            var newTrackerNetworks = this.getTrackerNetworksOnPage();
            if (this.trackerNetworks.length === 0 || newTrackerNetworks.length !== this.trackerNetworks.length) {
                this.set('trackerNetworks', newTrackerNetworks);
            }

            var newUnknownTrackersCount = this.getUnknownTrackersCount();
            var newTotalTrackerNetworksCount = newUnknownTrackersCount + newTrackerNetworks.length;
            if (newTotalTrackerNetworksCount !== this.totalTrackerNetworksCount) {
                this.set('totalTrackerNetworksCount', newTotalTrackerNetworksCount);
            }

            var newMajorTrackerNetworksCount = this.getMajorTrackerNetworksCount();
            if (newMajorTrackerNetworksCount !== this.majorTrackerNetworksCount) {
                this.set('majorTrackerNetworksCount', newMajorTrackerNetworksCount);
            }
        }
    },

    getUniqueTrackersCount: function getUniqueTrackersCount() {
        var _this4 = this;

        // console.log('[model] getUniqueTrackersCount()')
        var count = Object.keys(this.tab.trackers).reduce(function (total, name) {
            return _this4.tab.trackers[name].count + total;
        }, 0);

        return count;
    },

    getUniqueTrackersBlockedCount: function getUniqueTrackersBlockedCount() {
        var _this5 = this;

        // console.log('[model] getUniqueTrackersBlockedCount()')
        var count = Object.keys(this.tab.trackersBlocked).reduce(function (total, name) {
            var companyBlocked = _this5.tab.trackersBlocked[name];

            // Don't throw a TypeError if urls are not there
            var trackersBlocked = companyBlocked.urls ? Object.keys(companyBlocked.urls) : null;

            // Counting unique URLs instead of using the count
            // because the count refers to all requests rather than unique number of trackers
            var trackersBlockedCount = trackersBlocked ? trackersBlocked.length : 0;
            return trackersBlockedCount + total;
        }, 0);

        return count;
    },

    getUnknownTrackersCount: function getUnknownTrackersCount() {
        // console.log('[model] getUnknownTrackersCount()')
        var unknownTrackers = this.tab.trackers ? this.tab.trackers.unknown : {};

        var count = 0;
        if (unknownTrackers && unknownTrackers.urls) {
            var unknownTrackersUrls = Object.keys(unknownTrackers.urls);
            count = unknownTrackersUrls ? unknownTrackersUrls.length : 0;
        }

        return count;
    },

    getMajorTrackerNetworksCount: function getMajorTrackerNetworksCount() {
        // console.log('[model] getMajorTrackerNetworksCount()')
        // Show only blocked major trackers count, unless site is whitelisted
        var trackers = this.isWhitelisted ? this.tab.trackers : this.tab.trackersBlocked;
        var count = Object.values(trackers).reduce(function (total, t) {
            var isMajor = t.prevalence > MAJOR_TRACKER_THRESHOLD_PCT;
            total += isMajor ? 1 : 0;
            return total;
        }, 0);

        return count;
    },

    getTrackerNetworksOnPage: function getTrackerNetworksOnPage() {
        // console.log('[model] getMajorTrackerNetworksOnPage()')
        // all tracker networks found on this page/tab
        var networks = Object.keys(this.tab.trackers).map(function (t) {
            return t.toLowerCase();
        }).filter(function (t) {
            return t !== 'unknown';
        });
        return networks;
    },

    toggleWhitelist: function toggleWhitelist() {
        if (this.tab && this.tab.site) {
            this.isWhitelisted = !this.isWhitelisted;
            this.set('whitelisted', this.isWhitelisted);
            var whitelistOnOrOff = this.isWhitelisted ? 'off' : 'on';

            // fire ept.on pixel if just turned privacy protection on,
            // fire ept.off pixel if just turned privacy protection off.
            if (whitelistOnOrOff === 'on' && this.whitelistOptIn) {
                // If user reported broken site and opted to share data on site,
                // attach domain and path to ept.on pixel if they turn privacy protection back on.
                var siteUrl = this.tab.url.split('?')[0].split('#')[0];
                this.set('whitelistOptIn', false);
                this.fetch({ firePixel: ['ept', 'on', { siteUrl: encodeURIComponent(siteUrl) }] });
                this.fetch({ 'whitelistOptIn': {
                        list: 'whitelistOptIn',
                        domain: this.tab.site.domain,
                        value: false
                    }
                });
            } else {
                this.fetch({ firePixel: ['ept', whitelistOnOrOff] });
            }

            this.fetch({ 'whitelisted': {
                    list: 'whitelisted',
                    domain: this.tab.site.domain,
                    value: this.isWhitelisted
                }
            });
        }
    },

    submitBreakageForm: function submitBreakageForm(category) {
        if (!this.tab) return;

        var blockedTrackers = [];
        var surrogates = [];
        var upgradedHttps = this.tab.upgradedHttps;
        // remove params and fragments from url to avoid including sensitive data
        var siteUrl = this.tab.url.split('?')[0].split('#')[0];
        var trackerObjects = this.tab.trackersBlocked;
        var pixelParams = ['epbf', { category: category }, { siteUrl: encodeURIComponent(siteUrl) }, { upgradedHttps: upgradedHttps.toString() }, { tds: this.tds }];

        var _loop = function _loop(tracker) {
            var trackerDomains = trackerObjects[tracker].urls;
            Object.keys(trackerDomains).forEach(function (domain) {
                if (trackerDomains[domain].isBlocked) {
                    blockedTrackers.push(domain);
                    if (trackerDomains[domain].reason === 'matched rule - surrogate') {
                        surrogates.push(domain);
                    }
                }
            });
        };

        for (var tracker in trackerObjects) {
            _loop(tracker);
        }
        pixelParams.push({ blockedTrackers: blockedTrackers }, { surrogates: surrogates });
        this.fetch({ firePixel: pixelParams });

        // remember that user opted into sharing site breakage data
        // for this domain, so that we can attach domain when they
        // remove site from whitelist
        this.set('whitelistOptIn', true);
        this.fetch({ 'whitelistOptIn': {
                list: 'whitelistOptIn',
                domain: this.tab.site.domain,
                value: true
            }
        });
    }
});

module.exports = Site;

},{"../../../data/constants":31,"./../base/chrome-ui-wrapper.es6.js":32}],40:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var normalizeCompanyName = require('./mixins/normalize-company-name.es6');

function TopBlocked(attrs) {
    attrs = attrs || {};
    attrs.numCompanies = attrs.numCompanies;
    attrs.companyList = [];
    attrs.companyListMap = [];
    attrs.pctPagesWithTrackers = null;
    attrs.lastStatsResetDate = null;
    Parent.call(this, attrs);
}

TopBlocked.prototype = window.$.extend({}, Parent.prototype, normalizeCompanyName, {

    modelName: 'topBlocked',

    getTopBlocked: function getTopBlocked() {
        var _this = this;

        return new Promise(function (resolve, reject) {
            _this.fetch({ getTopBlockedByPages: _this.numCompanies }).then(function (data) {
                if (!data.totalPages || data.totalPages < 30) return resolve();
                if (!data.topBlocked || data.topBlocked.length < 1) return resolve();
                _this.companyList = data.topBlocked;
                _this.companyListMap = _this.companyList.map(function (company) {
                    return {
                        name: company.name,
                        displayName: company.displayName,
                        normalizedName: _this.normalizeCompanyName(company.name),
                        percent: company.percent,
                        // calc graph bars using pixels instead of % to
                        // make margins easier
                        // max width: 145px
                        px: Math.floor(company.percent / 100 * 145)
                    };
                });
                if (data.pctPagesWithTrackers) {
                    _this.pctPagesWithTrackers = data.pctPagesWithTrackers;

                    if (data.lastStatsResetDate) {
                        _this.lastStatsResetDate = data.lastStatsResetDate;
                    }
                }
                resolve();
            });
        });
    },

    reset: function reset(resetDate) {
        this.companyList = [];
        this.companyListMap = [];
        this.pctPagesWithTrackers = null;
        this.lastStatsResetDate = resetDate;
    }
});

module.exports = TopBlocked;

},{"./mixins/normalize-company-name.es6":36}],41:[function(require,module,exports){
'use strict';

module.exports = {
    setBrowserClassOnBodyTag: function setBrowserClassOnBodyTag() {
        window.chrome.runtime.sendMessage({ 'getBrowser': true }, function (browser) {
            var browserClass = 'is-browser--' + browser;
            window.$('html').addClass(browserClass);
            window.$('body').addClass(browserClass);
        });
    }
};

},{}],42:[function(require,module,exports){
'use strict';

module.exports = {
    setBrowserClassOnBodyTag: require('./chrome-set-browser-class.es6.js'),
    parseQueryString: require('./parse-query-string.es6.js')
};

},{"./chrome-set-browser-class.es6.js":41,"./parse-query-string.es6.js":43}],43:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

module.exports = {
    parseQueryString: function parseQueryString(qs) {
        if (typeof qs !== 'string') {
            throw new Error('tried to parse a non-string query string');
        }

        var parsed = {};

        if (qs[0] === '?') {
            qs = qs.substr(1);
        }

        var parts = qs.split('&');

        parts.forEach(function (part) {
            var _part$split = part.split('='),
                _part$split2 = _slicedToArray(_part$split, 2),
                key = _part$split2[0],
                val = _part$split2[1];

            if (key && val) {
                parsed[key] = val;
            }
        });

        return parsed;
    }
};

},{}],44:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Page;
var mixins = require('./mixins/index.es6.js');
var HamburgerMenuView = require('./../views/hamburger-menu.es6.js');
var HamburgerMenuModel = require('./../models/hamburger-menu.es6.js');
var hamburgerMenuTemplate = require('./../templates/hamburger-menu.es6.js');
var TopBlockedView = require('./../views/top-blocked-truncated.es6.js');
var TopBlockedModel = require('./../models/top-blocked.es6.js');
var topBlockedTemplate = require('./../templates/top-blocked-truncated.es6.js');
var SiteView = require('./../views/site.es6.js');
var SiteModel = require('./../models/site.es6.js');
var siteTemplate = require('./../templates/site.es6.js');
var SearchView = require('./../views/search.es6.js');
var SearchModel = require('./../models/search.es6.js');
var searchTemplate = require('./../templates/search.es6.js');
var AutocompleteView = require('./../views/autocomplete.es6.js');
var AutocompleteModel = require('./../models/autocomplete.es6.js');
var autocompleteTemplate = require('./../templates/autocomplete.es6.js');
var BackgroundMessageModel = require('./../models/background-message.es6.js');

function Trackers(ops) {
    this.$parent = window.$('#popup-container');
    Parent.call(this, ops);
}

Trackers.prototype = window.$.extend({}, Parent.prototype, mixins.setBrowserClassOnBodyTag, {

    pageName: 'popup',

    ready: function ready() {
        Parent.prototype.ready.call(this);
        this.message = new BackgroundMessageModel();
        this.setBrowserClassOnBodyTag();

        this.views.search = new SearchView({
            pageView: this,
            model: new SearchModel({ searchText: '' }),
            appendTo: this.$parent,
            template: searchTemplate
        });

        this.views.hamburgerMenu = new HamburgerMenuView({
            pageView: this,
            model: new HamburgerMenuModel(),
            appendTo: this.$parent,
            template: hamburgerMenuTemplate
        });

        this.views.site = new SiteView({
            pageView: this,
            model: new SiteModel(),
            appendTo: this.$parent,
            template: siteTemplate
        });

        this.views.topblocked = new TopBlockedView({
            pageView: this,
            model: new TopBlockedModel({ numCompanies: 3 }),
            appendTo: this.$parent,
            template: topBlockedTemplate
        });

        // TODO: hook up model query to actual ddg ac endpoint.
        // For now this is just here to demonstrate how to
        // listen to another component via model.set() +
        // store.subscribe()
        this.views.autocomplete = new AutocompleteView({
            pageView: this,
            model: new AutocompleteModel({ suggestions: [] }),
            // appendTo: this.views.search.$el,
            appendTo: null,
            template: autocompleteTemplate
        });
    }
});

// kickoff!
window.DDG = window.DDG || {};
window.DDG.page = new Trackers();

},{"./../models/autocomplete.es6.js":33,"./../models/background-message.es6.js":34,"./../models/hamburger-menu.es6.js":35,"./../models/search.es6.js":37,"./../models/site.es6.js":39,"./../models/top-blocked.es6.js":40,"./../templates/autocomplete.es6.js":45,"./../templates/hamburger-menu.es6.js":48,"./../templates/search.es6.js":50,"./../templates/site.es6.js":63,"./../templates/top-blocked-truncated.es6.js":66,"./../views/autocomplete.es6.js":69,"./../views/hamburger-menu.es6.js":72,"./../views/search.es6.js":76,"./../views/site.es6.js":77,"./../views/top-blocked-truncated.es6.js":79,"./mixins/index.es6.js":42}],45:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<ul class="js-autocomplete" style="', '">\n        ', '\n    </ul>'], ['<ul class="js-autocomplete" style="', '">\n        ', '\n    </ul>']),
    _templateObject2 = _taggedTemplateLiteral(['\n            <li><a href="javascript:void(0)">', '</a></li>'], ['\n            <li><a href="javascript:void(0)">', '</a></li>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function () {
    // TODO/REMOVE: remove marginTop style tag once this is actually hooked up
    // this is just to demo model store for now!
    //  -> this is gross, don't do this:
    var marginTop = this.model.suggestions && this.model.suggestions.length > 0 ? 'margin-top: 50px;' : '';

    return bel(_templateObject, marginTop, this.model.suggestions.map(function (suggestion) {
        return bel(_templateObject2, suggestion);
    }));
};

},{"bel":1}],46:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<div class="breakage-form js-breakage-form">\n    <div class="breakage-form__content">\n        <nav class="breakage-form__close-container">\n            <a href="javascript:void(0)" class="icon icon__close js-breakage-form-close" role="button" aria-label="Dismiss form"></a>\n        </nav>\n        <div class="form__icon--wrapper">\n            <div class="form__icon"></div>\n        </div>\n        <div class="breakage-form__element js-breakage-form-element">\n            <h2 class="breakage-form__title">Something Broken?</h2>\n            <div class="breakage-form__explanation">Submitting an anonymous broken site report helps us debug these issues and improve the extension.</div>\n            <div class="form__label__select">Describe What Happened</div>\n            <div class="form__select breakage-form__input--dropdown">\n                <select class="js-breakage-form-dropdown">\n                    <option value=\'\'>Pick your issue from the list...</option>\n                    ', '\n                    <option value=\'Other\'>Something else</option>\n                </select>\n            </div>\n            <btn class="form__submit js-breakage-form-submit btn-disabled" role="button" disabled="true">Send Report</btn>\n            <div class="breakage-form__footer">Reports sent to DuckDuckGo are 100% anonymous and only include your selection above, the URL, and a list of trackers we found on the site.</div>\n        </div>\n        <div class="breakage-form__message js-breakage-form-message is-transparent">\n            <h2 class="breakage-form__success--title">Thank You!</h2>\n            <div class="breakage-form__success--message">Your report will help improve the extension and make the experience better for other people.</div>\n        </div>\n    </div>\n</div>'], ['<div class="breakage-form js-breakage-form">\n    <div class="breakage-form__content">\n        <nav class="breakage-form__close-container">\n            <a href="javascript:void(0)" class="icon icon__close js-breakage-form-close" role="button" aria-label="Dismiss form"></a>\n        </nav>\n        <div class="form__icon--wrapper">\n            <div class="form__icon"></div>\n        </div>\n        <div class="breakage-form__element js-breakage-form-element">\n            <h2 class="breakage-form__title">Something Broken?</h2>\n            <div class="breakage-form__explanation">Submitting an anonymous broken site report helps us debug these issues and improve the extension.</div>\n            <div class="form__label__select">Describe What Happened</div>\n            <div class="form__select breakage-form__input--dropdown">\n                <select class="js-breakage-form-dropdown">\n                    <option value=\'\'>Pick your issue from the list...</option>\n                    ', '\n                    <option value=\'Other\'>Something else</option>\n                </select>\n            </div>\n            <btn class="form__submit js-breakage-form-submit btn-disabled" role="button" disabled="true">Send Report</btn>\n            <div class="breakage-form__footer">Reports sent to DuckDuckGo are 100% anonymous and only include your selection above, the URL, and a list of trackers we found on the site.</div>\n        </div>\n        <div class="breakage-form__message js-breakage-form-message is-transparent">\n            <h2 class="breakage-form__success--title">Thank You!</h2>\n            <div class="breakage-form__success--message">Your report will help improve the extension and make the experience better for other people.</div>\n        </div>\n    </div>\n</div>']),
    _templateObject2 = _taggedTemplateLiteral(['<option value=', '>', '</option>'], ['<option value=', '>', '</option>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var categories = [{ category: 'Video didn\'t play', value: 'videos' }, { category: 'Images didn\'t load', value: 'images' }, { category: 'Comments didn\'t load', value: 'comments' }, { category: 'Content is missing', value: 'content' }, { category: 'Links or buttons don\'t work', value: 'links' }, { category: 'I can\'t login', value: 'login' }, { category: 'The site asked me to disable', value: 'paywall' }];

function shuffle(arr) {
    var len = arr.length;
    var temp = void 0;
    var index = void 0;
    while (len > 0) {
        index = Math.floor(Math.random() * len);
        len--;
        temp = arr[len];
        arr[len] = arr[index];
        arr[index] = temp;
    }
    return arr;
}

module.exports = function () {
    return bel(_templateObject, shuffle(categories).map(function (item) {
        return bel(_templateObject2, item.value, item.category);
    }));
};

},{"bel":1}],47:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="sliding-subview grade-scorecard sliding-subview--has-fixed-header">\n    <div class="site-info site-info--full-height card">\n        ', '\n        ', '\n        ', '\n    </div>\n</section>'], ['<section class="sliding-subview grade-scorecard sliding-subview--has-fixed-header">\n    <div class="site-info site-info--full-height card">\n        ', '\n        ', '\n        ', '\n    </div>\n</section>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var reasons = require('./shared/grade-scorecard-reasons.es6.js');
var grades = require('./shared/grade-scorecard-grades.es6.js');
var ratingHero = require('./shared/rating-hero.es6.js');

module.exports = function () {
    return bel(_templateObject, ratingHero(this.model, { showClose: true }), reasons(this.model), grades(this.model));
};

},{"./shared/grade-scorecard-grades.es6.js":52,"./shared/grade-scorecard-reasons.es6.js":53,"./shared/rating-hero.es6.js":56,"bel":1}],48:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<nav class="hamburger-menu js-hamburger-menu is-hidden">\n    <div class="hamburger-menu__bg"></div>\n    <div class="hamburger-menu__content card padded">\n        <h2 class="menu-title border--bottom hamburger-menu__content__more-options">\n            More Options\n        </h2>\n        <nav class="pull-right hamburger-menu__close-container">\n            <a href="javascript:void(0)" class="icon icon__close js-hamburger-menu-close" role="button" aria-label="Close options"></a>\n        </nav>\n        <ul class="hamburger-menu__links padded default-list">\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-options-link">\n                    Settings\n                    <span>Manage unprotected sites and other options</span>\n                </a>\n            </li>\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-feedback-link">\n                    Send feedback\n                    <span>Got issues or suggestions? Let us know!</span>\n                </a>\n            </li>\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-broken-site-link">\n                    Report broken site\n                    <span>If a site\'s not working, please tell us.</span>\n                </a>\n            </li>\n        </ul>\n    </div>\n</nav>'], ['<nav class="hamburger-menu js-hamburger-menu is-hidden">\n    <div class="hamburger-menu__bg"></div>\n    <div class="hamburger-menu__content card padded">\n        <h2 class="menu-title border--bottom hamburger-menu__content__more-options">\n            More Options\n        </h2>\n        <nav class="pull-right hamburger-menu__close-container">\n            <a href="javascript:void(0)" class="icon icon__close js-hamburger-menu-close" role="button" aria-label="Close options"></a>\n        </nav>\n        <ul class="hamburger-menu__links padded default-list">\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-options-link">\n                    Settings\n                    <span>Manage unprotected sites and other options</span>\n                </a>\n            </li>\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-feedback-link">\n                    Send feedback\n                    <span>Got issues or suggestions? Let us know!</span>\n                </a>\n            </li>\n            <li>\n                <a href="javascript:void(0)" class="menu-title js-hamburger-menu-broken-site-link">\n                    Report broken site\n                    <span>If a site\'s not working, please tell us.</span>\n                </a>\n            </li>\n        </ul>\n    </div>\n</nav>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function () {
    return bel(_templateObject);
};

},{"bel":1}],49:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="sliding-subview sliding-subview--has-fixed-header">\n    <div class="privacy-practices site-info site-info--full-height card">\n        <div class="js-privacy-practices-hero">\n            ', '\n        </div>\n        <div class="privacy-practices__explainer padded border--bottom--inner\n            text--center">\n            Privacy practices indicate how much the personal information\n            that you share with a website is protected.\n        </div>\n        <div class="privacy-practices__details padded\n            js-privacy-practices-details">\n            ', '\n        </div>\n        <div class="privacy-practices__attrib padded text--center border--top--inner">\n            Privacy Practice results from ', '\n        </div>\n    </div>\n</section>'], ['<section class="sliding-subview sliding-subview--has-fixed-header">\n    <div class="privacy-practices site-info site-info--full-height card">\n        <div class="js-privacy-practices-hero">\n            ', '\n        </div>\n        <div class="privacy-practices__explainer padded border--bottom--inner\n            text--center">\n            Privacy practices indicate how much the personal information\n            that you share with a website is protected.\n        </div>\n        <div class="privacy-practices__details padded\n            js-privacy-practices-details">\n            ', '\n        </div>\n        <div class="privacy-practices__attrib padded text--center border--top--inner">\n            Privacy Practice results from ', '\n        </div>\n    </div>\n</section>']),
    _templateObject2 = _taggedTemplateLiteral(['<div class="text--center">\n    <h1 class="privacy-practices__details__title">\n        No Privacy Practices Found\n    </h1>\n    <div class="privacy-practices__details__msg">\n        The Privacy practices of this website have not been reviewed.\n    </div>\n</div>'], ['<div class="text--center">\n    <h1 class="privacy-practices__details__title">\n        No Privacy Practices Found\n    </h1>\n    <div class="privacy-practices__details__msg">\n        The Privacy practices of this website have not been reviewed.\n    </div>\n</div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var changeCase = require('change-case');
var hero = require('./shared/hero.es6.js');
var statusList = require('./shared/status-list.es6.js');
var constants = require('../../../data/constants');
var crossplatformLink = require('./shared/crossplatform-link.es6.js');

module.exports = function () {
    var domain = this.model && this.model.domain;
    var tosdr = this.model && this.model.tosdr;

    var tosdrMsg = tosdr && tosdr.message || constants.tosdrMessages.unknown;
    var tosdrStatus = tosdrMsg.toLowerCase();

    return bel(_templateObject, hero({
        status: tosdrStatus,
        title: domain,
        subtitle: tosdrMsg + ' Privacy Practices',
        showClose: true
    }), tosdr && tosdr.reasons ? renderDetails(tosdr.reasons) : renderNoDetails(), crossplatformLink('https://tosdr.org/', {
        className: 'bold',
        target: '_blank',
        text: 'ToS;DR',
        attributes: {
            'aria-label': 'Terms of Service; Didn\'t Read'
        }
    }));
};

function renderDetails(reasons) {
    var good = reasons.good || [];
    var bad = reasons.bad || [];

    if (!good.length && !bad.length) return renderNoDetails();

    // convert arrays to work for the statusList template,
    // which use objects

    good = good.map(function (item) {
        return {
            msg: changeCase.upperCaseFirst(item),
            modifier: 'good'
        };
    });

    bad = bad.map(function (item) {
        return {
            msg: changeCase.upperCaseFirst(item),
            modifier: 'bad'
        };
    });

    // list good first, then bad
    return statusList(good.concat(bad));
}

function renderNoDetails() {
    return bel(_templateObject2);
}

},{"../../../data/constants":31,"./shared/crossplatform-link.es6.js":51,"./shared/hero.es6.js":55,"./shared/status-list.es6.js":58,"bel":1,"change-case":4}],50:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section>\n    <form class="sliding-subview__header search-form js-search-form" name="x">\n        <input type="text" autocomplete="off" placeholder="Search DuckDuckGo"\n            name="q" class="search-form__input js-search-input"\n            value="', '" />\n        <input class="search-form__go js-search-go" value="" type="submit" aria-label="Search" />\n        ', '\n    </form>\n</section>'], ['<section>\n    <form class="sliding-subview__header search-form js-search-form" name="x">\n        <input type="text" autocomplete="off" placeholder="Search DuckDuckGo"\n            name="q" class="search-form__input js-search-input"\n            value="', '" />\n        <input class="search-form__go js-search-go" value="" type="submit" aria-label="Search" />\n        ', '\n    </form>\n</section>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var hamburgerButton = require('./shared/hamburger-button.es6.js');

module.exports = function () {
    return bel(_templateObject, this.model.searchText, hamburgerButton('js-search-hamburger-button'));
};

},{"./shared/hamburger-button.es6.js":54,"bel":1}],51:[function(require,module,exports){
'use strict';

/* Generates a link that will work on both webextensions and safari
 * url: href url
 * options: any a tag attribute
 */
module.exports = function (url, options) {
    var a = document.createElement('a');
    a.href = url;

    // attributes for the <a> tag, e.g. "aria-label"
    if (options.attributes) {
        for (var attr in options.attributes) {
            a.setAttribute(attr, options.attributes[attr]);
        }

        delete options.attributes;
    }

    for (var key in options) {
        a[key] = options[key];
    }

    if (window.safari) {
        // safari can't use _blank target so we'll add a click handler
        if (a.target === '_blank') {
            a.removeAttribute('target');
            a.href = 'javascript:void(0)';
            a.onclick = function () {
                window.safari.application.activeBrowserWindow.openTab().url = url;
                window.safari.self.hide();
            };
        }
    }

    return a;
};

},{}],52:[function(require,module,exports){
'use strict';

var statusList = require('./status-list.es6.js');

module.exports = function (site) {
    var grades = getGrades(site.siteRating, site.isWhitelisted);

    if (!grades || !grades.length) return;

    return statusList(grades, 'status-list--right padded js-grade-scorecard-grades');
};

function getGrades(rating, isWhitelisted) {
    if (!rating || !rating.before || !rating.after) return;

    // transform site ratings into grades
    // that the template can display more easily
    var before = rating.cssBefore;
    var after = rating.cssAfter;

    var grades = [];

    grades.push({
        msg: 'Privacy Grade',
        modifier: before.toLowerCase()
    });

    if (before !== after && !isWhitelisted) {
        grades.push({
            msg: 'Enhanced Grade',
            modifier: after.toLowerCase(),
            highlight: true
        });
    }

    return grades;
}

},{"./status-list.es6.js":58}],53:[function(require,module,exports){
'use strict';

var statusList = require('./status-list.es6.js');
var constants = require('../../../../data/constants');
var trackerNetworksText = require('./tracker-networks-text.es6.js');

module.exports = function (site) {
    var reasons = getReasons(site);

    if (!reasons || !reasons.length) return;

    return statusList(reasons, 'status-list--right padded border--bottom--inner js-grade-scorecard-reasons');
};

function getReasons(site) {
    var reasons = [];

    // grab all the data from the site to create
    // a list of reasons behind the grade

    // encryption status
    var httpsState = site.httpsState;
    if (httpsState) {
        var _modifier = httpsState === 'none' ? 'bad' : 'good';

        reasons.push({
            modifier: _modifier,
            msg: site.httpsStatusText
        });
    }

    // tracking networks blocked or found,
    // only show a message if there's any
    var trackersCount = site.isWhitelisted ? site.trackersCount : site.trackersBlockedCount;
    var trackersBadOrGood = trackersCount !== 0 ? 'bad' : 'good';
    reasons.push({
        modifier: trackersBadOrGood,
        msg: '' + trackerNetworksText(site)
    });

    // major tracking networks,
    // only show a message if there are any
    var majorTrackersBadOrGood = site.majorTrackerNetworksCount !== 0 ? 'bad' : 'good';
    reasons.push({
        modifier: majorTrackersBadOrGood,
        msg: '' + trackerNetworksText(site, true)
    });

    // Is the site itself a major tracking network?
    // only show a message if it is
    if (site.isaMajorTrackingNetwork) {
        reasons.push({
            modifier: 'bad',
            msg: 'Site is a Major Tracker Network'
        });
    }

    // privacy practices from tosdr
    var unknownPractices = constants.tosdrMessages.unknown;
    var privacyMessage = site.tosdr && site.tosdr.message || unknownPractices;
    var modifier = privacyMessage === unknownPractices ? 'poor' : privacyMessage.toLowerCase();
    reasons.push({
        modifier: modifier,
        msg: privacyMessage + ' Privacy Practices'
    });

    return reasons;
}

},{"../../../../data/constants":31,"./status-list.es6.js":58,"./tracker-networks-text.es6.js":62}],54:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<button type="button" class="hamburger-button ', '" aria-label="More options">\n    <span></span>\n    <span></span>\n    <span></span>\n</button>'], ['<button type="button" class="hamburger-button ', '" aria-label="More options">\n    <span></span>\n    <span></span>\n    <span></span>\n</button>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (klass) {
    klass = klass || '';
    return bel(_templateObject, klass);
};

},{"bel":1}],55:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<div class="hero text--center ', '">\n    <div class="hero__icon hero__icon--', '">\n    </div>\n    <h1 class="hero__title">\n        ', '\n    </h1>\n    <h2 class="hero__subtitle" aria-label="', '">\n        ', '\n    </h2>\n    ', '\n</div>'], ['<div class="hero text--center ', '">\n    <div class="hero__icon hero__icon--', '">\n    </div>\n    <h1 class="hero__title">\n        ', '\n    </h1>\n    <h2 class="hero__subtitle" aria-label="', '">\n        ', '\n    </h2>\n    ', '\n</div>']),
    _templateObject2 = _taggedTemplateLiteral(['<a href="javascript:void(0)"\n        class="hero__', '"\n        role="button"\n        aria-label="', '"\n        >\n    <span class="icon icon__arrow icon__arrow--large ', '">\n    </span>\n</a>'], ['<a href="javascript:void(0)"\n        class="hero__', '"\n        role="button"\n        aria-label="', '"\n        >\n    <span class="icon icon__arrow icon__arrow--large ', '">\n    </span>\n</a>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (ops) {
    var slidingSubviewClass = ops.showClose ? 'js-sliding-subview-close' : '';
    return bel(_templateObject, slidingSubviewClass, ops.status, ops.title, ops.subtitleLabel ? ops.subtitleLabel : ops.subtitle, ops.subtitle, renderOpenOrCloseButton(ops.showClose));
};

function renderOpenOrCloseButton(isCloseButton) {
    var openOrClose = isCloseButton ? 'close' : 'open';
    var arrowIconClass = isCloseButton ? 'icon__arrow--left' : '';
    return bel(_templateObject2, openOrClose, isCloseButton ? 'Go back' : 'More details', arrowIconClass);
}

},{"bel":1}],56:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<div class="rating-hero-container js-rating-hero">\n     ', '\n</div>'], ['<div class="rating-hero-container js-rating-hero">\n     ', '\n</div>']),
    _templateObject2 = _taggedTemplateLiteral(['<span>Site enhanced from\n    <span class="rating-letter rating-letter--', '">\n    </span>\n</span>'], ['<span>Site enhanced from\n    <span class="rating-letter rating-letter--', '">\n    </span>\n</span>']),
    _templateObject3 = _taggedTemplateLiteral(['', ''], ['', '']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var hero = require('./hero.es6.js');

module.exports = function (site, ops) {
    var status = siteRatingStatus(site.isCalculatingSiteRating, site.siteRating, site.isWhitelisted);
    var subtitle = siteRatingSubtitle(site.isCalculatingSiteRating, site.siteRating, site.isWhitelisted);
    var label = subtitleLabel(site.isCalculatingSiteRating, site.siteRating, site.isWhitelisted);

    return bel(_templateObject, hero({
        status: status,
        title: site.domain,
        subtitle: subtitle,
        subtitleLabel: label,
        showClose: ops.showClose,
        showOpen: ops.showOpen
    }));
};

function siteRatingStatus(isCalculating, rating, isWhitelisted) {
    var status = void 0;
    var isActive = '';

    if (isCalculating) {
        status = 'calculating';
    } else if (rating && rating.before) {
        isActive = isWhitelisted ? '' : '--active';

        if (isActive && rating.after) {
            status = rating.cssAfter;
        } else {
            status = rating.cssBefore;
        }
    } else {
        status = 'null';
    }

    return status + isActive;
}

function siteRatingSubtitle(isCalculating, rating, isWhitelisted) {
    var isActive = true;
    if (isWhitelisted) isActive = false;
    // site grade/rating was upgraded by extension
    if (isActive && rating && rating.before && rating.after) {
        if (rating.before !== rating.after) {
            // wrap this in a single root span otherwise bel complains
            return bel(_templateObject2, rating.cssBefore);
        }
    }

    // deal with other states
    var msg = 'Privacy Grade';
    // site is whitelisted
    if (!isActive) {
        msg = 'Privacy Protection Disabled';
        // "null" state (empty tab, browser's "about:" pages)
    } else if (!isCalculating && !rating.before && !rating.after) {
        msg = 'We only grade regular websites';
        // rating is still calculating
    } else if (isCalculating) {
        msg = 'Calculating...';
    }

    return bel(_templateObject3, msg);
}

// to avoid duplicating messages between the icon and the subtitle,
// we combine information for both here
function subtitleLabel(isCalculating, rating, isWhitelisted) {
    if (isCalculating) return;

    if (isWhitelisted && rating.before) {
        return 'Privacy Protection Disabled, Privacy Grade ' + rating.before;
    }

    if (rating.before && rating.before === rating.after) {
        return 'Privacy Grade ' + rating.before;
    }

    if (rating.before && rating.after) {
        return 'Site enhanced from ' + rating.before;
    }
}

},{"./hero.es6.js":55,"bel":1}],57:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<nav class="sliding-subview__header card">\n    <a href="javascript:void(0)" class="sliding-subview__header__back\n        sliding-subview__header__back--is-icon\n        js-sliding-subview-close">\n        <span class="icon icon__arrow icon__arrow--left pull-left">\n        </span>\n    </a>\n    <h2 class="sliding-subview__header__title">\n        ', '\n    </h2>\n    ', '\n</nav>'], ['<nav class="sliding-subview__header card">\n    <a href="javascript:void(0)" class="sliding-subview__header__back\n        sliding-subview__header__back--is-icon\n        js-sliding-subview-close">\n        <span class="icon icon__arrow icon__arrow--left pull-left">\n        </span>\n    </a>\n    <h2 class="sliding-subview__header__title">\n        ', '\n    </h2>\n    ', '\n</nav>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var hamburgerButton = require('./hamburger-button.es6.js');

module.exports = function (title) {
    return bel(_templateObject, title, hamburgerButton());
};

},{"./hamburger-button.es6.js":54,"bel":1}],58:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<ul class="status-list ', '">\n    ', '\n</ul>'], ['<ul class="status-list ', '">\n    ', '\n</ul>']),
    _templateObject2 = _taggedTemplateLiteral(['<li class="status-list__item status-list__item--', '\n    bold ', '">\n    ', '\n</li>'], ['<li class="status-list__item status-list__item--', '\n    bold ', '">\n    ', '\n</li>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (items, extraClasses) {
    extraClasses = extraClasses || '';

    return bel(_templateObject, extraClasses, items.map(renderItem));
};

function renderItem(item) {
    return bel(_templateObject2, item.modifier, item.highlight ? 'is-highlighted' : '', item.msg);
}

},{"bel":1}],59:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['\n<button class="toggle-button toggle-button--is-active-', ' ', '"\n    data-key="', '"\n    type="button"\n    aria-pressed="', '"\n    >\n    <div class="toggle-button__bg">\n    </div>\n    <div class="toggle-button__knob"></div>\n</button>'], ['\n<button class="toggle-button toggle-button--is-active-', ' ', '"\n    data-key="', '"\n    type="button"\n    aria-pressed="', '"\n    >\n    <div class="toggle-button__bg">\n    </div>\n    <div class="toggle-button__knob"></div>\n</button>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (isActiveBoolean, klass, dataKey) {
    // make `klass` and `dataKey` optional:
    klass = klass || '';
    dataKey = dataKey || '';

    return bel(_templateObject, isActiveBoolean, klass, dataKey, isActiveBoolean ? 'true' : 'false');
};

},{"bel":1}],60:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<div class="top-blocked__no-data">\n    <div class="top-blocked__no-data__graph">\n        <span class="top-blocked__no-data__graph__bar one"></span>\n        <span class="top-blocked__no-data__graph__bar two"></span>\n        <span class="top-blocked__no-data__graph__bar three"></span>\n        <span class="top-blocked__no-data__graph__bar four"></span>\n    </div>\n    <p class="top-blocked__no-data__lead text-center">Tracker Networks Top Offenders</p>\n    <p>We\'re still collecting data to show how many tracker networks we\'ve blocked.</p>\n    <p>Please check back again soon.</p>\n</div>'], ['<div class="top-blocked__no-data">\n    <div class="top-blocked__no-data__graph">\n        <span class="top-blocked__no-data__graph__bar one"></span>\n        <span class="top-blocked__no-data__graph__bar two"></span>\n        <span class="top-blocked__no-data__graph__bar three"></span>\n        <span class="top-blocked__no-data__graph__bar four"></span>\n    </div>\n    <p class="top-blocked__no-data__lead text-center">Tracker Networks Top Offenders</p>\n    <p>We\'re still collecting data to show how many tracker networks we\'ve blocked.</p>\n    <p>Please check back again soon.</p>\n</div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function () {
    return bel(_templateObject);
};

},{"bel":1}],61:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['', ''], ['', '']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (siteRating, isWhitelisted, totalTrackerNetworksCount) {
    var iconNameModifier = 'blocked';

    if (isWhitelisted && siteRating.before === 'D' && totalTrackerNetworksCount !== 0) {
        iconNameModifier = 'warning';
    }

    var iconName = 'major-networks-' + iconNameModifier;

    return bel(_templateObject, iconName);
};

},{"bel":1}],62:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['', ''], ['', '']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (site, isMajorNetworksCount) {
    // Show all trackers found if site is whitelisted
    // but only show the blocked ones otherwise
    var trackersCount = site.isWhitelisted ? site.trackersCount : site.trackersBlockedCount || 0;
    var uniqueTrackersText = trackersCount === 1 ? ' Tracker ' : ' Trackers ';

    if (isMajorNetworksCount) {
        trackersCount = site.majorTrackerNetworksCount;
        uniqueTrackersText = trackersCount === 1 ? ' Major Tracker Network ' : ' Major Tracker Networks ';
    }
    var finalText = trackersCount + uniqueTrackersText + trackersBlockedOrFound(site, trackersCount);

    return bel(_templateObject, finalText);
};

function trackersBlockedOrFound(site, trackersCount) {
    var msg = '';
    if (site && (site.isWhitelisted || trackersCount === 0)) {
        msg = 'Found';
    } else {
        msg = 'Blocked';
    }

    return bel(_templateObject, msg);
}

},{"bel":1}],63:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="site-info site-info--main">\n    <ul class="default-list">\n        <li class="border--bottom site-info__rating-li main-rating js-hero-open">\n            ', '\n        </li>\n        <li class="site-info__li--https-status padded border--bottom">\n            <h2 class="site-info__https-status bold">\n                <span class="site-info__https-status__icon\n                    is-', '">\n                </span>\n                <span class="text-line-after-icon">\n                    ', '\n                </span>\n            </h2>\n        </li>\n        <li class="js-site-tracker-networks js-site-show-page-trackers site-info__li--trackers padded border--bottom">\n            <a href="javascript:void(0)" class="link-secondary bold">\n                ', '\n            </a>\n        </li>\n        <li class="js-site-privacy-practices site-info__li--privacy-practices padded border--bottom">\n            <span class="site-info__privacy-practices__icon\n                is-', '">\n            </span>\n            <a href="javascript:void(0)" class="link-secondary bold">\n                <span class="text-line-after-icon"> ', ' Privacy Practices </span>\n                <span class="icon icon__arrow pull-right"></span>\n            </a>\n        </li>\n        <li class="site-info__li--toggle padded ', '">\n            <h2 class="is-transparent site-info__whitelist-status js-site-whitelist-status">\n                <span class="text-line-after-icon privacy-on-off-message">\n                    ', '\n                </span>\n            </h2>\n            <h2 class="site-info__protection js-site-protection">Site Privacy Protection</h2>\n            <div class="site-info__toggle-container">\n                ', '\n            </div>\n        </li>\n        <li class="js-site-manage-whitelist-li site-info__li--manage-whitelist padded border--bottom">\n            ', '\n        </li>\n        <li class="js-site-confirm-breakage-li site-info__li--confirm-breakage border--bottom padded is-hidden">\n           <div class="js-site-confirm-breakage-message site-info__confirm-thanks is-transparent">\n                <span class="site-info__message">\n                    Thanks for the feedback!\n                </span>\n            </div>\n            <div class="js-site-confirm-breakage site-info--confirm-breakage">\n                <span class="site-info--is-site-broken bold">\n                    Is this website broken?\n                </span>\n                <btn class="js-site-confirm-breakage-yes site-info__confirm-breakage-yes btn-pill">\n                    Yes\n                </btn>\n                <btn class="js-site-confirm-breakage-no site-info__confirm-breakage-no btn-pill">\n                    No\n                </btn>\n            </div>\n        </li>\n    </ul>\n</section>'], ['<section class="site-info site-info--main">\n    <ul class="default-list">\n        <li class="border--bottom site-info__rating-li main-rating js-hero-open">\n            ', '\n        </li>\n        <li class="site-info__li--https-status padded border--bottom">\n            <h2 class="site-info__https-status bold">\n                <span class="site-info__https-status__icon\n                    is-', '">\n                </span>\n                <span class="text-line-after-icon">\n                    ', '\n                </span>\n            </h2>\n        </li>\n        <li class="js-site-tracker-networks js-site-show-page-trackers site-info__li--trackers padded border--bottom">\n            <a href="javascript:void(0)" class="link-secondary bold">\n                ', '\n            </a>\n        </li>\n        <li class="js-site-privacy-practices site-info__li--privacy-practices padded border--bottom">\n            <span class="site-info__privacy-practices__icon\n                is-', '">\n            </span>\n            <a href="javascript:void(0)" class="link-secondary bold">\n                <span class="text-line-after-icon"> ', ' Privacy Practices </span>\n                <span class="icon icon__arrow pull-right"></span>\n            </a>\n        </li>\n        <li class="site-info__li--toggle padded ', '">\n            <h2 class="is-transparent site-info__whitelist-status js-site-whitelist-status">\n                <span class="text-line-after-icon privacy-on-off-message">\n                    ', '\n                </span>\n            </h2>\n            <h2 class="site-info__protection js-site-protection">Site Privacy Protection</h2>\n            <div class="site-info__toggle-container">\n                ', '\n            </div>\n        </li>\n        <li class="js-site-manage-whitelist-li site-info__li--manage-whitelist padded border--bottom">\n            ', '\n        </li>\n        <li class="js-site-confirm-breakage-li site-info__li--confirm-breakage border--bottom padded is-hidden">\n           <div class="js-site-confirm-breakage-message site-info__confirm-thanks is-transparent">\n                <span class="site-info__message">\n                    Thanks for the feedback!\n                </span>\n            </div>\n            <div class="js-site-confirm-breakage site-info--confirm-breakage">\n                <span class="site-info--is-site-broken bold">\n                    Is this website broken?\n                </span>\n                <btn class="js-site-confirm-breakage-yes site-info__confirm-breakage-yes btn-pill">\n                    Yes\n                </btn>\n                <btn class="js-site-confirm-breakage-no site-info__confirm-breakage-no btn-pill">\n                    No\n                </btn>\n            </div>\n        </li>\n    </ul>\n</section>']),
    _templateObject2 = _taggedTemplateLiteral(['<a href="javascript:void(0)" class="site-info__trackers link-secondary bold">\n    <span class="site-info__trackers-status__icon\n        icon-', '"></span>\n    <span class="', ' text-line-after-icon"> ', ' </span>\n    <span class="icon icon__arrow pull-right"></span>\n</a>'], ['<a href="javascript:void(0)" class="site-info__trackers link-secondary bold">\n    <span class="site-info__trackers-status__icon\n        icon-', '"></span>\n    <span class="', ' text-line-after-icon"> ', ' </span>\n    <span class="icon icon__arrow pull-right"></span>\n</a>']),
    _templateObject3 = _taggedTemplateLiteral(['<div>\n    <a href="javascript:void(0)" class="js-site-manage-whitelist site-info__manage-whitelist link-secondary bold">\n        Unprotected Sites\n    </a>\n    <div class="separator"></div>\n    <a href="javascript:void(0)" class="js-site-report-broken site-info__report-broken link-secondary bold">\n        Report Broken Site\n    </a>\n</div>'], ['<div>\n    <a href="javascript:void(0)" class="js-site-manage-whitelist site-info__manage-whitelist link-secondary bold">\n        Unprotected Sites\n    </a>\n    <div class="separator"></div>\n    <a href="javascript:void(0)" class="js-site-report-broken site-info__report-broken link-secondary bold">\n        Report Broken Site\n    </a>\n</div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var toggleButton = require('./shared/toggle-button.es6.js');
var ratingHero = require('./shared/rating-hero.es6.js');
var trackerNetworksIcon = require('./shared/tracker-network-icon.es6.js');
var trackerNetworksText = require('./shared/tracker-networks-text.es6.js');
var constants = require('../../../data/constants');

module.exports = function () {
    var tosdrMsg = this.model.tosdr && this.model.tosdr.message || constants.tosdrMessages.unknown;

    return bel(_templateObject, ratingHero(this.model, {
        showOpen: !this.model.disabled
    }), this.model.httpsState, this.model.httpsStatusText, renderTrackerNetworks(this.model), tosdrMsg.toLowerCase(), tosdrMsg, this.model.isWhitelisted ? '' : 'is-active', setTransitionText(!this.model.isWhitelisted), toggleButton(!this.model.isWhitelisted, 'js-site-toggle pull-right'), renderManageWhitelist(this.model));

    function setTransitionText(isSiteWhitelisted) {
        isSiteWhitelisted = isSiteWhitelisted || false;
        var text = 'Added to Unprotected Sites';

        if (isSiteWhitelisted) {
            text = 'Removed from Unprotected Sites';
        }

        return text;
    }

    function renderTrackerNetworks(model) {
        var isActive = !model.isWhitelisted ? 'is-active' : '';

        return bel(_templateObject2, trackerNetworksIcon(model.siteRating, model.isWhitelisted, model.totalTrackerNetworksCount), isActive, trackerNetworksText(model, false));
    }

    function renderManageWhitelist(model) {
        return bel(_templateObject3);
    }
};

},{"../../../data/constants":31,"./shared/rating-hero.es6.js":56,"./shared/toggle-button.es6.js":59,"./shared/tracker-network-icon.es6.js":61,"./shared/tracker-networks-text.es6.js":62,"bel":1}],64:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<li class="top-blocked__li">\n    <div title="', '" class="top-blocked__li__company-name">', '</div>\n    <div class="top-blocked__li__blocker-bar">\n        <div class="top-blocked__li__blocker-bar__fg\n            js-top-blocked-graph-bar-fg"\n            style="width: 0px" data-width="', '">\n        </div>\n    </div>\n    <div class="top-blocked__li__blocker-pct js-top-blocked-pct">\n        ', '%\n    </div>\n</li>'], ['<li class="top-blocked__li">\n    <div title="', '" class="top-blocked__li__company-name">', '</div>\n    <div class="top-blocked__li__blocker-bar">\n        <div class="top-blocked__li__blocker-bar__fg\n            js-top-blocked-graph-bar-fg"\n            style="width: 0px" data-width="', '">\n        </div>\n    </div>\n    <div class="top-blocked__li__blocker-pct js-top-blocked-pct">\n        ', '%\n    </div>\n</li>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function (companyListMap) {
    return companyListMap.map(function (data) {
        return bel(_templateObject, data.name, data.displayName, data.percent, data.percent);
    });
};

},{"bel":1}],65:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<span class="top-blocked__pill-site__icon ', '"></span>'], ['<span class="top-blocked__pill-site__icon ', '"></span>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var constants = require('../../../data/constants');
var entityIconMapping = constants.entityIconMapping;

module.exports = function (companyListMap) {
    return companyListMap.map(function (data) {
        return bel(_templateObject, getScssClass(data.name));
    });

    function getScssClass(companyName) {
        var iconClassName = entityIconMapping[companyName] || 'generic';
        return iconClassName;
    }
};

},{"../../../data/constants":31,"bel":1}],66:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="top-blocked top-blocked--truncated">\n    <div class="top-blocked__see-all js-top-blocked-see-all">\n        <a href="javascript:void(0)" class="link-secondary">\n            <span class="icon icon__arrow pull-right"></span>\n            Top Tracking Offenders\n            <span class="top-blocked__list top-blocked__list--truncated top-blocked__list--icons">\n                ', '\n            </span>\n        </a>\n    </div>\n</section>'], ['<section class="top-blocked top-blocked--truncated">\n    <div class="top-blocked__see-all js-top-blocked-see-all">\n        <a href="javascript:void(0)" class="link-secondary">\n            <span class="icon icon__arrow pull-right"></span>\n            Top Tracking Offenders\n            <span class="top-blocked__list top-blocked__list--truncated top-blocked__list--icons">\n                ', '\n            </span>\n        </a>\n    </div>\n</section>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var listItems = require('./top-blocked-truncated-list-items.es6.js');

module.exports = function () {
    if (this.model.companyListMap && this.model.companyListMap.length > 0) {
        return bel(_templateObject, listItems(this.model.companyListMap));
    }
};

},{"./top-blocked-truncated-list-items.es6.js":65,"bel":1}],67:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="sliding-subview\n    sliding-subview--has-fixed-header top-blocked-header">\n    ', '\n</section>'], ['<section class="sliding-subview\n    sliding-subview--has-fixed-header top-blocked-header">\n    ', '\n</section>']),
    _templateObject2 = _taggedTemplateLiteral(['<div class="js-top-blocked-content">\n    ', '\n    ', '\n    ', '\n</div>'], ['<div class="js-top-blocked-content">\n    ', '\n    ', '\n    ', '\n</div>']),
    _templateObject3 = _taggedTemplateLiteral(['<p class="top-blocked__pct card">\n    Trackers were found on <b>', '%</b>\n    of web sites you\'ve visited', '.\n</p>'], ['<p class="top-blocked__pct card">\n    Trackers were found on <b>', '%</b>\n    of web sites you\'ve visited', '.\n</p>']),
    _templateObject4 = _taggedTemplateLiteral(['<ol aria-label="List of Trackers Found" class="default-list top-blocked__list card border--bottom">\n    ', '\n</ol>'], ['<ol aria-label="List of Trackers Found" class="default-list top-blocked__list card border--bottom">\n    ', '\n</ol>']),
    _templateObject5 = _taggedTemplateLiteral(['<ol class="default-list top-blocked__list">\n    <li class="top-blocked__li top-blocked__li--no-data">\n        ', '\n    </li>\n</ol>'], ['<ol class="default-list top-blocked__list">\n    <li class="top-blocked__li top-blocked__li--no-data">\n        ', '\n    </li>\n</ol>']),
    _templateObject6 = _taggedTemplateLiteral(['<div class="top-blocked__reset-stats">\n    <button class="top-blocked__reset-stats__button block\n        js-reset-trackers-data">\n        Reset Global Stats\n    </button>\n    <p>These stats are only stored locally on your device,\n    and are not sent anywhere, ever.</p>\n</div>'], ['<div class="top-blocked__reset-stats">\n    <button class="top-blocked__reset-stats__button block\n        js-reset-trackers-data">\n        Reset Global Stats\n    </button>\n    <p>These stats are only stored locally on your device,\n    and are not sent anywhere, ever.</p>\n</div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var header = require('./shared/sliding-subview-header.es6.js');
var listItems = require('./top-blocked-list-items.es6.js');
var noData = require('./shared/top-blocked-no-data.es6.js');

module.exports = function () {
    if (!this.model) {
        return bel(_templateObject, header('All Trackers'));
    } else {
        return bel(_templateObject2, renderPctPagesWithTrackers(this.model), renderList(this.model), renderResetButton(this.model));
    }
};

function renderPctPagesWithTrackers(model) {
    var msg = '';
    if (model.lastStatsResetDate) {
        var d = new Date(model.lastStatsResetDate).toDateString();
        if (d) msg = ' since ' + d;
    }
    if (model.pctPagesWithTrackers) {
        return bel(_templateObject3, model.pctPagesWithTrackers, msg);
    }
}

function renderList(model) {
    if (model.companyListMap.length > 0) {
        return bel(_templateObject4, listItems(model.companyListMap));
    } else {
        return bel(_templateObject5, noData());
    }
}

function renderResetButton(model) {
    if (model.companyListMap.length > 0) {
        return bel(_templateObject6);
    }
}

},{"./shared/sliding-subview-header.es6.js":57,"./shared/top-blocked-no-data.es6.js":60,"./top-blocked-list-items.es6.js":64,"bel":1}],68:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<section class="sliding-subview\n    sliding-subview--has-fixed-header">\n</section>'], ['<section class="sliding-subview\n    sliding-subview--has-fixed-header">\n</section>']),
    _templateObject2 = _taggedTemplateLiteral(['<div class="tracker-networks site-info site-info--full-height card">\n    <div class="js-tracker-networks-hero">\n        ', '\n    </div>\n    <div class="tracker-networks__explainer border--bottom--inner\n        text--center">\n        Tracker networks aggregate your web history into a data profile about you.\n        Major tracker networks are more harmful because they can track and target you across more of the internet.\n    </div>\n    <div class="tracker-networks__details padded\n        js-tracker-networks-details">\n        <ol class="default-list site-info__trackers__company-list" aria-label="List of tracker networks">\n            ', '\n        </ol>\n    </div>\n</div>'], ['<div class="tracker-networks site-info site-info--full-height card">\n    <div class="js-tracker-networks-hero">\n        ', '\n    </div>\n    <div class="tracker-networks__explainer border--bottom--inner\n        text--center">\n        Tracker networks aggregate your web history into a data profile about you.\n        Major tracker networks are more harmful because they can track and target you across more of the internet.\n    </div>\n    <div class="tracker-networks__details padded\n        js-tracker-networks-details">\n        <ol class="default-list site-info__trackers__company-list" aria-label="List of tracker networks">\n            ', '\n        </ol>\n    </div>\n</div>']),
    _templateObject3 = _taggedTemplateLiteral(['', ''], ['', '']),
    _templateObject4 = _taggedTemplateLiteral(['<li class="is-empty">None</li>'], ['<li class="is-empty">None</li>']),
    _templateObject5 = _taggedTemplateLiteral(['<li class="', '">\n    <div class="site-info__tracker__wrapper ', ' float-right">\n        <span class="site-info__tracker__icon ', '">\n        </span>\n    </div>\n    <h1 title="', '" class="site-info__domain block">', '</h1>\n    <ol class="default-list site-info__trackers__company-list__url-list" aria-label="Tracker domains for ', '">\n        ', '\n    </ol>\n</li>'], ['<li class="', '">\n    <div class="site-info__tracker__wrapper ', ' float-right">\n        <span class="site-info__tracker__icon ', '">\n        </span>\n    </div>\n    <h1 title="', '" class="site-info__domain block">', '</h1>\n    <ol class="default-list site-info__trackers__company-list__url-list" aria-label="Tracker domains for ', '">\n        ', '\n    </ol>\n</li>']),
    _templateObject6 = _taggedTemplateLiteral(['<li>\n                <div class="url">', '</div>\n                <div class="category">', '</div>\n            </li>'], ['<li>\n                <div class="url">', '</div>\n                <div class="category">', '</div>\n            </li>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');
var hero = require('./shared/hero.es6.js');
var trackerNetworksIcon = require('./shared/tracker-network-icon.es6.js');
var trackerNetworksText = require('./shared/tracker-networks-text.es6.js');
var displayCategories = require('./../../../data/constants.js').displayCategories;

module.exports = function () {
    if (!this.model) {
        return bel(_templateObject);
    } else {
        return bel(_templateObject2, renderHero(this.model.site), renderTrackerDetails(this.model, this.model.DOMAIN_MAPPINGS));
    }
};

function renderHero(site) {
    site = site || {};

    return bel(_templateObject3, hero({
        status: trackerNetworksIcon(site.siteRating, site.isWhitelisted, site.totalTrackerNetworksCount),
        title: site.domain,
        subtitle: '' + trackerNetworksText(site, false),
        showClose: true
    }));
}

function renderTrackerDetails(model) {
    var companyListMap = model.companyListMap || {};
    if (companyListMap.length === 0) {
        return bel(_templateObject4);
    }
    if (companyListMap && companyListMap.length > 0) {
        return companyListMap.map(function (c, i) {
            var borderClass = '';
            if (c.name && c.name === 'unknown') {
                c.name = '(Tracker network unknown)';
            } else if (c.name && model.hasUnblockedTrackers(c, c.urlsList)) {
                var additionalText = ' associated domains';
                var domain = model.site ? model.site.domain : c.displayName;
                c.displayName = model.site.isWhitelisted ? domain + additionalText : domain + additionalText + ' (not blocked)';
                borderClass = companyListMap.length > 1 ? 'border--top padded--top' : '';
            }
            return bel(_templateObject5, borderClass, c.normalizedName, c.normalizedName, c.name, c.displayName, c.name, c.urlsList.map(function (url) {
                // find first matchign category from our list of allowed display categories
                var category = '';
                if (c.urls[url] && c.urls[url].categories) {
                    displayCategories.some(function (displayCat) {
                        var match = c.urls[url].categories.find(function (cat) {
                            return cat === displayCat;
                        });
                        if (match) {
                            category = match;
                            return true;
                        }
                    });
                }
                return bel(_templateObject6, url, category);
            }));
        });
    }
}

},{"./../../../data/constants.js":31,"./shared/hero.es6.js":55,"./shared/tracker-network-icon.es6.js":61,"./shared/tracker-networks-text.es6.js":62,"bel":1}],69:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;

function Autocomplete(ops) {
    this.model = ops.model;
    this.pageView = ops.pageView;
    this.template = ops.template;
    Parent.call(this, ops);

    this.bindEvents([[this.store.subscribe, 'change:search', this._handleSearchText]]);
}

Autocomplete.prototype = window.$.extend({}, Parent.prototype, {

    _handleSearchText: function _handleSearchText(notification) {
        var _this = this;

        if (notification.change && notification.change.attribute === 'searchText') {
            if (!notification.change.value) {
                this.model.suggestions = [];
                this._rerender();
                return;
            }

            this.model.fetchSuggestions(notification.change.value).then(function () {
                return _this._rerender();
            });
        }
    }
});

module.exports = Autocomplete;

},{}],70:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;

function BreakageForm(ops) {
    this.model = ops.model;
    this.template = ops.template;
    this.siteView = ops.siteView;
    this.clickSource = ops.clickSource;
    this.$root = window.$('.js-breakage-form');
    Parent.call(this, ops);

    this._setup();
}

BreakageForm.prototype = window.$.extend({}, Parent.prototype, {
    _setup: function _setup() {
        this._cacheElems('.js-breakage-form', ['close', 'submit', 'element', 'message', 'dropdown']);
        this.bindEvents([[this.$close, 'click', this._closeForm], [this.$submit, 'click', this._submitForm], [this.$dropdown, 'change', this._selectCategory]]);
    },

    _closeForm: function _closeForm(e) {
        if (e) e.preventDefault();
        // reload page after closing form if user got to form from
        // toggling privacy protection. otherwise destroy view.
        if (this.clickSource === 'toggle') {
            this.siteView.closePopupAndReload(500);
            this.destroy();
        } else {
            this.destroy();
        }
    },

    _submitForm: function _submitForm() {
        if (this.$submit.hasClass('btn-disabled')) {
            return;
        }

        var category = this.$dropdown.val();
        this.model.submitBreakageForm(category);
        this._showThankYouMessage();
    },

    _showThankYouMessage: function _showThankYouMessage() {
        this.$element.addClass('is-transparent');
        this.$message.removeClass('is-transparent');
        // reload page after form submission if user got to form from
        // toggling privacy protection, otherwise destroy view.
        if (this.clickSource === 'toggle') {
            this.siteView.closePopupAndReload(3500);
        }
    },

    _selectCategory: function _selectCategory() {
        if (this.$dropdown.val()) {
            this.$submit.removeClass('btn-disabled');
            this.$submit.attr('disabled', false);
        } else if (!this.$submit.hasClass('btn-disabled')) {
            this.$submit.addClass('btn-disabled');
            this.$submit.attr('disabled', true);
        }
    }
});

module.exports = BreakageForm;

},{}],71:[function(require,module,exports){
'use strict';

var Parent = require('./sliding-subview.es6.js');
var ratingHeroTemplate = require('../templates/shared/rating-hero.es6.js');
var gradesTemplate = require('../templates/shared/grade-scorecard-grades.es6.js');
var reasonsTemplate = require('../templates/shared/grade-scorecard-reasons.es6.js');

function GradeScorecard(ops) {
    this.model = ops.model;
    this.template = ops.template;

    Parent.call(this, ops);

    this._setup();

    this.bindEvents([[this.store.subscribe, 'change:site', this._onSiteChange]]);

    this.setupClose();
}

GradeScorecard.prototype = window.$.extend({}, Parent.prototype, {
    _setup: function _setup() {
        this._cacheElems('.js-grade-scorecard', ['reasons', 'grades']);
        this.$hero = this.$('.js-rating-hero');
    },

    _rerenderHero: function _rerenderHero() {
        this.$hero.replaceWith(ratingHeroTemplate(this.model, { showClose: true }));
    },

    _rerenderGrades: function _rerenderGrades() {
        this.$grades.replaceWith(gradesTemplate(this.model));
    },

    _rerenderReasons: function _rerenderReasons() {
        this.$reasons.replaceWith(reasonsTemplate(this.model));
    },

    _onSiteChange: function _onSiteChange(e) {
        if (e.change.attribute === 'siteRating') {
            this._rerenderHero();
            this._rerenderGrades();
        }

        // all the other stuff we use in the reasons
        // (e.g. https, tosdr)
        // doesn't change dynamically
        if (e.change.attribute === 'trackerNetworks' || e.change.attribute === 'isaMajorTrackingNetwork') {
            this._rerenderReasons();
        }

        // recache any selectors that were rerendered
        this._setup();
        this.setupClose();
    }
});

module.exports = GradeScorecard;

},{"../templates/shared/grade-scorecard-grades.es6.js":52,"../templates/shared/grade-scorecard-reasons.es6.js":53,"../templates/shared/rating-hero.es6.js":56,"./sliding-subview.es6.js":78}],72:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;
var openOptionsPage = require('./mixins/open-options-page.es6.js');
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

function HamburgerMenu(ops) {
    this.model = ops.model;
    this.template = ops.template;
    this.pageView = ops.pageView;
    Parent.call(this, ops);

    this._setup();
}

HamburgerMenu.prototype = window.$.extend({}, Parent.prototype, openOptionsPage, {

    _setup: function _setup() {
        this._cacheElems('.js-hamburger-menu', ['close', 'options-link', 'feedback-link', 'broken-site-link']);
        this.bindEvents([[this.$close, 'click', this._closeMenu], [this.$optionslink, 'click', this.openOptionsPage], [this.$feedbacklink, 'click', this._handleFeedbackClick], [this.$brokensitelink, 'click', this._handleBrokenSiteClick], [this.model.store.subscribe, 'action:search', this._handleAction], [this.model.store.subscribe, 'change:site', this._handleSiteUpdate]]);
    },

    _handleAction: function _handleAction(notification) {
        if (notification.action === 'burgerClick') this._openMenu();
    },

    _openMenu: function _openMenu(e) {
        this.$el.removeClass('is-hidden');
    },

    _closeMenu: function _closeMenu(e) {
        if (e) e.preventDefault();
        this.$el.addClass('is-hidden');
    },

    _handleFeedbackClick: function _handleFeedbackClick(e) {
        e.preventDefault();

        browserUIWrapper.openExtensionPage('/html/feedback.html');
    },

    _handleBrokenSiteClick: function _handleBrokenSiteClick(e) {
        e.preventDefault();
        this.$el.addClass('is-hidden');
        this.pageView.views.site.showBreakageForm('reportBrokenSite');
    },

    _handleSiteUpdate: function _handleSiteUpdate(notification) {
        if (notification && notification.change.attribute === 'tab') {
            this.model.tabUrl = notification.change.value.url;
            this._rerender();
            this._setup();
        }
    }
});

module.exports = HamburgerMenu;

},{"./../base/chrome-ui-wrapper.es6.js":32,"./mixins/open-options-page.es6.js":74}],73:[function(require,module,exports){
'use strict';

module.exports = {
    animateGraphBars: function animateGraphBars() {
        var self = this;

        window.setTimeout(function () {
            if (!self.$graphbarfg) return;
            self.$graphbarfg.each(function (i, el) {
                var $el = window.$(el);
                var w = $el.data().width;
                $el.css('width', w + '%');
            });
        }, 250);

        window.setTimeout(function () {
            if (!self.$pct) return;
            self.$pct.each(function (i, el) {
                var $el = window.$(el);
                $el.css('color', '#333333');
            });
        }, 700);
    }
};

},{}],74:[function(require,module,exports){
'use strict';

var browserUIWrapper = require('./../../base/chrome-ui-wrapper.es6.js');

module.exports = {
    openOptionsPage: function openOptionsPage() {
        this.model.fetch({ getBrowser: true }).then(function (browser) {
            browserUIWrapper.openOptionsPage(browser);
        });
    }
};

},{"./../../base/chrome-ui-wrapper.es6.js":32}],75:[function(require,module,exports){
'use strict';

var ParentSlidingSubview = require('./sliding-subview.es6.js');

function PrivacyPractices(ops) {
    this.model = ops.model;
    this.template = ops.template;

    ParentSlidingSubview.call(this, ops);

    this.setupClose();
}

PrivacyPractices.prototype = window.$.extend({}, ParentSlidingSubview.prototype, {});

module.exports = PrivacyPractices;

},{"./sliding-subview.es6.js":78}],76:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;
var FOCUS_CLASS = 'go--focused';

function Search(ops) {
    var _this = this;

    this.model = ops.model;
    this.pageView = ops.pageView;
    this.template = ops.template;
    Parent.call(this, ops);

    this._cacheElems('.js-search', ['form', 'input', 'go', 'hamburger-button']);

    this.bindEvents([[this.$input, 'input', this._handleInput], [this.$input, 'blur', this._handleBlur], [this.$go, 'click', this._handleSubmit], [this.$form, 'submit', this._handleSubmit], [this.$hamburgerbutton, 'click', this._handleBurgerClick]]);

    window.setTimeout(function () {
        return _this.$input.focus();
    }, 200);
}

Search.prototype = window.$.extend({}, Parent.prototype, {

    // Hover effect on search button while typing
    _addHoverEffect: function _addHoverEffect() {
        if (!this.$go.hasClass(FOCUS_CLASS)) {
            this.$go.addClass(FOCUS_CLASS);
        }
    },

    _removeHoverEffect: function _removeHoverEffect() {
        if (this.$go.hasClass(FOCUS_CLASS)) {
            this.$go.removeClass(FOCUS_CLASS);
        }
    },

    _handleBlur: function _handleBlur(e) {
        this._removeHoverEffect();
    },

    _handleInput: function _handleInput(e) {
        var searchText = this.$input.val();
        this.model.set('searchText', searchText);

        if (searchText.length) {
            this._addHoverEffect();
        } else {
            this._removeHoverEffect();
        }
    },

    _handleSubmit: function _handleSubmit(e) {
        e.preventDefault();
        console.log('Search submit for ' + this.$input.val());
        this.model.fetch({ firePixel: 'epq' });
        this.model.doSearch(this.$input.val());
        window.close();
    },

    _handleBurgerClick: function _handleBurgerClick(e) {
        e.preventDefault();
        this.model.fetch({ firePixel: 'eph' });
        this.model.send('burgerClick');
    }
});

module.exports = Search;

},{}],77:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;
var GradeScorecardView = require('./../views/grade-scorecard.es6.js');
var TrackerNetworksView = require('./../views/tracker-networks.es6.js');
var PrivacyPracticesView = require('./../views/privacy-practices.es6.js');
var BreakageFormView = require('./../views/breakage-form.es6.js');
var gradeScorecardTemplate = require('./../templates/grade-scorecard.es6.js');
var trackerNetworksTemplate = require('./../templates/tracker-networks.es6.js');
var privacyPracticesTemplate = require('./../templates/privacy-practices.es6.js');
var breakageFormTemplate = require('./../templates/breakage-form.es6.js');
var openOptionsPage = require('./mixins/open-options-page.es6.js');
var browserUIWrapper = require('./../base/chrome-ui-wrapper.es6.js');

function Site(ops) {
    var _this = this;

    this.model = ops.model;
    this.pageView = ops.pageView;
    this.template = ops.template;

    // cache 'body' selector
    this.$body = window.$('body');

    // get data from background process, then re-render template with it
    this.model.getBackgroundTabData().then(function () {
        if (_this.model.tab && (_this.model.tab.status === 'complete' || _this.model.domain === 'new tab')) {
            // render template for the first time here
            Parent.call(_this, ops);
            _this.model.fetch({ firePixel: 'ep' });
            _this._setup();
        } else {
            // the timeout helps buffer the re-render cycle during heavy
            // page loads with lots of trackers
            Parent.call(_this, ops);
            setTimeout(function () {
                return _this.rerender();
            }, 750);
        }
    });
}

Site.prototype = window.$.extend({}, Parent.prototype, openOptionsPage, {
    _onWhitelistClick: function _onWhitelistClick(e) {
        if (this.$body.hasClass('is-disabled')) return;

        this.model.toggleWhitelist();
        var whitelisted = this.model.isWhitelisted;
        this._showWhitelistedStatusMessage(!whitelisted);

        if (whitelisted) {
            this._showBreakageConfirmation();
        }
    },

    // If we just whitelisted a site, show a message briefly before reloading
    // otherwise just reload the tab and close the popup
    _showWhitelistedStatusMessage: function _showWhitelistedStatusMessage(reload) {
        var _this2 = this;

        var isTransparentClass = 'is-transparent';
        // Wait for the rerendering to be done
        // 10ms timeout is the minimum to render the transition smoothly
        setTimeout(function () {
            return _this2.$whiteliststatus.removeClass(isTransparentClass);
        }, 10);
        setTimeout(function () {
            return _this2.$protection.addClass(isTransparentClass);
        }, 10);

        if (reload) {
            // Wait a bit more before closing the popup and reloading the tab
            this.closePopupAndReload(1500);
        }
    },

    // NOTE: after ._setup() is called this view listens for changes to
    // site model and re-renders every time model properties change
    _setup: function _setup() {
        // console.log('[site view] _setup()')
        this._cacheElems('.js-site', ['toggle', 'protection', 'whitelist-status', 'show-all-trackers', 'show-page-trackers', 'manage-whitelist', 'manage-whitelist-li', 'report-broken', 'privacy-practices', 'confirm-breakage-li', 'confirm-breakage', 'confirm-breakage-yes', 'confirm-breakage-no', 'confirm-breakage-message']);

        this.$gradescorecard = this.$('.js-hero-open');

        this.bindEvents([[this.$toggle, 'click', this._onWhitelistClick], [this.$showpagetrackers, 'click', this._showPageTrackers], [this.$privacypractices, 'click', this._showPrivacyPractices], [this.$confirmbreakageyes, 'click', this._onConfirmBrokenClick], [this.$confirmbreakageno, 'click', this._onConfirmNotBrokenClick], [this.$gradescorecard, 'click', this._showGradeScorecard], [this.$managewhitelist, 'click', this._onManageWhitelistClick], [this.$reportbroken, 'click', this._onReportBrokenSiteClick], [this.store.subscribe, 'change:site', this.rerender]]);
    },

    rerender: function rerender() {
        // Prevent rerenders when confirmation form is active,
        // otherwise form will disappear on rerender.
        if (this.$body.hasClass('confirmation-active')) return;

        if (this.model && this.model.disabled) {
            if (!this.$body.hasClass('is-disabled')) {
                console.log('$body.addClass() is-disabled');
                this.$body.addClass('is-disabled');
                this._rerender();
                this._setup();
            }
        } else {
            this.$body.removeClass('is-disabled');
            this.unbindEvents();
            this._rerender();
            this._setup();
        }
    },

    _onManageWhitelistClick: function _onManageWhitelistClick() {
        if (this.model && this.model.disabled) {
            return;
        }

        this.openOptionsPage();
    },

    _onReportBrokenSiteClick: function _onReportBrokenSiteClick(e) {
        e.preventDefault();

        if (this.model && this.model.disabled) {
            return;
        }

        this.showBreakageForm('reportBrokenSite');
    },

    _onConfirmBrokenClick: function _onConfirmBrokenClick() {
        var isHiddenClass = 'is-hidden';
        this.$managewhitelistli.removeClass(isHiddenClass);
        this.$confirmbreakageli.addClass(isHiddenClass);
        this.$body.removeClass('confirmation-active');
        this.showBreakageForm('toggle');
    },

    _onConfirmNotBrokenClick: function _onConfirmNotBrokenClick() {
        var isTransparentClass = 'is-transparent';
        this.$confirmbreakagemessage.removeClass(isTransparentClass);
        this.$confirmbreakage.addClass(isTransparentClass);
        this.$body.removeClass('confirmation-active');
        this.closePopupAndReload(1500);
    },

    _showBreakageConfirmation: function _showBreakageConfirmation() {
        this.$body.addClass('confirmation-active');
        this.$confirmbreakageli.removeClass('is-hidden');
        this.$managewhitelistli.addClass('is-hidden');
    },

    // pass clickSource to specify whether page should reload
    // after submitting breakage form.
    showBreakageForm: function showBreakageForm(clickSource) {
        this.views.breakageForm = new BreakageFormView({
            siteView: this,
            template: breakageFormTemplate,
            model: this.model,
            appendTo: this.$body,
            clickSource: clickSource
        });
    },

    _showPageTrackers: function _showPageTrackers(e) {
        if (this.$body.hasClass('is-disabled')) return;
        this.model.fetch({ firePixel: 'epn' });
        this.views.slidingSubview = new TrackerNetworksView({
            template: trackerNetworksTemplate
        });
    },

    _showPrivacyPractices: function _showPrivacyPractices(e) {
        if (this.model.disabled) return;
        this.model.fetch({ firePixel: 'epp' });

        this.views.privacyPractices = new PrivacyPracticesView({
            template: privacyPracticesTemplate,
            model: this.model
        });
    },

    _showGradeScorecard: function _showGradeScorecard(e) {
        if (this.model.disabled) return;
        this.model.fetch({ firePixel: 'epc' });

        this.views.gradeScorecard = new GradeScorecardView({
            template: gradeScorecardTemplate,
            model: this.model
        });
    },

    closePopupAndReload: function closePopupAndReload(delay) {
        var _this3 = this;

        delay = delay || 0;
        setTimeout(function () {
            browserUIWrapper.reloadTab(_this3.model.tab.id);
            browserUIWrapper.closePopup();
        }, delay);
    }
});

module.exports = Site;

},{"./../base/chrome-ui-wrapper.es6.js":32,"./../templates/breakage-form.es6.js":46,"./../templates/grade-scorecard.es6.js":47,"./../templates/privacy-practices.es6.js":49,"./../templates/tracker-networks.es6.js":68,"./../views/breakage-form.es6.js":70,"./../views/grade-scorecard.es6.js":71,"./../views/privacy-practices.es6.js":75,"./../views/tracker-networks.es6.js":81,"./mixins/open-options-page.es6.js":74}],78:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;

function SlidingSubview(ops) {
    ops.appendTo = window.$('.sliding-subview--root');
    Parent.call(this, ops);

    this.$root = window.$('.sliding-subview--root');
    this.$root.addClass('sliding-subview--open');

    this.setupClose();
}

SlidingSubview.prototype = window.$.extend({}, Parent.prototype, {

    setupClose: function setupClose() {
        this._cacheElems('.js-sliding-subview', ['close']);
        this.bindEvents([[this.$close, 'click', this._destroy]]);
    },

    _destroy: function _destroy() {
        var _this = this;

        this.$root.removeClass('sliding-subview--open');
        window.setTimeout(function () {
            _this.destroy();
        }, 400); // 400ms = 0.35s in .sliding-subview--root transition + 50ms padding
    }
});

module.exports = SlidingSubview;

},{}],79:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;
var TopBlockedFullView = require('./top-blocked.es6.js');
var topBlockedFullTemplate = require('./../templates/top-blocked.es6.js');
var TOP_BLOCKED_CLASS = 'has-top-blocked--truncated';

function TruncatedTopBlocked(ops) {
    var _this = this;

    this.model = ops.model;
    this.pageView = ops.pageView;
    this.template = ops.template;

    this.model.getTopBlocked().then(function () {
        Parent.call(_this, ops);
        _this._setup();
    });

    this.bindEvents([[this.model.store.subscribe, 'action:backgroundMessage', this.handleBackgroundMsg]]);
}

TruncatedTopBlocked.prototype = window.$.extend({}, Parent.prototype, {

    _seeAllClick: function _seeAllClick() {
        this.model.fetch({ firePixel: 'eps' });
        this.views.slidingSubview = new TopBlockedFullView({
            template: topBlockedFullTemplate,
            numItems: 10
        });
    },

    _setup: function _setup() {
        this._cacheElems('.js-top-blocked', ['graph-bar-fg', 'pct', 'see-all']);
        this.bindEvents([[this.$seeall, 'click', this._seeAllClick]]);
        if (window.$('.top-blocked--truncated').length) {
            window.$('html').addClass(TOP_BLOCKED_CLASS);
        }
    },

    rerenderList: function rerenderList() {
        this._rerender();
        this._setup();
    },

    handleBackgroundMsg: function handleBackgroundMsg(message) {
        var _this2 = this;

        if (!message || !message.action) return;

        if (message.action === 'didResetTrackersData') {
            this.model.reset();
            setTimeout(function () {
                return _this2.rerenderList();
            }, 750);
            this.rerenderList();
            window.$('html').removeClass(TOP_BLOCKED_CLASS);
        }
    }
});

module.exports = TruncatedTopBlocked;

},{"./../templates/top-blocked.es6.js":67,"./top-blocked.es6.js":80}],80:[function(require,module,exports){
'use strict';

var ParentSlidingSubview = require('./sliding-subview.es6.js');
var animateGraphBars = require('./mixins/animate-graph-bars.es6.js');
var TopBlockedModel = require('./../models/top-blocked.es6.js');

function TopBlocked(ops) {
    // model data is async
    this.model = null;
    this.numItems = ops.numItems;
    this.template = ops.template;
    ParentSlidingSubview.call(this, ops);

    this.setupClose();
    this.renderAsyncContent();

    this.bindEvents([[this.model.store.subscribe, 'action:backgroundMessage', this.handleBackgroundMsg]]);
}

TopBlocked.prototype = window.$.extend({}, ParentSlidingSubview.prototype, animateGraphBars, {

    setup: function setup() {
        this.$content = this.$el.find('.js-top-blocked-content');
        // listener for reset stats click
        this.$reset = this.$el.find('.js-reset-trackers-data');
        this.bindEvents([[this.$reset, 'click', this.resetTrackersStats]]);
    },

    renderAsyncContent: function renderAsyncContent() {
        var _this = this;

        var random = Math.round(Math.random() * 100000);
        this.model = new TopBlockedModel({
            modelName: 'topBlocked' + random,
            numCompanies: this.numItems
        });
        this.model.getTopBlocked().then(function () {
            var content = _this.template();
            _this.$el.append(content);
            _this.setup();

            // animate graph bars and pct
            _this.$graphbarfg = _this.$el.find('.js-top-blocked-graph-bar-fg');
            _this.$pct = _this.$el.find('.js-top-blocked-pct');
            _this.animateGraphBars();
        });
    },

    resetTrackersStats: function resetTrackersStats(e) {
        if (e) e.preventDefault();
        this.model.fetch({ resetTrackersData: true });
    },

    handleBackgroundMsg: function handleBackgroundMsg(message) {
        if (!message || !message.action) return;

        if (message.action === 'didResetTrackersData') {
            this.model.reset(message.data);
            var content = this.template();
            this.$content.replaceWith(content);
        }
    }
});

module.exports = TopBlocked;

},{"./../models/top-blocked.es6.js":40,"./mixins/animate-graph-bars.es6.js":73,"./sliding-subview.es6.js":78}],81:[function(require,module,exports){
'use strict';

var ParentSlidingSubview = require('./sliding-subview.es6.js');
var heroTemplate = require('./../templates/shared/hero.es6.js');
var CompanyListModel = require('./../models/site-company-list.es6.js');
var SiteModel = require('./../models/site.es6.js');
var trackerNetworksIconTemplate = require('./../templates/shared/tracker-network-icon.es6.js');
var trackerNetworksTextTemplate = require('./../templates/shared/tracker-networks-text.es6.js');

function TrackerNetworks(ops) {
    var _this = this;

    // model data is async
    this.model = null;
    this.currentModelName = null;
    this.currentSiteModelName = null;
    this.template = ops.template;
    ParentSlidingSubview.call(this, ops);

    setTimeout(function () {
        return _this._rerender();
    }, 750);
    this.renderAsyncContent();
}

TrackerNetworks.prototype = window.$.extend({}, ParentSlidingSubview.prototype, {

    setup: function setup() {
        this._cacheElems('.js-tracker-networks', ['hero', 'details']);

        // site rating arrives async
        this.bindEvents([[this.store.subscribe, 'change:' + this.currentSiteModelName, this._rerender]]);
    },

    renderAsyncContent: function renderAsyncContent() {
        var _this2 = this;

        var random = Math.round(Math.random() * 100000);
        this.currentModelName = 'siteCompanyList' + random;
        this.currentSiteModelName = 'site' + random;

        this.model = new CompanyListModel({
            modelName: this.currentModelName
        });
        this.model.fetchAsyncData().then(function () {
            _this2.model.site = new SiteModel({
                modelName: _this2.currentSiteModelName
            });
            _this2.model.site.getBackgroundTabData().then(function () {
                var content = _this2.template();
                _this2.$el.append(content);
                _this2.setup();
                _this2.setupClose();
            });
        });
    },

    _renderHeroTemplate: function _renderHeroTemplate() {
        if (this.model.site) {
            var trackerNetworksIconName = trackerNetworksIconTemplate(this.model.site.siteRating, this.model.site.isWhitelisted, this.model.site.totalTrackerNetworksCount);

            var trackerNetworksText = trackerNetworksTextTemplate(this.model.site, false);

            this.$hero.html(heroTemplate({
                status: trackerNetworksIconName,
                title: this.model.site.domain,
                subtitle: trackerNetworksText,
                showClose: true
            }));
        }
    },

    _rerender: function _rerender(e) {
        if (e && e.change) {
            if (e.change.attribute === 'isaMajorTrackingNetwork' || e.change.attribute === 'isWhitelisted' || e.change.attribute === 'totalTrackerNetworksCount' || e.change.attribute === 'siteRating') {
                this._renderHeroTemplate();
                this.unbindEvents();
                this.setup();
                this.setupClose();
            }
        }
    }
});

module.exports = TrackerNetworks;

},{"./../models/site-company-list.es6.js":38,"./../models/site.es6.js":39,"./../templates/shared/hero.es6.js":55,"./../templates/shared/tracker-network-icon.es6.js":61,"./../templates/shared/tracker-networks-text.es6.js":62,"./sliding-subview.es6.js":78}]},{},[44]);
