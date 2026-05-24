/*!
 * wavesurfer.js 2.0.5 (Thu Jun 28 2018 18:36:40 GMT-0700 (Pacific Daylight Time))
 * https://github.com/katspaugh/wavesurfer.js
 * @license BSD-3-Clause
 */





/*
  function ASMWaveProcessor (stdlib, foreign, buffer) {
    'use asm';

    var MULT = stdlib.Math.imul;
    var FLOOR = stdlib.Math.floor;
    var MIN = stdlib.Math.min;
    var MAX = stdlib.Math.max;

    var HEAPU8 = new stdlib.Uint8Array( buffer );
    var HEAPF32 = new stdlib.Float32Array( buffer );
    var HEAPI32 = new stdlib.Uint32Array( buffer );

    function GetPeaks (init, length, first, sampleStep, sampleSize) {
        init = init|0;
        length = length|0;
        first = first|0;
        sampleStep = sampleStep|0;
        sampleSize = +sampleSize;

        var i = 0;
        var j = 0;
        var min = 0.0;
        var max = 0.0;
        var start = 0;
        var end = 0;
        var value = 0.0;


        // var peaks = this.splitPeaks[c];
        for(i = init; (i|0) <= (length|0); i = (i + 1)|0) {
            start = first|0 + ~~FLOOR(+(i|0)*sampleSize)|0;
            end = (start|0) + ~~FLOOR(sampleSize)|0;
            min = 0.0;
            max = 0.0;

            for (j = start; (j|0) < (end|0); j = (j + sampleStep)|0) {
                 value = +HEAPF32[ ((j|0) << 2) >> 2];

                 max = MAX(max, value);
                 min = MIN(min, value);
            }

            // put it in the end of the array...
            // console.log( 'aa ',  2 * i, max );
            HEAPF32[ (MULT(2, i|0) << 2) >> 2 ] = max;
            HEAPF32[ ((MULT(2, i|0) + 1) << 2) >> 2 ] = min;
        }


                ///////////////////////////
                for (i = init; i <= length; ++i) {
                    var start = first + (i * sampleSize) >> 0;
                    var end = (start + sampleSize) >> 0;
                    var min = 0;
                    var max = 0;
                    var j = void 0;

                    for (j = start; j < end; j += sampleStep) {
                        var value = chan[j];


                        if (value > max) {
                            max = value;
                        }

                        else if (value < min) {
                            min = value;

                            //console.log( value );
                        }
                    }

                   // if (window.rr === 1)
                   // {
                   //     console.log(1);
                   // }

                    peaks[2 * i] = max;
                    peaks[2 * i + 1] = min;
                }
                ///////////////////////////


    }

    return { GetPeaks: GetPeaks };
  }

  var ASM_HEAP = new ArrayBuffer( 16777216 * 2 );
  var ASM_stdlib = { Math: Math, Float32Array: Float32Array, Uint8Array: Uint8Array, Uint32Array: Uint32Array };
  var ASM_LIB = new ASMWaveProcessor (ASM_stdlib, null, ASM_HEAP);
  */



(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("WaveSurfer", [], factory);
	else if(typeof exports === 'object')
		exports["WaveSurfer"] = factory();
	else
		root["WaveSurfer"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/wavesurfer.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/drawer.js":
/*!***********************!*\
  !*** ./src/drawer.js ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = __webpack_require__(/*! ./util */ "./src/util/index.js");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Parent class for renderers
 *
 * @extends {Observer}
 */
var Drawer = function (_util$Observer) {
    _inherits(Drawer, _util$Observer);

    /**
     * @param {HTMLElement} container The container node of the wavesurfer instance
     * @param {WavesurferParams} params The wavesurfer initialisation options
     */
    function Drawer(container, params) {
        _classCallCheck(this, Drawer);

        /** @private */
        var _this = _possibleConstructorReturn(this, (Drawer.__proto__ || Object.getPrototypeOf(Drawer)).call(this));

        _this.container = container;
        /**
         * @type {WavesurferParams}
         * @private
         */
        _this.params = params;
        /**
         * The width of the renderer
         * @type {number}
         */
        _this.width = 0;
        /**
         * The height of the renderer
         * @type {number}
         */
        _this.height = params.height * _this.params.pixelRatio;
        /** @private */
        _this.lastPos = 0;
        /**
         * The `<wave>` element which is added to the container
         * @type {HTMLElement}
         */
        _this.wrapper = null;
        return _this;
    }

    /**
     * Alias of `util.style`
     *
     * @param {HTMLElement} el The element that the styles will be applied to
     * @param {Object} styles The map of propName: attribute, both are used as-is
     * @return {HTMLElement} el
     */


    _createClass(Drawer, [{
        key: 'style',
        value: function style(el, styles) {

            return util.style(el, styles);
        }

        /**
         * Create the wrapper `<wave>` element, style it and set up the events for
         * interaction
         */

    }, {
        key: 'createWrapper',
        value: function createWrapper() {
            this.wrapper = this.container.appendChild(document.createElement('wave'));

            this.style(this.wrapper, {
                display: 'block',
                position: 'relative',
                userSelect: 'none',
                webkitUserSelect: 'none',
                height: this.params.height + 'px'
            });

            if (this.params.fillParent || this.params.scrollParent) {
                this.style(this.wrapper, {
                    width: '100%',
                    overflowX: this.params.hideScrollbar ? 'hidden' : 'auto',
                    overflowY: 'hidden'
                });
            }

            this.setupWrapperEvents();
        }

        /**
         * Handle click event
         *
         * @param {Event} e Click event
         * @param {?boolean} noPrevent Set to true to not call `e.preventDefault()`
         * @return {number} Playback position from 0 to 1
         */

    }, {
        key: 'handleEvent',
        value: function handleEvent(e, noPrevent) {
            !noPrevent && e.preventDefault();

            var clientX = (e.targetTouches && e.targetTouches[0]) ? e.targetTouches[0].clientX : e.clientX;

            var bbox = this.wrapper.getBoundingClientRect();
            this._bbox = bbox;
            var nominalWidth = Math.max(1, bbox.width);

            var progress = (clientX - bbox.left) / nominalWidth;
            return Math.max(0, Math.min(1, progress || 0));
        }

        /**
         * @private
         */

    }, {
        key: 'setupWrapperEvents',
        value: function setupWrapperEvents() {
            var _this2 = this;

            this.wrapper.addEventListener('click', function (e) {
            //    var scrollbarHeight = _this2.wrapper.offsetHeight - _this2.wrapper.clientHeight;
            //    if (scrollbarHeight != 0) {
                    // scrollbar is visible.  Check if click was on it
            //        var bbox = _this2.wrapper.getBoundingClientRect();
            //        if (e.clientY >= bbox.bottom - scrollbarHeight) {
                        // ignore mousedown as it was on the scrollbar
            //            return;
            //        }
            //    }

                if (_this2.params.interact) {
                    _this2.fireEvent('click', e, _this2.handleEvent(e));
                }
            });

            this.wrapper.addEventListener('touchstart', function (e) {
                if (_this2.params.interact) {
                    _this2.fireEvent('touchstart', e);
                }
            });
            this.wrapper.addEventListener('touchmove', function (e) {
                if (_this2.params.interact) {
                    _this2.fireEvent('touchmove', e);
                }
            });
            this.wrapper.addEventListener('touchend', function (e) {
                if (_this2.params.interact) {
                    _this2.fireEvent('touchend', e);
                }
            });



            this.wrapper.addEventListener('scroll', function (e) {
                return _this2.fireEvent('scroll', e);
            });
            this.wrapper.addEventListener('wheel', function (e) {
                return _this2.fireEvent('wheel', e);
            });
        }

        /**
         * Draw peaks on the canvas
         *
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} length The width of the area that should be drawn
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that should be
         * rendered
         */

    }, {
        key: 'drawPeaks',
        value: function drawPeaks(peaks, length, start, end, totalChannels, shift) {
            var _this3 = this;

            requestAnimationFrame(function () {
                _this3.shift = shift;

                //if (shift === 999999999 && !_this3.shiftClear) {
                //    return ;
                //}

                if (!_this3.setWidth(length)) {
                    _this3.clearWave();
                }

                // _this3.params.barWidth ? _this3.drawBars(peaks, 0, start, end) : 
                _this3.drawWave(peaks, 0, start, end, totalChannels);
            });
        }
        /**
         * Scroll to the beginning
         */

    }, {
        key: 'resetScroll',
        value: function resetScroll() {
            if (this.wrapper !== null) {
                this.wrapper.scrollLeft = 0;
            }
        }

        /**
         * Recenter the viewport at a certain percent of the waveform
         *
         * @param {number} percent Value from 0 to 1 on the waveform
         */
    }, {
        key: 'recenter',
        value: function recenter(percent) {
            var position = this.wrapper.scrollWidth * percent;
            this.recenterOnPosition(position, true);
        }

        /**
         * Recenter the viewport on a position, either scroll there immediately or
         * in steps of 5 pixels
         *
         * @param {number} position X-offset in pixels
         * @param {boolean} immediate Set to true to immediately scroll somewhere
         */

    }, {
        key: 'recenterOnPosition',
        value: function recenterOnPosition(position, immediate) {
            var scrollLeft = this.wrapper.scrollLeft;
            var half = ~~(this.wrapper.clientWidth / 2);
            var maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
            var target = position - half;
            var offset = target - scrollLeft;

            if (maxScroll == 0) {
                // no need to continue if scrollbar is not there
                return;
            }

            // if the cursor is currently visible...
            if (!immediate && -half <= offset && offset < half) {
                // we'll limit the "re-center" rate.
                var rate = 5;
                offset = Math.max(-rate, Math.min(rate, offset));
                target = scrollLeft + offset;
            }

            // limit target to valid range (0 to maxScroll)
            target = Math.max(0, Math.min(maxScroll, target));
            // no use attempting to scroll if we're not moving
            if (target != scrollLeft) {
                this.wrapper.scrollLeft = target;
            }
        }

        /**
         * Get the current scroll position in pixels
         *
         * @return {number}
         */

    }, {
        key: 'getScrollX',
        value: function getScrollX() {
            var pixelRatio = this.params.pixelRatio;
            var x = Math.round(this.wrapper.scrollLeft * pixelRatio);

            // In cases of elastic scroll (safari with mouse wheel) you can
            // scroll beyond the limits of the container
            // Calculate and floor the scrollable extent to make sure an out
            // of bounds value is not returned
            // Ticket #1312
            if (this.params.scrollParent) {
                var maxScroll = ~~(this.wrapper.scrollWidth * pixelRatio - this.getWidth());
                x = Math.min(maxScroll, Math.max(0, x));
            }

            return x;
        }

        /**
         * Get the width of the container
         *
         * @return {number}
         */

    }, {
        key: 'getWidth',
        value: function getWidth() {

            return this._width;
            //return this.width;
            //return Math.round(this.container.clientWidth * this.params.pixelRatio);
        }

        /**
         * Set the width of the container
         *
         * @param {number} width
         */

    }, {
        key: 'setWidth',
        value: function setWidth(width) {
            if (this.width == width) {
                return false;
            }

            this.width = width;

            if (this.params.fillParent || this.params.scrollParent) {
                this.style(this.wrapper, {
                    width: ''
                });
            } else {
                this.style(this.wrapper, {
                    width: ~~(this.width / this.params.pixelRatio) + 'px'
                });
            }

            this.updateSize();
            return true;
        }

        /**
         * Set the height of the container
         *
         * @param {number} height
         */

    }, {
        key: 'setHeight',
        value: function setHeight(height) {
            if (height == this.height) {
                return false;
            }
            this.height = height;

            this.style(this.wrapper, {
                height: ~~(this.height / this.params.pixelRatio) + 'px'
            });

            this.updateSize();
            return true;
        }

        /**
         * Called by wavesurfer when progress should be renderered
         *
         * @param {number} progress From 0 to 1
         */

    }, {
        key: 'progress',
        value: function progress(_progress, left_offset, zoom_factor) {

            if (_progress == 0) {
                this.updateProgress(-1);
                return;
            }

            _progress = (_progress - left_offset) * zoom_factor;

            var minPxDelta = 1 / this.params.pixelRatio;
            var pos = Math.round(_progress * this.width) * minPxDelta;

            //        if (pos < this.lastPos || pos - this.lastPos >= minPxDelta) {
            //            this.lastPos = pos;

            //            if (this.params.scrollParent && this.params.autoCenter) {
            //                const newPos = ~~(this.wrapper.scrollWidth * progress);
            //                this.recenterOnPosition(newPos);
            //            }

            this.updateProgress(pos);
            //        }
        }

        /**
         * This is called when wavesurfer is destroyed
         */

    }, {
        key: 'destroy',
        value: function destroy() {
            this.unAll();
            if (this.wrapper) {
                if (this.wrapper.parentNode == this.container) {
                    this.container.removeChild(this.wrapper);
                }
                this.wrapper = null;
            }
        }

        /* Renderer-specific methods */

        /**
         * Called after cursor related params have changed.
         *
         * @abstract
         */

    }, {
        key: 'updateCursor',
        value: function updateCursor() {}

        /**
         * Called when the size of the container changes so the renderer can adjust
         *
         * @abstract
         */

    }, {
        key: 'updateSize',
        value: function updateSize() {}

        /**
         * Draw a waveform with bars
         *
         * @abstract
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that should be
         * rendered
         */

    }, {
        key: 'drawBars',
        value: function drawBars(peaks, channelIndex, start, end) {}

        /**
         * Draw a waveform
         *
         * @abstract
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that should be
         * rendered
         */

    }, {
        key: 'drawWave',
        value: function drawWave(peaks, channelIndex, start, end) {}

        /**
         * Clear the waveform
         *
         * @abstract
         */

    }, {
        key: 'clearWave',
        value: function clearWave() {}

        /**
         * Render the new progress
         *
         * @abstract
         * @param {number} position X-Offset of progress position in pixels
         */

    }, {
        key: 'updateProgress',
        value: function updateProgress(position) {}
    }]);

    return Drawer;
}(util.Observer);

exports.default = Drawer;
module.exports = exports['default'];

/***/ }),

/***/ "./src/drawer.multicanvas.js":
/*!***********************************!*\
  !*** ./src/drawer.multicanvas.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _drawer = __webpack_require__(/*! ./drawer */ "./src/drawer.js");

var _drawer2 = _interopRequireDefault(_drawer);

var _util = __webpack_require__(/*! ./util */ "./src/util/index.js");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @typedef {Object} CanvasEntry
 * @private
 * @property {HTMLElement} wave The wave node
 * @property {CanvasRenderingContext2D} waveCtx The canvas rendering context
 * @property {?HTMLElement} progress The progress wave node
 * @property {?CanvasRenderingContext2D} progressCtx The progress wave canvas
 * rendering context
 * @property {?number} start Start of the area the canvas should render, between 0 and 1
 * @property {?number} end End of the area the canvas should render, between 0 and 1
 */

/**
 * MultiCanvas renderer for wavesurfer. Is currently the default and sole built
 * in renderer.
 */

        function formatTime( time, format ) {
            var time_s = time >> 0;
            var miliseconds = time - time_s;
            
            if (time_s < 10)
                time_s = '00:0' + time_s;
            else if (time_s < 60)
                time_s = '00:' + time_s;
            else
            {
                var m = time_s / 60;
                m = m >> 0;
                var s = (time_s % 60);
                time_s = ((m<10)?'0':'') + m + ':' + (s < 10 ? '0'+s : s);
            }

            if (format === 1) {
                return time_s + ':' + (miliseconds+'').substr(2, 2);
                // return time_s + ':' + (miliseconds.toFixed(2)+'').substr(2);
            }

            return time_s; // + ':' + (miliseconds.toFixed(2)+'').substr(2);
        }

