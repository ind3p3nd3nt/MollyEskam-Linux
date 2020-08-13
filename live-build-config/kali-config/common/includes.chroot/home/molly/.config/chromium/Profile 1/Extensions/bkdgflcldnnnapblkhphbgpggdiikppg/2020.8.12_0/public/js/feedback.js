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

},{"global/document":3,"hyperx":6,"on-load":8}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
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
},{"min-document":2}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"hyperscript-attribute-to-property":5}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"assert":7,"global/document":3,"global/window":4}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
'use strict';

module.exports = function (uaString) {
    if (!uaString) uaString = window.navigator.userAgent;

    var browser = void 0;
    var version = void 0;

    try {
        var parsedUaParts = uaString.match(/(Firefox|Chrome|Safari|Edg)\/([0-9]+)/);
        browser = parsedUaParts[1];
        version = parsedUaParts[2];

        // in Safari, the bit immediately after Safari/ is the Webkit version
        // the *actual* version number is elsewhere
        if (browser === 'Safari') {
            version = uaString.match(/Version\/(\d+)/)[1];
        }
    } catch (e) {
        // unlikely, prevent extension from exploding if we don't recognize the UA
        browser = version = '';
    }

    return {
        browser: browser,
        version: version
    };
};

},{}],11:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Model;
var constants = require('../../../data/constants');

function FeedbackForm(attrs) {
    var _this = this;

    attrs = attrs || {};
    attrs.isBrokenSite = attrs.isBrokenSite || false;
    attrs.url = attrs.url || '';
    attrs.message = attrs.message || '';
    attrs.canSubmit = false;
    attrs.submitted = false;

    attrs.browser = attrs.browser || '';
    attrs.browserVersion = attrs.browserVersion || '';

    Parent.call(this, attrs);

    this.updateCanSubmit();

    // grab atb value from background process
    this.fetch({ getSetting: { name: 'atb' } }).then(function (atb) {
        _this.atb = atb;
    });
    this.fetch({ getExtensionVersion: true }).then(function (extensionVersion) {
        _this.extensionVersion = extensionVersion;
    });
    this.fetch({ getSetting: { name: 'tds-etag' } }).then(function (etag) {
        _this.tds = etag;
    });
}

FeedbackForm.prototype = window.$.extend({}, Parent.prototype, {
    modelName: 'feedbackForm',

    submit: function submit() {
        var _this2 = this;

        if (!this.canSubmit || this._submitting) {
            return;
        }

        this._submitting = true;

        window.$.ajax(constants.feedbackUrl, {
            method: 'POST',
            data: {
                reason: this.isBrokenSite ? 'broken_site' : 'general',
                url: this.url || '',
                comment: this.message || '',
                browser: this.browser || '',
                browser_version: this.browserVersion || '',
                v: this.extensionVersion || '',
                atb: this.atb || '',
                tds: this.tsd || ''
            },
            success: function success(data) {
                if (data && data.status === 'success') {
                    _this2.set('submitted', true);
                } else {
                    _this2.set('errored', true);
                }
            },
            error: function error() {
                _this2.set('errored', true);
            }
        });
    },

    toggleBrokenSite: function toggleBrokenSite(val) {
        this.set('isBrokenSite', val);
        this.updateCanSubmit();
        this.reset();
    },

    updateCanSubmit: function updateCanSubmit() {
        if (this.isBrokenSite) {
            this.set('canSubmit', !!(this.url && this.message));
        } else {
            this.set('canSubmit', !!this.message);
        }
    },

    reset: function reset() {
        this.set('url', '');
        this.set('message', '');
        this.set('canSubmit', false);
    }
});

module.exports = FeedbackForm;

},{"../../../data/constants":9}],12:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.Page;
var mixins = require('./mixins/index.es6');
var parseUserAgentString = require('../../shared-utils/parse-user-agent-string.es6.js');
var FeedbackFormView = require('../views/feedback-form.es6');
var FeedbackFormModel = require('../models/feedback-form.es6');

