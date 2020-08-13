(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = {
    Grade: require('./src/classes/grade'),
    Trackers: require('./src/classes/trackers')
}

},{"./src/classes/grade":2,"./src/classes/trackers":3}],2:[function(require,module,exports){
const UNKNOWN_PRIVACY_SCORE = 2

/**
 * Range map data structures:
 *
 * Maps a numeric input to an arbitrary output based on provided ranges
 *
 * `steps` defines the range of inputs for each output,
 * `max` defines what happens if the input is above the given ranges
 * `zero` is a special case for when the input is 0 or falsy
 *
 * For example:
 *
 * zero: 'foo',
 * max: 'qux',
 * steps: [
 *     [1, 'bar'],
 *     [2, 'baz']
 * ]
 *
 * means:
 *
 * input === 0      maps to 'foo'
 * 0 < input < 1    maps to 'bar'
 * 1 <= input < 2   maps to 'baz'
 * input >= 2       maps to 'qux'
 */

const TRACKER_RANGE_MAP = {
    zero: 0,
    max: 10,
    steps: [
        [0.1, 1],
        [1, 2],
        [5, 3],
        [10, 4],
        [15, 5],
        [20, 6],
        [30, 7],
        [45, 8],
        [66, 9]
    ]
}

const GRADE_RANGE_MAP = {
    zero: 'A',
    max: 'D-',
    steps: [
        [2, 'A'],
        [4, 'B+'],
        [10, 'B'],
        [14, 'C+'],
        [20, 'C'],
        [30, 'D']
    ]
}

class Grade {
    constructor (attrs) {
        // defaults
        this.https = false
        this.httpsAutoUpgrade = false
        this.privacyScore = UNKNOWN_PRIVACY_SCORE // unknown

        this.entitiesBlocked = {}
        this.entitiesNotBlocked = {}

        this.scores = null

        // set any values that were passed in
        attrs = attrs || {}

        if (attrs.https) {
            this.setHttps(attrs.https, attrs.httpsAutoUpgrade)
        }
        if (typeof attrs.privacyScore !== 'undefined') {
            this.setPrivacyScore(attrs.privacyScore)
        }
        if (attrs.parentEntity) {
            this.setParentEntity(attrs.parentEntity, attrs.prevalence)
        }
        if (attrs.trackersBlocked) {
            Object.keys(attrs.trackersBlocked).forEach((entityName) => {
                this.addEntityBlocked(entityName, attrs.trackersBlocked[entityName].prevalence)
            })
        }
        if (attrs.trackersNotBlocked) {
            Object.keys(attrs.trackersNotBlocked).forEach((entityName) => {
                this.addEntityNotBlocked(entityName, attrs.trackersNotBlocked[entityName].prevalence)
            })
        }
    }

    setHttps (https, httpsAutoUpgrade) {
        this.scores = null
        this.https = https
        this.httpsAutoUpgrade = httpsAutoUpgrade
    }

    setPrivacyScore (score) {
        this.scores = null
        this.privacyScore = typeof score === 'number' ? score : UNKNOWN_PRIVACY_SCORE
    }

    addEntityBlocked (name, prevalence) {
        if (!name) return

        this.scores = null
        this.entitiesBlocked[name] = prevalence
    }

    addEntityNotBlocked (name, prevalence) {
        if (!name) return

        this.scores = null
        this.entitiesNotBlocked[name] = prevalence
    }

    setParentEntity (name, prevalence) {
        this.scores = null
        this.addEntityNotBlocked(name, prevalence)
    }

    calculate () {
        // HTTPS
        let siteHttpsScore, enhancedHttpsScore

        if (this.httpsAutoUpgrade) {
            siteHttpsScore = 0
            enhancedHttpsScore = 0
        } else if (this.https) {
            siteHttpsScore = 3
            enhancedHttpsScore = 0
        } else {
            siteHttpsScore = 10
            enhancedHttpsScore = 10
        }

        // PRIVACY
        // clamp to 10
        let privacyScore = Math.min(this.privacyScore, 10)

        // TRACKERS
        let siteTrackerScore = 0
        let enhancedTrackerScore = 0

        for (let entity in this.entitiesBlocked) {
            siteTrackerScore += this._normalizeTrackerScore(this.entitiesBlocked[entity])
        }

        for (let entity in this.entitiesNotBlocked) {
            siteTrackerScore += this._normalizeTrackerScore(this.entitiesNotBlocked[entity])
            enhancedTrackerScore += this._normalizeTrackerScore(this.entitiesNotBlocked[entity])
        }

        let siteTotalScore = siteHttpsScore + siteTrackerScore + privacyScore
        let enhancedTotalScore = enhancedHttpsScore + enhancedTrackerScore + privacyScore

        this.scores = {
            site: {
                grade: this._scoreToGrade(siteTotalScore),
                score: siteTotalScore,
                trackerScore: siteTrackerScore,
                httpsScore: siteHttpsScore,
                privacyScore: privacyScore
            },
            enhanced: {
                grade: this._scoreToGrade(enhancedTotalScore),
                score: enhancedTotalScore,
                trackerScore: enhancedTrackerScore,
                httpsScore: enhancedHttpsScore,
                privacyScore: privacyScore
            }
        }
    }

    get () {
        if (!this.scores) this.calculate()

        return this.scores
    }

    _getValueFromRangeMap (value, rangeMapData) {
        let steps = rangeMapData.steps

        if (!value || value <= 0) {
            return rangeMapData.zero
        }

        if (value >= steps[steps.length - 1][0]) {
            return rangeMapData.max
        }

        for (let i = 0; i < steps.length; i++) {
            if (value < steps[i][0]) {
                return steps[i][1]
            }
        }
    }

    _normalizeTrackerScore (pct) {
        return this._getValueFromRangeMap(pct, TRACKER_RANGE_MAP)
    }

    _scoreToGrade (score) {
        return this._getValueFromRangeMap(score, GRADE_RANGE_MAP)
    }
}

module.exports = Grade

},{}],3:[function(require,module,exports){
(function (Buffer){
(function () {
    class Trackers {
        constructor (ops) {
            this.tldjs = ops.tldjs
            this.utils = ops.utils
        }

    setLists (lists) {
        lists.forEach(list => {
            if (list.name === 'tds') {
                this.entityList = this.processEntityList(list.data.entities)
                this.trackerList = this.processTrackerList(list.data.trackers)
                this.domains = list.data.domains
            } else if (list.name === 'surrogates') {
                this.surrogateList = this.processSurrogateList(list.data)
            }
        })
    }

    processTrackerList (data) {
        for (let name in data) {
            if (data[name].rules) {
                for (let i in data[name].rules) {
                    data[name].rules[i].rule = new RegExp(data[name].rules[i].rule, 'ig')
                }
            }
        }
        return data
    }

    processEntityList (data) {
        const processed = {}
        for (let entity in data) {
            data[entity].domains.forEach(domain => {
                processed[domain] = entity
            })
        }
        return processed
    }

    processSurrogateList (text) {
        const b64dataheader = 'data:application/javascript;base64,'
        const surrogateList = {}
        const splitSurrogateList = text.trim().split('\n\n')

        splitSurrogateList.forEach(sur => {
            // remove comment lines
            const lines = sur.split('\n').filter((line) => {
                return !(/^#.*/).test(line)
            })

            // remove first line, store it
            const firstLine = lines.shift()

            // take identifier from first line
            const pattern = firstLine.split(' ')[0].split('/')[1]
            const b64surrogate = Buffer.from(lines.join('\n').toString(), 'binary').toString('base64')
            surrogateList[pattern] = b64dataheader + b64surrogate
        })
        return surrogateList
    }

    getTrackerData (urlToCheck, siteUrl, request, ops) {
        ops = ops || {}

        if (!this.entityList || !this.trackerList) {
            throw new Error('tried to detect trackers before rules were loaded')
        }

        // single object with all of our requeest and site data split and
        // processed into the correct format for the tracker set/get functions.
        // This avoids repeat calls to split and util functions.
        const requestData = {
            ops: ops,
            siteUrl: siteUrl,
            request: request,
            siteDomain: this.tldjs.parse(siteUrl).domain,
            siteUrlSplit: this.utils.extractHostFromURL(siteUrl).split('.'),
            urlToCheck: urlToCheck,
            urlToCheckDomain: this.tldjs.parse(urlToCheck).domain,
            urlToCheckSplit: this.utils.extractHostFromURL(urlToCheck).split('.')
        }

        // finds a tracker definition by iterating over the whole trackerList and finding the matching tracker.
        const tracker = this.findTracker(requestData)

        if (!tracker) {
            return null
        }

        // finds a matching rule by iterating over the rules in tracker.data and sets redirectUrl.
        const matchedRule = this.findRule(tracker, requestData)

        const redirectUrl = (matchedRule && matchedRule.surrogate) ? this.surrogateList[matchedRule.surrogate] : false

        // sets tracker.exception by looking at tracker.rule exceptions (if any)
        const matchedRuleException = matchedRule ? this.matchesRuleDefinition(matchedRule, 'exceptions', requestData) : false

        const trackerOwner = this.findTrackerOwner(requestData.urlToCheckDomain)

        const websiteOwner = this.findWebsiteOwner(requestData)

        const firstParty = (trackerOwner && websiteOwner) ? trackerOwner === websiteOwner : false

        const fullTrackerDomain = requestData.urlToCheckSplit.join('.')

        const {action, reason} = this.getAction({
            firstParty,
            matchedRule,
            matchedRuleException,
            defaultAction: tracker.default,
            redirectUrl
        })

        return {
            action,
            reason,
            firstParty,
            redirectUrl,
            matchedRule,
            matchedRuleException,
            tracker,
            fullTrackerDomain
        }
    }

    /*
     * Pull subdomains off of the reqeust rule and look for a matching tracker object in our data
     */
    findTracker (requestData) {
        let urlList = Array.from(requestData.urlToCheckSplit)

        while (urlList.length > 1) {
            let trackerDomain = urlList.join('.')
            urlList.shift()

            const matchedTracker = this.trackerList[trackerDomain]
            if (matchedTracker) {
                return matchedTracker
            }
        }
    }

    findTrackerOwner (trackerDomain) {
        return this.entityList[trackerDomain]
    }

    /*
    * Set parent and first party values on tracker
    */
    findWebsiteOwner (requestData) {
        // find the site owner
        let siteUrlList = Array.from(requestData.siteUrlSplit)

        while (siteUrlList.length > 1) {
            let siteToCheck = siteUrlList.join('.')
            siteUrlList.shift()

            if (this.entityList[siteToCheck]) {
                return this.entityList[siteToCheck]
            }
        }
    }

    /*
     * Iterate through a tracker rule list and return the first matching rule, if any.
     */
    findRule (tracker, requestData) {
        let matchedRule = null
        // Find a matching rule from this tracker
        if (tracker.rules && tracker.rules.length) {
            tracker.rules.some(ruleObj => {
                if (this.requestMatchesRule(requestData, ruleObj)) {
                    matchedRule = ruleObj
                    return true
                }
            })
        }
        return matchedRule
    }

    requestMatchesRule (requestData, ruleObj) {
        if (requestData.urlToCheck.match(ruleObj.rule)) {
            if (ruleObj.options) {
                return this.matchesRuleDefinition(ruleObj, 'options', requestData)
            } else {
                return true
            }
        } else {
            return false
        }
    }

    /* Check the matched rule  options against the request data
    *  return: true (all options matched)
    */
    matchesRuleDefinition (rule, type, requestData) {
        if (!rule[type]) {
            return false
        }

        const ruleDefinition = rule[type]

        const matchTypes = (ruleDefinition.types && ruleDefinition.types.length)
            ? ruleDefinition.types.includes(requestData.request.type) : true

        const matchDomains = (ruleDefinition.domains && ruleDefinition.domains.length)
            ? ruleDefinition.domains.some(domain => domain.match(requestData.siteDomain)) : true

        return (matchTypes && matchDomains)
    }

    getAction (tracker) {
        // Determine the blocking decision and reason.
        let action, reason
        if (tracker.firstParty) {
            action = 'ignore'
            reason = 'first party'
        } else if (tracker.matchedRuleException) {
            action = 'ignore'
            reason = 'matched rule - exception'
        } else if (!tracker.matchedRule && tracker.defaultAction === 'ignore') {
            action = 'ignore'
            reason = 'default ignore'
        } else if (tracker.matchedRule && tracker.matchedRule.action === 'ignore') {
            action = 'ignore'
            reason = 'matched rule - ignore'
        } else if (!tracker.matchedRule && tracker.defaultAction === 'block') {
            action = 'block'
            reason = 'default block'
        } else if (tracker.matchedRule) {
            if (tracker.redirectUrl) {
                action = 'redirect'
                reason = 'matched rule - surrogate'
            } else {
                action = 'block'
                reason = 'matched rule - block'
            }
        }

        return {action, reason}
    }
    }
    
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = Trackers
    else
        window.Trackers = Trackers

})()

}).call(this,require("buffer").Buffer)
},{"buffer":7}],4:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],5:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":4,"ieee754":9}],8:[function(require,module,exports){
(function (global,setImmediate){
/*
 * Dexie.js - a minimalistic wrapper for IndexedDB
 * ===============================================
 *
 * By David Fahlander, david.fahlander@gmail.com
 *
 * Version 2.0.4, Fri May 25 2018
 *
 * http://dexie.org
 *
 * Apache License Version 2.0, January 2004, http://www.apache.org/licenses/
 */
 
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Dexie = factory());
}(this, (function () { 'use strict';

var keys = Object.keys;
var isArray = Array.isArray;
var _global = typeof self !== 'undefined' ? self :
    typeof window !== 'undefined' ? window :
        global;
function extend(obj, extension) {
    if (typeof extension !== 'object')
        return obj;
    keys(extension).forEach(function (key) {
        obj[key] = extension[key];
    });
    return obj;
}
var getProto = Object.getPrototypeOf;
var _hasOwn = {}.hasOwnProperty;
function hasOwn(obj, prop) {
    return _hasOwn.call(obj, prop);
}
function props(proto, extension) {
    if (typeof extension === 'function')
        extension = extension(getProto(proto));
    keys(extension).forEach(function (key) {
        setProp(proto, key, extension[key]);
    });
}
var defineProperty = Object.defineProperty;
function setProp(obj, prop, functionOrGetSet, options) {
    defineProperty(obj, prop, extend(functionOrGetSet && hasOwn(functionOrGetSet, "get") && typeof functionOrGetSet.get === 'function' ?
        { get: functionOrGetSet.get, set: functionOrGetSet.set, configurable: true } :
        { value: functionOrGetSet, configurable: true, writable: true }, options));
}
function derive(Child) {
    return {
        from: function (Parent) {
            Child.prototype = Object.create(Parent.prototype);
            setProp(Child.prototype, "constructor", Child);
            return {
                extend: props.bind(null, Child.prototype)
            };
        }
    };
}
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
function getPropertyDescriptor(obj, prop) {
    var pd = getOwnPropertyDescriptor(obj, prop), proto;
    return pd || (proto = getProto(obj)) && getPropertyDescriptor(proto, prop);
}
var _slice = [].slice;
function slice(args, start, end) {
    return _slice.call(args, start, end);
}
function override(origFunc, overridedFactory) {
    return overridedFactory(origFunc);
}
function assert(b) {
    if (!b)
        throw new Error("Assertion Failed");
}
function asap(fn) {
    if (_global.setImmediate)
        setImmediate(fn);
    else
        setTimeout(fn, 0);
}

/** Generate an object (hash map) based on given array.
 * @param extractor Function taking an array item and its index and returning an array of 2 items ([key, value]) to
 *        instert on the resulting object for each item in the array. If this function returns a falsy value, the
 *        current item wont affect the resulting object.
 */
function arrayToObject(array, extractor) {
    return array.reduce(function (result, item, i) {
        var nameAndValue = extractor(item, i);
        if (nameAndValue)
            result[nameAndValue[0]] = nameAndValue[1];
        return result;
    }, {});
}
function trycatcher(fn, reject) {
    return function () {
        try {
            fn.apply(this, arguments);
        }
        catch (e) {
            reject(e);
        }
    };
}
function tryCatch(fn, onerror, args) {
    try {
        fn.apply(null, args);
    }
    catch (ex) {
        onerror && onerror(ex);
    }
}
function getByKeyPath(obj, keyPath) {
    // http://www.w3.org/TR/IndexedDB/#steps-for-extracting-a-key-from-a-value-using-a-key-path
    if (hasOwn(obj, keyPath))
        return obj[keyPath]; // This line is moved from last to first for optimization purpose.
    if (!keyPath)
        return obj;
    if (typeof keyPath !== 'string') {
        var rv = [];
        for (var i = 0, l = keyPath.length; i < l; ++i) {
            var val = getByKeyPath(obj, keyPath[i]);
            rv.push(val);
        }
        return rv;
    }
    var period = keyPath.indexOf('.');
    if (period !== -1) {
        var innerObj = obj[keyPath.substr(0, period)];
        return innerObj === undefined ? undefined : getByKeyPath(innerObj, keyPath.substr(period + 1));
    }
    return undefined;
}
function setByKeyPath(obj, keyPath, value) {
    if (!obj || keyPath === undefined)
        return;
    if ('isFrozen' in Object && Object.isFrozen(obj))
        return;
    if (typeof keyPath !== 'string' && 'length' in keyPath) {
        assert(typeof value !== 'string' && 'length' in value);
        for (var i = 0, l = keyPath.length; i < l; ++i) {
            setByKeyPath(obj, keyPath[i], value[i]);
        }
    }
    else {
        var period = keyPath.indexOf('.');
        if (period !== -1) {
            var currentKeyPath = keyPath.substr(0, period);
            var remainingKeyPath = keyPath.substr(period + 1);
            if (remainingKeyPath === "")
                if (value === undefined)
                    delete obj[currentKeyPath];
                else
                    obj[currentKeyPath] = value;
            else {
                var innerObj = obj[currentKeyPath];
                if (!innerObj)
                    innerObj = (obj[currentKeyPath] = {});
                setByKeyPath(innerObj, remainingKeyPath, value);
            }
        }
        else {
            if (value === undefined)
                delete obj[keyPath];
            else
                obj[keyPath] = value;
        }
    }
}
function delByKeyPath(obj, keyPath) {
    if (typeof keyPath === 'string')
        setByKeyPath(obj, keyPath, undefined);
    else if ('length' in keyPath)
        [].map.call(keyPath, function (kp) {
            setByKeyPath(obj, kp, undefined);
        });
}
function shallowClone(obj) {
    var rv = {};
    for (var m in obj) {
        if (hasOwn(obj, m))
            rv[m] = obj[m];
    }
    return rv;
}
var concat = [].concat;
function flatten(a) {
    return concat.apply([], a);
}
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
var intrinsicTypes = "Boolean,String,Date,RegExp,Blob,File,FileList,ArrayBuffer,DataView,Uint8ClampedArray,ImageData,Map,Set"
    .split(',').concat(flatten([8, 16, 32, 64].map(function (num) { return ["Int", "Uint", "Float"].map(function (t) { return t + num + "Array"; }); }))).filter(function (t) { return _global[t]; }).map(function (t) { return _global[t]; });
function deepClone(any) {
    if (!any || typeof any !== 'object')
        return any;
    var rv;
    if (isArray(any)) {
        rv = [];
        for (var i = 0, l = any.length; i < l; ++i) {
            rv.push(deepClone(any[i]));
        }
    }
    else if (intrinsicTypes.indexOf(any.constructor) >= 0) {
        rv = any;
    }
    else {
        rv = any.constructor ? Object.create(any.constructor.prototype) : {};
        for (var prop in any) {
            if (hasOwn(any, prop)) {
                rv[prop] = deepClone(any[prop]);
            }
        }
    }
    return rv;
}
function getObjectDiff(a, b, rv, prfx) {
    // Compares objects a and b and produces a diff object.
    rv = rv || {};
    prfx = prfx || '';
    keys(a).forEach(function (prop) {
        if (!hasOwn(b, prop))
            rv[prfx + prop] = undefined; // Property removed
        else {
            var ap = a[prop], bp = b[prop];
            if (typeof ap === 'object' && typeof bp === 'object' &&
                ap && bp &&
                // Now compare constructors are same (not equal because wont work in Safari)
                ('' + ap.constructor) === ('' + bp.constructor))
                // Same type of object but its properties may have changed
                getObjectDiff(ap, bp, rv, prfx + prop + ".");
            else if (ap !== bp)
                rv[prfx + prop] = b[prop]; // Primitive value changed
        }
    });
    keys(b).forEach(function (prop) {
        if (!hasOwn(a, prop)) {
            rv[prfx + prop] = b[prop]; // Property added
        }
    });
    return rv;
}
// If first argument is iterable or array-like, return it as an array
var iteratorSymbol = typeof Symbol !== 'undefined' && Symbol.iterator;
var getIteratorOf = iteratorSymbol ? function (x) {
    var i;
    return x != null && (i = x[iteratorSymbol]) && i.apply(x);
} : function () { return null; };
var NO_CHAR_ARRAY = {};
// Takes one or several arguments and returns an array based on the following criteras:
// * If several arguments provided, return arguments converted to an array in a way that
//   still allows javascript engine to optimize the code.
// * If single argument is an array, return a clone of it.
// * If this-pointer equals NO_CHAR_ARRAY, don't accept strings as valid iterables as a special
//   case to the two bullets below.
// * If single argument is an iterable, convert it to an array and return the resulting array.
// * If single argument is array-like (has length of type number), convert it to an array.
function getArrayOf(arrayLike) {
    var i, a, x, it;
    if (arguments.length === 1) {
        if (isArray(arrayLike))
            return arrayLike.slice();
        if (this === NO_CHAR_ARRAY && typeof arrayLike === 'string')
            return [arrayLike];
        if ((it = getIteratorOf(arrayLike))) {
            a = [];
            while ((x = it.next()), !x.done)
                a.push(x.value);
            return a;
        }
        if (arrayLike == null)
            return [arrayLike];
        i = arrayLike.length;
        if (typeof i === 'number') {
            a = new Array(i);
            while (i--)
                a[i] = arrayLike[i];
            return a;
        }
        return [arrayLike];
    }
    i = arguments.length;
    a = new Array(i);
    while (i--)
        a[i] = arguments[i];
    return a;
}

// By default, debug will be true only if platform is a web platform and its page is served from localhost.
// When debug = true, error's stacks will contain asyncronic long stacks.
var debug = typeof location !== 'undefined' &&
    // By default, use debug mode if served from localhost.
    /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
function setDebug(value, filter) {
    debug = value;
    libraryFilter = filter;
}
var libraryFilter = function () { return true; };
var NEEDS_THROW_FOR_STACK = !new Error("").stack;
function getErrorWithStack() {
    "use strict";
    if (NEEDS_THROW_FOR_STACK)
        try {
            // Doing something naughty in strict mode here to trigger a specific error
            // that can be explicitely ignored in debugger's exception settings.
            // If we'd just throw new Error() here, IE's debugger's exception settings
            // will just consider it as "exception thrown by javascript code" which is
            // something you wouldn't want it to ignore.
            getErrorWithStack.arguments;
            throw new Error(); // Fallback if above line don't throw.
        }
        catch (e) {
            return e;
        }
    return new Error();
}
function prettyStack(exception, numIgnoredFrames) {
    var stack = exception.stack;
    if (!stack)
        return "";
    numIgnoredFrames = (numIgnoredFrames || 0);
    if (stack.indexOf(exception.name) === 0)
        numIgnoredFrames += (exception.name + exception.message).split('\n').length;
    return stack.split('\n')
        .slice(numIgnoredFrames)
        .filter(libraryFilter)
        .map(function (frame) { return "\n" + frame; })
        .join('');
}
function deprecated(what, fn) {
    return function () {
        console.warn(what + " is deprecated. See https://github.com/dfahlander/Dexie.js/wiki/Deprecations. " + prettyStack(getErrorWithStack(), 1));
        return fn.apply(this, arguments);
    };
}

var dexieErrorNames = [
    'Modify',
    'Bulk',
    'OpenFailed',
    'VersionChange',
    'Schema',
    'Upgrade',
    'InvalidTable',
    'MissingAPI',
    'NoSuchDatabase',
    'InvalidArgument',
    'SubTransaction',
    'Unsupported',
    'Internal',
    'DatabaseClosed',
    'PrematureCommit',
    'ForeignAwait'
];
var idbDomErrorNames = [
    'Unknown',
    'Constraint',
    'Data',
    'TransactionInactive',
    'ReadOnly',
    'Version',
    'NotFound',
    'InvalidState',
    'InvalidAccess',
    'Abort',
    'Timeout',
    'QuotaExceeded',
    'Syntax',
    'DataClone'
];
var errorList = dexieErrorNames.concat(idbDomErrorNames);
var defaultTexts = {
    VersionChanged: "Database version changed by other database connection",
    DatabaseClosed: "Database has been closed",
    Abort: "Transaction aborted",
    TransactionInactive: "Transaction has already completed or failed"
};
//
// DexieError - base class of all out exceptions.
//
function DexieError(name, msg) {
    // Reason we don't use ES6 classes is because:
    // 1. It bloats transpiled code and increases size of minified code.
    // 2. It doesn't give us much in this case.
    // 3. It would require sub classes to call super(), which
    //    is not needed when deriving from Error.
    this._e = getErrorWithStack();
    this.name = name;
    this.message = msg;
}
derive(DexieError).from(Error).extend({
    stack: {
        get: function () {
            return this._stack ||
                (this._stack = this.name + ": " + this.message + prettyStack(this._e, 2));
        }
    },
    toString: function () { return this.name + ": " + this.message; }
});
function getMultiErrorMessage(msg, failures) {
    return msg + ". Errors: " + failures
        .map(function (f) { return f.toString(); })
        .filter(function (v, i, s) { return s.indexOf(v) === i; }) // Only unique error strings
        .join('\n');
}
//
// ModifyError - thrown in Collection.modify()
// Specific constructor because it contains members failures and failedKeys.
//
function ModifyError(msg, failures, successCount, failedKeys) {
    this._e = getErrorWithStack();
    this.failures = failures;
    this.failedKeys = failedKeys;
    this.successCount = successCount;
}
derive(ModifyError).from(DexieError);
function BulkError(msg, failures) {
    this._e = getErrorWithStack();
    this.name = "BulkError";
    this.failures = failures;
    this.message = getMultiErrorMessage(msg, failures);
}
derive(BulkError).from(DexieError);
//
//
// Dynamically generate error names and exception classes based
// on the names in errorList.
//
//
// Map of {ErrorName -> ErrorName + "Error"}
var errnames = errorList.reduce(function (obj, name) { return (obj[name] = name + "Error", obj); }, {});
// Need an alias for DexieError because we're gonna create subclasses with the same name.
var BaseException = DexieError;
// Map of {ErrorName -> exception constructor}
var exceptions = errorList.reduce(function (obj, name) {
    // Let the name be "DexieError" because this name may
    // be shown in call stack and when debugging. DexieError is
    // the most true name because it derives from DexieError,
    // and we cannot change Function.name programatically without
    // dynamically create a Function object, which would be considered
    // 'eval-evil'.
    var fullName = name + "Error";
    function DexieError(msgOrInner, inner) {
        this._e = getErrorWithStack();
        this.name = fullName;
        if (!msgOrInner) {
            this.message = defaultTexts[name] || fullName;
            this.inner = null;
        }
        else if (typeof msgOrInner === 'string') {
            this.message = msgOrInner;
            this.inner = inner || null;
        }
        else if (typeof msgOrInner === 'object') {
            this.message = msgOrInner.name + " " + msgOrInner.message;
            this.inner = msgOrInner;
        }
    }
    derive(DexieError).from(BaseException);
    obj[name] = DexieError;
    return obj;
}, {});
// Use ECMASCRIPT standard exceptions where applicable:
exceptions.Syntax = SyntaxError;
exceptions.Type = TypeError;
exceptions.Range = RangeError;
var exceptionMap = idbDomErrorNames.reduce(function (obj, name) {
    obj[name + "Error"] = exceptions[name];
    return obj;
}, {});
function mapError(domError, message) {
    if (!domError || domError instanceof DexieError || domError instanceof TypeError || domError instanceof SyntaxError || !domError.name || !exceptionMap[domError.name])
        return domError;
    var rv = new exceptionMap[domError.name](message || domError.message, domError);
    if ("stack" in domError) {
        // Derive stack from inner exception if it has a stack
        setProp(rv, "stack", { get: function () {
                return this.inner.stack;
            } });
    }
    return rv;
}
var fullNameExceptions = errorList.reduce(function (obj, name) {
    if (["Syntax", "Type", "Range"].indexOf(name) === -1)
        obj[name + "Error"] = exceptions[name];
    return obj;
}, {});
fullNameExceptions.ModifyError = ModifyError;
fullNameExceptions.DexieError = DexieError;
fullNameExceptions.BulkError = BulkError;

function nop() { }
function mirror(val) { return val; }
function pureFunctionChain(f1, f2) {
    // Enables chained events that takes ONE argument and returns it to the next function in chain.
    // This pattern is used in the hook("reading") event.
    if (f1 == null || f1 === mirror)
        return f2;
    return function (val) {
        return f2(f1(val));
    };
}
function callBoth(on1, on2) {
    return function () {
        on1.apply(this, arguments);
        on2.apply(this, arguments);
    };
}
function hookCreatingChain(f1, f2) {
    // Enables chained events that takes several arguments and may modify first argument by making a modification and then returning the same instance.
    // This pattern is used in the hook("creating") event.
    if (f1 === nop)
        return f2;
    return function () {
        var res = f1.apply(this, arguments);
        if (res !== undefined)
            arguments[0] = res;
        var onsuccess = this.onsuccess, // In case event listener has set this.onsuccess
        onerror = this.onerror; // In case event listener has set this.onerror
        this.onsuccess = null;
        this.onerror = null;
        var res2 = f2.apply(this, arguments);
        if (onsuccess)
            this.onsuccess = this.onsuccess ? callBoth(onsuccess, this.onsuccess) : onsuccess;
        if (onerror)
            this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
        return res2 !== undefined ? res2 : res;
    };
}
function hookDeletingChain(f1, f2) {
    if (f1 === nop)
        return f2;
    return function () {
        f1.apply(this, arguments);
        var onsuccess = this.onsuccess, // In case event listener has set this.onsuccess
        onerror = this.onerror; // In case event listener has set this.onerror
        this.onsuccess = this.onerror = null;
        f2.apply(this, arguments);
        if (onsuccess)
            this.onsuccess = this.onsuccess ? callBoth(onsuccess, this.onsuccess) : onsuccess;
        if (onerror)
            this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
    };
}
function hookUpdatingChain(f1, f2) {
    if (f1 === nop)
        return f2;
    return function (modifications) {
        var res = f1.apply(this, arguments);
        extend(modifications, res); // If f1 returns new modifications, extend caller's modifications with the result before calling next in chain.
        var onsuccess = this.onsuccess, // In case event listener has set this.onsuccess
        onerror = this.onerror; // In case event listener has set this.onerror
        this.onsuccess = null;
        this.onerror = null;
        var res2 = f2.apply(this, arguments);
        if (onsuccess)
            this.onsuccess = this.onsuccess ? callBoth(onsuccess, this.onsuccess) : onsuccess;
        if (onerror)
            this.onerror = this.onerror ? callBoth(onerror, this.onerror) : onerror;
        return res === undefined ?
            (res2 === undefined ? undefined : res2) :
            (extend(res, res2));
    };
}
function reverseStoppableEventChain(f1, f2) {
    if (f1 === nop)
        return f2;
    return function () {
        if (f2.apply(this, arguments) === false)
            return false;
        return f1.apply(this, arguments);
    };
}

function promisableChain(f1, f2) {
    if (f1 === nop)
        return f2;
    return function () {
        var res = f1.apply(this, arguments);
        if (res && typeof res.then === 'function') {
            var thiz = this, i = arguments.length, args = new Array(i);
            while (i--)
                args[i] = arguments[i];
            return res.then(function () {
                return f2.apply(thiz, args);
            });
        }
        return f2.apply(this, arguments);
    };
}

/*
 * Copyright (c) 2014-2017 David Fahlander
 * Apache License Version 2.0, January 2004, http://www.apache.org/licenses/LICENSE-2.0
 */
//
// Promise and Zone (PSD) for Dexie library
//
// I started out writing this Promise class by copying promise-light (https://github.com/taylorhakes/promise-light) by
// https://github.com/taylorhakes - an A+ and ECMASCRIPT 6 compliant Promise implementation.
//
// In previous versions this was fixed by not calling setTimeout when knowing that the resolve() or reject() came from another
// tick. In Dexie v1.4.0, I've rewritten the Promise class entirely. Just some fragments of promise-light is left. I use
// another strategy now that simplifies everything a lot: to always execute callbacks in a new micro-task, but have an own micro-task
// engine that is indexedDB compliant across all browsers.
// Promise class has also been optimized a lot with inspiration from bluebird - to avoid closures as much as possible.
// Also with inspiration from bluebird, asyncronic stacks in debug mode.
//
// Specific non-standard features of this Promise class:
// * Custom zone support (a.k.a. PSD) with ability to keep zones also when using native promises as well as
//   native async / await.
// * Promise.follow() method built upon the custom zone engine, that allows user to track all promises created from current stack frame
//   and below + all promises that those promises creates or awaits.
// * Detect any unhandled promise in a PSD-scope (PSD.onunhandled). 
//
// David Fahlander, https://github.com/dfahlander
//
// Just a pointer that only this module knows about.
// Used in Promise constructor to emulate a private constructor.
var INTERNAL = {};
// Async stacks (long stacks) must not grow infinitely.
var LONG_STACKS_CLIP_LIMIT = 100;
var MAX_LONG_STACKS = 20;
var ZONE_ECHO_LIMIT = 7;
var nativePromiseInstanceAndProto = (function () {
    try {
        // Be able to patch native async functions
        return new Function("let F=async ()=>{},p=F();return [p,Object.getPrototypeOf(p),Promise.resolve(),F.constructor];")();
    }
    catch (e) {
        var P = _global.Promise;
        return P ?
            [P.resolve(), P.prototype, P.resolve()] :
            [];
    }
})();
var resolvedNativePromise = nativePromiseInstanceAndProto[0];
var nativePromiseProto = nativePromiseInstanceAndProto[1];
var resolvedGlobalPromise = nativePromiseInstanceAndProto[2];
var nativePromiseThen = nativePromiseProto && nativePromiseProto.then;
var NativePromise = resolvedNativePromise && resolvedNativePromise.constructor;
var AsyncFunction = nativePromiseInstanceAndProto[3];
var patchGlobalPromise = !!resolvedGlobalPromise;
var stack_being_generated = false;
/* The default function used only for the very first promise in a promise chain.
   As soon as then promise is resolved or rejected, all next tasks will be executed in micro ticks
   emulated in this module. For indexedDB compatibility, this means that every method needs to
   execute at least one promise before doing an indexedDB operation. Dexie will always call
   db.ready().then() for every operation to make sure the indexedDB event is started in an
   indexedDB-compatible emulated micro task loop.
*/
var schedulePhysicalTick = resolvedGlobalPromise ?
    function () { resolvedGlobalPromise.then(physicalTick); }
    :
        _global.setImmediate ?
            // setImmediate supported. Those modern platforms also supports Function.bind().
            setImmediate.bind(null, physicalTick) :
            _global.MutationObserver ?
                // MutationObserver supported
                function () {
                    var hiddenDiv = document.createElement("div");
                    (new MutationObserver(function () {
                        physicalTick();
                        hiddenDiv = null;
                    })).observe(hiddenDiv, { attributes: true });
                    hiddenDiv.setAttribute('i', '1');
                } :
                // No support for setImmediate or MutationObserver. No worry, setTimeout is only called
                // once time. Every tick that follows will be our emulated micro tick.
                // Could have uses setTimeout.bind(null, 0, physicalTick) if it wasnt for that FF13 and below has a bug 
                function () { setTimeout(physicalTick, 0); };
// Configurable through Promise.scheduler.
// Don't export because it would be unsafe to let unknown
// code call it unless they do try..catch within their callback.
// This function can be retrieved through getter of Promise.scheduler though,
// but users must not do Promise.scheduler = myFuncThatThrowsException
var asap$1 = function (callback, args) {
    microtickQueue.push([callback, args]);
    if (needsNewPhysicalTick) {
        schedulePhysicalTick();
        needsNewPhysicalTick = false;
    }
};
var isOutsideMicroTick = true;
var needsNewPhysicalTick = true;
var unhandledErrors = [];
var rejectingErrors = [];
var currentFulfiller = null;
var rejectionMapper = mirror; // Remove in next major when removing error mapping of DOMErrors and DOMExceptions
var globalPSD = {
    id: 'global',
    global: true,
    ref: 0,
    unhandleds: [],
    onunhandled: globalError,
    pgp: false,
    env: {},
    finalize: function () {
        this.unhandleds.forEach(function (uh) {
            try {
                globalError(uh[0], uh[1]);
            }
            catch (e) { }
        });
    }
};
var PSD = globalPSD;
var microtickQueue = []; // Callbacks to call in this or next physical tick.
var numScheduledCalls = 0; // Number of listener-calls left to do in this physical tick.
var tickFinalizers = []; // Finalizers to call when there are no more async calls scheduled within current physical tick.
function Promise(fn) {
    if (typeof this !== 'object')
        throw new TypeError('Promises must be constructed via new');
    this._listeners = [];
    this.onuncatched = nop; // Deprecate in next major. Not needed. Better to use global error handler.
    // A library may set `promise._lib = true;` after promise is created to make resolve() or reject()
    // execute the microtask engine implicitely within the call to resolve() or reject().
    // To remain A+ compliant, a library must only set `_lib=true` if it can guarantee that the stack
    // only contains library code when calling resolve() or reject().
    // RULE OF THUMB: ONLY set _lib = true for promises explicitely resolving/rejecting directly from
    // global scope (event handler, timer etc)!
    this._lib = false;
    // Current async scope
    var psd = (this._PSD = PSD);
    if (debug) {
        this._stackHolder = getErrorWithStack();
        this._prev = null;
        this._numPrev = 0; // Number of previous promises (for long stacks)
    }
    if (typeof fn !== 'function') {
        if (fn !== INTERNAL)
            throw new TypeError('Not a function');
        // Private constructor (INTERNAL, state, value).
        // Used internally by Promise.resolve() and Promise.reject().
        this._state = arguments[1];
        this._value = arguments[2];
        if (this._state === false)
            handleRejection(this, this._value); // Map error, set stack and addPossiblyUnhandledError().
        return;
    }
    this._state = null; // null (=pending), false (=rejected) or true (=resolved)
    this._value = null; // error or result
    ++psd.ref; // Refcounting current scope
    executePromiseTask(this, fn);
}
// Prepare a property descriptor to put onto Promise.prototype.then
var thenProp = {
    get: function () {
        var psd = PSD, microTaskId = totalEchoes;
        function then(onFulfilled, onRejected) {
            var _this = this;
            var possibleAwait = !psd.global && (psd !== PSD || microTaskId !== totalEchoes);
            if (possibleAwait)
                decrementExpectedAwaits();
            var rv = new Promise(function (resolve, reject) {
                propagateToListener(_this, new Listener(nativeAwaitCompatibleWrap(onFulfilled, psd, possibleAwait), nativeAwaitCompatibleWrap(onRejected, psd, possibleAwait), resolve, reject, psd));
            });
            debug && linkToPreviousPromise(rv, this);
            return rv;
        }
        then.prototype = INTERNAL; // For idempotense, see setter below.
        return then;
    },
    // Be idempotent and allow another framework (such as zone.js or another instance of a Dexie.Promise module) to replace Promise.prototype.then
    // and when that framework wants to restore the original property, we must identify that and restore the original property descriptor.
    set: function (value) {
        setProp(this, 'then', value && value.prototype === INTERNAL ?
            thenProp : // Restore to original property descriptor.
            {
                get: function () {
                    return value; // Getter returning provided value (behaves like value is just changed)
                },
                set: thenProp.set // Keep a setter that is prepared to restore original.
            });
    }
};
props(Promise.prototype, {
    then: thenProp,
    _then: function (onFulfilled, onRejected) {
        // A little tinier version of then() that don't have to create a resulting promise.
        propagateToListener(this, new Listener(null, null, onFulfilled, onRejected, PSD));
    },
    catch: function (onRejected) {
        if (arguments.length === 1)
            return this.then(null, onRejected);
        // First argument is the Error type to catch
        var type = arguments[0], handler = arguments[1];
        return typeof type === 'function' ? this.then(null, function (err) {
            // Catching errors by its constructor type (similar to java / c++ / c#)
            // Sample: promise.catch(TypeError, function (e) { ... });
            return err instanceof type ? handler(err) : PromiseReject(err);
        })
            : this.then(null, function (err) {
                // Catching errors by the error.name property. Makes sense for indexedDB where error type
                // is always DOMError but where e.name tells the actual error type.
                // Sample: promise.catch('ConstraintError', function (e) { ... });
                return err && err.name === type ? handler(err) : PromiseReject(err);
            });
    },
    finally: function (onFinally) {
        return this.then(function (value) {
            onFinally();
            return value;
        }, function (err) {
            onFinally();
            return PromiseReject(err);
        });
    },
    stack: {
        get: function () {
            if (this._stack)
                return this._stack;
            try {
                stack_being_generated = true;
                var stacks = getStack(this, [], MAX_LONG_STACKS);
                var stack = stacks.join("\nFrom previous: ");
                if (this._state !== null)
                    this._stack = stack; // Stack may be updated on reject.
                return stack;
            }
            finally {
                stack_being_generated = false;
            }
        }
    },
    timeout: function (ms, msg) {
        var _this = this;
        return ms < Infinity ?
            new Promise(function (resolve, reject) {
                var handle = setTimeout(function () { return reject(new exceptions.Timeout(msg)); }, ms);
                _this.then(resolve, reject).finally(clearTimeout.bind(null, handle));
            }) : this;
    }
});
if (typeof Symbol !== 'undefined' && Symbol.toStringTag)
    setProp(Promise.prototype, Symbol.toStringTag, 'Promise');
// Now that Promise.prototype is defined, we have all it takes to set globalPSD.env.
// Environment globals snapshotted on leaving global zone
globalPSD.env = snapShot();
function Listener(onFulfilled, onRejected, resolve, reject, zone) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.resolve = resolve;
    this.reject = reject;
    this.psd = zone;
}
// Promise Static Properties
props(Promise, {
    all: function () {
        var values = getArrayOf.apply(null, arguments) // Supports iterables, implicit arguments and array-like.
            .map(onPossibleParallellAsync); // Handle parallell async/awaits 
        return new Promise(function (resolve, reject) {
            if (values.length === 0)
                resolve([]);
            var remaining = values.length;
            values.forEach(function (a, i) { return Promise.resolve(a).then(function (x) {
                values[i] = x;
                if (!--remaining)
                    resolve(values);
            }, reject); });
        });
    },
    resolve: function (value) {
        if (value instanceof Promise)
            return value;
        if (value && typeof value.then === 'function')
            return new Promise(function (resolve, reject) {
                value.then(resolve, reject);
            });
        var rv = new Promise(INTERNAL, true, value);
        linkToPreviousPromise(rv, currentFulfiller);
        return rv;
    },
    reject: PromiseReject,
    race: function () {
        var values = getArrayOf.apply(null, arguments).map(onPossibleParallellAsync);
        return new Promise(function (resolve, reject) {
            values.map(function (value) { return Promise.resolve(value).then(resolve, reject); });
        });
    },
    PSD: {
        get: function () { return PSD; },
        set: function (value) { return PSD = value; }
    },
    //totalEchoes: {get: ()=>totalEchoes},
    //task: {get: ()=>task},
    newPSD: newScope,
    usePSD: usePSD,
    scheduler: {
        get: function () { return asap$1; },
        set: function (value) { asap$1 = value; }
    },
    rejectionMapper: {
        get: function () { return rejectionMapper; },
        set: function (value) { rejectionMapper = value; } // Map reject failures
    },
    follow: function (fn, zoneProps) {
        return new Promise(function (resolve, reject) {
            return newScope(function (resolve, reject) {
                var psd = PSD;
                psd.unhandleds = []; // For unhandled standard- or 3rd party Promises. Checked at psd.finalize()
                psd.onunhandled = reject; // Triggered directly on unhandled promises of this library.
                psd.finalize = callBoth(function () {
                    var _this = this;
                    // Unhandled standard or 3rd part promises are put in PSD.unhandleds and
                    // examined upon scope completion while unhandled rejections in this Promise
                    // will trigger directly through psd.onunhandled
                    run_at_end_of_this_or_next_physical_tick(function () {
                        _this.unhandleds.length === 0 ? resolve() : reject(_this.unhandleds[0]);
                    });
                }, psd.finalize);
                fn();
            }, zoneProps, resolve, reject);
        });
    }
});
/**
* Take a potentially misbehaving resolver function and make sure
* onFulfilled and onRejected are only called once.
*
* Makes no guarantees about asynchrony.
*/
function executePromiseTask(promise, fn) {
    // Promise Resolution Procedure:
    // https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    try {
        fn(function (value) {
            if (promise._state !== null)
                return; // Already settled
            if (value === promise)
                throw new TypeError('A promise cannot be resolved with itself.');
            var shouldExecuteTick = promise._lib && beginMicroTickScope();
            if (value && typeof value.then === 'function') {
                executePromiseTask(promise, function (resolve, reject) {
                    value instanceof Promise ?
                        value._then(resolve, reject) :
                        value.then(resolve, reject);
                });
            }
            else {
                promise._state = true;
                promise._value = value;
                propagateAllListeners(promise);
            }
            if (shouldExecuteTick)
                endMicroTickScope();
        }, handleRejection.bind(null, promise)); // If Function.bind is not supported. Exception is handled in catch below
    }
    catch (ex) {
        handleRejection(promise, ex);
    }
}
function handleRejection(promise, reason) {
    rejectingErrors.push(reason);
    if (promise._state !== null)
        return;
    var shouldExecuteTick = promise._lib && beginMicroTickScope();
    reason = rejectionMapper(reason);
    promise._state = false;
    promise._value = reason;
    debug && reason !== null && typeof reason === 'object' && !reason._promise && tryCatch(function () {
        var origProp = getPropertyDescriptor(reason, "stack");
        reason._promise = promise;
        setProp(reason, "stack", {
            get: function () {
                return stack_being_generated ?
                    origProp && (origProp.get ?
                        origProp.get.apply(reason) :
                        origProp.value) :
                    promise.stack;
            }
        });
    });
    // Add the failure to a list of possibly uncaught errors
    addPossiblyUnhandledError(promise);
    propagateAllListeners(promise);
    if (shouldExecuteTick)
        endMicroTickScope();
}
function propagateAllListeners(promise) {
    //debug && linkToPreviousPromise(promise);
    var listeners = promise._listeners;
    promise._listeners = [];
    for (var i = 0, len = listeners.length; i < len; ++i) {
        propagateToListener(promise, listeners[i]);
    }
    var psd = promise._PSD;
    --psd.ref || psd.finalize(); // if psd.ref reaches zero, call psd.finalize();
    if (numScheduledCalls === 0) {
        // If numScheduledCalls is 0, it means that our stack is not in a callback of a scheduled call,
        // and that no deferreds where listening to this rejection or success.
        // Since there is a risk that our stack can contain application code that may
        // do stuff after this code is finished that may generate new calls, we cannot
        // call finalizers here.
        ++numScheduledCalls;
        asap$1(function () {
            if (--numScheduledCalls === 0)
                finalizePhysicalTick(); // Will detect unhandled errors
        }, []);
    }
}
function propagateToListener(promise, listener) {
    if (promise._state === null) {
        promise._listeners.push(listener);
        return;
    }
    var cb = promise._state ? listener.onFulfilled : listener.onRejected;
    if (cb === null) {
        // This Listener doesnt have a listener for the event being triggered (onFulfilled or onReject) so lets forward the event to any eventual listeners on the Promise instance returned by then() or catch()
        return (promise._state ? listener.resolve : listener.reject)(promise._value);
    }
    ++listener.psd.ref;
    ++numScheduledCalls;
    asap$1(callListener, [cb, promise, listener]);
}
function callListener(cb, promise, listener) {
    try {
        // Set static variable currentFulfiller to the promise that is being fullfilled,
        // so that we connect the chain of promises (for long stacks support)
        currentFulfiller = promise;
        // Call callback and resolve our listener with it's return value.
        var ret, value = promise._value;
        if (promise._state) {
            // cb is onResolved
            ret = cb(value);
        }
        else {
            // cb is onRejected
            if (rejectingErrors.length)
                rejectingErrors = [];
            ret = cb(value);
            if (rejectingErrors.indexOf(value) === -1)
                markErrorAsHandled(promise); // Callback didnt do Promise.reject(err) nor reject(err) onto another promise.
        }
        listener.resolve(ret);
    }
    catch (e) {
        // Exception thrown in callback. Reject our listener.
        listener.reject(e);
    }
    finally {
        // Restore env and currentFulfiller.
        currentFulfiller = null;
        if (--numScheduledCalls === 0)
            finalizePhysicalTick();
        --listener.psd.ref || listener.psd.finalize();
    }
}
function getStack(promise, stacks, limit) {
    if (stacks.length === limit)
        return stacks;
    var stack = "";
    if (promise._state === false) {
        var failure = promise._value, errorName, message;
        if (failure != null) {
            errorName = failure.name || "Error";
            message = failure.message || failure;
            stack = prettyStack(failure, 0);
        }
        else {
            errorName = failure; // If error is undefined or null, show that.
            message = "";
        }
        stacks.push(errorName + (message ? ": " + message : "") + stack);
    }
    if (debug) {
        stack = prettyStack(promise._stackHolder, 2);
        if (stack && stacks.indexOf(stack) === -1)
            stacks.push(stack);
        if (promise._prev)
            getStack(promise._prev, stacks, limit);
    }
    return stacks;
}
function linkToPreviousPromise(promise, prev) {
    // Support long stacks by linking to previous completed promise.
    var numPrev = prev ? prev._numPrev + 1 : 0;
    if (numPrev < LONG_STACKS_CLIP_LIMIT) {
        promise._prev = prev;
        promise._numPrev = numPrev;
    }
}
/* The callback to schedule with setImmediate() or setTimeout().
   It runs a virtual microtick and executes any callback registered in microtickQueue.
 */
function physicalTick() {
    beginMicroTickScope() && endMicroTickScope();
}
function beginMicroTickScope() {
    var wasRootExec = isOutsideMicroTick;
    isOutsideMicroTick = false;
    needsNewPhysicalTick = false;
    return wasRootExec;
}
/* Executes micro-ticks without doing try..catch.
   This can be possible because we only use this internally and
   the registered functions are exception-safe (they do try..catch
   internally before calling any external method). If registering
   functions in the microtickQueue that are not exception-safe, this
   would destroy the framework and make it instable. So we don't export
   our asap method.
*/
function endMicroTickScope() {
    var callbacks, i, l;
    do {
        while (microtickQueue.length > 0) {
            callbacks = microtickQueue;
            microtickQueue = [];
            l = callbacks.length;
            for (i = 0; i < l; ++i) {
                var item = callbacks[i];
                item[0].apply(null, item[1]);
            }
        }
    } while (microtickQueue.length > 0);
    isOutsideMicroTick = true;
    needsNewPhysicalTick = true;
}
function finalizePhysicalTick() {
    var unhandledErrs = unhandledErrors;
    unhandledErrors = [];
    unhandledErrs.forEach(function (p) {
        p._PSD.onunhandled.call(null, p._value, p);
    });
    var finalizers = tickFinalizers.slice(0); // Clone first because finalizer may remove itself from list.
    var i = finalizers.length;
    while (i)
        finalizers[--i]();
}
function run_at_end_of_this_or_next_physical_tick(fn) {
    function finalizer() {
        fn();
        tickFinalizers.splice(tickFinalizers.indexOf(finalizer), 1);
    }
    tickFinalizers.push(finalizer);
    ++numScheduledCalls;
    asap$1(function () {
        if (--numScheduledCalls === 0)
            finalizePhysicalTick();
    }, []);
}
function addPossiblyUnhandledError(promise) {
    // Only add to unhandledErrors if not already there. The first one to add to this list
    // will be upon the first rejection so that the root cause (first promise in the
    // rejection chain) is the one listed.
    if (!unhandledErrors.some(function (p) { return p._value === promise._value; }))
        unhandledErrors.push(promise);
}
function markErrorAsHandled(promise) {
    // Called when a reject handled is actually being called.
    // Search in unhandledErrors for any promise whos _value is this promise_value (list
    // contains only rejected promises, and only one item per error)
    var i = unhandledErrors.length;
    while (i)
        if (unhandledErrors[--i]._value === promise._value) {
            // Found a promise that failed with this same error object pointer,
            // Remove that since there is a listener that actually takes care of it.
            unhandledErrors.splice(i, 1);
            return;
        }
}
function PromiseReject(reason) {
    return new Promise(INTERNAL, false, reason);
}
function wrap(fn, errorCatcher) {
    var psd = PSD;
    return function () {
        var wasRootExec = beginMicroTickScope(), outerScope = PSD;
        try {
            switchToZone(psd, true);
            return fn.apply(this, arguments);
        }
        catch (e) {
            errorCatcher && errorCatcher(e);
        }
        finally {
            switchToZone(outerScope, false);
            if (wasRootExec)
                endMicroTickScope();
        }
    };
}
//
// variables used for native await support
//
var task = { awaits: 0, echoes: 0, id: 0 }; // The ongoing macro-task when using zone-echoing.
var taskCounter = 0; // ID counter for macro tasks.
var zoneStack = []; // Stack of left zones to restore asynchronically.
var zoneEchoes = 0; // zoneEchoes is a must in order to persist zones between native await expressions.
var totalEchoes = 0; // ID counter for micro-tasks. Used to detect possible native await in our Promise.prototype.then.
var zone_id_counter = 0;
function newScope(fn, props$$1, a1, a2) {
    var parent = PSD, psd = Object.create(parent);
    psd.parent = parent;
    psd.ref = 0;
    psd.global = false;
    psd.id = ++zone_id_counter;
    // Prepare for promise patching (done in usePSD):
    var globalEnv = globalPSD.env;
    psd.env = patchGlobalPromise ? {
        Promise: Promise,
        PromiseProp: { value: Promise, configurable: true, writable: true },
        all: Promise.all,
        race: Promise.race,
        resolve: Promise.resolve,
        reject: Promise.reject,
        nthen: getPatchedPromiseThen(globalEnv.nthen, psd),
        gthen: getPatchedPromiseThen(globalEnv.gthen, psd) // global then
    } : {};
    if (props$$1)
        extend(psd, props$$1);
    // unhandleds and onunhandled should not be specifically set here.
    // Leave them on parent prototype.
    // unhandleds.push(err) will push to parent's prototype
    // onunhandled() will call parents onunhandled (with this scope's this-pointer though!)
    ++parent.ref;
    psd.finalize = function () {
        --this.parent.ref || this.parent.finalize();
    };
    var rv = usePSD(psd, fn, a1, a2);
    if (psd.ref === 0)
        psd.finalize();
    return rv;
}
// Function to call if scopeFunc returns NativePromise
// Also for each NativePromise in the arguments to Promise.all()
function incrementExpectedAwaits() {
    if (!task.id)
        task.id = ++taskCounter;
    ++task.awaits;
    task.echoes += ZONE_ECHO_LIMIT;
    return task.id;
}
// Function to call when 'then' calls back on a native promise where onAwaitExpected() had been called.
// Also call this when a native await calls then method on a promise. In that case, don't supply
// sourceTaskId because we already know it refers to current task.
function decrementExpectedAwaits(sourceTaskId) {
    if (!task.awaits || (sourceTaskId && sourceTaskId !== task.id))
        return;
    if (--task.awaits === 0)
        task.id = 0;
    task.echoes = task.awaits * ZONE_ECHO_LIMIT; // Will reset echoes to 0 if awaits is 0.
}
// Call from Promise.all() and Promise.race()
function onPossibleParallellAsync(possiblePromise) {
    if (task.echoes && possiblePromise && possiblePromise.constructor === NativePromise) {
        incrementExpectedAwaits();
        return possiblePromise.then(function (x) {
            decrementExpectedAwaits();
            return x;
        }, function (e) {
            decrementExpectedAwaits();
            return rejection(e);
        });
    }
    return possiblePromise;
}
function zoneEnterEcho(targetZone) {
    ++totalEchoes;
    if (!task.echoes || --task.echoes === 0) {
        task.echoes = task.id = 0; // Cancel zone echoing.
    }
    zoneStack.push(PSD);
    switchToZone(targetZone, true);
}
function zoneLeaveEcho() {
    var zone = zoneStack[zoneStack.length - 1];
    zoneStack.pop();
    switchToZone(zone, false);
}
function switchToZone(targetZone, bEnteringZone) {
    var currentZone = PSD;
    if (bEnteringZone ? task.echoes && (!zoneEchoes++ || targetZone !== PSD) : zoneEchoes && (!--zoneEchoes || targetZone !== PSD)) {
        // Enter or leave zone asynchronically as well, so that tasks initiated during current tick
        // will be surrounded by the zone when they are invoked.
        enqueueNativeMicroTask(bEnteringZone ? zoneEnterEcho.bind(null, targetZone) : zoneLeaveEcho);
    }
    if (targetZone === PSD)
        return;
    PSD = targetZone; // The actual zone switch occurs at this line.
    // Snapshot on every leave from global zone.
    if (currentZone === globalPSD)
        globalPSD.env = snapShot();
    if (patchGlobalPromise) {
        // Let's patch the global and native Promises (may be same or may be different)
        var GlobalPromise = globalPSD.env.Promise;
        // Swich environments (may be PSD-zone or the global zone. Both apply.)
        var targetEnv = targetZone.env;
        // Change Promise.prototype.then for native and global Promise (they MAY differ on polyfilled environments, but both can be accessed)
        // Must be done on each zone change because the patched method contains targetZone in its closure.
        nativePromiseProto.then = targetEnv.nthen;
        GlobalPromise.prototype.then = targetEnv.gthen;
        if (currentZone.global || targetZone.global) {
            // Leaving or entering global zone. It's time to patch / restore global Promise.
            // Set this Promise to window.Promise so that transiled async functions will work on Firefox, Safari and IE, as well as with Zonejs and angular.
            Object.defineProperty(_global, 'Promise', targetEnv.PromiseProp);
            // Support Promise.all() etc to work indexedDB-safe also when people are including es6-promise as a module (they might
            // not be accessing global.Promise but a local reference to it)
            GlobalPromise.all = targetEnv.all;
            GlobalPromise.race = targetEnv.race;
            GlobalPromise.resolve = targetEnv.resolve;
            GlobalPromise.reject = targetEnv.reject;
        }
    }
}
function snapShot() {
    var GlobalPromise = _global.Promise;
    return patchGlobalPromise ? {
        Promise: GlobalPromise,
        PromiseProp: Object.getOwnPropertyDescriptor(_global, "Promise"),
        all: GlobalPromise.all,
        race: GlobalPromise.race,
        resolve: GlobalPromise.resolve,
        reject: GlobalPromise.reject,
        nthen: nativePromiseProto.then,
        gthen: GlobalPromise.prototype.then
    } : {};
}
function usePSD(psd, fn, a1, a2, a3) {
    var outerScope = PSD;
    try {
        switchToZone(psd, true);
        return fn(a1, a2, a3);
    }
    finally {
        switchToZone(outerScope, false);
    }
}
function enqueueNativeMicroTask(job) {
    //
    // Precondition: nativePromiseThen !== undefined
    //
    nativePromiseThen.call(resolvedNativePromise, job);
}
function nativeAwaitCompatibleWrap(fn, zone, possibleAwait) {
    return typeof fn !== 'function' ? fn : function () {
        var outerZone = PSD;
        if (possibleAwait)
            incrementExpectedAwaits();
        switchToZone(zone, true);
        try {
            return fn.apply(this, arguments);
        }
        finally {
            switchToZone(outerZone, false);
        }
    };
}
function getPatchedPromiseThen(origThen, zone) {
    return function (onResolved, onRejected) {
        return origThen.call(this, nativeAwaitCompatibleWrap(onResolved, zone, false), nativeAwaitCompatibleWrap(onRejected, zone, false));
    };
}
var UNHANDLEDREJECTION = "unhandledrejection";
function globalError(err, promise) {
    var rv;
    try {
        rv = promise.onuncatched(err);
    }
    catch (e) { }
    if (rv !== false)
        try {
            var event, eventData = { promise: promise, reason: err };
            if (_global.document && document.createEvent) {
                event = document.createEvent('Event');
                event.initEvent(UNHANDLEDREJECTION, true, true);
                extend(event, eventData);
            }
            else if (_global.CustomEvent) {
                event = new CustomEvent(UNHANDLEDREJECTION, { detail: eventData });
                extend(event, eventData);
            }
            if (event && _global.dispatchEvent) {
                dispatchEvent(event);
                if (!_global.PromiseRejectionEvent && _global.onunhandledrejection)
                    // No native support for PromiseRejectionEvent but user has set window.onunhandledrejection. Manually call it.
                    try {
                        _global.onunhandledrejection(event);
                    }
                    catch (_) { }
            }
            if (!event.defaultPrevented) {
                console.warn("Unhandled rejection: " + (err.stack || err));
            }
        }
        catch (e) { }
}
var rejection = Promise.reject;

function Events(ctx) {
    var evs = {};
    var rv = function (eventName, subscriber) {
        if (subscriber) {
            // Subscribe. If additional arguments than just the subscriber was provided, forward them as well.
            var i = arguments.length, args = new Array(i - 1);
            while (--i)
                args[i - 1] = arguments[i];
            evs[eventName].subscribe.apply(null, args);
            return ctx;
        }
        else if (typeof (eventName) === 'string') {
            // Return interface allowing to fire or unsubscribe from event
            return evs[eventName];
        }
    };
    rv.addEventType = add;
    for (var i = 1, l = arguments.length; i < l; ++i) {
        add(arguments[i]);
    }
    return rv;
    function add(eventName, chainFunction, defaultFunction) {
        if (typeof eventName === 'object')
            return addConfiguredEvents(eventName);
        if (!chainFunction)
            chainFunction = reverseStoppableEventChain;
        if (!defaultFunction)
            defaultFunction = nop;
        var context = {
            subscribers: [],
            fire: defaultFunction,
            subscribe: function (cb) {
                if (context.subscribers.indexOf(cb) === -1) {
                    context.subscribers.push(cb);
                    context.fire = chainFunction(context.fire, cb);
                }
            },
            unsubscribe: function (cb) {
                context.subscribers = context.subscribers.filter(function (fn) { return fn !== cb; });
                context.fire = context.subscribers.reduce(chainFunction, defaultFunction);
            }
        };
        evs[eventName] = rv[eventName] = context;
        return context;
    }
    function addConfiguredEvents(cfg) {
        // events(this, {reading: [functionChain, nop]});
        keys(cfg).forEach(function (eventName) {
            var args = cfg[eventName];
            if (isArray(args)) {
                add(eventName, cfg[eventName][0], cfg[eventName][1]);
            }
            else if (args === 'asap') {
                // Rather than approaching event subscription using a functional approach, we here do it in a for-loop where subscriber is executed in its own stack
                // enabling that any exception that occur wont disturb the initiator and also not nescessary be catched and forgotten.
                var context = add(eventName, mirror, function fire() {
                    // Optimazation-safe cloning of arguments into args.
                    var i = arguments.length, args = new Array(i);
                    while (i--)
                        args[i] = arguments[i];
                    // All each subscriber:
                    context.subscribers.forEach(function (fn) {
                        asap(function fireEvent() {
                            fn.apply(null, args);
                        });
                    });
                });
            }
            else
                throw new exceptions.InvalidArgument("Invalid event config");
        });
    }
}

/*
 * Dexie.js - a minimalistic wrapper for IndexedDB
 * ===============================================
 *
 * Copyright (c) 2014-2017 David Fahlander
 *
 * Version 2.0.4, Fri May 25 2018
 *
 * http://dexie.org
 *
 * Apache License Version 2.0, January 2004, http://www.apache.org/licenses/LICENSE-2.0
 *
 */
var DEXIE_VERSION = '2.0.4';
var maxString = String.fromCharCode(65535);
var maxKey = (function () { try {
    IDBKeyRange.only([[]]);
    return [[]];
}
catch (e) {
    return maxString;
} })();
var minKey = -Infinity;
var INVALID_KEY_ARGUMENT = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.";
var STRING_EXPECTED = "String expected.";
var connections = [];
var isIEOrEdge = typeof navigator !== 'undefined' && /(MSIE|Trident|Edge)/.test(navigator.userAgent);
var hasIEDeleteObjectStoreBug = isIEOrEdge;
var hangsOnDeleteLargeKeyRange = isIEOrEdge;
var dexieStackFrameFilter = function (frame) { return !/(dexie\.js|dexie\.min\.js)/.test(frame); };
var dbNamesDB; // Global database for backing Dexie.getDatabaseNames() on browser without indexedDB.webkitGetDatabaseNames() 
// Init debug
setDebug(debug, dexieStackFrameFilter);
function Dexie(dbName, options) {
    /// <param name="options" type="Object" optional="true">Specify only if you wich to control which addons that should run on this instance</param>
    var deps = Dexie.dependencies;
    var opts = extend({
        // Default Options
        addons: Dexie.addons,
        autoOpen: true,
        indexedDB: deps.indexedDB,
        IDBKeyRange: deps.IDBKeyRange // Backend IDBKeyRange api. Default to browser env.
    }, options);
    var addons = opts.addons, autoOpen = opts.autoOpen, indexedDB = opts.indexedDB, IDBKeyRange = opts.IDBKeyRange;
    var globalSchema = this._dbSchema = {};
    var versions = [];
    var dbStoreNames = [];
    var allTables = {};
    ///<var type="IDBDatabase" />
    var idbdb = null; // Instance of IDBDatabase
    var dbOpenError = null;
    var isBeingOpened = false;
    var onReadyBeingFired = null;
    var openComplete = false;
    var READONLY = "readonly", READWRITE = "readwrite";
    var db = this;
    var dbReadyResolve, dbReadyPromise = new Promise(function (resolve) {
        dbReadyResolve = resolve;
    }), cancelOpen, openCanceller = new Promise(function (_, reject) {
        cancelOpen = reject;
    });
    var autoSchema = true;
    var hasNativeGetDatabaseNames = !!getNativeGetDatabaseNamesFn(indexedDB), hasGetAll;
    function init() {
        // Default subscribers to "versionchange" and "blocked".
        // Can be overridden by custom handlers. If custom handlers return false, these default
        // behaviours will be prevented.
        db.on("versionchange", function (ev) {
            // Default behavior for versionchange event is to close database connection.
            // Caller can override this behavior by doing db.on("versionchange", function(){ return false; });
            // Let's not block the other window from making it's delete() or open() call.
            // NOTE! This event is never fired in IE,Edge or Safari.
            if (ev.newVersion > 0)
                console.warn("Another connection wants to upgrade database '" + db.name + "'. Closing db now to resume the upgrade.");
            else
                console.warn("Another connection wants to delete database '" + db.name + "'. Closing db now to resume the delete request.");
            db.close();
            // In many web applications, it would be recommended to force window.reload()
            // when this event occurs. To do that, subscribe to the versionchange event
            // and call window.location.reload(true) if ev.newVersion > 0 (not a deletion)
            // The reason for this is that your current web app obviously has old schema code that needs
            // to be updated. Another window got a newer version of the app and needs to upgrade DB but
            // your window is blocking it unless we close it here.
        });
        db.on("blocked", function (ev) {
            if (!ev.newVersion || ev.newVersion < ev.oldVersion)
                console.warn("Dexie.delete('" + db.name + "') was blocked");
            else
                console.warn("Upgrade '" + db.name + "' blocked by other connection holding version " + ev.oldVersion / 10);
        });
    }
    //
    //
    //
    // ------------------------- Versioning Framework---------------------------
    //
    //
    //
    this.version = function (versionNumber) {
        /// <param name="versionNumber" type="Number"></param>
        /// <returns type="Version"></returns>
        if (idbdb || isBeingOpened)
            throw new exceptions.Schema("Cannot add version when database is open");
        this.verno = Math.max(this.verno, versionNumber);
        var versionInstance = versions.filter(function (v) { return v._cfg.version === versionNumber; })[0];
        if (versionInstance)
            return versionInstance;
        versionInstance = new Version(versionNumber);
        versions.push(versionInstance);
        versions.sort(lowerVersionFirst);
        // Disable autoschema mode, as at least one version is specified.
        autoSchema = false;
        return versionInstance;
    };
    function Version(versionNumber) {
        this._cfg = {
            version: versionNumber,
            storesSource: null,
            dbschema: {},
            tables: {},
            contentUpgrade: null
        };
        this.stores({}); // Derive earlier schemas by default.
    }
    extend(Version.prototype, {
        stores: function (stores) {
            /// <summary>
            ///   Defines the schema for a particular version
            /// </summary>
            /// <param name="stores" type="Object">
            /// Example: <br/>
            ///   {users: "id++,first,last,&amp;username,*email", <br/>
            ///   passwords: "id++,&amp;username"}<br/>
            /// <br/>
            /// Syntax: {Table: "[primaryKey][++],[&amp;][*]index1,[&amp;][*]index2,..."}<br/><br/>
            /// Special characters:<br/>
            ///  "&amp;"  means unique key, <br/>
            ///  "*"  means value is multiEntry, <br/>
            ///  "++" means auto-increment and only applicable for primary key <br/>
            /// </param>
            this._cfg.storesSource = this._cfg.storesSource ? extend(this._cfg.storesSource, stores) : stores;
            // Derive stores from earlier versions if they are not explicitely specified as null or a new syntax.
            var storesSpec = {};
            versions.forEach(function (version) {
                extend(storesSpec, version._cfg.storesSource);
            });
            var dbschema = (this._cfg.dbschema = {});
            this._parseStoresSpec(storesSpec, dbschema);
            // Update the latest schema to this version
            // Update API
            globalSchema = db._dbSchema = dbschema;
            removeTablesApi([allTables, db, Transaction.prototype]); // Keep Transaction.prototype even though it should be depr.
            setApiOnPlace([allTables, db, Transaction.prototype, this._cfg.tables], keys(dbschema), dbschema);
            dbStoreNames = keys(dbschema);
            return this;
        },
        upgrade: function (upgradeFunction) {
            this._cfg.contentUpgrade = upgradeFunction;
            return this;
        },
        _parseStoresSpec: function (stores, outSchema) {
            keys(stores).forEach(function (tableName) {
                if (stores[tableName] !== null) {
                    var instanceTemplate = {};
                    var indexes = parseIndexSyntax(stores[tableName]);
                    var primKey = indexes.shift();
                    if (primKey.multi)
                        throw new exceptions.Schema("Primary key cannot be multi-valued");
                    if (primKey.keyPath)
                        setByKeyPath(instanceTemplate, primKey.keyPath, primKey.auto ? 0 : primKey.keyPath);
                    indexes.forEach(function (idx) {
                        if (idx.auto)
                            throw new exceptions.Schema("Only primary key can be marked as autoIncrement (++)");
                        if (!idx.keyPath)
                            throw new exceptions.Schema("Index must have a name and cannot be an empty string");
                        setByKeyPath(instanceTemplate, idx.keyPath, idx.compound ? idx.keyPath.map(function () { return ""; }) : "");
                    });
                    outSchema[tableName] = new TableSchema(tableName, primKey, indexes, instanceTemplate);
                }
            });
        }
    });
    function runUpgraders(oldVersion, idbtrans, reject) {
        var trans = db._createTransaction(READWRITE, dbStoreNames, globalSchema);
        trans.create(idbtrans);
        trans._completion.catch(reject);
        var rejectTransaction = trans._reject.bind(trans);
        newScope(function () {
            PSD.trans = trans;
            if (oldVersion === 0) {
                // Create tables:
                keys(globalSchema).forEach(function (tableName) {
                    createTable(idbtrans, tableName, globalSchema[tableName].primKey, globalSchema[tableName].indexes);
                });
                Promise.follow(function () { return db.on.populate.fire(trans); }).catch(rejectTransaction);
            }
            else
                updateTablesAndIndexes(oldVersion, trans, idbtrans).catch(rejectTransaction);
        });
    }
    function updateTablesAndIndexes(oldVersion, trans, idbtrans) {
        // Upgrade version to version, step-by-step from oldest to newest version.
        // Each transaction object will contain the table set that was current in that version (but also not-yet-deleted tables from its previous version)
        var queue = [];
        var oldVersionStruct = versions.filter(function (version) { return version._cfg.version === oldVersion; })[0];
        if (!oldVersionStruct)
            throw new exceptions.Upgrade("Dexie specification of currently installed DB version is missing");
        globalSchema = db._dbSchema = oldVersionStruct._cfg.dbschema;
        var anyContentUpgraderHasRun = false;
        var versToRun = versions.filter(function (v) { return v._cfg.version > oldVersion; });
        versToRun.forEach(function (version) {
            /// <param name="version" type="Version"></param>
            queue.push(function () {
                var oldSchema = globalSchema;
                var newSchema = version._cfg.dbschema;
                adjustToExistingIndexNames(oldSchema, idbtrans);
                adjustToExistingIndexNames(newSchema, idbtrans);
                globalSchema = db._dbSchema = newSchema;
                var diff = getSchemaDiff(oldSchema, newSchema);
                // Add tables           
                diff.add.forEach(function (tuple) {
                    createTable(idbtrans, tuple[0], tuple[1].primKey, tuple[1].indexes);
                });
                // Change tables
                diff.change.forEach(function (change) {
                    if (change.recreate) {
                        throw new exceptions.Upgrade("Not yet support for changing primary key");
                    }
                    else {
                        var store = idbtrans.objectStore(change.name);
                        // Add indexes
                        change.add.forEach(function (idx) {
                            addIndex(store, idx);
                        });
                        // Update indexes
                        change.change.forEach(function (idx) {
                            store.deleteIndex(idx.name);
                            addIndex(store, idx);
                        });
                        // Delete indexes
                        change.del.forEach(function (idxName) {
                            store.deleteIndex(idxName);
                        });
                    }
                });
                if (version._cfg.contentUpgrade) {
                    anyContentUpgraderHasRun = true;
                    return Promise.follow(function () {
                        version._cfg.contentUpgrade(trans);
                    });
                }
            });
            queue.push(function (idbtrans) {
                if (!anyContentUpgraderHasRun || !hasIEDeleteObjectStoreBug) {
                    var newSchema = version._cfg.dbschema;
                    // Delete old tables
                    deleteRemovedTables(newSchema, idbtrans);
                }
            });
        });
        // Now, create a queue execution engine
        function runQueue() {
            return queue.length ? Promise.resolve(queue.shift()(trans.idbtrans)).then(runQueue) :
                Promise.resolve();
        }
        return runQueue().then(function () {
            createMissingTables(globalSchema, idbtrans); // At last, make sure to create any missing tables. (Needed by addons that add stores to DB without specifying version)
        });
    }
    function getSchemaDiff(oldSchema, newSchema) {
        var diff = {
            del: [],
            add: [],
            change: [] // Array of {name: tableName, recreate: newDefinition, del: delIndexNames, add: newIndexDefs, change: changedIndexDefs}
        };
        for (var table in oldSchema) {
            if (!newSchema[table])
                diff.del.push(table);
        }
        for (table in newSchema) {
            var oldDef = oldSchema[table], newDef = newSchema[table];
            if (!oldDef) {
                diff.add.push([table, newDef]);
            }
            else {
                var change = {
                    name: table,
                    def: newDef,
                    recreate: false,
                    del: [],
                    add: [],
                    change: []
                };
                if (oldDef.primKey.src !== newDef.primKey.src) {
                    // Primary key has changed. Remove and re-add table.
                    change.recreate = true;
                    diff.change.push(change);
                }
                else {
                    // Same primary key. Just find out what differs:
                    var oldIndexes = oldDef.idxByName;
                    var newIndexes = newDef.idxByName;
                    for (var idxName in oldIndexes) {
                        if (!newIndexes[idxName])
                            change.del.push(idxName);
                    }
                    for (idxName in newIndexes) {
                        var oldIdx = oldIndexes[idxName], newIdx = newIndexes[idxName];
                        if (!oldIdx)
                            change.add.push(newIdx);
                        else if (oldIdx.src !== newIdx.src)
                            change.change.push(newIdx);
                    }
                    if (change.del.length > 0 || change.add.length > 0 || change.change.length > 0) {
                        diff.change.push(change);
                    }
                }
            }
        }
        return diff;
    }
    function createTable(idbtrans, tableName, primKey, indexes) {
        /// <param name="idbtrans" type="IDBTransaction"></param>
        var store = idbtrans.db.createObjectStore(tableName, primKey.keyPath ? { keyPath: primKey.keyPath, autoIncrement: primKey.auto } : { autoIncrement: primKey.auto });
        indexes.forEach(function (idx) { addIndex(store, idx); });
        return store;
    }
    function createMissingTables(newSchema, idbtrans) {
        keys(newSchema).forEach(function (tableName) {
            if (!idbtrans.db.objectStoreNames.contains(tableName)) {
                createTable(idbtrans, tableName, newSchema[tableName].primKey, newSchema[tableName].indexes);
            }
        });
    }
    function deleteRemovedTables(newSchema, idbtrans) {
        for (var i = 0; i < idbtrans.db.objectStoreNames.length; ++i) {
            var storeName = idbtrans.db.objectStoreNames[i];
            if (newSchema[storeName] == null) {
                idbtrans.db.deleteObjectStore(storeName);
            }
        }
    }
    function addIndex(store, idx) {
        store.createIndex(idx.name, idx.keyPath, { unique: idx.unique, multiEntry: idx.multi });
    }
    //
    //
    //      Dexie Protected API
    //
    //
    this._allTables = allTables;
    this._createTransaction = function (mode, storeNames, dbschema, parentTransaction) {
        return new Transaction(mode, storeNames, dbschema, parentTransaction);
    };
    /* Generate a temporary transaction when db operations are done outside a transaction scope.
    */
    function tempTransaction(mode, storeNames, fn) {
        if (!openComplete && (!PSD.letThrough)) {
            if (!isBeingOpened) {
                if (!autoOpen)
                    return rejection(new exceptions.DatabaseClosed());
                db.open().catch(nop); // Open in background. If if fails, it will be catched by the final promise anyway.
            }
            return dbReadyPromise.then(function () { return tempTransaction(mode, storeNames, fn); });
        }
        else {
            var trans = db._createTransaction(mode, storeNames, globalSchema);
            try {
                trans.create();
            }
            catch (ex) {
                return rejection(ex);
            }
            return trans._promise(mode, function (resolve, reject) {
                return newScope(function () {
                    PSD.trans = trans;
                    return fn(resolve, reject, trans);
                });
            }).then(function (result) {
                // Instead of resolving value directly, wait with resolving it until transaction has completed.
                // Otherwise the data would not be in the DB if requesting it in the then() operation.
                // Specifically, to ensure that the following expression will work:
                //
                //   db.friends.put({name: "Arne"}).then(function () {
                //       db.friends.where("name").equals("Arne").count(function(count) {
                //           assert (count === 1);
                //       });
                //   });
                //
                return trans._completion.then(function () { return result; });
            }); /*.catch(err => { // Don't do this as of now. If would affect bulk- and modify methods in a way that could be more intuitive. But wait! Maybe change in next major.
                trans._reject(err);
                return rejection(err);
            });*/
        }
    }
    this._whenReady = function (fn) {
        return openComplete || PSD.letThrough ? fn() : new Promise(function (resolve, reject) {
            if (!isBeingOpened) {
                if (!autoOpen) {
                    reject(new exceptions.DatabaseClosed());
                    return;
                }
                db.open().catch(nop); // Open in background. If if fails, it will be catched by the final promise anyway.
            }
            dbReadyPromise.then(resolve, reject);
        }).then(fn);
    };
    //
    //
    //
    //
    //      Dexie API
    //
    //
    //
    this.verno = 0;
    this.open = function () {
        if (isBeingOpened || idbdb)
            return dbReadyPromise.then(function () { return dbOpenError ? rejection(dbOpenError) : db; });
        debug && (openCanceller._stackHolder = getErrorWithStack()); // Let stacks point to when open() was called rather than where new Dexie() was called.
        isBeingOpened = true;
        dbOpenError = null;
        openComplete = false;
        // Function pointers to call when the core opening process completes.
        var resolveDbReady = dbReadyResolve, 
        // upgradeTransaction to abort on failure.
        upgradeTransaction = null;
        return Promise.race([openCanceller, new Promise(function (resolve, reject) {
                // Multiply db.verno with 10 will be needed to workaround upgrading bug in IE:
                // IE fails when deleting objectStore after reading from it.
                // A future version of Dexie.js will stopover an intermediate version to workaround this.
                // At that point, we want to be backward compatible. Could have been multiplied with 2, but by using 10, it is easier to map the number to the real version number.
                // If no API, throw!
                if (!indexedDB)
                    throw new exceptions.MissingAPI("indexedDB API not found. If using IE10+, make sure to run your code on a server URL " +
                        "(not locally). If using old Safari versions, make sure to include indexedDB polyfill.");
                var req = autoSchema ? indexedDB.open(dbName) : indexedDB.open(dbName, Math.round(db.verno * 10));
                if (!req)
                    throw new exceptions.MissingAPI("IndexedDB API not available"); // May happen in Safari private mode, see https://github.com/dfahlander/Dexie.js/issues/134
                req.onerror = eventRejectHandler(reject);
                req.onblocked = wrap(fireOnBlocked);
                req.onupgradeneeded = wrap(function (e) {
                    upgradeTransaction = req.transaction;
                    if (autoSchema && !db._allowEmptyDB) {
                        // Caller did not specify a version or schema. Doing that is only acceptable for opening alread existing databases.
                        // If onupgradeneeded is called it means database did not exist. Reject the open() promise and make sure that we
                        // do not create a new database by accident here.
                        req.onerror = preventDefault; // Prohibit onabort error from firing before we're done!
                        upgradeTransaction.abort(); // Abort transaction (would hope that this would make DB disappear but it doesnt.)
                        // Close database and delete it.
                        req.result.close();
                        var delreq = indexedDB.deleteDatabase(dbName); // The upgrade transaction is atomic, and javascript is single threaded - meaning that there is no risk that we delete someone elses database here!
                        delreq.onsuccess = delreq.onerror = wrap(function () {
                            reject(new exceptions.NoSuchDatabase("Database " + dbName + " doesnt exist"));
                        });
                    }
                    else {
                        upgradeTransaction.onerror = eventRejectHandler(reject);
                        var oldVer = e.oldVersion > Math.pow(2, 62) ? 0 : e.oldVersion; // Safari 8 fix.
                        runUpgraders(oldVer / 10, upgradeTransaction, reject, req);
                    }
                }, reject);
                req.onsuccess = wrap(function () {
                    // Core opening procedure complete. Now let's just record some stuff.
                    upgradeTransaction = null;
                    idbdb = req.result;
                    connections.push(db); // Used for emulating versionchange event on IE/Edge/Safari.
                    if (autoSchema)
                        readGlobalSchema();
                    else if (idbdb.objectStoreNames.length > 0) {
                        try {
                            adjustToExistingIndexNames(globalSchema, idbdb.transaction(safariMultiStoreFix(idbdb.objectStoreNames), READONLY));
                        }
                        catch (e) {
                            // Safari may bail out if > 1 store names. However, this shouldnt be a showstopper. Issue #120.
                        }
                    }
                    idbdb.onversionchange = wrap(function (ev) {
                        db._vcFired = true; // detect implementations that not support versionchange (IE/Edge/Safari)
                        db.on("versionchange").fire(ev);
                    });
                    if (!hasNativeGetDatabaseNames && dbName !== '__dbnames') {
                        dbNamesDB.dbnames.put({ name: dbName }).catch(nop);
                    }
                    resolve();
                }, reject);
            })]).then(function () {
            // Before finally resolving the dbReadyPromise and this promise,
            // call and await all on('ready') subscribers:
            // Dexie.vip() makes subscribers able to use the database while being opened.
            // This is a must since these subscribers take part of the opening procedure.
            onReadyBeingFired = [];
            return Promise.resolve(Dexie.vip(db.on.ready.fire)).then(function fireRemainders() {
                if (onReadyBeingFired.length > 0) {
                    // In case additional subscribers to db.on('ready') were added during the time db.on.ready.fire was executed.
                    var remainders = onReadyBeingFired.reduce(promisableChain, nop);
                    onReadyBeingFired = [];
                    return Promise.resolve(Dexie.vip(remainders)).then(fireRemainders);
                }
            });
        }).finally(function () {
            onReadyBeingFired = null;
        }).then(function () {
            // Resolve the db.open() with the db instance.
            isBeingOpened = false;
            return db;
        }).catch(function (err) {
            try {
                // Did we fail within onupgradeneeded? Make sure to abort the upgrade transaction so it doesnt commit.
                upgradeTransaction && upgradeTransaction.abort();
            }
            catch (e) { }
            isBeingOpened = false; // Set before calling db.close() so that it doesnt reject openCanceller again (leads to unhandled rejection event).
            db.close(); // Closes and resets idbdb, removes connections, resets dbReadyPromise and openCanceller so that a later db.open() is fresh.
            // A call to db.close() may have made on-ready subscribers fail. Use dbOpenError if set, since err could be a follow-up error on that.
            dbOpenError = err; // Record the error. It will be used to reject further promises of db operations.
            return rejection(dbOpenError);
        }).finally(function () {
            openComplete = true;
            resolveDbReady(); // dbReadyPromise is resolved no matter if open() rejects or resolved. It's just to wake up waiters.
        });
    };
    this.close = function () {
        var idx = connections.indexOf(db);
        if (idx >= 0)
            connections.splice(idx, 1);
        if (idbdb) {
            try {
                idbdb.close();
            }
            catch (e) { }
            idbdb = null;
        }
        autoOpen = false;
        dbOpenError = new exceptions.DatabaseClosed();
        if (isBeingOpened)
            cancelOpen(dbOpenError);
        // Reset dbReadyPromise promise:
        dbReadyPromise = new Promise(function (resolve) {
            dbReadyResolve = resolve;
        });
        openCanceller = new Promise(function (_, reject) {
            cancelOpen = reject;
        });
    };
    this.delete = function () {
        var hasArguments = arguments.length > 0;
        return new Promise(function (resolve, reject) {
            if (hasArguments)
                throw new exceptions.InvalidArgument("Arguments not allowed in db.delete()");
            if (isBeingOpened) {
                dbReadyPromise.then(doDelete);
            }
            else {
                doDelete();
            }
            function doDelete() {
                db.close();
                var req = indexedDB.deleteDatabase(dbName);
                req.onsuccess = wrap(function () {
                    if (!hasNativeGetDatabaseNames) {
                        dbNamesDB.dbnames.delete(dbName).catch(nop);
                    }
                    resolve();
                });
                req.onerror = eventRejectHandler(reject);
                req.onblocked = fireOnBlocked;
            }
        });
    };
    this.backendDB = function () {
        return idbdb;
    };
    this.isOpen = function () {
        return idbdb !== null;
    };
    this.hasBeenClosed = function () {
        return dbOpenError && (dbOpenError instanceof exceptions.DatabaseClosed);
    };
    this.hasFailed = function () {
        return dbOpenError !== null;
    };
    this.dynamicallyOpened = function () {
        return autoSchema;
    };
    //
    // Properties
    //
    this.name = dbName;
    // db.tables - an array of all Table instances.
    props(this, {
        tables: {
            get: function () {
                /// <returns type="Array" elementType="Table" />
                return keys(allTables).map(function (name) { return allTables[name]; });
            }
        }
    });
    //
    // Events
    //
    this.on = Events(this, "populate", "blocked", "versionchange", { ready: [promisableChain, nop] });
    this.on.ready.subscribe = override(this.on.ready.subscribe, function (subscribe) {
        return function (subscriber, bSticky) {
            Dexie.vip(function () {
                if (openComplete) {
                    // Database already open. Call subscriber asap.
                    if (!dbOpenError)
                        Promise.resolve().then(subscriber);
                    // bSticky: Also subscribe to future open sucesses (after close / reopen) 
                    if (bSticky)
                        subscribe(subscriber);
                }
                else if (onReadyBeingFired) {
                    // db.on('ready') subscribers are currently being executed and have not yet resolved or rejected
                    onReadyBeingFired.push(subscriber);
                    if (bSticky)
                        subscribe(subscriber);
                }
                else {
                    // Database not yet open. Subscribe to it.
                    subscribe(subscriber);
                    // If bSticky is falsy, make sure to unsubscribe subscriber when fired once.
                    if (!bSticky)
                        subscribe(function unsubscribe() {
                            db.on.ready.unsubscribe(subscriber);
                            db.on.ready.unsubscribe(unsubscribe);
                        });
                }
            });
        };
    });
    this.transaction = function () {
        /// <summary>
        ///
        /// </summary>
        /// <param name="mode" type="String">"r" for readonly, or "rw" for readwrite</param>
        /// <param name="tableInstances">Table instance, Array of Table instances, String or String Array of object stores to include in the transaction</param>
        /// <param name="scopeFunc" type="Function">Function to execute with transaction</param>
        var args = extractTransactionArgs.apply(this, arguments);
        return this._transaction.apply(this, args);
    };
    function extractTransactionArgs(mode, _tableArgs_, scopeFunc) {
        // Let table arguments be all arguments between mode and last argument.
        var i = arguments.length;
        if (i < 2)
            throw new exceptions.InvalidArgument("Too few arguments");
        // Prevent optimzation killer (https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments)
        // and clone arguments except the first one into local var 'args'.
        var args = new Array(i - 1);
        while (--i)
            args[i - 1] = arguments[i];
        // Let scopeFunc be the last argument and pop it so that args now only contain the table arguments.
        scopeFunc = args.pop();
        var tables = flatten(args); // Support using array as middle argument, or a mix of arrays and non-arrays.
        return [mode, tables, scopeFunc];
    }
    this._transaction = function (mode, tables, scopeFunc) {
        var parentTransaction = PSD.trans;
        // Check if parent transactions is bound to this db instance, and if caller wants to reuse it
        if (!parentTransaction || parentTransaction.db !== db || mode.indexOf('!') !== -1)
            parentTransaction = null;
        var onlyIfCompatible = mode.indexOf('?') !== -1;
        mode = mode.replace('!', '').replace('?', ''); // Ok. Will change arguments[0] as well but we wont touch arguments henceforth.
        try {
            //
            // Get storeNames from arguments. Either through given table instances, or through given table names.
            //
            var storeNames = tables.map(function (table) {
                var storeName = table instanceof Table ? table.name : table;
                if (typeof storeName !== 'string')
                    throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
                return storeName;
            });
            //
            // Resolve mode. Allow shortcuts "r" and "rw".
            //
            if (mode == "r" || mode == READONLY)
                mode = READONLY;
            else if (mode == "rw" || mode == READWRITE)
                mode = READWRITE;
            else
                throw new exceptions.InvalidArgument("Invalid transaction mode: " + mode);
            if (parentTransaction) {
                // Basic checks
                if (parentTransaction.mode === READONLY && mode === READWRITE) {
                    if (onlyIfCompatible) {
                        // Spawn new transaction instead.
                        parentTransaction = null;
                    }
                    else
                        throw new exceptions.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
                }
                if (parentTransaction) {
                    storeNames.forEach(function (storeName) {
                        if (parentTransaction && parentTransaction.storeNames.indexOf(storeName) === -1) {
                            if (onlyIfCompatible) {
                                // Spawn new transaction instead.
                                parentTransaction = null;
                            }
                            else
                                throw new exceptions.SubTransaction("Table " + storeName +
                                    " not included in parent transaction.");
                        }
                    });
                }
                if (onlyIfCompatible && parentTransaction && !parentTransaction.active) {
                    // '?' mode should not keep using an inactive transaction.
                    parentTransaction = null;
                }
            }
        }
        catch (e) {
            return parentTransaction ?
                parentTransaction._promise(null, function (_, reject) { reject(e); }) :
                rejection(e);
        }
        // If this is a sub-transaction, lock the parent and then launch the sub-transaction.
        return (parentTransaction ?
            parentTransaction._promise(mode, enterTransactionScope, "lock") :
            PSD.trans ?
                // no parent transaction despite PSD.trans exists. Make sure also
                // that the zone we create is not a sub-zone of current, because
                // Promise.follow() should not wait for it if so.
                usePSD(PSD.transless, function () { return db._whenReady(enterTransactionScope); }) :
                db._whenReady(enterTransactionScope));
        function enterTransactionScope() {
            return Promise.resolve().then(function () {
                // Keep a pointer to last non-transactional PSD to use if someone calls Dexie.ignoreTransaction().
                var transless = PSD.transless || PSD;
                // Our transaction.
                //return new Promise((resolve, reject) => {
                var trans = db._createTransaction(mode, storeNames, globalSchema, parentTransaction);
                // Let the transaction instance be part of a Promise-specific data (PSD) value.
                var zoneProps = {
                    trans: trans,
                    transless: transless
                };
                if (parentTransaction) {
                    // Emulate transaction commit awareness for inner transaction (must 'commit' when the inner transaction has no more operations ongoing)
                    trans.idbtrans = parentTransaction.idbtrans;
                }
                else {
                    trans.create(); // Create the backend transaction so that complete() or error() will trigger even if no operation is made upon it.
                }
                // Support for native async await.
                if (scopeFunc.constructor === AsyncFunction) {
                    incrementExpectedAwaits();
                }
                var returnValue;
                var promiseFollowed = Promise.follow(function () {
                    // Finally, call the scope function with our table and transaction arguments.
                    returnValue = scopeFunc.call(trans, trans);
                    if (returnValue) {
                        if (returnValue.constructor === NativePromise) {
                            var decrementor = decrementExpectedAwaits.bind(null, null);
                            returnValue.then(decrementor, decrementor);
                        }
                        else if (typeof returnValue.next === 'function' && typeof returnValue.throw === 'function') {
                            // scopeFunc returned an iterator with throw-support. Handle yield as await.
                            returnValue = awaitIterator(returnValue);
                        }
                    }
                }, zoneProps);
                return (returnValue && typeof returnValue.then === 'function' ?
                    // Promise returned. User uses promise-style transactions.
                    Promise.resolve(returnValue).then(function (x) { return trans.active ?
                        x // Transaction still active. Continue.
                        : rejection(new exceptions.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn")); })
                    // No promise returned. Wait for all outstanding promises before continuing. 
                    : promiseFollowed.then(function () { return returnValue; })).then(function (x) {
                    // sub transactions don't react to idbtrans.oncomplete. We must trigger a completion:
                    if (parentTransaction)
                        trans._resolve();
                    // wait for trans._completion
                    // (if root transaction, this means 'complete' event. If sub-transaction, we've just fired it ourselves)
                    return trans._completion.then(function () { return x; });
                }).catch(function (e) {
                    trans._reject(e); // Yes, above then-handler were maybe not called because of an unhandled rejection in scopeFunc!
                    return rejection(e);
                });
            });
        }
    };
    this.table = function (tableName) {
        /// <returns type="Table"></returns>
        if (!hasOwn(allTables, tableName)) {
            throw new exceptions.InvalidTable("Table " + tableName + " does not exist");
        }
        return allTables[tableName];
    };
    //
    //
    //
    // Table Class
    //
    //
    //
    function Table(name, tableSchema, optionalTrans) {
        /// <param name="name" type="String"></param>
        this.name = name;
        this.schema = tableSchema;
        this._tx = optionalTrans;
        this.hook = allTables[name] ? allTables[name].hook : Events(null, {
            "creating": [hookCreatingChain, nop],
            "reading": [pureFunctionChain, mirror],
            "updating": [hookUpdatingChain, nop],
            "deleting": [hookDeletingChain, nop]
        });
    }
    function BulkErrorHandlerCatchAll(errorList, done, supportHooks) {
        return (supportHooks ? hookedEventRejectHandler : eventRejectHandler)(function (e) {
            errorList.push(e);
            done && done();
        });
    }
    function bulkDelete(idbstore, trans, keysOrTuples, hasDeleteHook, deletingHook) {
        // If hasDeleteHook, keysOrTuples must be an array of tuples: [[key1, value2],[key2,value2],...],
        // else keysOrTuples must be just an array of keys: [key1, key2, ...].
        return new Promise(function (resolve, reject) {
            var len = keysOrTuples.length, lastItem = len - 1;
            if (len === 0)
                return resolve();
            if (!hasDeleteHook) {
                for (var i = 0; i < len; ++i) {
                    var req = idbstore.delete(keysOrTuples[i]);
                    req.onerror = eventRejectHandler(reject);
                    if (i === lastItem)
                        req.onsuccess = wrap(function () { return resolve(); });
                }
            }
            else {
                var hookCtx, errorHandler = hookedEventRejectHandler(reject), successHandler = hookedEventSuccessHandler(null);
                tryCatch(function () {
                    for (var i = 0; i < len; ++i) {
                        hookCtx = { onsuccess: null, onerror: null };
                        var tuple = keysOrTuples[i];
                        deletingHook.call(hookCtx, tuple[0], tuple[1], trans);
                        var req = idbstore.delete(tuple[0]);
                        req._hookCtx = hookCtx;
                        req.onerror = errorHandler;
                        if (i === lastItem)
                            req.onsuccess = hookedEventSuccessHandler(resolve);
                        else
                            req.onsuccess = successHandler;
                    }
                }, function (err) {
                    hookCtx.onerror && hookCtx.onerror(err);
                    throw err;
                });
            }
        });
    }
    props(Table.prototype, {
        //
        // Table Protected Methods
        //
        _trans: function getTransaction(mode, fn, writeLocked) {
            var trans = this._tx || PSD.trans;
            return trans && trans.db === db ?
                trans === PSD.trans ?
                    trans._promise(mode, fn, writeLocked) :
                    newScope(function () { return trans._promise(mode, fn, writeLocked); }, { trans: trans, transless: PSD.transless || PSD }) :
                tempTransaction(mode, [this.name], fn);
        },
        _idbstore: function getIDBObjectStore(mode, fn, writeLocked) {
            var tableName = this.name;
            function supplyIdbStore(resolve, reject, trans) {
                if (trans.storeNames.indexOf(tableName) === -1)
                    throw new exceptions.NotFound("Table" + tableName + " not part of transaction");
                return fn(resolve, reject, trans.idbtrans.objectStore(tableName), trans);
            }
            return this._trans(mode, supplyIdbStore, writeLocked);
        },
        //
        // Table Public Methods
        //
        get: function (keyOrCrit, cb) {
            if (keyOrCrit && keyOrCrit.constructor === Object)
                return this.where(keyOrCrit).first(cb);
            var self = this;
            return this._idbstore(READONLY, function (resolve, reject, idbstore) {
                var req = idbstore.get(keyOrCrit);
                req.onerror = eventRejectHandler(reject);
                req.onsuccess = wrap(function () {
                    resolve(self.hook.reading.fire(req.result));
                }, reject);
            }).then(cb);
        },
        where: function (indexOrCrit) {
            if (typeof indexOrCrit === 'string')
                return new WhereClause(this, indexOrCrit);
            if (isArray(indexOrCrit))
                return new WhereClause(this, "[" + indexOrCrit.join('+') + "]");
            // indexOrCrit is an object map of {[keyPath]:value} 
            var keyPaths = keys(indexOrCrit);
            if (keyPaths.length === 1)
                // Only one critera. This was the easy case:
                return this
                    .where(keyPaths[0])
                    .equals(indexOrCrit[keyPaths[0]]);
            // Multiple criterias.
            // Let's try finding a compound index that matches all keyPaths in
            // arbritary order:
            var compoundIndex = this.schema.indexes.concat(this.schema.primKey).filter(function (ix) {
                return ix.compound &&
                    keyPaths.every(function (keyPath) { return ix.keyPath.indexOf(keyPath) >= 0; }) &&
                    ix.keyPath.every(function (keyPath) { return keyPaths.indexOf(keyPath) >= 0; });
            })[0];
            if (compoundIndex && maxKey !== maxString)
                // Cool! We found such compound index
                // and this browser supports compound indexes (maxKey !== maxString)!
                return this
                    .where(compoundIndex.name)
                    .equals(compoundIndex.keyPath.map(function (kp) { return indexOrCrit[kp]; }));
            if (!compoundIndex)
                console.warn("The query " + JSON.stringify(indexOrCrit) + " on " + this.name + " would benefit of a " +
                    ("compound index [" + keyPaths.join('+') + "]"));
            // Ok, now let's fallback to finding at least one matching index
            // and filter the rest.
            var idxByName = this.schema.idxByName;
            var simpleIndex = keyPaths.reduce(function (r, keyPath) { return [
                r[0] || idxByName[keyPath],
                r[0] || !idxByName[keyPath] ?
                    combine(r[1], function (x) { return '' + getByKeyPath(x, keyPath) ==
                        '' + indexOrCrit[keyPath]; })
                    : r[1]
            ]; }, [null, null]);
            var idx = simpleIndex[0];
            return idx ?
                this.where(idx.name).equals(indexOrCrit[idx.keyPath])
                    .filter(simpleIndex[1]) :
                compoundIndex ?
                    this.filter(simpleIndex[1]) : // Has compound but browser bad. Allow filter.
                    this.where(keyPaths).equals(''); // No index at all. Fail lazily.
        },
        count: function (cb) {
            return this.toCollection().count(cb);
        },
        offset: function (offset) {
            return this.toCollection().offset(offset);
        },
        limit: function (numRows) {
            return this.toCollection().limit(numRows);
        },
        reverse: function () {
            return this.toCollection().reverse();
        },
        filter: function (filterFunction) {
            return this.toCollection().and(filterFunction);
        },
        each: function (fn) {
            return this.toCollection().each(fn);
        },
        toArray: function (cb) {
            return this.toCollection().toArray(cb);
        },
        orderBy: function (index) {
            return new Collection(new WhereClause(this, isArray(index) ?
                "[" + index.join('+') + "]" :
                index));
        },
        toCollection: function () {
            return new Collection(new WhereClause(this));
        },
        mapToClass: function (constructor, structure) {
            /// <summary>
            ///     Map table to a javascript constructor function. Objects returned from the database will be instances of this class, making
            ///     it possible to the instanceOf operator as well as extending the class using constructor.prototype.method = function(){...}.
            /// </summary>
            /// <param name="constructor">Constructor function representing the class.</param>
            /// <param name="structure" optional="true">Helps IDE code completion by knowing the members that objects contain and not just the indexes. Also
            /// know what type each member has. Example: {name: String, emailAddresses: [String], password}</param>
            this.schema.mappedClass = constructor;
            var instanceTemplate = Object.create(constructor.prototype);
            if (structure) {
                // structure and instanceTemplate is for IDE code competion only while constructor.prototype is for actual inheritance.
                applyStructure(instanceTemplate, structure);
            }
            this.schema.instanceTemplate = instanceTemplate;
            // Now, subscribe to the when("reading") event to make all objects that come out from this table inherit from given class
            // no matter which method to use for reading (Table.get() or Table.where(...)... )
            var readHook = function (obj) {
                if (!obj)
                    return obj; // No valid object. (Value is null). Return as is.
                // Create a new object that derives from constructor:
                var res = Object.create(constructor.prototype);
                // Clone members:
                for (var m in obj)
                    if (hasOwn(obj, m))
                        try {
                            res[m] = obj[m];
                        }
                        catch (_) { }
                return res;
            };
            if (this.schema.readHook) {
                this.hook.reading.unsubscribe(this.schema.readHook);
            }
            this.schema.readHook = readHook;
            this.hook("reading", readHook);
            return constructor;
        },
        defineClass: function (structure) {
            /// <summary>
            ///     Define all members of the class that represents the table. This will help code completion of when objects are read from the database
            ///     as well as making it possible to extend the prototype of the returned constructor function.
            /// </summary>
            /// <param name="structure">Helps IDE code completion by knowing the members that objects contain and not just the indexes. Also
            /// know what type each member has. Example: {name: String, emailAddresses: [String], properties: {shoeSize: Number}}</param>
            return this.mapToClass(Dexie.defineClass(structure), structure);
        },
        bulkDelete: function (keys$$1) {
            if (this.hook.deleting.fire === nop) {
                return this._idbstore(READWRITE, function (resolve, reject, idbstore, trans) {
                    resolve(bulkDelete(idbstore, trans, keys$$1, false, nop));
                });
            }
            else {
                return this
                    .where(':id')
                    .anyOf(keys$$1)
                    .delete()
                    .then(function () { }); // Resolve with undefined.
            }
        },
        bulkPut: function (objects, keys$$1) {
            var _this = this;
            return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
                if (!idbstore.keyPath && !_this.schema.primKey.auto && !keys$$1)
                    throw new exceptions.InvalidArgument("bulkPut() with non-inbound keys requires keys array in second argument");
                if (idbstore.keyPath && keys$$1)
                    throw new exceptions.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
                if (keys$$1 && keys$$1.length !== objects.length)
                    throw new exceptions.InvalidArgument("Arguments objects and keys must have the same length");
                if (objects.length === 0)
                    return resolve(); // Caller provided empty list.
                var done = function (result) {
                    if (errorList.length === 0)
                        resolve(result);
                    else
                        reject(new BulkError(_this.name + ".bulkPut(): " + errorList.length + " of " + numObjs + " operations failed", errorList));
                };
                var req, errorList = [], errorHandler, numObjs = objects.length, table = _this;
                if (_this.hook.creating.fire === nop && _this.hook.updating.fire === nop) {
                    //
                    // Standard Bulk (no 'creating' or 'updating' hooks to care about)
                    //
                    errorHandler = BulkErrorHandlerCatchAll(errorList);
                    for (var i = 0, l = objects.length; i < l; ++i) {
                        req = keys$$1 ? idbstore.put(objects[i], keys$$1[i]) : idbstore.put(objects[i]);
                        req.onerror = errorHandler;
                    }
                    // Only need to catch success or error on the last operation
                    // according to the IDB spec.
                    req.onerror = BulkErrorHandlerCatchAll(errorList, done);
                    req.onsuccess = eventSuccessHandler(done);
                }
                else {
                    var effectiveKeys = keys$$1 || idbstore.keyPath && objects.map(function (o) { return getByKeyPath(o, idbstore.keyPath); });
                    // Generate map of {[key]: object}
                    var objectLookup = effectiveKeys && arrayToObject(effectiveKeys, function (key, i) { return key != null && [key, objects[i]]; });
                    var promise = !effectiveKeys ?
                        // Auto-incremented key-less objects only without any keys argument.
                        table.bulkAdd(objects) :
                        // Keys provided. Either as inbound in provided objects, or as a keys argument.
                        // Begin with updating those that exists in DB:
                        table.where(':id').anyOf(effectiveKeys.filter(function (key) { return key != null; })).modify(function () {
                            this.value = objectLookup[this.primKey];
                            objectLookup[this.primKey] = null; // Mark as "don't add this"
                        }).catch(ModifyError, function (e) {
                            errorList = e.failures; // No need to concat here. These are the first errors added.
                        }).then(function () {
                            // Now, let's examine which items didnt exist so we can add them:
                            var objsToAdd = [], keysToAdd = keys$$1 && [];
                            // Iterate backwards. Why? Because if same key was used twice, just add the last one.
                            for (var i = effectiveKeys.length - 1; i >= 0; --i) {
                                var key = effectiveKeys[i];
                                if (key == null || objectLookup[key]) {
                                    objsToAdd.push(objects[i]);
                                    keys$$1 && keysToAdd.push(key);
                                    if (key != null)
                                        objectLookup[key] = null; // Mark as "dont add again"
                                }
                            }
                            // The items are in reverse order so reverse them before adding.
                            // Could be important in order to get auto-incremented keys the way the caller
                            // would expect. Could have used unshift instead of push()/reverse(),
                            // but: http://jsperf.com/unshift-vs-reverse
                            objsToAdd.reverse();
                            keys$$1 && keysToAdd.reverse();
                            return table.bulkAdd(objsToAdd, keysToAdd);
                        }).then(function (lastAddedKey) {
                            // Resolve with key of the last object in given arguments to bulkPut():
                            var lastEffectiveKey = effectiveKeys[effectiveKeys.length - 1]; // Key was provided.
                            return lastEffectiveKey != null ? lastEffectiveKey : lastAddedKey;
                        });
                    promise.then(done).catch(BulkError, function (e) {
                        // Concat failure from ModifyError and reject using our 'done' method.
                        errorList = errorList.concat(e.failures);
                        done();
                    }).catch(reject);
                }
            }, "locked"); // If called from transaction scope, lock transaction til all steps are done.
        },
        bulkAdd: function (objects, keys$$1) {
            var self = this, creatingHook = this.hook.creating.fire;
            return this._idbstore(READWRITE, function (resolve, reject, idbstore, trans) {
                if (!idbstore.keyPath && !self.schema.primKey.auto && !keys$$1)
                    throw new exceptions.InvalidArgument("bulkAdd() with non-inbound keys requires keys array in second argument");
                if (idbstore.keyPath && keys$$1)
                    throw new exceptions.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
                if (keys$$1 && keys$$1.length !== objects.length)
                    throw new exceptions.InvalidArgument("Arguments objects and keys must have the same length");
                if (objects.length === 0)
                    return resolve(); // Caller provided empty list.
                function done(result) {
                    if (errorList.length === 0)
                        resolve(result);
                    else
                        reject(new BulkError(self.name + ".bulkAdd(): " + errorList.length + " of " + numObjs + " operations failed", errorList));
                }
                var req, errorList = [], errorHandler, successHandler, numObjs = objects.length;
                if (creatingHook !== nop) {
                    //
                    // There are subscribers to hook('creating')
                    // Must behave as documented.
                    //
                    var keyPath = idbstore.keyPath, hookCtx;
                    errorHandler = BulkErrorHandlerCatchAll(errorList, null, true);
                    successHandler = hookedEventSuccessHandler(null);
                    tryCatch(function () {
                        for (var i = 0, l = objects.length; i < l; ++i) {
                            hookCtx = { onerror: null, onsuccess: null };
                            var key = keys$$1 && keys$$1[i];
                            var obj = objects[i], effectiveKey = keys$$1 ? key : keyPath ? getByKeyPath(obj, keyPath) : undefined, keyToUse = creatingHook.call(hookCtx, effectiveKey, obj, trans);
                            if (effectiveKey == null && keyToUse != null) {
                                if (keyPath) {
                                    obj = deepClone(obj);
                                    setByKeyPath(obj, keyPath, keyToUse);
                                }
                                else {
                                    key = keyToUse;
                                }
                            }
                            req = key != null ? idbstore.add(obj, key) : idbstore.add(obj);
                            req._hookCtx = hookCtx;
                            if (i < l - 1) {
                                req.onerror = errorHandler;
                                if (hookCtx.onsuccess)
                                    req.onsuccess = successHandler;
                            }
                        }
                    }, function (err) {
                        hookCtx.onerror && hookCtx.onerror(err);
                        throw err;
                    });
                    req.onerror = BulkErrorHandlerCatchAll(errorList, done, true);
                    req.onsuccess = hookedEventSuccessHandler(done);
                }
                else {
                    //
                    // Standard Bulk (no 'creating' hook to care about)
                    //
                    errorHandler = BulkErrorHandlerCatchAll(errorList);
                    for (var i = 0, l = objects.length; i < l; ++i) {
                        req = keys$$1 ? idbstore.add(objects[i], keys$$1[i]) : idbstore.add(objects[i]);
                        req.onerror = errorHandler;
                    }
                    // Only need to catch success or error on the last operation
                    // according to the IDB spec.
                    req.onerror = BulkErrorHandlerCatchAll(errorList, done);
                    req.onsuccess = eventSuccessHandler(done);
                }
            });
        },
        add: function (obj, key) {
            /// <summary>
            ///   Add an object to the database. In case an object with same primary key already exists, the object will not be added.
            /// </summary>
            /// <param name="obj" type="Object">A javascript object to insert</param>
            /// <param name="key" optional="true">Primary key</param>
            var creatingHook = this.hook.creating.fire;
            return this._idbstore(READWRITE, function (resolve, reject, idbstore, trans) {
                var hookCtx = { onsuccess: null, onerror: null };
                if (creatingHook !== nop) {
                    var effectiveKey = (key != null) ? key : (idbstore.keyPath ? getByKeyPath(obj, idbstore.keyPath) : undefined);
                    var keyToUse = creatingHook.call(hookCtx, effectiveKey, obj, trans); // Allow subscribers to when("creating") to generate the key.
                    if (effectiveKey == null && keyToUse != null) {
                        if (idbstore.keyPath)
                            setByKeyPath(obj, idbstore.keyPath, keyToUse);
                        else
                            key = keyToUse;
                    }
                }
                try {
                    var req = key != null ? idbstore.add(obj, key) : idbstore.add(obj);
                    req._hookCtx = hookCtx;
                    req.onerror = hookedEventRejectHandler(reject);
                    req.onsuccess = hookedEventSuccessHandler(function (result) {
                        // TODO: Remove these two lines in next major release (2.0?)
                        // It's no good practice to have side effects on provided parameters
                        var keyPath = idbstore.keyPath;
                        if (keyPath)
                            setByKeyPath(obj, keyPath, result);
                        resolve(result);
                    });
                }
                catch (e) {
                    if (hookCtx.onerror)
                        hookCtx.onerror(e);
                    throw e;
                }
            });
        },
        put: function (obj, key) {
            var _this = this;
            /// <summary>
            ///   Add an object to the database but in case an object with same primary key alread exists, the existing one will get updated.
            /// </summary>
            /// <param name="obj" type="Object">A javascript object to insert or update</param>
            /// <param name="key" optional="true">Primary key</param>
            var creatingHook = this.hook.creating.fire, updatingHook = this.hook.updating.fire;
            if (creatingHook !== nop || updatingHook !== nop) {
                //
                // People listens to when("creating") or when("updating") events!
                // We must know whether the put operation results in an CREATE or UPDATE.
                //
                var keyPath = this.schema.primKey.keyPath;
                var effectiveKey = (key !== undefined) ? key : (keyPath && getByKeyPath(obj, keyPath));
                if (effectiveKey == null)
                    return this.add(obj);
                // Since key is optional, make sure we get it from obj if not provided
                // Primary key exist. Lock transaction and try modifying existing. If nothing modified, call add().
                // clone obj before this async call. If caller modifies obj the line after put(), the IDB spec requires that it should not affect operation.
                obj = deepClone(obj);
                return this._trans(READWRITE, function () {
                    return _this.where(":id").equals(effectiveKey).modify(function () {
                        // Replace extisting value with our object
                        // CRUD event firing handled in Collection.modify()
                        this.value = obj;
                    }).then(function (count) { return count === 0 ? _this.add(obj, key) : effectiveKey; });
                }, "locked"); // Lock needed because operation is splitted into modify() and add().
            }
            else {
                // Use the standard IDB put() method.
                return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
                    var req = key !== undefined ? idbstore.put(obj, key) : idbstore.put(obj);
                    req.onerror = eventRejectHandler(reject);
                    req.onsuccess = wrap(function (ev) {
                        var keyPath = idbstore.keyPath;
                        if (keyPath)
                            setByKeyPath(obj, keyPath, ev.target.result);
                        resolve(req.result);
                    });
                });
            }
        },
        'delete': function (key) {
            /// <param name="key">Primary key of the object to delete</param>
            if (this.hook.deleting.subscribers.length) {
                // People listens to when("deleting") event. Must implement delete using Collection.delete() that will
                // call the CRUD event. Only Collection.delete() will know whether an object was actually deleted.
                return this.where(":id").equals(key).delete();
            }
            else {
                // No one listens. Use standard IDB delete() method.
                return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
                    var req = idbstore.delete(key);
                    req.onerror = eventRejectHandler(reject);
                    req.onsuccess = wrap(function () {
                        resolve(req.result);
                    });
                });
            }
        },
        clear: function () {
            if (this.hook.deleting.subscribers.length) {
                // People listens to when("deleting") event. Must implement delete using Collection.delete() that will
                // call the CRUD event. Only Collection.delete() will knows which objects that are actually deleted.
                return this.toCollection().delete();
            }
            else {
                return this._idbstore(READWRITE, function (resolve, reject, idbstore) {
                    var req = idbstore.clear();
                    req.onerror = eventRejectHandler(reject);
                    req.onsuccess = wrap(function () {
                        resolve(req.result);
                    });
                });
            }
        },
        update: function (keyOrObject, modifications) {
            if (typeof modifications !== 'object' || isArray(modifications))
                throw new exceptions.InvalidArgument("Modifications must be an object.");
            if (typeof keyOrObject === 'object' && !isArray(keyOrObject)) {
                // object to modify. Also modify given object with the modifications:
                keys(modifications).forEach(function (keyPath) {
                    setByKeyPath(keyOrObject, keyPath, modifications[keyPath]);
                });
                var key = getByKeyPath(keyOrObject, this.schema.primKey.keyPath);
                if (key === undefined)
                    return rejection(new exceptions.InvalidArgument("Given object does not contain its primary key"));
                return this.where(":id").equals(key).modify(modifications);
            }
            else {
                // key to modify
                return this.where(":id").equals(keyOrObject).modify(modifications);
            }
        }
    });
    //
    //
    //
    // Transaction Class
    //
    //
    //
    function Transaction(mode, storeNames, dbschema, parent) {
        var _this = this;
        /// <summary>
        ///    Transaction class. Represents a database transaction. All operations on db goes through a Transaction.
        /// </summary>
        /// <param name="mode" type="String">Any of "readwrite" or "readonly"</param>
        /// <param name="storeNames" type="Array">Array of table names to operate on</param>
        this.db = db;
        this.mode = mode;
        this.storeNames = storeNames;
        this.idbtrans = null;
        this.on = Events(this, "complete", "error", "abort");
        this.parent = parent || null;
        this.active = true;
        this._reculock = 0;
        this._blockedFuncs = [];
        this._resolve = null;
        this._reject = null;
        this._waitingFor = null;
        this._waitingQueue = null;
        this._spinCount = 0; // Just for debugging waitFor()
        this._completion = new Promise(function (resolve, reject) {
            _this._resolve = resolve;
            _this._reject = reject;
        });
        this._completion.then(function () {
            _this.active = false;
            _this.on.complete.fire();
        }, function (e) {
            var wasActive = _this.active;
            _this.active = false;
            _this.on.error.fire(e);
            _this.parent ?
                _this.parent._reject(e) :
                wasActive && _this.idbtrans && _this.idbtrans.abort();
            return rejection(e); // Indicate we actually DO NOT catch this error.
        });
    }
    props(Transaction.prototype, {
        //
        // Transaction Protected Methods (not required by API users, but needed internally and eventually by dexie extensions)
        //
        _lock: function () {
            assert(!PSD.global); // Locking and unlocking reuires to be within a PSD scope.
            // Temporary set all requests into a pending queue if they are called before database is ready.
            ++this._reculock; // Recursive read/write lock pattern using PSD (Promise Specific Data) instead of TLS (Thread Local Storage)
            if (this._reculock === 1 && !PSD.global)
                PSD.lockOwnerFor = this;
            return this;
        },
        _unlock: function () {
            assert(!PSD.global); // Locking and unlocking reuires to be within a PSD scope.
            if (--this._reculock === 0) {
                if (!PSD.global)
                    PSD.lockOwnerFor = null;
                while (this._blockedFuncs.length > 0 && !this._locked()) {
                    var fnAndPSD = this._blockedFuncs.shift();
                    try {
                        usePSD(fnAndPSD[1], fnAndPSD[0]);
                    }
                    catch (e) { }
                }
            }
            return this;
        },
        _locked: function () {
            // Checks if any write-lock is applied on this transaction.
            // To simplify the Dexie API for extension implementations, we support recursive locks.
            // This is accomplished by using "Promise Specific Data" (PSD).
            // PSD data is bound to a Promise and any child Promise emitted through then() or resolve( new Promise() ).
            // PSD is local to code executing on top of the call stacks of any of any code executed by Promise():
            //         * callback given to the Promise() constructor  (function (resolve, reject){...})
            //         * callbacks given to then()/catch()/finally() methods (function (value){...})
            // If creating a new independant Promise instance from within a Promise call stack, the new Promise will derive the PSD from the call stack of the parent Promise.
            // Derivation is done so that the inner PSD __proto__ points to the outer PSD.
            // PSD.lockOwnerFor will point to current transaction object if the currently executing PSD scope owns the lock.
            return this._reculock && PSD.lockOwnerFor !== this;
        },
        create: function (idbtrans) {
            var _this = this;
            if (!this.mode)
                return this;
            assert(!this.idbtrans);
            if (!idbtrans && !idbdb) {
                switch (dbOpenError && dbOpenError.name) {
                    case "DatabaseClosedError":
                        // Errors where it is no difference whether it was caused by the user operation or an earlier call to db.open()
                        throw new exceptions.DatabaseClosed(dbOpenError);
                    case "MissingAPIError":
                        // Errors where it is no difference whether it was caused by the user operation or an earlier call to db.open()
                        throw new exceptions.MissingAPI(dbOpenError.message, dbOpenError);
                    default:
                        // Make it clear that the user operation was not what caused the error - the error had occurred earlier on db.open()!
                        throw new exceptions.OpenFailed(dbOpenError);
                }
            }
            if (!this.active)
                throw new exceptions.TransactionInactive();
            assert(this._completion._state === null);
            idbtrans = this.idbtrans = idbtrans || idbdb.transaction(safariMultiStoreFix(this.storeNames), this.mode);
            idbtrans.onerror = wrap(function (ev) {
                preventDefault(ev); // Prohibit default bubbling to window.error
                _this._reject(idbtrans.error);
            });
            idbtrans.onabort = wrap(function (ev) {
                preventDefault(ev);
                _this.active && _this._reject(new exceptions.Abort(idbtrans.error));
                _this.active = false;
                _this.on("abort").fire(ev);
            });
            idbtrans.oncomplete = wrap(function () {
                _this.active = false;
                _this._resolve();
            });
            return this;
        },
        _promise: function (mode, fn, bWriteLock) {
            var _this = this;
            if (mode === READWRITE && this.mode !== READWRITE)
                return rejection(new exceptions.ReadOnly("Transaction is readonly"));
            if (!this.active)
                return rejection(new exceptions.TransactionInactive());
            if (this._locked()) {
                return new Promise(function (resolve, reject) {
                    _this._blockedFuncs.push([function () {
                            _this._promise(mode, fn, bWriteLock).then(resolve, reject);
                        }, PSD]);
                });
            }
            else if (bWriteLock) {
                return newScope(function () {
                    var p = new Promise(function (resolve, reject) {
                        _this._lock();
                        var rv = fn(resolve, reject, _this);
                        if (rv && rv.then)
                            rv.then(resolve, reject);
                    });
                    p.finally(function () { return _this._unlock(); });
                    p._lib = true;
                    return p;
                });
            }
            else {
                var p = new Promise(function (resolve, reject) {
                    var rv = fn(resolve, reject, _this);
                    if (rv && rv.then)
                        rv.then(resolve, reject);
                });
                p._lib = true;
                return p;
            }
        },
        _root: function () {
            return this.parent ? this.parent._root() : this;
        },
        waitFor: function (promise) {
            // Always operate on the root transaction (in case this is a sub stransaction)
            var root = this._root();
            // For stability reasons, convert parameter to promise no matter what type is passed to waitFor().
            // (We must be able to call .then() on it.)
            promise = Promise.resolve(promise);
            if (root._waitingFor) {
                // Already called waitFor(). Wait for both to complete.
                root._waitingFor = root._waitingFor.then(function () { return promise; });
            }
            else {
                // We're not in waiting state. Start waiting state.
                root._waitingFor = promise;
                root._waitingQueue = [];
                // Start interacting with indexedDB until promise completes:
                var store = root.idbtrans.objectStore(root.storeNames[0]);
                (function spin() {
                    ++root._spinCount; // For debugging only
                    while (root._waitingQueue.length)
                        (root._waitingQueue.shift())();
                    if (root._waitingFor)
                        store.get(-Infinity).onsuccess = spin;
                }());
            }
            var currentWaitPromise = root._waitingFor;
            return new Promise(function (resolve, reject) {
                promise.then(function (res) { return root._waitingQueue.push(wrap(resolve.bind(null, res))); }, function (err) { return root._waitingQueue.push(wrap(reject.bind(null, err))); }).finally(function () {
                    if (root._waitingFor === currentWaitPromise) {
                        // No one added a wait after us. Safe to stop the spinning.
                        root._waitingFor = null;
                    }
                });
            });
        },
        //
        // Transaction Public Properties and Methods
        //
        abort: function () {
            this.active && this._reject(new exceptions.Abort());
            this.active = false;
        },
        tables: {
            get: deprecated("Transaction.tables", function () { return allTables; })
        },
        table: function (name) {
            var table = db.table(name); // Don't check that table is part of transaction. It must fail lazily!
            return new Table(name, table.schema, this);
        }
    });
    //
    //
    //
    // WhereClause
    //
    //
    //
    function WhereClause(table, index, orCollection) {
        /// <param name="table" type="Table"></param>
        /// <param name="index" type="String" optional="true"></param>
        /// <param name="orCollection" type="Collection" optional="true"></param>
        this._ctx = {
            table: table,
            index: index === ":id" ? null : index,
            or: orCollection
        };
    }
    props(WhereClause.prototype, function () {
        // WhereClause private methods
        function fail(collectionOrWhereClause, err, T) {
            var collection = collectionOrWhereClause instanceof WhereClause ?
                new Collection(collectionOrWhereClause) :
                collectionOrWhereClause;
            collection._ctx.error = T ? new T(err) : new TypeError(err);
            return collection;
        }
        function emptyCollection(whereClause) {
            return new Collection(whereClause, function () { return IDBKeyRange.only(""); }).limit(0);
        }
        function upperFactory(dir) {
            return dir === "next" ? function (s) { return s.toUpperCase(); } : function (s) { return s.toLowerCase(); };
        }
        function lowerFactory(dir) {
            return dir === "next" ? function (s) { return s.toLowerCase(); } : function (s) { return s.toUpperCase(); };
        }
        function nextCasing(key, lowerKey, upperNeedle, lowerNeedle, cmp, dir) {
            var length = Math.min(key.length, lowerNeedle.length);
            var llp = -1;
            for (var i = 0; i < length; ++i) {
                var lwrKeyChar = lowerKey[i];
                if (lwrKeyChar !== lowerNeedle[i]) {
                    if (cmp(key[i], upperNeedle[i]) < 0)
                        return key.substr(0, i) + upperNeedle[i] + upperNeedle.substr(i + 1);
                    if (cmp(key[i], lowerNeedle[i]) < 0)
                        return key.substr(0, i) + lowerNeedle[i] + upperNeedle.substr(i + 1);
                    if (llp >= 0)
                        return key.substr(0, llp) + lowerKey[llp] + upperNeedle.substr(llp + 1);
                    return null;
                }
                if (cmp(key[i], lwrKeyChar) < 0)
                    llp = i;
            }
            if (length < lowerNeedle.length && dir === "next")
                return key + upperNeedle.substr(key.length);
            if (length < key.length && dir === "prev")
                return key.substr(0, upperNeedle.length);
            return (llp < 0 ? null : key.substr(0, llp) + lowerNeedle[llp] + upperNeedle.substr(llp + 1));
        }
        function addIgnoreCaseAlgorithm(whereClause, match, needles, suffix) {
            /// <param name="needles" type="Array" elementType="String"></param>
            var upper, lower, compare, upperNeedles, lowerNeedles, direction, nextKeySuffix, needlesLen = needles.length;
            if (!needles.every(function (s) { return typeof s === 'string'; })) {
                return fail(whereClause, STRING_EXPECTED);
            }
            function initDirection(dir) {
                upper = upperFactory(dir);
                lower = lowerFactory(dir);
                compare = (dir === "next" ? simpleCompare : simpleCompareReverse);
                var needleBounds = needles.map(function (needle) {
                    return { lower: lower(needle), upper: upper(needle) };
                }).sort(function (a, b) {
                    return compare(a.lower, b.lower);
                });
                upperNeedles = needleBounds.map(function (nb) { return nb.upper; });
                lowerNeedles = needleBounds.map(function (nb) { return nb.lower; });
                direction = dir;
                nextKeySuffix = (dir === "next" ? "" : suffix);
            }
            initDirection("next");
            var c = new Collection(whereClause, function () {
                return IDBKeyRange.bound(upperNeedles[0], lowerNeedles[needlesLen - 1] + suffix);
            });
            c._ondirectionchange = function (direction) {
                // This event onlys occur before filter is called the first time.
                initDirection(direction);
            };
            var firstPossibleNeedle = 0;
            c._addAlgorithm(function (cursor, advance, resolve) {
                /// <param name="cursor" type="IDBCursor"></param>
                /// <param name="advance" type="Function"></param>
                /// <param name="resolve" type="Function"></param>
                var key = cursor.key;
                if (typeof key !== 'string')
                    return false;
                var lowerKey = lower(key);
                if (match(lowerKey, lowerNeedles, firstPossibleNeedle)) {
                    return true;
                }
                else {
                    var lowestPossibleCasing = null;
                    for (var i = firstPossibleNeedle; i < needlesLen; ++i) {
                        var casing = nextCasing(key, lowerKey, upperNeedles[i], lowerNeedles[i], compare, direction);
                        if (casing === null && lowestPossibleCasing === null)
                            firstPossibleNeedle = i + 1;
                        else if (lowestPossibleCasing === null || compare(lowestPossibleCasing, casing) > 0) {
                            lowestPossibleCasing = casing;
                        }
                    }
                    if (lowestPossibleCasing !== null) {
                        advance(function () { cursor.continue(lowestPossibleCasing + nextKeySuffix); });
                    }
                    else {
                        advance(resolve);
                    }
                    return false;
                }
            });
            return c;
        }
        //
        // WhereClause public methods
        //
        return {
            between: function (lower, upper, includeLower, includeUpper) {
                /// <summary>
                ///     Filter out records whose where-field lays between given lower and upper values. Applies to Strings, Numbers and Dates.
                /// </summary>
                /// <param name="lower"></param>
                /// <param name="upper"></param>
                /// <param name="includeLower" optional="true">Whether items that equals lower should be included. Default true.</param>
                /// <param name="includeUpper" optional="true">Whether items that equals upper should be included. Default false.</param>
                /// <returns type="Collection"></returns>
                includeLower = includeLower !== false; // Default to true
                includeUpper = includeUpper === true; // Default to false
                try {
                    if ((cmp(lower, upper) > 0) ||
                        (cmp(lower, upper) === 0 && (includeLower || includeUpper) && !(includeLower && includeUpper)))
                        return emptyCollection(this); // Workaround for idiotic W3C Specification that DataError must be thrown if lower > upper. The natural result would be to return an empty collection.
                    return new Collection(this, function () { return IDBKeyRange.bound(lower, upper, !includeLower, !includeUpper); });
                }
                catch (e) {
                    return fail(this, INVALID_KEY_ARGUMENT);
                }
            },
            equals: function (value) {
                return new Collection(this, function () { return IDBKeyRange.only(value); });
            },
            above: function (value) {
                return new Collection(this, function () { return IDBKeyRange.lowerBound(value, true); });
            },
            aboveOrEqual: function (value) {
                return new Collection(this, function () { return IDBKeyRange.lowerBound(value); });
            },
            below: function (value) {
                return new Collection(this, function () { return IDBKeyRange.upperBound(value, true); });
            },
            belowOrEqual: function (value) {
                return new Collection(this, function () { return IDBKeyRange.upperBound(value); });
            },
            startsWith: function (str) {
                /// <param name="str" type="String"></param>
                if (typeof str !== 'string')
                    return fail(this, STRING_EXPECTED);
                return this.between(str, str + maxString, true, true);
            },
            startsWithIgnoreCase: function (str) {
                /// <param name="str" type="String"></param>
                if (str === "")
                    return this.startsWith(str);
                return addIgnoreCaseAlgorithm(this, function (x, a) { return x.indexOf(a[0]) === 0; }, [str], maxString);
            },
            equalsIgnoreCase: function (str) {
                /// <param name="str" type="String"></param>
                return addIgnoreCaseAlgorithm(this, function (x, a) { return x === a[0]; }, [str], "");
            },
            anyOfIgnoreCase: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                if (set.length === 0)
                    return emptyCollection(this);
                return addIgnoreCaseAlgorithm(this, function (x, a) { return a.indexOf(x) !== -1; }, set, "");
            },
            startsWithAnyOfIgnoreCase: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                if (set.length === 0)
                    return emptyCollection(this);
                return addIgnoreCaseAlgorithm(this, function (x, a) {
                    return a.some(function (n) {
                        return x.indexOf(n) === 0;
                    });
                }, set, maxString);
            },
            anyOf: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                var compare = ascending;
                try {
                    set.sort(compare);
                }
                catch (e) {
                    return fail(this, INVALID_KEY_ARGUMENT);
                }
                if (set.length === 0)
                    return emptyCollection(this);
                var c = new Collection(this, function () { return IDBKeyRange.bound(set[0], set[set.length - 1]); });
                c._ondirectionchange = function (direction) {
                    compare = (direction === "next" ? ascending : descending);
                    set.sort(compare);
                };
                var i = 0;
                c._addAlgorithm(function (cursor, advance, resolve) {
                    var key = cursor.key;
                    while (compare(key, set[i]) > 0) {
                        // The cursor has passed beyond this key. Check next.
                        ++i;
                        if (i === set.length) {
                            // There is no next. Stop searching.
                            advance(resolve);
                            return false;
                        }
                    }
                    if (compare(key, set[i]) === 0) {
                        // The current cursor value should be included and we should continue a single step in case next item has the same key or possibly our next key in set.
                        return true;
                    }
                    else {
                        // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
                        advance(function () { cursor.continue(set[i]); });
                        return false;
                    }
                });
                return c;
            },
            notEqual: function (value) {
                return this.inAnyRange([[minKey, value], [value, maxKey]], { includeLowers: false, includeUppers: false });
            },
            noneOf: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                if (set.length === 0)
                    return new Collection(this); // Return entire collection.
                try {
                    set.sort(ascending);
                }
                catch (e) {
                    return fail(this, INVALID_KEY_ARGUMENT);
                }
                // Transform ["a","b","c"] to a set of ranges for between/above/below: [[minKey,"a"], ["a","b"], ["b","c"], ["c",maxKey]]
                var ranges = set.reduce(function (res, val) { return res ? res.concat([[res[res.length - 1][1], val]]) : [[minKey, val]]; }, null);
                ranges.push([set[set.length - 1], maxKey]);
                return this.inAnyRange(ranges, { includeLowers: false, includeUppers: false });
            },
            /** Filter out values withing given set of ranges.
            * Example, give children and elders a rebate of 50%:
            *
            *   db.friends.where('age').inAnyRange([[0,18],[65,Infinity]]).modify({Rebate: 1/2});
            *
            * @param {(string|number|Date|Array)[][]} ranges
            * @param {{includeLowers: boolean, includeUppers: boolean}} options
            */
            inAnyRange: function (ranges, options) {
                if (ranges.length === 0)
                    return emptyCollection(this);
                if (!ranges.every(function (range) { return range[0] !== undefined && range[1] !== undefined && ascending(range[0], range[1]) <= 0; })) {
                    return fail(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", exceptions.InvalidArgument);
                }
                var includeLowers = !options || options.includeLowers !== false; // Default to true
                var includeUppers = options && options.includeUppers === true; // Default to false
                function addRange(ranges, newRange) {
                    for (var i = 0, l = ranges.length; i < l; ++i) {
                        var range = ranges[i];
                        if (cmp(newRange[0], range[1]) < 0 && cmp(newRange[1], range[0]) > 0) {
                            range[0] = min(range[0], newRange[0]);
                            range[1] = max(range[1], newRange[1]);
                            break;
                        }
                    }
                    if (i === l)
                        ranges.push(newRange);
                    return ranges;
                }
                var sortDirection = ascending;
                function rangeSorter(a, b) { return sortDirection(a[0], b[0]); }
                // Join overlapping ranges
                var set;
                try {
                    set = ranges.reduce(addRange, []);
                    set.sort(rangeSorter);
                }
                catch (ex) {
                    return fail(this, INVALID_KEY_ARGUMENT);
                }
                var i = 0;
                var keyIsBeyondCurrentEntry = includeUppers ?
                    function (key) { return ascending(key, set[i][1]) > 0; } :
                    function (key) { return ascending(key, set[i][1]) >= 0; };
                var keyIsBeforeCurrentEntry = includeLowers ?
                    function (key) { return descending(key, set[i][0]) > 0; } :
                    function (key) { return descending(key, set[i][0]) >= 0; };
                function keyWithinCurrentRange(key) {
                    return !keyIsBeyondCurrentEntry(key) && !keyIsBeforeCurrentEntry(key);
                }
                var checkKey = keyIsBeyondCurrentEntry;
                var c = new Collection(this, function () {
                    return IDBKeyRange.bound(set[0][0], set[set.length - 1][1], !includeLowers, !includeUppers);
                });
                c._ondirectionchange = function (direction) {
                    if (direction === "next") {
                        checkKey = keyIsBeyondCurrentEntry;
                        sortDirection = ascending;
                    }
                    else {
                        checkKey = keyIsBeforeCurrentEntry;
                        sortDirection = descending;
                    }
                    set.sort(rangeSorter);
                };
                c._addAlgorithm(function (cursor, advance, resolve) {
                    var key = cursor.key;
                    while (checkKey(key)) {
                        // The cursor has passed beyond this key. Check next.
                        ++i;
                        if (i === set.length) {
                            // There is no next. Stop searching.
                            advance(resolve);
                            return false;
                        }
                    }
                    if (keyWithinCurrentRange(key)) {
                        // The current cursor value should be included and we should continue a single step in case next item has the same key or possibly our next key in set.
                        return true;
                    }
                    else if (cmp(key, set[i][1]) === 0 || cmp(key, set[i][0]) === 0) {
                        // includeUpper or includeLower is false so keyWithinCurrentRange() returns false even though we are at range border.
                        // Continue to next key but don't include this one.
                        return false;
                    }
                    else {
                        // cursor.key not yet at set[i]. Forward cursor to the next key to hunt for.
                        advance(function () {
                            if (sortDirection === ascending)
                                cursor.continue(set[i][0]);
                            else
                                cursor.continue(set[i][1]);
                        });
                        return false;
                    }
                });
                return c;
            },
            startsWithAnyOf: function () {
                var set = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
                if (!set.every(function (s) { return typeof s === 'string'; })) {
                    return fail(this, "startsWithAnyOf() only works with strings");
                }
                if (set.length === 0)
                    return emptyCollection(this);
                return this.inAnyRange(set.map(function (str) {
                    return [str, str + maxString];
                }));
            }
        };
    });
    //
    //
    //
    // Collection Class
    //
    //
    //
    function Collection(whereClause, keyRangeGenerator) {
        /// <summary>
        ///
        /// </summary>
        /// <param name="whereClause" type="WhereClause">Where clause instance</param>
        /// <param name="keyRangeGenerator" value="function(){ return IDBKeyRange.bound(0,1);}" optional="true"></param>
        var keyRange = null, error = null;
        if (keyRangeGenerator)
            try {
                keyRange = keyRangeGenerator();
            }
            catch (ex) {
                error = ex;
            }
        var whereCtx = whereClause._ctx, table = whereCtx.table;
        this._ctx = {
            table: table,
            index: whereCtx.index,
            isPrimKey: (!whereCtx.index || (table.schema.primKey.keyPath && whereCtx.index === table.schema.primKey.name)),
            range: keyRange,
            keysOnly: false,
            dir: "next",
            unique: "",
            algorithm: null,
            filter: null,
            replayFilter: null,
            justLimit: true,
            isMatch: null,
            offset: 0,
            limit: Infinity,
            error: error,
            or: whereCtx.or,
            valueMapper: table.hook.reading.fire
        };
    }
    function isPlainKeyRange(ctx, ignoreLimitFilter) {
        return !(ctx.filter || ctx.algorithm || ctx.or) &&
            (ignoreLimitFilter ? ctx.justLimit : !ctx.replayFilter);
    }
    props(Collection.prototype, function () {
        //
        // Collection Private Functions
        //
        function addFilter(ctx, fn) {
            ctx.filter = combine(ctx.filter, fn);
        }
        function addReplayFilter(ctx, factory, isLimitFilter) {
            var curr = ctx.replayFilter;
            ctx.replayFilter = curr ? function () { return combine(curr(), factory()); } : factory;
            ctx.justLimit = isLimitFilter && !curr;
        }
        function addMatchFilter(ctx, fn) {
            ctx.isMatch = combine(ctx.isMatch, fn);
        }
        /** @param ctx {
         *      isPrimKey: boolean,
         *      table: Table,
         *      index: string
         * }
         * @param store IDBObjectStore
         **/
        function getIndexOrStore(ctx, store) {
            if (ctx.isPrimKey)
                return store;
            var indexSpec = ctx.table.schema.idxByName[ctx.index];
            if (!indexSpec)
                throw new exceptions.Schema("KeyPath " + ctx.index + " on object store " + store.name + " is not indexed");
            return store.index(indexSpec.name);
        }
        /** @param ctx {
         *      isPrimKey: boolean,
         *      table: Table,
         *      index: string,
         *      keysOnly: boolean,
         *      range?: IDBKeyRange,
         *      dir: "next" | "prev"
         * }
         */
        function openCursor(ctx, store) {
            var idxOrStore = getIndexOrStore(ctx, store);
            return ctx.keysOnly && 'openKeyCursor' in idxOrStore ?
                idxOrStore.openKeyCursor(ctx.range || null, ctx.dir + ctx.unique) :
                idxOrStore.openCursor(ctx.range || null, ctx.dir + ctx.unique);
        }
        function iter(ctx, fn, resolve, reject, idbstore) {
            var filter = ctx.replayFilter ? combine(ctx.filter, ctx.replayFilter()) : ctx.filter;
            if (!ctx.or) {
                iterate(openCursor(ctx, idbstore), combine(ctx.algorithm, filter), fn, resolve, reject, !ctx.keysOnly && ctx.valueMapper);
            }
            else
                (function () {
                    var set = {};
                    var resolved = 0;
                    function resolveboth() {
                        if (++resolved === 2)
                            resolve(); // Seems like we just support or btwn max 2 expressions, but there are no limit because we do recursion.
                    }
                    function union(item, cursor, advance) {
                        if (!filter || filter(cursor, advance, resolveboth, reject)) {
                            var primaryKey = cursor.primaryKey;
                            var key = '' + primaryKey;
                            if (key === '[object ArrayBuffer]')
                                key = '' + new Uint8Array(primaryKey);
                            if (!hasOwn(set, key)) {
                                set[key] = true;
                                fn(item, cursor, advance);
                            }
                        }
                    }
                    ctx.or._iterate(union, resolveboth, reject, idbstore);
                    iterate(openCursor(ctx, idbstore), ctx.algorithm, union, resolveboth, reject, !ctx.keysOnly && ctx.valueMapper);
                })();
        }
        return {
            //
            // Collection Protected Functions
            //
            _read: function (fn, cb) {
                var ctx = this._ctx;
                return ctx.error ?
                    ctx.table._trans(null, rejection.bind(null, ctx.error)) :
                    ctx.table._idbstore(READONLY, fn).then(cb);
            },
            _write: function (fn) {
                var ctx = this._ctx;
                return ctx.error ?
                    ctx.table._trans(null, rejection.bind(null, ctx.error)) :
                    ctx.table._idbstore(READWRITE, fn, "locked"); // When doing write operations on collections, always lock the operation so that upcoming operations gets queued.
            },
            _addAlgorithm: function (fn) {
                var ctx = this._ctx;
                ctx.algorithm = combine(ctx.algorithm, fn);
            },
            _iterate: function (fn, resolve, reject, idbstore) {
                return iter(this._ctx, fn, resolve, reject, idbstore);
            },
            clone: function (props$$1) {
                var rv = Object.create(this.constructor.prototype), ctx = Object.create(this._ctx);
                if (props$$1)
                    extend(ctx, props$$1);
                rv._ctx = ctx;
                return rv;
            },
            raw: function () {
                this._ctx.valueMapper = null;
                return this;
            },
            //
            // Collection Public methods
            //
            each: function (fn) {
                var ctx = this._ctx;
                return this._read(function (resolve, reject, idbstore) {
                    iter(ctx, fn, resolve, reject, idbstore);
                });
            },
            count: function (cb) {
                var ctx = this._ctx;
                if (isPlainKeyRange(ctx, true)) {
                    // This is a plain key range. We can use the count() method if the index.
                    return this._read(function (resolve, reject, idbstore) {
                        var idx = getIndexOrStore(ctx, idbstore);
                        var req = (ctx.range ? idx.count(ctx.range) : idx.count());
                        req.onerror = eventRejectHandler(reject);
                        req.onsuccess = function (e) {
                            resolve(Math.min(e.target.result, ctx.limit));
                        };
                    }, cb);
                }
                else {
                    // Algorithms, filters or expressions are applied. Need to count manually.
                    var count = 0;
                    return this._read(function (resolve, reject, idbstore) {
                        iter(ctx, function () { ++count; return false; }, function () { resolve(count); }, reject, idbstore);
                    }, cb);
                }
            },
            sortBy: function (keyPath, cb) {
                /// <param name="keyPath" type="String"></param>
                var parts = keyPath.split('.').reverse(), lastPart = parts[0], lastIndex = parts.length - 1;
                function getval(obj, i) {
                    if (i)
                        return getval(obj[parts[i]], i - 1);
                    return obj[lastPart];
                }
                var order = this._ctx.dir === "next" ? 1 : -1;
                function sorter(a, b) {
                    var aVal = getval(a, lastIndex), bVal = getval(b, lastIndex);
                    return aVal < bVal ? -order : aVal > bVal ? order : 0;
                }
                return this.toArray(function (a) {
                    return a.sort(sorter);
                }).then(cb);
            },
            toArray: function (cb) {
                var ctx = this._ctx;
                return this._read(function (resolve, reject, idbstore) {
                    if (hasGetAll && ctx.dir === 'next' && isPlainKeyRange(ctx, true) && ctx.limit > 0) {
                        // Special optimation if we could use IDBObjectStore.getAll() or
                        // IDBKeyRange.getAll():
                        var readingHook = ctx.table.hook.reading.fire;
                        var idxOrStore = getIndexOrStore(ctx, idbstore);
                        var req = ctx.limit < Infinity ?
                            idxOrStore.getAll(ctx.range, ctx.limit) :
                            idxOrStore.getAll(ctx.range);
                        req.onerror = eventRejectHandler(reject);
                        req.onsuccess = readingHook === mirror ?
                            eventSuccessHandler(resolve) :
                            eventSuccessHandler(function (res) {
                                try {
                                    resolve(res.map(readingHook));
                                }
                                catch (e) {
                                    reject(e);
                                }
                            });
                    }
                    else {
                        // Getting array through a cursor.
                        var a = [];
                        iter(ctx, function (item) { a.push(item); }, function arrayComplete() {
                            resolve(a);
                        }, reject, idbstore);
                    }
                }, cb);
            },
            offset: function (offset) {
                var ctx = this._ctx;
                if (offset <= 0)
                    return this;
                ctx.offset += offset; // For count()
                if (isPlainKeyRange(ctx)) {
                    addReplayFilter(ctx, function () {
                        var offsetLeft = offset;
                        return function (cursor, advance) {
                            if (offsetLeft === 0)
                                return true;
                            if (offsetLeft === 1) {
                                --offsetLeft;
                                return false;
                            }
                            advance(function () {
                                cursor.advance(offsetLeft);
                                offsetLeft = 0;
                            });
                            return false;
                        };
                    });
                }
                else {
                    addReplayFilter(ctx, function () {
                        var offsetLeft = offset;
                        return function () { return (--offsetLeft < 0); };
                    });
                }
                return this;
            },
            limit: function (numRows) {
                this._ctx.limit = Math.min(this._ctx.limit, numRows); // For count()
                addReplayFilter(this._ctx, function () {
                    var rowsLeft = numRows;
                    return function (cursor, advance, resolve) {
                        if (--rowsLeft <= 0)
                            advance(resolve); // Stop after this item has been included
                        return rowsLeft >= 0; // If numRows is already below 0, return false because then 0 was passed to numRows initially. Otherwise we wouldnt come here.
                    };
                }, true);
                return this;
            },
            until: function (filterFunction, bIncludeStopEntry) {
                addFilter(this._ctx, function (cursor, advance, resolve) {
                    if (filterFunction(cursor.value)) {
                        advance(resolve);
                        return bIncludeStopEntry;
                    }
                    else {
                        return true;
                    }
                });
                return this;
            },
            first: function (cb) {
                return this.limit(1).toArray(function (a) { return a[0]; }).then(cb);
            },
            last: function (cb) {
                return this.reverse().first(cb);
            },
            filter: function (filterFunction) {
                /// <param name="jsFunctionFilter" type="Function">function(val){return true/false}</param>
                addFilter(this._ctx, function (cursor) {
                    return filterFunction(cursor.value);
                });
                // match filters not used in Dexie.js but can be used by 3rd part libraries to test a
                // collection for a match without querying DB. Used by Dexie.Observable.
                addMatchFilter(this._ctx, filterFunction);
                return this;
            },
            and: function (filterFunction) {
                return this.filter(filterFunction);
            },
            or: function (indexName) {
                return new WhereClause(this._ctx.table, indexName, this);
            },
            reverse: function () {
                this._ctx.dir = (this._ctx.dir === "prev" ? "next" : "prev");
                if (this._ondirectionchange)
                    this._ondirectionchange(this._ctx.dir);
                return this;
            },
            desc: function () {
                return this.reverse();
            },
            eachKey: function (cb) {
                var ctx = this._ctx;
                ctx.keysOnly = !ctx.isMatch;
                return this.each(function (val, cursor) { cb(cursor.key, cursor); });
            },
            eachUniqueKey: function (cb) {
                this._ctx.unique = "unique";
                return this.eachKey(cb);
            },
            eachPrimaryKey: function (cb) {
                var ctx = this._ctx;
                ctx.keysOnly = !ctx.isMatch;
                return this.each(function (val, cursor) { cb(cursor.primaryKey, cursor); });
            },
            keys: function (cb) {
                var ctx = this._ctx;
                ctx.keysOnly = !ctx.isMatch;
                var a = [];
                return this.each(function (item, cursor) {
                    a.push(cursor.key);
                }).then(function () {
                    return a;
                }).then(cb);
            },
            primaryKeys: function (cb) {
                var ctx = this._ctx;
                if (hasGetAll && ctx.dir === 'next' && isPlainKeyRange(ctx, true) && ctx.limit > 0) {
                    // Special optimation if we could use IDBObjectStore.getAllKeys() or
                    // IDBKeyRange.getAllKeys():
                    return this._read(function (resolve, reject, idbstore) {
                        var idxOrStore = getIndexOrStore(ctx, idbstore);
                        var req = ctx.limit < Infinity ?
                            idxOrStore.getAllKeys(ctx.range, ctx.limit) :
                            idxOrStore.getAllKeys(ctx.range);
                        req.onerror = eventRejectHandler(reject);
                        req.onsuccess = eventSuccessHandler(resolve);
                    }).then(cb);
                }
                ctx.keysOnly = !ctx.isMatch;
                var a = [];
                return this.each(function (item, cursor) {
                    a.push(cursor.primaryKey);
                }).then(function () {
                    return a;
                }).then(cb);
            },
            uniqueKeys: function (cb) {
                this._ctx.unique = "unique";
                return this.keys(cb);
            },
            firstKey: function (cb) {
                return this.limit(1).keys(function (a) { return a[0]; }).then(cb);
            },
            lastKey: function (cb) {
                return this.reverse().firstKey(cb);
            },
            distinct: function () {
                var ctx = this._ctx, idx = ctx.index && ctx.table.schema.idxByName[ctx.index];
                if (!idx || !idx.multi)
                    return this; // distinct() only makes differencies on multiEntry indexes.
                var set = {};
                addFilter(this._ctx, function (cursor) {
                    var strKey = cursor.primaryKey.toString(); // Converts any Date to String, String to String, Number to String and Array to comma-separated string
                    var found = hasOwn(set, strKey);
                    set[strKey] = true;
                    return !found;
                });
                return this;
            },
            //
            // Methods that mutate storage
            //
            modify: function (changes) {
                var self = this, ctx = this._ctx, hook = ctx.table.hook, updatingHook = hook.updating.fire, deletingHook = hook.deleting.fire;
                return this._write(function (resolve, reject, idbstore, trans) {
                    var modifyer;
                    if (typeof changes === 'function') {
                        // Changes is a function that may update, add or delete propterties or even require a deletion the object itself (delete this.item)
                        if (updatingHook === nop && deletingHook === nop) {
                            // Noone cares about what is being changed. Just let the modifier function be the given argument as is.
                            modifyer = changes;
                        }
                        else {
                            // People want to know exactly what is being modified or deleted.
                            // Let modifyer be a proxy function that finds out what changes the caller is actually doing
                            // and call the hooks accordingly!
                            modifyer = function (item) {
                                var origItem = deepClone(item); // Clone the item first so we can compare laters.
                                if (changes.call(this, item, this) === false)
                                    return false; // Call the real modifyer function (If it returns false explicitely, it means it dont want to modify anyting on this object)
                                if (!hasOwn(this, "value")) {
                                    // The real modifyer function requests a deletion of the object. Inform the deletingHook that a deletion is taking place.
                                    deletingHook.call(this, this.primKey, item, trans);
                                }
                                else {
                                    // No deletion. Check what was changed
                                    var objectDiff = getObjectDiff(origItem, this.value);
                                    var additionalChanges = updatingHook.call(this, objectDiff, this.primKey, origItem, trans);
                                    if (additionalChanges) {
                                        // Hook want to apply additional modifications. Make sure to fullfill the will of the hook.
                                        item = this.value;
                                        keys(additionalChanges).forEach(function (keyPath) {
                                            setByKeyPath(item, keyPath, additionalChanges[keyPath]); // Adding {keyPath: undefined} means that the keyPath should be deleted. Handled by setByKeyPath
                                        });
                                    }
                                }
                            };
                        }
                    }
                    else if (updatingHook === nop) {
                        // changes is a set of {keyPath: value} and no one is listening to the updating hook.
                        var keyPaths = keys(changes);
                        var numKeys = keyPaths.length;
                        modifyer = function (item) {
                            var anythingModified = false;
                            for (var i = 0; i < numKeys; ++i) {
                                var keyPath = keyPaths[i], val = changes[keyPath];
                                if (getByKeyPath(item, keyPath) !== val) {
                                    setByKeyPath(item, keyPath, val); // Adding {keyPath: undefined} means that the keyPath should be deleted. Handled by setByKeyPath
                                    anythingModified = true;
                                }
                            }
                            return anythingModified;
                        };
                    }
                    else {
                        // changes is a set of {keyPath: value} and people are listening to the updating hook so we need to call it and
                        // allow it to add additional modifications to make.
                        var origChanges = changes;
                        changes = shallowClone(origChanges); // Let's work with a clone of the changes keyPath/value set so that we can restore it in case a hook extends it.
                        modifyer = function (item) {
                            var anythingModified = false;
                            var additionalChanges = updatingHook.call(this, changes, this.primKey, deepClone(item), trans);
                            if (additionalChanges)
                                extend(changes, additionalChanges);
                            keys(changes).forEach(function (keyPath) {
                                var val = changes[keyPath];
                                if (getByKeyPath(item, keyPath) !== val) {
                                    setByKeyPath(item, keyPath, val);
                                    anythingModified = true;
                                }
                            });
                            if (additionalChanges)
                                changes = shallowClone(origChanges); // Restore original changes for next iteration
                            return anythingModified;
                        };
                    }
                    var count = 0;
                    var successCount = 0;
                    var iterationComplete = false;
                    var failures = [];
                    var failKeys = [];
                    var currentKey = null;
                    function modifyItem(item, cursor) {
                        currentKey = cursor.primaryKey;
                        var thisContext = {
                            primKey: cursor.primaryKey,
                            value: item,
                            onsuccess: null,
                            onerror: null
                        };
                        function onerror(e) {
                            failures.push(e);
                            failKeys.push(thisContext.primKey);
                            checkFinished();
                            return true; // Catch these errors and let a final rejection decide whether or not to abort entire transaction
                        }
                        if (modifyer.call(thisContext, item, thisContext) !== false) {
                            var bDelete = !hasOwn(thisContext, "value");
                            ++count;
                            tryCatch(function () {
                                var req = (bDelete ? cursor.delete() : cursor.update(thisContext.value));
                                req._hookCtx = thisContext;
                                req.onerror = hookedEventRejectHandler(onerror);
                                req.onsuccess = hookedEventSuccessHandler(function () {
                                    ++successCount;
                                    checkFinished();
                                });
                            }, onerror);
                        }
                        else if (thisContext.onsuccess) {
                            // Hook will expect either onerror or onsuccess to always be called!
                            thisContext.onsuccess(thisContext.value);
                        }
                    }
                    function doReject(e) {
                        if (e) {
                            failures.push(e);
                            failKeys.push(currentKey);
                        }
                        return reject(new ModifyError("Error modifying one or more objects", failures, successCount, failKeys));
                    }
                    function checkFinished() {
                        if (iterationComplete && successCount + failures.length === count) {
                            if (failures.length > 0)
                                doReject();
                            else
                                resolve(successCount);
                        }
                    }
                    self.clone().raw()._iterate(modifyItem, function () {
                        iterationComplete = true;
                        checkFinished();
                    }, doReject, idbstore);
                });
            },
            'delete': function () {
                var _this = this;
                var ctx = this._ctx, range = ctx.range, deletingHook = ctx.table.hook.deleting.fire, hasDeleteHook = deletingHook !== nop;
                if (!hasDeleteHook &&
                    isPlainKeyRange(ctx) &&
                    ((ctx.isPrimKey && !hangsOnDeleteLargeKeyRange) || !range)) {
                    // May use IDBObjectStore.delete(IDBKeyRange) in this case (Issue #208)
                    // For chromium, this is the way most optimized version.
                    // For IE/Edge, this could hang the indexedDB engine and make operating system instable
                    // (https://gist.github.com/dfahlander/5a39328f029de18222cf2125d56c38f7)
                    return this._write(function (resolve, reject, idbstore) {
                        // Our API contract is to return a count of deleted items, so we have to count() before delete().
                        var onerror = eventRejectHandler(reject), countReq = (range ? idbstore.count(range) : idbstore.count());
                        countReq.onerror = onerror;
                        countReq.onsuccess = function () {
                            var count = countReq.result;
                            tryCatch(function () {
                                var delReq = (range ? idbstore.delete(range) : idbstore.clear());
                                delReq.onerror = onerror;
                                delReq.onsuccess = function () { return resolve(count); };
                            }, function (err) { return reject(err); });
                        };
                    });
                }
                // Default version to use when collection is not a vanilla IDBKeyRange on the primary key.
                // Divide into chunks to not starve RAM.
                // If has delete hook, we will have to collect not just keys but also objects, so it will use
                // more memory and need lower chunk size.
                var CHUNKSIZE = hasDeleteHook ? 2000 : 10000;
                return this._write(function (resolve, reject, idbstore, trans) {
                    var totalCount = 0;
                    // Clone collection and change its table and set a limit of CHUNKSIZE on the cloned Collection instance.
                    var collection = _this
                        .clone({
                        keysOnly: !ctx.isMatch && !hasDeleteHook
                    }) // load just keys (unless filter() or and() or deleteHook has subscribers)
                        .distinct() // In case multiEntry is used, never delete same key twice because resulting count
                        .limit(CHUNKSIZE)
                        .raw(); // Don't filter through reading-hooks (like mapped classes etc)
                    var keysOrTuples = [];
                    // We're gonna do things on as many chunks that are needed.
                    // Use recursion of nextChunk function:
                    var nextChunk = function () { return collection.each(hasDeleteHook ? function (val, cursor) {
                        // Somebody subscribes to hook('deleting'). Collect all primary keys and their values,
                        // so that the hook can be called with its values in bulkDelete().
                        keysOrTuples.push([cursor.primaryKey, cursor.value]);
                    } : function (val, cursor) {
                        // No one subscribes to hook('deleting'). Collect only primary keys:
                        keysOrTuples.push(cursor.primaryKey);
                    }).then(function () {
                        // Chromium deletes faster when doing it in sort order.
                        hasDeleteHook ?
                            keysOrTuples.sort(function (a, b) { return ascending(a[0], b[0]); }) :
                            keysOrTuples.sort(ascending);
                        return bulkDelete(idbstore, trans, keysOrTuples, hasDeleteHook, deletingHook);
                    }).then(function () {
                        var count = keysOrTuples.length;
                        totalCount += count;
                        keysOrTuples = [];
                        return count < CHUNKSIZE ? totalCount : nextChunk();
                    }); };
                    resolve(nextChunk());
                });
            }
        };
    });
    //
    //
    //
    // ------------------------- Help functions ---------------------------
    //
    //
    //
    function lowerVersionFirst(a, b) {
        return a._cfg.version - b._cfg.version;
    }
    function setApiOnPlace(objs, tableNames, dbschema) {
        tableNames.forEach(function (tableName) {
            var schema = dbschema[tableName];
            objs.forEach(function (obj) {
                if (!(tableName in obj)) {
                    if (obj === Transaction.prototype || obj instanceof Transaction) {
                        // obj is a Transaction prototype (or prototype of a subclass to Transaction)
                        // Make the API a getter that returns this.table(tableName)
                        setProp(obj, tableName, { get: function () { return this.table(tableName); } });
                    }
                    else {
                        // Table will not be bound to a transaction (will use Dexie.currentTransaction)
                        obj[tableName] = new Table(tableName, schema);
                    }
                }
            });
        });
    }
    function removeTablesApi(objs) {
        objs.forEach(function (obj) {
            for (var key in obj) {
                if (obj[key] instanceof Table)
                    delete obj[key];
            }
        });
    }
    function iterate(req, filter, fn, resolve, reject, valueMapper) {
        // Apply valueMapper (hook('reading') or mappped class)
        var mappedFn = valueMapper ? function (x, c, a) { return fn(valueMapper(x), c, a); } : fn;
        // Wrap fn with PSD and microtick stuff from Promise.
        var wrappedFn = wrap(mappedFn, reject);
        if (!req.onerror)
            req.onerror = eventRejectHandler(reject);
        if (filter) {
            req.onsuccess = trycatcher(function filter_record() {
                var cursor = req.result;
                if (cursor) {
                    var c = function () { cursor.continue(); };
                    if (filter(cursor, function (advancer) { c = advancer; }, resolve, reject))
                        wrappedFn(cursor.value, cursor, function (advancer) { c = advancer; });
                    c();
                }
                else {
                    resolve();
                }
            }, reject);
        }
        else {
            req.onsuccess = trycatcher(function filter_record() {
                var cursor = req.result;
                if (cursor) {
                    var c = function () { cursor.continue(); };
                    wrappedFn(cursor.value, cursor, function (advancer) { c = advancer; });
                    c();
                }
                else {
                    resolve();
                }
            }, reject);
        }
    }
    function parseIndexSyntax(indexes) {
        /// <param name="indexes" type="String"></param>
        /// <returns type="Array" elementType="IndexSpec"></returns>
        var rv = [];
        indexes.split(',').forEach(function (index) {
            index = index.trim();
            var name = index.replace(/([&*]|\+\+)/g, ""); // Remove "&", "++" and "*"
            // Let keyPath of "[a+b]" be ["a","b"]:
            var keyPath = /^\[/.test(name) ? name.match(/^\[(.*)\]$/)[1].split('+') : name;
            rv.push(new IndexSpec(name, keyPath || null, /\&/.test(index), /\*/.test(index), /\+\+/.test(index), isArray(keyPath), /\./.test(index)));
        });
        return rv;
    }
    function cmp(key1, key2) {
        return indexedDB.cmp(key1, key2);
    }
    function min(a, b) {
        return cmp(a, b) < 0 ? a : b;
    }
    function max(a, b) {
        return cmp(a, b) > 0 ? a : b;
    }
    function ascending(a, b) {
        return indexedDB.cmp(a, b);
    }
    function descending(a, b) {
        return indexedDB.cmp(b, a);
    }
    function simpleCompare(a, b) {
        return a < b ? -1 : a === b ? 0 : 1;
    }
    function simpleCompareReverse(a, b) {
        return a > b ? -1 : a === b ? 0 : 1;
    }
    function combine(filter1, filter2) {
        return filter1 ?
            filter2 ?
                function () { return filter1.apply(this, arguments) && filter2.apply(this, arguments); } :
                filter1 :
            filter2;
    }
    function readGlobalSchema() {
        db.verno = idbdb.version / 10;
        db._dbSchema = globalSchema = {};
        dbStoreNames = slice(idbdb.objectStoreNames, 0);
        if (dbStoreNames.length === 0)
            return; // Database contains no stores.
        var trans = idbdb.transaction(safariMultiStoreFix(dbStoreNames), 'readonly');
        dbStoreNames.forEach(function (storeName) {
            var store = trans.objectStore(storeName), keyPath = store.keyPath, dotted = keyPath && typeof keyPath === 'string' && keyPath.indexOf('.') !== -1;
            var primKey = new IndexSpec(keyPath, keyPath || "", false, false, !!store.autoIncrement, keyPath && typeof keyPath !== 'string', dotted);
            var indexes = [];
            for (var j = 0; j < store.indexNames.length; ++j) {
                var idbindex = store.index(store.indexNames[j]);
                keyPath = idbindex.keyPath;
                dotted = keyPath && typeof keyPath === 'string' && keyPath.indexOf('.') !== -1;
                var index = new IndexSpec(idbindex.name, keyPath, !!idbindex.unique, !!idbindex.multiEntry, false, keyPath && typeof keyPath !== 'string', dotted);
                indexes.push(index);
            }
            globalSchema[storeName] = new TableSchema(storeName, primKey, indexes, {});
        });
        setApiOnPlace([allTables], keys(globalSchema), globalSchema);
    }
    function adjustToExistingIndexNames(schema, idbtrans) {
        /// <summary>
        /// Issue #30 Problem with existing db - adjust to existing index names when migrating from non-dexie db
        /// </summary>
        /// <param name="schema" type="Object">Map between name and TableSchema</param>
        /// <param name="idbtrans" type="IDBTransaction"></param>
        var storeNames = idbtrans.db.objectStoreNames;
        for (var i = 0; i < storeNames.length; ++i) {
            var storeName = storeNames[i];
            var store = idbtrans.objectStore(storeName);
            hasGetAll = 'getAll' in store;
            for (var j = 0; j < store.indexNames.length; ++j) {
                var indexName = store.indexNames[j];
                var keyPath = store.index(indexName).keyPath;
                var dexieName = typeof keyPath === 'string' ? keyPath : "[" + slice(keyPath).join('+') + "]";
                if (schema[storeName]) {
                    var indexSpec = schema[storeName].idxByName[dexieName];
                    if (indexSpec)
                        indexSpec.name = indexName;
                }
            }
        }
        // Bug with getAll() on Safari ver<604 on Workers only, see discussion following PR #579
        if (/Safari/.test(navigator.userAgent) &&
            !/(Chrome\/|Edge\/)/.test(navigator.userAgent) &&
            _global.WorkerGlobalScope && _global instanceof _global.WorkerGlobalScope &&
            [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604) {
            hasGetAll = false;
        }
    }
    function fireOnBlocked(ev) {
        db.on("blocked").fire(ev);
        // Workaround (not fully*) for missing "versionchange" event in IE,Edge and Safari:
        connections
            .filter(function (c) { return c.name === db.name && c !== db && !c._vcFired; })
            .map(function (c) { return c.on("versionchange").fire(ev); });
    }
    extend(this, {
        Collection: Collection,
        Table: Table,
        Transaction: Transaction,
        Version: Version,
        WhereClause: WhereClause
    });
    init();
    addons.forEach(function (fn) {
        fn(db);
    });
}
function parseType(type) {
    if (typeof type === 'function') {
        return new type();
    }
    else if (isArray(type)) {
        return [parseType(type[0])];
    }
    else if (type && typeof type === 'object') {
        var rv = {};
        applyStructure(rv, type);
        return rv;
    }
    else {
        return type;
    }
}
function applyStructure(obj, structure) {
    keys(structure).forEach(function (member) {
        var value = parseType(structure[member]);
        obj[member] = value;
    });
    return obj;
}
function hookedEventSuccessHandler(resolve) {
    // wrap() is needed when calling hooks because the rare scenario of:
    //  * hook does a db operation that fails immediately (IDB throws exception)
    //    For calling db operations on correct transaction, wrap makes sure to set PSD correctly.
    //    wrap() will also execute in a virtual tick.
    //  * If not wrapped in a virtual tick, direct exception will launch a new physical tick.
    //  * If this was the last event in the bulk, the promise will resolve after a physical tick
    //    and the transaction will have committed already.
    // If no hook, the virtual tick will be executed in the reject()/resolve of the final promise,
    // because it is always marked with _lib = true when created using Transaction._promise().
    return wrap(function (event) {
        var req = event.target, ctx = req._hookCtx, // Contains the hook error handler. Put here instead of closure to boost performance.
        result = ctx.value || req.result, // Pass the object value on updates. The result from IDB is the primary key.
        hookSuccessHandler = ctx && ctx.onsuccess;
        hookSuccessHandler && hookSuccessHandler(result);
        resolve && resolve(result);
    }, resolve);
}
function eventRejectHandler(reject) {
    return wrap(function (event) {
        preventDefault(event);
        reject(event.target.error);
        return false;
    });
}
function eventSuccessHandler(resolve) {
    return wrap(function (event) {
        resolve(event.target.result);
    });
}
function hookedEventRejectHandler(reject) {
    return wrap(function (event) {
        // See comment on hookedEventSuccessHandler() why wrap() is needed only when supporting hooks.
        var req = event.target, err = req.error, ctx = req._hookCtx, // Contains the hook error handler. Put here instead of closure to boost performance.
        hookErrorHandler = ctx && ctx.onerror;
        hookErrorHandler && hookErrorHandler(err);
        preventDefault(event);
        reject(err);
        return false;
    });
}
function preventDefault(event) {
    if (event.stopPropagation)
        event.stopPropagation();
    if (event.preventDefault)
        event.preventDefault();
}
function awaitIterator(iterator) {
    var callNext = function (result) { return iterator.next(result); }, doThrow = function (error) { return iterator.throw(error); }, onSuccess = step(callNext), onError = step(doThrow);
    function step(getNext) {
        return function (val) {
            var next = getNext(val), value = next.value;
            return next.done ? value :
                (!value || typeof value.then !== 'function' ?
                    isArray(value) ? Promise.all(value).then(onSuccess, onError) : onSuccess(value) :
                    value.then(onSuccess, onError));
        };
    }
    return step(callNext)();
}
//
// IndexSpec struct
//
function IndexSpec(name, keyPath, unique, multi, auto, compound, dotted) {
    /// <param name="name" type="String"></param>
    /// <param name="keyPath" type="String"></param>
    /// <param name="unique" type="Boolean"></param>
    /// <param name="multi" type="Boolean"></param>
    /// <param name="auto" type="Boolean"></param>
    /// <param name="compound" type="Boolean"></param>
    /// <param name="dotted" type="Boolean"></param>
    this.name = name;
    this.keyPath = keyPath;
    this.unique = unique;
    this.multi = multi;
    this.auto = auto;
    this.compound = compound;
    this.dotted = dotted;
    var keyPathSrc = typeof keyPath === 'string' ? keyPath : keyPath && ('[' + [].join.call(keyPath, '+') + ']');
    this.src = (unique ? '&' : '') + (multi ? '*' : '') + (auto ? "++" : "") + keyPathSrc;
}
//
// TableSchema struct
//
function TableSchema(name, primKey, indexes, instanceTemplate) {
    /// <param name="name" type="String"></param>
    /// <param name="primKey" type="IndexSpec"></param>
    /// <param name="indexes" type="Array" elementType="IndexSpec"></param>
    /// <param name="instanceTemplate" type="Object"></param>
    this.name = name;
    this.primKey = primKey || new IndexSpec();
    this.indexes = indexes || [new IndexSpec()];
    this.instanceTemplate = instanceTemplate;
    this.mappedClass = null;
    this.idxByName = arrayToObject(indexes, function (index) { return [index.name, index]; });
}
function safariMultiStoreFix(storeNames) {
    return storeNames.length === 1 ? storeNames[0] : storeNames;
}
function getNativeGetDatabaseNamesFn(indexedDB) {
    var fn = indexedDB && (indexedDB.getDatabaseNames || indexedDB.webkitGetDatabaseNames);
    return fn && fn.bind(indexedDB);
}
// Export Error classes
props(Dexie, fullNameExceptions); // Dexie.XXXError = class XXXError {...};
//
// Static methods and properties
// 
props(Dexie, {
    //
    // Static delete() method.
    //
    delete: function (databaseName) {
        var db = new Dexie(databaseName), promise = db.delete();
        promise.onblocked = function (fn) {
            db.on("blocked", fn);
            return this;
        };
        return promise;
    },
    //
    // Static exists() method.
    //
    exists: function (name) {
        return new Dexie(name).open().then(function (db) {
            db.close();
            return true;
        }).catch(Dexie.NoSuchDatabaseError, function () { return false; });
    },
    //
    // Static method for retrieving a list of all existing databases at current host.
    //
    getDatabaseNames: function (cb) {
        var getDatabaseNames = getNativeGetDatabaseNamesFn(Dexie.dependencies.indexedDB);
        return getDatabaseNames ? new Promise(function (resolve, reject) {
            var req = getDatabaseNames();
            req.onsuccess = function (event) {
                resolve(slice(event.target.result, 0)); // Converst DOMStringList to Array<String>
            };
            req.onerror = eventRejectHandler(reject);
        }).then(cb) : dbNamesDB.dbnames.toCollection().primaryKeys(cb);
    },
    defineClass: function () {
        // Default constructor able to copy given properties into this object.
        function Class(properties) {
            /// <param name="properties" type="Object" optional="true">Properties to initialize object with.
            /// </param>
            if (properties)
                extend(this, properties);
        }
        return Class;
    },
    applyStructure: applyStructure,
    ignoreTransaction: function (scopeFunc) {
        // In case caller is within a transaction but needs to create a separate transaction.
        // Example of usage:
        //
        // Let's say we have a logger function in our app. Other application-logic should be unaware of the
        // logger function and not need to include the 'logentries' table in all transaction it performs.
        // The logging should always be done in a separate transaction and not be dependant on the current
        // running transaction context. Then you could use Dexie.ignoreTransaction() to run code that starts a new transaction.
        //
        //     Dexie.ignoreTransaction(function() {
        //         db.logentries.add(newLogEntry);
        //     });
        //
        // Unless using Dexie.ignoreTransaction(), the above example would try to reuse the current transaction
        // in current Promise-scope.
        //
        // An alternative to Dexie.ignoreTransaction() would be setImmediate() or setTimeout(). The reason we still provide an
        // API for this because
        //  1) The intention of writing the statement could be unclear if using setImmediate() or setTimeout().
        //  2) setTimeout() would wait unnescessary until firing. This is however not the case with setImmediate().
        //  3) setImmediate() is not supported in the ES standard.
        //  4) You might want to keep other PSD state that was set in a parent PSD, such as PSD.letThrough.
        return PSD.trans ?
            usePSD(PSD.transless, scopeFunc) : // Use the closest parent that was non-transactional.
            scopeFunc(); // No need to change scope because there is no ongoing transaction.
    },
    vip: function (fn) {
        // To be used by subscribers to the on('ready') event.
        // This will let caller through to access DB even when it is blocked while the db.ready() subscribers are firing.
        // This would have worked automatically if we were certain that the Provider was using Dexie.Promise for all asyncronic operations. The promise PSD
        // from the provider.connect() call would then be derived all the way to when provider would call localDatabase.applyChanges(). But since
        // the provider more likely is using non-promise async APIs or other thenable implementations, we cannot assume that.
        // Note that this method is only useful for on('ready') subscribers that is returning a Promise from the event. If not using vip()
        // the database could deadlock since it wont open until the returned Promise is resolved, and any non-VIPed operation started by
        // the caller will not resolve until database is opened.
        return newScope(function () {
            PSD.letThrough = true; // Make sure we are let through if still blocking db due to onready is firing.
            return fn();
        });
    },
    async: function (generatorFn) {
        return function () {
            try {
                var rv = awaitIterator(generatorFn.apply(this, arguments));
                if (!rv || typeof rv.then !== 'function')
                    return Promise.resolve(rv);
                return rv;
            }
            catch (e) {
                return rejection(e);
            }
        };
    },
    spawn: function (generatorFn, args, thiz) {
        try {
            var rv = awaitIterator(generatorFn.apply(thiz, args || []));
            if (!rv || typeof rv.then !== 'function')
                return Promise.resolve(rv);
            return rv;
        }
        catch (e) {
            return rejection(e);
        }
    },
    // Dexie.currentTransaction property
    currentTransaction: {
        get: function () { return PSD.trans || null; }
    },
    waitFor: function (promiseOrFunction, optionalTimeout) {
        // If a function is provided, invoke it and pass the returning value to Transaction.waitFor()
        var promise = Promise.resolve(typeof promiseOrFunction === 'function' ? Dexie.ignoreTransaction(promiseOrFunction) : promiseOrFunction)
            .timeout(optionalTimeout || 60000); // Default the timeout to one minute. Caller may specify Infinity if required.       
        // Run given promise on current transaction. If no current transaction, just return a Dexie promise based
        // on given value.
        return PSD.trans ? PSD.trans.waitFor(promise) : promise;
    },
    // Export our Promise implementation since it can be handy as a standalone Promise implementation
    Promise: Promise,
    // Dexie.debug proptery:
    // Dexie.debug = false
    // Dexie.debug = true
    // Dexie.debug = "dexie" - don't hide dexie's stack frames.
    debug: {
        get: function () { return debug; },
        set: function (value) {
            setDebug(value, value === 'dexie' ? function () { return true; } : dexieStackFrameFilter);
        }
    },
    // Export our derive/extend/override methodology
    derive: derive,
    extend: extend,
    props: props,
    override: override,
    // Export our Events() function - can be handy as a toolkit
    Events: Events,
    // Utilities
    getByKeyPath: getByKeyPath,
    setByKeyPath: setByKeyPath,
    delByKeyPath: delByKeyPath,
    shallowClone: shallowClone,
    deepClone: deepClone,
    getObjectDiff: getObjectDiff,
    asap: asap,
    maxKey: maxKey,
    minKey: minKey,
    // Addon registry
    addons: [],
    // Global DB connection list
    connections: connections,
    MultiModifyError: exceptions.Modify,
    errnames: errnames,
    // Export other static classes
    IndexSpec: IndexSpec,
    TableSchema: TableSchema,
    //
    // Dependencies
    //
    // These will automatically work in browsers with indexedDB support, or where an indexedDB polyfill has been included.
    //
    // In node.js, however, these properties must be set "manually" before instansiating a new Dexie().
    // For node.js, you need to require indexeddb-js or similar and then set these deps.
    //
    dependencies: (function () {
        try {
            return {
                // Required:
                indexedDB: _global.indexedDB || _global.mozIndexedDB || _global.webkitIndexedDB || _global.msIndexedDB,
                IDBKeyRange: _global.IDBKeyRange || _global.webkitIDBKeyRange
            };
        }
        catch (e) {
            return {
                indexedDB: null,
                IDBKeyRange: null
            };
        }
    })(),
    // API Version Number: Type Number, make sure to always set a version number that can be comparable correctly. Example: 0.9, 0.91, 0.92, 1.0, 1.01, 1.1, 1.2, 1.21, etc.
    semVer: DEXIE_VERSION,
    version: DEXIE_VERSION.split('.')
        .map(function (n) { return parseInt(n); })
        .reduce(function (p, c, i) { return p + (c / Math.pow(10, i * 2)); }),
    // https://github.com/dfahlander/Dexie.js/issues/186
    // typescript compiler tsc in mode ts-->es5 & commonJS, will expect require() to return
    // x.default. Workaround: Set Dexie.default = Dexie.
    default: Dexie,
    // Make it possible to import {Dexie} (non-default import)
    // Reason 1: May switch to that in future.
    // Reason 2: We declare it both default and named exported in d.ts to make it possible
    // to let addons extend the Dexie interface with Typescript 2.1 (works only when explicitely
    // exporting the symbol, not just default exporting)
    Dexie: Dexie
});
// Map DOMErrors and DOMExceptions to corresponding Dexie errors. May change in Dexie v2.0.
Promise.rejectionMapper = mapError;
// Initialize dbNamesDB (won't ever be opened on chromium browsers')
dbNamesDB = new Dexie('__dbnames');
dbNamesDB.version(1).stores({ dbnames: 'name' });
(function () {
    // Migrate from Dexie 1.x database names stored in localStorage:
    var DBNAMES = 'Dexie.DatabaseNames';
    try {
        if (typeof localStorage !== undefined && _global.document !== undefined) {
            // Have localStorage and is not executing in a worker. Lets migrate from Dexie 1.x.
            JSON.parse(localStorage.getItem(DBNAMES) || "[]")
                .forEach(function (name) { return dbNamesDB.dbnames.put({ name: name }).catch(nop); });
            localStorage.removeItem(DBNAMES);
        }
    }
    catch (_e) { }
})();

return Dexie;

})));


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"timers":11}],9:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],10:[function(require,module,exports){
var JSBloom = {};

JSBloom.filter = function (items, target_prob) {

    if (typeof items !== "number" || typeof target_prob !== "number" || target_prob >= 1) {
        throw Error("Usage: new JSBloom.filter(items, target_probability)");
    };

    var BUFFER_LEN = (function () {
        var buffer = Math.ceil((items * Math.log(target_prob)) / Math.log(1.0 / (Math.pow(2.0, Math.log(2.0)))));

        if ((buffer % 8) !== 0) {
            buffer += 8 - (buffer % 8);
        };

        return buffer;
    })(),
        HASH_ROUNDS = Math.round(Math.log(2.0) * BUFFER_LEN / items),
        bVector = new Uint8Array(BUFFER_LEN / 8),

        hashes = {
            djb2: function (str) {
                var hash = 5381;

                for (var len = str.length, count = 0; count < len; count++) {
                    hash = hash * 33 ^ str.charCodeAt(count);
                };

                return (hash >>> 0) % BUFFER_LEN;
            },
            sdbm: function (str) {
                var hash = 0;

                for (var len = str.length, count = 0; count < len; count++) {
                    hash = str.charCodeAt(count) + (hash << 6) + (hash << 16) - hash;
                };

                return (hash >>> 0) % BUFFER_LEN;
            }
        },

        addEntry = function (str) {
            var h1 = hashes.djb2(str)
            var h2 = hashes.sdbm(str)
            var added = false
            for (var round = 0; round <= HASH_ROUNDS; round++) {
                var new_hash = round == 0 ? h1
                    : round == 1 ? h2
                        : (h1 + (round * h2) + (round ^ 2)) % BUFFER_LEN;

                var extra_indices = new_hash % 8,
                    index = ((new_hash - extra_indices) / 8);

                if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
                    bVector[index] ^= (128 >> extra_indices - 1);
                    added = true;
                } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
                    bVector[index] ^= 1;
                    added = true;
                }

            };

            return added;
        },

        addEntries = function (arr) {
            for (var i = arr.length - 1; i >= 0; i--) {
                addEntry(arr[i]);
            };

            return true;
        },

        checkEntry = function (str) {
            var index, extra_indices
            var h1 = hashes.djb2(str)

            extra_indices = h1 % 8;
            index = ((h1 - extra_indices) / 8);

            if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
                return false;
            } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
                return false;
            }

            var h2 = hashes.sdbm(str)
            extra_indices = h2 % 8;
            index = ((h2 - extra_indices) / 8);

            if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
                return false;
            } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
                return false;
            }

            for (var round = 2; round <= HASH_ROUNDS; round++) {
                var new_hash = round == 0 ? h1 : round == 1 ? h2 : (h1 + (round * h2) + (round ^ 2)) % BUFFER_LEN;
                var extra_indices = new_hash % 8,
                    index = ((new_hash - extra_indices) / 8);

                if (extra_indices != 0 && (bVector[index] & (128 >> (extra_indices - 1))) == 0) {
                    return false;
                } else if (extra_indices == 0 && (bVector[index] & 1) == 0) {
                    return false;
                }
            };

            return true;
        },

        importData = function (data) {
            bVector = data
        },

        exportData = function () {
            return bVector
        };

    return {
        info: {
            type: "regular",
            buffer: BUFFER_LEN,
            hashes: HASH_ROUNDS,
            raw_buffer: bVector
        },
        hashes: hashes,
        addEntry: addEntry,
        addEntries: addEntries,
        checkEntry: checkEntry,
        importData: importData,
        exportData: exportData
    };
};

if (typeof exports !== "undefined") {
    exports.filter = JSBloom.filter;
};

},{}],11:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":12,"timers":11}],12:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Check if `vhost` is a valid suffix of `hostname` (top-domain)
 *
 * It means that `vhost` needs to be a suffix of `hostname` and we then need to
 * make sure that: either they are equal, or the character preceding `vhost` in
 * `hostname` is a '.' (it should not be a partial label).
 *
 * * hostname = 'not.evil.com' and vhost = 'vil.com'      => not ok
 * * hostname = 'not.evil.com' and vhost = 'evil.com'     => ok
 * * hostname = 'not.evil.com' and vhost = 'not.evil.com' => ok
 */
function shareSameDomainSuffix(hostname, vhost) {
    if (hostname.endsWith(vhost)) {
        return (hostname.length === vhost.length ||
            hostname[hostname.length - vhost.length - 1] === '.');
    }
    return false;
}
/**
 * Given a hostname and its public suffix, extract the general domain.
 */
function extractDomainWithSuffix(hostname, publicSuffix) {
    // Locate the index of the last '.' in the part of the `hostname` preceding
    // the public suffix.
    //
    // examples:
    //   1. not.evil.co.uk  => evil.co.uk
    //         ^    ^
    //         |    | start of public suffix
    //         | index of the last dot
    //
    //   2. example.co.uk   => example.co.uk
    //     ^       ^
    //     |       | start of public suffix
    //     |
    //     | (-1) no dot found before the public suffix
    var publicSuffixIndex = hostname.length - publicSuffix.length - 2;
    var lastDotBeforeSuffixIndex = hostname.lastIndexOf('.', publicSuffixIndex);
    // No '.' found, then `hostname` is the general domain (no sub-domain)
    if (lastDotBeforeSuffixIndex === -1) {
        return hostname;
    }
    // Extract the part between the last '.'
    return hostname.slice(lastDotBeforeSuffixIndex + 1);
}
/**
 * Detects the domain based on rules and upon and a host string
 */
function getDomain(suffix, hostname, options) {
    // Check if `hostname` ends with a member of `validHosts`.
    if (options.validHosts !== null) {
        var validHosts = options.validHosts;
        for (var i = 0; i < validHosts.length; i += 1) {
            var vhost = validHosts[i];
            if (shareSameDomainSuffix(hostname, vhost)) {
                return vhost;
            }
        }
    }
    // If `hostname` is a valid public suffix, then there is no domain to return.
    // Since we already know that `getPublicSuffix` returns a suffix of `hostname`
    // there is no need to perform a string comparison and we only compare the
    // size.
    if (suffix.length === hostname.length) {
        return null;
    }
    // To extract the general domain, we start by identifying the public suffix
    // (if any), then consider the domain to be the public suffix with one added
    // level of depth. (e.g.: if hostname is `not.evil.co.uk` and public suffix:
    // `co.uk`, then we take one more level: `evil`, giving the final result:
    // `evil.co.uk`).
    return extractDomainWithSuffix(hostname, suffix);
}

/**
 * Return the part of domain without suffix.
 *
 * Example: for domain 'foo.com', the result would be 'foo'.
 */
function getDomainWithoutSuffix(domain, suffix) {
    // Note: here `domain` and `suffix` cannot have the same length because in
    // this case we set `domain` to `null` instead. It is thus safe to assume
    // that `suffix` is shorter than `domain`.
    return domain.slice(0, -suffix.length - 1);
}

/**
 * @param url - URL we want to extract a hostname from.
 * @param urlIsValidHostname - hint from caller; true if `url` is already a valid hostname.
 */
function extractHostname(url, urlIsValidHostname) {
    var start = 0;
    var end = url.length;
    var hasUpper = false;
    // If url is not already a valid hostname, then try to extract hostname.
    if (urlIsValidHostname === false) {
        // Trim leading spaces
        while (start < url.length && url.charCodeAt(start) <= 32) {
            start += 1;
        }
        // Trim trailing spaces
        while (end > start + 1 && url.charCodeAt(end - 1) <= 32) {
            end -= 1;
        }
        // Skip scheme.
        if (url.charCodeAt(start) === 47 /* '/' */ &&
            url.charCodeAt(start + 1) === 47 /* '/' */) {
            start += 2;
        }
        else {
            var indexOfProtocol = url.indexOf(':/', start);
            if (indexOfProtocol !== -1) {
                // Implement fast-path for common protocols. We expect most protocols
                // should be one of these 4 and thus we will not need to perform the
                // more expansive validity check most of the time.
                var protocolSize = indexOfProtocol - start;
                var c0 = url.charCodeAt(start);
                var c1 = url.charCodeAt(start + 1);
                var c2 = url.charCodeAt(start + 2);
                var c3 = url.charCodeAt(start + 3);
                var c4 = url.charCodeAt(start + 4);
                if (protocolSize === 5 &&
                    c0 === 104 /* 'h' */ &&
                    c1 === 116 /* 't' */ &&
                    c2 === 116 /* 't' */ &&
                    c3 === 112 /* 'p' */ &&
                    c4 === 115 /* 's' */) ;
                else if (protocolSize === 4 &&
                    c0 === 104 /* 'h' */ &&
                    c1 === 116 /* 't' */ &&
                    c2 === 116 /* 't' */ &&
                    c3 === 112 /* 'p' */) ;
                else if (protocolSize === 3 &&
                    c0 === 119 /* 'w' */ &&
                    c1 === 115 /* 's' */ &&
                    c2 === 115 /* 's' */) ;
                else if (protocolSize === 2 &&
                    c0 === 119 /* 'w' */ &&
                    c1 === 115 /* 's' */) ;
                else {
                    // Check that scheme is valid
                    for (var i = start; i < indexOfProtocol; i += 1) {
                        var lowerCaseCode = url.charCodeAt(i) | 32;
                        if (((lowerCaseCode >= 97 && lowerCaseCode <= 122) || // [a, z]
                            (lowerCaseCode >= 48 && lowerCaseCode <= 57) || // [0, 9]
                            lowerCaseCode === 46 || // '.'
                            lowerCaseCode === 45 || // '-'
                            lowerCaseCode === 43) === false // '+'
                        ) {
                            return null;
                        }
                    }
                }
                // Skip 0, 1 or more '/' after ':/'
                start = indexOfProtocol + 2;
                while (url.charCodeAt(start) === 47 /* '/' */) {
                    start += 1;
                }
            }
        }
        // Detect first occurrence of '/', '?' or '#'. We also keep track of the
        // last occurrence of '@', ']' or ':' to speed-up subsequent parsing of
        // (respectively), identifier, ipv6 or port.
        var indexOfIdentifier = -1;
        var indexOfClosingBracket = -1;
        var indexOfPort = -1;
        for (var i = start; i < end; i += 1) {
            var code = url.charCodeAt(i);
            if (code === 35 || // '#'
                code === 47 || // '/'
                code === 63 // '?'
            ) {
                end = i;
                break;
            }
            else if (code === 64) {
                // '@'
                indexOfIdentifier = i;
            }
            else if (code === 93) {
                // ']'
                indexOfClosingBracket = i;
            }
            else if (code === 58) {
                // ':'
                indexOfPort = i;
            }
            else if (code >= 65 && code <= 90) {
                hasUpper = true;
            }
        }
        // Detect identifier: '@'
        if (indexOfIdentifier !== -1 &&
            indexOfIdentifier > start &&
            indexOfIdentifier < end) {
            start = indexOfIdentifier + 1;
        }
        // Handle ipv6 addresses
        if (url.charCodeAt(start) === 91 /* '[' */) {
            if (indexOfClosingBracket !== -1) {
                return url.slice(start + 1, indexOfClosingBracket).toLowerCase();
            }
            return null;
        }
        else if (indexOfPort !== -1 && indexOfPort > start && indexOfPort < end) {
            // Detect port: ':'
            end = indexOfPort;
        }
    }
    // Trim trailing dots
    while (end > start + 1 && url.charCodeAt(end - 1) === 46 /* '.' */) {
        end -= 1;
    }
    var hostname = start !== 0 || end !== url.length ? url.slice(start, end) : url;
    if (hasUpper) {
        return hostname.toLowerCase();
    }
    return hostname;
}

/**
 * Check if a hostname is an IP. You should be aware that this only works
 * because `hostname` is already garanteed to be a valid hostname!
 */
function isProbablyIpv4(hostname) {
    // Cannot be shorted than 1.1.1.1
    if (hostname.length < 7) {
        return false;
    }
    // Cannot be longer than: 255.255.255.255
    if (hostname.length > 15) {
        return false;
    }
    var numberOfDots = 0;
    for (var i = 0; i < hostname.length; i += 1) {
        var code = hostname.charCodeAt(i);
        if (code === 46 /* '.' */) {
            numberOfDots += 1;
        }
        else if (code < 48 /* '0' */ || code > 57 /* '9' */) {
            return false;
        }
    }
    return (numberOfDots === 3 &&
        hostname.charCodeAt(0) !== 46 /* '.' */ &&
        hostname.charCodeAt(hostname.length - 1) !== 46 /* '.' */);
}
/**
 * Similar to isProbablyIpv4.
 */
function isProbablyIpv6(hostname) {
    if (hostname.length < 3) {
        return false;
    }
    var start = hostname[0] === '[' ? 1 : 0;
    var end = hostname.length;
    if (hostname[end - 1] === ']') {
        end -= 1;
    }
    // We only consider the maximum size of a normal IPV6. Note that this will
    // fail on so-called "IPv4 mapped IPv6 addresses" but this is a corner-case
    // and a proper validation library should be used for these.
    if (end - start > 39) {
        return false;
    }
    var hasColon = false;
    for (; start < end; start += 1) {
        var code = hostname.charCodeAt(start);
        if (code === 58 /* ':' */) {
            hasColon = true;
        }
        else if (((code >= 48 && code <= 57) || // 0-9
            (code >= 97 && code <= 102) || // a-f
            (code >= 65 && code <= 90) // A-F
        ) === false) {
            return false;
        }
    }
    return hasColon;
}
/**
 * Check if `hostname` is *probably* a valid ip addr (either ipv6 or ipv4).
 * This *will not* work on any string. We need `hostname` to be a valid
 * hostname.
 */
function isIp(hostname) {
    return isProbablyIpv6(hostname) || isProbablyIpv4(hostname);
}

/**
 * Implements fast shallow verification of hostnames. This does not perform a
 * struct check on the content of labels (classes of Unicode characters, etc.)
 * but instead check that the structure is valid (number of labels, length of
 * labels, etc.).
 *
 * If you need stricter validation, consider using an external library.
 */
function isValidAscii(code) {
    return ((code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code > 127);
}
/**
 * Check if a hostname string is valid. It's usually a preliminary check before
 * trying to use getDomain or anything else.
 *
 * Beware: it does not check if the TLD exists.
 */
function isValidHostname (hostname) {
    if (hostname.length > 255) {
        return false;
    }
    if (hostname.length === 0) {
        return false;
    }
    if (!isValidAscii(hostname.charCodeAt(0))) {
        return false;
    }
    // Validate hostname according to RFC
    var lastDotIndex = -1;
    var lastCharCode = -1;
    var len = hostname.length;
    for (var i = 0; i < len; i += 1) {
        var code = hostname.charCodeAt(i);
        if (code === 46 /* '.' */) {
            if (
            // Check that previous label is < 63 bytes long (64 = 63 + '.')
            i - lastDotIndex > 64 ||
                // Check that previous character was not already a '.'
                lastCharCode === 46 ||
                // Check that the previous label does not end with a '-' (dash)
                lastCharCode === 45 ||
                // Check that the previous label does not end with a '_' (underscore)
                lastCharCode === 95) {
                return false;
            }
            lastDotIndex = i;
        }
        else if (!(isValidAscii(code) || code === 45 || code === 95)) {
            // Check if there is a forbidden character in the label
            return false;
        }
        lastCharCode = code;
    }
    return (
    // Check that last label is shorter than 63 chars
    len - lastDotIndex - 1 <= 63 &&
        // Check that the last character is an allowed trailing label character.
        // Since we already checked that the char is a valid hostname character,
        // we only need to check that it's different from '-'.
        lastCharCode !== 45);
}

function setDefaultsImpl(_a) {
    var _b = _a.allowIcannDomains, allowIcannDomains = _b === void 0 ? true : _b, _c = _a.allowPrivateDomains, allowPrivateDomains = _c === void 0 ? false : _c, _d = _a.detectIp, detectIp = _d === void 0 ? true : _d, _e = _a.extractHostname, extractHostname = _e === void 0 ? true : _e, _f = _a.mixedInputs, mixedInputs = _f === void 0 ? true : _f, _g = _a.validHosts, validHosts = _g === void 0 ? null : _g, _h = _a.validateHostname, validateHostname = _h === void 0 ? true : _h;
    return {
        allowIcannDomains: allowIcannDomains,
        allowPrivateDomains: allowPrivateDomains,
        detectIp: detectIp,
        extractHostname: extractHostname,
        mixedInputs: mixedInputs,
        validHosts: validHosts,
        validateHostname: validateHostname
    };
}
var DEFAULT_OPTIONS = setDefaultsImpl({});
function setDefaults(options) {
    if (options === undefined) {
        return DEFAULT_OPTIONS;
    }
    return setDefaultsImpl(options);
}

/**
 * Returns the subdomain of a hostname string
 */
function getSubdomain(hostname, domain) {
    // If `hostname` and `domain` are the same, then there is no sub-domain
    if (domain.length === hostname.length) {
        return '';
    }
    return hostname.slice(0, -domain.length - 1);
}

/**
 * Implement a factory allowing to plug different implementations of suffix
 * lookup (e.g.: using a trie or the packed hashes datastructures). This is used
 * and exposed in `tldts.ts` and `tldts-experimental.ts` bundle entrypoints.
 */
function getEmptyResult() {
    return {
        domain: null,
        domainWithoutSuffix: null,
        hostname: null,
        isIcann: null,
        isIp: null,
        isPrivate: null,
        publicSuffix: null,
        subdomain: null
    };
}
function resetResult(result) {
    result.domain = null;
    result.domainWithoutSuffix = null;
    result.hostname = null;
    result.isIcann = null;
    result.isIp = null;
    result.isPrivate = null;
    result.publicSuffix = null;
    result.subdomain = null;
}
function parseImpl(url, step, suffixLookup, partialOptions, result) {
    var options = setDefaults(partialOptions);
    // Very fast approximate check to make sure `url` is a string. This is needed
    // because the library will not necessarily be used in a typed setup and
    // values of arbitrary types might be given as argument.
    if (typeof url !== 'string') {
        return result;
    }
    // Extract hostname from `url` only if needed. This can be made optional
    // using `options.extractHostname`. This option will typically be used
    // whenever we are sure the inputs to `parse` are already hostnames and not
    // arbitrary URLs.
    //
    // `mixedInput` allows to specify if we expect a mix of URLs and hostnames
    // as input. If only hostnames are expected then `extractHostname` can be
    // set to `false` to speed-up parsing. If only URLs are expected then
    // `mixedInputs` can be set to `false`. The `mixedInputs` is only a hint
    // and will not change the behavior of the library.
    if (options.extractHostname === false) {
        result.hostname = url;
    }
    else if (options.mixedInputs === true) {
        result.hostname = extractHostname(url, isValidHostname(url));
    }
    else {
        result.hostname = extractHostname(url, false);
    }
    if (step === 0 /* HOSTNAME */ || result.hostname === null) {
        return result;
    }
    // Check if `hostname` is a valid ip address
    if (options.detectIp === true) {
        result.isIp = isIp(result.hostname);
        if (result.isIp === true) {
            return result;
        }
    }
    // Perform optional hostname validation. If hostname is not valid, no need to
    // go further as there will be no valid domain or sub-domain.
    if (options.validateHostname === true &&
        options.extractHostname === true &&
        isValidHostname(result.hostname) === false) {
        result.hostname = null;
        return result;
    }
    // Extract public suffix
    suffixLookup(result.hostname, options, result);
    if (step === 2 /* PUBLIC_SUFFIX */ || result.publicSuffix === null) {
        return result;
    }
    // Extract domain
    result.domain = getDomain(result.publicSuffix, result.hostname, options);
    if (step === 3 /* DOMAIN */ || result.domain === null) {
        return result;
    }
    // Extract subdomain
    result.subdomain = getSubdomain(result.hostname, result.domain);
    if (step === 4 /* SUB_DOMAIN */) {
        return result;
    }
    // Extract domain without suffix
    result.domainWithoutSuffix = getDomainWithoutSuffix(result.domain, result.publicSuffix);
    return result;
}

function fastPathLookup (hostname, options, out) {
    // Fast path for very popular suffixes; this allows to by-pass lookup
    // completely as well as any extra allocation or string manipulation.
    if (options.allowPrivateDomains === false && hostname.length > 3) {
        var last = hostname.length - 1;
        var c3 = hostname.charCodeAt(last);
        var c2 = hostname.charCodeAt(last - 1);
        var c1 = hostname.charCodeAt(last - 2);
        var c0 = hostname.charCodeAt(last - 3);
        if (c3 === 109 /* 'm' */ &&
            c2 === 111 /* 'o' */ &&
            c1 === 99 /* 'c' */ &&
            c0 === 46 /* '.' */) {
            out.isIcann = true;
            out.isPrivate = false;
            out.publicSuffix = 'com';
            return true;
        }
        else if (c3 === 103 /* 'g' */ &&
            c2 === 114 /* 'r' */ &&
            c1 === 111 /* 'o' */ &&
            c0 === 46 /* '.' */) {
            out.isIcann = true;
            out.isPrivate = false;
            out.publicSuffix = 'org';
            return true;
        }
        else if (c3 === 117 /* 'u' */ &&
            c2 === 100 /* 'd' */ &&
            c1 === 101 /* 'e' */ &&
            c0 === 46 /* '.' */) {
            out.isIcann = true;
            out.isPrivate = false;
            out.publicSuffix = 'edu';
            return true;
        }
        else if (c3 === 118 /* 'v' */ &&
            c2 === 111 /* 'o' */ &&
            c1 === 103 /* 'g' */ &&
            c0 === 46 /* '.' */) {
            out.isIcann = true;
            out.isPrivate = false;
            out.publicSuffix = 'gov';
            return true;
        }
        else if (c3 === 116 /* 't' */ &&
            c2 === 101 /* 'e' */ &&
            c1 === 110 /* 'n' */ &&
            c0 === 46 /* '.' */) {
            out.isIcann = true;
            out.isPrivate = false;
            out.publicSuffix = 'net';
            return true;
        }
        else if (c3 === 101 /* 'e' */ &&
            c2 === 100 /* 'd' */ &&
            c1 === 46 /* '.' */) {
            out.isIcann = true;
            out.isPrivate = false;
            out.publicSuffix = 'de';
            return true;
        }
    }
    return false;
}

var exceptions = (function () {
    var _0 = { "$": 1, "succ": {} }, _1 = { "$": 0, "succ": { "city": _0 } };
    var exceptions = { "$": 0, "succ": { "ck": { "$": 0, "succ": { "www": _0 } }, "jp": { "$": 0, "succ": { "kawasaki": _1, "kitakyushu": _1, "kobe": _1, "nagoya": _1, "sapporo": _1, "sendai": _1, "yokohama": _1 } } } };
    return exceptions;
})();
var rules = (function () {
    var _2 = { "$": 1, "succ": {} }, _3 = { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "net": _2, "mil": _2, "org": _2 } }, _4 = { "$": 2, "succ": {} }, _5 = { "$": 1, "succ": { "blogspot": _4 } }, _6 = { "$": 1, "succ": { "gov": _2 } }, _7 = { "$": 0, "succ": { "*": _4 } }, _8 = { "$": 0, "succ": { "*": _2 } }, _9 = { "$": 1, "succ": { "com": _2, "edu": _2, "net": _2, "org": _2, "gov": _2 } }, _10 = { "$": 1, "succ": { "co": _4 } }, _11 = { "$": 1, "succ": { "ng": _4 } }, _12 = { "$": 0, "succ": { "s3": _4 } }, _13 = { "$": 0, "succ": { "dualstack": _12 } }, _14 = { "$": 0, "succ": { "s3": _4, "dualstack": _12, "s3-website": _4 } }, _15 = { "$": 0, "succ": { "apps": _4 } }, _16 = { "$": 0, "succ": { "app": _4 } }, _17 = { "$": 1, "succ": { "com": _2, "edu": _2, "net": _2, "org": _2 } }, _18 = { "$": 0, "succ": { "user": _4 } }, _19 = { "$": 1, "succ": { "ybo": _4 } }, _20 = { "$": 1, "succ": { "nom": _4 } }, _21 = { "$": 1, "succ": { "gov": _2, "blogspot": _4, "nym": _4 } }, _22 = { "$": 0, "succ": { "cust": _4 } }, _23 = { "$": 1, "succ": { "edu": _2, "biz": _2, "net": _2, "org": _2, "gov": _2, "info": _2, "com": _2 } }, _24 = { "$": 1, "succ": { "blogspot": _4, "nym": _4 } }, _25 = { "$": 1, "succ": { "for": _4 } }, _26 = { "$": 1, "succ": { "barsy": _4 } }, _27 = { "$": 0, "succ": { "forgot": _4 } }, _28 = { "$": 1, "succ": { "gs": _2 } }, _29 = { "$": 0, "succ": { "nes": _2 } }, _30 = { "$": 1, "succ": { "k12": _2, "cc": _2, "lib": _2 } }, _31 = { "$": 1, "succ": { "cc": _2, "lib": _2 } };
    var rules = { "$": 0, "succ": { "ac": _3, "ad": { "$": 1, "succ": { "nom": _2 } }, "ae": { "$": 1, "succ": { "co": _2, "net": _2, "org": _2, "sch": _2, "ac": _2, "gov": _2, "mil": _2, "blogspot": _4, "nom": _4 } }, "aero": { "$": 1, "succ": { "accident-investigation": _2, "accident-prevention": _2, "aerobatic": _2, "aeroclub": _2, "aerodrome": _2, "agents": _2, "aircraft": _2, "airline": _2, "airport": _2, "air-surveillance": _2, "airtraffic": _2, "air-traffic-control": _2, "ambulance": _2, "amusement": _2, "association": _2, "author": _2, "ballooning": _2, "broker": _2, "caa": _2, "cargo": _2, "catering": _2, "certification": _2, "championship": _2, "charter": _2, "civilaviation": _2, "club": _2, "conference": _2, "consultant": _2, "consulting": _2, "control": _2, "council": _2, "crew": _2, "design": _2, "dgca": _2, "educator": _2, "emergency": _2, "engine": _2, "engineer": _2, "entertainment": _2, "equipment": _2, "exchange": _2, "express": _2, "federation": _2, "flight": _2, "freight": _2, "fuel": _2, "gliding": _2, "government": _2, "groundhandling": _2, "group": _2, "hanggliding": _2, "homebuilt": _2, "insurance": _2, "journal": _2, "journalist": _2, "leasing": _2, "logistics": _2, "magazine": _2, "maintenance": _2, "media": _2, "microlight": _2, "modelling": _2, "navigation": _2, "parachuting": _2, "paragliding": _2, "passenger-association": _2, "pilot": _2, "press": _2, "production": _2, "recreation": _2, "repbody": _2, "res": _2, "research": _2, "rotorcraft": _2, "safety": _2, "scientist": _2, "services": _2, "show": _2, "skydiving": _2, "software": _2, "student": _2, "trader": _2, "trading": _2, "trainer": _2, "union": _2, "workinggroup": _2, "works": _2 } }, "af": { "$": 1, "succ": { "gov": _2, "com": _2, "org": _2, "net": _2, "edu": _2, "nom": _4 } }, "ag": { "$": 1, "succ": { "com": _2, "org": _2, "net": _2, "co": _2, "nom": _2 } }, "ai": { "$": 1, "succ": { "off": _2, "com": _2, "net": _2, "org": _2, "uwu": _4, "nom": _4 } }, "al": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "blogspot": _4, "nom": _4 } }, "am": { "$": 1, "succ": { "co": _2, "com": _2, "commune": _2, "net": _2, "org": _2, "blogspot": _4 } }, "ao": { "$": 1, "succ": { "ed": _2, "gv": _2, "og": _2, "co": _2, "pb": _2, "it": _2 } }, "aq": _2, "ar": { "$": 1, "succ": { "com": _5, "edu": _2, "gob": _2, "gov": _2, "int": _2, "mil": _2, "musica": _2, "net": _2, "org": _2, "tur": _2 } }, "arpa": { "$": 1, "succ": { "e164": _2, "in-addr": _2, "ip6": _2, "iris": _2, "uri": _2, "urn": _2 } }, "as": _6, "asia": { "$": 1, "succ": { "cloudns": _4 } }, "at": { "$": 1, "succ": { "ac": _2, "co": _5, "gv": _2, "or": _2, "futurecms": { "$": 0, "succ": { "*": _4, "ex": _7, "in": _7 } }, "futurehosting": _4, "futuremailing": _4, "ortsinfo": { "$": 0, "succ": { "ex": _7, "kunden": _7 } }, "biz": _4, "info": _4, "priv": _4, "12hp": _4, "2ix": _4, "4lima": _4, "lima-city": _4 } }, "au": { "$": 1, "succ": { "com": _5, "net": _2, "org": _2, "edu": { "$": 1, "succ": { "act": _2, "catholic": _2, "eq": _2, "nsw": { "$": 1, "succ": { "schools": _2 } }, "nt": _2, "qld": _2, "sa": _2, "tas": { "$": 1, "succ": { "education": _2 } }, "vic": _2, "wa": _2 } }, "gov": { "$": 1, "succ": { "qld": _2, "sa": _2, "tas": _2, "vic": _2, "wa": _2 } }, "asn": _2, "id": _2, "info": _2, "conf": _2, "oz": _2, "act": _2, "nsw": _2, "nt": _2, "qld": _2, "sa": _2, "tas": _2, "vic": _2, "wa": _2 } }, "aw": { "$": 1, "succ": { "com": _2 } }, "ax": _2, "az": { "$": 1, "succ": { "com": _2, "net": _2, "int": _2, "gov": _2, "org": _2, "edu": _2, "info": _2, "pp": _2, "mil": _2, "name": _2, "pro": _2, "biz": _2 } }, "ba": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "blogspot": _4 } }, "bb": { "$": 1, "succ": { "biz": _2, "co": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "net": _2, "org": _2, "store": _2, "tv": _2 } }, "bd": _8, "be": { "$": 1, "succ": { "ac": _2, "webhosting": _4, "blogspot": _4, "transurl": _7 } }, "bf": _6, "bg": { "$": 1, "succ": { "0": _2, "1": _2, "2": _2, "3": _2, "4": _2, "5": _2, "6": _2, "7": _2, "8": _2, "9": _2, "a": _2, "b": _2, "c": _2, "d": _2, "e": _2, "f": _2, "g": _2, "h": _2, "i": _2, "j": _2, "k": _2, "l": _2, "m": _2, "n": _2, "o": _2, "p": _2, "q": _2, "r": _2, "s": _2, "t": _2, "u": _2, "v": _2, "w": _2, "x": _2, "y": _2, "z": _2, "blogspot": _4, "barsy": _4 } }, "bh": _9, "bi": { "$": 1, "succ": { "co": _2, "com": _2, "edu": _2, "or": _2, "org": _2 } }, "biz": { "$": 1, "succ": { "cloudns": _4, "dyndns": _4, "for-better": _4, "for-more": _4, "for-some": _4, "for-the": _4, "selfip": _4, "webhop": _4, "bpl": _4, "orx": _4, "mmafan": _4, "myftp": _4, "no-ip": _4, "dscloud": _4 } }, "bj": { "$": 1, "succ": { "asso": _2, "barreau": _2, "gouv": _2, "blogspot": _4 } }, "bm": _9, "bn": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "co": _4 } }, "bo": { "$": 1, "succ": { "com": _2, "edu": _2, "gob": _2, "int": _2, "org": _2, "net": _2, "mil": _2, "tv": _2, "web": _2, "academia": _2, "agro": _2, "arte": _2, "blog": _2, "bolivia": _2, "ciencia": _2, "cooperativa": _2, "democracia": _2, "deporte": _2, "ecologia": _2, "economia": _2, "empresa": _2, "indigena": _2, "industria": _2, "info": _2, "medicina": _2, "movimiento": _2, "musica": _2, "natural": _2, "nombre": _2, "noticias": _2, "patria": _2, "politica": _2, "profesional": _2, "plurinacional": _2, "pueblo": _2, "revista": _2, "salud": _2, "tecnologia": _2, "tksat": _2, "transporte": _2, "wiki": _2 } }, "br": { "$": 1, "succ": { "9guacu": _2, "abc": _2, "adm": _2, "adv": _2, "agr": _2, "aju": _2, "am": _2, "anani": _2, "aparecida": _2, "arq": _2, "art": _2, "ato": _2, "b": _2, "barueri": _2, "belem": _2, "bhz": _2, "bio": _2, "blog": _2, "bmd": _2, "boavista": _2, "bsb": _2, "campinagrande": _2, "campinas": _2, "caxias": _2, "cim": _2, "cng": _2, "cnt": _2, "com": _5, "contagem": _2, "coop": _2, "cri": _2, "cuiaba": _2, "curitiba": _2, "def": _2, "ecn": _2, "eco": _2, "edu": _2, "emp": _2, "eng": _2, "esp": _2, "etc": _2, "eti": _2, "far": _2, "feira": _2, "flog": _2, "floripa": _2, "fm": _2, "fnd": _2, "fortal": _2, "fot": _2, "foz": _2, "fst": _2, "g12": _2, "ggf": _2, "goiania": _2, "gov": { "$": 1, "succ": { "ac": _2, "al": _2, "am": _2, "ap": _2, "ba": _2, "ce": _2, "df": _2, "es": _2, "go": _2, "ma": _2, "mg": _2, "ms": _2, "mt": _2, "pa": _2, "pb": _2, "pe": _2, "pi": _2, "pr": _2, "rj": _2, "rn": _2, "ro": _2, "rr": _2, "rs": _2, "sc": _2, "se": _2, "sp": _2, "to": _2 } }, "gru": _2, "imb": _2, "ind": _2, "inf": _2, "jab": _2, "jampa": _2, "jdf": _2, "joinville": _2, "jor": _2, "jus": _2, "leg": { "$": 1, "succ": { "ac": _4, "al": _4, "am": _4, "ap": _4, "ba": _4, "ce": _4, "df": _4, "es": _4, "go": _4, "ma": _4, "mg": _4, "ms": _4, "mt": _4, "pa": _4, "pb": _4, "pe": _4, "pi": _4, "pr": _4, "rj": _4, "rn": _4, "ro": _4, "rr": _4, "rs": _4, "sc": _4, "se": _4, "sp": _4, "to": _4 } }, "lel": _2, "londrina": _2, "macapa": _2, "maceio": _2, "manaus": _2, "maringa": _2, "mat": _2, "med": _2, "mil": _2, "morena": _2, "mp": _2, "mus": _2, "natal": _2, "net": _2, "niteroi": _2, "nom": _8, "not": _2, "ntr": _2, "odo": _2, "ong": _2, "org": _2, "osasco": _2, "palmas": _2, "poa": _2, "ppg": _2, "pro": _2, "psc": _2, "psi": _2, "pvh": _2, "qsl": _2, "radio": _2, "rec": _2, "recife": _2, "ribeirao": _2, "rio": _2, "riobranco": _2, "riopreto": _2, "salvador": _2, "sampa": _2, "santamaria": _2, "santoandre": _2, "saobernardo": _2, "saogonca": _2, "sjc": _2, "slg": _2, "slz": _2, "sorocaba": _2, "srv": _2, "taxi": _2, "tc": _2, "teo": _2, "the": _2, "tmp": _2, "trd": _2, "tur": _2, "tv": _2, "udi": _2, "vet": _2, "vix": _2, "vlog": _2, "wiki": _2, "zlg": _2 } }, "bs": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "edu": _2, "gov": _2, "we": _4 } }, "bt": _9, "bv": _2, "bw": { "$": 1, "succ": { "co": _2, "org": _2 } }, "by": { "$": 1, "succ": { "gov": _2, "mil": _2, "com": _5, "of": _2, "nym": _4 } }, "bz": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "edu": _2, "gov": _2, "za": _4, "nym": _4 } }, "ca": { "$": 1, "succ": { "ab": _2, "bc": _2, "mb": _2, "nb": _2, "nf": _2, "nl": _2, "ns": _2, "nt": _2, "nu": _2, "on": _2, "pe": _2, "qc": _2, "sk": _2, "yk": _2, "gc": _2, "barsy": _4, "awdev": _7, "co": _4, "blogspot": _4, "no-ip": _4 } }, "cat": _2, "cc": { "$": 1, "succ": { "cloudns": _4, "ftpaccess": _4, "game-server": _4, "myphotos": _4, "scrapping": _4, "twmail": _4, "fantasyleague": _4 } }, "cd": _6, "cf": _5, "cg": _2, "ch": { "$": 1, "succ": { "square7": _4, "blogspot": _4, "linkyard-cloud": _4, "dnsking": _4, "gotdns": _4, "12hp": _4, "2ix": _4, "4lima": _4, "lima-city": _4 } }, "ci": { "$": 1, "succ": { "org": _2, "or": _2, "com": _2, "co": _2, "edu": _2, "ed": _2, "ac": _2, "net": _2, "go": _2, "asso": _2, "xn--aroport-bya": _2, "aéroport": _2, "int": _2, "presse": _2, "md": _2, "gouv": _2, "fin": _4 } }, "ck": _8, "cl": { "$": 1, "succ": { "gov": _2, "gob": _2, "co": _2, "mil": _2, "blogspot": _4, "nom": _4 } }, "cm": { "$": 1, "succ": { "co": _2, "com": _2, "gov": _2, "net": _2 } }, "cn": { "$": 1, "succ": { "ac": _2, "com": { "$": 1, "succ": { "amazonaws": { "$": 0, "succ": { "compute": _7, "eb": { "$": 0, "succ": { "cn-north-1": _4, "cn-northwest-1": _4 } }, "elb": _7, "cn-north-1": _12 } } } }, "edu": _2, "gov": _2, "net": _2, "org": _2, "mil": _2, "xn--55qx5d": _2, "公司": _2, "xn--io0a7i": _2, "网络": _2, "xn--od0alg": _2, "網絡": _2, "ah": _2, "bj": _2, "cq": _2, "fj": _2, "gd": _2, "gs": _2, "gz": _2, "gx": _2, "ha": _2, "hb": _2, "he": _2, "hi": _2, "hl": _2, "hn": _2, "jl": _2, "js": _2, "jx": _2, "ln": _2, "nm": _2, "nx": _2, "qh": _2, "sc": _2, "sd": _2, "sh": _2, "sn": _2, "sx": _2, "tj": _2, "xj": _2, "xz": _2, "yn": _2, "zj": _2, "hk": _2, "mo": _2, "tw": _2, "instantcloud": _4 } }, "co": { "$": 1, "succ": { "arts": _2, "com": _5, "edu": _2, "firm": _2, "gov": _2, "info": _2, "int": _2, "mil": _2, "net": _2, "nom": _2, "org": _2, "rec": _2, "web": _2, "carrd": _4, "crd": _4, "otap": _7, "leadpages": _4, "lpages": _4, "mypi": _4, "n4t": _4, "nodum": _4, "repl": _4 } }, "com": { "$": 1, "succ": { "amazonaws": { "$": 0, "succ": { "compute": _7, "compute-1": _7, "us-east-1": { "$": 2, "succ": { "dualstack": _12 } }, "elb": _7, "s3": _4, "s3-ap-northeast-1": _4, "s3-ap-northeast-2": _4, "s3-ap-south-1": _4, "s3-ap-southeast-1": _4, "s3-ap-southeast-2": _4, "s3-ca-central-1": _4, "s3-eu-central-1": _4, "s3-eu-west-1": _4, "s3-eu-west-2": _4, "s3-eu-west-3": _4, "s3-external-1": _4, "s3-fips-us-gov-west-1": _4, "s3-sa-east-1": _4, "s3-us-gov-west-1": _4, "s3-us-east-2": _4, "s3-us-west-1": _4, "s3-us-west-2": _4, "ap-northeast-2": _14, "ap-south-1": _14, "ca-central-1": _14, "eu-central-1": _14, "eu-west-2": _14, "eu-west-3": _14, "us-east-2": _14, "ap-northeast-1": _13, "ap-southeast-1": _13, "ap-southeast-2": _13, "eu-west-1": _13, "sa-east-1": _13, "s3-website-us-east-1": _4, "s3-website-us-west-1": _4, "s3-website-us-west-2": _4, "s3-website-ap-northeast-1": _4, "s3-website-ap-southeast-1": _4, "s3-website-ap-southeast-2": _4, "s3-website-eu-west-1": _4, "s3-website-sa-east-1": _4 } }, "elasticbeanstalk": { "$": 2, "succ": { "ap-northeast-1": _4, "ap-northeast-2": _4, "ap-northeast-3": _4, "ap-south-1": _4, "ap-southeast-1": _4, "ap-southeast-2": _4, "ca-central-1": _4, "eu-central-1": _4, "eu-west-1": _4, "eu-west-2": _4, "eu-west-3": _4, "sa-east-1": _4, "us-east-1": _4, "us-east-2": _4, "us-gov-west-1": _4, "us-west-1": _4, "us-west-2": _4 } }, "on-aptible": _4, "myasustor": _4, "balena-devices": _4, "betainabox": _4, "bplaced": _4, "ar": _4, "br": _4, "cn": _4, "de": _4, "eu": _4, "gb": _4, "hu": _4, "jpn": _4, "kr": _4, "mex": _4, "no": _4, "qc": _4, "ru": _4, "sa": _4, "uk": _4, "us": _4, "uy": _4, "za": _4, "africa": _4, "gr": _4, "co": _4, "xenapponazure": _4, "jdevcloud": _4, "wpdevcloud": _4, "cloudcontrolled": _4, "cloudcontrolapp": _4, "trycloudflare": _4, "dattolocal": _4, "dattorelay": _4, "dattoweb": _4, "mydatto": _4, "drayddns": _4, "dreamhosters": _4, "mydrobo": _4, "dyndns-at-home": _4, "dyndns-at-work": _4, "dyndns-blog": _4, "dyndns-free": _4, "dyndns-home": _4, "dyndns-ip": _4, "dyndns-mail": _4, "dyndns-office": _4, "dyndns-pics": _4, "dyndns-remote": _4, "dyndns-server": _4, "dyndns-web": _4, "dyndns-wiki": _4, "dyndns-work": _4, "blogdns": _4, "cechire": _4, "dnsalias": _4, "dnsdojo": _4, "doesntexist": _4, "dontexist": _4, "doomdns": _4, "dyn-o-saur": _4, "dynalias": _4, "est-a-la-maison": _4, "est-a-la-masion": _4, "est-le-patron": _4, "est-mon-blogueur": _4, "from-ak": _4, "from-al": _4, "from-ar": _4, "from-ca": _4, "from-ct": _4, "from-dc": _4, "from-de": _4, "from-fl": _4, "from-ga": _4, "from-hi": _4, "from-ia": _4, "from-id": _4, "from-il": _4, "from-in": _4, "from-ks": _4, "from-ky": _4, "from-ma": _4, "from-md": _4, "from-mi": _4, "from-mn": _4, "from-mo": _4, "from-ms": _4, "from-mt": _4, "from-nc": _4, "from-nd": _4, "from-ne": _4, "from-nh": _4, "from-nj": _4, "from-nm": _4, "from-nv": _4, "from-oh": _4, "from-ok": _4, "from-or": _4, "from-pa": _4, "from-pr": _4, "from-ri": _4, "from-sc": _4, "from-sd": _4, "from-tn": _4, "from-tx": _4, "from-ut": _4, "from-va": _4, "from-vt": _4, "from-wa": _4, "from-wi": _4, "from-wv": _4, "from-wy": _4, "getmyip": _4, "gotdns": _4, "hobby-site": _4, "homelinux": _4, "homeunix": _4, "iamallama": _4, "is-a-anarchist": _4, "is-a-blogger": _4, "is-a-bookkeeper": _4, "is-a-bulls-fan": _4, "is-a-caterer": _4, "is-a-chef": _4, "is-a-conservative": _4, "is-a-cpa": _4, "is-a-cubicle-slave": _4, "is-a-democrat": _4, "is-a-designer": _4, "is-a-doctor": _4, "is-a-financialadvisor": _4, "is-a-geek": _4, "is-a-green": _4, "is-a-guru": _4, "is-a-hard-worker": _4, "is-a-hunter": _4, "is-a-landscaper": _4, "is-a-lawyer": _4, "is-a-liberal": _4, "is-a-libertarian": _4, "is-a-llama": _4, "is-a-musician": _4, "is-a-nascarfan": _4, "is-a-nurse": _4, "is-a-painter": _4, "is-a-personaltrainer": _4, "is-a-photographer": _4, "is-a-player": _4, "is-a-republican": _4, "is-a-rockstar": _4, "is-a-socialist": _4, "is-a-student": _4, "is-a-teacher": _4, "is-a-techie": _4, "is-a-therapist": _4, "is-an-accountant": _4, "is-an-actor": _4, "is-an-actress": _4, "is-an-anarchist": _4, "is-an-artist": _4, "is-an-engineer": _4, "is-an-entertainer": _4, "is-certified": _4, "is-gone": _4, "is-into-anime": _4, "is-into-cars": _4, "is-into-cartoons": _4, "is-into-games": _4, "is-leet": _4, "is-not-certified": _4, "is-slick": _4, "is-uberleet": _4, "is-with-theband": _4, "isa-geek": _4, "isa-hockeynut": _4, "issmarterthanyou": _4, "likes-pie": _4, "likescandy": _4, "neat-url": _4, "saves-the-whales": _4, "selfip": _4, "sells-for-less": _4, "sells-for-u": _4, "servebbs": _4, "simple-url": _4, "space-to-rent": _4, "teaches-yoga": _4, "writesthisblog": _4, "ddnsfree": _4, "ddnsgeek": _4, "giize": _4, "gleeze": _4, "kozow": _4, "loseyourip": _4, "ooguy": _4, "theworkpc": _4, "mytuleap": _4, "evennode": { "$": 0, "succ": { "eu-1": _4, "eu-2": _4, "eu-3": _4, "eu-4": _4, "us-1": _4, "us-2": _4, "us-3": _4, "us-4": _4 } }, "fbsbx": _15, "fastly-terrarium": _4, "fastvps-server": _4, "mydobiss": _4, "firebaseapp": _4, "flynnhub": _4, "freebox-os": _4, "freeboxos": _4, "githubusercontent": _4, "0emm": _7, "appspot": _4, "blogspot": _4, "codespot": _4, "googleapis": _4, "googlecode": _4, "pagespeedmobilizer": _4, "publishproxy": _4, "withgoogle": _4, "withyoutube": _4, "herokuapp": _4, "herokussl": _4, "myravendb": _4, "pixolino": _4, "joyent": { "$": 0, "succ": { "cns": _7 } }, "lpusercontent": _4, "lmpm": _16, "linode": { "$": 0, "succ": { "members": _4, "nodebalancer": _4 } }, "barsycenter": _4, "barsyonline": _4, "miniserver": _4, "meteorapp": { "$": 2, "succ": { "eu": _4 } }, "bitballoon": _4, "netlify": _4, "4u": _4, "nfshost": _4, "001www": _4, "ddnslive": _4, "myiphost": _4, "blogsyte": _4, "ciscofreak": _4, "damnserver": _4, "ditchyourip": _4, "dnsiskinky": _4, "dynns": _4, "geekgalaxy": _4, "health-carereform": _4, "homesecuritymac": _4, "homesecuritypc": _4, "myactivedirectory": _4, "mysecuritycamera": _4, "net-freaks": _4, "onthewifi": _4, "point2this": _4, "quicksytes": _4, "securitytactics": _4, "serveexchange": _4, "servehumour": _4, "servep2p": _4, "servesarcasm": _4, "stufftoread": _4, "unusualperson": _4, "workisboring": _4, "3utilities": _4, "ddnsking": _4, "myvnc": _4, "servebeer": _4, "servecounterstrike": _4, "serveftp": _4, "servegame": _4, "servehalflife": _4, "servehttp": _4, "serveirc": _4, "servemp3": _4, "servepics": _4, "servequake": _4, "operaunite": _4, "outsystemscloud": _4, "ownprovider": _4, "pgfog": _4, "pagefrontapp": _4, "gotpantheon": _4, "prgmr": { "$": 0, "succ": { "xen": _4 } }, "qualifioapp": _4, "qa2": _4, "dev-myqnapcloud": _4, "alpha-myqnapcloud": _4, "myqnapcloud": _4, "quipelements": _7, "rackmaze": _4, "rhcloud": _4, "render": _16, "onrender": _4, "logoip": _4, "scrysec": _4, "firewall-gateway": _4, "myshopblocks": _4, "shopitsite": _4, "1kapp": _4, "appchizi": _4, "applinzi": _4, "sinaapp": _4, "vipsinaapp": _4, "bounty-full": { "$": 2, "succ": { "alpha": _4, "beta": _4 } }, "stackhero-network": _4, "stdlib": { "$": 0, "succ": { "api": _4 } }, "temp-dns": _4, "dsmynas": _4, "familyds": _4, "thingdustdata": _4, "bloxcms": _4, "townnews-staging": _4, "hk": _4, "wafflecell": _4, "remotewd": _4, "xnbay": { "$": 2, "succ": { "u2": _4, "u2-local": _4 } }, "yolasite": _4 } }, "coop": _2, "cr": { "$": 1, "succ": { "ac": _2, "co": _2, "ed": _2, "fi": _2, "go": _2, "or": _2, "sa": _2 } }, "cu": { "$": 1, "succ": { "com": _2, "edu": _2, "org": _2, "net": _2, "gov": _2, "inf": _2 } }, "cv": _5, "cw": _17, "cx": { "$": 1, "succ": { "gov": _2, "ath": _4, "info": _4 } }, "cy": { "$": 1, "succ": { "ac": _2, "biz": _2, "com": _5, "ekloges": _2, "gov": _2, "ltd": _2, "name": _2, "net": _2, "org": _2, "parliament": _2, "press": _2, "pro": _2, "tm": _2 } }, "cz": { "$": 1, "succ": { "co": _4, "realm": _4, "e4": _4, "blogspot": _4, "metacentrum": { "$": 0, "succ": { "cloud": _4, "custom": _4 } }, "muni": { "$": 0, "succ": { "cloud": { "$": 0, "succ": { "flt": _4, "usr": _4 } } } } } }, "de": { "$": 1, "succ": { "bplaced": _4, "square7": _4, "com": _4, "cosidns": { "$": 0, "succ": { "dyn": _4 } }, "dynamisches-dns": _4, "dnsupdater": _4, "internet-dns": _4, "l-o-g-i-n": _4, "dnshome": _4, "fuettertdasnetz": _4, "isteingeek": _4, "istmein": _4, "lebtimnetz": _4, "leitungsen": _4, "traeumtgerade": _4, "ddnss": { "$": 2, "succ": { "dyn": _4, "dyndns": _4 } }, "dyndns1": _4, "dyn-ip24": _4, "home-webserver": { "$": 2, "succ": { "dyn": _4 } }, "myhome-server": _4, "goip": _4, "blogspot": _4, "dyn-berlin": _4, "in-berlin": _4, "in-brb": _4, "in-butter": _4, "in-dsl": _4, "in-vpn": _4, "mein-iserv": _4, "test-iserv": _4, "keymachine": _4, "git-repos": _4, "lcube-server": _4, "svn-repos": _4, "barsy": _4, "logoip": _4, "firewall-gateway": _4, "my-gateway": _4, "my-router": _4, "spdns": _4, "speedpartner": { "$": 0, "succ": { "customer": _4 } }, "taifun-dns": _4, "12hp": _4, "2ix": _4, "4lima": _4, "lima-city": _4, "dd-dns": _4, "dray-dns": _4, "draydns": _4, "dyn-vpn": _4, "dynvpn": _4, "mein-vigor": _4, "my-vigor": _4, "my-wan": _4, "syno-ds": _4, "synology-diskstation": _4, "synology-ds": _4, "uberspace": _7, "virtualuser": _4, "virtual-user": _4 } }, "dj": _2, "dk": { "$": 1, "succ": { "biz": _4, "co": _4, "firm": _4, "reg": _4, "store": _4, "blogspot": _4 } }, "dm": _9, "do": { "$": 1, "succ": { "art": _2, "com": _2, "edu": _2, "gob": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "sld": _2, "web": _2 } }, "dz": { "$": 1, "succ": { "com": _2, "org": _2, "net": _2, "gov": _2, "edu": _2, "asso": _2, "pol": _2, "art": _2 } }, "ec": { "$": 1, "succ": { "com": _2, "info": _2, "net": _2, "fin": _2, "k12": _2, "med": _2, "pro": _2, "org": _2, "edu": _2, "gov": _2, "gob": _2, "mil": _2, "nym": _4 } }, "edu": { "$": 1, "succ": { "rit": { "$": 0, "succ": { "git-pages": _4 } } } }, "ee": { "$": 1, "succ": { "edu": _2, "gov": _2, "riik": _2, "lib": _2, "med": _2, "com": _5, "pri": _2, "aip": _2, "org": _2, "fie": _2 } }, "eg": { "$": 1, "succ": { "com": _5, "edu": _2, "eun": _2, "gov": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "sci": _2 } }, "er": _8, "es": { "$": 1, "succ": { "com": _5, "nom": _2, "org": _2, "gob": _2, "edu": _2 } }, "et": { "$": 1, "succ": { "com": _2, "gov": _2, "org": _2, "edu": _2, "biz": _2, "name": _2, "info": _2, "net": _2 } }, "eu": { "$": 1, "succ": { "mycd": _4, "cloudns": _4, "barsy": _4, "wellbeingzone": _4, "spdns": _4, "transurl": _7, "diskstation": _4 } }, "fi": { "$": 1, "succ": { "aland": _2, "dy": _4, "blogspot": _4, "xn--hkkinen-5wa": _4, "häkkinen": _4, "iki": _4 } }, "fj": _8, "fk": _8, "fm": _2, "fo": _2, "fr": { "$": 1, "succ": { "asso": _2, "com": _2, "gouv": _2, "nom": _2, "prd": _2, "tm": _2, "aeroport": _2, "avocat": _2, "avoues": _2, "cci": _2, "chambagri": _2, "chirurgiens-dentistes": _2, "experts-comptables": _2, "geometre-expert": _2, "greta": _2, "huissier-justice": _2, "medecin": _2, "notaires": _2, "pharmacien": _2, "port": _2, "veterinaire": _2, "fbx-os": _4, "fbxos": _4, "freebox-os": _4, "freeboxos": _4, "blogspot": _4, "on-web": _4, "chirurgiens-dentistes-en-france": _4 } }, "ga": _2, "gb": _2, "gd": _20, "ge": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "org": _2, "mil": _2, "net": _2, "pvt": _2, "nom": _4 } }, "gf": _2, "gg": { "$": 1, "succ": { "co": _2, "net": _2, "org": _2, "kaas": _4, "cya": _4 } }, "gh": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "org": _2, "mil": _2 } }, "gi": { "$": 1, "succ": { "com": _2, "ltd": _2, "gov": _2, "mod": _2, "edu": _2, "org": _2 } }, "gl": { "$": 1, "succ": { "co": _2, "com": _2, "edu": _2, "net": _2, "org": _2, "biz": _4, "nom": _4 } }, "gm": _2, "gn": { "$": 1, "succ": { "ac": _2, "com": _2, "edu": _2, "gov": _2, "org": _2, "net": _2 } }, "gov": _2, "gp": { "$": 1, "succ": { "com": _2, "net": _2, "mobi": _2, "edu": _2, "org": _2, "asso": _2 } }, "gq": _2, "gr": { "$": 1, "succ": { "com": _2, "edu": _2, "net": _2, "org": _2, "gov": _2, "blogspot": _4, "nym": _4 } }, "gs": _2, "gt": { "$": 1, "succ": { "com": _2, "edu": _2, "gob": _2, "ind": _2, "mil": _2, "net": _2, "org": _2, "nom": _4 } }, "gu": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "guam": _2, "info": _2, "net": _2, "org": _2, "web": _2 } }, "gw": _2, "gy": { "$": 1, "succ": { "co": _2, "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "nym": _4 } }, "hk": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "idv": _2, "net": _2, "org": _2, "xn--55qx5d": _2, "公司": _2, "xn--wcvs22d": _2, "教育": _2, "xn--lcvr32d": _2, "敎育": _2, "xn--mxtq1m": _2, "政府": _2, "xn--gmqw5a": _2, "個人": _2, "xn--ciqpn": _2, "个人": _2, "xn--gmq050i": _2, "箇人": _2, "xn--zf0avx": _2, "網络": _2, "xn--io0a7i": _2, "网络": _2, "xn--mk0axi": _2, "组織": _2, "xn--od0alg": _2, "網絡": _2, "xn--od0aq3b": _2, "网絡": _2, "xn--tn0ag": _2, "组织": _2, "xn--uc0atv": _2, "組織": _2, "xn--uc0ay4a": _2, "組织": _2, "blogspot": _4, "nym": _4, "ltd": _4, "inc": _4 } }, "hm": _2, "hn": { "$": 1, "succ": { "com": _2, "edu": _2, "org": _2, "net": _2, "mil": _2, "gob": _2, "nom": _4 } }, "hr": { "$": 1, "succ": { "iz": _2, "from": _2, "name": _2, "com": _2, "blogspot": _4, "free": _4 } }, "ht": { "$": 1, "succ": { "com": _2, "shop": _2, "firm": _2, "info": _2, "adult": _2, "net": _2, "pro": _2, "org": _2, "med": _2, "art": _2, "coop": _2, "pol": _2, "asso": _2, "edu": _2, "rel": _2, "gouv": _2, "perso": _2 } }, "hu": { "$": 1, "succ": { "2000": _2, "co": _2, "info": _2, "org": _2, "priv": _2, "sport": _2, "tm": _2, "agrar": _2, "bolt": _2, "casino": _2, "city": _2, "erotica": _2, "erotika": _2, "film": _2, "forum": _2, "games": _2, "hotel": _2, "ingatlan": _2, "jogasz": _2, "konyvelo": _2, "lakas": _2, "media": _2, "news": _2, "reklam": _2, "sex": _2, "shop": _2, "suli": _2, "szex": _2, "tozsde": _2, "utazas": _2, "video": _2, "blogspot": _4 } }, "id": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _5, "desa": _2, "go": _2, "mil": _2, "my": _2, "net": _2, "or": _2, "ponpes": _2, "sch": _2, "web": _2 } }, "ie": _21, "il": { "$": 1, "succ": { "ac": _2, "co": _5, "gov": _2, "idf": _2, "k12": _2, "muni": _2, "net": _2, "org": _2 } }, "im": { "$": 1, "succ": { "ac": _2, "co": { "$": 1, "succ": { "ltd": _2, "plc": _2 } }, "com": _2, "net": _2, "org": _2, "tt": _2, "tv": _2, "ro": _4, "nom": _4 } }, "in": { "$": 1, "succ": { "co": _2, "firm": _2, "net": _2, "org": _2, "gen": _2, "ind": _2, "nic": _2, "ac": _2, "edu": _2, "res": _2, "gov": _2, "mil": _2, "cloudns": _4, "blogspot": _4, "barsy": _4 } }, "info": { "$": 1, "succ": { "cloudns": _4, "dynamic-dns": _4, "dyndns": _4, "barrel-of-knowledge": _4, "barrell-of-knowledge": _4, "for-our": _4, "groks-the": _4, "groks-this": _4, "here-for-more": _4, "knowsitall": _4, "selfip": _4, "webhop": _4, "barsy": _4, "mayfirst": _4, "forumz": _4, "nsupdate": _4, "dvrcam": _4, "ilovecollege": _4, "no-ip": _4, "v-info": _4 } }, "int": { "$": 1, "succ": { "eu": _2 } }, "io": { "$": 1, "succ": { "2038": _4, "com": _2, "apigee": _4, "b-data": _4, "backplaneapp": _4, "banzaicloud": _16, "boxfuse": _4, "browsersafetymark": _4, "bigv": { "$": 0, "succ": { "uk0": _4 } }, "cleverapps": _4, "dedyn": _4, "drud": _4, "definima": _4, "enonic": { "$": 2, "succ": { "customer": _4 } }, "github": _4, "gitlab": _4, "lolipop": _4, "hasura-app": _4, "moonscale": _7, "loginline": _4, "barsy": _4, "azurecontainer": _4, "ngrok": _4, "nodeart": { "$": 0, "succ": { "stage": _4 } }, "nodum": _4, "nid": _4, "pantheonsite": _4, "dyn53": _4, "protonet": _4, "vaporcloud": _4, "on-rio": _7, "readthedocs": _4, "resindevice": _4, "resinstaging": { "$": 0, "succ": { "devices": _4 } }, "hzc": _4, "sandcats": _4, "shiftedit": _4, "mo-siemens": _4, "lair": _15, "stolos": _7, "spacekit": _4, "utwente": _4, "applicationcloud": _4, "scapp": _4, "s5y": _7, "telebit": _4, "thingdust": { "$": 0, "succ": { "dev": _22, "disrec": _22, "prod": _22, "testing": _22 } }, "wedeploy": _4, "basicserver": _4, "virtualserver": _4 } }, "iq": _3, "ir": { "$": 1, "succ": { "ac": _2, "co": _2, "gov": _2, "id": _2, "net": _2, "org": _2, "sch": _2, "xn--mgba3a4f16a": _2, "ایران": _2, "xn--mgba3a4fra": _2, "ايران": _2 } }, "is": { "$": 1, "succ": { "net": _2, "com": _2, "edu": _2, "gov": _2, "org": _2, "int": _2, "cupcake": _4, "blogspot": _4 } }, "it": { "$": 1, "succ": { "gov": _2, "edu": _2, "abr": _2, "abruzzo": _2, "aosta-valley": _2, "aostavalley": _2, "bas": _2, "basilicata": _2, "cal": _2, "calabria": _2, "cam": _2, "campania": _2, "emilia-romagna": _2, "emiliaromagna": _2, "emr": _2, "friuli-v-giulia": _2, "friuli-ve-giulia": _2, "friuli-vegiulia": _2, "friuli-venezia-giulia": _2, "friuli-veneziagiulia": _2, "friuli-vgiulia": _2, "friuliv-giulia": _2, "friulive-giulia": _2, "friulivegiulia": _2, "friulivenezia-giulia": _2, "friuliveneziagiulia": _2, "friulivgiulia": _2, "fvg": _2, "laz": _2, "lazio": _2, "lig": _2, "liguria": _2, "lom": _2, "lombardia": _2, "lombardy": _2, "lucania": _2, "mar": _2, "marche": _2, "mol": _2, "molise": _2, "piedmont": _2, "piemonte": _2, "pmn": _2, "pug": _2, "puglia": _2, "sar": _2, "sardegna": _2, "sardinia": _2, "sic": _2, "sicilia": _2, "sicily": _2, "taa": _2, "tos": _2, "toscana": _2, "trentin-sud-tirol": _2, "xn--trentin-sd-tirol-rzb": _2, "trentin-süd-tirol": _2, "trentin-sudtirol": _2, "xn--trentin-sdtirol-7vb": _2, "trentin-südtirol": _2, "trentin-sued-tirol": _2, "trentin-suedtirol": _2, "trentino-a-adige": _2, "trentino-aadige": _2, "trentino-alto-adige": _2, "trentino-altoadige": _2, "trentino-s-tirol": _2, "trentino-stirol": _2, "trentino-sud-tirol": _2, "xn--trentino-sd-tirol-c3b": _2, "trentino-süd-tirol": _2, "trentino-sudtirol": _2, "xn--trentino-sdtirol-szb": _2, "trentino-südtirol": _2, "trentino-sued-tirol": _2, "trentino-suedtirol": _2, "trentino": _2, "trentinoa-adige": _2, "trentinoaadige": _2, "trentinoalto-adige": _2, "trentinoaltoadige": _2, "trentinos-tirol": _2, "trentinostirol": _2, "trentinosud-tirol": _2, "xn--trentinosd-tirol-rzb": _2, "trentinosüd-tirol": _2, "trentinosudtirol": _2, "xn--trentinosdtirol-7vb": _2, "trentinosüdtirol": _2, "trentinosued-tirol": _2, "trentinosuedtirol": _2, "trentinsud-tirol": _2, "xn--trentinsd-tirol-6vb": _2, "trentinsüd-tirol": _2, "trentinsudtirol": _2, "xn--trentinsdtirol-nsb": _2, "trentinsüdtirol": _2, "trentinsued-tirol": _2, "trentinsuedtirol": _2, "tuscany": _2, "umb": _2, "umbria": _2, "val-d-aosta": _2, "val-daosta": _2, "vald-aosta": _2, "valdaosta": _2, "valle-aosta": _2, "valle-d-aosta": _2, "valle-daosta": _2, "valleaosta": _2, "valled-aosta": _2, "valledaosta": _2, "vallee-aoste": _2, "xn--valle-aoste-ebb": _2, "vallée-aoste": _2, "vallee-d-aoste": _2, "xn--valle-d-aoste-ehb": _2, "vallée-d-aoste": _2, "valleeaoste": _2, "xn--valleaoste-e7a": _2, "valléeaoste": _2, "valleedaoste": _2, "xn--valledaoste-ebb": _2, "valléedaoste": _2, "vao": _2, "vda": _2, "ven": _2, "veneto": _2, "ag": _2, "agrigento": _2, "al": _2, "alessandria": _2, "alto-adige": _2, "altoadige": _2, "an": _2, "ancona": _2, "andria-barletta-trani": _2, "andria-trani-barletta": _2, "andriabarlettatrani": _2, "andriatranibarletta": _2, "ao": _2, "aosta": _2, "aoste": _2, "ap": _2, "aq": _2, "aquila": _2, "ar": _2, "arezzo": _2, "ascoli-piceno": _2, "ascolipiceno": _2, "asti": _2, "at": _2, "av": _2, "avellino": _2, "ba": _2, "balsan-sudtirol": _2, "xn--balsan-sdtirol-nsb": _2, "balsan-südtirol": _2, "balsan-suedtirol": _2, "balsan": _2, "bari": _2, "barletta-trani-andria": _2, "barlettatraniandria": _2, "belluno": _2, "benevento": _2, "bergamo": _2, "bg": _2, "bi": _2, "biella": _2, "bl": _2, "bn": _2, "bo": _2, "bologna": _2, "bolzano-altoadige": _2, "bolzano": _2, "bozen-sudtirol": _2, "xn--bozen-sdtirol-2ob": _2, "bozen-südtirol": _2, "bozen-suedtirol": _2, "bozen": _2, "br": _2, "brescia": _2, "brindisi": _2, "bs": _2, "bt": _2, "bulsan-sudtirol": _2, "xn--bulsan-sdtirol-nsb": _2, "bulsan-südtirol": _2, "bulsan-suedtirol": _2, "bulsan": _2, "bz": _2, "ca": _2, "cagliari": _2, "caltanissetta": _2, "campidano-medio": _2, "campidanomedio": _2, "campobasso": _2, "carbonia-iglesias": _2, "carboniaiglesias": _2, "carrara-massa": _2, "carraramassa": _2, "caserta": _2, "catania": _2, "catanzaro": _2, "cb": _2, "ce": _2, "cesena-forli": _2, "xn--cesena-forl-mcb": _2, "cesena-forlì": _2, "cesenaforli": _2, "xn--cesenaforl-i8a": _2, "cesenaforlì": _2, "ch": _2, "chieti": _2, "ci": _2, "cl": _2, "cn": _2, "co": _2, "como": _2, "cosenza": _2, "cr": _2, "cremona": _2, "crotone": _2, "cs": _2, "ct": _2, "cuneo": _2, "cz": _2, "dell-ogliastra": _2, "dellogliastra": _2, "en": _2, "enna": _2, "fc": _2, "fe": _2, "fermo": _2, "ferrara": _2, "fg": _2, "fi": _2, "firenze": _2, "florence": _2, "fm": _2, "foggia": _2, "forli-cesena": _2, "xn--forl-cesena-fcb": _2, "forlì-cesena": _2, "forlicesena": _2, "xn--forlcesena-c8a": _2, "forlìcesena": _2, "fr": _2, "frosinone": _2, "ge": _2, "genoa": _2, "genova": _2, "go": _2, "gorizia": _2, "gr": _2, "grosseto": _2, "iglesias-carbonia": _2, "iglesiascarbonia": _2, "im": _2, "imperia": _2, "is": _2, "isernia": _2, "kr": _2, "la-spezia": _2, "laquila": _2, "laspezia": _2, "latina": _2, "lc": _2, "le": _2, "lecce": _2, "lecco": _2, "li": _2, "livorno": _2, "lo": _2, "lodi": _2, "lt": _2, "lu": _2, "lucca": _2, "macerata": _2, "mantova": _2, "massa-carrara": _2, "massacarrara": _2, "matera": _2, "mb": _2, "mc": _2, "me": _2, "medio-campidano": _2, "mediocampidano": _2, "messina": _2, "mi": _2, "milan": _2, "milano": _2, "mn": _2, "mo": _2, "modena": _2, "monza-brianza": _2, "monza-e-della-brianza": _2, "monza": _2, "monzabrianza": _2, "monzaebrianza": _2, "monzaedellabrianza": _2, "ms": _2, "mt": _2, "na": _2, "naples": _2, "napoli": _2, "no": _2, "novara": _2, "nu": _2, "nuoro": _2, "og": _2, "ogliastra": _2, "olbia-tempio": _2, "olbiatempio": _2, "or": _2, "oristano": _2, "ot": _2, "pa": _2, "padova": _2, "padua": _2, "palermo": _2, "parma": _2, "pavia": _2, "pc": _2, "pd": _2, "pe": _2, "perugia": _2, "pesaro-urbino": _2, "pesarourbino": _2, "pescara": _2, "pg": _2, "pi": _2, "piacenza": _2, "pisa": _2, "pistoia": _2, "pn": _2, "po": _2, "pordenone": _2, "potenza": _2, "pr": _2, "prato": _2, "pt": _2, "pu": _2, "pv": _2, "pz": _2, "ra": _2, "ragusa": _2, "ravenna": _2, "rc": _2, "re": _2, "reggio-calabria": _2, "reggio-emilia": _2, "reggiocalabria": _2, "reggioemilia": _2, "rg": _2, "ri": _2, "rieti": _2, "rimini": _2, "rm": _2, "rn": _2, "ro": _2, "roma": _2, "rome": _2, "rovigo": _2, "sa": _2, "salerno": _2, "sassari": _2, "savona": _2, "si": _2, "siena": _2, "siracusa": _2, "so": _2, "sondrio": _2, "sp": _2, "sr": _2, "ss": _2, "suedtirol": _2, "xn--sdtirol-n2a": _2, "südtirol": _2, "sv": _2, "ta": _2, "taranto": _2, "te": _2, "tempio-olbia": _2, "tempioolbia": _2, "teramo": _2, "terni": _2, "tn": _2, "to": _2, "torino": _2, "tp": _2, "tr": _2, "trani-andria-barletta": _2, "trani-barletta-andria": _2, "traniandriabarletta": _2, "tranibarlettaandria": _2, "trapani": _2, "trento": _2, "treviso": _2, "trieste": _2, "ts": _2, "turin": _2, "tv": _2, "ud": _2, "udine": _2, "urbino-pesaro": _2, "urbinopesaro": _2, "va": _2, "varese": _2, "vb": _2, "vc": _2, "ve": _2, "venezia": _2, "venice": _2, "verbania": _2, "vercelli": _2, "verona": _2, "vi": _2, "vibo-valentia": _2, "vibovalentia": _2, "vicenza": _2, "viterbo": _2, "vr": _2, "vs": _2, "vt": _2, "vv": _2, "blogspot": _4, "16-b": _4, "32-b": _4, "64-b": _4, "syncloud": _4 } }, "je": { "$": 1, "succ": { "co": _2, "net": _2, "org": _2 } }, "jm": _8, "jo": { "$": 1, "succ": { "com": _2, "org": _2, "net": _2, "edu": _2, "sch": _2, "gov": _2, "mil": _2, "name": _2 } }, "jobs": _2, "jp": { "$": 1, "succ": { "ac": _2, "ad": _2, "co": _2, "ed": _2, "go": _2, "gr": _2, "lg": _2, "ne": { "$": 1, "succ": { "aseinet": _18, "gehirn": _4 } }, "or": _2, "aichi": { "$": 1, "succ": { "aisai": _2, "ama": _2, "anjo": _2, "asuke": _2, "chiryu": _2, "chita": _2, "fuso": _2, "gamagori": _2, "handa": _2, "hazu": _2, "hekinan": _2, "higashiura": _2, "ichinomiya": _2, "inazawa": _2, "inuyama": _2, "isshiki": _2, "iwakura": _2, "kanie": _2, "kariya": _2, "kasugai": _2, "kira": _2, "kiyosu": _2, "komaki": _2, "konan": _2, "kota": _2, "mihama": _2, "miyoshi": _2, "nishio": _2, "nisshin": _2, "obu": _2, "oguchi": _2, "oharu": _2, "okazaki": _2, "owariasahi": _2, "seto": _2, "shikatsu": _2, "shinshiro": _2, "shitara": _2, "tahara": _2, "takahama": _2, "tobishima": _2, "toei": _2, "togo": _2, "tokai": _2, "tokoname": _2, "toyoake": _2, "toyohashi": _2, "toyokawa": _2, "toyone": _2, "toyota": _2, "tsushima": _2, "yatomi": _2 } }, "akita": { "$": 1, "succ": { "akita": _2, "daisen": _2, "fujisato": _2, "gojome": _2, "hachirogata": _2, "happou": _2, "higashinaruse": _2, "honjo": _2, "honjyo": _2, "ikawa": _2, "kamikoani": _2, "kamioka": _2, "katagami": _2, "kazuno": _2, "kitaakita": _2, "kosaka": _2, "kyowa": _2, "misato": _2, "mitane": _2, "moriyoshi": _2, "nikaho": _2, "noshiro": _2, "odate": _2, "oga": _2, "ogata": _2, "semboku": _2, "yokote": _2, "yurihonjo": _2 } }, "aomori": { "$": 1, "succ": { "aomori": _2, "gonohe": _2, "hachinohe": _2, "hashikami": _2, "hiranai": _2, "hirosaki": _2, "itayanagi": _2, "kuroishi": _2, "misawa": _2, "mutsu": _2, "nakadomari": _2, "noheji": _2, "oirase": _2, "owani": _2, "rokunohe": _2, "sannohe": _2, "shichinohe": _2, "shingo": _2, "takko": _2, "towada": _2, "tsugaru": _2, "tsuruta": _2 } }, "chiba": { "$": 1, "succ": { "abiko": _2, "asahi": _2, "chonan": _2, "chosei": _2, "choshi": _2, "chuo": _2, "funabashi": _2, "futtsu": _2, "hanamigawa": _2, "ichihara": _2, "ichikawa": _2, "ichinomiya": _2, "inzai": _2, "isumi": _2, "kamagaya": _2, "kamogawa": _2, "kashiwa": _2, "katori": _2, "katsuura": _2, "kimitsu": _2, "kisarazu": _2, "kozaki": _2, "kujukuri": _2, "kyonan": _2, "matsudo": _2, "midori": _2, "mihama": _2, "minamiboso": _2, "mobara": _2, "mutsuzawa": _2, "nagara": _2, "nagareyama": _2, "narashino": _2, "narita": _2, "noda": _2, "oamishirasato": _2, "omigawa": _2, "onjuku": _2, "otaki": _2, "sakae": _2, "sakura": _2, "shimofusa": _2, "shirako": _2, "shiroi": _2, "shisui": _2, "sodegaura": _2, "sosa": _2, "tako": _2, "tateyama": _2, "togane": _2, "tohnosho": _2, "tomisato": _2, "urayasu": _2, "yachimata": _2, "yachiyo": _2, "yokaichiba": _2, "yokoshibahikari": _2, "yotsukaido": _2 } }, "ehime": { "$": 1, "succ": { "ainan": _2, "honai": _2, "ikata": _2, "imabari": _2, "iyo": _2, "kamijima": _2, "kihoku": _2, "kumakogen": _2, "masaki": _2, "matsuno": _2, "matsuyama": _2, "namikata": _2, "niihama": _2, "ozu": _2, "saijo": _2, "seiyo": _2, "shikokuchuo": _2, "tobe": _2, "toon": _2, "uchiko": _2, "uwajima": _2, "yawatahama": _2 } }, "fukui": { "$": 1, "succ": { "echizen": _2, "eiheiji": _2, "fukui": _2, "ikeda": _2, "katsuyama": _2, "mihama": _2, "minamiechizen": _2, "obama": _2, "ohi": _2, "ono": _2, "sabae": _2, "sakai": _2, "takahama": _2, "tsuruga": _2, "wakasa": _2 } }, "fukuoka": { "$": 1, "succ": { "ashiya": _2, "buzen": _2, "chikugo": _2, "chikuho": _2, "chikujo": _2, "chikushino": _2, "chikuzen": _2, "chuo": _2, "dazaifu": _2, "fukuchi": _2, "hakata": _2, "higashi": _2, "hirokawa": _2, "hisayama": _2, "iizuka": _2, "inatsuki": _2, "kaho": _2, "kasuga": _2, "kasuya": _2, "kawara": _2, "keisen": _2, "koga": _2, "kurate": _2, "kurogi": _2, "kurume": _2, "minami": _2, "miyako": _2, "miyama": _2, "miyawaka": _2, "mizumaki": _2, "munakata": _2, "nakagawa": _2, "nakama": _2, "nishi": _2, "nogata": _2, "ogori": _2, "okagaki": _2, "okawa": _2, "oki": _2, "omuta": _2, "onga": _2, "onojo": _2, "oto": _2, "saigawa": _2, "sasaguri": _2, "shingu": _2, "shinyoshitomi": _2, "shonai": _2, "soeda": _2, "sue": _2, "tachiarai": _2, "tagawa": _2, "takata": _2, "toho": _2, "toyotsu": _2, "tsuiki": _2, "ukiha": _2, "umi": _2, "usui": _2, "yamada": _2, "yame": _2, "yanagawa": _2, "yukuhashi": _2 } }, "fukushima": { "$": 1, "succ": { "aizubange": _2, "aizumisato": _2, "aizuwakamatsu": _2, "asakawa": _2, "bandai": _2, "date": _2, "fukushima": _2, "furudono": _2, "futaba": _2, "hanawa": _2, "higashi": _2, "hirata": _2, "hirono": _2, "iitate": _2, "inawashiro": _2, "ishikawa": _2, "iwaki": _2, "izumizaki": _2, "kagamiishi": _2, "kaneyama": _2, "kawamata": _2, "kitakata": _2, "kitashiobara": _2, "koori": _2, "koriyama": _2, "kunimi": _2, "miharu": _2, "mishima": _2, "namie": _2, "nango": _2, "nishiaizu": _2, "nishigo": _2, "okuma": _2, "omotego": _2, "ono": _2, "otama": _2, "samegawa": _2, "shimogo": _2, "shirakawa": _2, "showa": _2, "soma": _2, "sukagawa": _2, "taishin": _2, "tamakawa": _2, "tanagura": _2, "tenei": _2, "yabuki": _2, "yamato": _2, "yamatsuri": _2, "yanaizu": _2, "yugawa": _2 } }, "gifu": { "$": 1, "succ": { "anpachi": _2, "ena": _2, "gifu": _2, "ginan": _2, "godo": _2, "gujo": _2, "hashima": _2, "hichiso": _2, "hida": _2, "higashishirakawa": _2, "ibigawa": _2, "ikeda": _2, "kakamigahara": _2, "kani": _2, "kasahara": _2, "kasamatsu": _2, "kawaue": _2, "kitagata": _2, "mino": _2, "minokamo": _2, "mitake": _2, "mizunami": _2, "motosu": _2, "nakatsugawa": _2, "ogaki": _2, "sakahogi": _2, "seki": _2, "sekigahara": _2, "shirakawa": _2, "tajimi": _2, "takayama": _2, "tarui": _2, "toki": _2, "tomika": _2, "wanouchi": _2, "yamagata": _2, "yaotsu": _2, "yoro": _2 } }, "gunma": { "$": 1, "succ": { "annaka": _2, "chiyoda": _2, "fujioka": _2, "higashiagatsuma": _2, "isesaki": _2, "itakura": _2, "kanna": _2, "kanra": _2, "katashina": _2, "kawaba": _2, "kiryu": _2, "kusatsu": _2, "maebashi": _2, "meiwa": _2, "midori": _2, "minakami": _2, "naganohara": _2, "nakanojo": _2, "nanmoku": _2, "numata": _2, "oizumi": _2, "ora": _2, "ota": _2, "shibukawa": _2, "shimonita": _2, "shinto": _2, "showa": _2, "takasaki": _2, "takayama": _2, "tamamura": _2, "tatebayashi": _2, "tomioka": _2, "tsukiyono": _2, "tsumagoi": _2, "ueno": _2, "yoshioka": _2 } }, "hiroshima": { "$": 1, "succ": { "asaminami": _2, "daiwa": _2, "etajima": _2, "fuchu": _2, "fukuyama": _2, "hatsukaichi": _2, "higashihiroshima": _2, "hongo": _2, "jinsekikogen": _2, "kaita": _2, "kui": _2, "kumano": _2, "kure": _2, "mihara": _2, "miyoshi": _2, "naka": _2, "onomichi": _2, "osakikamijima": _2, "otake": _2, "saka": _2, "sera": _2, "seranishi": _2, "shinichi": _2, "shobara": _2, "takehara": _2 } }, "hokkaido": { "$": 1, "succ": { "abashiri": _2, "abira": _2, "aibetsu": _2, "akabira": _2, "akkeshi": _2, "asahikawa": _2, "ashibetsu": _2, "ashoro": _2, "assabu": _2, "atsuma": _2, "bibai": _2, "biei": _2, "bifuka": _2, "bihoro": _2, "biratori": _2, "chippubetsu": _2, "chitose": _2, "date": _2, "ebetsu": _2, "embetsu": _2, "eniwa": _2, "erimo": _2, "esan": _2, "esashi": _2, "fukagawa": _2, "fukushima": _2, "furano": _2, "furubira": _2, "haboro": _2, "hakodate": _2, "hamatonbetsu": _2, "hidaka": _2, "higashikagura": _2, "higashikawa": _2, "hiroo": _2, "hokuryu": _2, "hokuto": _2, "honbetsu": _2, "horokanai": _2, "horonobe": _2, "ikeda": _2, "imakane": _2, "ishikari": _2, "iwamizawa": _2, "iwanai": _2, "kamifurano": _2, "kamikawa": _2, "kamishihoro": _2, "kamisunagawa": _2, "kamoenai": _2, "kayabe": _2, "kembuchi": _2, "kikonai": _2, "kimobetsu": _2, "kitahiroshima": _2, "kitami": _2, "kiyosato": _2, "koshimizu": _2, "kunneppu": _2, "kuriyama": _2, "kuromatsunai": _2, "kushiro": _2, "kutchan": _2, "kyowa": _2, "mashike": _2, "matsumae": _2, "mikasa": _2, "minamifurano": _2, "mombetsu": _2, "moseushi": _2, "mukawa": _2, "muroran": _2, "naie": _2, "nakagawa": _2, "nakasatsunai": _2, "nakatombetsu": _2, "nanae": _2, "nanporo": _2, "nayoro": _2, "nemuro": _2, "niikappu": _2, "niki": _2, "nishiokoppe": _2, "noboribetsu": _2, "numata": _2, "obihiro": _2, "obira": _2, "oketo": _2, "okoppe": _2, "otaru": _2, "otobe": _2, "otofuke": _2, "otoineppu": _2, "oumu": _2, "ozora": _2, "pippu": _2, "rankoshi": _2, "rebun": _2, "rikubetsu": _2, "rishiri": _2, "rishirifuji": _2, "saroma": _2, "sarufutsu": _2, "shakotan": _2, "shari": _2, "shibecha": _2, "shibetsu": _2, "shikabe": _2, "shikaoi": _2, "shimamaki": _2, "shimizu": _2, "shimokawa": _2, "shinshinotsu": _2, "shintoku": _2, "shiranuka": _2, "shiraoi": _2, "shiriuchi": _2, "sobetsu": _2, "sunagawa": _2, "taiki": _2, "takasu": _2, "takikawa": _2, "takinoue": _2, "teshikaga": _2, "tobetsu": _2, "tohma": _2, "tomakomai": _2, "tomari": _2, "toya": _2, "toyako": _2, "toyotomi": _2, "toyoura": _2, "tsubetsu": _2, "tsukigata": _2, "urakawa": _2, "urausu": _2, "uryu": _2, "utashinai": _2, "wakkanai": _2, "wassamu": _2, "yakumo": _2, "yoichi": _2 } }, "hyogo": { "$": 1, "succ": { "aioi": _2, "akashi": _2, "ako": _2, "amagasaki": _2, "aogaki": _2, "asago": _2, "ashiya": _2, "awaji": _2, "fukusaki": _2, "goshiki": _2, "harima": _2, "himeji": _2, "ichikawa": _2, "inagawa": _2, "itami": _2, "kakogawa": _2, "kamigori": _2, "kamikawa": _2, "kasai": _2, "kasuga": _2, "kawanishi": _2, "miki": _2, "minamiawaji": _2, "nishinomiya": _2, "nishiwaki": _2, "ono": _2, "sanda": _2, "sannan": _2, "sasayama": _2, "sayo": _2, "shingu": _2, "shinonsen": _2, "shiso": _2, "sumoto": _2, "taishi": _2, "taka": _2, "takarazuka": _2, "takasago": _2, "takino": _2, "tamba": _2, "tatsuno": _2, "toyooka": _2, "yabu": _2, "yashiro": _2, "yoka": _2, "yokawa": _2 } }, "ibaraki": { "$": 1, "succ": { "ami": _2, "asahi": _2, "bando": _2, "chikusei": _2, "daigo": _2, "fujishiro": _2, "hitachi": _2, "hitachinaka": _2, "hitachiomiya": _2, "hitachiota": _2, "ibaraki": _2, "ina": _2, "inashiki": _2, "itako": _2, "iwama": _2, "joso": _2, "kamisu": _2, "kasama": _2, "kashima": _2, "kasumigaura": _2, "koga": _2, "miho": _2, "mito": _2, "moriya": _2, "naka": _2, "namegata": _2, "oarai": _2, "ogawa": _2, "omitama": _2, "ryugasaki": _2, "sakai": _2, "sakuragawa": _2, "shimodate": _2, "shimotsuma": _2, "shirosato": _2, "sowa": _2, "suifu": _2, "takahagi": _2, "tamatsukuri": _2, "tokai": _2, "tomobe": _2, "tone": _2, "toride": _2, "tsuchiura": _2, "tsukuba": _2, "uchihara": _2, "ushiku": _2, "yachiyo": _2, "yamagata": _2, "yawara": _2, "yuki": _2 } }, "ishikawa": { "$": 1, "succ": { "anamizu": _2, "hakui": _2, "hakusan": _2, "kaga": _2, "kahoku": _2, "kanazawa": _2, "kawakita": _2, "komatsu": _2, "nakanoto": _2, "nanao": _2, "nomi": _2, "nonoichi": _2, "noto": _2, "shika": _2, "suzu": _2, "tsubata": _2, "tsurugi": _2, "uchinada": _2, "wajima": _2 } }, "iwate": { "$": 1, "succ": { "fudai": _2, "fujisawa": _2, "hanamaki": _2, "hiraizumi": _2, "hirono": _2, "ichinohe": _2, "ichinoseki": _2, "iwaizumi": _2, "iwate": _2, "joboji": _2, "kamaishi": _2, "kanegasaki": _2, "karumai": _2, "kawai": _2, "kitakami": _2, "kuji": _2, "kunohe": _2, "kuzumaki": _2, "miyako": _2, "mizusawa": _2, "morioka": _2, "ninohe": _2, "noda": _2, "ofunato": _2, "oshu": _2, "otsuchi": _2, "rikuzentakata": _2, "shiwa": _2, "shizukuishi": _2, "sumita": _2, "tanohata": _2, "tono": _2, "yahaba": _2, "yamada": _2 } }, "kagawa": { "$": 1, "succ": { "ayagawa": _2, "higashikagawa": _2, "kanonji": _2, "kotohira": _2, "manno": _2, "marugame": _2, "mitoyo": _2, "naoshima": _2, "sanuki": _2, "tadotsu": _2, "takamatsu": _2, "tonosho": _2, "uchinomi": _2, "utazu": _2, "zentsuji": _2 } }, "kagoshima": { "$": 1, "succ": { "akune": _2, "amami": _2, "hioki": _2, "isa": _2, "isen": _2, "izumi": _2, "kagoshima": _2, "kanoya": _2, "kawanabe": _2, "kinko": _2, "kouyama": _2, "makurazaki": _2, "matsumoto": _2, "minamitane": _2, "nakatane": _2, "nishinoomote": _2, "satsumasendai": _2, "soo": _2, "tarumizu": _2, "yusui": _2 } }, "kanagawa": { "$": 1, "succ": { "aikawa": _2, "atsugi": _2, "ayase": _2, "chigasaki": _2, "ebina": _2, "fujisawa": _2, "hadano": _2, "hakone": _2, "hiratsuka": _2, "isehara": _2, "kaisei": _2, "kamakura": _2, "kiyokawa": _2, "matsuda": _2, "minamiashigara": _2, "miura": _2, "nakai": _2, "ninomiya": _2, "odawara": _2, "oi": _2, "oiso": _2, "sagamihara": _2, "samukawa": _2, "tsukui": _2, "yamakita": _2, "yamato": _2, "yokosuka": _2, "yugawara": _2, "zama": _2, "zushi": _2 } }, "kochi": { "$": 1, "succ": { "aki": _2, "geisei": _2, "hidaka": _2, "higashitsuno": _2, "ino": _2, "kagami": _2, "kami": _2, "kitagawa": _2, "kochi": _2, "mihara": _2, "motoyama": _2, "muroto": _2, "nahari": _2, "nakamura": _2, "nankoku": _2, "nishitosa": _2, "niyodogawa": _2, "ochi": _2, "okawa": _2, "otoyo": _2, "otsuki": _2, "sakawa": _2, "sukumo": _2, "susaki": _2, "tosa": _2, "tosashimizu": _2, "toyo": _2, "tsuno": _2, "umaji": _2, "yasuda": _2, "yusuhara": _2 } }, "kumamoto": { "$": 1, "succ": { "amakusa": _2, "arao": _2, "aso": _2, "choyo": _2, "gyokuto": _2, "kamiamakusa": _2, "kikuchi": _2, "kumamoto": _2, "mashiki": _2, "mifune": _2, "minamata": _2, "minamioguni": _2, "nagasu": _2, "nishihara": _2, "oguni": _2, "ozu": _2, "sumoto": _2, "takamori": _2, "uki": _2, "uto": _2, "yamaga": _2, "yamato": _2, "yatsushiro": _2 } }, "kyoto": { "$": 1, "succ": { "ayabe": _2, "fukuchiyama": _2, "higashiyama": _2, "ide": _2, "ine": _2, "joyo": _2, "kameoka": _2, "kamo": _2, "kita": _2, "kizu": _2, "kumiyama": _2, "kyotamba": _2, "kyotanabe": _2, "kyotango": _2, "maizuru": _2, "minami": _2, "minamiyamashiro": _2, "miyazu": _2, "muko": _2, "nagaokakyo": _2, "nakagyo": _2, "nantan": _2, "oyamazaki": _2, "sakyo": _2, "seika": _2, "tanabe": _2, "uji": _2, "ujitawara": _2, "wazuka": _2, "yamashina": _2, "yawata": _2 } }, "mie": { "$": 1, "succ": { "asahi": _2, "inabe": _2, "ise": _2, "kameyama": _2, "kawagoe": _2, "kiho": _2, "kisosaki": _2, "kiwa": _2, "komono": _2, "kumano": _2, "kuwana": _2, "matsusaka": _2, "meiwa": _2, "mihama": _2, "minamiise": _2, "misugi": _2, "miyama": _2, "nabari": _2, "shima": _2, "suzuka": _2, "tado": _2, "taiki": _2, "taki": _2, "tamaki": _2, "toba": _2, "tsu": _2, "udono": _2, "ureshino": _2, "watarai": _2, "yokkaichi": _2 } }, "miyagi": { "$": 1, "succ": { "furukawa": _2, "higashimatsushima": _2, "ishinomaki": _2, "iwanuma": _2, "kakuda": _2, "kami": _2, "kawasaki": _2, "marumori": _2, "matsushima": _2, "minamisanriku": _2, "misato": _2, "murata": _2, "natori": _2, "ogawara": _2, "ohira": _2, "onagawa": _2, "osaki": _2, "rifu": _2, "semine": _2, "shibata": _2, "shichikashuku": _2, "shikama": _2, "shiogama": _2, "shiroishi": _2, "tagajo": _2, "taiwa": _2, "tome": _2, "tomiya": _2, "wakuya": _2, "watari": _2, "yamamoto": _2, "zao": _2 } }, "miyazaki": { "$": 1, "succ": { "aya": _2, "ebino": _2, "gokase": _2, "hyuga": _2, "kadogawa": _2, "kawaminami": _2, "kijo": _2, "kitagawa": _2, "kitakata": _2, "kitaura": _2, "kobayashi": _2, "kunitomi": _2, "kushima": _2, "mimata": _2, "miyakonojo": _2, "miyazaki": _2, "morotsuka": _2, "nichinan": _2, "nishimera": _2, "nobeoka": _2, "saito": _2, "shiiba": _2, "shintomi": _2, "takaharu": _2, "takanabe": _2, "takazaki": _2, "tsuno": _2 } }, "nagano": { "$": 1, "succ": { "achi": _2, "agematsu": _2, "anan": _2, "aoki": _2, "asahi": _2, "azumino": _2, "chikuhoku": _2, "chikuma": _2, "chino": _2, "fujimi": _2, "hakuba": _2, "hara": _2, "hiraya": _2, "iida": _2, "iijima": _2, "iiyama": _2, "iizuna": _2, "ikeda": _2, "ikusaka": _2, "ina": _2, "karuizawa": _2, "kawakami": _2, "kiso": _2, "kisofukushima": _2, "kitaaiki": _2, "komagane": _2, "komoro": _2, "matsukawa": _2, "matsumoto": _2, "miasa": _2, "minamiaiki": _2, "minamimaki": _2, "minamiminowa": _2, "minowa": _2, "miyada": _2, "miyota": _2, "mochizuki": _2, "nagano": _2, "nagawa": _2, "nagiso": _2, "nakagawa": _2, "nakano": _2, "nozawaonsen": _2, "obuse": _2, "ogawa": _2, "okaya": _2, "omachi": _2, "omi": _2, "ookuwa": _2, "ooshika": _2, "otaki": _2, "otari": _2, "sakae": _2, "sakaki": _2, "saku": _2, "sakuho": _2, "shimosuwa": _2, "shinanomachi": _2, "shiojiri": _2, "suwa": _2, "suzaka": _2, "takagi": _2, "takamori": _2, "takayama": _2, "tateshina": _2, "tatsuno": _2, "togakushi": _2, "togura": _2, "tomi": _2, "ueda": _2, "wada": _2, "yamagata": _2, "yamanouchi": _2, "yasaka": _2, "yasuoka": _2 } }, "nagasaki": { "$": 1, "succ": { "chijiwa": _2, "futsu": _2, "goto": _2, "hasami": _2, "hirado": _2, "iki": _2, "isahaya": _2, "kawatana": _2, "kuchinotsu": _2, "matsuura": _2, "nagasaki": _2, "obama": _2, "omura": _2, "oseto": _2, "saikai": _2, "sasebo": _2, "seihi": _2, "shimabara": _2, "shinkamigoto": _2, "togitsu": _2, "tsushima": _2, "unzen": _2 } }, "nara": { "$": 1, "succ": { "ando": _2, "gose": _2, "heguri": _2, "higashiyoshino": _2, "ikaruga": _2, "ikoma": _2, "kamikitayama": _2, "kanmaki": _2, "kashiba": _2, "kashihara": _2, "katsuragi": _2, "kawai": _2, "kawakami": _2, "kawanishi": _2, "koryo": _2, "kurotaki": _2, "mitsue": _2, "miyake": _2, "nara": _2, "nosegawa": _2, "oji": _2, "ouda": _2, "oyodo": _2, "sakurai": _2, "sango": _2, "shimoichi": _2, "shimokitayama": _2, "shinjo": _2, "soni": _2, "takatori": _2, "tawaramoto": _2, "tenkawa": _2, "tenri": _2, "uda": _2, "yamatokoriyama": _2, "yamatotakada": _2, "yamazoe": _2, "yoshino": _2 } }, "niigata": { "$": 1, "succ": { "aga": _2, "agano": _2, "gosen": _2, "itoigawa": _2, "izumozaki": _2, "joetsu": _2, "kamo": _2, "kariwa": _2, "kashiwazaki": _2, "minamiuonuma": _2, "mitsuke": _2, "muika": _2, "murakami": _2, "myoko": _2, "nagaoka": _2, "niigata": _2, "ojiya": _2, "omi": _2, "sado": _2, "sanjo": _2, "seiro": _2, "seirou": _2, "sekikawa": _2, "shibata": _2, "tagami": _2, "tainai": _2, "tochio": _2, "tokamachi": _2, "tsubame": _2, "tsunan": _2, "uonuma": _2, "yahiko": _2, "yoita": _2, "yuzawa": _2 } }, "oita": { "$": 1, "succ": { "beppu": _2, "bungoono": _2, "bungotakada": _2, "hasama": _2, "hiji": _2, "himeshima": _2, "hita": _2, "kamitsue": _2, "kokonoe": _2, "kuju": _2, "kunisaki": _2, "kusu": _2, "oita": _2, "saiki": _2, "taketa": _2, "tsukumi": _2, "usa": _2, "usuki": _2, "yufu": _2 } }, "okayama": { "$": 1, "succ": { "akaiwa": _2, "asakuchi": _2, "bizen": _2, "hayashima": _2, "ibara": _2, "kagamino": _2, "kasaoka": _2, "kibichuo": _2, "kumenan": _2, "kurashiki": _2, "maniwa": _2, "misaki": _2, "nagi": _2, "niimi": _2, "nishiawakura": _2, "okayama": _2, "satosho": _2, "setouchi": _2, "shinjo": _2, "shoo": _2, "soja": _2, "takahashi": _2, "tamano": _2, "tsuyama": _2, "wake": _2, "yakage": _2 } }, "okinawa": { "$": 1, "succ": { "aguni": _2, "ginowan": _2, "ginoza": _2, "gushikami": _2, "haebaru": _2, "higashi": _2, "hirara": _2, "iheya": _2, "ishigaki": _2, "ishikawa": _2, "itoman": _2, "izena": _2, "kadena": _2, "kin": _2, "kitadaito": _2, "kitanakagusuku": _2, "kumejima": _2, "kunigami": _2, "minamidaito": _2, "motobu": _2, "nago": _2, "naha": _2, "nakagusuku": _2, "nakijin": _2, "nanjo": _2, "nishihara": _2, "ogimi": _2, "okinawa": _2, "onna": _2, "shimoji": _2, "taketomi": _2, "tarama": _2, "tokashiki": _2, "tomigusuku": _2, "tonaki": _2, "urasoe": _2, "uruma": _2, "yaese": _2, "yomitan": _2, "yonabaru": _2, "yonaguni": _2, "zamami": _2 } }, "osaka": { "$": 1, "succ": { "abeno": _2, "chihayaakasaka": _2, "chuo": _2, "daito": _2, "fujiidera": _2, "habikino": _2, "hannan": _2, "higashiosaka": _2, "higashisumiyoshi": _2, "higashiyodogawa": _2, "hirakata": _2, "ibaraki": _2, "ikeda": _2, "izumi": _2, "izumiotsu": _2, "izumisano": _2, "kadoma": _2, "kaizuka": _2, "kanan": _2, "kashiwara": _2, "katano": _2, "kawachinagano": _2, "kishiwada": _2, "kita": _2, "kumatori": _2, "matsubara": _2, "minato": _2, "minoh": _2, "misaki": _2, "moriguchi": _2, "neyagawa": _2, "nishi": _2, "nose": _2, "osakasayama": _2, "sakai": _2, "sayama": _2, "sennan": _2, "settsu": _2, "shijonawate": _2, "shimamoto": _2, "suita": _2, "tadaoka": _2, "taishi": _2, "tajiri": _2, "takaishi": _2, "takatsuki": _2, "tondabayashi": _2, "toyonaka": _2, "toyono": _2, "yao": _2 } }, "saga": { "$": 1, "succ": { "ariake": _2, "arita": _2, "fukudomi": _2, "genkai": _2, "hamatama": _2, "hizen": _2, "imari": _2, "kamimine": _2, "kanzaki": _2, "karatsu": _2, "kashima": _2, "kitagata": _2, "kitahata": _2, "kiyama": _2, "kouhoku": _2, "kyuragi": _2, "nishiarita": _2, "ogi": _2, "omachi": _2, "ouchi": _2, "saga": _2, "shiroishi": _2, "taku": _2, "tara": _2, "tosu": _2, "yoshinogari": _2 } }, "saitama": { "$": 1, "succ": { "arakawa": _2, "asaka": _2, "chichibu": _2, "fujimi": _2, "fujimino": _2, "fukaya": _2, "hanno": _2, "hanyu": _2, "hasuda": _2, "hatogaya": _2, "hatoyama": _2, "hidaka": _2, "higashichichibu": _2, "higashimatsuyama": _2, "honjo": _2, "ina": _2, "iruma": _2, "iwatsuki": _2, "kamiizumi": _2, "kamikawa": _2, "kamisato": _2, "kasukabe": _2, "kawagoe": _2, "kawaguchi": _2, "kawajima": _2, "kazo": _2, "kitamoto": _2, "koshigaya": _2, "kounosu": _2, "kuki": _2, "kumagaya": _2, "matsubushi": _2, "minano": _2, "misato": _2, "miyashiro": _2, "miyoshi": _2, "moroyama": _2, "nagatoro": _2, "namegawa": _2, "niiza": _2, "ogano": _2, "ogawa": _2, "ogose": _2, "okegawa": _2, "omiya": _2, "otaki": _2, "ranzan": _2, "ryokami": _2, "saitama": _2, "sakado": _2, "satte": _2, "sayama": _2, "shiki": _2, "shiraoka": _2, "soka": _2, "sugito": _2, "toda": _2, "tokigawa": _2, "tokorozawa": _2, "tsurugashima": _2, "urawa": _2, "warabi": _2, "yashio": _2, "yokoze": _2, "yono": _2, "yorii": _2, "yoshida": _2, "yoshikawa": _2, "yoshimi": _2 } }, "shiga": { "$": 1, "succ": { "aisho": _2, "gamo": _2, "higashiomi": _2, "hikone": _2, "koka": _2, "konan": _2, "kosei": _2, "koto": _2, "kusatsu": _2, "maibara": _2, "moriyama": _2, "nagahama": _2, "nishiazai": _2, "notogawa": _2, "omihachiman": _2, "otsu": _2, "ritto": _2, "ryuoh": _2, "takashima": _2, "takatsuki": _2, "torahime": _2, "toyosato": _2, "yasu": _2 } }, "shimane": { "$": 1, "succ": { "akagi": _2, "ama": _2, "gotsu": _2, "hamada": _2, "higashiizumo": _2, "hikawa": _2, "hikimi": _2, "izumo": _2, "kakinoki": _2, "masuda": _2, "matsue": _2, "misato": _2, "nishinoshima": _2, "ohda": _2, "okinoshima": _2, "okuizumo": _2, "shimane": _2, "tamayu": _2, "tsuwano": _2, "unnan": _2, "yakumo": _2, "yasugi": _2, "yatsuka": _2 } }, "shizuoka": { "$": 1, "succ": { "arai": _2, "atami": _2, "fuji": _2, "fujieda": _2, "fujikawa": _2, "fujinomiya": _2, "fukuroi": _2, "gotemba": _2, "haibara": _2, "hamamatsu": _2, "higashiizu": _2, "ito": _2, "iwata": _2, "izu": _2, "izunokuni": _2, "kakegawa": _2, "kannami": _2, "kawanehon": _2, "kawazu": _2, "kikugawa": _2, "kosai": _2, "makinohara": _2, "matsuzaki": _2, "minamiizu": _2, "mishima": _2, "morimachi": _2, "nishiizu": _2, "numazu": _2, "omaezaki": _2, "shimada": _2, "shimizu": _2, "shimoda": _2, "shizuoka": _2, "susono": _2, "yaizu": _2, "yoshida": _2 } }, "tochigi": { "$": 1, "succ": { "ashikaga": _2, "bato": _2, "haga": _2, "ichikai": _2, "iwafune": _2, "kaminokawa": _2, "kanuma": _2, "karasuyama": _2, "kuroiso": _2, "mashiko": _2, "mibu": _2, "moka": _2, "motegi": _2, "nasu": _2, "nasushiobara": _2, "nikko": _2, "nishikata": _2, "nogi": _2, "ohira": _2, "ohtawara": _2, "oyama": _2, "sakura": _2, "sano": _2, "shimotsuke": _2, "shioya": _2, "takanezawa": _2, "tochigi": _2, "tsuga": _2, "ujiie": _2, "utsunomiya": _2, "yaita": _2 } }, "tokushima": { "$": 1, "succ": { "aizumi": _2, "anan": _2, "ichiba": _2, "itano": _2, "kainan": _2, "komatsushima": _2, "matsushige": _2, "mima": _2, "minami": _2, "miyoshi": _2, "mugi": _2, "nakagawa": _2, "naruto": _2, "sanagochi": _2, "shishikui": _2, "tokushima": _2, "wajiki": _2 } }, "tokyo": { "$": 1, "succ": { "adachi": _2, "akiruno": _2, "akishima": _2, "aogashima": _2, "arakawa": _2, "bunkyo": _2, "chiyoda": _2, "chofu": _2, "chuo": _2, "edogawa": _2, "fuchu": _2, "fussa": _2, "hachijo": _2, "hachioji": _2, "hamura": _2, "higashikurume": _2, "higashimurayama": _2, "higashiyamato": _2, "hino": _2, "hinode": _2, "hinohara": _2, "inagi": _2, "itabashi": _2, "katsushika": _2, "kita": _2, "kiyose": _2, "kodaira": _2, "koganei": _2, "kokubunji": _2, "komae": _2, "koto": _2, "kouzushima": _2, "kunitachi": _2, "machida": _2, "meguro": _2, "minato": _2, "mitaka": _2, "mizuho": _2, "musashimurayama": _2, "musashino": _2, "nakano": _2, "nerima": _2, "ogasawara": _2, "okutama": _2, "ome": _2, "oshima": _2, "ota": _2, "setagaya": _2, "shibuya": _2, "shinagawa": _2, "shinjuku": _2, "suginami": _2, "sumida": _2, "tachikawa": _2, "taito": _2, "tama": _2, "toshima": _2 } }, "tottori": { "$": 1, "succ": { "chizu": _2, "hino": _2, "kawahara": _2, "koge": _2, "kotoura": _2, "misasa": _2, "nanbu": _2, "nichinan": _2, "sakaiminato": _2, "tottori": _2, "wakasa": _2, "yazu": _2, "yonago": _2 } }, "toyama": { "$": 1, "succ": { "asahi": _2, "fuchu": _2, "fukumitsu": _2, "funahashi": _2, "himi": _2, "imizu": _2, "inami": _2, "johana": _2, "kamiichi": _2, "kurobe": _2, "nakaniikawa": _2, "namerikawa": _2, "nanto": _2, "nyuzen": _2, "oyabe": _2, "taira": _2, "takaoka": _2, "tateyama": _2, "toga": _2, "tonami": _2, "toyama": _2, "unazuki": _2, "uozu": _2, "yamada": _2 } }, "wakayama": { "$": 1, "succ": { "arida": _2, "aridagawa": _2, "gobo": _2, "hashimoto": _2, "hidaka": _2, "hirogawa": _2, "inami": _2, "iwade": _2, "kainan": _2, "kamitonda": _2, "katsuragi": _2, "kimino": _2, "kinokawa": _2, "kitayama": _2, "koya": _2, "koza": _2, "kozagawa": _2, "kudoyama": _2, "kushimoto": _2, "mihama": _2, "misato": _2, "nachikatsuura": _2, "shingu": _2, "shirahama": _2, "taiji": _2, "tanabe": _2, "wakayama": _2, "yuasa": _2, "yura": _2 } }, "yamagata": { "$": 1, "succ": { "asahi": _2, "funagata": _2, "higashine": _2, "iide": _2, "kahoku": _2, "kaminoyama": _2, "kaneyama": _2, "kawanishi": _2, "mamurogawa": _2, "mikawa": _2, "murayama": _2, "nagai": _2, "nakayama": _2, "nanyo": _2, "nishikawa": _2, "obanazawa": _2, "oe": _2, "oguni": _2, "ohkura": _2, "oishida": _2, "sagae": _2, "sakata": _2, "sakegawa": _2, "shinjo": _2, "shirataka": _2, "shonai": _2, "takahata": _2, "tendo": _2, "tozawa": _2, "tsuruoka": _2, "yamagata": _2, "yamanobe": _2, "yonezawa": _2, "yuza": _2 } }, "yamaguchi": { "$": 1, "succ": { "abu": _2, "hagi": _2, "hikari": _2, "hofu": _2, "iwakuni": _2, "kudamatsu": _2, "mitou": _2, "nagato": _2, "oshima": _2, "shimonoseki": _2, "shunan": _2, "tabuse": _2, "tokuyama": _2, "toyota": _2, "ube": _2, "yuu": _2 } }, "yamanashi": { "$": 1, "succ": { "chuo": _2, "doshi": _2, "fuefuki": _2, "fujikawa": _2, "fujikawaguchiko": _2, "fujiyoshida": _2, "hayakawa": _2, "hokuto": _2, "ichikawamisato": _2, "kai": _2, "kofu": _2, "koshu": _2, "kosuge": _2, "minami-alps": _2, "minobu": _2, "nakamichi": _2, "nanbu": _2, "narusawa": _2, "nirasaki": _2, "nishikatsura": _2, "oshino": _2, "otsuki": _2, "showa": _2, "tabayama": _2, "tsuru": _2, "uenohara": _2, "yamanakako": _2, "yamanashi": _2 } }, "xn--4pvxs": _2, "栃木": _2, "xn--vgu402c": _2, "愛知": _2, "xn--c3s14m": _2, "愛媛": _2, "xn--f6qx53a": _2, "兵庫": _2, "xn--8pvr4u": _2, "熊本": _2, "xn--uist22h": _2, "茨城": _2, "xn--djrs72d6uy": _2, "北海道": _2, "xn--mkru45i": _2, "千葉": _2, "xn--0trq7p7nn": _2, "和歌山": _2, "xn--8ltr62k": _2, "長崎": _2, "xn--2m4a15e": _2, "長野": _2, "xn--efvn9s": _2, "新潟": _2, "xn--32vp30h": _2, "青森": _2, "xn--4it797k": _2, "静岡": _2, "xn--1lqs71d": _2, "東京": _2, "xn--5rtp49c": _2, "石川": _2, "xn--5js045d": _2, "埼玉": _2, "xn--ehqz56n": _2, "三重": _2, "xn--1lqs03n": _2, "京都": _2, "xn--qqqt11m": _2, "佐賀": _2, "xn--kbrq7o": _2, "大分": _2, "xn--pssu33l": _2, "大阪": _2, "xn--ntsq17g": _2, "奈良": _2, "xn--uisz3g": _2, "宮城": _2, "xn--6btw5a": _2, "宮崎": _2, "xn--1ctwo": _2, "富山": _2, "xn--6orx2r": _2, "山口": _2, "xn--rht61e": _2, "山形": _2, "xn--rht27z": _2, "山梨": _2, "xn--djty4k": _2, "岩手": _2, "xn--nit225k": _2, "岐阜": _2, "xn--rht3d": _2, "岡山": _2, "xn--klty5x": _2, "島根": _2, "xn--kltx9a": _2, "広島": _2, "xn--kltp7d": _2, "徳島": _2, "xn--uuwu58a": _2, "沖縄": _2, "xn--zbx025d": _2, "滋賀": _2, "xn--ntso0iqx3a": _2, "神奈川": _2, "xn--elqq16h": _2, "福井": _2, "xn--4it168d": _2, "福岡": _2, "xn--klt787d": _2, "福島": _2, "xn--rny31h": _2, "秋田": _2, "xn--7t0a264c": _2, "群馬": _2, "xn--5rtq34k": _2, "香川": _2, "xn--k7yn95e": _2, "高知": _2, "xn--tor131o": _2, "鳥取": _2, "xn--d5qv7z876c": _2, "鹿児島": _2, "kawasaki": _8, "kitakyushu": _8, "kobe": _8, "nagoya": _8, "sapporo": _8, "sendai": _8, "yokohama": _8, "usercontent": _4, "blogspot": _4 } }, "ke": { "$": 1, "succ": { "ac": _2, "co": _5, "go": _2, "info": _2, "me": _2, "mobi": _2, "ne": _2, "or": _2, "sc": _2, "nom": _4 } }, "kg": _3, "kh": _8, "ki": _23, "km": { "$": 1, "succ": { "org": _2, "nom": _2, "gov": _2, "prd": _2, "tm": _2, "edu": _2, "mil": _2, "ass": _2, "com": _2, "coop": _2, "asso": _2, "presse": _2, "medecin": _2, "notaires": _2, "pharmaciens": _2, "veterinaire": _2, "gouv": _2 } }, "kn": { "$": 1, "succ": { "net": _2, "org": _2, "edu": _2, "gov": _2 } }, "kp": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "org": _2, "rep": _2, "tra": _2 } }, "kr": { "$": 1, "succ": { "ac": _2, "co": _2, "es": _2, "go": _2, "hs": _2, "kg": _2, "mil": _2, "ms": _2, "ne": _2, "or": _2, "pe": _2, "re": _2, "sc": _2, "busan": _2, "chungbuk": _2, "chungnam": _2, "daegu": _2, "daejeon": _2, "gangwon": _2, "gwangju": _2, "gyeongbuk": _2, "gyeonggi": _2, "gyeongnam": _2, "incheon": _2, "jeju": _2, "jeonbuk": _2, "jeonnam": _2, "seoul": _2, "ulsan": _2, "blogspot": _4 } }, "kw": { "$": 1, "succ": { "com": _2, "edu": _2, "emb": _2, "gov": _2, "ind": _2, "net": _2, "org": _2 } }, "ky": _9, "kz": { "$": 1, "succ": { "org": _2, "edu": _2, "net": _2, "gov": _2, "mil": _2, "com": _2, "nym": _4 } }, "la": { "$": 1, "succ": { "int": _2, "net": _2, "info": _2, "edu": _2, "gov": _2, "per": _2, "com": _2, "org": _2, "bnr": _4, "c": _4, "nym": _4 } }, "lb": _9, "lc": { "$": 1, "succ": { "com": _2, "net": _2, "co": _2, "org": _2, "edu": _2, "gov": _2, "nym": _4, "oy": _4 } }, "li": { "$": 1, "succ": { "blogspot": _4, "caa": _4, "nom": _4, "nym": _4 } }, "lk": { "$": 1, "succ": { "gov": _2, "sch": _2, "net": _2, "int": _2, "com": _2, "org": _2, "edu": _2, "ngo": _2, "soc": _2, "web": _2, "ltd": _2, "assn": _2, "grp": _2, "hotel": _2, "ac": _2 } }, "lr": _9, "ls": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "edu": _2, "gov": _2, "info": _2, "net": _2, "org": _2, "sc": _2 } }, "lt": _21, "lu": _24, "lv": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "org": _2, "mil": _2, "id": _2, "net": _2, "asn": _2, "conf": _2 } }, "ly": { "$": 1, "succ": { "com": _2, "net": _2, "gov": _2, "plc": _2, "edu": _2, "sch": _2, "med": _2, "org": _2, "id": _2 } }, "ma": { "$": 1, "succ": { "co": _2, "net": _2, "gov": _2, "org": _2, "ac": _2, "press": _2 } }, "mc": { "$": 1, "succ": { "tm": _2, "asso": _2 } }, "md": _5, "me": { "$": 1, "succ": { "co": _2, "net": _2, "org": _2, "edu": _2, "ac": _2, "gov": _2, "its": _2, "priv": _2, "c66": _4, "daplie": { "$": 2, "succ": { "localhost": _4 } }, "filegear": _4, "filegear-au": _4, "filegear-de": _4, "filegear-gb": _4, "filegear-ie": _4, "filegear-jp": _4, "filegear-sg": _4, "glitch": _4, "ravendb": _4, "barsy": _4, "nctu": _4, "soundcast": _4, "tcp4": _4, "brasilia": _4, "ddns": _4, "dnsfor": _4, "hopto": _4, "loginto": _4, "noip": _4, "webhop": _4, "nym": _4, "diskstation": _4, "dscloud": _4, "i234": _4, "myds": _4, "synology": _4, "wedeploy": _4, "yombo": _4, "nohost": _4 } }, "mg": { "$": 1, "succ": { "org": _2, "nom": _2, "gov": _2, "prd": _2, "tm": _2, "edu": _2, "mil": _2, "com": _2, "co": _2 } }, "mh": _2, "mil": _2, "mk": { "$": 1, "succ": { "com": _2, "org": _2, "net": _2, "edu": _2, "gov": _2, "inf": _2, "name": _2, "blogspot": _4, "nom": _4 } }, "ml": { "$": 1, "succ": { "com": _2, "edu": _2, "gouv": _2, "gov": _2, "net": _2, "org": _2, "presse": _2 } }, "mm": _8, "mn": { "$": 1, "succ": { "gov": _2, "edu": _2, "org": _2, "nyc": _4, "nym": _4 } }, "mo": _9, "mobi": { "$": 1, "succ": { "barsy": _4, "dscloud": _4 } }, "mp": _2, "mq": _2, "mr": { "$": 1, "succ": { "gov": _2, "blogspot": _4 } }, "ms": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2, "lab": _4 } }, "mt": { "$": 1, "succ": { "com": _5, "edu": _2, "net": _2, "org": _2 } }, "mu": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "ac": _2, "co": _2, "or": _2 } }, "museum": { "$": 1, "succ": { "academy": _2, "agriculture": _2, "air": _2, "airguard": _2, "alabama": _2, "alaska": _2, "amber": _2, "ambulance": _2, "american": _2, "americana": _2, "americanantiques": _2, "americanart": _2, "amsterdam": _2, "and": _2, "annefrank": _2, "anthro": _2, "anthropology": _2, "antiques": _2, "aquarium": _2, "arboretum": _2, "archaeological": _2, "archaeology": _2, "architecture": _2, "art": _2, "artanddesign": _2, "artcenter": _2, "artdeco": _2, "arteducation": _2, "artgallery": _2, "arts": _2, "artsandcrafts": _2, "asmatart": _2, "assassination": _2, "assisi": _2, "association": _2, "astronomy": _2, "atlanta": _2, "austin": _2, "australia": _2, "automotive": _2, "aviation": _2, "axis": _2, "badajoz": _2, "baghdad": _2, "bahn": _2, "bale": _2, "baltimore": _2, "barcelona": _2, "baseball": _2, "basel": _2, "baths": _2, "bauern": _2, "beauxarts": _2, "beeldengeluid": _2, "bellevue": _2, "bergbau": _2, "berkeley": _2, "berlin": _2, "bern": _2, "bible": _2, "bilbao": _2, "bill": _2, "birdart": _2, "birthplace": _2, "bonn": _2, "boston": _2, "botanical": _2, "botanicalgarden": _2, "botanicgarden": _2, "botany": _2, "brandywinevalley": _2, "brasil": _2, "bristol": _2, "british": _2, "britishcolumbia": _2, "broadcast": _2, "brunel": _2, "brussel": _2, "brussels": _2, "bruxelles": _2, "building": _2, "burghof": _2, "bus": _2, "bushey": _2, "cadaques": _2, "california": _2, "cambridge": _2, "can": _2, "canada": _2, "capebreton": _2, "carrier": _2, "cartoonart": _2, "casadelamoneda": _2, "castle": _2, "castres": _2, "celtic": _2, "center": _2, "chattanooga": _2, "cheltenham": _2, "chesapeakebay": _2, "chicago": _2, "children": _2, "childrens": _2, "childrensgarden": _2, "chiropractic": _2, "chocolate": _2, "christiansburg": _2, "cincinnati": _2, "cinema": _2, "circus": _2, "civilisation": _2, "civilization": _2, "civilwar": _2, "clinton": _2, "clock": _2, "coal": _2, "coastaldefence": _2, "cody": _2, "coldwar": _2, "collection": _2, "colonialwilliamsburg": _2, "coloradoplateau": _2, "columbia": _2, "columbus": _2, "communication": _2, "communications": _2, "community": _2, "computer": _2, "computerhistory": _2, "xn--comunicaes-v6a2o": _2, "comunicações": _2, "contemporary": _2, "contemporaryart": _2, "convent": _2, "copenhagen": _2, "corporation": _2, "xn--correios-e-telecomunicaes-ghc29a": _2, "correios-e-telecomunicações": _2, "corvette": _2, "costume": _2, "countryestate": _2, "county": _2, "crafts": _2, "cranbrook": _2, "creation": _2, "cultural": _2, "culturalcenter": _2, "culture": _2, "cyber": _2, "cymru": _2, "dali": _2, "dallas": _2, "database": _2, "ddr": _2, "decorativearts": _2, "delaware": _2, "delmenhorst": _2, "denmark": _2, "depot": _2, "design": _2, "detroit": _2, "dinosaur": _2, "discovery": _2, "dolls": _2, "donostia": _2, "durham": _2, "eastafrica": _2, "eastcoast": _2, "education": _2, "educational": _2, "egyptian": _2, "eisenbahn": _2, "elburg": _2, "elvendrell": _2, "embroidery": _2, "encyclopedic": _2, "england": _2, "entomology": _2, "environment": _2, "environmentalconservation": _2, "epilepsy": _2, "essex": _2, "estate": _2, "ethnology": _2, "exeter": _2, "exhibition": _2, "family": _2, "farm": _2, "farmequipment": _2, "farmers": _2, "farmstead": _2, "field": _2, "figueres": _2, "filatelia": _2, "film": _2, "fineart": _2, "finearts": _2, "finland": _2, "flanders": _2, "florida": _2, "force": _2, "fortmissoula": _2, "fortworth": _2, "foundation": _2, "francaise": _2, "frankfurt": _2, "franziskaner": _2, "freemasonry": _2, "freiburg": _2, "fribourg": _2, "frog": _2, "fundacio": _2, "furniture": _2, "gallery": _2, "garden": _2, "gateway": _2, "geelvinck": _2, "gemological": _2, "geology": _2, "georgia": _2, "giessen": _2, "glas": _2, "glass": _2, "gorge": _2, "grandrapids": _2, "graz": _2, "guernsey": _2, "halloffame": _2, "hamburg": _2, "handson": _2, "harvestcelebration": _2, "hawaii": _2, "health": _2, "heimatunduhren": _2, "hellas": _2, "helsinki": _2, "hembygdsforbund": _2, "heritage": _2, "histoire": _2, "historical": _2, "historicalsociety": _2, "historichouses": _2, "historisch": _2, "historisches": _2, "history": _2, "historyofscience": _2, "horology": _2, "house": _2, "humanities": _2, "illustration": _2, "imageandsound": _2, "indian": _2, "indiana": _2, "indianapolis": _2, "indianmarket": _2, "intelligence": _2, "interactive": _2, "iraq": _2, "iron": _2, "isleofman": _2, "jamison": _2, "jefferson": _2, "jerusalem": _2, "jewelry": _2, "jewish": _2, "jewishart": _2, "jfk": _2, "journalism": _2, "judaica": _2, "judygarland": _2, "juedisches": _2, "juif": _2, "karate": _2, "karikatur": _2, "kids": _2, "koebenhavn": _2, "koeln": _2, "kunst": _2, "kunstsammlung": _2, "kunstunddesign": _2, "labor": _2, "labour": _2, "lajolla": _2, "lancashire": _2, "landes": _2, "lans": _2, "xn--lns-qla": _2, "läns": _2, "larsson": _2, "lewismiller": _2, "lincoln": _2, "linz": _2, "living": _2, "livinghistory": _2, "localhistory": _2, "london": _2, "losangeles": _2, "louvre": _2, "loyalist": _2, "lucerne": _2, "luxembourg": _2, "luzern": _2, "mad": _2, "madrid": _2, "mallorca": _2, "manchester": _2, "mansion": _2, "mansions": _2, "manx": _2, "marburg": _2, "maritime": _2, "maritimo": _2, "maryland": _2, "marylhurst": _2, "media": _2, "medical": _2, "medizinhistorisches": _2, "meeres": _2, "memorial": _2, "mesaverde": _2, "michigan": _2, "midatlantic": _2, "military": _2, "mill": _2, "miners": _2, "mining": _2, "minnesota": _2, "missile": _2, "missoula": _2, "modern": _2, "moma": _2, "money": _2, "monmouth": _2, "monticello": _2, "montreal": _2, "moscow": _2, "motorcycle": _2, "muenchen": _2, "muenster": _2, "mulhouse": _2, "muncie": _2, "museet": _2, "museumcenter": _2, "museumvereniging": _2, "music": _2, "national": _2, "nationalfirearms": _2, "nationalheritage": _2, "nativeamerican": _2, "naturalhistory": _2, "naturalhistorymuseum": _2, "naturalsciences": _2, "nature": _2, "naturhistorisches": _2, "natuurwetenschappen": _2, "naumburg": _2, "naval": _2, "nebraska": _2, "neues": _2, "newhampshire": _2, "newjersey": _2, "newmexico": _2, "newport": _2, "newspaper": _2, "newyork": _2, "niepce": _2, "norfolk": _2, "north": _2, "nrw": _2, "nyc": _2, "nyny": _2, "oceanographic": _2, "oceanographique": _2, "omaha": _2, "online": _2, "ontario": _2, "openair": _2, "oregon": _2, "oregontrail": _2, "otago": _2, "oxford": _2, "pacific": _2, "paderborn": _2, "palace": _2, "paleo": _2, "palmsprings": _2, "panama": _2, "paris": _2, "pasadena": _2, "pharmacy": _2, "philadelphia": _2, "philadelphiaarea": _2, "philately": _2, "phoenix": _2, "photography": _2, "pilots": _2, "pittsburgh": _2, "planetarium": _2, "plantation": _2, "plants": _2, "plaza": _2, "portal": _2, "portland": _2, "portlligat": _2, "posts-and-telecommunications": _2, "preservation": _2, "presidio": _2, "press": _2, "project": _2, "public": _2, "pubol": _2, "quebec": _2, "railroad": _2, "railway": _2, "research": _2, "resistance": _2, "riodejaneiro": _2, "rochester": _2, "rockart": _2, "roma": _2, "russia": _2, "saintlouis": _2, "salem": _2, "salvadordali": _2, "salzburg": _2, "sandiego": _2, "sanfrancisco": _2, "santabarbara": _2, "santacruz": _2, "santafe": _2, "saskatchewan": _2, "satx": _2, "savannahga": _2, "schlesisches": _2, "schoenbrunn": _2, "schokoladen": _2, "school": _2, "schweiz": _2, "science": _2, "scienceandhistory": _2, "scienceandindustry": _2, "sciencecenter": _2, "sciencecenters": _2, "science-fiction": _2, "sciencehistory": _2, "sciences": _2, "sciencesnaturelles": _2, "scotland": _2, "seaport": _2, "settlement": _2, "settlers": _2, "shell": _2, "sherbrooke": _2, "sibenik": _2, "silk": _2, "ski": _2, "skole": _2, "society": _2, "sologne": _2, "soundandvision": _2, "southcarolina": _2, "southwest": _2, "space": _2, "spy": _2, "square": _2, "stadt": _2, "stalbans": _2, "starnberg": _2, "state": _2, "stateofdelaware": _2, "station": _2, "steam": _2, "steiermark": _2, "stjohn": _2, "stockholm": _2, "stpetersburg": _2, "stuttgart": _2, "suisse": _2, "surgeonshall": _2, "surrey": _2, "svizzera": _2, "sweden": _2, "sydney": _2, "tank": _2, "tcm": _2, "technology": _2, "telekommunikation": _2, "television": _2, "texas": _2, "textile": _2, "theater": _2, "time": _2, "timekeeping": _2, "topology": _2, "torino": _2, "touch": _2, "town": _2, "transport": _2, "tree": _2, "trolley": _2, "trust": _2, "trustee": _2, "uhren": _2, "ulm": _2, "undersea": _2, "university": _2, "usa": _2, "usantiques": _2, "usarts": _2, "uscountryestate": _2, "usculture": _2, "usdecorativearts": _2, "usgarden": _2, "ushistory": _2, "ushuaia": _2, "uslivinghistory": _2, "utah": _2, "uvic": _2, "valley": _2, "vantaa": _2, "versailles": _2, "viking": _2, "village": _2, "virginia": _2, "virtual": _2, "virtuel": _2, "vlaanderen": _2, "volkenkunde": _2, "wales": _2, "wallonie": _2, "war": _2, "washingtondc": _2, "watchandclock": _2, "watch-and-clock": _2, "western": _2, "westfalen": _2, "whaling": _2, "wildlife": _2, "williamsburg": _2, "windmill": _2, "workshop": _2, "york": _2, "yorkshire": _2, "yosemite": _2, "youth": _2, "zoological": _2, "zoology": _2, "xn--9dbhblg6di": _2, "ירושלים": _2, "xn--h1aegh": _2, "иком": _2 } }, "mv": { "$": 1, "succ": { "aero": _2, "biz": _2, "com": _2, "coop": _2, "edu": _2, "gov": _2, "info": _2, "int": _2, "mil": _2, "museum": _2, "name": _2, "net": _2, "org": _2, "pro": _2 } }, "mw": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "com": _2, "coop": _2, "edu": _2, "gov": _2, "int": _2, "museum": _2, "net": _2, "org": _2 } }, "mx": { "$": 1, "succ": { "com": _2, "org": _2, "gob": _2, "edu": _2, "net": _2, "blogspot": _4, "nym": _4 } }, "my": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "edu": _2, "mil": _2, "name": _2, "blogspot": _4 } }, "mz": { "$": 1, "succ": { "ac": _2, "adv": _2, "co": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 } }, "na": { "$": 1, "succ": { "info": _2, "pro": _2, "name": _2, "school": _2, "or": _2, "dr": _2, "us": _2, "mx": _2, "ca": _2, "in": _2, "cc": _2, "tv": _2, "ws": _2, "mobi": _2, "co": _2, "com": _2, "org": _2 } }, "name": { "$": 1, "succ": { "her": _27, "his": _27 } }, "nc": { "$": 1, "succ": { "asso": _2, "nom": _2 } }, "ne": _2, "net": { "$": 1, "succ": { "alwaysdata": _4, "cloudfront": _4, "t3l3p0rt": _4, "myfritz": _4, "blackbaudcdn": _4, "boomla": _4, "bplaced": _4, "square7": _4, "gb": _4, "hu": _4, "jp": _4, "se": _4, "uk": _4, "in": _4, "cloudaccess": _4, "cdn77-ssl": _4, "cdn77": { "$": 0, "succ": { "r": _4 } }, "cloudeity": _4, "feste-ip": _4, "knx-server": _4, "static-access": _4, "cryptonomic": _7, "dattolocal": _4, "mydatto": _4, "debian": _4, "at-band-camp": _4, "blogdns": _4, "broke-it": _4, "buyshouses": _4, "dnsalias": _4, "dnsdojo": _4, "does-it": _4, "dontexist": _4, "dynalias": _4, "dynathome": _4, "endofinternet": _4, "from-az": _4, "from-co": _4, "from-la": _4, "from-ny": _4, "gets-it": _4, "ham-radio-op": _4, "homeftp": _4, "homeip": _4, "homelinux": _4, "homeunix": _4, "in-the-band": _4, "is-a-chef": _4, "is-a-geek": _4, "isa-geek": _4, "kicks-ass": _4, "office-on-the": _4, "podzone": _4, "scrapper-site": _4, "selfip": _4, "sells-it": _4, "servebbs": _4, "serveftp": _4, "thruhere": _4, "webhop": _4, "definima": _4, "casacam": _4, "dynu": _4, "dynv6": _4, "twmail": _4, "ru": _4, "channelsdvr": _4, "fastlylb": { "$": 2, "succ": { "map": _4 } }, "fastly": { "$": 0, "succ": { "freetls": _4, "map": _4, "prod": { "$": 0, "succ": { "a": _4, "global": _4 } }, "ssl": { "$": 0, "succ": { "a": _4, "b": _4, "global": _4 } } } }, "flynnhosting": _4, "cloudfunctions": _4, "moonscale": _4, "in-dsl": _4, "in-vpn": _4, "ipifony": _4, "iobb": _4, "kinghost": _4, "uni5": _4, "barsy": _4, "memset": _4, "azurewebsites": _4, "azure-mobile": _4, "cloudapp": _4, "dnsup": _4, "hicam": _4, "now-dns": _4, "ownip": _4, "vpndns": _4, "eating-organic": _4, "mydissent": _4, "myeffect": _4, "mymediapc": _4, "mypsx": _4, "mysecuritycamera": _4, "nhlfan": _4, "no-ip": _4, "pgafan": _4, "privatizehealthinsurance": _4, "bounceme": _4, "ddns": _4, "redirectme": _4, "serveblog": _4, "serveminecraft": _4, "sytes": _4, "cloudycluster": _4, "rackmaze": _4, "schokokeks": _4, "firewall-gateway": _4, "siteleaf": _4, "srcf": { "$": 0, "succ": { "soc": _4, "user": _4 } }, "dsmynas": _4, "familyds": _4, "yandexcloud": { "$": 2, "succ": { "storage": _4, "website": _4 } }, "za": _4 } }, "nf": { "$": 1, "succ": { "com": _2, "net": _2, "per": _2, "rec": _2, "web": _2, "arts": _2, "firm": _2, "info": _2, "other": _2, "store": _2 } }, "ng": { "$": 1, "succ": { "com": _5, "edu": _2, "gov": _2, "i": _2, "mil": _2, "mobi": _2, "name": _2, "net": _2, "org": _2, "sch": _2, "col": _4, "firm": _4, "gen": _4, "ltd": _4 } }, "ni": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "com": _2, "edu": _2, "gob": _2, "in": _2, "info": _2, "int": _2, "mil": _2, "net": _2, "nom": _2, "org": _2, "web": _2 } }, "nl": { "$": 1, "succ": { "virtueeldomein": _4, "co": _4, "hosting-cluster": _4, "blogspot": _4, "khplay": _4, "transurl": _7, "cistron": _4, "demon": _4 } }, "no": { "$": 1, "succ": { "fhs": _2, "vgs": _2, "fylkesbibl": _2, "folkebibl": _2, "museum": _2, "idrett": _2, "priv": _2, "mil": _2, "stat": _2, "dep": _2, "kommune": _2, "herad": _2, "aa": _28, "ah": _28, "bu": _28, "fm": _28, "hl": _28, "hm": _28, "jan-mayen": _28, "mr": _28, "nl": _28, "nt": _28, "of": _28, "ol": _28, "oslo": _28, "rl": _28, "sf": _28, "st": _28, "svalbard": _28, "tm": _28, "tr": _28, "va": _28, "vf": _28, "akrehamn": _2, "xn--krehamn-dxa": _2, "åkrehamn": _2, "algard": _2, "xn--lgrd-poac": _2, "ålgård": _2, "arna": _2, "brumunddal": _2, "bryne": _2, "bronnoysund": _2, "xn--brnnysund-m8ac": _2, "brønnøysund": _2, "drobak": _2, "xn--drbak-wua": _2, "drøbak": _2, "egersund": _2, "fetsund": _2, "floro": _2, "xn--flor-jra": _2, "florø": _2, "fredrikstad": _2, "hokksund": _2, "honefoss": _2, "xn--hnefoss-q1a": _2, "hønefoss": _2, "jessheim": _2, "jorpeland": _2, "xn--jrpeland-54a": _2, "jørpeland": _2, "kirkenes": _2, "kopervik": _2, "krokstadelva": _2, "langevag": _2, "xn--langevg-jxa": _2, "langevåg": _2, "leirvik": _2, "mjondalen": _2, "xn--mjndalen-64a": _2, "mjøndalen": _2, "mo-i-rana": _2, "mosjoen": _2, "xn--mosjen-eya": _2, "mosjøen": _2, "nesoddtangen": _2, "orkanger": _2, "osoyro": _2, "xn--osyro-wua": _2, "osøyro": _2, "raholt": _2, "xn--rholt-mra": _2, "råholt": _2, "sandnessjoen": _2, "xn--sandnessjen-ogb": _2, "sandnessjøen": _2, "skedsmokorset": _2, "slattum": _2, "spjelkavik": _2, "stathelle": _2, "stavern": _2, "stjordalshalsen": _2, "xn--stjrdalshalsen-sqb": _2, "stjørdalshalsen": _2, "tananger": _2, "tranby": _2, "vossevangen": _2, "afjord": _2, "xn--fjord-lra": _2, "åfjord": _2, "agdenes": _2, "al": _2, "xn--l-1fa": _2, "ål": _2, "alesund": _2, "xn--lesund-hua": _2, "ålesund": _2, "alstahaug": _2, "alta": _2, "xn--lt-liac": _2, "áltá": _2, "alaheadju": _2, "xn--laheadju-7ya": _2, "álaheadju": _2, "alvdal": _2, "amli": _2, "xn--mli-tla": _2, "åmli": _2, "amot": _2, "xn--mot-tla": _2, "åmot": _2, "andebu": _2, "andoy": _2, "xn--andy-ira": _2, "andøy": _2, "andasuolo": _2, "ardal": _2, "xn--rdal-poa": _2, "årdal": _2, "aremark": _2, "arendal": _2, "xn--s-1fa": _2, "ås": _2, "aseral": _2, "xn--seral-lra": _2, "åseral": _2, "asker": _2, "askim": _2, "askvoll": _2, "askoy": _2, "xn--asky-ira": _2, "askøy": _2, "asnes": _2, "xn--snes-poa": _2, "åsnes": _2, "audnedaln": _2, "aukra": _2, "aure": _2, "aurland": _2, "aurskog-holand": _2, "xn--aurskog-hland-jnb": _2, "aurskog-høland": _2, "austevoll": _2, "austrheim": _2, "averoy": _2, "xn--avery-yua": _2, "averøy": _2, "balestrand": _2, "ballangen": _2, "balat": _2, "xn--blt-elab": _2, "bálát": _2, "balsfjord": _2, "bahccavuotna": _2, "xn--bhccavuotna-k7a": _2, "báhccavuotna": _2, "bamble": _2, "bardu": _2, "beardu": _2, "beiarn": _2, "bajddar": _2, "xn--bjddar-pta": _2, "bájddar": _2, "baidar": _2, "xn--bidr-5nac": _2, "báidár": _2, "berg": _2, "bergen": _2, "berlevag": _2, "xn--berlevg-jxa": _2, "berlevåg": _2, "bearalvahki": _2, "xn--bearalvhki-y4a": _2, "bearalváhki": _2, "bindal": _2, "birkenes": _2, "bjarkoy": _2, "xn--bjarky-fya": _2, "bjarkøy": _2, "bjerkreim": _2, "bjugn": _2, "bodo": _2, "xn--bod-2na": _2, "bodø": _2, "badaddja": _2, "xn--bdddj-mrabd": _2, "bådåddjå": _2, "budejju": _2, "bokn": _2, "bremanger": _2, "bronnoy": _2, "xn--brnny-wuac": _2, "brønnøy": _2, "bygland": _2, "bykle": _2, "barum": _2, "xn--brum-voa": _2, "bærum": _2, "telemark": { "$": 0, "succ": { "bo": _2, "xn--b-5ga": _2, "bø": _2 } }, "nordland": { "$": 0, "succ": { "bo": _2, "xn--b-5ga": _2, "bø": _2, "heroy": _2, "xn--hery-ira": _2, "herøy": _2 } }, "bievat": _2, "xn--bievt-0qa": _2, "bievát": _2, "bomlo": _2, "xn--bmlo-gra": _2, "bømlo": _2, "batsfjord": _2, "xn--btsfjord-9za": _2, "båtsfjord": _2, "bahcavuotna": _2, "xn--bhcavuotna-s4a": _2, "báhcavuotna": _2, "dovre": _2, "drammen": _2, "drangedal": _2, "dyroy": _2, "xn--dyry-ira": _2, "dyrøy": _2, "donna": _2, "xn--dnna-gra": _2, "dønna": _2, "eid": _2, "eidfjord": _2, "eidsberg": _2, "eidskog": _2, "eidsvoll": _2, "eigersund": _2, "elverum": _2, "enebakk": _2, "engerdal": _2, "etne": _2, "etnedal": _2, "evenes": _2, "evenassi": _2, "xn--eveni-0qa01ga": _2, "evenášši": _2, "evje-og-hornnes": _2, "farsund": _2, "fauske": _2, "fuossko": _2, "fuoisku": _2, "fedje": _2, "fet": _2, "finnoy": _2, "xn--finny-yua": _2, "finnøy": _2, "fitjar": _2, "fjaler": _2, "fjell": _2, "flakstad": _2, "flatanger": _2, "flekkefjord": _2, "flesberg": _2, "flora": _2, "fla": _2, "xn--fl-zia": _2, "flå": _2, "folldal": _2, "forsand": _2, "fosnes": _2, "frei": _2, "frogn": _2, "froland": _2, "frosta": _2, "frana": _2, "xn--frna-woa": _2, "fræna": _2, "froya": _2, "xn--frya-hra": _2, "frøya": _2, "fusa": _2, "fyresdal": _2, "forde": _2, "xn--frde-gra": _2, "førde": _2, "gamvik": _2, "gangaviika": _2, "xn--ggaviika-8ya47h": _2, "gáŋgaviika": _2, "gaular": _2, "gausdal": _2, "gildeskal": _2, "xn--gildeskl-g0a": _2, "gildeskål": _2, "giske": _2, "gjemnes": _2, "gjerdrum": _2, "gjerstad": _2, "gjesdal": _2, "gjovik": _2, "xn--gjvik-wua": _2, "gjøvik": _2, "gloppen": _2, "gol": _2, "gran": _2, "grane": _2, "granvin": _2, "gratangen": _2, "grimstad": _2, "grong": _2, "kraanghke": _2, "xn--kranghke-b0a": _2, "kråanghke": _2, "grue": _2, "gulen": _2, "hadsel": _2, "halden": _2, "halsa": _2, "hamar": _2, "hamaroy": _2, "habmer": _2, "xn--hbmer-xqa": _2, "hábmer": _2, "hapmir": _2, "xn--hpmir-xqa": _2, "hápmir": _2, "hammerfest": _2, "hammarfeasta": _2, "xn--hmmrfeasta-s4ac": _2, "hámmárfeasta": _2, "haram": _2, "hareid": _2, "harstad": _2, "hasvik": _2, "aknoluokta": _2, "xn--koluokta-7ya57h": _2, "ákŋoluokta": _2, "hattfjelldal": _2, "aarborte": _2, "haugesund": _2, "hemne": _2, "hemnes": _2, "hemsedal": _2, "more-og-romsdal": { "$": 0, "succ": { "heroy": _2, "sande": _2 } }, "xn--mre-og-romsdal-qqb": { "$": 0, "succ": { "xn--hery-ira": _2, "sande": _2 } }, "møre-og-romsdal": { "$": 0, "succ": { "herøy": _2, "sande": _2 } }, "hitra": _2, "hjartdal": _2, "hjelmeland": _2, "hobol": _2, "xn--hobl-ira": _2, "hobøl": _2, "hof": _2, "hol": _2, "hole": _2, "holmestrand": _2, "holtalen": _2, "xn--holtlen-hxa": _2, "holtålen": _2, "hornindal": _2, "horten": _2, "hurdal": _2, "hurum": _2, "hvaler": _2, "hyllestad": _2, "hagebostad": _2, "xn--hgebostad-g3a": _2, "hægebostad": _2, "hoyanger": _2, "xn--hyanger-q1a": _2, "høyanger": _2, "hoylandet": _2, "xn--hylandet-54a": _2, "høylandet": _2, "ha": _2, "xn--h-2fa": _2, "hå": _2, "ibestad": _2, "inderoy": _2, "xn--indery-fya": _2, "inderøy": _2, "iveland": _2, "jevnaker": _2, "jondal": _2, "jolster": _2, "xn--jlster-bya": _2, "jølster": _2, "karasjok": _2, "karasjohka": _2, "xn--krjohka-hwab49j": _2, "kárášjohka": _2, "karlsoy": _2, "galsa": _2, "xn--gls-elac": _2, "gálsá": _2, "karmoy": _2, "xn--karmy-yua": _2, "karmøy": _2, "kautokeino": _2, "guovdageaidnu": _2, "klepp": _2, "klabu": _2, "xn--klbu-woa": _2, "klæbu": _2, "kongsberg": _2, "kongsvinger": _2, "kragero": _2, "xn--krager-gya": _2, "kragerø": _2, "kristiansand": _2, "kristiansund": _2, "krodsherad": _2, "xn--krdsherad-m8a": _2, "krødsherad": _2, "kvalsund": _2, "rahkkeravju": _2, "xn--rhkkervju-01af": _2, "ráhkkerávju": _2, "kvam": _2, "kvinesdal": _2, "kvinnherad": _2, "kviteseid": _2, "kvitsoy": _2, "xn--kvitsy-fya": _2, "kvitsøy": _2, "kvafjord": _2, "xn--kvfjord-nxa": _2, "kvæfjord": _2, "giehtavuoatna": _2, "kvanangen": _2, "xn--kvnangen-k0a": _2, "kvænangen": _2, "navuotna": _2, "xn--nvuotna-hwa": _2, "návuotna": _2, "kafjord": _2, "xn--kfjord-iua": _2, "kåfjord": _2, "gaivuotna": _2, "xn--givuotna-8ya": _2, "gáivuotna": _2, "larvik": _2, "lavangen": _2, "lavagis": _2, "loabat": _2, "xn--loabt-0qa": _2, "loabát": _2, "lebesby": _2, "davvesiida": _2, "leikanger": _2, "leirfjord": _2, "leka": _2, "leksvik": _2, "lenvik": _2, "leangaviika": _2, "xn--leagaviika-52b": _2, "leaŋgaviika": _2, "lesja": _2, "levanger": _2, "lier": _2, "lierne": _2, "lillehammer": _2, "lillesand": _2, "lindesnes": _2, "lindas": _2, "xn--linds-pra": _2, "lindås": _2, "lom": _2, "loppa": _2, "lahppi": _2, "xn--lhppi-xqa": _2, "láhppi": _2, "lund": _2, "lunner": _2, "luroy": _2, "xn--lury-ira": _2, "lurøy": _2, "luster": _2, "lyngdal": _2, "lyngen": _2, "ivgu": _2, "lardal": _2, "lerdal": _2, "xn--lrdal-sra": _2, "lærdal": _2, "lodingen": _2, "xn--ldingen-q1a": _2, "lødingen": _2, "lorenskog": _2, "xn--lrenskog-54a": _2, "lørenskog": _2, "loten": _2, "xn--lten-gra": _2, "løten": _2, "malvik": _2, "masoy": _2, "xn--msy-ula0h": _2, "måsøy": _2, "muosat": _2, "xn--muost-0qa": _2, "muosát": _2, "mandal": _2, "marker": _2, "marnardal": _2, "masfjorden": _2, "meland": _2, "meldal": _2, "melhus": _2, "meloy": _2, "xn--mely-ira": _2, "meløy": _2, "meraker": _2, "xn--merker-kua": _2, "meråker": _2, "moareke": _2, "xn--moreke-jua": _2, "moåreke": _2, "midsund": _2, "midtre-gauldal": _2, "modalen": _2, "modum": _2, "molde": _2, "moskenes": _2, "moss": _2, "mosvik": _2, "malselv": _2, "xn--mlselv-iua": _2, "målselv": _2, "malatvuopmi": _2, "xn--mlatvuopmi-s4a": _2, "málatvuopmi": _2, "namdalseid": _2, "aejrie": _2, "namsos": _2, "namsskogan": _2, "naamesjevuemie": _2, "xn--nmesjevuemie-tcba": _2, "nååmesjevuemie": _2, "laakesvuemie": _2, "nannestad": _2, "narvik": _2, "narviika": _2, "naustdal": _2, "nedre-eiker": _2, "akershus": _29, "buskerud": _29, "nesna": _2, "nesodden": _2, "nesseby": _2, "unjarga": _2, "xn--unjrga-rta": _2, "unjárga": _2, "nesset": _2, "nissedal": _2, "nittedal": _2, "nord-aurdal": _2, "nord-fron": _2, "nord-odal": _2, "norddal": _2, "nordkapp": _2, "davvenjarga": _2, "xn--davvenjrga-y4a": _2, "davvenjárga": _2, "nordre-land": _2, "nordreisa": _2, "raisa": _2, "xn--risa-5na": _2, "ráisa": _2, "nore-og-uvdal": _2, "notodden": _2, "naroy": _2, "xn--nry-yla5g": _2, "nærøy": _2, "notteroy": _2, "xn--nttery-byae": _2, "nøtterøy": _2, "odda": _2, "oksnes": _2, "xn--ksnes-uua": _2, "øksnes": _2, "oppdal": _2, "oppegard": _2, "xn--oppegrd-ixa": _2, "oppegård": _2, "orkdal": _2, "orland": _2, "xn--rland-uua": _2, "ørland": _2, "orskog": _2, "xn--rskog-uua": _2, "ørskog": _2, "orsta": _2, "xn--rsta-fra": _2, "ørsta": _2, "hedmark": { "$": 0, "succ": { "os": _2, "valer": _2, "xn--vler-qoa": _2, "våler": _2 } }, "hordaland": { "$": 0, "succ": { "os": _2 } }, "osen": _2, "osteroy": _2, "xn--ostery-fya": _2, "osterøy": _2, "ostre-toten": _2, "xn--stre-toten-zcb": _2, "østre-toten": _2, "overhalla": _2, "ovre-eiker": _2, "xn--vre-eiker-k8a": _2, "øvre-eiker": _2, "oyer": _2, "xn--yer-zna": _2, "øyer": _2, "oygarden": _2, "xn--ygarden-p1a": _2, "øygarden": _2, "oystre-slidre": _2, "xn--ystre-slidre-ujb": _2, "øystre-slidre": _2, "porsanger": _2, "porsangu": _2, "xn--porsgu-sta26f": _2, "porsáŋgu": _2, "porsgrunn": _2, "radoy": _2, "xn--rady-ira": _2, "radøy": _2, "rakkestad": _2, "rana": _2, "ruovat": _2, "randaberg": _2, "rauma": _2, "rendalen": _2, "rennebu": _2, "rennesoy": _2, "xn--rennesy-v1a": _2, "rennesøy": _2, "rindal": _2, "ringebu": _2, "ringerike": _2, "ringsaker": _2, "rissa": _2, "risor": _2, "xn--risr-ira": _2, "risør": _2, "roan": _2, "rollag": _2, "rygge": _2, "ralingen": _2, "xn--rlingen-mxa": _2, "rælingen": _2, "rodoy": _2, "xn--rdy-0nab": _2, "rødøy": _2, "romskog": _2, "xn--rmskog-bya": _2, "rømskog": _2, "roros": _2, "xn--rros-gra": _2, "røros": _2, "rost": _2, "xn--rst-0na": _2, "røst": _2, "royken": _2, "xn--ryken-vua": _2, "røyken": _2, "royrvik": _2, "xn--ryrvik-bya": _2, "røyrvik": _2, "rade": _2, "xn--rde-ula": _2, "råde": _2, "salangen": _2, "siellak": _2, "saltdal": _2, "salat": _2, "xn--slt-elab": _2, "sálát": _2, "xn--slat-5na": _2, "sálat": _2, "samnanger": _2, "vestfold": { "$": 0, "succ": { "sande": _2 } }, "sandefjord": _2, "sandnes": _2, "sandoy": _2, "xn--sandy-yua": _2, "sandøy": _2, "sarpsborg": _2, "sauda": _2, "sauherad": _2, "sel": _2, "selbu": _2, "selje": _2, "seljord": _2, "sigdal": _2, "siljan": _2, "sirdal": _2, "skaun": _2, "skedsmo": _2, "ski": _2, "skien": _2, "skiptvet": _2, "skjervoy": _2, "xn--skjervy-v1a": _2, "skjervøy": _2, "skierva": _2, "xn--skierv-uta": _2, "skiervá": _2, "skjak": _2, "xn--skjk-soa": _2, "skjåk": _2, "skodje": _2, "skanland": _2, "xn--sknland-fxa": _2, "skånland": _2, "skanit": _2, "xn--sknit-yqa": _2, "skánit": _2, "smola": _2, "xn--smla-hra": _2, "smøla": _2, "snillfjord": _2, "snasa": _2, "xn--snsa-roa": _2, "snåsa": _2, "snoasa": _2, "snaase": _2, "xn--snase-nra": _2, "snåase": _2, "sogndal": _2, "sokndal": _2, "sola": _2, "solund": _2, "songdalen": _2, "sortland": _2, "spydeberg": _2, "stange": _2, "stavanger": _2, "steigen": _2, "steinkjer": _2, "stjordal": _2, "xn--stjrdal-s1a": _2, "stjørdal": _2, "stokke": _2, "stor-elvdal": _2, "stord": _2, "stordal": _2, "storfjord": _2, "omasvuotna": _2, "strand": _2, "stranda": _2, "stryn": _2, "sula": _2, "suldal": _2, "sund": _2, "sunndal": _2, "surnadal": _2, "sveio": _2, "svelvik": _2, "sykkylven": _2, "sogne": _2, "xn--sgne-gra": _2, "søgne": _2, "somna": _2, "xn--smna-gra": _2, "sømna": _2, "sondre-land": _2, "xn--sndre-land-0cb": _2, "søndre-land": _2, "sor-aurdal": _2, "xn--sr-aurdal-l8a": _2, "sør-aurdal": _2, "sor-fron": _2, "xn--sr-fron-q1a": _2, "sør-fron": _2, "sor-odal": _2, "xn--sr-odal-q1a": _2, "sør-odal": _2, "sor-varanger": _2, "xn--sr-varanger-ggb": _2, "sør-varanger": _2, "matta-varjjat": _2, "xn--mtta-vrjjat-k7af": _2, "mátta-várjjat": _2, "sorfold": _2, "xn--srfold-bya": _2, "sørfold": _2, "sorreisa": _2, "xn--srreisa-q1a": _2, "sørreisa": _2, "sorum": _2, "xn--srum-gra": _2, "sørum": _2, "tana": _2, "deatnu": _2, "time": _2, "tingvoll": _2, "tinn": _2, "tjeldsund": _2, "dielddanuorri": _2, "tjome": _2, "xn--tjme-hra": _2, "tjøme": _2, "tokke": _2, "tolga": _2, "torsken": _2, "tranoy": _2, "xn--trany-yua": _2, "tranøy": _2, "tromso": _2, "xn--troms-zua": _2, "tromsø": _2, "tromsa": _2, "romsa": _2, "trondheim": _2, "troandin": _2, "trysil": _2, "trana": _2, "xn--trna-woa": _2, "træna": _2, "trogstad": _2, "xn--trgstad-r1a": _2, "trøgstad": _2, "tvedestrand": _2, "tydal": _2, "tynset": _2, "tysfjord": _2, "divtasvuodna": _2, "divttasvuotna": _2, "tysnes": _2, "tysvar": _2, "xn--tysvr-vra": _2, "tysvær": _2, "tonsberg": _2, "xn--tnsberg-q1a": _2, "tønsberg": _2, "ullensaker": _2, "ullensvang": _2, "ulvik": _2, "utsira": _2, "vadso": _2, "xn--vads-jra": _2, "vadsø": _2, "cahcesuolo": _2, "xn--hcesuolo-7ya35b": _2, "čáhcesuolo": _2, "vaksdal": _2, "valle": _2, "vang": _2, "vanylven": _2, "vardo": _2, "xn--vard-jra": _2, "vardø": _2, "varggat": _2, "xn--vrggt-xqad": _2, "várggát": _2, "vefsn": _2, "vaapste": _2, "vega": _2, "vegarshei": _2, "xn--vegrshei-c0a": _2, "vegårshei": _2, "vennesla": _2, "verdal": _2, "verran": _2, "vestby": _2, "vestnes": _2, "vestre-slidre": _2, "vestre-toten": _2, "vestvagoy": _2, "xn--vestvgy-ixa6o": _2, "vestvågøy": _2, "vevelstad": _2, "vik": _2, "vikna": _2, "vindafjord": _2, "volda": _2, "voss": _2, "varoy": _2, "xn--vry-yla5g": _2, "værøy": _2, "vagan": _2, "xn--vgan-qoa": _2, "vågan": _2, "voagat": _2, "vagsoy": _2, "xn--vgsy-qoa0j": _2, "vågsøy": _2, "vaga": _2, "xn--vg-yiab": _2, "vågå": _2, "ostfold": { "$": 0, "succ": { "valer": _2 } }, "xn--stfold-9xa": { "$": 0, "succ": { "xn--vler-qoa": _2 } }, "østfold": { "$": 0, "succ": { "våler": _2 } }, "co": _4, "blogspot": _4 } }, "np": _8, "nr": _23, "nu": { "$": 1, "succ": { "merseine": _4, "mine": _4, "shacknet": _4, "nom": _4, "builder": { "$": 0, "succ": { "site": _4 } }, "enterprisecloud": _4 } }, "nz": { "$": 1, "succ": { "ac": _2, "co": _5, "cri": _2, "geek": _2, "gen": _2, "govt": _2, "health": _2, "iwi": _2, "kiwi": _2, "maori": _2, "mil": _2, "xn--mori-qsa": _2, "māori": _2, "net": _2, "org": _2, "parliament": _2, "school": _2, "nym": _4 } }, "om": { "$": 1, "succ": { "co": _2, "com": _2, "edu": _2, "gov": _2, "med": _2, "museum": _2, "net": _2, "org": _2, "pro": _2 } }, "onion": _2, "org": { "$": 1, "succ": { "altervista": _4, "amune": { "$": 0, "succ": { "tele": _4 } }, "pimienta": _4, "poivron": _4, "potager": _4, "sweetpepper": _4, "ae": _4, "us": _4, "certmgr": _4, "cdn77": { "$": 0, "succ": { "c": _4, "rsc": _4 } }, "cdn77-secure": { "$": 0, "succ": { "origin": { "$": 0, "succ": { "ssl": _4 } } } }, "cloudns": _4, "duckdns": _4, "tunk": _4, "dyndns": { "$": 2, "succ": { "go": _4, "home": _4 } }, "blogdns": _4, "blogsite": _4, "boldlygoingnowhere": _4, "dnsalias": _4, "dnsdojo": _4, "doesntexist": _4, "dontexist": _4, "doomdns": _4, "dvrdns": _4, "dynalias": _4, "endofinternet": _4, "endoftheinternet": _4, "from-me": _4, "game-host": _4, "gotdns": _4, "hobby-site": _4, "homedns": _4, "homeftp": _4, "homelinux": _4, "homeunix": _4, "is-a-bruinsfan": _4, "is-a-candidate": _4, "is-a-celticsfan": _4, "is-a-chef": _4, "is-a-geek": _4, "is-a-knight": _4, "is-a-linux-user": _4, "is-a-patsfan": _4, "is-a-soxfan": _4, "is-found": _4, "is-lost": _4, "is-saved": _4, "is-very-bad": _4, "is-very-evil": _4, "is-very-good": _4, "is-very-nice": _4, "is-very-sweet": _4, "isa-geek": _4, "kicks-ass": _4, "misconfused": _4, "podzone": _4, "readmyblog": _4, "selfip": _4, "sellsyourhome": _4, "servebbs": _4, "serveftp": _4, "servegame": _4, "stuff-4-sale": _4, "webhop": _4, "ddnss": _4, "accesscam": _4, "camdvr": _4, "freeddns": _4, "mywire": _4, "webredirect": _4, "eu": { "$": 2, "succ": { "al": _4, "asso": _4, "at": _4, "au": _4, "be": _4, "bg": _4, "ca": _4, "cd": _4, "ch": _4, "cn": _4, "cy": _4, "cz": _4, "de": _4, "dk": _4, "edu": _4, "ee": _4, "es": _4, "fi": _4, "fr": _4, "gr": _4, "hr": _4, "hu": _4, "ie": _4, "il": _4, "in": _4, "int": _4, "is": _4, "it": _4, "jp": _4, "kr": _4, "lt": _4, "lu": _4, "lv": _4, "mc": _4, "me": _4, "mk": _4, "mt": _4, "my": _4, "net": _4, "ng": _4, "nl": _4, "no": _4, "nz": _4, "paris": _4, "pl": _4, "pt": _4, "q-a": _4, "ro": _4, "ru": _4, "se": _4, "si": _4, "sk": _4, "tr": _4, "uk": _4, "us": _4 } }, "twmail": _4, "fedorainfracloud": _4, "fedorapeople": _4, "fedoraproject": { "$": 0, "succ": { "cloud": _4, "os": _16, "stg": { "$": 0, "succ": { "os": _16 } } } }, "freedesktop": _4, "hepforge": _4, "in-dsl": _4, "in-vpn": _4, "js": _4, "uklugs": _4, "barsy": _4, "mayfirst": _4, "mozilla-iot": _4, "bmoattachments": _4, "dynserv": _4, "now-dns": _4, "cable-modem": _4, "collegefan": _4, "couchpotatofries": _4, "mlbfan": _4, "mysecuritycamera": _4, "nflfan": _4, "read-books": _4, "ufcfan": _4, "hopto": _4, "myftp": _4, "no-ip": _4, "zapto": _4, "pubtls": _4, "my-firewall": _4, "myfirewall": _4, "spdns": _4, "dsmynas": _4, "familyds": _4, "edugit": _4, "tuxfamily": _4, "diskstation": _4, "hk": _4, "wmflabs": _4, "za": _4 } }, "pa": { "$": 1, "succ": { "ac": _2, "gob": _2, "com": _2, "org": _2, "sld": _2, "edu": _2, "net": _2, "ing": _2, "abo": _2, "med": _2, "nom": _2 } }, "pe": { "$": 1, "succ": { "edu": _2, "gob": _2, "nom": _2, "mil": _2, "org": _2, "com": _2, "net": _2, "blogspot": _4, "nym": _4 } }, "pf": { "$": 1, "succ": { "com": _2, "org": _2, "edu": _2 } }, "pg": _8, "ph": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "edu": _2, "ngo": _2, "mil": _2, "i": _2 } }, "pk": { "$": 1, "succ": { "com": _2, "net": _2, "edu": _2, "org": _2, "fam": _2, "biz": _2, "web": _2, "gov": _2, "gob": _2, "gok": _2, "gon": _2, "gop": _2, "gos": _2, "info": _2 } }, "pl": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "aid": _2, "agro": _2, "atm": _2, "auto": _2, "biz": _2, "edu": _2, "gmina": _2, "gsm": _2, "info": _2, "mail": _2, "miasta": _2, "media": _2, "mil": _2, "nieruchomosci": _2, "nom": _2, "pc": _2, "powiat": _2, "priv": _2, "realestate": _2, "rel": _2, "sex": _2, "shop": _2, "sklep": _2, "sos": _2, "szkola": _2, "targi": _2, "tm": _2, "tourism": _2, "travel": _2, "turystyka": _2, "gov": { "$": 1, "succ": { "ap": _2, "ic": _2, "is": _2, "us": _2, "kmpsp": _2, "kppsp": _2, "kwpsp": _2, "psp": _2, "wskr": _2, "kwp": _2, "mw": _2, "ug": _2, "um": _2, "umig": _2, "ugim": _2, "upow": _2, "uw": _2, "starostwo": _2, "pa": _2, "po": _2, "psse": _2, "pup": _2, "rzgw": _2, "sa": _2, "so": _2, "sr": _2, "wsa": _2, "sko": _2, "uzs": _2, "wiih": _2, "winb": _2, "pinb": _2, "wios": _2, "witd": _2, "wzmiuw": _2, "piw": _2, "wiw": _2, "griw": _2, "wif": _2, "oum": _2, "sdn": _2, "zp": _2, "uppo": _2, "mup": _2, "wuoz": _2, "konsulat": _2, "oirm": _2 } }, "augustow": _2, "babia-gora": _2, "bedzin": _2, "beskidy": _2, "bialowieza": _2, "bialystok": _2, "bielawa": _2, "bieszczady": _2, "boleslawiec": _2, "bydgoszcz": _2, "bytom": _2, "cieszyn": _2, "czeladz": _2, "czest": _2, "dlugoleka": _2, "elblag": _2, "elk": _2, "glogow": _2, "gniezno": _2, "gorlice": _2, "grajewo": _2, "ilawa": _2, "jaworzno": _2, "jelenia-gora": _2, "jgora": _2, "kalisz": _2, "kazimierz-dolny": _2, "karpacz": _2, "kartuzy": _2, "kaszuby": _2, "katowice": _2, "kepno": _2, "ketrzyn": _2, "klodzko": _2, "kobierzyce": _2, "kolobrzeg": _2, "konin": _2, "konskowola": _2, "kutno": _2, "lapy": _2, "lebork": _2, "legnica": _2, "lezajsk": _2, "limanowa": _2, "lomza": _2, "lowicz": _2, "lubin": _2, "lukow": _2, "malbork": _2, "malopolska": _2, "mazowsze": _2, "mazury": _2, "mielec": _2, "mielno": _2, "mragowo": _2, "naklo": _2, "nowaruda": _2, "nysa": _2, "olawa": _2, "olecko": _2, "olkusz": _2, "olsztyn": _2, "opoczno": _2, "opole": _2, "ostroda": _2, "ostroleka": _2, "ostrowiec": _2, "ostrowwlkp": _2, "pila": _2, "pisz": _2, "podhale": _2, "podlasie": _2, "polkowice": _2, "pomorze": _2, "pomorskie": _2, "prochowice": _2, "pruszkow": _2, "przeworsk": _2, "pulawy": _2, "radom": _2, "rawa-maz": _2, "rybnik": _2, "rzeszow": _2, "sanok": _2, "sejny": _2, "slask": _2, "slupsk": _2, "sosnowiec": _2, "stalowa-wola": _2, "skoczow": _2, "starachowice": _2, "stargard": _2, "suwalki": _2, "swidnica": _2, "swiebodzin": _2, "swinoujscie": _2, "szczecin": _2, "szczytno": _2, "tarnobrzeg": _2, "tgory": _2, "turek": _2, "tychy": _2, "ustka": _2, "walbrzych": _2, "warmia": _2, "warszawa": _2, "waw": _2, "wegrow": _2, "wielun": _2, "wlocl": _2, "wloclawek": _2, "wodzislaw": _2, "wolomin": _2, "wroclaw": _2, "zachpomor": _2, "zagan": _2, "zarow": _2, "zgora": _2, "zgorzelec": _2, "beep": _4, "krasnik": _4, "leczna": _4, "lubartow": _4, "lublin": _4, "poniatowa": _4, "swidnik": _4, "co": _4, "art": _4, "gliwice": _4, "krakow": _4, "poznan": _4, "wroc": _4, "zakopane": _4, "gda": _4, "gdansk": _4, "gdynia": _4, "med": _4, "sopot": _4 } }, "pm": { "$": 1, "succ": { "own": _4 } }, "pn": { "$": 1, "succ": { "gov": _2, "co": _2, "org": _2, "edu": _2, "net": _2 } }, "post": _2, "pr": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "edu": _2, "isla": _2, "pro": _2, "biz": _2, "info": _2, "name": _2, "est": _2, "prof": _2, "ac": _2 } }, "pro": { "$": 1, "succ": { "aaa": _2, "aca": _2, "acct": _2, "avocat": _2, "bar": _2, "cpa": _2, "eng": _2, "jur": _2, "law": _2, "med": _2, "recht": _2, "cloudns": _4, "dnstrace": { "$": 0, "succ": { "bci": _4 } }, "barsy": _4 } }, "ps": { "$": 1, "succ": { "edu": _2, "gov": _2, "sec": _2, "plo": _2, "com": _2, "org": _2, "net": _2 } }, "pt": { "$": 1, "succ": { "net": _2, "gov": _2, "org": _2, "edu": _2, "int": _2, "publ": _2, "com": _2, "nome": _2, "blogspot": _4, "nym": _4 } }, "pw": { "$": 1, "succ": { "co": _2, "ne": _2, "or": _2, "ed": _2, "go": _2, "belau": _2, "cloudns": _4, "x443": _4, "nom": _4 } }, "py": { "$": 1, "succ": { "com": _2, "coop": _2, "edu": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 } }, "qa": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "mil": _2, "name": _2, "net": _2, "org": _2, "sch": _2, "blogspot": _4, "nom": _4 } }, "re": { "$": 1, "succ": { "asso": _2, "com": _2, "nom": _2, "blogspot": _4 } }, "ro": { "$": 1, "succ": { "arts": _2, "com": _2, "firm": _2, "info": _2, "nom": _2, "nt": _2, "org": _2, "rec": _2, "store": _2, "tm": _2, "www": _2, "shop": _4, "blogspot": _4, "nym": _4 } }, "rs": { "$": 1, "succ": { "ac": _2, "co": _2, "edu": _2, "gov": _2, "in": _2, "org": _2, "blogspot": _4, "ua": _4, "nom": _4, "ox": _4 } }, "ru": { "$": 1, "succ": { "ac": _2, "edu": _2, "gov": _2, "int": _2, "mil": _2, "test": _2, "adygeya": _4, "bashkiria": _4, "bir": _4, "cbg": _4, "com": _4, "dagestan": _4, "grozny": _4, "kalmykia": _4, "kustanai": _4, "marine": _4, "mordovia": _4, "msk": _4, "mytis": _4, "nalchik": _4, "nov": _4, "pyatigorsk": _4, "spb": _4, "vladikavkaz": _4, "vladimir": _4, "blogspot": _4, "myjino": { "$": 2, "succ": { "hosting": _7, "landing": _7, "spectrum": _7, "vps": _7 } }, "cldmail": { "$": 0, "succ": { "hb": _4 } }, "net": _4, "org": _4, "pp": _4, "ras": _4 } }, "rw": { "$": 1, "succ": { "ac": _2, "co": _2, "coop": _2, "gov": _2, "mil": _2, "net": _2, "org": _2 } }, "sa": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "med": _2, "pub": _2, "edu": _2, "sch": _2 } }, "sb": _9, "sc": _9, "sd": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "edu": _2, "med": _2, "tv": _2, "gov": _2, "info": _2 } }, "se": { "$": 1, "succ": { "a": _2, "ac": _2, "b": _2, "bd": _2, "brand": _2, "c": _2, "d": _2, "e": _2, "f": _2, "fh": _2, "fhsk": _2, "fhv": _2, "g": _2, "h": _2, "i": _2, "k": _2, "komforb": _2, "kommunalforbund": _2, "komvux": _2, "l": _2, "lanbib": _2, "m": _2, "n": _2, "naturbruksgymn": _2, "o": _2, "org": _2, "p": _2, "parti": _2, "pp": _2, "press": _2, "r": _2, "s": _2, "t": _2, "tm": _2, "u": _2, "w": _2, "x": _2, "y": _2, "z": _2, "com": _4, "blogspot": _4, "conf": _4 } }, "sg": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "edu": _2, "per": _2, "blogspot": _4 } }, "sh": { "$": 1, "succ": { "com": _2, "net": _2, "gov": _2, "org": _2, "mil": _2, "hashbang": _4, "platform": _7, "wedeploy": _4, "now": _4 } }, "si": { "$": 1, "succ": { "blogspot": _4, "nom": _4 } }, "sj": _2, "sk": _24, "sl": _9, "sm": _2, "sn": { "$": 1, "succ": { "art": _2, "com": _2, "edu": _2, "gouv": _2, "org": _2, "perso": _2, "univ": _2, "blogspot": _4 } }, "so": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "me": _2, "net": _2, "org": _2, "sch": _4 } }, "sr": _2, "ss": { "$": 1, "succ": { "biz": _2, "com": _2, "edu": _2, "gov": _2, "net": _2, "org": _2 } }, "st": { "$": 1, "succ": { "co": _2, "com": _2, "consulado": _2, "edu": _2, "embaixada": _2, "gov": _2, "mil": _2, "net": _2, "org": _2, "principe": _2, "saotome": _2, "store": _2, "nom": _4, "noho": _4 } }, "su": { "$": 1, "succ": { "abkhazia": _4, "adygeya": _4, "aktyubinsk": _4, "arkhangelsk": _4, "armenia": _4, "ashgabad": _4, "azerbaijan": _4, "balashov": _4, "bashkiria": _4, "bryansk": _4, "bukhara": _4, "chimkent": _4, "dagestan": _4, "east-kazakhstan": _4, "exnet": _4, "georgia": _4, "grozny": _4, "ivanovo": _4, "jambyl": _4, "kalmykia": _4, "kaluga": _4, "karacol": _4, "karaganda": _4, "karelia": _4, "khakassia": _4, "krasnodar": _4, "kurgan": _4, "kustanai": _4, "lenug": _4, "mangyshlak": _4, "mordovia": _4, "msk": _4, "murmansk": _4, "nalchik": _4, "navoi": _4, "north-kazakhstan": _4, "nov": _4, "obninsk": _4, "penza": _4, "pokrovsk": _4, "sochi": _4, "spb": _4, "tashkent": _4, "termez": _4, "togliatti": _4, "troitsk": _4, "tselinograd": _4, "tula": _4, "tuva": _4, "vladikavkaz": _4, "vladimir": _4, "vologda": _4, "nym": _4 } }, "sv": { "$": 1, "succ": { "com": _2, "edu": _2, "gob": _2, "org": _2, "red": _2 } }, "sx": { "$": 1, "succ": { "gov": _2, "nym": _4 } }, "sy": _3, "sz": { "$": 1, "succ": { "co": _2, "ac": _2, "org": _2 } }, "tc": _2, "td": _5, "tel": _2, "tf": _2, "tg": _2, "th": { "$": 1, "succ": { "ac": _2, "co": _2, "go": _2, "in": _2, "mi": _2, "net": _2, "or": _2, "online": _4, "shop": _4 } }, "tj": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "com": _2, "edu": _2, "go": _2, "gov": _2, "int": _2, "mil": _2, "name": _2, "net": _2, "nic": _2, "org": _2, "test": _2, "web": _2, "nom": _4 } }, "tk": _2, "tl": _6, "tm": { "$": 1, "succ": { "com": _2, "co": _2, "org": _2, "net": _2, "nom": _2, "gov": _2, "mil": _2, "edu": _2 } }, "tn": { "$": 1, "succ": { "com": _2, "ens": _2, "fin": _2, "gov": _2, "ind": _2, "intl": _2, "nat": _2, "net": _2, "org": _2, "info": _2, "perso": _2, "tourism": _2, "edunet": _2, "rnrt": _2, "rns": _2, "rnu": _2, "mincom": _2, "agrinet": _2, "defense": _2, "turen": _2 } }, "to": { "$": 1, "succ": { "com": _2, "gov": _2, "net": _2, "org": _2, "edu": _2, "mil": _2, "vpnplus": _4, "quickconnect": { "$": 0, "succ": { "direct": _4 } } } }, "tr": { "$": 1, "succ": { "av": _2, "bbs": _2, "bel": _2, "biz": _2, "com": _5, "dr": _2, "edu": _2, "gen": _2, "gov": _2, "info": _2, "mil": _2, "k12": _2, "kep": _2, "name": _2, "net": _2, "org": _2, "pol": _2, "tel": _2, "tsk": _2, "tv": _2, "web": _2, "nc": _6 } }, "tt": { "$": 1, "succ": { "co": _2, "com": _2, "org": _2, "net": _2, "biz": _2, "info": _2, "pro": _2, "int": _2, "coop": _2, "jobs": _2, "mobi": _2, "travel": _2, "museum": _2, "aero": _2, "name": _2, "gov": _2, "edu": _2 } }, "tv": { "$": 1, "succ": { "dyndns": _4, "better-than": _4, "on-the-web": _4, "worse-than": _4 } }, "tw": { "$": 1, "succ": { "edu": _2, "gov": _2, "mil": _2, "com": { "$": 1, "succ": { "mymailer": _4 } }, "net": _2, "org": _2, "idv": _2, "game": _2, "ebiz": _2, "club": _2, "xn--zf0ao64a": _2, "網路": _2, "xn--uc0atv": _2, "組織": _2, "xn--czrw28b": _2, "商業": _2, "url": _4, "blogspot": _4, "nym": _4 } }, "tz": { "$": 1, "succ": { "ac": _2, "co": _2, "go": _2, "hotel": _2, "info": _2, "me": _2, "mil": _2, "mobi": _2, "ne": _2, "or": _2, "sc": _2, "tv": _2 } }, "ua": { "$": 1, "succ": { "com": _2, "edu": _2, "gov": _2, "in": _2, "net": _2, "org": _2, "cherkassy": _2, "cherkasy": _2, "chernigov": _2, "chernihiv": _2, "chernivtsi": _2, "chernovtsy": _2, "ck": _2, "cn": _2, "cr": _2, "crimea": _2, "cv": _2, "dn": _2, "dnepropetrovsk": _2, "dnipropetrovsk": _2, "dominic": _2, "donetsk": _2, "dp": _2, "if": _2, "ivano-frankivsk": _2, "kh": _2, "kharkiv": _2, "kharkov": _2, "kherson": _2, "khmelnitskiy": _2, "khmelnytskyi": _2, "kiev": _2, "kirovograd": _2, "km": _2, "kr": _2, "krym": _2, "ks": _2, "kv": _2, "kyiv": _2, "lg": _2, "lt": _2, "lugansk": _2, "lutsk": _2, "lv": _2, "lviv": _2, "mk": _2, "mykolaiv": _2, "nikolaev": _2, "od": _2, "odesa": _2, "odessa": _2, "pl": _2, "poltava": _2, "rivne": _2, "rovno": _2, "rv": _2, "sb": _2, "sebastopol": _2, "sevastopol": _2, "sm": _2, "sumy": _2, "te": _2, "ternopil": _2, "uz": _2, "uzhgorod": _2, "vinnica": _2, "vinnytsia": _2, "vn": _2, "volyn": _2, "yalta": _2, "zaporizhzhe": _2, "zaporizhzhia": _2, "zhitomir": _2, "zhytomyr": _2, "zp": _2, "zt": _2, "cc": _4, "inf": _4, "ltd": _4, "biz": _4, "co": _4, "pp": _4 } }, "ug": { "$": 1, "succ": { "co": _2, "or": _2, "ac": _2, "sc": _2, "go": _2, "ne": _2, "com": _2, "org": _2, "blogspot": _4, "nom": _4 } }, "uk": { "$": 1, "succ": { "ac": _2, "co": { "$": 1, "succ": { "bytemark": { "$": 0, "succ": { "dh": _4, "vm": _4 } }, "blogspot": _4, "barsy": _4, "barsyonline": _4, "nh-serv": _4, "no-ip": _4, "wellbeingzone": _4, "gwiddle": _4 } }, "gov": { "$": 1, "succ": { "service": _4, "homeoffice": _4 } }, "ltd": _2, "me": _2, "net": _2, "nhs": _2, "org": { "$": 1, "succ": { "glug": _4, "lug": _4, "lugs": _4 } }, "plc": _2, "police": _2, "sch": _8, "barsy": _4 } }, "us": { "$": 1, "succ": { "dni": _2, "fed": _2, "isa": _2, "kids": _2, "nsn": _2, "ak": _30, "al": _30, "ar": _30, "as": _30, "az": _30, "ca": _30, "co": _30, "ct": _30, "dc": _30, "de": { "$": 1, "succ": { "k12": _2, "cc": _2, "lib": _4 } }, "fl": _30, "ga": _30, "gu": _30, "hi": _31, "ia": _30, "id": _30, "il": _30, "in": _30, "ks": _30, "ky": _30, "la": _30, "ma": { "$": 1, "succ": { "k12": { "$": 1, "succ": { "pvt": _2, "chtr": _2, "paroch": _2 } }, "cc": _2, "lib": _2 } }, "md": _30, "me": _30, "mi": { "$": 1, "succ": { "k12": _2, "cc": _2, "lib": _2, "ann-arbor": _2, "cog": _2, "dst": _2, "eaton": _2, "gen": _2, "mus": _2, "tec": _2, "washtenaw": _2 } }, "mn": _30, "mo": _30, "ms": _30, "mt": _30, "nc": _30, "nd": _31, "ne": _30, "nh": _30, "nj": _30, "nm": _30, "nv": _30, "ny": _30, "oh": _30, "ok": _30, "or": _30, "pa": _30, "pr": _30, "ri": _30, "sc": _30, "sd": _31, "tn": _30, "tx": _30, "ut": _30, "vi": _30, "vt": _30, "va": _30, "wa": _30, "wi": _30, "wv": { "$": 1, "succ": { "cc": _2 } }, "wy": _30, "cloudns": _4, "drud": _4, "is-by": _4, "land-4-sale": _4, "stuff-4-sale": _4, "freeddns": _4, "golffan": _4, "noip": _4, "pointto": _4 } }, "uy": { "$": 1, "succ": { "com": _5, "edu": _2, "gub": _2, "mil": _2, "net": _2, "org": _2, "nom": _4 } }, "uz": { "$": 1, "succ": { "co": _2, "com": _2, "net": _2, "org": _2 } }, "va": _2, "vc": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "mil": _2, "edu": _2, "gv": { "$": 2, "succ": { "d": _4 } }, "nom": _4 } }, "ve": { "$": 1, "succ": { "arts": _2, "co": _2, "com": _2, "e12": _2, "edu": _2, "firm": _2, "gob": _2, "gov": _2, "info": _2, "int": _2, "mil": _2, "net": _2, "org": _2, "rec": _2, "store": _2, "tec": _2, "web": _2 } }, "vg": _20, "vi": { "$": 1, "succ": { "co": _2, "com": _2, "k12": _2, "net": _2, "org": _2 } }, "vn": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "edu": _2, "gov": _2, "int": _2, "ac": _2, "biz": _2, "info": _2, "name": _2, "pro": _2, "health": _2, "blogspot": _4 } }, "vu": _17, "wf": _2, "ws": { "$": 1, "succ": { "com": _2, "net": _2, "org": _2, "gov": _2, "edu": _2, "advisor": _7, "cloud66": _4, "dyndns": _4, "mypets": _4 } }, "yt": _2, "xn--mgbaam7a8h": _2, "امارات": _2, "xn--y9a3aq": _2, "հայ": _2, "xn--54b7fta0cc": _2, "বাংলা": _2, "xn--90ae": _2, "бг": _2, "xn--90ais": _2, "бел": _2, "xn--fiqs8s": _2, "中国": _2, "xn--fiqz9s": _2, "中國": _2, "xn--lgbbat1ad8j": _2, "الجزائر": _2, "xn--wgbh1c": _2, "مصر": _2, "xn--e1a4c": _2, "ею": _2, "xn--mgbah1a3hjkrd": _2, "موريتانيا": _2, "xn--node": _2, "გე": _2, "xn--qxam": _2, "ελ": _2, "xn--j6w193g": { "$": 1, "succ": { "xn--55qx5d": _2, "xn--wcvs22d": _2, "xn--mxtq1m": _2, "xn--gmqw5a": _2, "xn--od0alg": _2, "xn--uc0atv": _2 } }, "香港": { "$": 1, "succ": { "公司": _2, "教育": _2, "政府": _2, "個人": _2, "網絡": _2, "組織": _2 } }, "xn--2scrj9c": _2, "ಭಾರತ": _2, "xn--3hcrj9c": _2, "ଭାରତ": _2, "xn--45br5cyl": _2, "ভাৰত": _2, "xn--h2breg3eve": _2, "भारतम्": _2, "xn--h2brj9c8c": _2, "भारोत": _2, "xn--mgbgu82a": _2, "ڀارت": _2, "xn--rvc1e0am3e": _2, "ഭാരതം": _2, "xn--h2brj9c": _2, "भारत": _2, "xn--mgbbh1a": _2, "بارت": _2, "xn--mgbbh1a71e": _2, "بھارت": _2, "xn--fpcrj9c3d": _2, "భారత్": _2, "xn--gecrj9c": _2, "ભારત": _2, "xn--s9brj9c": _2, "ਭਾਰਤ": _2, "xn--45brj9c": _2, "ভারত": _2, "xn--xkc2dl3a5ee0h": _2, "இந்தியா": _2, "xn--mgba3a4f16a": _2, "ایران": _2, "xn--mgba3a4fra": _2, "ايران": _2, "xn--mgbtx2b": _2, "عراق": _2, "xn--mgbayh7gpa": _2, "الاردن": _2, "xn--3e0b707e": _2, "한국": _2, "xn--80ao21a": _2, "қаз": _2, "xn--fzc2c9e2c": _2, "ලංකා": _2, "xn--xkc2al3hye2a": _2, "இலங்கை": _2, "xn--mgbc0a9azcg": _2, "المغرب": _2, "xn--d1alf": _2, "мкд": _2, "xn--l1acc": _2, "мон": _2, "xn--mix891f": _2, "澳門": _2, "xn--mix082f": _2, "澳门": _2, "xn--mgbx4cd0ab": _2, "مليسيا": _2, "xn--mgb9awbf": _2, "عمان": _2, "xn--mgbai9azgqp6j": _2, "پاکستان": _2, "xn--mgbai9a5eva00b": _2, "پاكستان": _2, "xn--ygbi2ammx": _2, "فلسطين": _2, "xn--90a3ac": { "$": 1, "succ": { "xn--o1ac": _2, "xn--c1avg": _2, "xn--90azh": _2, "xn--d1at": _2, "xn--o1ach": _2, "xn--80au": _2 } }, "срб": { "$": 1, "succ": { "пр": _2, "орг": _2, "обр": _2, "од": _2, "упр": _2, "ак": _2 } }, "xn--p1ai": _2, "рф": _2, "xn--wgbl6a": _2, "قطر": _2, "xn--mgberp4a5d4ar": _2, "السعودية": _2, "xn--mgberp4a5d4a87g": _2, "السعودیة": _2, "xn--mgbqly7c0a67fbc": _2, "السعودیۃ": _2, "xn--mgbqly7cvafr": _2, "السعوديه": _2, "xn--mgbpl2fh": _2, "سودان": _2, "xn--yfro4i67o": _2, "新加坡": _2, "xn--clchc0ea0b2g2a9gcd": _2, "சிங்கப்பூர்": _2, "xn--ogbpf8fl": _2, "سورية": _2, "xn--mgbtf8fl": _2, "سوريا": _2, "xn--o3cw4h": { "$": 1, "succ": { "xn--12c1fe0br": _2, "xn--12co0c3b4eva": _2, "xn--h3cuzk1di": _2, "xn--o3cyx2a": _2, "xn--m3ch0j3a": _2, "xn--12cfi8ixb8l": _2 } }, "ไทย": { "$": 1, "succ": { "ศึกษา": _2, "ธุรกิจ": _2, "รัฐบาล": _2, "ทหาร": _2, "เน็ต": _2, "องค์กร": _2 } }, "xn--pgbs0dh": _2, "تونس": _2, "xn--kpry57d": _2, "台灣": _2, "xn--kprw13d": _2, "台湾": _2, "xn--nnx388a": _2, "臺灣": _2, "xn--j1amh": _2, "укр": _2, "xn--mgb2ddes": _2, "اليمن": _2, "xxx": _2, "ye": _8, "za": { "$": 0, "succ": { "ac": _2, "agric": _2, "alt": _2, "co": _5, "edu": _2, "gov": _2, "grondar": _2, "law": _2, "mil": _2, "net": _2, "ngo": _2, "nic": _2, "nis": _2, "nom": _2, "org": _2, "school": _2, "tm": _2, "web": _2 } }, "zm": { "$": 1, "succ": { "ac": _2, "biz": _2, "co": _2, "com": _2, "edu": _2, "gov": _2, "info": _2, "mil": _2, "net": _2, "org": _2, "sch": _2 } }, "zw": { "$": 1, "succ": { "ac": _2, "co": _2, "gov": _2, "mil": _2, "org": _2 } }, "aaa": _2, "aarp": _2, "abarth": _2, "abb": _2, "abbott": _2, "abbvie": _2, "abc": _2, "able": _2, "abogado": _2, "abudhabi": _2, "academy": { "$": 1, "succ": { "official": _4 } }, "accenture": _2, "accountant": _2, "accountants": _2, "aco": _2, "actor": _2, "adac": _2, "ads": _2, "adult": _2, "aeg": _2, "aetna": _2, "afamilycompany": _2, "afl": _2, "africa": _2, "agakhan": _2, "agency": _2, "aig": _2, "aigo": _2, "airbus": _2, "airforce": _2, "airtel": _2, "akdn": _2, "alfaromeo": _2, "alibaba": _2, "alipay": _2, "allfinanz": _2, "allstate": _2, "ally": _2, "alsace": _2, "alstom": _2, "americanexpress": _2, "americanfamily": _2, "amex": _2, "amfam": _2, "amica": _2, "amsterdam": _2, "analytics": _2, "android": _2, "anquan": _2, "anz": _2, "aol": _2, "apartments": _2, "app": { "$": 1, "succ": { "wnext": _4, "run": { "$": 2, "succ": { "a": _4 } }, "web": _4, "hasura": _4, "loginline": _4, "telebit": _4 } }, "apple": _2, "aquarelle": _2, "arab": _2, "aramco": _2, "archi": _2, "army": _2, "art": _2, "arte": _2, "asda": _2, "associates": _2, "athleta": _2, "attorney": _2, "auction": _2, "audi": _2, "audible": _2, "audio": _2, "auspost": _2, "author": _2, "auto": _2, "autos": _2, "avianca": _2, "aws": _2, "axa": _2, "azure": _2, "baby": _2, "baidu": _2, "banamex": _2, "bananarepublic": _2, "band": _2, "bank": _2, "bar": _2, "barcelona": _2, "barclaycard": _2, "barclays": _2, "barefoot": _2, "bargains": _2, "baseball": _2, "basketball": _2, "bauhaus": _2, "bayern": _2, "bbc": _2, "bbt": _2, "bbva": _2, "bcg": _2, "bcn": _2, "beats": _2, "beauty": _2, "beer": _2, "bentley": _2, "berlin": _2, "best": _2, "bestbuy": _2, "bet": _2, "bharti": _2, "bible": _2, "bid": _2, "bike": _2, "bing": _2, "bingo": _2, "bio": _2, "black": _2, "blackfriday": _2, "blockbuster": _2, "blog": _2, "bloomberg": _2, "blue": _2, "bms": _2, "bmw": _2, "bnpparibas": _2, "boats": _2, "boehringer": _2, "bofa": _2, "bom": _2, "bond": _2, "boo": _2, "book": _2, "booking": _2, "bosch": _2, "bostik": _2, "boston": _2, "bot": _2, "boutique": _2, "box": _2, "bradesco": _2, "bridgestone": _2, "broadway": _2, "broker": _2, "brother": _2, "brussels": _2, "budapest": _2, "bugatti": _2, "build": _2, "builders": _2, "business": _10, "buy": _2, "buzz": _2, "bzh": _2, "cab": _2, "cafe": _2, "cal": _2, "call": _2, "calvinklein": _2, "cam": _2, "camera": _2, "camp": _2, "cancerresearch": _2, "canon": _2, "capetown": _2, "capital": _2, "capitalone": _2, "car": _2, "caravan": _2, "cards": _2, "care": _2, "career": _2, "careers": _2, "cars": _2, "casa": { "$": 1, "succ": { "nabu": { "$": 0, "succ": { "ui": _4 } } } }, "case": _2, "caseih": _2, "cash": _2, "casino": _2, "catering": _2, "catholic": _2, "cba": _2, "cbn": _2, "cbre": _2, "cbs": _2, "ceb": _2, "center": _2, "ceo": _2, "cern": _2, "cfa": _2, "cfd": _2, "chanel": _2, "channel": _2, "charity": _2, "chase": _2, "chat": _2, "cheap": _2, "chintai": _2, "christmas": _2, "chrome": _2, "chrysler": _2, "church": _2, "cipriani": _2, "circle": _2, "cisco": _2, "citadel": _2, "citi": _2, "citic": _2, "city": _11, "cityeats": _2, "claims": _2, "cleaning": _2, "click": _2, "clinic": _2, "clinique": _2, "clothing": _2, "cloud": { "$": 1, "succ": { "statics": _7, "linkyard": _4, "magentosite": _7, "vapor": _4, "on-rancher": _7, "sensiosite": _7, "trafficplex": _4, "voorloper": _4 } }, "club": { "$": 1, "succ": { "cloudns": _4, "barsy": _4, "pony": _4 } }, "clubmed": _2, "coach": _2, "codes": _2, "coffee": _2, "college": _2, "cologne": _2, "comcast": _2, "commbank": _2, "community": { "$": 1, "succ": { "ravendb": _4 } }, "company": _2, "compare": _2, "computer": _2, "comsec": _2, "condos": _2, "construction": _2, "consulting": _2, "contact": _2, "contractors": _2, "cooking": _2, "cookingchannel": _2, "cool": { "$": 1, "succ": { "de": _4 } }, "corsica": _2, "country": _2, "coupon": _2, "coupons": _2, "courses": _2, "cpa": _2, "credit": _2, "creditcard": _2, "creditunion": _2, "cricket": _2, "crown": _2, "crs": _2, "cruise": _2, "cruises": _2, "csc": _2, "cuisinella": _2, "cymru": _2, "cyou": _2, "dabur": _2, "dad": _2, "dance": _2, "data": _2, "date": _2, "dating": _2, "datsun": _2, "day": _2, "dclk": _2, "dds": _2, "deal": _2, "dealer": _2, "deals": _2, "degree": _2, "delivery": _2, "dell": _2, "deloitte": _2, "delta": _2, "democrat": _2, "dental": _2, "dentist": _2, "desi": _2, "design": { "$": 1, "succ": { "bss": _4 } }, "dev": { "$": 1, "succ": { "lcl": _7, "stg": _7, "workers": _4, "iserv": _4, "loginline": _4, "webhare": _7 } }, "dhl": _2, "diamonds": _2, "diet": _2, "digital": { "$": 1, "succ": { "cloudapps": { "$": 2, "succ": { "london": _4 } } } }, "direct": { "$": 1, "succ": { "fastpanel": _4 } }, "directory": _2, "discount": _2, "discover": _2, "dish": _2, "diy": _2, "dnp": _2, "docs": _2, "doctor": _2, "dodge": _2, "dog": _2, "domains": _2, "dot": _2, "download": _2, "drive": _2, "dtv": _2, "dubai": _2, "duck": _2, "dunlop": _2, "dupont": _2, "durban": _2, "dvag": _2, "dvr": _2, "earth": { "$": 1, "succ": { "dapps": { "$": 0, "succ": { "*": _4, "bzz": _7 } } } }, "eat": _2, "eco": _2, "edeka": _2, "education": _10, "email": _2, "emerck": _2, "energy": _2, "engineer": _2, "engineering": _2, "enterprises": _2, "epson": _2, "equipment": _2, "ericsson": _2, "erni": _2, "esq": _2, "estate": { "$": 1, "succ": { "compute": _7 } }, "esurance": _2, "etisalat": _2, "eurovision": _2, "eus": { "$": 1, "succ": { "party": _18 } }, "events": _10, "exchange": _2, "expert": _2, "exposed": _2, "express": _2, "extraspace": _2, "fage": _2, "fail": _2, "fairwinds": _2, "faith": _19, "family": _2, "fan": _2, "fans": _2, "farm": { "$": 1, "succ": { "storj": _4 } }, "farmers": _2, "fashion": { "$": 1, "succ": { "of": _4, "on": _4 } }, "fast": _2, "fedex": _2, "feedback": _2, "ferrari": _2, "ferrero": _2, "fiat": _2, "fidelity": _2, "fido": _2, "film": _2, "final": _2, "finance": _2, "financial": _10, "fire": _2, "firestone": _2, "firmdale": _2, "fish": _2, "fishing": _2, "fit": { "$": 1, "succ": { "ptplus": _4 } }, "fitness": _2, "flickr": _2, "flights": _2, "flir": _2, "florist": _2, "flowers": _2, "fly": _2, "foo": _2, "food": _2, "foodnetwork": _2, "football": { "$": 1, "succ": { "of": _4 } }, "ford": _2, "forex": _2, "forsale": _2, "forum": _2, "foundation": _2, "fox": _2, "free": _2, "fresenius": _2, "frl": _2, "frogans": _2, "frontdoor": _2, "frontier": _2, "ftr": _2, "fujitsu": _2, "fujixerox": _2, "fun": _2, "fund": _2, "furniture": _2, "futbol": _2, "fyi": _2, "gal": _2, "gallery": _2, "gallo": _2, "gallup": _2, "game": _2, "games": _2, "gap": _2, "garden": _2, "gay": _2, "gbiz": _2, "gdn": { "$": 1, "succ": { "cnpy": _4 } }, "gea": _2, "gent": _2, "genting": _2, "george": _2, "ggee": _2, "gift": _2, "gifts": _2, "gives": _2, "giving": _2, "glade": _2, "glass": _2, "gle": _2, "global": _2, "globo": _2, "gmail": _2, "gmbh": _2, "gmo": _2, "gmx": _2, "godaddy": _2, "gold": _2, "goldpoint": _2, "golf": _2, "goo": _2, "goodyear": _2, "goog": { "$": 1, "succ": { "cloud": _4 } }, "google": _2, "gop": _2, "got": _2, "grainger": _2, "graphics": _2, "gratis": _2, "green": _2, "gripe": _2, "grocery": _2, "group": { "$": 1, "succ": { "discourse": _4 } }, "guardian": _2, "gucci": _2, "guge": _2, "guide": _2, "guitars": _2, "guru": _2, "hair": _2, "hamburg": _2, "hangout": _2, "haus": _2, "hbo": _2, "hdfc": _2, "hdfcbank": _2, "health": _2, "healthcare": _2, "help": _2, "helsinki": _2, "here": _2, "hermes": _2, "hgtv": _2, "hiphop": _2, "hisamitsu": _2, "hitachi": _2, "hiv": _2, "hkt": _2, "hockey": _2, "holdings": _2, "holiday": _2, "homedepot": _2, "homegoods": _2, "homes": _2, "homesense": _2, "honda": _2, "horse": _2, "hospital": _2, "host": { "$": 1, "succ": { "cloudaccess": _4, "freesite": _4, "pcloud": _4, "half": _4 } }, "hosting": { "$": 1, "succ": { "opencraft": _4 } }, "hot": _2, "hoteles": _2, "hotels": _2, "hotmail": _2, "house": _2, "how": _2, "hsbc": _2, "hughes": _2, "hyatt": _2, "hyundai": _2, "ibm": _2, "icbc": _2, "ice": _2, "icu": _2, "ieee": _2, "ifm": _2, "ikano": _2, "imamat": _2, "imdb": _2, "immo": _2, "immobilien": _2, "inc": _2, "industries": _2, "infiniti": _2, "ing": _2, "ink": _11, "institute": _2, "insurance": _2, "insure": _2, "intel": _2, "international": _2, "intuit": _2, "investments": _2, "ipiranga": _2, "irish": _2, "ismaili": _2, "ist": _2, "istanbul": _2, "itau": _2, "itv": _2, "iveco": _2, "jaguar": _2, "java": _2, "jcb": _2, "jcp": _2, "jeep": _2, "jetzt": _2, "jewelry": _2, "jio": _2, "jll": _2, "jmp": _2, "jnj": _2, "joburg": _2, "jot": _2, "joy": _2, "jpmorgan": _2, "jprs": _2, "juegos": _2, "juniper": _2, "kaufen": _2, "kddi": _2, "kerryhotels": _2, "kerrylogistics": _2, "kerryproperties": _2, "kfh": _2, "kia": _2, "kim": _2, "kinder": _2, "kindle": _2, "kitchen": _2, "kiwi": _2, "koeln": _2, "komatsu": _2, "kosher": _2, "kpmg": _2, "kpn": _2, "krd": { "$": 1, "succ": { "co": _4, "edu": _4 } }, "kred": _2, "kuokgroup": _2, "kyoto": _2, "lacaixa": _2, "ladbrokes": _2, "lamborghini": _2, "lamer": _2, "lancaster": _2, "lancia": _2, "lancome": _2, "land": { "$": 1, "succ": { "static": { "$": 2, "succ": { "dev": _4, "sites": _4 } } } }, "landrover": _2, "lanxess": _2, "lasalle": _2, "lat": _2, "latino": _2, "latrobe": _2, "law": _2, "lawyer": _2, "lds": _2, "lease": _2, "leclerc": _2, "lefrak": _2, "legal": _2, "lego": _2, "lexus": _2, "lgbt": _2, "liaison": _2, "lidl": _2, "life": _2, "lifeinsurance": _2, "lifestyle": _2, "lighting": _2, "like": _2, "lilly": _2, "limited": _2, "limo": _2, "lincoln": _2, "linde": _2, "link": { "$": 1, "succ": { "cyon": _4, "mypep": _4, "dweb": _7 } }, "lipsy": _2, "live": _2, "living": _2, "lixil": _2, "llc": _2, "llp": _2, "loan": _2, "loans": _2, "locker": _2, "locus": _2, "loft": _2, "lol": _2, "london": { "$": 1, "succ": { "in": _4, "of": _4 } }, "lotte": _2, "lotto": _2, "love": _2, "lpl": _2, "lplfinancial": _2, "ltd": _2, "ltda": _2, "lundbeck": _2, "lupin": _2, "luxe": _2, "luxury": _2, "macys": _2, "madrid": _2, "maif": _2, "maison": _2, "makeup": _2, "man": _2, "management": { "$": 1, "succ": { "router": _4 } }, "mango": _2, "map": _2, "market": _2, "marketing": _2, "markets": _2, "marriott": _2, "marshalls": _2, "maserati": _2, "mattel": _2, "mba": _2, "mckinsey": _2, "med": _2, "media": _2, "meet": _2, "melbourne": _2, "meme": _2, "memorial": _2, "men": _25, "menu": _26, "merckmsd": _2, "metlife": _2, "miami": _2, "microsoft": _2, "mini": _2, "mint": _2, "mit": _2, "mitsubishi": _2, "mlb": _2, "mls": _2, "mma": _2, "mobile": _2, "moda": _2, "moe": _2, "moi": _2, "mom": { "$": 1, "succ": { "and": _4, "for": _4 } }, "monash": _2, "money": _2, "monster": _2, "mopar": _2, "mormon": _2, "mortgage": _2, "moscow": _2, "moto": _2, "motorcycles": _2, "mov": _2, "movie": _2, "movistar": _2, "msd": _2, "mtn": _2, "mtr": _2, "mutual": _2, "nab": _2, "nadex": _2, "nagoya": _2, "nationwide": _2, "natura": _2, "navy": _2, "nba": _2, "nec": _2, "netbank": _2, "netflix": _2, "network": { "$": 1, "succ": { "alces": _7, "co": _4, "arvo": _4, "azimuth": _4 } }, "neustar": _2, "new": _2, "newholland": _2, "news": _2, "next": _2, "nextdirect": _2, "nexus": _2, "nfl": _2, "ngo": _2, "nhk": _2, "nico": _2, "nike": _2, "nikon": _2, "ninja": _2, "nissan": _2, "nissay": _2, "nokia": _2, "northwesternmutual": _2, "norton": _2, "now": _2, "nowruz": _2, "nowtv": _2, "nra": _2, "nrw": _2, "ntt": _2, "nyc": _2, "obi": _2, "observer": _2, "off": _2, "office": _2, "okinawa": _2, "olayan": _2, "olayangroup": _2, "oldnavy": _2, "ollo": _2, "omega": _2, "one": { "$": 1, "succ": { "onred": { "$": 2, "succ": { "staging": _4 } }, "for": _4, "homelink": _4 } }, "ong": _2, "onl": _2, "online": _26, "onyourside": _2, "ooo": _2, "open": _2, "oracle": _2, "orange": _2, "organic": _2, "origins": _2, "osaka": _2, "otsuka": _2, "ott": _2, "ovh": { "$": 1, "succ": { "nerdpol": _4 } }, "page": { "$": 1, "succ": { "prvcy": _4 } }, "panasonic": _2, "paris": _2, "pars": _2, "partners": _2, "parts": _2, "party": _19, "passagens": _2, "pay": _2, "pccw": _2, "pet": _2, "pfizer": _2, "pharmacy": _2, "phd": _2, "philips": _2, "phone": _2, "photo": _2, "photography": _2, "photos": _2, "physio": _2, "pics": _2, "pictet": _2, "pictures": { "$": 1, "succ": { "1337": _4 } }, "pid": _2, "pin": _2, "ping": _2, "pink": _2, "pioneer": _2, "pizza": _2, "place": _10, "play": _2, "playstation": _2, "plumbing": _2, "plus": _2, "pnc": _2, "pohl": _2, "poker": _2, "politie": _2, "porn": _2, "pramerica": _2, "praxi": _2, "press": _2, "prime": _2, "prod": _2, "productions": _2, "prof": _2, "progressive": _2, "promo": _2, "properties": _2, "property": _2, "protection": _2, "pru": _2, "prudential": _2, "pub": _26, "pwc": _2, "qpon": _2, "quebec": _2, "quest": _2, "qvc": _2, "racing": _2, "radio": _2, "raid": _2, "read": _2, "realestate": _2, "realtor": _2, "realty": _2, "recipes": _2, "red": _2, "redstone": _2, "redumbrella": _2, "rehab": _2, "reise": _2, "reisen": _2, "reit": _2, "reliance": _2, "ren": _2, "rent": _2, "rentals": _2, "repair": _2, "report": _2, "republican": _2, "rest": _2, "restaurant": _2, "review": _19, "reviews": _2, "rexroth": _2, "rich": _2, "richardli": _2, "ricoh": _2, "rightathome": _2, "ril": _2, "rio": _2, "rip": { "$": 1, "succ": { "clan": _4 } }, "rmit": _2, "rocher": _2, "rocks": { "$": 1, "succ": { "myddns": _4, "lima-city": _4, "webspace": _4 } }, "rodeo": _2, "rogers": _2, "room": _2, "rsvp": _2, "rugby": _2, "ruhr": _2, "run": { "$": 1, "succ": { "hs": _4, "development": _4, "ravendb": _4, "repl": _4 } }, "rwe": _2, "ryukyu": _2, "saarland": _2, "safe": _2, "safety": _2, "sakura": _2, "sale": _25, "salon": _2, "samsclub": _2, "samsung": _2, "sandvik": _2, "sandvikcoromant": _2, "sanofi": _2, "sap": _2, "sarl": _2, "sas": _2, "save": _2, "saxo": _2, "sbi": _2, "sbs": _2, "sca": _2, "scb": _2, "schaeffler": _2, "schmidt": _2, "scholarships": _2, "school": _11, "schule": _2, "schwarz": _2, "science": _19, "scjohnson": _2, "scor": _2, "scot": { "$": 1, "succ": { "gov": _4 } }, "search": _2, "seat": _2, "secure": _2, "security": _2, "seek": _2, "select": _2, "sener": _2, "services": { "$": 1, "succ": { "loginline": _4 } }, "ses": _2, "seven": _2, "sew": _2, "sex": _2, "sexy": _2, "sfr": _2, "shangrila": _2, "sharp": _2, "shaw": _2, "shell": _2, "shia": _2, "shiksha": _2, "shoes": _2, "shop": _26, "shopping": _2, "shouji": _2, "show": _2, "showtime": _2, "shriram": _2, "silk": _2, "sina": _2, "singles": _2, "site": { "$": 1, "succ": { "cloudera": _4, "cyon": _4, "lelux": _4, "loginline": _4, "barsy": _4, "platformsh": _7, "byen": _4 } }, "ski": _2, "skin": _2, "sky": _2, "skype": _2, "sling": _2, "smart": _2, "smile": _2, "sncf": _2, "soccer": _2, "social": _2, "softbank": _2, "software": _2, "sohu": _2, "solar": _2, "solutions": _2, "song": _2, "sony": _2, "soy": _2, "spa": _2, "space": { "$": 1, "succ": { "linkitools": _4, "uber": _4, "xs4all": _4 } }, "sport": _2, "spot": _2, "spreadbetting": _2, "srl": _2, "srt": _2, "stada": _2, "staples": _2, "star": _2, "statebank": _2, "statefarm": _2, "stc": _2, "stcgroup": _2, "stockholm": _2, "storage": _2, "store": _2, "stream": _2, "studio": _2, "study": _2, "style": _2, "sucks": _2, "supplies": _2, "supply": _2, "support": _26, "surf": _2, "surgery": _2, "suzuki": _2, "swatch": _2, "swiftcover": _2, "swiss": _2, "sydney": _2, "symantec": _2, "systems": { "$": 1, "succ": { "knightpoint": _4 } }, "tab": _2, "taipei": _2, "talk": _2, "taobao": _2, "target": _2, "tatamotors": _2, "tatar": _2, "tattoo": _2, "tax": _2, "taxi": _2, "tci": _2, "tdk": _2, "team": _2, "tech": _2, "technology": _10, "telefonica": _2, "temasek": _2, "tennis": _2, "teva": _2, "thd": _2, "theater": _2, "theatre": _2, "tiaa": _2, "tickets": _2, "tienda": _2, "tiffany": _2, "tips": _2, "tires": _2, "tirol": _2, "tjmaxx": _2, "tjx": _2, "tkmaxx": _2, "tmall": _2, "today": _2, "tokyo": _2, "tools": _2, "top": { "$": 1, "succ": { "now-dns": _4, "ntdll": _4 } }, "toray": _2, "toshiba": _2, "total": _2, "tours": _2, "town": _2, "toyota": _2, "toys": _2, "trade": _19, "trading": _2, "training": _2, "travel": _2, "travelchannel": _2, "travelers": _2, "travelersinsurance": _2, "trust": _2, "trv": _2, "tube": _2, "tui": _2, "tunes": _2, "tushu": _2, "tvs": _2, "ubank": _2, "ubs": _2, "uconnect": _2, "unicom": _2, "university": _2, "uno": _2, "uol": _2, "ups": _2, "vacations": _2, "vana": _2, "vanguard": _2, "vegas": _2, "ventures": _2, "verisign": _2, "versicherung": _2, "vet": _2, "viajes": _2, "video": _2, "vig": _2, "viking": _2, "villas": _2, "vin": _2, "vip": _2, "virgin": _2, "visa": _2, "vision": _2, "vistaprint": _2, "viva": _2, "vivo": _2, "vlaanderen": _2, "vodka": _2, "volkswagen": _2, "volvo": _2, "vote": _2, "voting": _2, "voto": _2, "voyage": _2, "vuelos": _2, "wales": _2, "walmart": _2, "walter": _2, "wang": _2, "wanggou": _2, "warman": _2, "watch": _2, "watches": _2, "weather": _2, "weatherchannel": _2, "webcam": _2, "weber": _2, "website": _2, "wed": _2, "wedding": _2, "weibo": _2, "weir": _2, "whoswho": _2, "wien": _2, "wiki": _2, "williamhill": _2, "win": _2, "windows": _2, "wine": _2, "winners": _2, "wme": _2, "wolterskluwer": _2, "woodside": _2, "work": { "$": 1, "succ": { "of": _4, "to": _4 } }, "works": _2, "world": _2, "wow": _2, "wtc": _2, "wtf": _2, "xbox": _2, "xerox": _2, "xfinity": _2, "xihuan": _2, "xin": _2, "xn--11b4c3d": _2, "कॉम": _2, "xn--1ck2e1b": _2, "セール": _2, "xn--1qqw23a": _2, "佛山": _2, "xn--30rr7y": _2, "慈善": _2, "xn--3bst00m": _2, "集团": _2, "xn--3ds443g": _2, "在线": _2, "xn--3oq18vl8pn36a": _2, "大众汽车": _2, "xn--3pxu8k": _2, "点看": _2, "xn--42c2d9a": _2, "คอม": _2, "xn--45q11c": _2, "八卦": _2, "xn--4gbrim": _2, "موقع": _2, "xn--55qw42g": _2, "公益": _2, "xn--55qx5d": _2, "公司": _2, "xn--5su34j936bgsg": _2, "香格里拉": _2, "xn--5tzm5g": _2, "网站": _2, "xn--6frz82g": _2, "移动": _2, "xn--6qq986b3xl": _2, "我爱你": _2, "xn--80adxhks": _2, "москва": _2, "xn--80aqecdr1a": _2, "католик": _2, "xn--80asehdb": _2, "онлайн": _2, "xn--80aswg": _2, "сайт": _2, "xn--8y0a063a": _2, "联通": _2, "xn--9dbq2a": _2, "קום": _2, "xn--9et52u": _2, "时尚": _2, "xn--9krt00a": _2, "微博": _2, "xn--b4w605ferd": _2, "淡马锡": _2, "xn--bck1b9a5dre4c": _2, "ファッション": _2, "xn--c1avg": _2, "орг": _2, "xn--c2br7g": _2, "नेट": _2, "xn--cck2b3b": _2, "ストア": _2, "xn--cg4bki": _2, "삼성": _2, "xn--czr694b": _2, "商标": _2, "xn--czrs0t": _2, "商店": _2, "xn--czru2d": _2, "商城": _2, "xn--d1acj3b": _2, "дети": _2, "xn--eckvdtc9d": _2, "ポイント": _2, "xn--efvy88h": _2, "新闻": _2, "xn--estv75g": _2, "工行": _2, "xn--fct429k": _2, "家電": _2, "xn--fhbei": _2, "كوم": _2, "xn--fiq228c5hs": _2, "中文网": _2, "xn--fiq64b": _2, "中信": _2, "xn--fjq720a": _2, "娱乐": _2, "xn--flw351e": _2, "谷歌": _2, "xn--fzys8d69uvgm": _2, "電訊盈科": _2, "xn--g2xx48c": _2, "购物": _2, "xn--gckr3f0f": _2, "クラウド": _2, "xn--gk3at1e": _2, "通販": _2, "xn--hxt814e": _2, "网店": _2, "xn--i1b6b1a6a2e": _2, "संगठन": _2, "xn--imr513n": _2, "餐厅": _2, "xn--io0a7i": _2, "网络": _2, "xn--j1aef": _2, "ком": _2, "xn--jlq61u9w7b": _2, "诺基亚": _2, "xn--jvr189m": _2, "食品": _2, "xn--kcrx77d1x4a": _2, "飞利浦": _2, "xn--kpu716f": _2, "手表": _2, "xn--kput3i": _2, "手机": _2, "xn--mgba3a3ejt": _2, "ارامكو": _2, "xn--mgba7c0bbn0a": _2, "العليان": _2, "xn--mgbaakc7dvf": _2, "اتصالات": _2, "xn--mgbab2bd": _2, "بازار": _2, "xn--mgbca7dzdo": _2, "ابوظبي": _2, "xn--mgbi4ecexp": _2, "كاثوليك": _2, "xn--mgbt3dhd": _2, "همراه": _2, "xn--mk1bu44c": _2, "닷컴": _2, "xn--mxtq1m": _2, "政府": _2, "xn--ngbc5azd": _2, "شبكة": _2, "xn--ngbe9e0a": _2, "بيتك": _2, "xn--ngbrx": _2, "عرب": _2, "xn--nqv7f": _2, "机构": _2, "xn--nqv7fs00ema": _2, "组织机构": _2, "xn--nyqy26a": _2, "健康": _2, "xn--otu796d": _2, "招聘": _2, "xn--p1acf": _2, "рус": _2, "xn--pbt977c": _2, "珠宝": _2, "xn--pssy2u": _2, "大拿": _2, "xn--q9jyb4c": _2, "みんな": _2, "xn--qcka1pmc": _2, "グーグル": _2, "xn--rhqv96g": _2, "世界": _2, "xn--rovu88b": _2, "書籍": _2, "xn--ses554g": _2, "网址": _2, "xn--t60b56a": _2, "닷넷": _2, "xn--tckwe": _2, "コム": _2, "xn--tiq49xqyj": _2, "天主教": _2, "xn--unup4y": _2, "游戏": _2, "xn--vermgensberater-ctb": _2, "vermögensberater": _2, "xn--vermgensberatung-pwb": _2, "vermögensberatung": _2, "xn--vhquv": _2, "企业": _2, "xn--vuq861b": _2, "信息": _2, "xn--w4r85el8fhu5dnra": _2, "嘉里大酒店": _2, "xn--w4rs40l": _2, "嘉里": _2, "xn--xhq521b": _2, "广东": _2, "xn--zfr164b": _2, "政务": _2, "xyz": { "$": 1, "succ": { "blogsite": _4, "fhapp": _4, "crafting": _4, "zapto": _4, "telebit": _7 } }, "yachts": _2, "yahoo": _2, "yamaxun": _2, "yandex": _2, "yodobashi": _2, "yoga": _2, "yokohama": _2, "you": _2, "youtube": _2, "yun": _2, "zappos": _2, "zara": _2, "zero": _2, "zip": _2, "zone": { "$": 1, "succ": { "cloud66": _4, "hs": _4, "triton": _7, "lima": _4 } }, "zuerich": _2 } };
    return rules;
})();

/**
 * Lookup parts of domain in Trie
 */
function lookupInTrie(parts, trie, index, allowedMask) {
    var result = null;
    var node = trie;
    while (node !== undefined) {
        // We have a match!
        if ((node.$ & allowedMask) !== 0) {
            result = {
                index: index + 1,
                isIcann: node.$ === 1 /* ICANN */,
                isPrivate: node.$ === 2 /* PRIVATE */
            };
        }
        // No more `parts` to look for
        if (index === -1) {
            break;
        }
        var succ = node.succ;
        node = succ && (succ[parts[index]] || succ['*']);
        index -= 1;
    }
    return result;
}
/**
 * Check if `hostname` has a valid public suffix in `trie`.
 */
function suffixLookup(hostname, options, out) {
    if (fastPathLookup(hostname, options, out) === true) {
        return;
    }
    var hostnameParts = hostname.split('.');
    var allowedMask = (options.allowPrivateDomains === true ? 2 /* PRIVATE */ : 0) |
        (options.allowIcannDomains === true ? 1 /* ICANN */ : 0);
    // Look for exceptions
    var exceptionMatch = lookupInTrie(hostnameParts, exceptions, hostnameParts.length - 1, allowedMask);
    if (exceptionMatch !== null) {
        out.isIcann = exceptionMatch.isIcann;
        out.isPrivate = exceptionMatch.isPrivate;
        out.publicSuffix = hostnameParts.slice(exceptionMatch.index + 1).join('.');
        return;
    }
    // Look for a match in rules
    var rulesMatch = lookupInTrie(hostnameParts, rules, hostnameParts.length - 1, allowedMask);
    if (rulesMatch !== null) {
        out.isIcann = rulesMatch.isIcann;
        out.isPrivate = rulesMatch.isPrivate;
        out.publicSuffix = hostnameParts.slice(rulesMatch.index).join('.');
        return;
    }
    // No match found...
    // Prevailing rule is '*' so we consider the top-level domain to be the
    // public suffix of `hostname` (e.g.: 'example.org' => 'org').
    out.isIcann = false;
    out.isPrivate = false;
    out.publicSuffix = hostnameParts[hostnameParts.length - 1];
}

// For all methods but 'parse', it does not make sense to allocate an object
// every single time to only return the value of a specific attribute. To avoid
// this un-necessary allocation, we use a global object which is re-used.
var RESULT = getEmptyResult();
function parse(url, options) {
    if (options === void 0) { options = {}; }
    return parseImpl(url, 5 /* ALL */, suffixLookup, options, getEmptyResult());
}
function getHostname(url, options) {
    if (options === void 0) { options = {}; }
    resetResult(RESULT);
    return parseImpl(url, 0 /* HOSTNAME */, suffixLookup, options, RESULT).hostname;
}
function getPublicSuffix(url, options) {
    if (options === void 0) { options = {}; }
    resetResult(RESULT);
    return parseImpl(url, 2 /* PUBLIC_SUFFIX */, suffixLookup, options, RESULT).publicSuffix;
}
function getDomain$1(url, options) {
    if (options === void 0) { options = {}; }
    resetResult(RESULT);
    return parseImpl(url, 3 /* DOMAIN */, suffixLookup, options, RESULT).domain;
}
function getSubdomain$1(url, options) {
    if (options === void 0) { options = {}; }
    resetResult(RESULT);
    return parseImpl(url, 4 /* SUB_DOMAIN */, suffixLookup, options, RESULT).subdomain;
}
function getDomainWithoutSuffix$1(url, options) {
    if (options === void 0) { options = {}; }
    resetResult(RESULT);
    return parseImpl(url, 5 /* ALL */, suffixLookup, options, RESULT).domainWithoutSuffix;
}

exports.getDomain = getDomain$1;
exports.getDomainWithoutSuffix = getDomainWithoutSuffix$1;
exports.getHostname = getHostname;
exports.getPublicSuffix = getPublicSuffix;
exports.getSubdomain = getSubdomain$1;
exports.parse = parse;


},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
"use strict";

module.exports = {
    "extensionIsEnabled": true,
    "socialBlockingIsEnabled": false,
    "trackerBlockingEnabled": true,
    "httpsEverywhereEnabled": true,
    "embeddedTweetsEnabled": false,
    "meanings": true,
    "advanced_options": true,
    "last_search": "",
    "lastsearch_enabled": true,
    "safesearch": true,
    "use_post": false,
    "ducky": false,
    "dev": false,
    "zeroclick_google_right": false,
    "version": null,
    "atb": null,
    "set_atb": null,
    "trackersWhitelistTemporary-etag": null,
    "trackersWhitelist-etag": null,
    "surrogateList-etag": null,
    "httpsUpgradeBloomFilter-etag": null,
    "httpsDontUpgradeBloomFilters-etag": null,
    "httpsUpgradeList-etag": null,
    "httpsDontUpgradeList-etag": null,
    "hasSeenPostInstall": false,
    "extiSent": false,
    "failedUpgrades": 0,
    "totalUpgrades": 0,
    "tds-etag": null,
    "surrogates-etag": null,
    "brokenSiteList-etag": null,
    "lastTdsUpdate": 0
};

},{}],16:[function(require,module,exports){
'use strict';

module.exports = {
    _: {},
    l: {
        name: 'full tracker list',
        description: 'Testing full Tracker Radar list',
        active: false,
        atbExperiments: {
            'm': {
                description: 'Full list experiment group',
                settings: {
                    experimentData: {
                        listName: 'tds',
                        url: 'https://staticcdn.duckduckgo.com/trackerblocking/lm/tds.json'
                    }
                }
            }
        }
    },
    f: {
        name: 'Fingerprint protection',
        description: 'Testing basic fingerprint protection',
        active: true,
        atbExperiments: {
            'k': {
                description: 'Basic fingerprint protection experiment group',
                settings: {
                    experimentData: {
                        fingerprint_protection: true
                    }
                }
            }
        }
    }
};

},{}],17:[function(require,module,exports){
module.exports={
    "zoosk.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "youtube.com": {
        "score": 0,
        "all": {
            "bad": [
                "broader than necessary",
                "reduction of legal period for cause of action",
                "user needs to check tosback.org",
                "device fingerprinting"
            ],
            "good": [
                "help you deal with take-down notices"
            ]
        },
        "match": {
            "bad": [
                "broader than necessary",
                "reduction of legal period for cause of action",
                "user needs to check tosback.org",
                "device fingerprinting"
            ],
            "good": [
                "help you deal with take-down notices"
            ]
        },
        "class": "D"
    },
    "yahoo.com": {
        "score": 0,
        "all": {
            "bad": [
                "pseudonym not allowed (not because of user-to-user trust)",
                "user needs to check tosback.org",
                "device fingerprinting"
            ],
            "good": [
                "limited for purpose of same service",
                "limited for purpose of same service"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "xing.com": {
        "score": 0,
        "all": {
            "bad": [
                "pseudonym not allowed (not because of user-to-user trust)"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "xfire.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "worldofwarcraft.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "wordpress.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org",
                "device fingerprinting"
            ],
            "good": [
                "limited for purpose of same service"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "wordfeud.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "wikipedia.org": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "only temporary session cookies",
                "user feedback is invited",
                "suspension will be fair and proportionate",
                "you publish under a free license, not a bilateral one"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "whatsapp.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "videobb.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "vbulletin.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "twitter.com": {
        "score": 0,
        "all": {
            "bad": [
                "little involvement",
                "very broad",
                "your content stays licensed",
                "sets third-party cookies and/or ads"
            ],
            "good": [
                "archives provided",
                "tracking data deleted after 10 days and opt-out",
                "you can get your data back"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "twitpic.com": {
        "score": 85,
        "all": {
            "bad": [
                "responsible and indemnify",
                "reduction of legal period for cause of action",
                "they can license to third parties"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "they can license to third parties"
            ],
            "good": []
        },
        "class": false
    },
    "tumblr.com": {
        "score": 0,
        "all": {
            "bad": [
                "keep a license even after you close your account",
                "sets third-party cookies and/or ads"
            ],
            "good": [
                "they state that you own your data",
                "third parties are bound by confidentiality obligations",
                "archives provided"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "steampowered.com": {
        "score": -65,
        "all": {
            "bad": [
                "defend, indemnify, hold harmless; survives termination",
                "personal data is given to third parties",
                "they can delete your account without prior notice and without a reason",
                "class action waiver"
            ],
            "good": [
                "personal data is not sold",
                "pseudonyms allowed",
                "you can request access and deletion of personal data",
                "user is notified a month or more in advance",
                "you can leave at any time"
            ]
        },
        "match": {
            "bad": [
                "personal data is given to third parties"
            ],
            "good": [
                "personal data is not sold",
                "you can request access and deletion of personal data"
            ]
        },
        "class": false
    },
    "store.steampowered.com": {
        "score": -65,
        "all": {
            "bad": [
                "defend, indemnify, hold harmless; survives termination",
                "personal data is given to third parties",
                "they can delete your account without prior notice and without a reason",
                "class action waiver"
            ],
            "good": [
                "personal data is not sold",
                "pseudonyms allowed",
                "you can request access and deletion of personal data",
                "user is notified a month or more in advance",
                "you can leave at any time"
            ]
        },
        "match": {
            "bad": [
                "personal data is given to third parties"
            ],
            "good": [
                "personal data is not sold",
                "you can request access and deletion of personal data"
            ]
        },
        "class": false
    },
    "spotify.com": {
        "score": 10,
        "all": {
            "bad": [
                "you grant perpetual license to anything you publish-bad-80",
                "spotify may transfer and process your data to somewhere outside of your country-bad-50",
                "personal data is given to third parties",
                "they can delete your account without prior notice and without a reason",
                "no promise to inform/notify",
                "no quality guarantee",
                "third parties may be involved in operating the service",
                "no quality guarantee"
            ],
            "good": [
                "info given about risk of publishing your info online",
                "you can leave at any time",
                "they educate you about the risks",
                "info given about what personal data they collect",
                "info given about intended use of your information"
            ]
        },
        "match": {
            "bad": [
                "personal data is given to third parties"
            ],
            "good": []
        },
        "class": false
    },
    "soundcloud.com": {
        "score": 20,
        "all": {
            "bad": [
                "responsible and indemnify",
                "may sell your data in merger",
                "third-party cookies, but with opt-out instructions"
            ],
            "good": [
                "user is notified a month or more in advance",
                "easy to read",
                "you have control over licensing options",
                "your personal data is used for limited purposes",
                "pseudonyms allowed",
                "you can leave at any time"
            ]
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": "B"
    },
    "sonic.net": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "logs are deleted after two weeks"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "skype.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org",
                "you may not express negative opinions about them"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "seenthis.net": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "you can get your data back",
                "you can leave at any time",
                "you have control over licensing options"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "you can get your data back",
                "you can leave at any time",
                "you have control over licensing options"
            ]
        },
        "class": "A"
    },
    "runescape.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "rapidshare.com": {
        "score": -50,
        "all": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "they do not index or open files",
                "your personal data is used for limited purposes",
                "99.x% availability",
                "user is notified a month or more in advance"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no third-party access without a warrant"
            ]
        },
        "class": false
    },
    "quora.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "phpbb.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "packagetrackr.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "owncube.com": {
        "score": -25,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": [
                "personal data is not sold"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "personal data is not sold"
            ]
        },
        "class": false
    },
    "olx.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "netflix.com": {
        "score": -20,
        "all": {
            "bad": [
                "class action waiver",
                "sets third-party cookies and/or ads",
                "they can delete your account without prior notice and without a reason",
                "no liability for unauthorized access",
                "user needs to check tosback.org",
                "targeted third-party advertising",
                "no promise to inform/notify"
            ],
            "good": [
                "easy to read",
                "you can request access and deletion of personal data"
            ]
        },
        "match": {
            "bad": [
                "targeted third-party advertising"
            ],
            "good": [
                "you can request access and deletion of personal data"
            ]
        },
        "class": false
    },
    "nabble.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "mint.com": {
        "score": 20,
        "all": {
            "bad": [
                "may sell your data in merger",
                "user needs to rely on tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": false
    },
    "microsoft.com": {
        "score": 60,
        "all": {
            "bad": [
                "class action waiver",
                "tracks you on other websites",
                "no promise to inform/notify",
                "user needs to check tosback.org",
                "your data may be stored anywhere in the world"
            ],
            "good": [
                "personalized ads are opt-out"
            ]
        },
        "match": {
            "bad": [
                "tracks you on other websites"
            ],
            "good": []
        },
        "class": false
    },
    "lastpass.com": {
        "score": -50,
        "all": {
            "bad": [
                "they can delete your account without prior notice and without a reason",
                "no quality guarantee",
                "no quality guarantee",
                "they become the owner of ideas you give them",
                "user needs to check tosback.org",
                "promotional communications are not opt-out",
                "responsible and indemnify"
            ],
            "good": [
                "legal documents published under reusable license",
                "pseudonyms allowed",
                "info given about security practices",
                "only necessary logs are kept",
                "only temporary session cookies",
                "no third-party access without a warrant"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no third-party access without a warrant"
            ]
        },
        "class": "B"
    },
    "kolabnow.com": {
        "score": -75,
        "all": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "4 weeks to review changes and possibility to negotiate-good-60",
                "no tracking cookies and web analytics opt-out-good-20",
                "suspension will be fair and proportionate",
                "only necessary logs are kept",
                "no third-party access without a warrant",
                "free software; you can run your own instance",
                "personal data is not sold"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "personal data is not sold"
            ]
        },
        "class": "A"
    },
    "kolab.org": {
        "score": -75,
        "all": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "4 weeks to review changes and possibility to negotiate-good-60",
                "no tracking cookies and web analytics opt-out-good-20",
                "suspension will be fair and proportionate",
                "only necessary logs are kept",
                "no third-party access without a warrant",
                "free software; you can run your own instance",
                "personal data is not sold"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no third-party access without a warrant",
                "personal data is not sold"
            ]
        },
        "class": "A"
    },
    "kippt.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to rely on tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "jagex.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "user is notified a week or more in advance"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "instagram.com": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "very broad"
            ],
            "good": [
                "user is notified a week or more in advance"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "informe.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "imgur.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "ifttt.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "identi.ca": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "you publish under a free license, not a bilateral one"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "hypster.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "habbo.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "gravatar.com": {
        "score": 0,
        "all": {
            "bad": [
                "broader than necessary"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "grammarly.com": {
        "score": 20,
        "all": {
            "bad": [
                "no promise to inform/notify",
                "your use is throttled",
                "no pricing info given before you sign up",
                "may sell your data in merger"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": false
    },
    "google.com": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.in": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.jp": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.de": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.uk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.br": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.fr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ru": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.it": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.hk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.es": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ca": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.mx": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.tr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.au": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.tw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.pl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.id": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ar": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ua": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.th": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sa": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.eg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.nl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ve": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.za": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ph": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.se": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.be": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.az": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ao": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.co": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.kr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.at": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.vn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ng": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ch": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.no": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ro": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pe": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.pt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ae": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ie": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.dk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.dz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.fi": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.il": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.kz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.kw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.nz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.lk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.by": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.do": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ly": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.rs": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.mm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ec": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.my": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.lt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.iq": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.si": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.af": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.gt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.lv": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.gh": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bd": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.cu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.jo": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.lb": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sv": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ee": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bh": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ba": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.uy": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ma": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.kh": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.py": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.np": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.cy": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ni": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.et": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cd": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ge": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.am": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.lu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.qa": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.mz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.bw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.tj": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ht": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.zm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ke": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.al": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bf": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.cr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.la": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bo": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.org": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.jm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.tz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.na": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ml": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.mt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.is": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bj": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ug": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.rw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.om": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ci": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bs": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.td": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ps": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.gi": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pa": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.uz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.md": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bi": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cat": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.so": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.bt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.je": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gy": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.me": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.zw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gp": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ls": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.as": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.bz": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cf": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mv": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ad": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.li": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.cv": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.vc": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ag": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ne": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.mw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ws": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.kg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.to": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.sb": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.tn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ga": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tl": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.im": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.fj": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.dj": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ac": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.iq": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.vg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.dm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sc": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.pt": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.cn": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.st": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ng": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ai": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ki": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.vu": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.jp": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.om": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.vi": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.gg": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.fm": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.ck": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tk": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.in": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.co.je": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.ve": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.tw": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.us": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ua": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.de.com": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.ms": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.com.by": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.nr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.br.com": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.sh": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.hk.com": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "google.kr": {
        "score": 220,
        "all": {
            "bad": [
                "they may stop providing the service at any time",
                "they can use your content for all their existing and future services",
                "third-party access without a warrant",
                "your content stays licensed",
                "tracks you on other websites",
                "logs are kept forever",
                "device fingerprinting"
            ],
            "good": [
                "user is notified a week or more in advance",
                "archives provided",
                "they provide a way to export your data",
                "limited for purpose across broad platform"
            ]
        },
        "match": {
            "bad": [
                "they can use your content for all their existing and future services",
                "tracks you on other websites",
                "logs are kept forever"
            ],
            "good": []
        },
        "class": "C"
    },
    "github.com": {
        "score": 0,
        "all": {
            "bad": [
                "they can delete your account without prior notice and without a reason",
                "user needs to check tosback.org",
                "pseudonym not allowed (not because of user-to-user trust)",
                "defend, indemnify, hold harmless"
            ],
            "good": [
                "info given about security practices",
                "you publish under a free license, not a bilateral one",
                "will notify before merger",
                "your personal data is used for limited purposes"
            ]
        },
        "match": {
            "bad": [
                "they can delete your account without prior notice and without a reason",
                "user needs to check tosback.org",
                "pseudonym not allowed (not because of user-to-user trust)",
                "defend, indemnify, hold harmless"
            ],
            "good": [
                "info given about security practices",
                "you publish under a free license, not a bilateral one",
                "will notify before merger",
                "your personal data is used for limited purposes"
            ]
        },
        "class": "B"
    },
    "freeforums.org": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "foxnews.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "flickr.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": [
                "you can choose with whom you share content",
                "limited for purpose of same service",
                "you can choose the copyright license"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "flattr.com": {
        "score": 0,
        "all": {
            "bad": [
                "sets third-party cookies and/or ads"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "facebook.com": {
        "score": 100,
        "all": {
            "bad": [
                "pseudonym not allowed (not because of user-to-user trust)",
                "tracks you on other websites",
                "many third parties are involved in operating the service",
                "very broad",
                "your data is used for many purposes"
            ],
            "good": [
                "they state that you own your data",
                "user feedback is invited"
            ]
        },
        "match": {
            "bad": [
                "tracks you on other websites",
                "your data is used for many purposes"
            ],
            "good": []
        },
        "class": false
    },
    "evernote.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "envato.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "ebuddy.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "duckduckgo.com": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "duck.com": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "donttrack.us": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "privacyheroes.io": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "spreadprivacy.com": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "duckduckhack.com": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "privatebrowsingmyths.com": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "duck.co": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "cispaletter.org": {
        "score": -100,
        "all": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "match": {
            "bad": [],
            "good": [
                "no tracking"
            ]
        },
        "class": "A"
    },
    "dropbox.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "disqus.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": [
                "they will help you react to others infringing on your copyright"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "dictionary.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "delicious.com": {
        "score": 20,
        "all": {
            "bad": [
                "broad license including right to distribute through any media",
                "sets third-party cookies and/or ads",
                "may sell your data in merger",
                "only for your individual and non-commercial use"
            ],
            "good": [
                "third parties are bound by confidentiality obligations"
            ]
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": "D"
    },
    "delicious.com.au": {
        "score": 20,
        "all": {
            "bad": [
                "broad license including right to distribute through any media",
                "sets third-party cookies and/or ads",
                "may sell your data in merger",
                "only for your individual and non-commercial use"
            ],
            "good": [
                "third parties are bound by confidentiality obligations"
            ]
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": "D"
    },
    "coursera.org": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to rely on tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "couchsurfing.org": {
        "score": 20,
        "all": {
            "bad": [
                "your content stays licensed",
                "they can delete your account without prior notice and without a reason",
                "they become the owner of ideas you give them",
                "keep a license even after you close your account",
                "broader than necessary",
                "user needs to check tosback.org",
                "may sell your data in merger",
                "third-party cookies, but with opt-out instructions"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": false
    },
    "cnn.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "cnet.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "cloudant.com": {
        "score": 20,
        "all": {
            "bad": [
                "defend, indemnify, hold harmless",
                "user needs to check tosback.org",
                "no liability for unauthorized access",
                "may sell your data in merger",
                "sets third-party cookies and/or ads"
            ],
            "good": [
                "limited for purpose of same service",
                "they provide a way to export your data",
                "refund policy",
                "you publish under a free license, not a bilateral one",
                "they give 30 days notice before closing your account",
                "will warn about maintenance"
            ]
        },
        "match": {
            "bad": [
                "may sell your data in merger"
            ],
            "good": []
        },
        "class": "B"
    },
    "null": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "bitly.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "bearshare.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "bbc.com": {
        "score": 0,
        "all": {
            "bad": [
                "device fingerprinting"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "icloud.com": {
        "score": 0,
        "all": {
            "bad": [],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "apple.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "app.net": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to rely on tosback.org",
                "you may not scrape",
                "defend, indemnify, hold harmless"
            ],
            "good": [
                "user feedback is invited",
                "archives provided",
                "you can delete your content",
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "amazon.com": {
        "score": 110,
        "all": {
            "bad": [
                "may sell your data in merger",
                "targeted third-party advertising",
                "tracks you on other websites",
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [
                "may sell your data in merger",
                "targeted third-party advertising",
                "tracks you on other websites"
            ],
            "good": []
        },
        "class": false
    },
    "allrecipes.com": {
        "score": 0,
        "all": {
            "bad": [
                "user needs to check tosback.org"
            ],
            "good": []
        },
        "match": {
            "bad": [],
            "good": []
        },
        "class": false
    },
    "500px.com": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "class": "D"
    },
    "500px.me": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "class": "D"
    },
    "500px.org": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "class": "D"
    },
    "500px.net": {
        "score": 0,
        "all": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "match": {
            "bad": [
                "class action waiver",
                "responsible and indemnify",
                "they can delete your account without prior notice and without a reason",
                "broader than necessary"
            ],
            "good": [
                "easy to read",
                "pseudonyms allowed"
            ]
        },
        "class": "D"
    }
}

},{}],18:[function(require,module,exports){
"use strict";

var ATB_EPOCH = 1456290000000;
var ONE_WEEK = 604800000;
var ONE_DAY = 86400000;
var ONE_HOUR = 3600000;
var ONE_MINUTE = 60000;

/**
 * Returns an object with ATB
 * majorVersion and minorVersion
 *
 * majorVersion = # of weeks since noon EST on 2/24/16
 * minorVersion = # of days into the current week
 */
function getCurrentATB() {
    var d = new Date();
    var localTime = d.getTime();
    // convert local to UTC:
    var utcTime = localTime + d.getTimezoneOffset() * ONE_MINUTE;
    // convert to approximation of est using 5 hour offset so we
    // can compare to the DST start/stop date in eastern time and
    // determine whether it's DST or not.
    var est = new Date(utcTime + ONE_HOUR * -5);
    // First determine DST start/end day for Eastern Timezone.
    // It's always the 2nd Sunday in March. In 2016 it's 3/13/16 and 11/6/16, In 2017 it's 3/12/17 and 11/5/17, etc.
    var dstStartDay = 13 - (est.getFullYear() - 2016) % 6;
    var dstStopDay = 6 - (est.getFullYear() - 2016) % 6;
    // Once we have start/stop day for the current year, we can check whether the current day (based on est) is
    // within the EDT window:
    var isDST = (est.getMonth() > 2 || est.getMonth() === 2 && est.getDate() >= dstStartDay) && (est.getMonth() < 10 || est.getMonth() === 10 && est.getDate() < dstStopDay);
    // finally we need to adjust the epoch based on whether we're in EST or EDT, since
    // the constant ATB_EPOCH is in EST, when we're in EDT we need to subtract an
    // hour otherwise we'll be off by 1 hour when we try to calc the major/minor version #'s:
    var epoch = isDST ? ATB_EPOCH - ONE_HOUR : ATB_EPOCH;
    // time in ms since DST adjusted epoch:
    var timeSinceATBEpoch = localTime - epoch;

    var majorVersion = Math.ceil(timeSinceATBEpoch / ONE_WEEK);
    var minorVersion = Math.ceil(timeSinceATBEpoch % ONE_WEEK / ONE_DAY);
    var version = "v" + majorVersion + "-" + minorVersion;

    return { minorVersion: minorVersion, majorVersion: majorVersion, version: version };
}

function getDaysBetweenCohorts(cohort1, cohort2) {
    return 7 * (cohort2.majorVersion - cohort1.majorVersion) + (cohort2.minorVersion - cohort1.minorVersion);
}

module.exports = {
    getCurrentATB: getCurrentATB,
    getDaysBetweenCohorts: getDaysBetweenCohorts
};

},{}],19:[function(require,module,exports){
'use strict';

/**
 * DuckDuckGo's ATB pipeline to facilitate various experiments.
 * Please see https://duck.co/help/privacy/atb for more information.
 */

var settings = require('./settings.es6');
var parseUserAgentString = require('../shared-utils/parse-user-agent-string.es6');
var load = require('./load.es6');
var browserWrapper = require('./chrome-wrapper.es6');

var ATB_ERROR_COHORT = 'v1-1';
var ATB_FORMAT_RE = /(v\d+-\d(?:[a-z_]{2})?)$/;

// list of accepted params in ATB url
var ACCEPTED_URL_PARAMS = ['natb', 'cp', 'npi'];

var dev = false;

var ATB = function () {
    // regex to match ddg urls to add atb params to.
    // Matching subdomains, searches, and newsletter page
    var regExpAboutPage = /^https?:\/\/(\w+\.)?duckduckgo\.com\/(\?.*|about#newsletter)/;
    var ddgAtbURL = 'https://duckduckgo.com/atb.js?';

    return {
        updateSetAtb: function updateSetAtb() {
            var atbSetting = settings.getSetting('atb');
            var setAtbSetting = settings.getSetting('set_atb');

            var errorParam = '';

            // client shouldn't have a falsy ATB value,
            // so mark them as having gone into an errored state
            // next time they won't send the e=1 param
            if (!atbSetting) {
                atbSetting = ATB_ERROR_COHORT;
                settings.updateSetting('atb', ATB_ERROR_COHORT);
                errorParam = '&e=1';
            }

            var randomValue = Math.ceil(Math.random() * 1e7);
            var url = '' + ddgAtbURL + randomValue + '&atb=' + atbSetting + '&set_atb=' + setAtbSetting + errorParam;

            return load.JSONfromExternalFile(url).then(function (res) {
                settings.updateSetting('set_atb', res.data.version);

                if (res.data.updateVersion) {
                    settings.updateSetting('atb', res.data.updateVersion);
                }
            });
        },

        redirectURL: function redirectURL(request) {
            if (request.url.search(regExpAboutPage) !== -1) {
                if (request.url.indexOf('atb=') !== -1) {
                    return;
                }

                var atbSetting = settings.getSetting('atb');

                if (!atbSetting) {
                    return;
                }

                // handle anchor tags for pages like about#newsletter
                var urlParts = request.url.split('#');
                var newURL = request.url;
                var anchor = '';

                // if we have an anchor tag
                if (urlParts.length === 2) {
                    newURL = urlParts[0];
                    anchor = '#' + urlParts[1];
                }

                if (request.url.indexOf('?') !== -1) {
                    newURL += '&';
                } else {
                    newURL += '?';
                }

                newURL += 'atb=' + atbSetting + anchor;

                return { redirectUrl: newURL };
            }
        },

        setInitialVersions: function setInitialVersions(numTries) {
            numTries = numTries || 0;
            if (settings.getSetting('atb') || numTries > 5) return Promise.resolve();

            var randomValue = Math.ceil(Math.random() * 1e7);
            var url = ddgAtbURL + randomValue;

            return load.JSONfromExternalFile(url).then(function (res) {
                settings.updateSetting('atb', res.data.version);
            }, function () {
                console.log('couldn\'t reach atb.js for initial server call, trying again');
                numTries += 1;

                return new Promise(function (resolve) {
                    setTimeout(resolve, 500);
                }).then(function () {
                    return ATB.setInitialVersions(numTries);
                });
            });
        },

        finalizeATB: function finalizeATB(params) {
            var atb = settings.getSetting('atb');

            // build query string when atb param wasn't acquired from any URLs
            var paramString = params && params.has('atb') ? params.toString() : 'atb=' + atb;

            // make this request only once
            if (settings.getSetting('extiSent')) return;

            settings.updateSetting('extiSent', true);
            settings.updateSetting('set_atb', atb);

            // just a GET request, we only care that the request was made
            load.url('https://duckduckgo.com/exti/?' + paramString);
        },

        // iterate over a list of accepted params, and retrieve them from a URL
        // builds a new query string containing only accepted params
        getAcceptedParamsFromURL: function getAcceptedParamsFromURL(url) {
            var validParams = new URLSearchParams();
            var parsedParams = new URL(url).searchParams;

            ACCEPTED_URL_PARAMS.forEach(function (param) {
                if (parsedParams.has(param)) {
                    validParams.append(param === 'natb' ? 'atb' : param, parsedParams.get(param));
                }
            });

            // Only return params if URL contains valid atb value
            if (validParams.has('atb') && ATB_FORMAT_RE.test(validParams.get('atb'))) {
                return validParams;
            }

            return new URLSearchParams();
        },

        updateATBValues: function updateATBValues() {
            // wait until settings is ready to try and get atb from the page
            return settings.ready().then(ATB.setInitialVersions).then(browserWrapper.getDDGTabUrls).then(function (urls) {
                var atb = void 0;
                var params = void 0;

                urls.some(function (url) {
                    params = ATB.getAcceptedParamsFromURL(url);
                    atb = params.has('atb') && params.get('atb');
                    return !!atb;
                });

                if (atb) {
                    settings.updateSetting('atb', atb);
                    if (params && params.has('npi')) {
                        settings.updateSetting('isMultiStepOnboarding', true);
                    }
                }

                ATB.finalizeATB(params);
            });
        },

        openPostInstallPage: function openPostInstallPage() {
            // only show post install page on install if:
            // - the user wasn't already looking at the app install page
            // - the user hasn't seen the page before
            settings.ready().then(function () {
                // Special case for the cross product promotion on desktop (cppd) experiment
                if (settings.getSetting('isMultiStepOnboarding')) {
                    // We find the tab containing the cross product promotion modal
                    // and inject a content script that will notify the page that the
                    // extension was successfully installed
                    // Note: that we don't know on which window that tab is
                    chrome.tabs.query({}, function (tabs) {
                        var tab = tabs.find(function (tab) {
                            var _ref = new URL(tab.url),
                                hostname = _ref.hostname,
                                searchParams = _ref.searchParams;

                            return hostname.split('.').slice(-2).join('.') === 'duckduckgo.com' && searchParams.has('natb') && searchParams.has('npi');
                        });

                        var file = 'public/js/content-scripts/onboarding.js';
                        if (tab) {
                            chrome.tabs.highlight({
                                tabs: [tab.index],
                                windowId: tab.windowId
                            }, function () {
                                chrome.tabs.executeScript(tab.id, { file: file });
                            });
                        }
                    });
                } else {
                    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                        var domain = tabs && tabs[0] ? tabs[0].url : '';
                        if (ATB.canShowPostInstall(domain)) {
                            settings.updateSetting('hasSeenPostInstall', true);
                            var postInstallURL = 'https://duckduckgo.com/app?post=1';
                            var atb = settings.getSetting('atb');
                            postInstallURL += atb ? '&atb=' + atb : '';
                            chrome.tabs.create({
                                url: postInstallURL
                            });
                        }
                    });
                }
            });
        },

        canShowPostInstall: function canShowPostInstall(domain) {
            var regExpPostInstall = /duckduckgo\.com\/app/;
            var regExpSoftwarePage = /duckduckgo\.com\/software/;

            if (!(domain && settings)) return false;

            return !settings.getSetting('hasSeenPostInstall') && !domain.match(regExpPostInstall) && !domain.match(regExpSoftwarePage);
        },

        getSurveyURL: function getSurveyURL() {
            var url = ddgAtbURL + Math.ceil(Math.random() * 1e7) + '&uninstall=1&action=survey';
            var atb = settings.getSetting('atb');
            var setAtb = settings.getSetting('set_atb');
            if (atb) url += '&atb=' + atb;
            if (setAtb) url += '&set_atb=' + setAtb;

            var browserInfo = parseUserAgentString();
            var browserName = browserInfo.browser;
            var browserVersion = browserInfo.version;
            var extensionVersion = browserWrapper.getExtensionVersion();
            if (browserName) url += '&browser=' + browserName;
            if (browserVersion) url += '&bv=' + browserVersion;
            if (extensionVersion) url += '&v=' + extensionVersion;
            if (dev) url += '&test=1';

            return url;
        },

        setDevMode: function setDevMode() {
            dev = true;
        }
    };
}();

settings.ready().then(function () {
    // set initial uninstall url
    browserWrapper.setUninstallURL(ATB.getSurveyURL());
});

module.exports = ATB;

},{"../shared-utils/parse-user-agent-string.es6":44,"./chrome-wrapper.es6":22,"./load.es6":33,"./settings.es6":38}],20:[function(require,module,exports){
'use strict';

/*
 * Copyright (C) 2012, 2016 DuckDuckGo, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// NOTE: this needs to be the first thing that's require()d when the extension loads.
// otherwise FF might miss the onInstalled event
var events = require('./chrome-events.es6');
var settings = require('./settings.es6');

settings.ready().then(function () {
  // clearing last search on browser startup
  settings.updateSetting('last_search', '');

  var os = 'o';
  if (window.navigator.userAgent.indexOf('Windows') !== -1) os = 'w';
  if (window.navigator.userAgent.indexOf('Mac') !== -1) os = 'm';
  if (window.navigator.userAgent.indexOf('Linux') !== -1) os = 'l';

  localStorage['os'] = os;

  events.onStartup();
});

},{"./chrome-events.es6":21,"./settings.es6":38}],21:[function(require,module,exports){
'use strict';

/**
 * NOTE: this needs to be the first listener that's added
 *
 * on FF, we might actually miss the onInstalled event
 * if we do too much before adding it
 */
var ATB = require('./atb.es6');
var utils = require('./utils.es6');
var experiment = require('./experiments.es6');
var browser = utils.getBrowserName();

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason.match(/install/)) {
        ATB.updateATBValues().then(ATB.openPostInstallPage).then(function () {
            if (browser === 'chrome') {
                experiment.setActiveExperiment();
            }
        });
    } else if (details.reason.match(/update/) && browser === 'chrome') {
        experiment.setActiveExperiment();
    }
});

/**
 * REQUESTS
 */

var redirect = require('./redirect.es6');
var tabManager = require('./tab-manager.es6');
var pixel = require('./pixel.es6');
var https = require('./https.es6');
var constants = require('../../data/constants');
var requestListenerTypes = utils.getUpdatedRequestListenerTypes();

// Shallow copy of request types
// And add beacon type based on browser, so we can block it
chrome.webRequest.onBeforeRequest.addListener(redirect.handleRequest, {
    urls: ['<all_urls>'],
    types: requestListenerTypes
}, ['blocking']);

chrome.webRequest.onHeadersReceived.addListener(function (request) {
    if (request.type === 'main_frame') {
        tabManager.updateTabUrl(request);
    }

    if (/^https?:\/\/(.*?\.)?duckduckgo.com\/\?/.test(request.url)) {
        // returns a promise
        return ATB.updateSetAtb(request);
    }
}, {
    urls: ['<all_urls>']
});

/**
 * Web Navigation
 */
// keep track of URLs that the browser navigates to.
//
// this is currently meant to supplement tabManager.updateTabUrl() above:
// tabManager.updateTabUrl only fires when a tab has finished loading with a 200,
// which misses a couple of edge cases like browser special pages
// and Gmail's weird redirect which returns a 200 via a service worker
chrome.webNavigation.onCommitted.addListener(function (details) {
    // ignore navigation on iframes
    if (details.frameId !== 0) return;

    var tab = tabManager.get({ tabId: details.tabId });

    if (!tab) return;

    tab.updateSite(details.url);
});

/**
 * TABS
 */

var Companies = require('./companies.es6');

chrome.tabs.onUpdated.addListener(function (id, info) {
    // sync company data to storage when a tab finishes loading
    if (info.status === 'complete') {
        Companies.syncToStorage();
    }

    tabManager.createOrUpdateTab(id, info);
});

chrome.tabs.onRemoved.addListener(function (id, info) {
    // remove the tab object
    tabManager.delete(id);
});

// message popup to close when the active tab changes. this can send an error message when the popup is not open. check lastError to hide it
chrome.tabs.onActivated.addListener(function () {
    return chrome.runtime.sendMessage({ closePopup: true }, function () {
        return chrome.runtime.lastError;
    });
});

// search via omnibox
chrome.omnibox.onInputEntered.addListener(function (text) {
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function (tabs) {
        chrome.tabs.update(tabs[0].id, {
            url: 'https://duckduckgo.com/?q=' + encodeURIComponent(text) + '&bext=' + localStorage['os'] + 'cl'
        });
    });
});

/**
 * MESSAGES
 */

var settings = require('./settings.es6');
var browserWrapper = require('./chrome-wrapper.es6');

// handle any messages that come from content/UI scripts
// returning `true` makes it possible to send back an async response
chrome.runtime.onMessage.addListener(function (req, sender, res) {
    if (sender.id !== chrome.runtime.id) return;

    if (req.getCurrentTab) {
        utils.getCurrentTab().then(function (tab) {
            res(tab);
        });

        return true;
    }

    if (req.updateSetting) {
        var name = req.updateSetting['name'];
        var value = req.updateSetting['value'];
        settings.ready().then(function () {
            settings.updateSetting(name, value);
        });
    } else if (req.getSetting) {
        var _name = req.getSetting['name'];
        settings.ready().then(function () {
            res(settings.getSetting(_name));
        });

        return true;
    }

    // popup will ask for the browser type then it is created
    if (req.getBrowser) {
        res(utils.getBrowserName());
        return true;
    }

    if (req.getExtensionVersion) {
        res(browserWrapper.getExtensionVersion());
        return true;
    }

    if (req.getTopBlocked) {
        res(Companies.getTopBlocked(req.getTopBlocked));
        return true;
    } else if (req.getTopBlockedByPages) {
        res(Companies.getTopBlockedByPages(req.getTopBlockedByPages));
        return true;
    } else if (req.resetTrackersData) {
        Companies.resetData();
    }

    if (req.whitelisted) {
        tabManager.whitelistDomain(req.whitelisted);
    } else if (req.whitelistOptIn) {
        tabManager.setGlobalWhitelist('whitelistOptIn', req.whitelistOptIn.domain, req.whitelistOptIn.value);
    } else if (req.getTab) {
        res(tabManager.get({ tabId: req.getTab }));
        return true;
    } else if (req.getSiteGrade) {
        var tab = tabManager.get({ tabId: req.getSiteGrade });
        var grade = {};

        if (!tab.site.specialDomainName) {
            grade = tab.site.grade.get();
        }

        res(grade);
        return true;
    }

    if (req.firePixel) {
        var fireArgs = req.firePixel;
        if (fireArgs.constructor !== Array) {
            fireArgs = [req.firePixel];
        }
        res(pixel.fire.apply(null, fireArgs));
        return true;
    }
});

/**
 * Fingerprint Protection
 */

// Inject fingerprint protection into sites when
// they are not whitelisted.
chrome.webNavigation.onCommitted.addListener(function (details) {
    var activeExperiment = settings.getSetting('activeExperiment');

    if (activeExperiment) {
        var _experiment = settings.getSetting('experimentData');

        if (_experiment && _experiment.fingerprint_protection) {
            var whitelisted = settings.getSetting('whitelisted');
            var tabURL = new URL(details.url) || {};
            if (!whitelisted || !whitelisted[tabURL.hostname]) {
                var scriptDetails = {
                    'file': '/data/fingerprint-protection.js',
                    'runAt': 'document_start',
                    'allFrames': true,
                    'matchAboutBlank': true
                };
                chrome.tabs.executeScript(details.tabId, scriptDetails);
            }
        }
    }
});

/**
 * ALARMS
 */

var httpsStorage = require('./storage/https.es6');
var httpsService = require('./https-service.es6');
var tdsStorage = require('./storage/tds.es6');
var trackers = require('./trackers.es6');

// recheck tracker and https lists every 12 hrs
chrome.alarms.create('updateHTTPSLists', { periodInMinutes: 12 * 60 });
// tracker lists / whitelists are 30 minutes
chrome.alarms.create('updateLists', { periodInMinutes: 30 });
// update uninstall URL every 10 minutes
chrome.alarms.create('updateUninstallURL', { periodInMinutes: 10 });
// remove expired HTTPS service entries
chrome.alarms.create('clearExpiredHTTPSServiceCache', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(function (alarmEvent) {
    if (alarmEvent.name === 'updateHTTPSLists') {
        settings.ready().then(function () {
            httpsStorage.getLists(constants.httpsLists).then(function (lists) {
                return https.setLists(lists);
            }).catch(function (e) {
                return console.log(e);
            });
        });
    } else if (alarmEvent.name === 'updateUninstallURL') {
        chrome.runtime.setUninstallURL(ATB.getSurveyURL());
    } else if (alarmEvent.name === 'updateLists') {
        settings.ready().then(function () {
            https.sendHttpsUpgradeTotals();
        });

        tdsStorage.getLists().then(function (lists) {
            return trackers.setLists(lists);
        }).catch(function (e) {
            return console.log(e);
        });
    } else if (alarmEvent.name === 'clearExpiredHTTPSServiceCache') {
        httpsService.clearExpiredCache();
    }
});

/**
 * on start up
 */
var onStartup = function onStartup() {
    chrome.tabs.query({ currentWindow: true, status: 'complete' }, function (savedTabs) {
        for (var i = 0; i < savedTabs.length; i++) {
            var tab = savedTabs[i];

            if (tab.url) {
                tabManager.create(tab);
            }
        }
    });

    settings.ready().then(function () {
        experiment.setActiveExperiment();

        httpsStorage.getLists(constants.httpsLists).then(function (lists) {
            return https.setLists(lists);
        }).catch(function (e) {
            return console.log(e);
        });

        tdsStorage.getLists().then(function (lists) {
            return trackers.setLists(lists);
        }).catch(function (e) {
            return console.log(e);
        });

        https.sendHttpsUpgradeTotals();

        Companies.buildFromStorage();
    });
};

// Fire pixel on https upgrade failures to allow bad data to be removed from lists
chrome.webRequest.onErrorOccurred.addListener(function (e) {
    if (!(e.type === 'main_frame')) return;

    var tab = tabManager.get({ tabId: e.tabId });

    // We're only looking at failed main_frame upgrades. A tab can send multiple
    // main_frame request errors so we will only look at the first one then set tab.hasHttpsError.
    if (!tab || !tab.mainFrameUpgraded || tab.hasHttpsError) {
        return;
    }

    if (e.error && e.url.match(/^https/)) {
        var errCode = constants.httpsErrorCodes[e.error];
        tab.hasHttpsError = true;

        if (errCode) {
            https.incrementUpgradeCount('failedUpgrades');
            var url = new URL(e.url);
            pixel.fire('ehd', {
                url: '' + encodeURIComponent(url.hostname),
                error: errCode
            });
        }
    }
}, { urls: ['<all_urls>'] });

module.exports = {
    onStartup: onStartup
};

},{"../../data/constants":14,"./atb.es6":19,"./chrome-wrapper.es6":22,"./companies.es6":29,"./experiments.es6":30,"./https-service.es6":31,"./https.es6":32,"./pixel.es6":35,"./redirect.es6":37,"./settings.es6":38,"./storage/https.es6":39,"./storage/tds.es6":40,"./tab-manager.es6":41,"./trackers.es6":42,"./utils.es6":43}],22:[function(require,module,exports){
'use strict';

var getExtensionURL = function getExtensionURL(path) {
    return chrome.extension.getURL(path);
};

var getExtensionVersion = function getExtensionVersion() {
    var manifest = window.chrome && chrome.runtime.getManifest();
    return manifest.version;
};

var setBadgeIcon = function setBadgeIcon(badgeData) {
    chrome.browserAction.setIcon(badgeData);
};

var syncToStorage = function syncToStorage(data) {
    chrome.storage.local.set(data, function () {});
};

var getFromStorage = function getFromStorage(key, cb) {
    chrome.storage.local.get(key, function (result) {
        cb(result[key]);
    });
};

var getExtensionId = function getExtensionId() {
    return chrome.runtime.id;
};

var notifyPopup = function notifyPopup(message) {
    // this can send an error message when the popup is not open. check lastError to hide it
    chrome.runtime.sendMessage(message, function () {
        return chrome.runtime.lastError;
    });
};

var normalizeTabData = function normalizeTabData(tabData) {
    return tabData;
};

var mergeSavedSettings = function mergeSavedSettings(settings, results) {
    return Object.assign(settings, results);
};

var getDDGTabUrls = function getDDGTabUrls() {
    return new Promise(function (resolve) {
        chrome.tabs.query({ url: 'https://*.duckduckgo.com/*' }, function (tabs) {
            tabs = tabs || [];

            tabs.forEach(function (tab) {
                chrome.tabs.insertCSS(tab.id, {
                    file: '/public/css/noatb.css'
                });
            });

            resolve(tabs.map(function (tab) {
                return tab.url;
            }));
        });
    });
};

var setUninstallURL = function setUninstallURL(url) {
    chrome.runtime.setUninstallURL(url);
};

var changeTabURL = function changeTabURL(tabId, url) {
    return new Promise(function (resolve) {
        chrome.tabs.update(tabId, { url: url }, resolve);
    });
};

module.exports = {
    getExtensionURL: getExtensionURL,
    getExtensionVersion: getExtensionVersion,
    setBadgeIcon: setBadgeIcon,
    syncToStorage: syncToStorage,
    getFromStorage: getFromStorage,
    notifyPopup: notifyPopup,
    normalizeTabData: normalizeTabData,
    mergeSavedSettings: mergeSavedSettings,
    getDDGTabUrls: getDDGTabUrls,
    setUninstallURL: setUninstallURL,
    getExtensionId: getExtensionId,
    changeTabURL: changeTabURL
};

},{}],23:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Company = function () {
    function Company(c) {
        _classCallCheck(this, Company);

        this.name = c.name;
        this.count = 0;
        this.pagesSeenOn = 0;
        this.displayName = c.displayName || c.name;
    }

    _createClass(Company, [{
        key: "incrementCount",
        value: function incrementCount() {
            this.count += 1;
        }
    }, {
        key: "incrementPagesSeenOn",
        value: function incrementPagesSeenOn() {
            this.pagesSeenOn += 1;
        }
    }, {
        key: "get",
        value: function get(property) {
            return this[property];
        }
    }, {
        key: "set",
        value: function set(property, val) {
            this[property] = val;
        }
    }]);

    return Company;
}();

module.exports = Company;

},{}],24:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var utils = require('../utils.es6');
var pixel = require('../pixel.es6');
var constants = require('../../../data/constants');

var MAINFRAME_RESET_MS = 3000;
var REQUEST_REDIRECT_LIMIT = 7;

/**
 * This class protects users from accidentally being sent into a redirect loop
 * if a site we've included into our HTTPS list redirects them back to HTTP.
 *
 * Every redirect we perform on a tab gets registered against an instance of this class.
 * If we hit too many redirects for a request, we block it via canRedirect().
 */

var HttpsRedirects = function () {
    function HttpsRedirects() {
        _classCallCheck(this, HttpsRedirects);

        this.failedUpgradeHosts = {};
        this.redirectCounts = {};

        this.mainFrameRedirect = null;
        this.clearMainFrameTimeout = null;
    }

    _createClass(HttpsRedirects, [{
        key: 'registerRedirect',
        value: function registerRedirect(request) {
            if (request.type === 'main_frame') {
                if (this.mainFrameRedirect && request.url === this.mainFrameRedirect.url) {
                    this.mainFrameRedirect.count += 1;
                    return;
                }

                this.mainFrameRedirect = {
                    url: request.url,
                    time: Date.now(),
                    count: 0
                };

                clearTimeout(this.clearMainFrameTimeout);
                this.clearMainFrameTimeout = setTimeout(this.resetMainFrameRedirect, MAINFRAME_RESET_MS);
            } else {
                this.redirectCounts[request.requestId] = this.redirectCounts[request.requestId] || 0;
                this.redirectCounts[request.requestId] += 1;
            }
        }
    }, {
        key: 'canRedirect',
        value: function canRedirect(request) {
            var canRedirect = true;

            var hostname = utils.extractHostFromURL(request.url, true);

            // this hostname previously failed, don't try to upgrade it
            if (this.failedUpgradeHosts[hostname]) {
                console.log('HTTPS: not upgrading ' + request.url + ', hostname previously failed: ' + hostname);
                return false;
            }

            /**
             * Redirect loop detection is different when the request is for the main frame vs
             * any other request on the page.
             *
             * For main frames, the redirect loop could happen as part of several distinct hits to the same URL
             * (e.g. we saw a case where a site returned 200 and the redirected to HTTP via Javascript)
             *
             * To prevent this, we count main frame hits against the same URL within a short period of time,
             * and if they hit a certain threshold, we block any further attempts to upgrade this URL.
             *
             * We need to keep this threshold high, otherwise users can accidentally trigger redirect protection
             * by trying to open the same URL repeatedly before it's loaded.
             */
            if (request.type === 'main_frame') {
                if (this.mainFrameRedirect && this.mainFrameRedirect.url === request.url) {
                    var timeSinceFirstHit = Date.now() - this.mainFrameRedirect.time;

                    if (timeSinceFirstHit < MAINFRAME_RESET_MS && this.mainFrameRedirect.count >= REQUEST_REDIRECT_LIMIT) {
                        canRedirect = false;
                    }
                }
            } else if (this.redirectCounts[request.requestId]) {
                /**
                 * For other requests, the server would likely just do a 301 redirect
                 * to the HTTP version - so we can use the requestId as an identifier
                 */
                canRedirect = this.redirectCounts[request.requestId] < REQUEST_REDIRECT_LIMIT;
            }

            // remember this hostname as previously failed, don't try to upgrade it
            if (!canRedirect) {
                if (request.type === 'main_frame') {
                    var encodedHostname = encodeURIComponent(hostname);
                    var errCode = constants.httpsErrorCodes['downgrade_redirect_loop'];
                    // Fire pixel on https upgrade failures to allow bad data to be removed from lists
                    pixel.fire('ehd', { 'url': encodedHostname, error: errCode });
                }

                this.failedUpgradeHosts[hostname] = true;
                console.log('HTTPS: not upgrading, redirect loop protection kicked in for url: ' + request.url);
            }

            return canRedirect;
        }

        /**
         * We regenerate tab objects every time a new main_frame request is made.
         *
         * persistMainFrameRedirect() is used whenever a tab object is regenerated,
         * so we can maintain redirect loop protection across multiple main_frame requests
         */

    }, {
        key: 'persistMainFrameRedirect',
        value: function persistMainFrameRedirect(redirectData) {
            if (!redirectData) {
                return;
            }

            // shallow copy to prevent pass-by-reference issues
            this.mainFrameRedirect = Object.assign({}, redirectData);

            // setup reset timeout again
            this.clearMainFrameTimeout = setTimeout(this.resetMainFrameRedirect, MAINFRAME_RESET_MS);
        }
    }, {
        key: 'getMainFrameRedirect',
        value: function getMainFrameRedirect() {
            return this.mainFrameRedirect;
        }
    }, {
        key: 'resetMainFrameRedirect',
        value: function resetMainFrameRedirect() {
            clearTimeout(this.clearMainFrameTimeout);
            this.mainFrameRedirect = null;
        }
    }]);

    return HttpsRedirects;
}();

module.exports = HttpsRedirects;

},{"../../../data/constants":14,"../pixel.es6":35,"../utils.es6":43}],25:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Each Site creates its own Grade instance. The attributes
 * of the Grade are updated as we process new events e.g. trackers
 * blocked or https status.
 *
 * The Grade attributes are then used generate a site
 * privacy grade used in the popup.
 */
var settings = require('../settings.es6');
var utils = require('../utils.es6');
var tdsStorage = require('./../storage/tds.es6');
var privacyPractices = require('../privacy-practices.es6');
var Grade = require('@duckduckgo/privacy-grade').Grade;
var browserWrapper = require('../chrome-wrapper.es6');
var tldts = require('tldts');

var Site = function () {
    function Site(url) {
        _classCallCheck(this, Site);

        this.url = url || '';

        var domain = utils.extractHostFromURL(this.url) || '';
        domain = domain.toLowerCase();

        this.domain = domain;
        this.trackerUrls = [];
        this.grade = new Grade();
        this.whitelisted = false; // user-whitelisted sites; applies to all privacy features
        this.whitelistOptIn = false;
        this.setWhitelistStatusFromGlobal(domain);

        this.isBroken = this.checkBrokenSites(domain); // broken sites reported to github repo
        this.didIncrementCompaniesData = false;

        this.tosdr = privacyPractices.getTosdr(domain);

        this.parentEntity = utils.findParent(domain) || '';
        var parent = tdsStorage.tds.entities[this.parentEntity];
        this.parentPrevalence = parent ? parent.prevalence : 0;

        if (this.parentEntity && this.parentPrevalence) {
            this.grade.setParentEntity(this.parentEntity, this.parentPrevalence);
        }

        this.grade.setPrivacyScore(privacyPractices.getTosdrScore(domain, parent));

        if (this.url.match(/^https:\/\//)) {
            this.grade.setHttps(true, true);
        }

        // set specialDomainName when the site is created
        this.specialDomainName = this.getSpecialDomain();
    }

    /*
     * check to see if this is a broken site reported on github
    */


    _createClass(Site, [{
        key: 'checkBrokenSites',
        value: function checkBrokenSites(domain) {
            if (!tdsStorage || !tdsStorage.brokenSiteList) return;

            var parsedDomain = tldts.parse(domain);
            var hostname = parsedDomain.hostname || domain;

            // If root domain in temp whitelist, return true
            return tdsStorage.brokenSiteList.some(function (brokenSiteDomain) {
                if (brokenSiteDomain) {
                    return hostname.match(new RegExp(brokenSiteDomain + '$'));
                }
            });
        }

        /*
         * When site objects are created we check the stored whitelists
         * and set the new site whitelist statuses
         */

    }, {
        key: 'setWhitelistStatusFromGlobal',
        value: function setWhitelistStatusFromGlobal() {
            var _this = this;

            var globalwhitelists = ['whitelisted', 'whitelistOptIn'];
            globalwhitelists.map(function (name) {
                var list = settings.getSetting(name) || {};
                _this.setWhitelisted(name, list[_this.domain]);
            });
        }
    }, {
        key: 'setWhitelisted',
        value: function setWhitelisted(name, value) {
            this[name] = value;
        }

        /*
         * Send message to the popup to rerender the whitelist
         */

    }, {
        key: 'notifyWhitelistChanged',
        value: function notifyWhitelistChanged() {
            // this can send an error message when the popup is not open check lastError to hide it
            chrome.runtime.sendMessage({ 'whitelistChanged': true }, function () {
                return chrome.runtime.lastError;
            });
        }
    }, {
        key: 'isWhiteListed',
        value: function isWhiteListed() {
            return this.whitelisted;
        }
    }, {
        key: 'addTracker',
        value: function addTracker(t) {
            if (this.trackerUrls.indexOf(t.tracker.domain) === -1) {
                this.trackerUrls.push(t.tracker.domain);
                var entityPrevalence = tdsStorage.tds.entities[t.tracker.owner.name].prevalence;

                if (t.action.match(/block|redirect/)) {
                    this.grade.addEntityBlocked(t.tracker.owner.name, entityPrevalence);
                } else {
                    this.grade.addEntityNotBlocked(t.tracker.owner.name, entityPrevalence);
                }
            }
        }

        /*
         * specialDomain
         *
         * determine if domain is a special page
         *
         * returns: a useable special page description string.
         *          or null if not a special page.
         */

    }, {
        key: 'getSpecialDomain',
        value: function getSpecialDomain() {
            var extensionId = browserWrapper.getExtensionId();
            var url = this.url;
            var localhostName = 'localhost';
            var domain = this.domain;

            if (url === '') {
                return 'new tab';
            }

            // Both 'localhost' and the loopback ip have to be specified
            // since they're treated as different domains
            if (domain === localhostName || domain.match(/^127\.0\.0\.1/)) {
                return localhostName;
            }

            // Handle non-routable meta-address
            if (domain.match(/^0\.0\.0\.0/)) {
                return domain;
            }

            // for some reason chrome passes this back from webNavigation events
            // for new tabs instead of chrome://newtab
            //
            // "local-ntp" -> "local new tab page"
            if (url.match(/^chrome-search:\/\/local-ntp/)) {
                return 'new tab';
            }

            // for special pages with a protocol, just return whatever
            // word comes after the protocol
            // e.g. 'chrome://extensions' -> 'extensions'
            if (url.match(/^chrome:\/\//) || url.match(/^vivaldi:\/\//)) {
                if (domain === 'newtab') {
                    domain = 'new tab';
                }

                return domain;
            }

            // FF-style about: pages don't get their domains parsed properly
            // so just extract the bit after about:
            if (url.match(/^about:/)) {
                domain = url.match(/^about:([a-z-]+)/)[1];
                return domain;
            }

            // extension pages
            if (url.match(/^(chrome|moz)-extension:\/\//)) {
                // this is our own extension, let's try and get a meaningful description
                if (domain === extensionId) {
                    var matches = url.match(/^(?:chrome|moz)-extension:\/\/[^/]+\/html\/([a-z-]+).html/);

                    if (matches && matches[1]) {
                        return matches[1];
                    }
                }

                // if we failed, or this is not our extension, return a generic message
                return 'extension page';
            }

            return null;
        }
    }]);

    return Site;
}();

module.exports = Site;

},{"../chrome-wrapper.es6":22,"../privacy-practices.es6":36,"../settings.es6":38,"../utils.es6":43,"./../storage/tds.es6":40,"@duckduckgo/privacy-grade":1,"tldts":13}],26:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* This class contains information about what trackers and sites
 * are on a given tab:
 *  id: Chrome tab id
 *  url: url of the tab
 *  site: ref to a Site object
 *  trackers: {object} all trackers requested on page/tab (listed by company)
 *  trackersBlocked: {object} tracker instances we blocked on page/tab (listed by company)
 *      both `trackers` and `trackersBlocked` objects are in this format:
 *      {
 *         '<companyName>': {
 *              parentCompany: ref to a Company object
 *              urls: all unique tracker urls we have seen for this company
 *              count: total number of requests to unique tracker urls for this company
 *          }
 *      }
 */
var gradeIconLocations = {
    'A': 'img/toolbar-rating-a.svg',
    'B+': 'img/toolbar-rating-b-plus.svg',
    'B': 'img/toolbar-rating-b.svg',
    'C+': 'img/toolbar-rating-c-plus.svg',
    'C': 'img/toolbar-rating-c.svg',
    'D': 'img/toolbar-rating-d.svg',
    // we don't currently show the D- grade
    'D-': 'img/toolbar-rating-d.svg',
    'F': 'img/toolbar-rating-f.svg'
};

var Site = require('./site.es6');
var Tracker = require('./tracker.es6');
var HttpsRedirects = require('./https-redirects.es6');
var Companies = require('../companies.es6');
var browserWrapper = require('./../chrome-wrapper.es6');

var Tab = function () {
    function Tab(tabData) {
        _classCallCheck(this, Tab);

        this.id = tabData.id || tabData.tabId;
        this.trackers = {};
        this.trackersBlocked = {};
        this.url = tabData.url;
        this.upgradedHttps = false;
        this.hasHttpsError = false;
        this.mainFrameUpgraded = false;
        this.requestId = tabData.requestId;
        this.status = tabData.status;
        this.site = new Site(this.url);
        this.httpsRedirects = new HttpsRedirects();
        this.statusCode = null; // statusCode is set when headers are recieved in tabManager.js
        this.stopwatch = {
            begin: Date.now(),
            end: null,
            completeMs: null
        };
        this.resetBadgeIcon();
    }

    _createClass(Tab, [{
        key: 'resetBadgeIcon',
        value: function resetBadgeIcon() {
            // set the new tab icon to the dax logo
            browserWrapper.setBadgeIcon({ path: 'img/icon_48.png', tabId: this.id });
        }
    }, {
        key: 'updateBadgeIcon',
        value: function updateBadgeIcon(target) {
            if (this.site.specialDomainName) return;

            if (this.site.isBroken) {
                this.resetBadgeIcon();
            } else {
                var gradeIcon = void 0;
                var grade = this.site.grade.get();

                if (this.site.whitelisted) {
                    gradeIcon = gradeIconLocations[grade.site.grade];
                } else {
                    gradeIcon = gradeIconLocations[grade.enhanced.grade];
                }

                var badgeData = { path: gradeIcon, tabId: this.id };
                if (target) badgeData.target = target;

                browserWrapper.setBadgeIcon(badgeData);
            }
        }
    }, {
        key: 'updateSite',
        value: function updateSite(url) {
            if (this.site.url === url) return;

            this.url = url;
            this.site = new Site(url);

            // reset badge to dax whenever we go to a new site
            this.resetBadgeIcon();
        }
    }, {
        key: 'addToTrackers',


        // Store all trackers for a given tab even if we don't block them.
        value: function addToTrackers(t) {
            var tracker = this.trackers[t.tracker.owner.name];
            if (tracker) {
                tracker.increment();
                tracker.update(t);
            } else {
                var newTracker = new Tracker(t);
                this.trackers[t.tracker.owner.name] = newTracker;

                // first time we have seen this network tracker on the page
                if (t.tracker.owner.name !== 'unknown') Companies.countCompanyOnPage(t.tracker.owner);

                return newTracker;
            }
        }
    }, {
        key: 'addOrUpdateTrackersBlocked',
        value: function addOrUpdateTrackersBlocked(t) {
            var tracker = this.trackersBlocked[t.tracker.owner.name];
            if (tracker) {
                tracker.increment();
                tracker.update(t);
            } else {
                var newTracker = new Tracker(t);
                this.trackersBlocked[newTracker.parentCompany.name] = newTracker;
                return newTracker;
            }
        }
    }, {
        key: 'endStopwatch',
        value: function endStopwatch() {
            this.stopwatch.end = Date.now();
            this.stopwatch.completeMs = this.stopwatch.end - this.stopwatch.begin;
            console.log('tab.status: complete. site took ' + this.stopwatch.completeMs / 1000 + ' seconds to load.');
        }
    }]);

    return Tab;
}();

module.exports = Tab;

},{"../companies.es6":29,"./../chrome-wrapper.es6":22,"./https-redirects.es6":24,"./site.es6":25,"./tracker.es6":28}],27:[function(require,module,exports){
"use strict";

function TopBlocked() {
    this.data = [];
}

TopBlocked.prototype = {

    add: function add(element) {
        this.data.push(element);
    },

    getTop: function getTop(n, sortFunc) {
        this.sort(sortFunc);
        n = n || 10;
        return this.data.slice(0, n);
    },

    sort: function sort(sortFunc) {
        this.data.sort(sortFunc);
    },

    clear: function clear() {
        this.data = [];
    },

    setData: function setData(data) {
        this.data = data;
    }
};

module.exports = TopBlocked;

},{}],28:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Companies = require('../companies.es6');
var tdsStorage = require('../storage/tds.es6');

var Tracker = function () {
    function Tracker(t) {
        _classCallCheck(this, Tracker);

        this.parentCompany = Companies.get(t.tracker.owner.name);
        this.displayName = t.tracker.owner.displayName;
        this.prevalence = tdsStorage.tds.entities[t.tracker.owner.name].prevalence;
        this.urls = {};
        this.urls[t.fullTrackerDomain] = {
            isBlocked: this.isBlocked(t.action),
            reason: t.reason,
            categories: t.tracker.categories
        };
        this.count = 1; // request count
        this.type = t.type || '';
    }

    _createClass(Tracker, [{
        key: 'increment',
        value: function increment() {
            this.count += 1;
        }

        /* A parent company may try
         * to track you through many different entities.
         * We store a list of all unique urls here.
         */

    }, {
        key: 'update',
        value: function update(t) {
            if (!this.urls[t.fullTrackerDomain]) {
                this.urls[t.fullTrackerDomain] = {
                    isBlocked: this.isBlocked(t.action),
                    reason: t.reason,
                    categories: t.tracker.categories
                };
            }
        }
    }, {
        key: 'isBlocked',
        value: function isBlocked(action) {
            return !!action.match(/block|redirect/);
        }
    }]);

    return Tracker;
}();

module.exports = Tracker;

},{"../companies.es6":29,"../storage/tds.es6":40}],29:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var TopBlocked = require('./classes/top-blocked.es6');
var Company = require('./classes/company.es6');
var browserWrapper = require('./chrome-wrapper.es6');
var migrate = require('./migrate.es6');

var Companies = function () {
    var companyContainer = {};
    var topBlocked = new TopBlocked();
    var storageName = 'companyData';
    var totalPages = 0;
    var totalPagesWithTrackers = 0;
    var lastStatsResetDate = null;

    function sortByCount(a, b) {
        return companyContainer[b].count - companyContainer[a].count;
    }

    function sortByPages(a, b) {
        return companyContainer[b].pagesSeenOn - companyContainer[a].pagesSeenOn;
    }

    return {
        get: function get(name) {
            return companyContainer[name];
        },

        getTotalPages: function getTotalPages() {
            return totalPages;
        },

        add: function add(c) {
            if (!companyContainer[c.name]) {
                companyContainer[c.name] = new Company(c);
                topBlocked.add(c.name);
            }
            companyContainer[c.name].incrementCount();
            return companyContainer[c.name];
        },

        // This is used by tab.js to count only unique tracking networks on a tab
        countCompanyOnPage: function countCompanyOnPage(c) {
            if (!companyContainer[c.name]) {
                companyContainer[c.name] = new Company(c);
                topBlocked.add(c.name);
            }
            if (c.name !== 'unknown') companyContainer[c.name].incrementPagesSeenOn();
        },

        all: function all() {
            return Object.keys(companyContainer);
        },

        getTopBlocked: function getTopBlocked(n) {
            var topBlockedData = [];
            topBlocked.getTop(n, sortByCount).forEach(function (name) {
                var c = Companies.get(name);
                topBlockedData.push({ name: c.name, count: c.count, displayName: c.displayName });
            });

            return topBlockedData;
        },

        getTopBlockedByPages: function getTopBlockedByPages(n) {
            var topBlockedData = [];
            topBlocked.getTop(n, sortByPages).forEach(function (name) {
                var c = Companies.get(name);
                topBlockedData.push({
                    name: c.name,
                    displayName: c.displayName,
                    percent: Math.min(100, Math.round(c.pagesSeenOn / totalPages * 100))
                });
            });

            return {
                topBlocked: topBlockedData,
                totalPages: totalPages,
                pctPagesWithTrackers: Math.min(100, Math.round(totalPagesWithTrackers / totalPages * 100)),
                lastStatsResetDate: lastStatsResetDate
            };
        },

        setTotalPagesFromStorage: function setTotalPagesFromStorage(n) {
            if (n) totalPages = n;
        },

        setTotalPagesWithTrackersFromStorage: function setTotalPagesWithTrackersFromStorage(n) {
            if (n) totalPagesWithTrackers = n;
        },

        resetData: function resetData() {
            companyContainer = {};
            topBlocked.clear();
            totalPages = 0;
            totalPagesWithTrackers = 0;
            lastStatsResetDate = Date.now();
            Companies.syncToStorage();
            var resetDate = Companies.getLastResetDate();
            browserWrapper.notifyPopup({ 'didResetTrackersData': resetDate });
        },

        getLastResetDate: function getLastResetDate() {
            return lastStatsResetDate;
        },

        incrementTotalPages: function incrementTotalPages() {
            totalPages += 1;
            Companies.syncToStorage();
        },

        incrementTotalPagesWithTrackers: function incrementTotalPagesWithTrackers() {
            totalPagesWithTrackers += 1;
            Companies.syncToStorage();
        },

        syncToStorage: function syncToStorage() {
            var toSync = {};
            toSync[storageName] = companyContainer;
            browserWrapper.syncToStorage(toSync);
            browserWrapper.syncToStorage({ 'totalPages': totalPages });
            browserWrapper.syncToStorage({ 'totalPagesWithTrackers': totalPagesWithTrackers });
            browserWrapper.syncToStorage({ 'lastStatsResetDate': lastStatsResetDate });
        },

        sanitizeData: function sanitizeData(storageData) {
            if (storageData && storageData.hasOwnProperty('twitter')) {
                delete storageData.twitter;
            }
            return storageData;
        },

        buildFromStorage: function buildFromStorage() {
            browserWrapper.getFromStorage(storageName, function (storageData) {
                // uncomment for testing
                // storageData.twitter = {count: 10, name: 'twitter', pagesSeenOn: 10}
                storageData = Companies.sanitizeData(storageData);

                for (var company in storageData) {
                    var _migrate$migrateCompa = migrate.migrateCompanyData(company, storageData);

                    var _migrate$migrateCompa2 = _slicedToArray(_migrate$migrateCompa, 2);

                    company = _migrate$migrateCompa2[0];
                    storageData = _migrate$migrateCompa2[1];

                    var newCompany = Companies.add(storageData[company]);
                    newCompany.set('count', storageData[company].count || 0);
                    newCompany.set('pagesSeenOn', storageData[company].pagesSeenOn || 0);
                }
            });

            browserWrapper.getFromStorage('totalPages', function (n) {
                if (n) totalPages = n;
            });
            browserWrapper.getFromStorage('totalPagesWithTrackers', function (n) {
                if (n) totalPagesWithTrackers = n;
            });
            browserWrapper.getFromStorage('lastStatsResetDate', function (d) {
                if (d) {
                    lastStatsResetDate = d;
                } else {
                    // if 'lastStatsResetDate' not found, reset all data
                    // https://app.asana.com/0/0/460622849089890/f
                    Companies.resetData();
                }
            });
        }
    };
}();

module.exports = Companies;

},{"./chrome-wrapper.es6":22,"./classes/company.es6":23,"./classes/top-blocked.es6":27,"./migrate.es6":34}],30:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var settings = require('./settings.es6');
var atbUtils = require('./atb-utils.es6');
var retentionExperiments = require('../../data/experiments-out');
var ATB_FORMAT_RE = /(v\d+-\d(?:[a-z_]{2})?)$/;

var Experiment = function () {
    function Experiment() {
        _classCallCheck(this, Experiment);

        this.variant = '';
        this.atbVariant = '';
        this.activeExperiment = {};
    }

    _createClass(Experiment, [{
        key: 'getVariant',
        value: function getVariant() {
            var atbVal = settings.getSetting('atb');
            if (atbVal && atbVal.match(ATB_FORMAT_RE) && atbVal[atbVal.length - 2].match(/[a-z]/i)) {
                this.variant = atbVal[atbVal.length - 2];
            } else {
                this.variant = '_';
            }
            return this.variant;
        }
    }, {
        key: 'getATBVariant',
        value: function getATBVariant() {
            var atbVal = settings.getSetting('atb');
            if (atbVal && atbVal.match(ATB_FORMAT_RE) && atbVal[atbVal.length - 1].match(/[a-z]/i)) {
                this.atbVariant = atbVal[atbVal.length - 1];
            } else {
                this.atbVariant = '_';
            }
            return this.atbVariant;
        }
    }, {
        key: 'setActiveExperiment',
        value: function setActiveExperiment() {
            var _this = this;

            settings.ready().then(this.getVariant.bind(this)).then(this.getATBVariant.bind(this)).then(function () {
                var currentExp = settings.getSetting('activeExperiment');
                _this.activeExperiment = retentionExperiments[_this.variant] || {};

                // special case for existing users that were in an experiment before
                // we added the active property
                if (currentExp && !currentExp.hasOwnProperty('active')) {
                    currentExp.active = _this.activeExperiment.active;
                    settings.updateSetting('activeExperiment', currentExp);
                }

                // We already have an active experiemnt. Bail here to avoid overriding
                // any of the settings for this experiment.
                if (currentExp && currentExp.active === true && _this.activeExperiment.active === true) {
                    return;
                }

                // clear out non-active experiments
                if (_this.activeExperiment.active !== true) {
                    settings.updateSetting('activeExperiment', '');
                    return;
                }

                settings.updateSetting('activeExperiment', _this.activeExperiment);

                if (_this.activeExperiment.name) {
                    if (_this.activeExperiment.atbExperiments && _this.activeExperiment.atbExperiments[_this.atbVariant]) {
                        _this.activeExperiment.settings = _this.activeExperiment.atbExperiments[_this.atbVariant].settings;
                    }

                    if (_this.activeExperiment.settings) {
                        _this.applySettingsChanges();
                    }
                }
            });
        }
    }, {
        key: 'applySettingsChanges',
        value: function applySettingsChanges() {
            for (var setting in this.activeExperiment.settings) {
                settings.updateSetting(setting, this.activeExperiment.settings[setting]);
            }
        }
    }, {
        key: 'getDaysSinceInstall',
        value: function getDaysSinceInstall() {
            var cohort = settings.getSetting('atb');
            if (!cohort) return false;

            var split = cohort.split('-');
            var majorVersion = split[0];
            var minorVersion = split[1];

            if (!majorVersion || !minorVersion) return;

            majorVersion = majorVersion.substring(1);

            // remove any atb variant that may be appended to the setting.
            minorVersion = minorVersion.replace(/[a-z_]/g, '');

            return atbUtils.getDaysBetweenCohorts({
                majorVersion: parseInt(majorVersion, 10),
                minorVersion: parseInt(minorVersion, 10)
            }, atbUtils.getCurrentATB());
        }
    }]);

    return Experiment;
}();

module.exports = new Experiment();

},{"../../data/experiments-out":16,"./atb-utils.es6":18,"./settings.es6":38}],31:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sha1 = require('../shared-utils/sha1');
// eslint-disable-next-line node/no-deprecated-api
var punycode = require('punycode');
var constants = require('../../data/constants');
var HASH_PREFIX_SIZE = 4;
var ONE_HOUR_MS = 60 * 60 * 1000;

var HTTPSService = function () {
    function HTTPSService() {
        _classCallCheck(this, HTTPSService);

        this._cache = new Map();
        this._activeRequests = new Map();
    }

    _createClass(HTTPSService, [{
        key: '_cacheResponse',
        value: function _cacheResponse(query, data, expires) {
            var expiryDate = new Date(expires).getTime();

            if (isNaN(expiryDate)) {
                console.warn('Expiry date is invalid: "' + expires + '", caching for 1h');
                expiryDate = Date.now() + ONE_HOUR_MS;
            }

            this._cache.set(query, {
                expires: expiryDate,
                data: data
            });
        }
    }, {
        key: '_hostToHash',
        value: function _hostToHash(host) {
            return sha1(punycode.toASCII(host.toLowerCase()));
        }

        // added here for easy mocking in tests

    }, {
        key: '_fetch',
        value: function _fetch(url) {
            return fetch(url);
        }

        /**
         * @param {string} host
         * @returns {Boolean|null}
         */

    }, {
        key: 'checkInCache',
        value: function checkInCache(host) {
            var hash = this._hostToHash(host);
            var query = hash.substr(0, HASH_PREFIX_SIZE);
            var result = this._cache.get(query);

            if (result) {
                return result.data.includes(hash);
            }

            return null;
        }

        /**
         * @param {string} host
         * @returns {Promise<Boolean>}
         */

    }, {
        key: 'checkInService',
        value: function checkInService(host) {
            var _this = this;

            var hash = this._hostToHash(host);
            var query = hash.substring(0, HASH_PREFIX_SIZE);

            if (this._activeRequests.has(query)) {
                console.info('HTTPS Service: Request for ' + host + ' is already in progress.');
                return this._activeRequests.get(query);
            }

            console.info('HTTPS Service: Requesting information for ' + host + ' (' + hash + ').');

            var queryUrl = new URL(constants.httpsService);
            queryUrl.searchParams.append('pv1', query);

            var request = this._fetch(queryUrl.toString()).then(function (response) {
                _this._activeRequests.delete(query);

                return response.json().then(function (data) {
                    var expires = response.headers.get('expires');
                    _this._cacheResponse(query, data, expires);
                    return data;
                });
            }).then(function (data) {
                var result = data.includes(hash);
                console.info('HTTPS Service: ' + host + ' is' + (result ? '' : ' not') + ' upgradable.');
                return result;
            }).catch(function (e) {
                _this._activeRequests.delete(query);
                console.error('HTTPS Service: Failed contacting service: ' + e.message);
                throw e;
            });

            this._activeRequests.set(query, request);

            return request;
        }
    }, {
        key: 'clearCache',
        value: function clearCache() {
            this._cache.clear();
        }
    }, {
        key: 'clearExpiredCache',
        value: function clearExpiredCache() {
            var _this2 = this;

            var now = Date.now();

            Array.from(this._cache.keys()).filter(function (key) {
                return _this2._cache.get(key).expires < now;
            }).forEach(function (key) {
                return _this2._cache.delete(key);
            });
        }
    }]);

    return HTTPSService;
}();

module.exports = new HTTPSService();

},{"../../data/constants":14,"../shared-utils/sha1":45,"punycode":6}],32:[function(require,module,exports){
(function (Buffer){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var settings = require('./settings.es6');
var utils = require('./utils.es6');
var BloomFilter = require('jsbloom').filter;
var pixel = require('./pixel.es6');
var httpsService = require('./https-service.es6');
var tabManager = require('./tab-manager.es6');
var browserWrapper = require('./chrome-wrapper.es6');
var tldts = require('tldts');
// as defined in https://tools.ietf.org/html/rfc6761
var PRIVATE_TLDS = ['example', 'invalid', 'localhost', 'test'];

var HTTPS = function () {
    function HTTPS() {
        _classCallCheck(this, HTTPS);

        // Store multiple upgrade / don't upgrade bloom filters
        this.upgradeBloomFilters = new Map();
        this.dontUpgradeBloomFilters = new Map();
        // Upgrade / don't upgrade safelists for the bloom filters
        this.dontUpgradeList = [];
        this.upgradeList = [];

        this.isReady = false;
    }

    // Sets a list by type and name. This is data that
    // is gathered from HTTPSStorage.
    // 'upgrade bloom filter' and 'don't upgrade bloom filter' are assumed to be bloom filters
    // 'upgrade safelist' and 'don't upgrade safelist' should be arrays


    _createClass(HTTPS, [{
        key: 'setLists',
        value: function setLists(lists) {
            var _this = this;

            try {
                lists.map(function (list) {
                    if (!list.data) {
                        throw new Error('HTTPS: ' + list.name + ' missing data');
                    }

                    if (list.type === 'upgrade bloom filter') {
                        _this.upgradeBloomFilters.set(list.name, _this.createBloomFilter(list));
                    } else if (list.type === 'don\'t upgrade bloom filter') {
                        _this.dontUpgradeBloomFilters.set(list.name, _this.createBloomFilter(list));
                    } else if (list.type === 'upgrade safelist') {
                        _this.upgradeList = list.data;
                    } else if (list.type === 'don\'t upgrade safelist') {
                        _this.dontUpgradeList = list.data;
                    }
                });
                this.isReady = true;
                console.log('HTTPS: is ready');
            } catch (e) {
                // a failed setLists update will turn https off
                // validation of the data should happen before calling setLists
                this.isReady = false;
                console.log('HTTPS: setLists error, not ready');
                console.log(e);
            }
        }

        // create a new BloomFilter
        // filterData is assumed to be base64 encoded 8 bit typed array

    }, {
        key: 'createBloomFilter',
        value: function createBloomFilter(filterData) {
            var bloom = new BloomFilter(filterData.totalEntries, filterData.errorRate);
            var buffer = Buffer.from(filterData.data, 'base64');
            bloom.importData(buffer);
            return bloom;
        }

        /**
         * @param {string} url either domain (example.com) or a full URL (http://example.com/about)
         * @returns {Boolean|Promise<Boolean>} returns true if host can be upgraded, false if it shouldn't be upgraded and a promise if we don't know yet and we are checking against a remote service
         */

    }, {
        key: 'canUpgradeUrl',
        value: function canUpgradeUrl(url) {
            var parsedUrl = tldts.parse(url);
            var host = parsedUrl.hostname;

            if (!host) {
                console.warn('HTTPS: Error parsing out hostname', url);
                return false;
            }

            if (parsedUrl.isIp) {
                console.warn('HTTPS: hostname is an IP - host is not upgradable', host);
                return false;
            }

            if (host === 'localhost' || PRIVATE_TLDS.includes(parsedUrl.publicSuffix)) {
                console.warn('HTTPS: localhost or local TLD - host is not upgradable', host);
                return false;
            }

            if (!this.isReady) {
                console.warn('HTTPS: not ready');
                return null;
            }

            if (this.dontUpgradeList.includes(host)) {
                console.log('HTTPS: Safelist - host is not upgradable', host);
                return false;
            }

            if (this.upgradeList.includes(host)) {
                console.log('HTTPS: Safelist - host is upgradable', host);
                return true;
            }

            var foundInDontUpgradeBloomFilters = Array.from(this.dontUpgradeBloomFilters.values()).some(function (list) {
                return list.checkEntry(host);
            });

            if (foundInDontUpgradeBloomFilters) {
                console.log('HTTPS: Bloom filter - host is not upgradable', host);
                return false;
            }

            var foundInUpgradeBloomFilters = Array.from(this.upgradeBloomFilters.values()).some(function (list) {
                return list.checkEntry(host);
            });

            if (foundInUpgradeBloomFilters) {
                console.log('HTTPS: Bloom filter - host is upgradable', host);
                return true;
            }

            var foundInServiceCache = httpsService.checkInCache(host);

            if (foundInServiceCache !== null) {
                console.log('HTTPS: Service cache - host is' + (foundInServiceCache ? '' : ' not') + ' upgradable', host);
                return foundInServiceCache;
            }

            return httpsService.checkInService(host);
        }
    }, {
        key: 'downgradeTab',
        value: function downgradeTab(_ref) {
            var tabId = _ref.tabId,
                expectedUrl = _ref.expectedUrl,
                targetUrl = _ref.targetUrl;

            // make sure that tab still has expected url (user could have navigated away or been redirected)
            var tab = tabManager.get({ tabId: tabId });

            if (tab.url !== expectedUrl && tab.url !== targetUrl) {
                console.warn('HTTPS: Not downgrading, expected and actual tab URLs don\'t match: ' + expectedUrl + ' vs ' + tab.url);
            } else {
                console.log('HTTPS: Downgrading from ' + tab.url + ' to ' + targetUrl);
                browserWrapper.changeTabURL(tabId, targetUrl);
            }
        }
    }, {
        key: 'getUpgradedUrl',
        value: function getUpgradedUrl(reqUrl, tab, isMainFrame, isPost) {
            var _this2 = this;

            if (!this.isReady) {
                console.warn('HTTPS: not ready');
                return reqUrl;
            }

            // Obey global settings (options page)
            if (!settings.getSetting('httpsEverywhereEnabled')) {
                return reqUrl;
            }

            // Skip upgrading sites that have been whitelisted by user
            // via on/off toggle in popup
            if (tab.site.whitelisted) {
                console.log('HTTPS: ' + tab.site.domain + ' was whitelisted by user. Skip upgrade check.');
                return reqUrl;
            }

            var urlObj = void 0;

            try {
                urlObj = new URL(reqUrl);
            } catch (e) {
                // invalid URL
                console.warn('HTTPS: Invalid url - ' + reqUrl);
                return reqUrl;
            }

            // Only deal with http calls
            if (urlObj.protocol !== 'http:') {
                return reqUrl;
            }

            var isUpgradable = this.canUpgradeUrl(reqUrl);

            // request is not upgradable or extension is not ready yet
            if (isUpgradable === false || isUpgradable === null) {
                return reqUrl;
            }

            // create an upgraded URL
            urlObj.protocol = 'https:';
            var upgradedUrl = urlObj.toString();

            // request is upgradable
            if (isUpgradable === true) {
                return upgradedUrl;
            }

            /**
             * If we got to this point hostname was not recognized by our bloom filters and safelists,
             * we are waiting for a response from our remote service
             */
            if (!(isUpgradable instanceof Promise)) {
                console.error('HTTPS: Fatal error - unexpected type of isUpgradable');
                return reqUrl;
            }

            // if this is a non-navigational request (subresource request) let it continue over HTTP
            if (!isMainFrame) {
                return reqUrl;
            }

            // if this is a POST navigational request and browser doesn't support async blocking
            // let it continue over HTTP to avoid data loss
            if (isMainFrame && isPost && !utils.getAsyncBlockingSupport()) {
                return reqUrl;
            }

            // if async blocking is available:
            // we hold the request until we hear back from our service
            if (utils.getAsyncBlockingSupport()) {
                return isUpgradable.then(function (result) {
                    if (result) {
                        tab.mainFrameUpgraded = true;
                        _this2.incrementUpgradeCount('totalUpgrades');
                    }

                    return result ? upgradedUrl : reqUrl;
                }).catch(function (e) {
                    console.error('HTTPS: Error connecting to the HTTPS service: ' + e.message);
                    return upgradedUrl;
                });
            } else {
                // if async blocking is NOT available:
                // we upgrade it proactively while waiting for a response from a remote service
                isUpgradable.then(function (result) {
                    if (result === false) {
                        console.info('HTTPS: Remote check returned - downgrade request', reqUrl);

                        _this2.downgradeTab({
                            tabId: tab.id,
                            expectedUrl: upgradedUrl,
                            targetUrl: reqUrl
                        });
                    } else {
                        console.info('HTTPS: Remote check returned - let request continue', reqUrl);
                    }
                }).catch(function (e) {
                    console.error('HTTPS: Error connecting to the HTTPS service: ' + e.message);
                });

                tab.mainFrameUpgraded = true;
                this.incrementUpgradeCount('totalUpgrades');

                return upgradedUrl;
            }
        }

        // Send https upgrade and failure totals

    }, {
        key: 'sendHttpsUpgradeTotals',
        value: function sendHttpsUpgradeTotals() {
            var upgrades = settings.getSetting('totalUpgrades');
            var failed = settings.getSetting('failedUpgrades');

            // only send if we have data
            if (upgrades || failed) {
                // clear the counts
                settings.updateSetting('totalUpgrades', 0);
                settings.updateSetting('failedUpgrades', 0);
                pixel.fire('ehs', { 'total': upgrades, 'failures': failed });
            }
        }

        // Increment upgrade or failed upgrade settings

    }, {
        key: 'incrementUpgradeCount',
        value: function incrementUpgradeCount(setting) {
            var value = parseInt(settings.getSetting(setting)) || 0;
            value += 1;
            settings.updateSetting(setting, value);
        }
    }]);

    return HTTPS;
}();

module.exports = new HTTPS();

}).call(this,require("buffer").Buffer)
},{"./chrome-wrapper.es6":22,"./https-service.es6":31,"./pixel.es6":35,"./settings.es6":38,"./tab-manager.es6":41,"./utils.es6":43,"buffer":7,"jsbloom":10,"tldts":13}],33:[function(require,module,exports){
'use strict';

var browserWrapper = require('./chrome-wrapper.es6');

var dev = false;

function JSONfromLocalFile(path) {
    return loadExtensionFile({ url: path, returnType: 'json' });
}

function JSONfromExternalFile(url) {
    return loadExtensionFile({ url: url, returnType: 'json', source: 'external' });
}

function url(url) {
    return loadExtensionFile({ url: url, source: 'external' });
}

function returnResponse(xhr, returnType) {
    if (returnType === 'json' && xhr && xhr.responseText) {
        var res = void 0;

        try {
            res = JSON.parse(xhr.responseText);
        } catch (e) {
            console.warn('couldn\'t parse JSON response: ' + xhr.responseText);
        }

        return res;
    } else if (returnType === 'xml') {
        return xhr.responseXML;
    } else {
        return xhr.responseText;
    }
}

/*
 * Params:
 *  - url: request URL
 *  - source: requests are internal by default. set source to 'external' for non-extension URLs
 *  - etag: set an if-none-match header
 */
function loadExtensionFile(params) {
    var xhr = new XMLHttpRequest();
    var url = params.url;

    if (params.source === 'external') {
        if (dev) {
            if (url.indexOf('?') > -1) {
                url += '&';
            } else {
                url += '?';
            }

            url += 'test=1';
        }

        xhr.open('GET', url);

        if (params.etag) {
            xhr.setRequestHeader('If-None-Match', params.etag);
        }
    } else {
        // set type xhr type tag. Safari internal xhr requests
        // don't set a 200 status so we'll check this type
        xhr.type = 'internal';
        xhr.open('GET', browserWrapper.getExtensionURL(url));
    }

    xhr.timeout = params.timeout || 30000;

    xhr.send(null);

    return new Promise(function (resolve, reject) {
        xhr.ontimeout = function () {
            reject(new Error(url + ' timed out'));
        };
        xhr.onreadystatechange = function () {
            var done = XMLHttpRequest.DONE ? XMLHttpRequest.DONE : 4;
            if (xhr.readyState === done) {
                if (xhr.status === 200 || xhr.type && xhr.type === 'internal') {
                    xhr.data = returnResponse(xhr, params.returnType);
                    if (!xhr.data) reject(new Error(url + ' returned no data'));
                    resolve(xhr);
                } else if (xhr.status === 304) {
                    console.log(url + ' returned 304, resource not changed');
                    resolve(xhr);
                } else {
                    reject(new Error(url + ' returned ' + xhr.status));
                }
            }
        };
    });
}

function setDevMode() {
    dev = true;
}

module.exports = {
    loadExtensionFile: loadExtensionFile,
    JSONfromLocalFile: JSONfromLocalFile,
    JSONfromExternalFile: JSONfromExternalFile,
    url: url,
    setDevMode: setDevMode
};

},{"./chrome-wrapper.es6":22}],34:[function(require,module,exports){
'use strict';

/*
 * Temporary helper functions used to migrate and
 * clean up old data
 */

/*
* Mapping new entity names to old entity names for data migration
*/
var entityRenameMapping = {
    'Google': 'Google LLC',
    'Facebook': 'Facebook, Inc.',
    'Twitter': 'Twitter, Inc.',
    'Amazon': 'Amazon Technologies, Inc.',
    'AppNexus': 'AppNexus, Inc.',
    'Oracle': 'Oracle Corporation',
    'MediaMath': 'MediaMath, Inc.',
    'Oath': 'Verizon Media',
    'Maxcdn': 'StackPath, LLC',
    'Automattic': 'Automattic, Inc.',
    'Adobe': 'Adobe Inc.',
    'Quantcast': 'Quantcast Corporation'
};

module.exports = {
    migrateCompanyData: function migrateCompanyData(company, storageData) {
        if (entityRenameMapping[company]) {
            var oldName = company;
            var newName = entityRenameMapping[company];
            storageData[newName] = storageData[oldName];
            storageData[newName].name = newName;
            delete storageData[oldName];
            company = newName;
        }
        return [company, storageData];
    }
};

},{}],35:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 *
 * This is part of our tool for anonymous engagement metrics
 * Learn more at https://duck.co/help/privacy/atb
 *
 */
var load = require('./load.es6');
var browserWrapper = require('./chrome-wrapper.es6');
var settings = require('./settings.es6');
var parseUserAgentString = require('../shared-utils/parse-user-agent-string.es6');

/**
 *
 * Fire a pixel
 *
 * @param {string} pixelName
 * @param {...*} args - any number of extra data
 *
 */
function fire() {
    if (!arguments.length) return;

    var args = Array.prototype.slice.call(arguments);
    var pixelName = args[0];

    if (typeof pixelName !== 'string') return;

    // Only allow broken site reports
    if (pixelName !== 'epbf') return;

    var url = getURL(pixelName);

    if (!url) return;

    args = args.slice(1);
    args = args.concat(getAdditionalParams());
    var paramString = concatParams(args);

    // Send the request
    load.url(url + paramString);
}

/**
 *
 * Return URL for the pixel request
 *
 */
function getURL(pixelName) {
    if (!pixelName) return;

    var url = 'https://improving.duckduckgo.com/t/';
    return url + pixelName;
}

/**
 *
 * Return additional params for the pixel request
 *
 */
function getAdditionalParams() {
    var browserInfo = parseUserAgentString();
    var browser = browserInfo.browser;
    var extensionVersion = browserWrapper.getExtensionVersion();
    var atb = settings.getSetting('atb');
    var queryStringParams = {};
    var result = [];

    if (browser) result.push(browser.toLowerCase());
    if (extensionVersion) queryStringParams.extensionVersion = extensionVersion;
    if (atb) queryStringParams.atb = atb;

    result.push(queryStringParams);

    return result;
}

/**
 *
 * @param {array} args - data we need to append
 *
 */
function concatParams(args) {
    args = args || [];

    var paramString = '';
    var objParamString = '';
    var resultString = '';
    var randomNum = Math.ceil(Math.random() * 1e7);

    args.forEach(function (arg) {
        // append keys if object
        if ((typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object') {
            objParamString += Object.keys(arg).reduce(function (params, key) {
                var val = arg[key];
                if (val || val === 0) return params + '&' + key + '=' + val;
            }, '');
        } else if (arg) {
            // otherwise just add args separated by _
            paramString += '_' + arg;
        }
    });

    resultString = paramString + '?' + randomNum + objParamString;

    return resultString;
}

module.exports = {
    fire: fire,
    getURL: getURL,
    concatParams: concatParams
};

},{"../shared-utils/parse-user-agent-string.es6":44,"./chrome-wrapper.es6":22,"./load.es6":33,"./settings.es6":38}],36:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tldts = require('tldts');
var tosdr = require('../../data/tosdr');
var constants = require('../../data/constants');
var utils = require('./utils.es6');

var tosdrRegexList = [];
var tosdrScores = {};

var PrivacyPractices = function () {
    function PrivacyPractices() {
        _classCallCheck(this, PrivacyPractices);

        Object.keys(tosdr).forEach(function (site) {
            // only match domains, and from the start of the URL
            tosdrRegexList.push(new RegExp('(^)' + tldts.getDomain(site)));

            // generate scores for the privacy grade
            var tosdrClass = tosdr[site].class;
            var tosdrScore = tosdr[site].score;

            if (tosdrClass || tosdrScore) {
                var score = 5;

                // asign a score value to the classes/scores provided in the JSON file
                if (tosdrClass === 'A') {
                    score = 0;
                } else if (tosdrClass === 'B') {
                    score = 1;
                } else if (tosdrClass === 'D' || tosdrScore > 150) {
                    score = 10;
                } else if (tosdrClass === 'C' || tosdrScore > 100) {
                    score = 7;
                }

                tosdrScores[site] = score;

                // if the site has a parent entity, propagate the score to that, too
                // but only if the score is higher
                //
                // basically, a parent entity's privacy score is as bad as
                // that of the worst site it owns
                var parentEntity = utils.findParent(site);

                if (parentEntity && (!tosdrScores[parentEntity] || tosdrScores[parentEntity] < score)) {
                    tosdrScores[parentEntity] = score;
                }
            }
        });
    }

    _createClass(PrivacyPractices, [{
        key: 'getTosdr',
        value: function getTosdr(url) {
            var domain = tldts.getDomain(url);
            var tosdrData = void 0;

            tosdrRegexList.some(function (tosdrSite) {
                var match = tosdrSite.exec(domain);

                if (!match) return;

                tosdrData = tosdr[match[0]];

                return tosdrData;
            });

            if (!tosdrData) return {};

            var matchGood = tosdrData.match && tosdrData.match.good || [];
            var matchBad = tosdrData.match && tosdrData.match.bad || [];

            // tosdr message
            // 1. If we have a defined tosdr class look up the message in constants
            //    for the corresponding letter class
            // 2. If there are both good and bad points -> 'mixed'
            // 3. Else use the calculated tosdr score to determine the message
            var message = constants.tosdrMessages.unknown;
            if (tosdrData.class) {
                message = constants.tosdrMessages[tosdrData.class];
            } else if (matchGood.length && matchBad.length) {
                message = constants.tosdrMessages.mixed;
            } else {
                if (tosdrData.score < 0) {
                    message = constants.tosdrMessages.good;
                } else if (tosdrData.score === 0 && (matchGood.length || matchBad.length)) {
                    message = constants.tosdrMessages.mixed;
                } else if (tosdrData.score > 0) {
                    message = constants.tosdrMessages.bad;
                }
            }

            return {
                score: tosdrData.score,
                class: tosdrData.class,
                reasons: {
                    good: matchGood,
                    bad: matchBad
                },
                message: message
            };
        }
    }, {
        key: 'getTosdrScore',
        value: function getTosdrScore(hostname, parent) {
            var domain = tldts.getDomain(hostname);

            // look for tosdr match in list of parent properties
            var parentMatch = '';
            if (parent && parent.domains) {
                Object.keys(tosdrScores).some(function (tosdrName) {
                    var match = parent.domains.find(function (d) {
                        return d === tosdrName;
                    });
                    if (match) {
                        parentMatch = match;
                        return true;
                    }
                });
            }

            // grab the first available val
            // starting with most general first

            // minor potential for an edge case:
            // foo.bar.com and bar.com have entries in tosdr.json
            // and different scores - should they propagate
            // the same way parent entity ones do?
            var score = [tosdrScores[parentMatch], tosdrScores[domain], tosdrScores[hostname]].find(function (s) {
                return typeof s === 'number';
            });

            return score;
        }
    }]);

    return PrivacyPractices;
}();

module.exports = new PrivacyPractices();

},{"../../data/constants":14,"../../data/tosdr":17,"./utils.es6":43,"tldts":13}],37:[function(require,module,exports){
'use strict';

var utils = require('./utils.es6');
var trackers = require('./trackers.es6');
var https = require('./https.es6');
var Companies = require('./companies.es6');
var tabManager = require('./tab-manager.es6');
var ATB = require('./atb.es6');
var browserWrapper = require('./chrome-wrapper.es6');
var settings = require('./settings.es6');

var debugRequest = false;

function buildResponse(url, requestData, tab, isMainFrame) {
    if (url.toLowerCase() !== requestData.url.toLowerCase()) {
        console.log('HTTPS: upgrade request url to ' + url);
        tab.httpsRedirects.registerRedirect(requestData);

        if (isMainFrame) {
            tab.upgradedHttps = true;
        }
        if (utils.getUpgradeToSecureSupport()) {
            return { upgradeToSecure: true };
        } else {
            return { redirectUrl: url };
        }
    } else if (isMainFrame) {
        tab.upgradedHttps = false;
    }
}

/**
 * Where most of the extension work happens.
 *
 * For each request made:
 * - Add ATB param
 * - Block tracker requests
 * - Upgrade http -> https where possible
 */

function handleRequest(requestData) {
    var tabId = requestData.tabId;
    // Skip requests to background tabs
    if (tabId === -1) {
        return;
    }

    var thisTab = tabManager.get(requestData);

    // For main_frame requests: create a new tab instance whenever we either
    // don't have a tab instance for this tabId or this is a new requestId.
    //
    // Safari doesn't have specific requests for main frames
    if (requestData.type === 'main_frame' && window.chrome) {
        if (!thisTab || thisTab.requestId !== requestData.requestId) {
            var newTab = tabManager.create(requestData);

            // andrey: temporary disable this. it was letting redirect loops through on Tumblr
            // persist the last URL the tab was trying to upgrade to HTTPS
            // if (thisTab && thisTab.httpsRedirects) {
            //     newTab.httpsRedirects.persistMainFrameRedirect(thisTab.httpsRedirects.getMainFrameRedirect())
            // }
            thisTab = newTab;
        }

        // add atb params only to main_frame
        var ddgAtbRewrite = ATB.redirectURL(requestData);
        if (ddgAtbRewrite) return ddgAtbRewrite;
    } else {
        /**
         * Check that we have a valid tab
         * there is a chance this tab was closed before
         * we got the webrequest event
         */
        if (!(thisTab && thisTab.url && thisTab.id)) return;

        /**
         * skip any broken sites
         */
        if (thisTab.site.isBroken) {
            console.log('temporarily skip tracker blocking for site: ' + utils.extractHostFromURL(thisTab.url) + '\n' + 'more info: https://github.com/duckduckgo/content-blocking-whitelist');
            return;
        }

        // skip blocking on new tab and extension pages
        if (thisTab.site.specialDomainName) {
            return;
        }

        /**
         * Tracker blocking
         * If request is a tracker, cancel the request
         */

        var tracker = trackers.getTrackerData(requestData.url, thisTab.site.url, requestData);

        // allow embedded twitter content if user enabled this setting
        if (tracker && tracker.fullTrackerDomain === 'platform.twitter.com' && settings.getSetting('embeddedTweetsEnabled') === true) {
            tracker = null;
        }

        // count and block trackers. Skip things that matched in the trackersWhitelist unless they're first party
        if (tracker && !(tracker.action === 'ignore' && tracker.reason !== 'first party')) {
            // Determine if this tracker was coming from our current tab. There can be cases where a tracker request
            // comes through on document unload and by the time we block it we have updated our tab data to the new
            // site. This can make it look like the tracker was on the new site we navigated to. We're blocking the
            // request anyway but deciding to show it in the popup or not. If we have a documentUrl, use it, otherwise
            // just default to true.
            var sameDomain = isSameDomainRequest(thisTab, requestData);

            // only count trackers on pages with 200 response. Trackers on these sites are still
            // blocked below but not counted on the popup. We can also run into a case where
            // we block a tracker faster then we can update the tab so we check sameDomain.
            if (thisTab.statusCode === 200 && sameDomain) {
                // record all tracker urls on a site even if we don't block them
                thisTab.site.addTracker(tracker);

                // record potential blocked trackers for this tab
                thisTab.addToTrackers(tracker);
            }

            browserWrapper.notifyPopup({ 'updateTabData': true });

            // Block the request if the site is not whitelisted
            if (!thisTab.site.whitelisted && tracker.action.match(/block|redirect/)) {
                if (sameDomain) thisTab.addOrUpdateTrackersBlocked(tracker);

                // update badge icon for any requests that come in after
                // the tab has finished loading
                if (thisTab.status === 'complete') thisTab.updateBadgeIcon();

                if (thisTab.statusCode === 200) {
                    Companies.add(tracker.tracker.owner);
                }

                // for debugging specific requests. see test/tests/debugSite.js
                if (debugRequest && debugRequest.length) {
                    if (debugRequest.includes(tracker.url)) {
                        console.log('UNBLOCKED: ', tracker.url);
                        return;
                    }
                }

                if (!window.safari) {
                    // Initiate hiding of blocked ad DOM elements
                    tryElementHide(requestData, thisTab);
                }

                console.info('blocked ' + utils.extractHostFromURL(thisTab.url) + ' [' + tracker.tracker.owner.name + '] ' + requestData.url);

                // return surrogate redirect if match, otherwise
                // tell Chrome to cancel this webrequest
                if (tracker.redirectUrl) {
                    // safari gets return data in message
                    requestData.message = { redirectUrl: tracker.redirectUrl };
                    return { redirectUrl: tracker.redirectUrl };
                } else {
                    requestData.message = { cancel: true };
                    return { cancel: true };
                }
            }
        }
    }

    /**
     * HTTPS Everywhere rules
     * If an upgrade rule is found, request is upgraded from http to https
     */

    if (!thisTab.site || !window.chrome) return;

    // Skip https upgrade on broken sites
    if (thisTab.site.isBroken) {
        console.log('temporarily skip https upgrades for site: ' + utils.extractHostFromURL(thisTab.url) + '\n' + 'more info: https://github.com/duckduckgo/content-blocking-whitelist');
        return;
    }

    // Is this request from the tab's main frame?
    var isMainFrame = requestData.type === 'main_frame';
    var isPost = requestData.method === 'POST';

    // Skip https upgrade if host failed before or if we detect redirect loop
    if (!thisTab.httpsRedirects.canRedirect(requestData)) {
        if (isMainFrame) {
            thisTab.upgradedHttps = false;
        }
        return;
    }

    // Fetch upgrade rule from https module:
    var resultUrl = https.getUpgradedUrl(requestData.url, thisTab, isMainFrame, isPost);

    if (resultUrl instanceof Promise) {
        return resultUrl.then(function (url) {
            return buildResponse(url, requestData, thisTab, isMainFrame);
        });
    } else {
        return buildResponse(resultUrl, requestData, thisTab, isMainFrame);
    }
}

function tryElementHide(requestData, tab) {
    if (tab.site.parentEntity === 'Verizon Media') {
        var frameId = void 0,
            messageType = void 0;

        if (requestData.type === 'sub_frame') {
            frameId = requestData.parentFrameId;
            messageType = frameId === 0 ? 'blockedFrame' : 'blockedFrameAsset';
        } else if (requestData.frameId !== 0 && (requestData.type === 'image' || requestData.type === 'script')) {
            frameId = requestData.frameId;
            messageType = 'blockedFrameAsset';
        }

        chrome.tabs.sendMessage(requestData.tabId, { type: messageType, request: requestData, mainFrameUrl: tab.url }, { frameId: frameId });
    } else if (!tab.elementHidingDisabled) {
        chrome.tabs.sendMessage(requestData.tabId, { type: 'disable' });
        tab.elementHidingDisabled = true;
    }
}

/* Check to see if a request came from our current tab. This generally handles the
 * case of pings that fire on document unload. We can get into a case where we count the
 * ping to the new site we navigated to.
 *
 * In Firefox we can check the request frameAncestors to see if our current
 * tab url is one of the ancestors.
 * In Chrome we don't have access to a sub_frame ancestors. We can check that a request
 * is coming from the main_frame and that it matches our current tab url
 */
function isSameDomainRequest(tab, req) {
    // Firefox
    if (req.documentUrl) {
        if (req.frameAncestors && req.frameAncestors.length) {
            var ancestors = req.frameAncestors.reduce(function (lst, f) {
                lst.push(f.url);
                return lst;
            }, []);
            return ancestors.includes(tab.url);
        } else {
            return req.documentUrl === tab.url;
        }
        // Chrome
    } else if (req.initiator && req.frameId === 0) {
        return !!tab.url.match(req.initiator);
    } else {
        return true;
    }
}
exports.handleRequest = handleRequest;

},{"./atb.es6":19,"./chrome-wrapper.es6":22,"./companies.es6":29,"./https.es6":32,"./settings.es6":38,"./tab-manager.es6":41,"./trackers.es6":42,"./utils.es6":43}],38:[function(require,module,exports){
'use strict';

var defaultSettings = require('../../data/defaultSettings');
var browserWrapper = require('./chrome-wrapper.es6');

/**
 * Public api
 * Usage:
 * You can use promise callbacks to check readyness before getting and updating
 * settings.ready().then(() => settings.updateSetting('settingName', settingValue))
 */
var settings = {};
var isReady = false;
var _ready = init().then(function () {
    isReady = true;
    console.log('Settings are loaded');
});

function init() {
    return new Promise(function (resolve, reject) {
        buildSettingsFromDefaults();
        buildSettingsFromLocalStorage().then(function () {
            resolve();
        });
    });
}

function ready() {
    return _ready;
}

function buildSettingsFromLocalStorage() {
    return new Promise(function (resolve) {
        browserWrapper.getFromStorage(['settings'], function (results) {
            // copy over saved settings from storage
            if (!results) resolve();
            settings = browserWrapper.mergeSavedSettings(settings, results);
            resolve();
        });
    });
}

function buildSettingsFromDefaults() {
    // initial settings are a copy of default settings
    settings = Object.assign({}, defaultSettings);
}

function syncSettingTolocalStorage() {
    browserWrapper.syncToStorage({ 'settings': settings });
}

function getSetting(name) {
    if (!isReady) {
        console.warn('Settings: getSetting() Settings not loaded: ' + name);
        return;
    }

    // let all and null return all settings
    if (name === 'all') name = null;

    if (name) {
        return settings[name];
    } else {
        return settings;
    }
}

function updateSetting(name, value) {
    if (!isReady) {
        console.warn('Settings: updateSetting() Setting not loaded: ' + name);
        return;
    }

    settings[name] = value;
    syncSettingTolocalStorage();
}

function removeSetting(name) {
    if (!isReady) {
        console.warn('Settings: removeSetting() Setting not loaded: ' + name);
        return;
    }
    if (settings[name]) {
        delete settings[name];
        syncSettingTolocalStorage();
    }
}

function logSettings() {
    browserWrapper.getFromStorage(['settings'], function (s) {
        console.log(s.settings);
    });
}

module.exports = {
    getSetting: getSetting,
    updateSetting: updateSetting,
    removeSetting: removeSetting,
    logSettings: logSettings,
    ready: ready
};

},{"../../data/defaultSettings":15,"./chrome-wrapper.es6":22}],39:[function(require,module,exports){
(function (Buffer){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var load = require('./../load.es6');
var Dexie = require('dexie');
var constants = require('../../../data/constants');
var settings = require('./../settings.es6');

var HTTPSStorage = function () {
    function HTTPSStorage() {
        _classCallCheck(this, HTTPSStorage);

        this.dbc = new Dexie(constants.httpsDBName);
        this.dbc.version(1).stores({
            httpsStorage: 'name,type,data,checksum'
        });
    }

    // Load https data defined in constants.httpsLists.
    // We wait until all promises resolve to send datd to https.
    // This is all or nothing. We gather data for each of the lists
    // and validate. If any list fails validation then promise.all will
    // reject the whole update.


    _createClass(HTTPSStorage, [{
        key: 'getLists',
        value: function getLists() {
            var _this = this;

            return Promise.all(constants.httpsLists.map(function (list) {
                var listCopy = JSON.parse(JSON.stringify(list));
                var etag = settings.getSetting(listCopy.name + '-etag') || '';

                return _this.getDataXHR(listCopy.url, etag).then(function (response) {
                    // for 200 response we update etags
                    if (response && response.status === 200) {
                        var newEtag = response.getResponseHeader('etag') || '';
                        settings.updateSetting(listCopy.name + '-etag', newEtag);
                    }

                    // We try to process both 200 and 304 responses. 200s will validate
                    // and update the db. 304s will try to grab the previous data from db
                    // or throw an error if none exists.
                    return _this.processData(listCopy, response.data).then(function (resultData) {
                        if (resultData) {
                            return resultData;
                        } else {
                            throw new Error('HTTPS: process list xhr failed  ' + listCopy.name);
                        }
                    });
                }).catch(function (e) {
                    return _this.fallbackToDB(listCopy).then(function (backupFromDB) {
                        if (backupFromDB) {
                            return backupFromDB;
                        } else {
                            // reset etag to force us to get fresh server data in case of an error
                            settings.updateSetting(listCopy.name + '-etag', '');
                            throw new Error('HTTPS: data update for ' + listCopy.name + ' failed');
                        }
                    });
                });
            }));
        }

        // validate xhr data and lookup previous data from local db if needed
        // verify the checksum before returning the processData result

    }, {
        key: 'processData',
        value: function processData(listDetails, xhrData) {
            var _this2 = this;

            if (xhrData) {
                return this.hasCorrectChecksum(xhrData).then(function (isValid) {
                    if (isValid) {
                        _this2.storeInLocalDB(listDetails.name, listDetails.type, xhrData);
                        return Object.assign(listDetails, xhrData);
                    }
                });
            } else {
                return Promise.resolve();
            }
        }
    }, {
        key: 'fallbackToDB',
        value: function fallbackToDB(listDetails) {
            var _this3 = this;

            return this.getDataFromLocalDB(listDetails.name).then(function (storedData) {
                if (!storedData) return;

                return _this3.hasCorrectChecksum(storedData.data).then(function (isValid) {
                    if (isValid) {
                        if (storedData && storedData.data) {
                            return Object.assign(listDetails, storedData.data);
                        }
                    }
                });
            });
        }
    }, {
        key: 'getDataXHR',
        value: function getDataXHR(url, etag) {
            return load.loadExtensionFile({ url: url, etag: etag, returnType: 'json', source: 'external', timeout: 60000 });
        }
    }, {
        key: 'getDataFromLocalDB',
        value: function getDataFromLocalDB(name) {
            var _this4 = this;

            console.log('HTTPS: getting ' + name + ' from db');
            return this.dbc.open().then(function () {
                return _this4.dbc.table('httpsStorage').get({ name: name });
            });
        }
    }, {
        key: 'storeInLocalDB',
        value: function storeInLocalDB(name, type, data) {
            console.log('HTTPS: storing ' + name + ' in db');
            return this.dbc.httpsStorage.put({ name: name, type: type, data: data });
        }
    }, {
        key: 'hasCorrectChecksum',
        value: function hasCorrectChecksum(data) {
            // not everything has a checksum
            if (!data.checksum) return Promise.resolve(true);

            // need a buffer to send to crypto.subtle
            var buffer = Buffer.from(data.data, 'base64');

            return crypto.subtle.digest('SHA-256', buffer).then(function (arrayBuffer) {
                var sha256 = Buffer.from(arrayBuffer).toString('base64');
                if (data.checksum.sha256 && data.checksum.sha256 === sha256) {
                    return true;
                } else {
                    return false;
                }
            });
        }
    }]);

    return HTTPSStorage;
}();

module.exports = new HTTPSStorage();

}).call(this,require("buffer").Buffer)
},{"../../../data/constants":14,"./../load.es6":33,"./../settings.es6":38,"buffer":7,"dexie":8}],40:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var load = require('./../load.es6');
var Dexie = require('dexie');
var constants = require('../../../data/constants');
var settings = require('./../settings.es6');
var browserWrapper = require('./../chrome-wrapper.es6');

var TDSStorage = function () {
    function TDSStorage() {
        _classCallCheck(this, TDSStorage);

        this.dbc = new Dexie('tdsStorage');
        this.dbc.version(1).stores({
            tdsStorage: 'name,data'
        });
        this.tds = { entities: {}, trackers: {}, domains: {} };
        this.surrogates = '';
        this.brokenSiteList = [];
    }

    _createClass(TDSStorage, [{
        key: 'getLists',
        value: function getLists() {
            var _this = this;

            return Promise.all(constants.tdsLists.map(function (list) {
                var listCopy = JSON.parse(JSON.stringify(list));
                var etag = settings.getSetting(listCopy.name + '-etag') || '';
                var version = _this.getVersionParam();
                var activeExperiment = settings.getSetting('activeExperiment');

                var experiment = '';
                if (activeExperiment) {
                    experiment = settings.getSetting('experimentData');
                }

                if (experiment && experiment.listName === listCopy.name) {
                    listCopy.url = experiment.url;
                }

                if (version && listCopy.source === 'external') {
                    listCopy.url += version;
                }

                var source = listCopy.source ? listCopy.source : 'external';

                return _this.getDataXHR(listCopy, etag, source).then(function (response) {
                    // for 200 response we update etags
                    if (response && response.status === 200) {
                        var newEtag = response.getResponseHeader('etag') || '';
                        settings.updateSetting(listCopy.name + '-etag', newEtag);
                    }

                    // We try to process both 200 and 304 responses. 200s will validate
                    // and update the db. 304s will try to grab the previous data from db
                    // or throw an error if none exists.
                    return _this.processData(listCopy.name, response.data).then(function (resultData) {
                        if (resultData) {
                            // store tds in memory so we can access it later if needed
                            _this[listCopy.name] = resultData;
                            return { name: listCopy.name, data: resultData };
                        } else {
                            throw new Error('TDS: process list xhr failed');
                        }
                    });
                }).catch(function (e) {
                    return _this.fallbackToDB(listCopy.name).then(function (backupFromDB) {
                        if (backupFromDB) {
                            // store tds in memory so we can access it later if needed
                            _this[listCopy.name] = backupFromDB;
                            return { name: listCopy.name, data: backupFromDB };
                        } else {
                            // reset etag to force us to get fresh server data in case of an error
                            settings.updateSetting(listCopy.name + '-etag', '');
                            throw new Error('TDS: data update failed');
                        }
                    });
                });
            }));
        }
    }, {
        key: 'processData',
        value: function processData(name, xhrData) {
            if (xhrData) {
                var parsedData = this.parsedata(name, xhrData);
                this.storeInLocalDB(name, parsedData);
                return Promise.resolve(parsedData);
            } else {
                return Promise.resolve();
            }
        }
    }, {
        key: 'fallbackToDB',
        value: function fallbackToDB(name) {
            return this.getDataFromLocalDB(name).then(function (storedData) {
                if (!storedData) return;

                if (storedData && storedData.data) {
                    return storedData.data;
                }
            });
        }
    }, {
        key: 'getDataXHR',
        value: function getDataXHR(list, etag, source) {
            return load.loadExtensionFile({ url: list.url, etag: etag, returnType: list.format, source: source, timeout: 60000 });
        }
    }, {
        key: 'getDataFromLocalDB',
        value: function getDataFromLocalDB(name) {
            var _this2 = this;

            console.log('TDS: getting from db');
            return this.dbc.open().then(function () {
                return _this2.dbc.table('tdsStorage').get({ name: name });
            });
        }
    }, {
        key: 'storeInLocalDB',
        value: function storeInLocalDB(name, data) {
            return this.dbc.tdsStorage.put({ name: name, data: data });
        }
    }, {
        key: 'parsedata',
        value: function parsedata(name, data) {
            var parsers = {
                'brokenSiteList': function brokenSiteList(data) {
                    return data.split('\n');
                }
            };

            if (parsers[name]) {
                return parsers[name](data);
            } else {
                return data;
            }
        }

        // add version param to url on the first install and only once a day after that

    }, {
        key: 'getVersionParam',
        value: function getVersionParam() {
            var ONEDAY = 1000 * 60 * 60 * 24;
            var version = browserWrapper.getExtensionVersion();
            var lastTdsUpdate = settings.getSetting('lastTdsUpdate');
            var now = Date.now();
            var versionParam = void 0;

            // check delta for last update
            if (lastTdsUpdate) {
                var delta = now - new Date(lastTdsUpdate);

                if (delta > ONEDAY) {
                    versionParam = '&v=' + version;
                }
            } else {
                versionParam = '&v=' + version;
            }

            if (versionParam) settings.updateSetting('lastTdsUpdate', now);

            return versionParam;
        }
    }]);

    return TDSStorage;
}();

module.exports = new TDSStorage();

},{"../../../data/constants":14,"./../chrome-wrapper.es6":22,"./../load.es6":33,"./../settings.es6":38,"dexie":8}],41:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Companies = require('./companies.es6');
var settings = require('./settings.es6');
var Tab = require('./classes/tab.es6');
var browserWrapper = require('./chrome-wrapper.es6');

var TabManager = function () {
    function TabManager() {
        _classCallCheck(this, TabManager);

        this.tabContainer = {};
    }

    _createClass(TabManager, [{
        key: 'create',


        /* This overwrites the current tab data for a given
         * id and is only called in three cases:
         * 1. When we rebuild saved tabs when the browser is restarted
         * 2. When a new tab is opened. See onUpdated listener below
         * 3. When we get a new main_frame request
         */
        value: function create(tabData) {
            var normalizedData = browserWrapper.normalizeTabData(tabData);
            var newTab = new Tab(normalizedData);
            this.tabContainer[newTab.id] = newTab;
            return newTab;
        }
    }, {
        key: 'delete',
        value: function _delete(id) {
            delete this.tabContainer[id];
        }
    }, {
        key: 'get',


        /* Called using either a chrome tab object or by id
         * get({tabId: ###});
         */
        value: function get(tabData) {
            return this.tabContainer[tabData.tabId];
        }
    }, {
        key: 'whitelistDomain',


        /* This will whitelist any open tabs with the same domain
         * list: name of the whitelist to update
         * domain: domain to whitelist
         * value: whitelist value, true or false
         */
        value: function whitelistDomain(data) {
            this.setGlobalWhitelist(data.list, data.domain, data.value);

            for (var tabId in this.tabContainer) {
                var tab = this.tabContainer[tabId];
                if (tab.site && tab.site.domain === data.domain) {
                    tab.site.setWhitelisted(data.list, data.value);
                }
            }

            browserWrapper.notifyPopup({ whitelistChanged: true });
        }

        /* Update the whitelists kept in settings
         */

    }, {
        key: 'setGlobalWhitelist',
        value: function setGlobalWhitelist(list, domain, value) {
            var globalwhitelist = settings.getSetting(list) || {};

            if (value) {
                globalwhitelist[domain] = true;
            } else {
                delete globalwhitelist[domain];
            }

            settings.updateSetting(list, globalwhitelist);
        }

        /* This handles the new tab case. You have clicked to
         * open a new tab and haven't typed in a url yet.
         * This will fire an onUpdated event and we can create
         * an intital tab instance here. We'll update this instance
         * later on when webrequests start coming in.
         */

    }, {
        key: 'createOrUpdateTab',
        value: function createOrUpdateTab(id, info) {
            if (!tabManager.get({ 'tabId': id })) {
                info.id = id;
                tabManager.create(info);
            } else {
                var tab = tabManager.get({ tabId: id });
                if (tab && info.status) {
                    tab.status = info.status;

                    /**
                     * Re: HTTPS. When the tab finishes loading:
                     * 1. check main_frame url (via tab.url) for http/s, update site grade
                     * 2. check for incomplete upgraded https upgrade requests, whitelist
                     * the entire site if there are any then notify tabManager
                     * NOTE: we aren't making a distinction between active and passive
                     * content when https content is mixed after a forced upgrade
                     */
                    if (tab.status === 'complete') {
                        var hasHttps = !!(tab.url && tab.url.match(/^https:\/\//));
                        tab.site.grade.setHttps(hasHttps, hasHttps);

                        console.info(tab.site.grade);
                        tab.updateBadgeIcon();

                        if (tab.statusCode === 200 && !tab.site.didIncrementCompaniesData) {
                            if (tab.trackers && Object.keys(tab.trackers).length > 0) {
                                Companies.incrementTotalPagesWithTrackers();
                            }

                            Companies.incrementTotalPages();
                            tab.site.didIncrementCompaniesData = true;
                        }

                        if (tab.statusCode === 200) tab.endStopwatch();
                    }
                }
            }
        }
    }, {
        key: 'updateTabUrl',
        value: function updateTabUrl(request) {
            // Update tab data. This makes
            // sure we have the correct url after any https rewrites
            var tab = tabManager.get({ tabId: request.tabId });

            if (tab) {
                tab.statusCode = request.statusCode;
                if (tab.statusCode === 200) {
                    tab.updateSite(request.url);
                }
            }
        }
    }]);

    return TabManager;
}();

var tabManager = new TabManager();

module.exports = tabManager;

},{"./chrome-wrapper.es6":22,"./classes/tab.es6":26,"./companies.es6":29,"./settings.es6":38}],42:[function(require,module,exports){
'use strict';

var utils = require('./utils.es6');
var tldts = require('tldts');
var Trackers = require('@duckduckgo/privacy-grade').Trackers;
module.exports = new Trackers({ tldjs: tldts, utils: utils });

},{"./utils.es6":43,"@duckduckgo/privacy-grade":1,"tldts":13}],43:[function(require,module,exports){
'use strict';

var tldts = require('tldts');
var tdsStorage = require('./storage/tds.es6');
var constants = require('../../data/constants');
var parseUserAgentString = require('../shared-utils/parse-user-agent-string.es6');
var browserInfo = parseUserAgentString();

function extractHostFromURL(url, shouldKeepWWW) {
    if (!url) return '';

    var urlObj = tldts.parse(url);
    var hostname = urlObj.hostname || '';

    if (!shouldKeepWWW) {
        hostname = hostname.replace(/^www\./, '');
    }

    return hostname;
}

function extractTopSubdomainFromHost(host) {
    if (typeof host !== 'string') return false;
    var rgx = /\./g;
    if (host.match(rgx) && host.match(rgx).length > 1) {
        return host.split('.')[0];
    }
    return false;
}

// pull off subdomains and look for parent companies
function findParent(url) {
    var parts = extractHostFromURL(url).split('.');

    while (parts.length > 1) {
        var joinURL = parts.join('.');

        if (tdsStorage.tds.domains[joinURL]) {
            return tdsStorage.tds.domains[joinURL];
        }
        parts.shift();
    }
}

function getCurrentURL(callback) {
    chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabData) {
        if (tabData.length) {
            callback(tabData[0].url);
        }
    });
}

function getCurrentTab(callback) {
    return new Promise(function (resolve, reject) {
        chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabData) {
            if (tabData.length) {
                resolve(tabData[0]);
            }
        });
    });
}

// Browser / Version detection
// Get correct name for fetching UI assets
function getBrowserName() {
    if (!browserInfo || !browserInfo.browser) return;

    var browser = browserInfo.browser.toLowerCase();
    if (browser === 'firefox') browser = 'moz';

    return browser;
}

// Determine if upgradeToSecure supported (Firefox 59+)
function getUpgradeToSecureSupport() {
    var canUpgrade = false;
    if (getBrowserName() !== 'moz') return canUpgrade;

    if (browserInfo && browserInfo.version >= 59) {
        canUpgrade = true;
    }

    return canUpgrade;
}

// Chrome errors with 'beacon', but supports 'ping'
// Firefox only blocks 'beacon' (even though it should support 'ping')
function getBeaconName() {
    var beaconNamesByBrowser = {
        'chrome': 'ping',
        'moz': 'beacon'
    };

    return beaconNamesByBrowser[getBrowserName()];
}

// Return requestListenerTypes + beacon or ping
function getUpdatedRequestListenerTypes() {
    var requestListenerTypes = constants.requestListenerTypes.slice();
    requestListenerTypes.push(getBeaconName());

    return requestListenerTypes;
}

// return true if browser allows to handle request async
function getAsyncBlockingSupport() {
    var browser = getBrowserName();

    if (browser === 'moz' && browserInfo && browserInfo.version >= 52) {
        return true;
    } else if (browser === 'chrome') {
        return false;
    }

    console.warn('Unrecognized browser "' + browser + '" - async response disallowed');
    return false;
}

module.exports = {
    extractHostFromURL: extractHostFromURL,
    extractTopSubdomainFromHost: extractTopSubdomainFromHost,
    getCurrentURL: getCurrentURL,
    getCurrentTab: getCurrentTab,
    getBrowserName: getBrowserName,
    getUpgradeToSecureSupport: getUpgradeToSecureSupport,
    getAsyncBlockingSupport: getAsyncBlockingSupport,
    findParent: findParent,
    getBeaconName: getBeaconName,
    getUpdatedRequestListenerTypes: getUpdatedRequestListenerTypes
};

},{"../../data/constants":14,"../shared-utils/parse-user-agent-string.es6":44,"./storage/tds.es6":40,"tldts":13}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
(function (process,global){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint-disable */
/*
 * [js-sha1]{@link https://github.com/emn178/js-sha1}
 *
 * @version 0.6.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */
/*jslint bitwise: true */
(function () {
  'use strict';

  var root = (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' ? window : {};
  var NODE_JS = !root.JS_SHA1_NO_NODE_JS && (typeof process === 'undefined' ? 'undefined' : _typeof(process)) === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = global;
  }
  var COMMON_JS = !root.JS_SHA1_NO_COMMON_JS && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports;
  var AMD = typeof define === 'function' && define.amd;
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [-2147483648, 8388608, 32768, 128];
  var SHIFT = [24, 16, 8, 0];
  var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];

  var blocks = [];

  var createOutputMethod = function createOutputMethod(outputType) {
    return function (message) {
      return new Sha1(true).update(message)[outputType]();
    };
  };

  var createMethod = function createMethod() {
    var method = createOutputMethod('hex');
    if (NODE_JS) {
      method = nodeWrap(method);
    }
    method.create = function () {
      return new Sha1();
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(type);
    }
    return method;
  };

  var nodeWrap = function nodeWrap(method) {
    var crypto = eval("require('crypto')");
    var Buffer = eval("require('buffer').Buffer");
    var nodeMethod = function nodeMethod(message) {
      if (typeof message === 'string') {
        return crypto.createHash('sha1').update(message, 'utf8').digest('hex');
      } else if (message.constructor === ArrayBuffer) {
        message = new Uint8Array(message);
      } else if (message.length === undefined) {
        return method(message);
      }
      return crypto.createHash('sha1').update(new Buffer(message)).digest('hex');
    };
    return nodeMethod;
  };

  function Sha1(sharedMemory) {
    if (sharedMemory) {
      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      this.blocks = blocks;
    } else {
      this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    this.h0 = 0x67452301;
    this.h1 = 0xEFCDAB89;
    this.h2 = 0x98BADCFE;
    this.h3 = 0x10325476;
    this.h4 = 0xC3D2E1F0;

    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
  }

  Sha1.prototype.update = function (message) {
    if (this.finalized) {
      return;
    }
    var notString = typeof message !== 'string';
    if (notString && message.constructor === root.ArrayBuffer) {
      message = new Uint8Array(message);
    }
    var code,
        index = 0,
        i,
        length = message.length || 0,
        blocks = this.blocks;

    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }

      if (notString) {
        for (i = this.start; index < length && i < 64; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < 64; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >> 2] |= (0xc0 | code >> 6) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >> 2] |= (0xe0 | code >> 12) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + ((code & 0x3ff) << 10 | message.charCodeAt(++index) & 0x3ff);
            blocks[i >> 2] |= (0xf0 | code >> 18) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code >> 12 & 0x3f) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
          }
        }
      }

      this.lastByteIndex = i;
      this.bytes += i - this.start;
      if (i >= 64) {
        this.block = blocks[16];
        this.start = i - 64;
        this.hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }
    if (this.bytes > 4294967295) {
      this.hBytes += this.bytes / 4294967296 << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  };

  Sha1.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    var blocks = this.blocks,
        i = this.lastByteIndex;
    blocks[16] = this.block;
    blocks[i >> 2] |= EXTRA[i & 3];
    this.block = blocks[16];
    if (i >= 56) {
      if (!this.hashed) {
        this.hash();
      }
      blocks[0] = this.block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
    blocks[15] = this.bytes << 3;
    this.hash();
  };

  Sha1.prototype.hash = function () {
    var a = this.h0,
        b = this.h1,
        c = this.h2,
        d = this.h3,
        e = this.h4;
    var f,
        j,
        t,
        blocks = this.blocks;

    for (j = 16; j < 80; ++j) {
      t = blocks[j - 3] ^ blocks[j - 8] ^ blocks[j - 14] ^ blocks[j - 16];
      blocks[j] = t << 1 | t >>> 31;
    }

    for (j = 0; j < 20; j += 5) {
      f = b & c | ~b & d;
      t = a << 5 | a >>> 27;
      e = t + f + e + 1518500249 + blocks[j] << 0;
      b = b << 30 | b >>> 2;

      f = a & b | ~a & c;
      t = e << 5 | e >>> 27;
      d = t + f + d + 1518500249 + blocks[j + 1] << 0;
      a = a << 30 | a >>> 2;

      f = e & a | ~e & b;
      t = d << 5 | d >>> 27;
      c = t + f + c + 1518500249 + blocks[j + 2] << 0;
      e = e << 30 | e >>> 2;

      f = d & e | ~d & a;
      t = c << 5 | c >>> 27;
      b = t + f + b + 1518500249 + blocks[j + 3] << 0;
      d = d << 30 | d >>> 2;

      f = c & d | ~c & e;
      t = b << 5 | b >>> 27;
      a = t + f + a + 1518500249 + blocks[j + 4] << 0;
      c = c << 30 | c >>> 2;
    }

    for (; j < 40; j += 5) {
      f = b ^ c ^ d;
      t = a << 5 | a >>> 27;
      e = t + f + e + 1859775393 + blocks[j] << 0;
      b = b << 30 | b >>> 2;

      f = a ^ b ^ c;
      t = e << 5 | e >>> 27;
      d = t + f + d + 1859775393 + blocks[j + 1] << 0;
      a = a << 30 | a >>> 2;

      f = e ^ a ^ b;
      t = d << 5 | d >>> 27;
      c = t + f + c + 1859775393 + blocks[j + 2] << 0;
      e = e << 30 | e >>> 2;

      f = d ^ e ^ a;
      t = c << 5 | c >>> 27;
      b = t + f + b + 1859775393 + blocks[j + 3] << 0;
      d = d << 30 | d >>> 2;

      f = c ^ d ^ e;
      t = b << 5 | b >>> 27;
      a = t + f + a + 1859775393 + blocks[j + 4] << 0;
      c = c << 30 | c >>> 2;
    }

    for (; j < 60; j += 5) {
      f = b & c | b & d | c & d;
      t = a << 5 | a >>> 27;
      e = t + f + e - 1894007588 + blocks[j] << 0;
      b = b << 30 | b >>> 2;

      f = a & b | a & c | b & c;
      t = e << 5 | e >>> 27;
      d = t + f + d - 1894007588 + blocks[j + 1] << 0;
      a = a << 30 | a >>> 2;

      f = e & a | e & b | a & b;
      t = d << 5 | d >>> 27;
      c = t + f + c - 1894007588 + blocks[j + 2] << 0;
      e = e << 30 | e >>> 2;

      f = d & e | d & a | e & a;
      t = c << 5 | c >>> 27;
      b = t + f + b - 1894007588 + blocks[j + 3] << 0;
      d = d << 30 | d >>> 2;

      f = c & d | c & e | d & e;
      t = b << 5 | b >>> 27;
      a = t + f + a - 1894007588 + blocks[j + 4] << 0;
      c = c << 30 | c >>> 2;
    }

    for (; j < 80; j += 5) {
      f = b ^ c ^ d;
      t = a << 5 | a >>> 27;
      e = t + f + e - 899497514 + blocks[j] << 0;
      b = b << 30 | b >>> 2;

      f = a ^ b ^ c;
      t = e << 5 | e >>> 27;
      d = t + f + d - 899497514 + blocks[j + 1] << 0;
      a = a << 30 | a >>> 2;

      f = e ^ a ^ b;
      t = d << 5 | d >>> 27;
      c = t + f + c - 899497514 + blocks[j + 2] << 0;
      e = e << 30 | e >>> 2;

      f = d ^ e ^ a;
      t = c << 5 | c >>> 27;
      b = t + f + b - 899497514 + blocks[j + 3] << 0;
      d = d << 30 | d >>> 2;

      f = c ^ d ^ e;
      t = b << 5 | b >>> 27;
      a = t + f + a - 899497514 + blocks[j + 4] << 0;
      c = c << 30 | c >>> 2;
    }

    this.h0 = this.h0 + a << 0;
    this.h1 = this.h1 + b << 0;
    this.h2 = this.h2 + c << 0;
    this.h3 = this.h3 + d << 0;
    this.h4 = this.h4 + e << 0;
  };

  Sha1.prototype.hex = function () {
    this.finalize();

    var h0 = this.h0,
        h1 = this.h1,
        h2 = this.h2,
        h3 = this.h3,
        h4 = this.h4;

    return HEX_CHARS[h0 >> 28 & 0x0F] + HEX_CHARS[h0 >> 24 & 0x0F] + HEX_CHARS[h0 >> 20 & 0x0F] + HEX_CHARS[h0 >> 16 & 0x0F] + HEX_CHARS[h0 >> 12 & 0x0F] + HEX_CHARS[h0 >> 8 & 0x0F] + HEX_CHARS[h0 >> 4 & 0x0F] + HEX_CHARS[h0 & 0x0F] + HEX_CHARS[h1 >> 28 & 0x0F] + HEX_CHARS[h1 >> 24 & 0x0F] + HEX_CHARS[h1 >> 20 & 0x0F] + HEX_CHARS[h1 >> 16 & 0x0F] + HEX_CHARS[h1 >> 12 & 0x0F] + HEX_CHARS[h1 >> 8 & 0x0F] + HEX_CHARS[h1 >> 4 & 0x0F] + HEX_CHARS[h1 & 0x0F] + HEX_CHARS[h2 >> 28 & 0x0F] + HEX_CHARS[h2 >> 24 & 0x0F] + HEX_CHARS[h2 >> 20 & 0x0F] + HEX_CHARS[h2 >> 16 & 0x0F] + HEX_CHARS[h2 >> 12 & 0x0F] + HEX_CHARS[h2 >> 8 & 0x0F] + HEX_CHARS[h2 >> 4 & 0x0F] + HEX_CHARS[h2 & 0x0F] + HEX_CHARS[h3 >> 28 & 0x0F] + HEX_CHARS[h3 >> 24 & 0x0F] + HEX_CHARS[h3 >> 20 & 0x0F] + HEX_CHARS[h3 >> 16 & 0x0F] + HEX_CHARS[h3 >> 12 & 0x0F] + HEX_CHARS[h3 >> 8 & 0x0F] + HEX_CHARS[h3 >> 4 & 0x0F] + HEX_CHARS[h3 & 0x0F] + HEX_CHARS[h4 >> 28 & 0x0F] + HEX_CHARS[h4 >> 24 & 0x0F] + HEX_CHARS[h4 >> 20 & 0x0F] + HEX_CHARS[h4 >> 16 & 0x0F] + HEX_CHARS[h4 >> 12 & 0x0F] + HEX_CHARS[h4 >> 8 & 0x0F] + HEX_CHARS[h4 >> 4 & 0x0F] + HEX_CHARS[h4 & 0x0F];
  };

  Sha1.prototype.toString = Sha1.prototype.hex;

  Sha1.prototype.digest = function () {
    this.finalize();

    var h0 = this.h0,
        h1 = this.h1,
        h2 = this.h2,
        h3 = this.h3,
        h4 = this.h4;

    return [h0 >> 24 & 0xFF, h0 >> 16 & 0xFF, h0 >> 8 & 0xFF, h0 & 0xFF, h1 >> 24 & 0xFF, h1 >> 16 & 0xFF, h1 >> 8 & 0xFF, h1 & 0xFF, h2 >> 24 & 0xFF, h2 >> 16 & 0xFF, h2 >> 8 & 0xFF, h2 & 0xFF, h3 >> 24 & 0xFF, h3 >> 16 & 0xFF, h3 >> 8 & 0xFF, h3 & 0xFF, h4 >> 24 & 0xFF, h4 >> 16 & 0xFF, h4 >> 8 & 0xFF, h4 & 0xFF];
  };

  Sha1.prototype.array = Sha1.prototype.digest;

  Sha1.prototype.arrayBuffer = function () {
    this.finalize();

    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint32(0, this.h0);
    dataView.setUint32(4, this.h1);
    dataView.setUint32(8, this.h2);
    dataView.setUint32(12, this.h3);
    dataView.setUint32(16, this.h4);
    return buffer;
  };

  var exports = createMethod();

  if (COMMON_JS) {
    module.exports = exports;
  } else {
    root.sha1 = exports;
    if (AMD) {
      define(function () {
        return exports;
      });
    }
  }
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":5}]},{},[20]);