var MultiCanvas = function (_Drawer) {
    _inherits(MultiCanvas, _Drawer);

    /**
     * @param {HTMLElement} container The container node of the wavesurfer instance
     * @param {WavesurferParams} params The wavesurfer initialisation options
     */
    function MultiCanvas(container, params) {
        _classCallCheck(this, MultiCanvas);

        /**
         * @type {number}
         * @private
         */
        var _this = _possibleConstructorReturn(this, (MultiCanvas.__proto__ || Object.getPrototypeOf(MultiCanvas)).call(this, container, params));

        _this.maxCanvasWidth = params.maxCanvasWidth;
        /**
         * @private
         * @type {number}
         */
        _this.maxCanvasElementWidth = Math.round(params.maxCanvasWidth / params.pixelRatio);

        /**
         * Whether or not the progress wave is renderered. If the `waveColor`
         * and `progressColor` are the same colour it is not.
         * @type {boolean}
         */
        _this.hasProgressCanvas = false; //params.waveColor != params.progressColor;
        /**
         * @private
         * @type {number}
         */
        _this.halfPixel = 0.5 / params.pixelRatio;
        /**
         * @private
         * @type {Array}
         */
        _this.canvases = [];
        /** @private */
        _this.progressWave = null;
        _this.CursorMarker = null;
        return _this;
    }

    /**
     * Initialise the drawer
     */


    _createClass(MultiCanvas, [{
        key: 'init',
        value: function init() {
            this.createWrapper();
            this.createElements();
        }

        /**
         * Create the canvas elements and style them
         *
         * @private
         */

    }, {
        key: 'createElements',
        value: function createElements() {
            this.progressWave = this.wrapper.appendChild(this.style(document.createElement('wave'), {
/*                position: 'absolute',
                zIndex: 3,
                left: 0,
                top: 0,
                bottom: 0,
                overflow: 'hidden',
                width: '0',
                display: 'none',
                boxSizing: 'border-box',
                borderRightStyle: 'solid',
                pointerEvents: 'none'
*/
            }));
            this.progressWave.id = 'pk_prgwv';

            this.addCanvas();

            //this.ZMarker = document.querySelector('.pk_wavepoint');
            this.CursorMarker = document.createElement('div');
            this.CursorMarker.className = 'pk_wave_cursor';
            this.wrapper.appendChild(this.CursorMarker);

            // this.updateCursor();
        }

        /**
         * Update cursor style from params.
         */

    }, {
        key: 'updateCursor',
        value: function updateCursor() {
            this.style(this.progressWave, {
                borderRightWidth: this.params.cursorWidth + 'px',
                borderRightColor: this.params.cursorColor
            });
        }

        /**
         * Adjust to the updated size by adding or removing canvases
         */

    }, {
        key: 'updateSize',
        value: function updateSize() {
            var _this2 = this;

            var totalWidth = Math.round(this.width / this.params.pixelRatio);
            var requiredCanvases = 1; // Math.ceil(totalWidth / this.maxCanvasElementWidth);

            while (this.canvases.length < requiredCanvases) {
                this.addCanvas();
            }

            while (this.canvases.length > requiredCanvases) {
                this.removeCanvas();
            }

            this.canvases.forEach(function (entry, i) {
                // Add some overlap to prevent vertical white stripes, keep the width even for simplicity.
                var canvasWidth = _this2.maxCanvasWidth + 2 * Math.ceil(_this2.params.pixelRatio / 2);

                if (i == _this2.canvases.length - 1) {
                    canvasWidth = _this2.width - _this2.maxCanvasWidth * (_this2.canvases.length - 1);
                }

                _this2.updateDimensions(entry, canvasWidth, _this2.height);
                _this2.clearWaveForEntry(entry);
            });
        }

        /**
         * Add a canvas to the canvas list
         *
         * @private
         */

    }, {
        key: 'addCanvas',
        value: function addCanvas() {
            var entry = {};
            var leftOffset = this.maxCanvasElementWidth * this.canvases.length;

            entry.wave = this.wrapper.appendChild(this.style(document.createElement('canvas'), {
                position: 'absolute',
                zIndex: 2,
                left: leftOffset + 'px',
                top: 0,
                bottom: 0,
                height: '100%',
                pointerEvents: 'none'
            }));
            entry.waveCtx = entry.wave.getContext('2d', {alpha:false, antialias:false});

            entry.waveCtx.font = "12px Arial lighter";
            // entry.waveCtx.textAlign = "center";


            if (this.hasProgressCanvas) {
                entry.progress = this.progressWave.appendChild(this.style(document.createElement('canvas'), {
                    position: 'absolute',
                    left: leftOffset + 'px',
                    top: 0,
                    bottom: 0,
                    height: '100%'
                }));
                entry.progressCtx = entry.progress.getContext('2d', {alpha:false, antialias:false});
            }

            this.canvases.push(entry);
        }

        /**
         * Pop one canvas from the list
         *
         * @private
         */

    }, {
        key: 'removeCanvas',
        value: function removeCanvas() {
            var lastEntry = this.canvases.pop();
            lastEntry.wave.parentElement.removeChild(lastEntry.wave);
            if (this.hasProgressCanvas) {
                lastEntry.progress.parentElement.removeChild(lastEntry.progress);
            }
        }

        /**
         * Update the dimensions of a canvas element
         *
         * @private
         * @param {CanvasEntry} entry
         * @param {number} width The new width of the element
         * @param {number} height The new height of the element
         */

    }, {
        key: 'updateDimensions',
        value: function updateDimensions(entry, width, height) {
            var elementWidth = Math.round(width / this.params.pixelRatio);
            var totalWidth = Math.round(this.width / this.params.pixelRatio);

            // Where the canvas starts and ends in the waveform, represented as a decimal between 0 and 1.
            entry.start = entry.waveCtx.canvas.offsetLeft / totalWidth || 0;
            entry.end = entry.start + elementWidth / totalWidth;

            entry.waveCtx.canvas.width = width;
            entry.waveCtx.canvas.height = height;
            this.style(entry.waveCtx.canvas, { width: elementWidth + 'px' });

            this.style(this.progressWave, { display: 'block' });

            if (this.hasProgressCanvas) {
                entry.progressCtx.canvas.width = width;
                entry.progressCtx.canvas.height = height;
                this.style(entry.progressCtx.canvas, {
                    width: elementWidth + 'px'
                });
            }
        }

        /**
         * Clear the whole waveform
         */

    }, {
        key: 'clearWave',
        value: function clearWave() {
            var _this3 = this;

            this.canvases.forEach(function (entry) {
                return _this3.clearWaveForEntry(entry);
            });
        }

        /**
         * Clear one canvas
         *
         * @private
         * @param {CanvasEntry} entry
         */

    }, {
        key: 'clearWaveForEntry',
        value: function clearWaveForEntry(entry) {

            this.shiftClear = true;

            entry.waveCtx.fillStyle = "#000";
            entry.waveCtx.fillRect(0, 0, entry.waveCtx.canvas.width, entry.waveCtx.canvas.height);
            entry.waveCtx.fillStyle = "#99c2c6";




//            entry.waveCtx.clearRect(0, 0, entry.waveCtx.canvas.width, entry.waveCtx.canvas.height);

//            if (this.hasProgressCanvas) {
//                entry.progressCtx.clearRect(0, 0, entry.progressCtx.canvas.width, entry.progressCtx.canvas.height);
//            }
        }

        /**
         * Draw a waveform with bars
         *
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0. Must be an integer.
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that should be
         * rendered
         */

    }, {
        key: 'drawBars',
        value: function drawBars(peaks, channelIndex, start, end) {
        }

        /**
         * Draw a waveform
         *
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0
         * @param {number?} start The x-offset of the beginning of the area that
         * should be rendered (If this isn't set only a flat line is rendered)
         * @param {number?} end The x-offset of the end of the area that should be
         * rendered
         */

    }, {
        key: 'drawWave',
        value: function drawWave(peaks, channelIndex, start, end, totalChannels) {
            var _this5 = this;

            return this.prepareDraw (peaks, channelIndex, start, end, function (_ref2) {


                var absmax = _ref2.absmax,
                    hasMinVals = _ref2.hasMinVals,
                    height = _ref2.height,
                    offsetY = _ref2.offsetY,
                    halfH = _ref2.halfH,
                    peaks = _ref2.peaks;

                    if (_this5.params.timeline)
                    {
                        offsetY += 20;
                        halfH -= 10;
                    }

                if (!hasMinVals) {
                    var reflectedPeaks = [];
                    var len = peaks.length;
                    var i = void 0;
                    for (i = 0; i < len; i++) {
                        reflectedPeaks[2 * i] = peaks[i];
                        reflectedPeaks[2 * i + 1] = -peaks[i];
                    }
                    peaks = reflectedPeaks;
                }

                // if drawWave was called within ws.empty we don't pass a start and
                // end and simply want a flat line
                if (start !== undefined) {
                    _this5.drawLine(_this5.params.limits, _this5.params.timeline, peaks, absmax, halfH, offsetY, start, end);
                }

                // Always draw a median line
                _this5.fillRect(0, halfH + offsetY - _this5.halfPixel, _this5.width, _this5.halfPixel, _this5.params.timeline ? 10 : 0);
            }, totalChannels);
        }

        /**
         * Tell the canvas entries to render their portion of the waveform
         *
         * @private
         * @param {number[]} peaks Peak data
         * @param {number} absmax Maximum peak value (absolute)
         * @param {number} halfH Half the height of the waveform
         * @param {number} offsetY Offset to the top
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that
         * should be rendered
         */

    }, {
        key: 'drawLine',
        value: function drawLine(lim, timeline, peaks, absmax, halfH, offsetY, start, end) {
            var _this6 = this;

            this.canvases.forEach(function (entry) {
               // _this6.setFillStyles(entry);

                _this6.drawLineToContext(lim, timeline, entry, entry.waveCtx, peaks, absmax, halfH, offsetY, start, end);
                /*this.drawLineToContext(
                    entry,
                    entry.progressCtx,
                    peaks,
                    absmax,
                    halfH,
                    offsetY,
                    start,
                    end
                )*/
            });
        }

        /**
         * Render the actual waveform line on a canvas
         *
         * @private
         * @param {CanvasEntry} entry
         * @param {Canvas2DContextAttributes} ctx Essentially `entry.[wave|progress]Ctx`
         * @param {number[]} peaks
         * @param {number} absmax Maximum peak value (absolute)
         * @param {number} halfH Half the height of the waveform
         * @param {number} offsetY Offset to the top
         * @param {number} start The x-offset of the beginning of the area that
         * should be rendered
         * @param {number} end The x-offset of the end of the area that
         * should be rendered
         */

    }, {
        key: 'drawLineToContext',
        value: function drawLineToContext (lim, timeline, entry, ctx, peaks, absmax, halfH, offsetY, start, end) {
            if (!ctx) {
                return;
            }

//            halfH -= 60;

            var length = peaks.length / 2;
            var scale = this.params.fillParent && this.width != length ? this.width / length : 1;

            var first = Math.round(length * entry.start);
            // Use one more peak value to make sure we join peaks at ends -- unless,
            // of course, this is the last canvas.
            var last = Math.round(length * entry.end) + 1;
            if (first > end || last < start) {
                return;
            }
            var canvasStart = Math.min(first, start);
            var canvasEnd = Math.max(last, end);
            var i = void 0;
            var j = void 0;

            //if (isNaN(canvasEnd))
            //{
            //    return ;
            //}

           // if (this.shift === 999999999 && !this.shiftClear)
           // {
           //     return ;
           // }

            ctx.beginPath();

            ctx.moveTo((canvasStart - first) * scale + this.halfPixel, halfH + offsetY);


            var chan_index = 0;
            if (offsetY > 30) {
                chan_index = 1;
            }

            
            //halfH -= 10;

            // check if channel is active
            if (!this.params.ActiveChannels [ chan_index ])
            {
                ctx.fillStyle = this.params.waveDisabledColor;
            }
            else
            {
                ctx.fillStyle = this.params.waveColor;
            }

            //var fastround = function ( num ) {
            //    return (num + 0.5) << 0;
            //};

            // var foo = Date.now();

            var temp_end = canvasEnd;
            if (peaks.length <= temp_end * 2)
            {
                temp_end = (peaks.length / 2) >> 0;
            }

            for (i = canvasStart; i < temp_end;  ++i) {
                var peak = peaks[2 * i];
                var h = Math.round (peak / absmax * halfH);

                //if (halfH < h ) {
                //    h = halfH;
                //}

                h = Math.min (h, halfH);
                ctx.lineTo((i - first) * scale + this.halfPixel, halfH - h + offsetY);
            }

            // console.log( temp_end - canvasStart );

            // console.log( Date.now() - foo );

            // Draw the bottom edge going backwards, to make a single
            // closed hull to fill.

            //temp_end = canvasEnd;
            //if (peaks.length <= temp_end * 2)
            // {
            //    temp_end = (peaks.length / 2) >> 0;
            // }

            for (j = temp_end - 1; j >= canvasStart; --j) {
                var _peak = peaks[2 * j + 1];
                var _h = Math.round (_peak / absmax * halfH);

                _h = Math.max (_h, -halfH);
                ctx.lineTo((j - first) * scale + this.halfPixel, halfH - _h + offsetY);
            }

            ctx.closePath();
            ctx.fill();

            if (lim)
            {
                // use absmax for proper rendering of the limits....
                ctx.fillStyle = '#fff';
                var margin = (halfH * 10) / 100 >> 0;

                var diff = (1.0 / absmax * halfH) - halfH;
                var val = (margin + offsetY) - diff;

                if (val > offsetY)
                    ctx.fillRect (0, val, this.width, 0.5);

                val = (halfH * 2 - margin + offsetY) + diff;
                if (val < (halfH * 2 + offsetY))
                    ctx.fillRect (0, val, this.width, 0.5);

                ctx.fillStyle = this.params.waveColor;
            }



            if (timeline)
            {
                ctx.fillStyle = '#fff';

                // draw ruler
                var durr = PKAudioEditor.engine.wavesurfer.VisibleDuration;
                var offs = PKAudioEditor.engine.wavesurfer.LeftProgress;
                var total = PKAudioEditor.engine.wavesurfer.getDuration();
                var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
                var width = PKAudioEditor.engine.wavesurfer.drawer.width;

                if (zoom >= 1)
                {
                        width *= zoom;

                        var percentage = offs / total;
                        var left_offset = (percentage * width);

                        //var left = 0;
                        //var data = [];
                        var x = 0;
                        var pixel_distance = (width / total);

                        //ctx.font = "12px Arial lighter";
                        ctx.textAlign = 'center';

                        ctx.fillStyle = '#111';
                        ctx.fillRect(0, 0, this.width, 24);
                        ctx.fillStyle = '#aaa';
                        ctx.strokeStyle = '#aaa';

                        // every 60 pixels put something
                        // console.log( pixel_distance );

                        if (pixel_distance < 60) {
                            pixel_distance = 60;
                        }
                        else if (pixel_distance > 160)
                        {
                            pixel_distance /= ((pixel_distance / 160) >> 0) + 1;
                        }


                        var elements = width / pixel_distance;
                        var previous_time = 0;

                        for (var i = 0; i < (total*10); ++i)
                        {
                            if (x - left_offset > width - 2)
                            {
                                break;
                            }

                            if (x - left_offset >= -2 && x - left_offset < width - 2)
                            {
                                var prc = x / width;
                                var timespot = prc * total;

                                var format = 3;

                                var diff = timespot - previous_time;
                                if (diff < 1.0)
                                {
                                    format = 1;
                                }
                                else if (diff < 60)
                                {
                                    format = 2;
                                }

                                previous_time = timespot;

                                ctx.fillText( formatTime (timespot, format), x - left_offset, 12);
                            }

                            x += pixel_distance;
                        }

                        ctx.beginPath();       // Start a new path

                        x = 0;

                        for (var i = 0; i < (total*10); ++i)
                        {
                            if (x - left_offset > width - 2)
                            {
                                break;
                            }

                            if (x - left_offset >= -2 && x - left_offset < width - 2)
                            {
                                ctx.moveTo(x - left_offset, 16);    // Move the pen to (30, 50)
                                ctx.lineTo(x - left_offset, 24);  // Draw a line to (150, 100)
                            }

                            x += pixel_distance;
                        }

                        x = pixel_distance / 2;
                        for (var i = 0; i < (total*10); ++i)
                        {
                            if (x - left_offset > width - 2)
                            {
                                break;
                            }

                            if (x - left_offset >= -2 && x - left_offset < width - 2)
                            {
                                ctx.moveTo(x - left_offset, 19);    // Move the pen to (30, 50)
                                ctx.lineTo(x - left_offset, 24);  // Draw a line to (150, 100)
                            }

                            x += pixel_distance;
                        }


                        ctx.stroke(); 
                    }
                }

                this.RCB && this.RCB();
                ctx.fillStyle = this.params.waveColor;

                // this.shiftClear = false;

            // ----
        }

        /**
         * Draw a rectangle on the waveform
         *
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         */

    }, {
        key: 'fillRect',
        value: function fillRect(x, y, width, height, extra) {
            var startCanvas = Math.floor(x / this.maxCanvasWidth);
            var endCanvas = Math.min(Math.ceil((x + width) / this.maxCanvasWidth) + 1, this.canvases.length);
            var i = void 0;
            var once = false;
            for (i = startCanvas; i < endCanvas; i++) {
                var entry = this.canvases[i];
                var leftOffset = i * this.maxCanvasWidth;

                var intersection = {
                    x1: Math.max(x, i * this.maxCanvasWidth),
                    y1: y,
                    x2: Math.min(x + width, i * this.maxCanvasWidth + entry.waveCtx.canvas.width),
                    y2: y + height
                };

                if (intersection.x1 < intersection.x2) {
                    this.setFillStyles(entry);

                    if (!once) {
                        this.fillRectToContext(entry.waveCtx, 0, this.height / 2 + extra, this.width, 0.25);
                        once = true;
                    }

                    this.fillRectToContext(entry.waveCtx, intersection.x1 - leftOffset, intersection.y1, intersection.x2 - intersection.x1, intersection.y2 - intersection.y1);

                    /*this.fillRectToContext(
                        entry.progressCtx,
                        intersection.x1 - leftOffset,
                        intersection.y1,
                        intersection.x2 - intersection.x1,
                        intersection.y2 - intersection.y1
                    );*/
                }
            }
        }

        /**
         * Performs preparation tasks and calculations which are shared by drawBars and drawWave
         *
         * @private
         * @param {number[]|number[][]} peaks Can also be an array of arrays for split channel
         * rendering
         * @param {number} channelIndex The index of the current channel. Normally
         * should be 0
         * @param {number?} start The x-offset of the beginning of the area that
         * should be rendered (If this isn't set only a flat line is rendered)
         * @param {number?} end The x-offset of the end of the area that should be
         * rendered
         * @param {function} fn The render function to call
         */

    }, {
        key: 'prepareDraw',
        value: function prepareDraw (peaks, channelIndex, start, end, fn, totalChannels) {
            var _this7 = this;

            return function () {
                // Split channels and call this function with the channelIndex set
                if (peaks[0] instanceof Array || ArrayBuffer.isView(peaks[0])) {
                    var channels = peaks;
                    if (_this7.params.splitChannels) {

                        _this7.setHeight(
                        // channels.length *
                        _this7.params.height * _this7.params.pixelRatio);
                        return channels.forEach(function (channelPeaks, i) {
                            return _this7.prepareDraw(channelPeaks, i, start, end, fn, totalChannels);
                        });
                    }
                    peaks = channels[0];
                }
                var absmax = _this7.params.verticalZoom;

                // Bar wave draws the bottom only as a reflection of the top,
                // so we don't need negative values
                var hasMinVals = [].some.call(peaks, function (val) {
                    return val < 0;
                });
                var height = _this7.params.height / 2 * _this7.params.pixelRatio;
                var offsetY = height * channelIndex || 0;

                var halfH = height / 2;
                if (totalChannels === 1)
                    halfH = height;

                return fn({
                    absmax: absmax,
                    hasMinVals: hasMinVals,
                    height: height,
                    offsetY: offsetY,
                    halfH: halfH,
                    peaks: peaks
                });
            }();
        }

        /**
         * Draw the actual rectangle on a canvas
         *
         * @private
         * @param {Canvas2DContextAttributes} ctx
         * @param {number} x
         * @param {number} y
         * @param {number} width
         * @param {number} height
         */

    }, {
        key: 'fillRectToContext',
        value: function fillRectToContext(ctx, x, y, width, height) {
            if (!ctx) {
                return;
            }
            ctx.fillRect(x, y, width, height);
        }

        /**
         * Set the fill styles for a certain entry (wave and progress)
         *
         * @private
         * @param {CanvasEntry} entry
         */

    }, {
        key: 'setFillStyles',
        value: function setFillStyles(entry) {
            entry.waveCtx.fillStyle = this.params.waveColor;
            if (this.hasProgressCanvas) {
                entry.progressCtx.fillStyle = this.params.progressColor;
            }
        }

        /**
         * Render the new progress
         *
         * @param {number} position X-Offset of progress position in pixels
         */

    }, {
        key: 'updateProgress',
        value: function updateProgress(position) {
            // this.progressWave.style.left = position + 'px';
            this.progressWave.style.transform = 'translate3d(' + position + 'px,0,0)';
            // this.style(this.progressWave, { left: position + 'px' });
        }
    }]);

    return MultiCanvas;
}(_drawer2.default);