function Feedback(ops) {
    Parent.call(this, ops);
}

Feedback.prototype = window.$.extend({}, Parent.prototype, mixins.setBrowserClassOnBodyTag, mixins.parseQueryString, {

    pageName: 'feedback',

    ready: function ready() {
        Parent.prototype.ready.call(this);
        this.setBrowserClassOnBodyTag();

        var params = this.parseQueryString(window.location.search);
        var browserInfo = parseUserAgentString();

        this.form = new FeedbackFormView({
            appendTo: window.$('.js-feedback-form'),
            model: new FeedbackFormModel({
                isBrokenSite: params.broken,
                url: decodeURIComponent(params.url || ''),
                browser: browserInfo.browser,
                browserVersion: browserInfo.version
            })
        });
    }
});

// kickoff!
window.DDG = window.DDG || {};
window.DDG.page = new Feedback();

},{"../../shared-utils/parse-user-agent-string.es6.js":10,"../models/feedback-form.es6":11,"../views/feedback-form.es6":17,"./mixins/index.es6":14}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
'use strict';

module.exports = {
    setBrowserClassOnBodyTag: require('./chrome-set-browser-class.es6.js'),
    parseQueryString: require('./parse-query-string.es6.js')
};

},{"./chrome-set-browser-class.es6.js":13,"./parse-query-string.es6.js":15}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
'use strict';

