'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _forEach = require('fast.js/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _map2 = require('fast.js/map');

var _map3 = _interopRequireDefault(_map2);

var _keys2 = require('fast.js/object/keys');

var _keys3 = _interopRequireDefault(_keys2);

var _marsdb = require('marsdb');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * ExecutionContext is used to track changes of variables
 * and cursors and cleanup listeners on parent cursor changes.
 * It also provides a method to run a function "in context":
 * while function running, `ExecutionContext.getCurrentContext()`
 * returning the context.
 */

var ExecutionContext = (function (_EventEmitter) {
  _inherits(ExecutionContext, _EventEmitter);

  function ExecutionContext() {
    var variables = arguments.length <= 0 || arguments[0] === undefined ? new Map() : arguments[0];

    _classCallCheck(this, ExecutionContext);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ExecutionContext).call(this));

    _this.variables = variables;
    _this.emitCleanup = _this.emitCleanup.bind(_this);
    _this.setMaxListeners(Infinity);
    return _this;
  }

  /**
   * Adds a cleanup event listener and return a funtion
   * for removing listener.
   * @param {Function} fn
   * @return {Function}
   */

  _createClass(ExecutionContext, [{
    key: 'addCleanupListener',
    value: function addCleanupListener(fn) {
      var _this2 = this;

      this.on('cleanup', fn);
      return function () {
        return _this2.removeListener('cleanup', fn);
      };
    }

    /**
     * Emits cleanup event. Given argument indicates the source
     * of the event. If it is `false`, then the event will be
     * interprated as "went from upper context".
     * @param  {Boolean} isRoot
     */

  }, {
    key: 'emitCleanup',
    value: function emitCleanup() {
      var isRoot = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      this.emit('cleanup', isRoot);
    }

    /**
     * Creates a child context, that have the same map of variables.
     * Set context cleanup listener for propagating the event to the child.
     * Return child context object.
     * @return {ExecutionContext}
     */

  }, {
    key: 'createChildContext',
    value: function createChildContext() {
      var newContext = new ExecutionContext(this.variables);
      var stopper = this.addCleanupListener(function (isRoot) {
        newContext.emitCleanup(false);
        if (!isRoot) {
          stopper();
        }
      });
      return newContext;
    }

    /**
     * Execute given function "in context": set the context
     * as globally active with saving of previous active context,
     * and execute a function. While function executing
     * `ExecutionContext.getCurrentContext()` will return the context.
     * At the end of the execution it puts previous context back.
     * @param  {Function} fn
     */

  }, {
    key: 'withinContext',
    value: function withinContext(fn) {
      var prevContext = ExecutionContext.getCurrentContext();
      ExecutionContext.__currentContext = this;
      try {
        return fn();
      } finally {
        ExecutionContext.__currentContext = prevContext;
      }
    }

    /**
     * By given container class get variables from
     * the context and merge it with given initial values
     * and variables mapping. Return the result of the merge.
     * @param  {Class} containerClass
     * @param  {OBject} initVars
     * @param  {Object} mapVars
     * @return {Object}
     */

  }, {
    key: 'getVariables',
    value: function getVariables(containerClass) {
      var initVars = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var mapVars = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var contextVars = this.variables.get(containerClass);
      if (!contextVars) {
        contextVars = {};
        this.variables.set(containerClass, contextVars);
      }

      for (var k in initVars) {
        if (contextVars[k] === undefined) {
          if (mapVars[k] !== undefined) {
            (0, _invariant2.default)(utils._isProperty(mapVars[k]), 'You can pass to a mapping only parent variables');
            contextVars[k] = mapVars[k];
          } else {
            contextVars[k] = utils._createProperty(initVars[k]);
          }
        }
      }

      return contextVars;
    }

    /**
     * Track changes of given variable and regenerate value
     * on change. It also listen to context cleanup event
     * for stop variable change listeners
     * @param  {Property} prop
     * @param  {Object} vars
     * @param  {Function} valueGenerator
     */

  }, {
    key: 'trackVariablesChange',
    value: function trackVariablesChange(prop, vars, valueGenerator) {
      var _this3 = this;

      var updater = function updater() {
        _this3.emitCleanup();
        if (prop.promise) {
          prop.promise.stop();
        }

        var nextValue = _this3.withinContext(function () {
          return valueGenerator(vars);
        });
        if (utils._isCursor(nextValue)) {
          _this3.trackCursorChange(prop, nextValue);
        } else if (!utils._isProperty(nextValue)) {
          prop(nextValue);
        } else {
          throw new Error('Next value can\'t be a property');
        }
      };

      var varTrackers = (0, _map3.default)((0, _keys3.default)(vars), function (k) {
        return vars[k].addChangeListener(updater);
      });

      var stopper = this.addCleanupListener(function (isRoot) {
        if (!isRoot) {
          (0, _forEach2.default)(varTrackers, function (stop) {
            return stop();
          });
          stopper();
        }
      });
    }

    /**
     * Observe given cursor for changes and set new
     * result in given property. Also tracks context
     * cleanup event for stop observers
     * @param  {Property} prop
     * @param  {Cursor} cursor
     */

  }, {
    key: 'trackCursorChange',
    value: function trackCursorChange(prop, cursor) {
      var _this4 = this;

      if (prop.removeCursorTracker) {
        prop.removeCursorTracker();
      }

      var observer = function observer(result) {
        if (Array.isArray(result)) {
          result = (0, _map3.default)(result, function (x) {
            return utils._createPropertyWithContext(x, _this4);
          });
        }
        prop(result);
      };

      cursor.on('cursorChanged', this.emitCleanup);
      prop.promise = cursor.observe(observer);
      prop.removeCursorTracker = function () {
        cursor.removeListener('cursorChanged', _this4.emitCleanup);
        prop.promise.stop();
      };

      var stopper = this.addCleanupListener(function (isRoot) {
        if (!isRoot) {
          prop.removeCursorTracker();
          stopper();
        }
      });
    }

    /**
     * Returns a current active context, set by `withinContext`
     * @return {ExecutionContext}
     */

  }], [{
    key: 'getCurrentContext',
    value: function getCurrentContext() {
      return ExecutionContext.__currentContext;
    }
  }]);

  return ExecutionContext;
})(_marsdb.EventEmitter);

exports.default = ExecutionContext;