exports.default = MultiCanvas;
module.exports = exports['default'];

/***/ }),

/***/ "./src/util/extend.js":
/*!****************************!*\
  !*** ./src/util/extend.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = extend;
/**
 * Extend an object shallowly with others
 *
 * @param {Object} dest The target object
 * @param {Object[]} sources The objects to use for extending
 *
 * @return {Object} Merged object
 */
function extend(dest) {
    for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        sources[_key - 1] = arguments[_key];
    }

    sources.forEach(function (source) {
        Object.keys(source).forEach(function (key) {
            dest[key] = source[key];
        });
    });
    return dest;
}
module.exports = exports["default"];

/***/ }),

/***/ "./src/util/get-id.js":
/*!****************************!*\
  !*** ./src/util/get-id.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getId;
/**
 * Get a random prefixed ID
 *
 * @returns {String} Random ID
 */
function getId() {
    return 'wavesurfer_' + Math.random().toString(32).substring(2);
}
module.exports = exports['default'];

/***/ }),

/***/ "./src/util/index.js":
/*!***************************!*\
  !*** ./src/util/index.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getId = __webpack_require__(/*! ./get-id */ "./src/util/get-id.js");

Object.defineProperty(exports, 'getId', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getId).default;
  }
});

var _observer = __webpack_require__(/*! ./observer */ "./src/util/observer.js");

Object.defineProperty(exports, 'Observer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_observer).default;
  }
});

var _extend = __webpack_require__(/*! ./extend */ "./src/util/extend.js");

Object.defineProperty(exports, 'extend', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_extend).default;
  }
});

var _style = __webpack_require__(/*! ./style */ "./src/util/style.js");

Object.defineProperty(exports, 'style', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_style).default;
  }
});

var _preventClick = __webpack_require__(/*! ./prevent-click */ "./src/util/prevent-click.js");

Object.defineProperty(exports, 'preventClick', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_preventClick).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),

/***/ "./src/util/observer.js":
/*!******************************!*\
  !*** ./src/util/observer.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @typedef {Object} ListenerDescriptor
 * @property {string} name The name of the event
 * @property {function} callback The callback
 * @property {function} un The function to call to remove the listener
 */

/**
 * Observer class
 */
var Observer = function () {
    /**
     * Instantiate Observer
     */
    function Observer() {
        _classCallCheck(this, Observer);

        /**
         * @private
         * @todo Initialise the handlers here already and remove the conditional
         * assignment in `on()`
         */
        this.handlers = null;
    }
    /**
     * Attach a handler function for an event.
     *
     * @param {string} event Name of the event to listen to
     * @param {function} fn The callback to trigger when the event is fired
     * @return {ListenerDescriptor}
     */


    _createClass(Observer, [{
        key: "on",
        value: function on(event, fn) {
            var _this = this;

            if (!this.handlers) {
                this.handlers = {};
            }

            var handlers = this.handlers[event];
            if (!handlers) {
                handlers = this.handlers[event] = [];
            }
            handlers.push(fn);

            // Return an event descriptor
            return {
                name: event,
                callback: fn,
                un: function un(e, fn) {
                    return _this.un(e, fn);
                }
            };
        }

        /**
         * Remove an event handler.
         *
         * @param {string} event Name of the event the listener that should be
         * removed listens to
         * @param {function} fn The callback that should be removed
         */

    }, {
        key: "un",
        value: function un(event, fn) {
            if (!this.handlers) {
                return;
            }

            var handlers = this.handlers[event];
            var i = void 0;
            if (handlers) {
                if (fn) {
                    for (i = handlers.length - 1; i >= 0; i--) {
                        if (handlers[i] == fn) {
                            handlers.splice(i, 1);
                        }
                    }
                } else {
                    handlers.length = 0;
                }
            }
        }

        /**
         * Remove all event handlers.
         */

    }, {
        key: "unAll",
        value: function unAll() {
            this.handlers = null;
        }

        /**
         * Attach a handler to an event. The handler is executed at most once per
         * event type.
         *
         * @param {string} event The event to listen to
         * @param {function} handler The callback that is only to be called once
         * @return {ListenerDescriptor}
         */

    }, {
        key: "once",
        value: function once(event, handler) {
            var _this2 = this;

            var fn = function fn() {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                /*  eslint-disable no-invalid-this */
                handler.apply(_this2, args);
                /*  eslint-enable no-invalid-this */
                setTimeout(function () {
                    _this2.un(event, fn);
                }, 0);
            };
            return this.on(event, fn);
        }

        /**
         * Manually fire an event
         *
         * @param {string} event The event to fire manually
         * @param {...any} args The arguments with which to call the listeners
         */

    }, {
        key: "fireEvent",
        value: function fireEvent(event, a, s) {
            //for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            //    args[_key2 - 1] = arguments[_key2];
            //}

            if (!this.handlers) {
                return;
            }
            var handlers = this.handlers[event];
            handlers && handlers.forEach(function (fn) {
                // fn.apply(undefined, args);
                fn(a, s);
            });
        }
    }]);

    return Observer;
}();

exports.default = Observer;
module.exports = exports["default"];

/***/ }),

/***/ "./src/util/prevent-click.js":
/*!***********************************!*\
  !*** ./src/util/prevent-click.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = preventClick;
function preventClickHandler(e) {
    e.stopPropagation();
    document.body.removeEventListener('click', preventClickHandler, true);
}

function preventClick(values) {
    document.body.addEventListener('click', preventClickHandler, true);
}
module.exports = exports['default'];

/***/ }),

/***/ "./src/util/style.js":
/*!***************************!*\
  !*** ./src/util/style.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = style;
/**
 * Apply a map of styles to an element
 *
 * @param {HTMLElement} el The element that the styles will be applied to
 * @param {Object} styles The map of propName: attribute, both are used as-is
 *
 * @return {HTMLElement} el
 */
function style(el, styles) {
    Object.keys(styles).forEach(function (prop) {
        if (el.style[prop] !== styles[prop]) {
            el.style[prop] = styles[prop];
        }
    });
    return el;
}
module.exports = exports["default"];

/***/ }),

/***/ "./src/wavesurfer.js":
/*!***************************!*\
  !*** ./src/wavesurfer.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = __webpack_require__(/*! ./util */ "./src/util/index.js");

var util = _interopRequireWildcard(_util);

var _drawer = __webpack_require__(/*! ./drawer.multicanvas */ "./src/drawer.multicanvas.js");

var _drawer2 = _interopRequireDefault(_drawer);

var _webaudio = __webpack_require__(/*! ./webaudio */ "./src/webaudio.js");

