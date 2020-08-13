// Jason: had to refactor this polyfill for node.js (require etc.) because of cws obfuscation issue
(function(func) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = func()
    } else if (typeof define === "function" && define.amd) {
        define([], func)
    } else {
        var container;
        if (typeof window !== "undefined") {
        	container = window
        } else if (typeof global !== "undefined") {
        	container = global
        } else if (typeof self !== "undefined") {
        	container = self
        } else {
        	container = this
        }
        container.Recorder = func()
    }
})(function() {
        var define, module, exports;
        return (function eFunc(tvar, nvar, rvar) {
                function sFunc(ovar, uvar) {
                    if (!nvar[ovar]) {
                        if (!tvar[ovar]) {
                            var a = typeof require == "function" && require;
                            if (!uvar && a) return a(ovar, !0);
                            if (i) return i(ovar, !0);
                            var error = new Error("Cannot find module '" + ovar + "'");
                            throw error.code = "MODULE_NOT_FOUND", error
                        }
                        var l = nvar[ovar] = {
                            exports: {}
                        };
                        tvar[ovar][0].call(l.exports, function(e) {
                            var nvar = tvar[ovar][1][e];
                            return sFunc(nvar ? nvar : e)
                        }, l, l.exports, eFunc, tvar, nvar, rvar)
                    }
                    return nvar[ovar].exports
                }
                var i = typeof require == "function" && require;
                for (var o = 0; o < rvar.length; o++) sFunc(rvar[o]);
                return sFunc
            })({
                    1: [function(require, module, exports) {

"use strict";

module.exports = require("./recorder").Recorder;

},{"./recorder":2}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Recorder = undefined;

var _inlineWorker = require('inline-worker');

var _inlineWorker2 = _interopRequireDefault(_inlineWorker);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Recorder = exports.Recorder = (function () {
    function Recorder(source, cfg) {
        var _this = this;

        _classCallCheck(this, Recorder);

        this.config = {
            bufferLen: 4096,
            numChannels: 2,
            mimeType: 'audio/wav'
        };
        this.recording = false;
        this.callbacks = {
            getBuffer: [],
            exportWAV: []
        };

        Object.assign(this.config, cfg);
        this.context = source.context;
        this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, this.config.bufferLen, this.config.numChannels, this.config.numChannels);

        this.node.onaudioprocess = function (e) {
            if (!_this.recording) return;

            var buffer = [];
            for (var channel = 0; channel < _this.config.numChannels; channel++) {
                buffer.push(e.inputBuffer.getChannelData(channel));
            }
            _this.worker.postMessage({
                command: 'record',
                buffer: buffer
            });
        };

        source.connect(this.node);
        this.node.connect(this.context.destination); //this should not be necessary

        var self = {};
        this.worker = new _inlineWorker2.default(function () {

        	// inserted Resampler class here inside worker
			 var Resampler = function( config ){
			  this.originalSampleRate = config.originalSampleRate;
			  this.numberOfChannels = config.numberOfChannels;
			  this.resampledRate = config.resampledRate;
			  this.lastSampleCache = [];
			
			  for ( var i = 0; i < this.numberOfChannels; i++ ){
			    this.lastSampleCache[i] = [0,0];
			  }
			
			  if ( this.resampledRate === this.originalSampleRate ) {
			    this.resample = function( buffer ) { return buffer; };
			  }
			};
			
			// From http://johncostella.webs.com/magic/
			Resampler.prototype.magicKernel = function( x ) {
			  if ( x < -0.5 ) {
			    return 0.5 * ( x + 1.5 ) * ( x + 1.5 );
			  }
			  else if ( x > 0.5 ) {
			    return 0.5 * ( x - 1.5 ) * ( x - 1.5 );
			  }
			  return 0.75 - ( x * x );
			};
			
			Resampler.prototype.resample = function( buffer, channel ) {
			  var resampledBufferLength = Math.round( buffer.length * this.resampledRate / this.originalSampleRate );
			  var resampleRatio = buffer.length / resampledBufferLength;
			  var outputData = new Float32Array( resampledBufferLength );
			
			  for ( var i = 0; i < resampledBufferLength - 1; i++ ) {
			    var resampleValue = ( resampleRatio - 1 ) + ( i * resampleRatio );
			    var nearestPoint = Math.round( resampleValue );
			
			    for ( var tap = -1; tap < 2; tap++ ) {
			      var sampleValue = buffer[ nearestPoint + tap ] || this.lastSampleCache[ channel ][ 1 + tap ] || buffer[ nearestPoint ];
			      outputData[ i ] += sampleValue * this.magicKernel( resampleValue - nearestPoint - tap );
			    }
			  }
			
			  this.lastSampleCache[ channel ][ 0 ] = buffer[ buffer.length - 2 ];
			  this.lastSampleCache[ channel ][ 1 ] = outputData[ resampledBufferLength - 1 ] = buffer[ buffer.length - 1 ];
			
			  return outputData;
			};
			

            var recLength = 0,
                recBuffers = [],
                sampleRate = undefined,
                numChannels = undefined;

            self.onmessage = function (e) {
                switch (e.data.command) {
                    case 'init':
                        init(e.data.config);
                        break;
                    case 'record':
                        record(e.data.buffer);
                        break;
                    case 'exportWAV':
                        exportWAV(e.data.type, e.data.sampleRate);
                        break;
                    case 'getBuffer':
                        getBuffer();
                        break;
                    case 'clear':
                        clear();
                        break;
                }
            };

            function init(config) {
                sampleRate = config.sampleRate;
                numChannels = config.numChannels;
                initBuffers();
            }

            function record(inputBuffer) {
                for (var channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel].push(inputBuffer[channel]);
                }
                recLength += inputBuffer[0].length;
            }

            function exportWAV(type, resampledRate) {

            	// jason: resampler added to reduce bitrate
				var resampler = new Resampler({
				    resampledRate: resampledRate,
				    originalSampleRate: sampleRate,
				    numberOfChannels: numChannels
				});

                var buffers = [];
                for (var channel = 0; channel < numChannels; channel++) {
                    //buffers.push(mergeBuffers(recBuffers[channel], recLength));
					buffers.push( resampler.resample(mergeBuffers(recBuffers[channel], recLength), channel) );
                }
                var interleaved = undefined;
                if (numChannels === 2) {
                    interleaved = interleave(buffers[0], buffers[1]);
                } else {
                    interleaved = buffers[0];
                }
                var dataview = encodeWAV(interleaved, resampledRate);
                var audioBlob = new Blob([dataview], { type: type });

                self.postMessage({ command: 'exportWAV', data: audioBlob });
            }

            function getBuffer() {
                var buffers = [];
                for (var channel = 0; channel < numChannels; channel++) {
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                }
                self.postMessage({ command: 'getBuffer', data: buffers });
            }

            function clear() {
                recLength = 0;
                recBuffers = [];
                initBuffers();
            }

            function initBuffers() {
                for (var channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel] = [];
                }
            }

            function mergeBuffers(recBuffers, recLength) {
                var result = new Float32Array(recLength);
                var offset = 0;
                for (var i = 0; i < recBuffers.length; i++) {
                    result.set(recBuffers[i], offset);
                    offset += recBuffers[i].length;
                }
                return result;
            }

            function interleave(inputL, inputR) {
                var length = inputL.length + inputR.length;
                var result = new Float32Array(length);

                var index = 0,
                    inputIndex = 0;

                while (index < length) {
                    result[index++] = inputL[inputIndex];
                    result[index++] = inputR[inputIndex];
                    inputIndex++;
                }
                return result;
            }

            function floatTo16BitPCM(output, offset, input) {
                for (var i = 0; i < input.length; i++, offset += 2) {
                    var s = Math.max(-1, Math.min(1, input[i]));
                    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
            }

            function writeString(view, offset, string) {
                for (var i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            function encodeWAV(samples, resampledRate) {
            	if (resampledRate) {
            		sampleRate = resampledRate;
            	}
				console.log("samplerateA", sampleRate);

                var buffer = new ArrayBuffer(44 + samples.length * 2);
                var view = new DataView(buffer);

                /* RIFF identifier */
                writeString(view, 0, 'RIFF');
                /* RIFF chunk length */
                view.setUint32(4, 36 + samples.length * 2, true);
                /* RIFF type */
                writeString(view, 8, 'WAVE');
                /* format chunk identifier */
                writeString(view, 12, 'fmt ');
                /* format chunk length */
                view.setUint32(16, 16, true);
                /* sample format (raw) */
                view.setUint16(20, 1, true);
                /* channel count */
                view.setUint16(22, numChannels, true);
                /* sample rate */
                view.setUint32(24, sampleRate, true);
                /* byte rate (sample rate * block align) */
                //view.setUint32(28, sampleRate * 4, true);
				// jason patch for mono
				view.setUint32(28, sampleRate * numChannels * 2, true);
				console.log("samplerate", sampleRate);
                /* block align (channel count * bytes per sample) */
                view.setUint16(32, numChannels * 2, true);
                /* bits per sample */
                view.setUint16(34, 16, true);
                /* data chunk identifier */
                writeString(view, 36, 'data');
                /* data chunk length */
                view.setUint32(40, samples.length * 2, true);

                floatTo16BitPCM(view, 44, samples);

                return view;
            }
        }, self);

        this.worker.postMessage({
            command: 'init',
            config: {
                sampleRate: this.context.sampleRate,
                numChannels: this.config.numChannels
            }
        });

		console.log("pstmessage", this);

        this.worker.onmessage = function (e) {
            var cb = _this.callbacks[e.data.command].pop();
            if (typeof cb == 'function') {
                cb(e.data.data);
            }
        };
    }

    _createClass(Recorder, [{
        key: 'record',
        value: function record() {
            this.recording = true;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.recording = false;
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.worker.postMessage({ command: 'clear' });
        }
    }, {
        key: 'getBuffer',
        value: function getBuffer(cb) {
            cb = cb || this.config.callback;
            if (!cb) throw new Error('Callback not set');

            this.callbacks.getBuffer.push(cb);

            this.worker.postMessage({ command: 'getBuffer' });
        }
    }, {
        key: 'exportWAV',
        value: function exportWAV(cb, mimeType, sampleRate) {
            mimeType = mimeType || this.config.mimeType;
            cb = cb || this.config.callback;
            if (!cb) throw new Error('Callback not set');

            this.callbacks.exportWAV.push(cb);

            this.worker.postMessage({
                command: 'exportWAV',
                type: mimeType,
                sampleRate: sampleRate
            });
        }
    }], [{
        key: 'forceDownload',
        value: function forceDownload(blob, filename) {
            var url = (window.URL || window.webkitURL).createObjectURL(blob);
            var link = window.document.createElement('a');
            link.href = url;
            link.download = filename || 'output.wav';
            var click = document.createEvent("Event");
            click.initEvent("click", true, true);
            link.dispatchEvent(click);
        }
    }]);

    return Recorder;
})();

exports.default = Recorder;

},{"inline-worker":3}],3:[function(require,module,exports){
"use strict";

module.exports = require("./inline-worker");
},{"./inline-worker":4}],4:[function(require,module,exports){
(function (global){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

var InlineWorker = (function () {
  function InlineWorker(func, self) {
    var _this = this;

    _classCallCheck(this, InlineWorker);

    if (WORKER_ENABLED) {
      var functionBody = func.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];
      var url = global.URL.createObjectURL(new global.Blob([functionBody], { type: "text/javascript" }));

      return new global.Worker(url);
    }

    this.self = self;
    this.self.postMessage = function (data) {
      setTimeout(function () {
        _this.onmessage({ data: data });
      }, 0);
    };

    setTimeout(function () {
      func.call(self);
    }, 0);
  }

  _createClass(InlineWorker, {
    postMessage: {
      value: function postMessage(data) {
        var _this = this;

        setTimeout(function () {
          _this.self.onmessage({ data: data });
        }, 0);
      }
    }
  });

  return InlineWorker;
})();

module.exports = InlineWorker;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});