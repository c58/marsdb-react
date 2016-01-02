'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _map2 = require('fast.js/map');

var _map3 = _interopRequireDefault(_map2);

var _marsdb = require('marsdb');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 *
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

  _createClass(ExecutionContext, [{
    key: 'addCleanupListener',
    value: function addCleanupListener(fn) {
      var _this2 = this;

      this.on('cleanup', fn);
      return function () {
        return _this2.removeListener('cleanup', fn);
      };
    }
  }, {
    key: 'emitCleanup',
    value: function emitCleanup() {
      var isRoot = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      this.emit('cleanup', isRoot);
    }
  }, {
    key: 'createChildContext',
    value: function createChildContext() {
      var newContext = new ExecutionContext(this.variables);
      var stopper = this.addCleanupListener(function (isRoot) {
        newContext.emitCleanup(false);
        !isRoot && stopper();
      });
      return newContext;
    }
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

      var result = {};
      for (var k in initVars) {
        if (mapVars[k] !== undefined) {
          (0, _invariant2.default)(_utils2.default._isProperty(mapVars[k]), 'You can pass to a mapping only parent variables');
          result[k] = mapVars[k];
        } else if (contextVars[k] !== undefined) {
          result[k] = contextVars[k];
        } else {
          contextVars[k] = _utils2.default._createProperty(initVars[k]);
          result[k] = contextVars[k];
        }
      }

      return result;
    }
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
        if (_utils2.default._isCursor(nextValue)) {
          _this3.trackCursorChange(prop, nextValue);
          prop.emitChange();
        } else if (!_utils2.default._isProperty(nextValue)) {
          prop(nextValue);
        } else {
          throw new Error('Next value can\'t be a property');
        }
      };

      var varTrackers = (0, _map3.default)(vars, function (val) {
        return val.addChangeListener(updater);
      });

      var stopper = this.addCleanupListener(function (isRoot) {
        if (!isRoot) {
          varTrackers.forEach(function (stop) {
            return stop();
          });
          stopper();
        }
      });
    }
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
            return _utils2.default._createPropertyWithContext(x, _this4);
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
  }], [{
    key: 'getCurrentContext',
    value: function getCurrentContext() {
      return ExecutionContext.__currentContext;
    }
  }]);

  return ExecutionContext;
})(_marsdb.EventEmitter);