var _webaudio2 = _interopRequireDefault(_webaudio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * This work is licensed under a BSD-3-Clause License.
 */

/** @external {HTMLElement} https://developer.mozilla.org/en/docs/Web/API/HTMLElement */
/** @external {OfflineAudioContext} https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext */
/** @external {File} https://developer.mozilla.org/en-US/docs/Web/API/File */
/** @external {Blob} https://developer.mozilla.org/en-US/docs/Web/API/Blob */
/** @external {CanvasRenderingContext2D} https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D */
/** @external {MediaStreamConstraints} https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints */
/** @external {AudioNode} https://developer.mozilla.org/de/docs/Web/API/AudioNode */

/**
 * @typedef {Object} WavesurferParams
 * @property {AudioContext} audioContext=null Use your own previously
 * initialized AudioContext or leave blank.
 * @property {number} audioRate=1 Speed at which to play audio. Lower number is
 * slower.
 * @property {boolean} autoCenter=true If a scrollbar is present, center the
 * waveform around the progress
 * @property {string} backend='WebAudio' `'WebAudio'|'MediaElement'` In most cases
 * you don't have to set this manually. MediaElement is a fallback for
 * unsupported browsers.
 * @property {number} barHeight=1 The height of the wave
 * @property {number} barGap=null The optional spacing between bars of the wave,
 * if not provided will be calculated in legacy format.
 * @property {boolean} closeAudioContext=false Close and nullify all audio
 * contexts when the destroy method is called.
 * @property {!string|HTMLElement} container CSS selector or HTML element where
 * the waveform should be drawn. This is the only required parameter.
 * @property {string} cursorColor='#333' The fill color of the cursor indicating
 * the playhead position.
 * @property {number} cursorWidth=1 Measured in pixels.
 * @property {boolean} fillParent=true Whether to fill the entire container or
 * draw only according to `minPxPerSec`.
 * @property {boolean} forceDecode=false Force decoding of audio using web audio
 * when zooming to get a more detailed waveform.
 * @property {number} height=128 The height of the waveform. Measured in
 * pixels.
 * @property {boolean} hideScrollbar=false Whether to hide the horizontal
 * scrollbar when one would normally be shown.
 * @property {boolean} interact=true Whether the mouse interaction will be
 * enabled at initialization. You can switch this parameter at any time later
 * on.
 * @property {boolean} loopSelection=true (Use with regions plugin) Enable
 * looping of selected regions
 * @property {number} maxCanvasWidth=4000 Maximum width of a single canvas in
 * pixels, excluding a small overlap (2 * `pixelRatio`, rounded up to the next
 * even integer). If the waveform is longer than this value, additional canvases
 * will be used to render the waveform, which is useful for very large waveforms
 * that may be too wide for browsers to draw on a single canvas.
 * @property {boolean} mediaControls=false (Use with backend `MediaElement`)
 * this enables the native controls for the media element
 * @property {string} mediaType='audio' (Use with backend `MediaElement`)
 * `'audio'|'video'`
 * @property {number} minPxPerSec=20 Minimum number of pixels per second of
 * audio.
 * @property {boolean} normalize=false If true, normalize by the maximum peak
 * instead of 1.0.
 * @property {boolean} partialRender=false Use the PeakCache to improve
 * rendering speed of large waveforms
 * @property {number} pixelRatio=window.devicePixelRatio The pixel ratio used to
 * calculate display
 * @property {PluginDefinition[]} plugins=[] An array of plugin definitions to
 * register during instantiation, they will be directly initialised unless they
 * are added with the `deferInit` property set to true.
 * @property {string} progressColor='#555' The fill color of the part of the
 * waveform behind the cursor.
 * @property {boolean} removeMediaElementOnDestroy=true Set to false to keep the
 * media element in the DOM when the player is destroyed. This is useful when
 * reusing an existing media element via the `loadMediaElement` method.
 * @property {Object} renderer=MultiCanvas Can be used to inject a custom
 * renderer.
 * @property {boolean|number} responsive=false If set to `true` resize the
 * waveform, when the window is resized. This is debounced with a `100ms`
 * timeout by default. If this parameter is a number it represents that timeout.
 * @property {boolean} scrollParent=false Whether to scroll the container with a
 * lengthy waveform. Otherwise the waveform is shrunk to the container width
 * (see fillParent).
 * @property {number} skipLength=2 Number of seconds to skip with the
 * skipForward() and skipBackward() methods.
 * @property {boolean} splitChannels=false Render with seperate waveforms for
 * the channels of the audio
 * @property {string} waveColor='#999' The fill color of the waveform after the
 * cursor.
 * @property {object} xhr={} XHR options.
 */

/**
 * @typedef {Object} PluginDefinition
 * @desc The Object used to describe a plugin
 * @example wavesurfer.addPlugin(pluginDefinition);
 * @property {string} name The name of the plugin, the plugin instance will be
 * added as a property to the wavesurfer instance under this name
 * @property {?Object} staticProps The properties that should be added to the
 * wavesurfer instance as static properties
 * @property {?boolean} deferInit Don't initialise plugin
 * automatically
 * @property {Object} params={} The plugin parameters, they are the first parameter
 * passed to the plugin class constructor function
 * @property {PluginClass} instance The plugin instance factory, is called with
 * the dependency specified in extends. Returns the plugin class.
 */

/**
 * WaveSurfer core library class
 *
 * @extends {Observer}
 * @example
 * const params = {
 *   container: '#waveform',
 *   waveColor: 'violet',
 *   progressColor: 'purple'
 * };
 *
 * // initialise like this
 * const wavesurfer = WaveSurfer.create(params);
 *
 * // or like this ...
 * const wavesurfer = new WaveSurfer(params);
 * wavesurfer.init();
 *
 * // load audio file
 * wavesurfer.load('example/media/demo.wav');
 */


var WaveSurfer = function (_util$Observer) {
    _inherits(WaveSurfer, _util$Observer);

    _createClass(WaveSurfer, null, [{
        key: 'create',


        /**
         * Instantiate this class, call its `init` function and returns it
         *
         * @param {WavesurferParams} params
         * @return {Object} WaveSurfer instance
         * @example const wavesurfer = WaveSurfer.create(params);
         */

        /** @private */
        value: function create(params) {
            var wavesurfer = new WaveSurfer(params);
            return wavesurfer.init();
        }

        /**
         * Functions in the `util` property are available as a prototype property to
         * all instances
         *
         * @type {Object}
         * @example
         * const wavesurfer = WaveSurfer.create(params);
         * wavesurfer.util.style(myElement, { background: 'blue' });
         */


        /** @private */


        /**
         * Functions in the `util` property are available as a static property of the
         * WaveSurfer class
         *
         * @type {Object}
         * @example
         * WaveSurfer.util.style(myElement, { background: 'blue' });
         */

    }]);

    /**
     * Initialise wavesurfer instance
     *
     * @param {WavesurferParams} params Instantiation options for wavesurfer
     * @example
     * const wavesurfer = new WaveSurfer(params);
     * @returns {this}
     */
    function WaveSurfer(params) {
        var _ret;

        _classCallCheck(this, WaveSurfer);

        /**
         * Extract relevant parameters (or defaults)
         * @private
         */
        var _this = _possibleConstructorReturn(this, (WaveSurfer.__proto__ || Object.getPrototypeOf(WaveSurfer)).call(this));

        _this.defaultParams = {
            audioContext: null,
            audioRate: 1,
            autoCenter: true,
            backend: 'WebAudio',
            container: null,
            cursorColor: '#ff8c35',
            cursorWidth: 1,
            dragSelection: true,
            fillParent: true,
            height: 128,
            hideScrollbar: false,
            interact: true,
            maxCanvasWidth: 4000,
            pixelRatio: window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI,
            plugins: [],
            progressColor: 'rgba(201,199,229,0.24)',
            renderer: _drawer2.default,
            scrollParent: false,
            splitChannels: false,
            waveColor: '#99c2c6',
            waveDisabledColor: '#505253',
            limits:1,
            timeline:1,
            verticalZoom:1
        };
        _this.backends = {
            WebAudio: _webaudio2.default
        };
        _this.util = util;
        _this.params = util.extend({}, _this.defaultParams, params);

        /** @private */
        _this.container = 'string' == typeof params.container ? document.querySelector(_this.params.container) : _this.params.container;

        if (!_this.container) {
            throw new Error('Container element not found');
        }

        if (_this.params.maxCanvasWidth <= 1) {
            throw new Error('maxCanvasWidth must be greater than 1');
        } else if (_this.params.maxCanvasWidth % 2 == 1) {
            throw new Error('maxCanvasWidth must be an even number');
        }

        /**
         * @private Used to save the current volume when muting so we can
         * restore once unmuted
         * @type {number}
         */
        _this.savedVolume = 0;

        /**
         * @private The current muted state
         * @type {boolean}
         */
        _this.isMuted = false;

        /**
         * @private Holds any running audio downloads
         * @type {XMLHttpRequest}
         */
        _this.currentAjax = null;
        _this.bid = {};
        /** @private */
        _this.arraybuffer = null;
        /** @private */
        _this.drawer = null;
        /** @private */
        _this.backend = null;
        // cache constructor objects
        if (typeof _this.params.renderer !== 'function') {
            throw new Error('Renderer parameter is invalid');
        }
        /**
         * @private The uninitialised Drawer class
         */
        _this.Drawer = _this.params.renderer;
        /**
         * @private The uninitialised Backend class
         */
        _this.Backend = _this.backends[_this.params.backend];

        /**
         * @private map of plugin names that are currently initialised
         */
        _this.initialisedPluginList = {};
        /** @private */
        _this.isDestroyed = false;
        /** @private */
        _this.isReady = false;

        // non-active cursor (in seconds)
        _this.ActiveMarker = 0;
        _this.FollowCursor = 1;
        _this.Interacting = 0;

        // ####
        _this.ActiveChannels = [1, 1];
        _this.SelectedChannelsLen = 2;

        // left offset -- where the left part of the screen points to (in seconds)
        _this.LeftProgress = 0;

        // zoom multiplier (1 = the whole waveform is visible on screen)
        _this.ZoomFactor = 1;

        // visible range (seconds)
        _this.VisibleDuration = 0;

        return _ret = _this, _possibleConstructorReturn(_this, _ret);
    }

    /**
     * Initialise the wave
     *
     * @example
     * var wavesurfer = new WaveSurfer(params);
     * wavesurfer.init();
     * @return {this}
     */


    _createClass(WaveSurfer, [{
        key: 'init',
        value: function init() {
            this.registerPlugins(this.params.plugins);
            this.createDrawer();
            this.createBackend();
            return this;
        }

        /**
         * Add and initialise array of plugins (if `plugin.deferInit` is falsey),
         * this function is called in the init function of wavesurfer
         *
         * @param {PluginDefinition[]} plugins An array of plugin definitions
         * @emits {WaveSurfer#plugins-registered} Called with the array of plugin definitions
         * @return {this}
         */

    }, {
        key: 'registerPlugins',
        value: function registerPlugins(plugins) {
            var _this2 = this;

            // first instantiate all the plugins
            plugins.forEach(function (plugin) {
                return _this2.addPlugin(plugin);
            });

            // now run the init functions
            plugins.forEach(function (plugin) {
                // call init function of the plugin if deferInit is falsey
                // in that case you would manually use initPlugins()
                if (!plugin.deferInit) {
                    _this2.initPlugin(plugin.name);
                }
            });
            this.fireEvent('plugins-registered', plugins);
            return this;
        }

        /**
         * Add a plugin object to wavesurfer
         *
         * @param {PluginDefinition} plugin A plugin definition
         * @emits {WaveSurfer#plugin-added} Called with the name of the plugin that was added
         * @example wavesurfer.addPlugin(WaveSurfer.minimap());
         * @return {this}
         */

    }, {
        key: 'addPlugin',
        value: function addPlugin(plugin) {
            var _this3 = this;

            if (!plugin.name) {
                throw new Error('Plugin does not have a name!');
            }
            if (!plugin.instance) {
                throw new Error('Plugin ' + plugin.name + ' does not have an instance property!');
            }

            // staticProps properties are applied to wavesurfer instance
            if (plugin.staticProps) {
                Object.keys(plugin.staticProps).forEach(function (pluginStaticProp) {
                    /**
                     * Properties defined in a plugin definition's `staticProps` property are added as
                     * staticProps properties of the WaveSurfer instance
                     */
                    _this3[pluginStaticProp] = plugin.staticProps[pluginStaticProp];
                });
            }

            var Instance = plugin.instance;

            // turn the plugin instance into an observer
            var observerPrototypeKeys = Object.getOwnPropertyNames(util.Observer.prototype);
            observerPrototypeKeys.forEach(function (key) {
                Instance.prototype[key] = util.Observer.prototype[key];
            });

            /**
             * Instantiated plugin classes are added as a property of the wavesurfer
             * instance
             * @type {Object}
             */
            this[plugin.name] = new Instance(plugin.params || {}, this);
            this.fireEvent('plugin-added', plugin.name);
            return this;
        }

        /**
         * Initialise a plugin
         *
         * @param {string} name A plugin name
         * @emits WaveSurfer#plugin-initialised
         * @example wavesurfer.initPlugin('minimap');
         * @return {this}
         */

    }, {
        key: 'initPlugin',
        value: function initPlugin(name) {
            if (!this[name]) {
                throw new Error('Plugin ' + name + ' has not been added yet!');
            }
            if (this.initialisedPluginList[name]) {
                // destroy any already initialised plugins
                this.destroyPlugin(name);
            }
            this[name].init();
            this.initialisedPluginList[name] = true;
            this.fireEvent('plugin-initialised', name);
            return this;
        }

        /**
         * Destroy a plugin
         *
         * @param {string} name A plugin name
         * @emits WaveSurfer#plugin-destroyed
         * @example wavesurfer.destroyPlugin('minimap');
         * @returns {this}
         */

    }, {
        key: 'destroyPlugin',
        value: function destroyPlugin(name) {
            if (!this[name]) {
                throw new Error('Plugin ' + name + ' has not been added yet and cannot be destroyed!');
            }
            if (!this.initialisedPluginList[name]) {
                throw new Error('Plugin ' + name + ' is not active and cannot be destroyed!');
            }
            if (typeof this[name].destroy !== 'function') {
                throw new Error('Plugin ' + name + ' does not have a destroy function!');
            }

            this[name].destroy();
            delete this.initialisedPluginList[name];
            this.fireEvent('plugin-destroyed', name);
            return this;
        }

        /**
         * Destroy all initialised plugins. Convenience function to use when
         * wavesurfer is removed
         *
         * @private
         */

    }, {
        key: 'destroyAllPlugins',
        value: function destroyAllPlugins() {
            var _this4 = this;

            Object.keys(this.initialisedPluginList).forEach(function (name) {
                return _this4.destroyPlugin(name);
            });
        }

        /**
         * Create the drawer and draw the waveform
         *
         * @private
         * @emits WaveSurfer#drawer-created
         */

    }, {
        key: 'createDrawer',
        value: function createDrawer() {
            var _this5 = this;

            this.params.ActiveChannels = this.ActiveChannels;
            this.drawer = new this.Drawer(this.container, this.params);
            this.drawer.init();
            this.fireEvent('drawer-created', this.drawer);

            this.drawer.on('resize', function() {
                //console.log (_this5.drawer._width);
                _this5.drawer._width = Math.round(_this5.drawer.container.clientWidth * _this5.drawer.params.pixelRatio);
                _this5.drawer._bbox = _this5.drawer.wrapper.getBoundingClientRect();
                //console.log (_this5.drawer._width);
            });
            this.on ('resize', function (){
                _this5.drawer.fireEvent('resize');
            });

            this.drawer.on('redraw', function () {
                _this5.drawBuffer();
                _this5.drawer.progress(_this5.backend.getPlayedPercents(), _this5.LeftProgress / _this5.getDuration(), _this5.ZoomFactor);
            });

            // Click-to-seek

            // if there are touch events available add on touchdown-touchup being close
            if ('ontouchstart' in document.documentElement)
            {
                var touch_pos = {x:0,y:0};
                var last_touch_pos = {x:0,y:0};

                this.drawer.on('touchstart', function (e) {
                    if (e.touches && e.touches.length === 1)
                    {
                        touch_pos = {
                            x: e.touches[0].pageX,
                            y: e.touches[0].pageY
                        };
                    }
                });
                this.drawer.on('touchmove', function (e) {
                    if (e.touches && e.touches.length === 1)
                    {
                        last_touch_pos = {
                            x: e.touches[0].pageX,
                            y: e.touches[0].pageY
                        };
                    }
                });
                this.drawer.on('touchend', function (e) {
                    if (touch_pos.x !== 0 && touch_pos.y !== 0)
                    {
                        if ( (last_touch_pos.x === 0 && last_touch_pos.y === 0)
                             || (Math.abs (last_touch_pos.x - touch_pos.x) < 20 &&  Math.abs (last_touch_pos.y - touch_pos.y) < 20) )
                        {
                            setTimeout(function () {
                                var bbox = _this5.drawer.wrapper.getBoundingClientRect();
                                _this5.drawer._bbox = bbox;
                                var nominalWidth = Math.max(1, bbox.width);

                                var progress = 0;
                                var xx = touch_pos.x - (window.pageXOffset || document.documentElement.scrollLeft);

                                progress = (xx - bbox.left) / nominalWidth;
                                progress = Math.max(0, Math.min(1, progress || 0));

                                var new_progress = (progress * _this5.VisibleDuration + _this5.LeftProgress) / _this5.getDuration();

                                if (new_progress >= 0 && new_progress <= 1)
                                    _this5.seekTo (new_progress);

                                touch_pos = {x:0,y:0};
                                last_touch_pos = {x:0,y:0};

                                _this5.regions && _this5.regions.clear();
                            }, 24);
                        }
                        else
                        {
                            touch_pos = {x:0,y:0};
                            last_touch_pos = {x:0,y:0};
                        }
                    }
                });
            }

            this.drawer.on('click', function (e, progress) {
                var stamp = e.timeStamp;

                setTimeout(function () {
                    var new_progress = (progress * _this5.VisibleDuration + _this5.LeftProgress) / _this5.getDuration();
                    if (new_progress >= 0 && new_progress <= 1)
                        _this5.seekTo (new_progress, stamp);
                }, 36);
            });


            this.ResetZoom = function () {
                _this5.ZoomFactor = 1;
                _this5.LeftProgress = 0;
                _this5.params.verticalZoom = 1;

                _this5.ForceDraw ();
                _this5.fireEvent ('DidZoom');
            };

            this.SetZoomVertical = function ( val, event ) {

                var prev_v_zoom = _this5.params.verticalZoom;

                if (_this5.params.verticalZoom < 0.1)
                {
                    _this5.params.verticalZoom += val / 24;
                }
                else if (_this5.params.verticalZoom < 0.3)
                {
                    _this5.params.verticalZoom += val / 20;
                }
                else if (_this5.params.verticalZoom < 0.5)
                {
                    _this5.params.verticalZoom += val / 16;
                }
                else if (_this5.params.verticalZoom < 0.8)
                {
                    _this5.params.verticalZoom += val / 12;
                }
                else if (_this5.params.verticalZoom < 1.0)
                {
                    _this5.params.verticalZoom += val / 8;
                }
                else
                {
                    _this5.params.verticalZoom += val / 4;
                }

                if (_this5.params.verticalZoom <= 0.1)
                    _this5.params.verticalZoom = 0.1;

                if (prev_v_zoom < 1 && _this5.params.verticalZoom > 1)
                {
                    _this5.params.verticalZoom = 1;
                }
                else if (prev_v_zoom > 1 && _this5.params.verticalZoom < 1)
                {
                    _this5.params.verticalZoom = 1;
                }


                _this5.ForceDraw ();
                _this5.fireEvent ('DidZoom', event);
            };
            this.SetZoom = function ( where, step, event, is_redo ) {
                var redo = false;
                var width = _this5.drawer.width;
                var duration = _this5.VisibleDuration;

                var last_ = width * (_this5.ZoomFactor - (step/Math.abs(step))) >> 0;
                var sampleSize_ = _this5.backend.buffer.length / last_;
                if (sampleSize_ < 1.0) {
                    return ;
                }


                if (!where) where = 0.5; // make "where" be the cursor? #### 

                if (step < 0) {

                    if (_this5.ZoomFactor != _this5.ZoomFactor >> 0) {
                        _this5.ZoomFactor = (_this5.ZoomFactor >> 0) + 1;
                    } else {
                        if (_this5.ZoomFactor > 6) _this5.ZoomFactor += 1;else _this5.ZoomFactor += 1;
                    }
                    // set the left offset in such a way that mouse position stays stable
                    _this5.LeftProgress = _this5.LeftProgress + where * (duration / _this5.ZoomFactor);
                } else if (_this5.ZoomFactor > 1) {
                    if (_this5.ZoomFactor != _this5.ZoomFactor >> 0) {
                        _this5.ZoomFactor = _this5.ZoomFactor >> 0;
                    } else {
                        if (_this5.ZoomFactor > 6) {
                            if (!is_redo) redo = true;

                            _this5.ZoomFactor -= 1;

                        } else _this5.ZoomFactor -= 1;
                    }
                    if (_this5.ZoomFactor === 1) _this5.LeftProgress = 0;else _this5.LeftProgress = _this5.LeftProgress - where * (duration / _this5.ZoomFactor);
                }

                _this5.ForceDraw ();
                _this5.fireEvent ('DidZoom', event);

                if (redo)
                {
                    this.SetZoom ( where, step, event, true );
                }
            };


            var throttle_wheel = 0;
            this.drawer.on('wheel', function (e) {
                e.preventDefault();
                e.stopPropagation();

                if (!_this5.isReady || e.deltaY == 0) return;

                var perf = e.timeStamp; // window.performance.now();
                if (perf - throttle_wheel < 46) {
                    return;
                }

                throttle_wheel = perf;
                var width = _this5.drawer.width;

                var rect = _this5.drawer._bbox; // _this5.getWaveEl().getBoundingClientRect();
                var where = (e.clientX - rect.left) / width;

                _this5.SetZoom ( where, e.deltaY, e );
            });
            // Relay the scroll event from the drawer
            this.drawer.on('scroll', function (e) {
                _this5.fireEvent('scroll', e);
            });
        }
    }, {
        key: 'ZoomifyValue',
        value: function ZoomifyValue(progress) {
            return (progress * this.VisibleDuration + this.LeftProgress) / this.getDuration();
        }
    }, {
        key: 'UnZoomifyValue',
        value: function UnZoomifyValue(progress) {
            return (progress - this.LeftProgress) * this.ZoomFactor;
        }
    }, {
        key: 'UnzoomifyPixelValue',
        value: function UnzoomifyPixelValue(progress) {
            return (progress - this.LeftProgress / this.getDuration() * this.drawer.width) * this.ZoomFactor;
        }
    }, {
        key: 'DrawTemp',
        value: function DrawTemp ( _offset, _arrays ) {
            this.backend.extraPeaks = _arrays;
            this.backend.extraOffset = _offset;

            this.drawBuffer(1);
            var percent = this.backend.getPlayedPercents();
            var dur = this.getDuration();
            var left_offset = this.LeftProgress / dur;

            //var lleft = (this.ActiveMarker - left_offset) * this.ZoomFactor * 100;
            //var sleft = lleft + '%';
            //if (lleft === 0) sleft = '1px';

            var ppp = (this.ActiveMarker - left_offset) * this.ZoomFactor;
            var minPxDelta = 1 / this.drawer.params.pixelRatio;
            var pos = Math.round(ppp * this.drawer.width) * minPxDelta;

            //if (pos > -40) {
                this.drawer.CursorMarker.style.transform = 'translate(' + pos + 'px,0)';
            //}

            // this.drawer.CursorMarker.style.left =  sleft;
            this.drawer.progress(percent, left_offset, this.ZoomFactor);
        }
    },

     {
        key: 'ForceDraw',
        value: function ForceDraw() {

            this.drawBuffer();
            var percent = this.backend.getPlayedPercents();
            var dur = this.getDuration();
            var left_offset = this.LeftProgress / dur;

            // var lleft = (this.ActiveMarker - left_offset) * this.ZoomFactor * 100;
            // var sleft = lleft + '%';
            // if (lleft === 0) sleft = '1px';
            // this.drawer.CursorMarker.style.left =  sleft;

            var ppp = (this.ActiveMarker - left_offset) * this.ZoomFactor;
            var minPxDelta = 1 / this.drawer.params.pixelRatio;
            var pos = Math.round(ppp * this.drawer.width) * minPxDelta;

            //if (pos > -40) {
                this.drawer.CursorMarker.style.transform = 'translate(' + pos + 'px,0)';
            //}
            //this.drawer.CursorMarker.style.transform = 'translate(' + pos + 'px,0)';

           // this.drawer.ZMarker.style.left = (this.ActiveMarker  * 100) + '%';
            this.drawer.progress(percent, left_offset, this.ZoomFactor);
        }

        /**
         * Create the backend
         *
         * @private
         * @emits WaveSurfer#backend-created
         */
    }, {
        key: 'getWaveEl',
        value: function getWaveEl() {
            return (this.drawer.canvases[0].wave);
        }
    }, {
        key: 'createBackend',
        value: function createBackend() {
            var _this6 = this;

            if (this.backend) {
                this.backend.destroy();
            }

            this.backend = new this.Backend(this.params);
            this.backend.init();
            this.fireEvent('backend-created', this.backend);

            this.backend.on('finish', function () {
                return _this6.fireEvent('finish');
            });
            this.backend.on('play', function () {
                return _this6.fireEvent('play');
            });
            this.backend.on('pause', function ( e ) {
                if (e === 'end')
                {
                    _this6.stop ();
                }

                return _this6.fireEvent('pause');
            });


            var q = this;
            this.CursorCenter = function () {
                var durr = q.getDuration();
                var percentage = q.backend.getPlayedPercents();
                var maxScroll = q.drawer.width * q.ZoomFactor;
                var half = ~~(q.drawer.width / 2);
                var real = percentage * maxScroll;
                var target = real - half;
                var left_middle = q.LeftProgress / durr * maxScroll + half >> 0;
                
                if (left_middle + half > real && left_middle + half < maxScroll) {
                    var cursor = (percentage - q.LeftProgress / durr) * q.ZoomFactor * 100 >> 0;
                    if (cursor > 50) {
                        var x = target - left_middle + half;
                        target -= Math.max(0, x - 4 * q.ZoomFactor / 2);
                    } else target = Math.max(0, Math.min(maxScroll - half * 2, target));
                } else target = Math.max(0, Math.min(maxScroll - half * 2, target));

                var t = target / maxScroll;
                q.LeftProgress = t * durr;
                q.fireEvent ('cursorcenter', t);

                if (!document.hidden) q.ForceDraw();
            };


            var db = 0;
            var timing_gap = 50;
            q.backend.on('audioprocess', function (time, stamp) {
                var percentage = q.backend.getPlayedPercents();

                if (q.ZoomFactor > 1 && q.FollowCursor && !q.Interacting)
                {
                    var new_db = stamp; // window.performance.now(); //  ####
                    if (new_db - db > timing_gap)
                    {
                        db = new_db;

                        var durr = q.getDuration();
                        var maxScroll = q.drawer.width * q.ZoomFactor;
                        var half = ~~(q.drawer.width / 2);
                        var real = percentage * maxScroll;
                        var target = real - half;
                        var left_middle = q.LeftProgress / durr * maxScroll + half >> 0;

                        if (left_middle <= real && real <= left_middle + half)
                        {
                            if (left_middle + half > real && left_middle + half < maxScroll) {
                                var cursor = (percentage - q.LeftProgress / durr) * q.ZoomFactor * 100 >> 0;

                                if (cursor > 99)
                                {
                                    var x = target - left_middle + half;
                                    target -= Math.max(0, x - 4 * q.ZoomFactor / 2);
                                } else target = Math.max(0, Math.min(maxScroll - half * 2, target));
                            } else target = Math.max(0, Math.min(maxScroll - half * 2, target));

                            var t = target / maxScroll;
                            q.LeftProgress = t * durr;
                            q.fireEvent('cursorcenter', t);

                            if (!document.hidden) q.ForceDraw();
                        }
                        else
                        {
                            q.drawer.progress(percentage, q.LeftProgress / q.getDuration(), q.ZoomFactor);
                        }
                    }
                    // -
                }
                else
                {
                    q.drawer.progress(percentage, q.LeftProgress / q.getDuration(), q.ZoomFactor);
                }

                q.fireEvent ('audioprocess', time, stamp);
            });
        }

        /**
         * Get the duration of the audio clip
         *
         * @example const duration = wavesurfer.getDuration();
         * @return {number} Duration in seconds
         */

    }, {
        key: 'getDuration',
        value: function getDuration() {
            return this.backend.getDuration();
        }

        /**
         * Get the current playback position
         *
         * @example const currentTime = wavesurfer.getCurrentTime();
         * @return {number} Playback position in seconds
         */

    }, {
        key: 'getCurrentTime',
        value: function getCurrentTime() {
            return this.backend.getCurrentTime();
        }

        /**
         * Set the current play time in seconds.
         *
         * @param {number} seconds A positive number in seconds. E.g. 10 means 10
         * seconds, 60 means 1 minute
         */

    }, {
        key: 'setCurrentTime',
        value: function setCurrentTime(seconds) {
            if (seconds >= this.getDuration()) {
                this.seekTo(1);
            } else {
                this.seekTo(seconds / this.getDuration());
            }
        }

        /**
         * Starts playback from the current position. Optional start and end
         * measured in seconds can be used to set the range of audio to play.
         *
         * @param {?number} start Position to start at
         * @param {?number} end Position to end at
         * @emits WaveSurfer#interaction
         * @return {Promise}
         * @example
         * // play from second 1 to 5
         * wavesurfer.play(1, 5);
         */

    }, {
        key: 'play',
        value: function play(start, end) {
            var _this7 = this;

            this.fireEvent('interaction', function () {
                return _this7.play(start, end);
            });
            return this.backend.play(start, end);
        }

        /**
         * Stops playback
         *
         * @example wavesurfer.pause();
         * @return {Promise}
         */

    }, {
        key: 'pause',
        value: function pause() {
            if (!this.backend.isPaused()) {
                return this.backend.pause();
            }
        }

        /**
         * Toggle playback
         *
         * @example wavesurfer.playPause();
         * @return {Promise}
         */

    }, {
        key: 'playPause',
        value: function playPause() {
            return this.backend.isPaused() ? this.play() : this.pause();
        }

        /**
         * Get the current playback state
         *
         * @example const isPlaying = wavesurfer.isPlaying();
         * @return {boolean} False if paused, true if playing
         */

    }, {
        key: 'isPlaying',
        value: function isPlaying() {
            return !this.backend.isPaused();
        }

        /**
         * Skip backward
         *
         * @param {?number} seconds Amount to skip back, if not specified `skipLength`
         * is used
         * @example wavesurfer.skipBackward();
         */

    }, {
        key: 'skipBackward',
        value: function skipBackward(seconds) {
            this.skip(-seconds || -2);
        }

        /**
         * Skip forward
         *
         * @param {?number} seconds Amount to skip back, if not specified `skipLength`
         * is used
         * @example wavesurfer.skipForward();
         */

    }, {
        key: 'skipForward',
        value: function skipForward(seconds) {
            this.skip(seconds || 2);
        }

        /**
         * Skip a number of seconds from the current position (use a negative value
         * to go backwards).
         *
         * @param {number} offset Amount to skip back or forwards
         * @example
         * // go back 2 seconds
         * wavesurfer.skip(-2);
         */

    }, {
        key: 'skip',
        value: function skip(offset) {
            var duration = this.getDuration() || 1;
            var position = this.getCurrentTime() || 0;
            position = Math.max(0, Math.min(duration, position + (offset || 0)));
            this.seekAndCenter(position / duration);
        }

        /**
         * Seeks to a position and centers the view
         *
         * @param {number} progress Between 0 (=beginning) and 1 (=end)
         * @example
         * // seek and go to the middle of the audio
         * wavesurfer.seekTo(0.5);
         */

    }, {
        key: 'seekAndCenter',
        value: function seekAndCenter(progress) {
            this.seekTo(progress);
            this.drawer.recenter(progress);
        }

        /**
         * Seeks to a position
         *
         * @param {number} progress Between 0 (=beginning) and 1 (=end)
         * @emits WaveSurfer#interaction
         * @emits WaveSurfer#seek
         * @example
         * // seek to the middle of the audio
         * wavesurfer.seekTo(0.5);
         */

    }, {
        key: 'seekTo',
        value: function seekTo(progress, stamp) {
            var _this8 = this;

            // return an error if progress is not a number between 0 and 1
            if (typeof progress !== 'number' || !isFinite(progress) || progress < 0 || progress > 1) {
                progress = 0;
                // return console.error('Error calling wavesurfer.seekTo, parameter must be a number between 0 and 1!');
            }
            this.ActiveMarker = progress;

            this.fireEvent('interaction', function () {
                return _this8.seekTo(progress);
            });

            var paused = this.backend.isPaused();
            // avoid draw wrong position while playing backward seeking
            if (!paused) {
                this.backend.pause();
            }
            // avoid small scrolls while paused seeking
            //const oldScrollParent = this.params.scrollParent;
            //this.params.scrollParent = false;

            var duration = this.getDuration();
            if (this.VisibleDuration / duration + this.LeftProgress / duration > progress && progress > this.LeftProgress / duration) {
                var left_offset = this.LeftProgress / duration;
                // var rend_progress = (progress - left_offset) * (duration / this.VisibleDuration);

                // this.drawer.CursorMarker.style.left = rend_progress * 100 + '%';

                var ppp = (progress - left_offset) * this.ZoomFactor;
                var minPxDelta = 1 / this.drawer.params.pixelRatio;
                var pos = Math.round(ppp * this.drawer.width) * minPxDelta;
                this.drawer.CursorMarker.style.transform = 'translate(' + pos + 'px,0)';


                //var rend_progress2 = (progress - left_offset);
                //this.drawer.ZMarker.style.left = progress * 100 + '%';
                this.drawer.progress(progress, left_offset, this.ZoomFactor);
            } else {

                var left_offset = this.LeftProgress / duration;
                var rend_progress = (progress - left_offset) * (duration / this.VisibleDuration);

                if (rend_progress == 0)
                {
                    this.drawer.CursorMarker.style.transform = 'translate(1px,0)';
                    // this.drawer.CursorMarker.style.left = '1px';                    
                }
                else
                {
                    var ppp = (progress - left_offset) * this.ZoomFactor;
                    var minPxDelta = 1 / this.drawer.params.pixelRatio;
                    var pos = Math.round(ppp * this.drawer.width) * minPxDelta;
                    this.drawer.CursorMarker.style.transform = 'translate(' + pos + 'px,0)';

                    // this.drawer.CursorMarker.style.left = rend_progress * 100 + '%';
                }

                this.drawer.progress(0);
            }

            this.backend.seekTo(progress * this.getDuration());

            if (!paused) {
                this.backend.play();
            }
            //this.params.scrollParent = oldScrollParent;

            this.fireEvent('seek', progress, stamp);
        }

        /**
         * Stops and goes to the beginning.
         *
         * @example wavesurfer.stop();
         */

    }, {
        key: 'stop',
        value: function stop() {
            this.pause();
            this.seekTo(this.ActiveMarker, window.performance.now() + 100);

            this.drawer.progress(this.ActiveMarker, this.LeftProgress / this.getDuration(), this.ZoomFactor);
        }

    }, {
        key: 'getLoudness',
        value: function getLoudness() {
            return this.backend.getLoudness();
        }

        /**
         * Set the height of the waveform.
         *
         * @param {number} height Height measured in pixels.
         * @example wavesurfer.setHeight(200);
         */

    }, {
        key: 'setHeight',
        value: function setHeight(height) {
            this.params.height = height;

            this.drawer.setHeight(height * this.params.pixelRatio);
            if (this.isReady) {
                this.drawBuffer();
            }
        }

        /**
         * Get the correct peaks for current wave viewport and render wave
         *
         * @private
         * @emits WaveSurfer#redraw
         */

    }, {
        key: 'drawBuffer',
        value: function drawBuffer(force) {

            // #### 
            if (this.ZoomFactor === 1) this.VisibleDuration = this.getDuration();else this.VisibleDuration = this.getDuration() / this.ZoomFactor;

            var parentWidth = this.drawer.getWidth();
            var width = parentWidth;

            var start = this.LeftProgress;
            var end = width * this.ZoomFactor >> 0;
            var peaks = void 0;
            // console.log( width, start, end );
            peaks = this.backend.getPeaks(width, start, end, force);
            this.drawer.drawPeaks(peaks, width, 0, end, peaks.length, this.backend.shift);


            if (this.backend.extraPeakStart >= 0)
            {
                // draw red 
                var q = this;
                requestAnimationFrame(function () {
                    q.drawer.canvases[0].waveCtx.fillStyle = 'rgba(255,60,40,0.2)';
                    q.drawer.canvases[0].waveCtx.fillRect (q.backend.extraPeakStart, 0, q.backend.extraPeakEnd-q.backend.extraPeakStart, q.drawer.canvases[0].wave.height);
                });
            }


            // }
            this.fireEvent('redraw', peaks, width);
        }

        /**
         * Horizontally zooms the waveform in and out. It also changes the parameter
         * `minPxPerSec` and enables the `scrollParent` option. Calling the function
         * with a falsey parameter will reset the zoom state.
         *
         * @param {?number} pxPerSec Number of horizontal pixels per second of
         * audio, if none is set the waveform returns to unzoomed state
         * @emits WaveSurfer#zoom
         * @example wavesurfer.zoom(20);
         */

    }, {
        key: 'zoom',
        value: function zoom() {}

        /**
         * Decode buffer and load
         *
         * @private
         * @param {ArrayBuffer} arraybuffer
         */

    }, {
        key: 'loadArrayBuffer',
        value: function loadArrayBuffer(arraybuffer) {
            var _this9 = this;

            this.decodeArrayBuffer(arraybuffer, function (data) {
                if (!_this9.isDestroyed) {
                    _this9.loadDecodedBuffer(data);
                }
            });
        }

        /**
         * Directly load an externally decoded AudioBuffer
         *
         * @private
         * @param {AudioBuffer} buffer
         * @emits WaveSurfer#ready
         */

    }, {
        key: 'loadDecodedBuffer',
        value: function loadDecodedBuffer(buffer) {

            // #### be smarter check if song changed....            
            this.backend.splitPeaks = [];
            this.backend.mergedPeaks = [];

            this.backend.load(buffer);
            this.drawBuffer(1);
            this.fireEvent('ready');
            this.isReady = true;
        }

        /**
         * Loads audio data from a Blob or File object
         *
         * @param {Blob|File} blob Audio data
         * @example
         */

    }, {
        key: 'loadBlob',
        value: function loadBlob(blob) {
            var _this10 = this;

            // Create file reader
            var reader = new FileReader();
            reader.addEventListener('progress', function (e) {
                return _this10.onProgress(e);
            });
            reader.addEventListener('load', function (e) {
                return _this10.loadArrayBuffer(e.target.result);
            });
            reader.addEventListener('error', function () {
                return _this10.fireEvent('error', 'Error reading file');
            });
            reader.readAsArrayBuffer(blob);
            this.empty();
        }

        /**
         * Loads audio and re-renders the waveform.
         *
         * @param {string|HTMLMediaElement} url The url of the audio file or the
         * audio element with the audio
         * @param {?number[]|number[][]} peaks Wavesurfer does not have to decode
         * the audio to render the waveform if this is specified
         * @param {?string} preload (Use with backend `MediaElement`)
         * `'none'|'metadata'|'auto'` Preload attribute for the media element
         * @param {?number} duration The duration of the audio. This is used to
         * render the peaks data in the correct size for the audio duration (as
         * befits the current minPxPerSec and zoom value) without having to decode
         * the audio.
         * @example
         * // using ajax or media element to load (depending on backend)
         * wavesurfer.load('http://example.com/demo.wav');
         *
         * // setting preload attribute with media element backend and supplying
         * peaks wavesurfer.load(
         *   'http://example.com/demo.wav',
         *   [0.0218, 0.0183, 0.0165, 0.0198, 0.2137, 0.2888],
         *   true,
         * );
         */

    }, {
        key: 'load',
        value: function load(url) {
            this.empty();
            return this.loadBuffer(url);
        }

        /**
         * Loads audio using Web Audio buffer backend.
         *
         * @private
         * @param {string} url
         * @param {?number[]|number[][]} peaks
         * @param {?number} duration
         */

    }, {
        key: 'loadBuffer',
        value: function loadBuffer(url) {
            var _this11 = this;

            return _this11.getArrayBuffer(url, function (data) {
                return _this11.loadArrayBuffer(data);
            });
        }

        /**
         * Decode an array buffer and pass data to a callback
         *
         * @private
         * @param {Object} arraybuffer
         * @param {function} callback
         */

    }, {
        key: 'decodeArrayBuffer',
        value: function decodeArrayBuffer(arraybuffer, callback) {
            var _this13 = this;
            var _id = 'q'+((Math.random() * 999999) >> 0);

            // this.arraybuffer = arraybuffer;
            this.bid[_id] = 1;
            this.bid['curr'] = _id;

            var old_duration = this.getDuration ();

            this.backend.decodeArrayBuffer (arraybuffer, function (data) {
                // Only use the decoded data if we haven't been destroyed or
                // another decode started in the meantime
                if (!_this13.isDestroyed) // && _this13.arraybuffer == arraybuffer)
                {
                    if (_this13.bid[_id])
                    {
                        var go = false;
                        if (_this13.backend.buffer && _this13.backend._add)
                        {
                            go = true;
                        }

                        callback(data);
                        _this13.arraybuffer = arraybuffer;

                        if (go) // add the main area // todo - put it somewhere else?
                        {
                            setTimeout(function () {
                                _this13.regions.add({
                                    start:old_duration,
                                    end:_this13.getDuration () - 0.01,
                                    id:'t'
                                });
                            },48);
                        }
                        // ---
                    }
                }
            }, function () {
                return _this13.fireEvent('error', 'Error decoding audiobuffer. Did you make sure to supply a valid audio file? ');
            });
        }

        /**
         * Load an array buffer by ajax and pass to a callback
         *
         * @param {string} url
         * @param {function} callback
         * @private
         */

    }, {
        key: 'getArrayBuffer',
        value: function getArrayBuffer(url, callback) {
            var _this14 = this;
            var xhr = new XMLHttpRequest();
            var fired100 = false;

            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onprogress = function (e) {
                _this14.onProgress(e);
                if (e.lengthComputable && e.loaded == e.total) {
                    fired100 = true;
                }
            };
            xhr.onload = function (e) {
                if (!fired100) {
                    _this14.onProgress(e);
                }
                if (200 == xhr.status || 206 == xhr.status) {
                    callback(xhr.response);
                } else {
                    _this14.fireEvent('error', 'Could not load remote URL. Make sure the url exists, is a valid audio file,<br /> ' +
                        ' or that is supports Cross Origin requests (Access-Control-Allow-Origin header) <br />' + xhr.statusText);
                    PKAudioEditor.fireEvent('RequestResize');
                }
                _this14.currentAjax = null;
            };
            xhr.onerror = function () {
                _this14.fireEvent('error', 'Could not load remote URL. Make sure the url exists, is a valid audio file,<br /> ' +
                    ' or that is supports Cross Origin requests (Access-Control-Allow-Origin header) <br />' + xhr.statusText);
                _this14.currentAjax = null;
                PKAudioEditor.fireEvent('RequestResize');
            };

            this.currentAjax = xhr;
            xhr.send();
            return xhr;
        }

        /**
         * Called while the audio file is loading
         *
         * @private
         * @param {Event} e
         * @emits WaveSurfer#loading
         */

    }, {
        key: 'onProgress',
        value: function onProgress(e) {
            var percentComplete = void 0;
            if (e.lengthComputable) {
                percentComplete = e.loaded / e.total;
            } else {
                // Approximate progress with an asymptotic
                // function, and assume downloads in the 1-3 MB range.
                percentComplete = e.loaded / (e.loaded + 1000000);
            }
            this.fireEvent('loading', Math.round(percentComplete * 100), e.target);
        }

        /**
         * Cancel any pending buffer loading cancelBufferLoad
         */

    }, {
        key: 'cancelBufferLoad',
        value: function cancelBufferLoad() {
            if (this.bid && this.bid.curr) {
                this.bid[ this.bid['curr'] ] = null;
                return (true);
            }
            return (false);
        }

        /**
         * Cancel any ajax request currently in progress
         */

    }, {
        key: 'cancelAjax',
        value: function cancelAjax() {
            if (this.currentAjax) {
                this.currentAjax.abort();
                this.currentAjax = null;

                return (true);
            }
            return (false);
        }

        /**
         * Display empty waveform.
         */

    }, {
        key: 'empty',
        value: function empty() {
            if (!this.backend.isPaused()) {
                this.stop();
                this.backend.disconnectSource();
            }
            this.cancelAjax();
            this.drawer.progress(0);
            this.drawer.setWidth(0);

            this.drawer.drawPeaks({ length: this.drawer.getWidth() }, 0, 2);
        }

        /**
         * Remove events, elements and disconnect WebAudio nodes.
         *
         * @emits WaveSurfer#destroy
         */

    }, {
        key: 'destroy',
        value: function destroy() {
            this.destroyAllPlugins();
            this.fireEvent('destroy');
            this.cancelAjax();
            this.unAll();
            this.backend.destroy();
            this.drawer.destroy();
            this.isDestroyed = true;
            this.arraybuffer = null;
        }
    }]);

    return WaveSurfer;
}(util.Observer);

WaveSurfer.util = util;
exports.default = WaveSurfer;


module.exports = exports['default'];


/***/ }),