var _templateObject = _taggedTemplateLiteral(['<div>\n            <label class=\'frm__label\'>Which website is broken?</label>\n            <input class=\'js-feedback-url frm__input\' type=\'text\' placeholder=\'Copy and paste your URL\' value=\'', '\'/>\n            <label class=\'frm__label\'>Describe the issue you encountered:</label>\n            <textarea class=\'frm__text js-feedback-message\' placeholder=\'Which website content or functionality is broken? Please be as specific as possible.\'></textarea>\n        </div>'], ['<div>\n            <label class=\'frm__label\'>Which website is broken?</label>\n            <input class=\'js-feedback-url frm__input\' type=\'text\' placeholder=\'Copy and paste your URL\' value=\'', '\'/>\n            <label class=\'frm__label\'>Describe the issue you encountered:</label>\n            <textarea class=\'frm__text js-feedback-message\' placeholder=\'Which website content or functionality is broken? Please be as specific as possible.\'></textarea>\n        </div>']),
    _templateObject2 = _taggedTemplateLiteral(['<div>\n            <label class=\'frm__label\'>What do you love? What isn\'t working? How could the extension be improved?</label>\n            <textarea class=\'frm__text js-feedback-message\' placeholder=\'Which features or functionality does your feedback refer to? Please be as specific as possible.\'></textarea>\n        </div>'], ['<div>\n            <label class=\'frm__label\'>What do you love? What isn\'t working? How could the extension be improved?</label>\n            <textarea class=\'frm__text js-feedback-message\' placeholder=\'Which features or functionality does your feedback refer to? Please be as specific as possible.\'></textarea>\n        </div>']),
    _templateObject3 = _taggedTemplateLiteral(['<form class=\'frm\'>\n        <p>Anonymously share some feedback to help us improve DuckDuckGo Privacy Essentials.</p>\n        <label class=\'frm__label\'>\n            <input type=\'checkbox\' class=\'js-feedback-broken-site frm__label__chk\'\n                ', '/>\n            I want to report a broken site\n        </label>\n        ', '\n        <input class=\'btn js-feedback-submit ', '\'\n            type=\'submit\' value=\'Submit\' ', '/>\n    </form>'], ['<form class=\'frm\'>\n        <p>Anonymously share some feedback to help us improve DuckDuckGo Privacy Essentials.</p>\n        <label class=\'frm__label\'>\n            <input type=\'checkbox\' class=\'js-feedback-broken-site frm__label__chk\'\n                ', '/>\n            I want to report a broken site\n        </label>\n        ', '\n        <input class=\'btn js-feedback-submit ', '\'\n            type=\'submit\' value=\'Submit\' ', '/>\n    </form>']),
    _templateObject4 = _taggedTemplateLiteral(['<div>\n            <p>Thank you for your feedback!</p>\n            <p>Your broken site reports help our development team fix these breakages.</p>\n            <p>To fix the issue for the time being, you can disable "Privacy Protection" to add it to your list of unprotected sites.</p>\n        </div>'], ['<div>\n            <p>Thank you for your feedback!</p>\n            <p>Your broken site reports help our development team fix these breakages.</p>\n            <p>To fix the issue for the time being, you can disable "Privacy Protection" to add it to your list of unprotected sites.</p>\n        </div>']),
    _templateObject5 = _taggedTemplateLiteral(['<p>Thank you for your feedback!</p>'], ['<p>Thank you for your feedback!</p>']),
    _templateObject6 = _taggedTemplateLiteral(['<p>Something went wrong when submitting feedback. Please try again later!</p>'], ['<p>Something went wrong when submitting feedback. Please try again later!</p>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var bel = require('bel');

module.exports = function () {
    var fields = void 0;

    if (this.model.errored) {
        return showError();
    }

    if (this.model.submitted) {
        return showThankYou(this.model.isBrokenSite);
    }

    if (this.model.isBrokenSite) {
        fields = bel(_templateObject, this.model.url);
    } else {
        fields = bel(_templateObject2);
    }

    return bel(_templateObject3, this.model.isBrokenSite ? 'checked' : '', fields, this.model.canSubmit ? '' : 'is-disabled', this.model.canSubmit ? '' : 'disabled');
};

function showThankYou(isBrokenSite) {
    if (isBrokenSite) {
        return bel(_templateObject4);
    } else {
        return bel(_templateObject5);
    }
}

function showError() {
    return bel(_templateObject6);
}

},{"bel":1}],17:[function(require,module,exports){
'use strict';

var Parent = window.DDG.base.View;
var feedbackFormTemplate = require('../templates/feedback-form.es6');

function FeedbackForm(ops) {
    this.model = ops.model;
    this.template = feedbackFormTemplate;

    Parent.call(this, ops);

    this._setup();
}

FeedbackForm.prototype = window.$.extend({}, Parent.prototype, {
    _setup: function _setup() {
        this._cacheElems('.js-feedback', ['url', 'message', 'broken-site', 'submit']);

        this.bindEvents([[this.store.subscribe, 'change:feedbackForm', this._onModelChange], [this.$url, 'input', this._onUrlChange], [this.$message, 'input', this._onMessageChange], [this.$brokensite, 'change', this._onBrokenSiteChange], [this.$submit, 'click', this._onSubmitClick]]);
    },

    _onModelChange: function _onModelChange(e) {
        if (e.change.attribute === 'isBrokenSite' || e.change.attribute === 'submitted' || e.change.attribute === 'errored') {
            this.unbindEvents();
            this._rerender();
            this._setup();
        } else if (e.change.attribute === 'canSubmit') {
            this.$submit.toggleClass('is-disabled', !this.model.canSubmit);
            this.$submit.attr('disabled', !this.model.canSubmit);
        }
    },

    _onBrokenSiteChange: function _onBrokenSiteChange(e) {
        this.model.toggleBrokenSite(e.target.checked);
    },

    _onUrlChange: function _onUrlChange() {
        this.model.set('url', this.$url.val());
        this.model.updateCanSubmit();
    },

    _onMessageChange: function _onMessageChange() {
        this.model.set('message', this.$message.val());
        this.model.updateCanSubmit();
    },

    _onSubmitClick: function _onSubmitClick(e) {
        e.preventDefault();

        if (!this.model.canSubmit) {
            return;
        }

        this.model.submit();

        this.$submit.addClass('is-disabled');
        this.$submit.val('Sending...');
    }
});

module.exports = FeedbackForm;

},{"../templates/feedback-form.es6":16}]},{},[12]);