/***/ "./src/webaudio.js":
/*!*************************!*\
  !*** ./src/webaudio.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = __webpack_require__(/*! ./util */ "./src/util/index.js");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// using consts to prevent someone writing the string wrong
var PLAYING = 'playing';
var PAUSED = 'paused';
var FINISHED = 'finished';

/**
 * WebAudio backend
 *
 * @extends {Observer}
 */

  var is_safari = navigator.userAgent.toLowerCase().indexOf('safari/') > -1;

var WebAudio = function (_util$Observer) {
    _inherits(WebAudio, _util$Observer);

    _createClass(WebAudio, [{
        key: 'supportsWebAudio',


        /**
         * Does the browser support this backend
         *
         * @return {boolean}
         */

        /** @private */

        /** @private */
        value: function supportsWebAudio() {
            return !!(window.AudioContext || window.webkitAudioContext);
        }

        /**
         * Get the audio context used by this backend or create one
         *
         * @return {AudioContext}
         */

        /** @private */

        /** @private */

    }, {
        key: 'getAudioContext',
        value: function getAudioContext() {
            if (!window.WaveSurferAudioContext) {
                // try {
                    window.WaveSurferAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                // } catch (e) {}
            }
            return window.WaveSurferAudioContext;
        }

        /**
         * Get the offline audio context used by this backend or create one
         *
         * @param {number} sampleRate
         * @return {OfflineAudioContext}
         */

    }, {
        key: 'getOfflineAudioContext',
        value: function getOfflineAudioContext(sampleRate) {
            if (!window.WaveSurferOfflineAudioContext) {
                window.WaveSurferOfflineAudioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 2, sampleRate);
            }
            return window.WaveSurferOfflineAudioContext;
        }

        /**
         * Construct the backend
         *
         * @param {WavesurferParams} params
         */

    }]);

    function WebAudio(params) {
        _classCallCheck(this, WebAudio);

        /** @private */
        var _this = _possibleConstructorReturn(this, (WebAudio.__proto__ || Object.getPrototypeOf(WebAudio)).call(this));

        _this.audioContext = null;
        _this.offlineAudioContext = null;
        _this.params = params;
        /** @private */
        _this.ac = params.audioContext || _this.getAudioContext();
        /**@private */
        _this.lastPlay = _this.ac.currentTime;
        /** @private */
        _this.startPosition = 0;
        /** @private  */
        _this.scheduledPause = null;
        /** @private */
        _this.analyser = null;
        /** @private */
        _this.buffer = null;
        _this.gainNode1 = null;
        _this.gainNode2 = null;
        _this.splitterNode = null;
        /** @private */
        _this.mergedPeaks = null;
        /** @private */
        _this.offlineAc = null;
        /** @private */
        _this.peaks = null;
        /** @private */
        _this.playbackRate = 1;
        /** @private */
        _this.analyser = null;
        /** @private */
        _this.scriptNode = null;
        /** @private */
        _this.source = null;
        /** @private */
        _this.splitPeaks = [];
        /** @private */
        _this.state = null;
        /** @private */
        _this.explicitDuration = null;

        // #### PK peak pyramid cache.
        // For long files, zoom/pan redraws should not rescan raw PCM samples
        // every time.  Build a min/max LOD once, then getPeaks can query the
        // cached buckets.  The normal path stays as a fallback for short files,
        // very deep zoom, temp previews, or while the cache is still building.
        _this.peakPyramid = null;
        _this.peakPyramidStep = 128;
        _this.peakPyramidMinDuration = 300;
        _this.peakPyramidToken = 0;
        _this.peakPyramidTimer = 0;
        _this.peakPyramidTimerType = 0;
        _this.peakPyramidJob = null;
        _this.peakPyramidBytes = 0;
        // ---

        _this.FreqArr = new Uint8Array(512); // 256
        if (_this.ac.addEventListener) {
            _this.ac.addEventListener('statechange', function () {
                if (_this.state === PLAYING && _this.ac.state !== 'running') {
                    _this.pause();
                }
            });
        }
        return _this;
    }

    /**
     * Initialise the backend, called in `wavesurfer.createBackend()`
     */


    _createClass(WebAudio, [{
        key: 'init',
        value: function init() {

            this.createVolumeNode();
            this.createScriptNode();
            this.createAnalyserNode();

            this.setState(PAUSED);
            this.playbackRate = this.params.audioRate || 1;
            this.setLength(0);
        }

        /** @private */

    }, {
        key: 'setState',
        value: function setState(state) {
            if (this.state === state) {
                return;
            }
            this.state = state;
            if (state === PLAYING) {
                this.addOnAudioProcess();
            } else {
                this.removeOnAudioProcess();
                if (state === FINISHED) {
                    this.fireEvent('finish');
                }
            }
        }

        /** @private */

    }, {
        key: 'createScriptNode',
        value: function createScriptNode() {
            if (this.ac.createScriptProcessor) {
                this.scriptNode = this.ac.createScriptProcessor(WebAudio.scriptBufferSize);
            } else {
                this.scriptNode = this.ac.createJavaScriptNode(WebAudio.scriptBufferSize);
            }

            this.scriptNode.connect(this.ac.destination);
        }

        /** @private */

    }, {
        key: 'addOnAudioProcess',
        value: function addOnAudioProcess() {
            var _this2 = this;

            this.scriptNode.onaudioprocess = function ( ee ) {
                // if not active remove...
                if (_this2.state !== PLAYING)
                    return ;

                /*
                var dataArray = new Float32Array(_this2.analyser.fftSize); // Float32Array needs to be the same length as the fftSize 
                _this2.analyser.getFloatTimeDomainData(dataArray); // fill the Float32Array with data returned from getFloatTimeDomainData()

                var temp2 = 0;
                for (var j = 0; j < _this2.analyser.fftSize; j += 1) {
                    var x = dataArray[j];
                    if (Math.abs(x) >= temp2) {
                        temp2 = Math.abs(x);
                    }
                }

                console.log("----------");
                var foo = 20 * Math.log10(temp2) + 0.001;
                console.log("new loudness is ", foo);
                */


                var time = _this2.getCurrentTime();

                var buffer = _this2.buffer;
                var sample_rate = buffer.sampleRate;
                var offset = time * sample_rate >> 0;
                var jump = 4;
                var clip_level = 1.0;
                var loudness = [0, 0];
                var sr = 512;
                var band_amp = 0;
                var temp = 0;

                for (var i = 0; i < buffer.numberOfChannels; ++i) {
                    temp = 0;
                    var chan_data = buffer.getChannelData(i);

                    for (var j = 0; j < sr; j += jump) {
                        var x = Math.abs(chan_data[offset + j]);
                        if (x > temp) {
                            temp = x;
                        }
                    }

                    loudness[i] = 20 * Math.log10(temp) + 0.001;
                }

                // console.log("versus ", loudness);
                _this2.peak_frequency = loudness;

                // Get the audio data and store it in our array.

                if (_this2.logFrequencies) {
                    // _this2.analyser.smoothingTimeConstant = 0.85;
//                    _this2.analyser.fftSize = 512;// * 2;
//                    console.log( _this2.analyser.frequencyBinCount);

                    _this2.analyser.getByteFrequencyData(_this2.FreqArr);
                }

                // this.peak_frequency = Math.max.apply( null, this.FreqArr );
                if (time >= _this2.getDuration()) {
                    _this2.setState(FINISHED);

                    _this2.fireEvent('pause', 'end');
                } else if (time >= _this2.scheduledPause) {
                    _this2.pause();
                } else if (_this2.state === PLAYING) {
                    _this2.fireEvent('audioprocess', time, ee.timeStamp);
                }

                _this2.peak_frequency = null;
            };
        }

        /** @private */

    }, {
        key: 'removeOnAudioProcess',
        value: function removeOnAudioProcess() {
            // @PK #### this might be needed...

            if (!is_safari)
                this.scriptNode.onaudioprocess = null;
            // this.scriptNode.disconnect ();
        }

        /** @private */

    }, {
        key: 'createAnalyserNode',
        value: function createAnalyserNode() {
            this.analyser = this.ac.createAnalyser();
            // this.analyser.smoothingTimeConstant = 0.8;
            this.analyser.fftSize = 1024; //512;

            this.analyser.connect(this.splitterNode);
          //  this.analyser.connect(this.mergerNode);
        }

        /**
         * Create the gain node needed to control the playback volume.
         *
         * @private
         */

    }, {
        key: 'SetNumberOfChannels',
        value: function SetNumberOfChannels( num ) {
            this.splitterNode.disconnect (0);
            this.splitterNode.disconnect (1);

            if (num === 1)
            {
                this.splitterNode.connect (this.gainNode1, 0);
                this.splitterNode.connect (this.gainNode2, 0);
            }
            else if ( num === 2)
            {
                this.splitterNode.connect (this.gainNode1, 1);
                this.splitterNode.connect (this.gainNode2, 0);
            }
        }
    }, {
        key: 'createVolumeNode',
        value: function createVolumeNode() {
            // Create gain node using the AudioContext

            this.splitterNode = this.ac.createChannelSplitter ( 2 );
            this.mergerNode = this.ac.createChannelMerger ( 2 );

            if (this.ac.createGain) {
                this.gainNode1 = this.ac.createGain();
                this.gainNode2 = this.ac.createGain();
            } else {
                this.gainNode1 = this.ac.createGainNode();
                this.gainNode2 = this.ac.createGainNode();
            }

            this.splitterNode.connect (this.gainNode1, 1);
            this.splitterNode.connect (this.gainNode2, 0);

            this.gainNode1.connect (this.mergerNode, 0, 1); // or the other way around???? #### 
            this.gainNode2.connect (this.mergerNode, 0, 0);

            // Add the gain node to the graph
            this.mergerNode.connect (this.ac.destination);
        }

    }, {
        key: 'getLoudness',
        value: function getLoudness() {
            return this.peak_frequency;
        }

        /** @private */

    }, {
        key: 'decodeArrayBuffer',
        value: function decodeArrayBuffer(arraybuffer, callback, errback) {

            PKAudioEditor.engine.ID3 (arraybuffer);

            if (!this.offlineAc) {
                this.offlineAc = this.getOfflineAudioContext(44100); // this.ac ? this.ac.sampleRate : 44100);
            }

            var promise = this.offlineAc.decodeAudioData(arraybuffer, function (data) {

                // ----

                return callback(data);
            }, errback);

            if (promise)
            {
                promise.catch(function( error ) {
                    console.log("couldn't load audio");
                    // errback && errback (error);
                });
            }
        }

        /**
         * Set pre-decoded peaks
         *
         * @param {number[]|number[][]} peaks
         * @param {?number} duration
         */

    }, {
        key: 'setPeaks',
        value: function setPeaks(peaks, duration) {
            this.explicitDuration = duration;
            this.peaks = peaks;
        }

        /**
         * Set the rendered length (different from the length of the audio).
         *
         * @param {number} length
         */

    }, {
        key: 'setLength',
        value: function setLength(length) {
            var peakLength = length > 0 ? Math.floor(length * 2) : 0;
            var channels = this.buffer ? this.buffer.numberOfChannels : 1;

            // No resize, we can preserve the cached peaks.
            if (this.mergedPeaks &&
                peakLength == this.mergedPeaks.length &&
                this.splitPeaks &&
                this.splitPeaks.length === channels &&
                this.splitPeaks[channels - 1] &&
                this.splitPeaks[channels - 1].length == peakLength) {
                return;
            }

            this.splitPeaks = [];
            this.mergedPeaks = new Float32Array(peakLength);
            var c = void 0;
            for (c = 0; c < channels; c++) {
                this.splitPeaks[c] = new Float32Array(peakLength);
            }
        }

        // #### PK peak pyramid helpers.
        // Build only for long decoded buffers.  The cache is about 3% of the
        // raw PCM size at step=128, and it makes long-file getPeaks queries read
        // min/max buckets instead of walking millions of samples again.
        // ---

    }, {
        key: 'resetPeakPyramid',
        value: function resetPeakPyramid() {
            this.peakPyramidToken++;
            this.peakPyramid = null;
            this.peakPyramidBytes = 0;

            if (this.peakPyramidTimer) {
                if (this.peakPyramidTimerType === 1 &&
                    typeof window !== 'undefined' &&
                    window.cancelIdleCallback) {
                    window.cancelIdleCallback(this.peakPyramidTimer);
                }
                else {
                    clearTimeout(this.peakPyramidTimer);
                }
            }

            this.peakPyramidTimer = 0;
            this.peakPyramidTimerType = 0;
            this.peakPyramidJob = null;
        }
    }, {
        key: 'schedulePeakPyramid',
        value: function schedulePeakPyramid() {
            var q = this;
            var token = void 0;
            var run = void 0;

            this.resetPeakPyramid();

            if (!this.buffer || this.buffer.duration < this.peakPyramidMinDuration) {
                return;
            }

            token = this.peakPyramidToken;
            run = function () {
                q.peakPyramidTimer = 0;
                q.peakPyramidTimerType = 0;
                q.buildPeakPyramid(token);
            };

            if (typeof window !== 'undefined' && window.requestIdleCallback) {
                this.peakPyramidTimerType = 1;
                this.peakPyramidTimer = window.requestIdleCallback(run, {
                    timeout: 1600
                });
            }
            else {
                this.peakPyramidTimerType = 2;
                this.peakPyramidTimer = setTimeout(run, 0);
            }
        }
    }, {
        key: 'buildPeakPyramid',
        value: function buildPeakPyramid(token) {
            var buffer = this.buffer;

            if (token !== this.peakPyramidToken ||
                !buffer ||
                buffer.duration < this.peakPyramidMinDuration) {
                return;
            }

            this.peakPyramidJob = {
                token: token,
                buffer: buffer,
                baseStep: this.peakPyramidStep,
                channels: buffer.numberOfChannels,
                channel: 0,
                pyramid: [],
                bytes: 0,
                phase: 0
            };
            this.continuePeakPyramidBuild(this.peakPyramidJob);
        }
    }, {
        key: 'schedulePeakPyramidStep',
        value: function schedulePeakPyramidStep(job) {
            var q = this;
            var run = function (deadline) {
                q.peakPyramidTimer = 0;
                q.peakPyramidTimerType = 0;
                q.continuePeakPyramidBuild(job, deadline);
            };

            if (typeof window !== 'undefined' && window.requestIdleCallback) {
                this.peakPyramidTimerType = 1;
                this.peakPyramidTimer = window.requestIdleCallback(run, {
                    timeout: 1000
                });
            }
            else {
                this.peakPyramidTimerType = 2;
                this.peakPyramidTimer = setTimeout(run, 0);
            }
        }
    }, {
        key: 'continuePeakPyramidBuild',
        value: function continuePeakPyramidBuild(job, deadline) {
            var now = typeof performance !== 'undefined' && performance.now ?
                function () { return performance.now(); } :
                function () { return Date.now(); };
            var started = now();
            var budget = deadline && deadline.timeRemaining ?
                Math.max(4, Math.min(10, deadline.timeRemaining())) :
                6;

            if (!job ||
                job.token !== this.peakPyramidToken ||
                job.buffer !== this.buffer) {
                return;
            }

            while (job.channel < job.channels) {
                if (!job.levels) {
                    var data = job.buffer.getChannelData(job.channel);
                    var size = Math.ceil(data.length / job.baseStep);

                    job.data = data;
                    job.levels = [];
                    job.size = size;
                    job.min = new Float32Array(size);
                    job.max = new Float32Array(size);
                    job.index = 0;
                    job.phase = 1;
                }

                if (job.phase === 1) {
                    while (job.index < job.size) {
                        var from = job.index * job.baseStep;
                        var to = Math.min(job.data.length, from + job.baseStep);
                        var mn = 0;
                        var mx = 0;
                        var j = void 0;

                        for (j = from; j < to; ++j) {
                            var value = job.data[j];
                            if (value > mx) mx = value;
                            else if (value < mn) mn = value;
                        }

                        job.min[job.index] = mn;
                        job.max[job.index] = mx;
                        job.index++;

                        if ((job.index & 63) === 0 && now() - started >= budget) {
                            this.schedulePeakPyramidStep(job);
                            return;
                        }
                    }

                    job.levels.push({
                        step: job.baseStep,
                        min: job.min,
                        max: job.max
                    });
                    job.bytes += job.min.byteLength + job.max.byteLength;
                    job.prev = job.levels[job.levels.length - 1];
                    job.min = null;
                    job.max = null;
                    job.phase = 2;
                }

                while (job.phase === 2) {
                    if (job.prev.min.length <= 1) {
                        job.pyramid[job.channel] = job.levels;
                        job.channel++;
                        job.data = null;
                        job.levels = null;
                        job.prev = null;
                        job.min = null;
                        job.max = null;
                        job.phase = 0;
                        break;
                    }

                    if (!job.min) {
                        job.size = Math.ceil(job.prev.min.length / 2);
                        job.min = new Float32Array(job.size);
                        job.max = new Float32Array(job.size);
                        job.index = 0;
                    }

                    while (job.index < job.size) {
                        var p0 = job.index * 2;
                        var p1 = p0 + 1;
                        var mn2 = job.prev.min[p0];
                        var mx2 = job.prev.max[p0];

                        if (p1 < job.prev.min.length) {
                            if (job.prev.min[p1] < mn2) mn2 = job.prev.min[p1];
                            if (job.prev.max[p1] > mx2) mx2 = job.prev.max[p1];
                        }

                        job.min[job.index] = mn2;
                        job.max[job.index] = mx2;
                        job.index++;

                        if ((job.index & 1023) === 0 && now() - started >= budget) {
                            this.schedulePeakPyramidStep(job);
                            return;
                        }
                    }

                    job.levels.push({
                        step: job.prev.step * 2,
                        min: job.min,
                        max: job.max
                    });
                    job.bytes += job.min.byteLength + job.max.byteLength;
                    job.prev = job.levels[job.levels.length - 1];
                    job.min = null;
                    job.max = null;
                }

                if (now() - started >= budget) {
                    this.schedulePeakPyramidStep(job);
                    return;
                }
            }

            if (job.token !== this.peakPyramidToken || job.buffer !== this.buffer) {
                return;
            }

            this.peakPyramid = {
                buffer: job.buffer,
                length: job.buffer.length,
                sampleRate: job.buffer.sampleRate,
                channels: job.channels,
                step: job.baseStep,
                levels: job.pyramid,
                bytes: job.bytes
            };
            this.peakPyramidBytes = job.bytes;
            this.peakPyramidJob = null;
        }
    }, {
        key: 'getPeakPyramidLevel',
        value: function getPeakPyramidLevel(levels, sampleSize) {
            var target = Math.max(this.peakPyramidStep, sampleSize / 4);
            var level = levels[0];
            var i = void 0;

            for (i = 0; i < levels.length; ++i) {
                if (levels[i].step <= target) level = levels[i];
                else break;
            }

            return level;
        }
    }, {
        key: 'getPeaksFromPyramid',
        value: function getPeaksFromPyramid(length, first, sampleSize, init) {
            var cache = this.peakPyramid;
            var channels = this.buffer ? this.buffer.numberOfChannels : 0;
            var c = void 0;
            init = init || 0;

            if (!cache ||
                cache.buffer !== this.buffer ||
                cache.channels !== channels ||
                this.extraPeaks ||
                sampleSize < cache.step) {
                return false;
            }

            for (c = 0; c < channels; ++c) {
                var levels = cache.levels[c];
                var level = this.getPeakPyramidLevel(levels, sampleSize);
                var min_arr = level.min;
                var max_arr = level.max;
                var step = level.step;
                var peak_last = min_arr.length - 1;
                var peaks = this.splitPeaks[c];
                var i = void 0;

                for (i = init; i <= length; ++i) {
                    var from = first + i * sampleSize;
                    var to = from + sampleSize;
                    var min = 0;
                    var max = 0;
                    var p0 = void 0;
                    var p1 = void 0;
                    var p = void 0;

                    if (from >= cache.length || to <= 0) {
                        peaks[2 * i] = 0;
                        peaks[2 * i + 1] = 0;
                        continue;
                    }

                    p0 = Math.max(0, Math.min(peak_last, (from / step) >> 0));
                    p1 = Math.max(0, Math.min(peak_last, ((to - 1) / step) >> 0));

                    for (p = p0; p <= p1; ++p) {
                        if (max_arr[p] > max) max = max_arr[p];
                        if (min_arr[p] < min) min = min_arr[p];
                    }

                    peaks[2 * i] = max;
                    peaks[2 * i + 1] = min;
                }
            }

            return true;
        }

        /**
         * Compute the max and min value of the waveform when broken into <length> subranges.
         *
         * @param {number} length How many subranges to break the waveform into.
         * @param {number} first First sample in the required range.
         * @param {number} last Last sample in the required range.
         * @return {number[]|number[][]} Array of 2*<length> peaks or array of arrays of
         * peaks consisting of (max, min) values for each subrange.
         */
    }, {
        key: 'getPeaks',
        value: function getPeaks(length, first, last, force) {

            first = first * this.buffer.sampleRate;
            last = last || length - 1;

            this.setLength(length);

            /**
             * The following snippet fixes a buffering data issue on the Safari
             * browser which returned undefined It creates the missing buffer based
             * on 1 channel, 4096 samples and the sampleRate from the current
             * webaudio context 4096 samples seemed to be the best fit for rendering
             * will review this code once a stable version of Safari TP is out
             */
            if (!this.buffer.length) {
                var newBuffer = this.createBuffer (1, 4096, this.sampleRate);
                this.buffer = newBuffer.buffer;
            }

            // console.log( this.buffer.length, last );

            var sampleSize = this.buffer.length / last;
            var sampleStep = ~~(sampleSize / 10) || 1;

            if (sampleStep > 32) sampleStep = 32; // todo
            else if (sampleStep < 6) sampleStep = 6;

            var channels = this.buffer.numberOfChannels;
            var c = void 0;
            var init = 0;

            //window.rr = 0;

            //var old_shift = this.shift;

            this.shift = 0;

            if (this.splitPeaks && !force) {
                // check if there is an overlap in values...
                if (last == this.peaksEnd)
                {

                   // console.log( (this.peaksStart - first) / sampleSize );

                   // console.log( 'aaa ', first, last );

                    var shift = (this.peaksStart - first) / sampleSize;

                    if (shift === 0) {
                        this.shift = 999999999;

                        return this.splitPeaks;
                    }

                   // var abs_shift = Math.abs (shift); 
                   //  if (abs_shift > 0) {
                        // shift = (shift * 2);


                     //   if (abs_shift > 0.5) {
                        shift = Math.round ( shift );
                        first = this.peaksStart - (shift * sampleSize);
                        shift = (shift * 2);
                        //    shift = Math.round ( Math.abs (shift) ) * (shift < 0 ? - 1 : 1);

                     //   }
                     //   else {
                     //       shift = 2 * (shift/abs_shift);
                      //  }


                        this.shift = shift;

                        for (c = 0; c < channels; ++c) {
                            var peaks = this.splitPeaks[c];

                            if (shift < 0) {

//console.log( peaks[0], peaks[1], peaks[2], peaks[3], peaks[4], peaks[5], peaks[6] , peaks[7] , peaks[8] , peaks[9] , peaks[10] );

                                //this.splitPeaks[c] = peaks.slice(-shift);
                                peaks.copyWithin(0, -shift);

//console.log( peaks[0], peaks[1], peaks[2], peaks[3], peaks[4], peaks[5], peaks[6] , peaks[7] , peaks[8] , peaks[9] , peaks[10] );

//                                for (var i = 0; i < shift; ++i)
//                                {
//                                    peaks[i] = 0;
//                                }

                               // console.log( shift );
                               //window.rr = 1;
//                                console.log( 'sss ', shift, length, init, (length + shift) );

                                init = length + shift;
                            } else if (shift > 0) {
                                peaks.copyWithin(shift, 0, peaks.length - shift);
                                length = shift / 2 >> 0;
                            } else {
                                return this.splitPeaks;
                            }
                        }
                    // }
                }
            }

            if (this.peakPyramid && this.getPeaksFromPyramid(length, first, sampleSize, init)) {
                this.extraPeakStart = -1;
                this.extraPeakEnd = -1;
                this.peaksStart = first;
                this.peaksEnd = last;
                return this.splitPeaks;
            }



            /*
            if (!window.test123)
            {
                window.test123 = true;
                var heapf32 = new Float32Array ( ASM_HEAP );
                //var heapI32 = new Uint32Array ( ASM_HEAP );

                // init
                // length
                // sampleSize
                // first 

                //heapI32[0] = init;
                //heapI32[1] = length;
                //heapI32[2] = first;
                //heapf32[3] = sampleSize;

                heapf32.set (this.buffer.getChannelData(0), 0);

                ASM_LIB.GetPeaks (init, length, first, sampleStep, sampleSize);
            }
            */




            for (c = 0; c < channels; ++c) {
                var peaks = this.splitPeaks[c];
                var chan = this.buffer.getChannelData(c);
                var i = void 0;

                for (i = init; i <= length; ++i) {
                    var start = first + (i * sampleSize) >> 0;
                    var end = (start + sampleSize) >> 0;
                    var min = 0;
                    var max = 0;
                    var j = void 0;

                    for (j = start; j < end; j += sampleStep) {
                        var value = chan[j];


                        /*
                        if (this.reg) {
                            if (j >= this.reg.pos.start && j <= this.reg.pos.end) {
                                // take the value from the buffer
                                var kk = j - this.reg.pos.start;
                                value  = chan[ this.reg.initpos.start + kk ];
                            }
                            else if (j >= this.reg.initpos.start && j <= this.reg.initpos.end) {
                                value = 0;
                            }
                            // ----
                        }
                        */


                        if (value > max) {
                            max = value;
                        }

                        else if (value < min) {
                            min = value;

                            //console.log( value );
                        }
                    }

                   // if (window.rr === 1)
                   // {
                   //     console.log(1);
                   // }
                   // console.log( 'bb ', 2 * i, max );

                    peaks[2 * i] = max;
                    peaks[2 * i + 1] = min;
                }
            }

            this.extraPeakStart = -1;
            this.extraPeakEnd = -1;

            if (this.extraPeaks)
            {
                // convert extraOffset to pixels
                var extraoffset = (this.extraOffset / sampleSize) >> 0;

                if (first <= this.extraOffset && last > extraoffset)
                {
                    extraoffset = ((this.extraOffset - first) / sampleSize) >> 0;

                    // var get length of peaks
                    var extra_len = this.extraPeaks.length;
                    var extra_arr_len = this.extraPeaks[0].length;
                    var templength = extraoffset + ((extra_arr_len * extra_len) / sampleSize) >> 0;

                    this.extraPeakStart = extraoffset;
                    this.extraPeakEnd = templength;
                    // templength = -1;

                    for (c = 0; c < channels; ++c)
                    {
                        var peaks = this.splitPeaks[c];
                        // var chan = this.buffer.getChannelData(c);
                        var i = void 0;

                        var k = 0;
                        for (i = extraoffset; i <= templength; ++i)
                        {

                            var start = k * sampleSize >> 0;
                            var end = start + sampleSize >> 0;
                            var min = 0;
                            var max = 0;
                            var j = void 0;

                            ++k;

                            for (j = start; j < end; j += sampleStep)
                            {
                                var val = j / extra_arr_len;

                                if (val >= extra_len) { 
                                    break;
                                }

                                var value = this.extraPeaks[val >> 0][ j % extra_arr_len ];

                                if (value > max) {
                                    max = value;
                                }

                                if (value < min) {
                                    min = value;
                                }
                            }

                            peaks[2 * i] = max;
                            peaks[2 * i + 1] = min;
                        }
                        // ----
                    }
                    // ---
                }
            }
            // ----

            this.peaksStart = first;
            this.peaksEnd = last;

            return this.splitPeaks; //this.params.splitChannels ? this.splitPeaks : this.mergedPeaks;
        }

        /**
         * Get the position from 0 to 1
         *
         * @return {number}
         */

    }, {
        key: 'getPlayedPercents',
        value: function getPlayedPercents() {
            var duration = this.getDuration();
            return this.state === FINISHED ? 1 : this.getCurrentTime() / duration || 0;
        }

        /** @private */

    }, {
        key: 'disconnectSource',
        value: function disconnectSource() {
            if (this.source) {
                this.source.disconnect();
            }
        }

        /**
         * This is called when wavesurfer is destroyed
         */

    }, {
        key: 'destroy',
        value: function destroy() {
            if (!this.isPaused()) {
                this.pause();
            }
            this.unAll();
            this.resetPeakPyramid();
            this.buffer = null;
            this.disconnectSource();
            this.gainNode1.disconnect();
            this.gainNode2.disconnect();
            this.mergerNode.disconnect();
            this.splitterNode.disconnect();

            this.scriptNode.disconnect();
            this.analyser.disconnect();

            // close the audioContext if closeAudioContext option is set to true
            if (this.params.closeAudioContext) {
                // check if browser supports AudioContext.close()
                if (typeof this.ac.close === 'function' && this.ac.state != 'closed') {
                    this.ac.close();
                }
                // clear the reference to the audiocontext
                this.ac = null;
                // clear the actual audiocontext, either passed as param or the
                // global singleton
                if (!this.params.audioContext) {
                    window.WaveSurferAudioContext = null;
                } else {
                    this.params.audioContext = null;
                }
                // clear the offlineAudioContext
                window.WaveSurferOfflineAudioContext = null;
            }
        }

        /**
         * Loaded a decoded audio buffer
         *
         * @param {Object} buffer
         */

    }, {
        key: 'load',
        value: function load ( buffer ) {

            if (!this.buffer || !this._add)
            {
                // this.startPosition = 0;
                this.lastPlay = this.ac.currentTime;
                this.buffer = buffer;

                this.peaks = null;
                this.createSource();

                // --hack
                this.source.start (0,0,0);

                this.source.stop (0);
                this.createSource();
            }
            else
            {
                    // old buffer duratino + new buffer duration
                    // new_offset = old buffer length

                    var originalBuffer   = this.buffer;
                    var originalDuration = this.buffer.duration;
                    var originalOffset   = originalDuration;

                    var newDuration = buffer.duration;
                    var newLen      = (originalDuration + newDuration) * this.buffer.sampleRate;

                    var uberSegment = this.ac.createBuffer (
                        this.buffer.numberOfChannels,
                        this.buffer.length + buffer.length,
                        this.buffer.sampleRate
                    );

                    var offset = ((originalDuration / 1) * originalBuffer.sampleRate) >> 0;

                    for (var i = 0; i < originalBuffer.numberOfChannels; ++i)
                    {
                        var chan_data     = originalBuffer.getChannelData ( i );
                        var uberChanData  = uberSegment.getChannelData ( i );
                        var segment_chan_data = null;

                        if (buffer.numberOfChannels === 1)
                            segment_chan_data = buffer.getChannelData ( 0 );
                        else
                            segment_chan_data = buffer.getChannelData ( i );

                        // check if we have the selected channel
                        if (offset > 0)
                        {
                            uberChanData.set (
                                chan_data.slice ( 0, offset )
                            );
                        }

                        uberChanData.set (
                            segment_chan_data, offset
                        );

                        if (offset < (originalBuffer.length + buffer.length) )
                        {
                            uberChanData.set (
                                chan_data.slice ( offset ), offset + segment_chan_data.length
                            );
                        }

                        // --- 
                    }
                    // ----

                    // this.startPosition = 0;
                    this.lastPlay = this.ac.currentTime;
                    this.buffer = uberSegment;

                    this.peaks = null;
                    this.createSource();

                    // --hack
                    this.source.start (0,0,0);

                    this.source.stop (0);
                    this.createSource();
                    // this.buffer = uberSegment;
            }

            this.schedulePeakPyramid();
        }

        /** @private */

    }, {
        key: 'createSource',
        value: function createSource() {
            this.disconnectSource();
            this.source = this.ac.createBufferSource();

            // adjust for old browsers
            this.source.start = this.source.start || this.source.noteGrainOn;
            this.source.stop = this.source.stop || this.source.noteOff;

            this.source.playbackRate.setValueAtTime(this.playbackRate, this.ac.currentTime);
            this.source.buffer = this.buffer;
            this.source.connect(this.analyser);
        }

        /**
         * Used by `wavesurfer.isPlaying()` and `wavesurfer.playPause()`
         *
         * @return {boolean}
         */

    }, {
        key: 'isPaused',
        value: function isPaused() {
            return this.state !== PLAYING;
        }

        /**
         * Used by `wavesurfer.getDuration()`
         *
         * @return {number}
         */

    }, {
        key: 'getDuration',
        value: function getDuration() {
            if (!this.buffer) {
                if (this.explicitDuration) {
                    return this.explicitDuration;
                }
                return 0;
            }
            return this.buffer.duration;
        }

        /**
         * Used by `wavesurfer.seekTo()`
         *
         * @param {number} start Position to start at in seconds
         * @param {number} end Position to end at in seconds
         * @return {{start: number, end: number}}
         */

    }, {
        key: 'seekTo',
        value: function seekTo(start, end) {
            if (!this.buffer) {
                return;
            }

            this.scheduledPause = null;

            if (start == null) {
                start = this.getCurrentTime();
                if (start >= this.getDuration()) {
                    start = 0;
                }
            }
            if (end == null) {
                end = this.getDuration();
            }

            this.startPosition = start;
            this.lastPlay = this.ac.currentTime;

            if (this.state === FINISHED) {
                this.setState(PAUSED);
            }

            return {
                start: start,
                end: end
            };
        }

        /**
         * Get the playback position in seconds
         *
         * @return {number}
         */

    }, {
        key: 'getPlayedTime',
        value: function getPlayedTime() {
            return (this.ac.currentTime - this.lastPlay) * this.playbackRate;
        }

        /**
         * Plays the loaded audio region.
         *
         * @param {number} start Start offset in seconds, relative to the beginning
         * of a clip.
         * @param {number} end When to stop relative to the beginning of a clip.
         */

    }, {
        key: 'play',
        value: function play(start, end) {
            var _this5 = this;

            if (!this.buffer) {
                return;
            }
            if (this.ac.state && this.ac.state !== 'running') {
                if (this.ac.resume && this.ac.state !== 'closed') {
                    this.ac.resume().then(function () {
                        return _this5.play(start, end);
                    }, function () {});
                }
                return;
            }

            // need to re-create source on each playback
            this.createSource();

            var adjustedTime = this.seekTo(start, end);

            start = adjustedTime.start;
            end = adjustedTime.end;

            this.scheduledPause = end;

            this.source.start(0, start, end - start);

            this.setState(PLAYING);

            this.fireEvent('play');
        }

    }, {
        key: 'playLoop',
        value: function playLoop(start, end, at) {
            var _this6 = this;

            if (!this.buffer) {
                return;
            }

            if (end <= start) {
                return this.play(start, end);
            }
            if (this.ac.state && this.ac.state !== 'running') {
                if (this.ac.resume && this.ac.state !== 'closed') {
                    this.ac.resume().then(function () {
                        return _this6.playLoop(start, end, at);
                    }, function () {});
                }
                return;
            }

            this.createSource();

            var adjustedTime = this.seekTo(at == null ? start : at, end);
            at = adjustedTime.start;
            end = adjustedTime.end;

            this.loopStart = start;
            this.loopEnd = end;
            this.scheduledPause = Infinity;
            this.source.loop = true;
            this.source.loopStart = start;
            this.source.loopEnd = end;
            this.source.start(0, at);

            this.setState(PLAYING);

            this.fireEvent('play');
        }

        /**
         * Pauses the loaded audio.
         */

    }, {
        key: 'pause',
        value: function pause() {
            if (this.state === PAUSED) return ;

            this.scheduledPause = null;

            this.startPosition = this.getCurrentTime();
            if (this.source) {
                try {
                    this.source.stop(0);
                } catch (e) {}
            }

            this.setState(PAUSED);

            this.fireEvent('pause');
        }

        /**
         * Returns the current time in seconds relative to the audioclip's
         * duration.
         *
         * @return {number}
         */

    }, {
        key: 'getCurrentTime',
        value: function getCurrentTime() {
            if (this.state === PLAYING) {
                var time = this.startPosition + this.getPlayedTime();
                if (this.source && this.source.loop) {
                    var len = this.loopEnd - this.loopStart;
                    return len > 0 ? this.loopStart + ((time - this.loopStart) % len) : this.loopStart;
                }
                return time;
            }
            return this.state === FINISHED ? this.getDuration() : this.startPosition;
        }

    }]);

    return WebAudio;
}(util.Observer);

WebAudio.scriptBufferSize = 256;
exports.default = WebAudio;
module.exports = exports['default'];

/***/ })

/******/ });
});
