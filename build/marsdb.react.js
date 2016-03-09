(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.Mars || (g.Mars = {})).React = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Component for rendering data container
 */

var DataManagerContainer = function (_React$Component) {
  _inherits(DataManagerContainer, _React$Component);

  function DataManagerContainer(props, context) {
    _classCallCheck(this, DataManagerContainer);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(DataManagerContainer).call(this, props, context));

    _this.state = { result: {} };
    _this.query = props.component.getQuery(props.variables);
    _this.query.on('update', _this._handleDataChanges.bind(_this));
    _this._executeQuery();
    return _this;
  }

  _createClass(DataManagerContainer, [{
    key: '_executeQuery',
    value: function _executeQuery() {
      var _this2 = this;

      this._resolved = false;
      this.query.execute().then(function (result) {
        _this2._resolved = true;
        _this2.setState({ result: result });
      });
    }
  }, {
    key: '_handleDataChanges',
    value: function _handleDataChanges(result) {
      if (this._resolved) {
        this.setState({ result: result });
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.query.stop();
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this.query.updateVariables(nextProps);
    }
  }, {
    key: 'renderLoading',
    value: function renderLoading() {
      return this.props.renderLoading();
    }
  }, {
    key: 'render',
    value: function render() {
      var Component = this.props.component; // eslint-disable-line
      return this._resolved ? _react2.default.createElement(Component, _extends({}, this.props, this.state.result)) : this.renderLoading();
    }
  }]);

  return DataManagerContainer;
}(_react2.default.Component);

DataManagerContainer.defaultProps = {
  renderLoading: function renderLoading() {
    return null;
  }
};
exports.default = DataManagerContainer;
},{"react":undefined}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

var ExecutionContext = function (_EventEmitter) {
  _inherits(ExecutionContext, _EventEmitter);

  function ExecutionContext() {
    var variables = arguments.length <= 0 || arguments[0] === undefined ? new Map() : arguments[0];

    _classCallCheck(this, ExecutionContext);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ExecutionContext).call(this));

    _this.variables = variables;
    _this.emitCleanup = _this.emitCleanup.bind(_this);
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
      var prepareVariables = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

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

      if (prepareVariables && !contextVars.promise) {
        Object.defineProperty(contextVars, 'promise', {
          value: Promise.resolve(prepareVariables(contextVars)),
          configurable: true
        });
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
        if (prop.promise && prop.promise.stop) {
          prop.promise.stop();
        }

        var nextValue = _this3.withinContext(function () {
          return valueGenerator(vars);
        });
        if (utils._isCursor(nextValue)) {
          _this3.trackCursorChange(prop, nextValue);
          prop.emitChange();
        } else if (!utils._isProperty(nextValue)) {
          prop(nextValue);
        } else {
          // Variables tracking must be used only vhen valueGenerator
          // returns a Cursor or any type except Property.
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
}(_marsdb.EventEmitter);

exports.default = ExecutionContext;
},{"./utils":5,"fast.js/forEach":9,"fast.js/map":11,"fast.js/object/keys":14,"invariant":16,"marsdb":undefined}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _keys2 = require('fast.js/object/keys');

var _keys3 = _interopRequireDefault(_keys2);

var _forEach = require('fast.js/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _map2 = require('fast.js/map');

var _map3 = _interopRequireDefault(_map2);

var _marsdb = require('marsdb');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _ExecutionContext = require('./ExecutionContext');

var _ExecutionContext2 = _interopRequireDefault(_ExecutionContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * By given frgments object, varialbes and containerClass
 * creates a query executor.
 * It will execute each fragment of fragments object and
 * return a promise, that will be resolved when all fragments
 * is filled with data.
 *
 * Container class is an object with one static function – `getFragment`,
 * that must return a property function. By all properties constructed
 * a Promise that resolved when all `prop.promise` resolved.
 *
 * The class extends `EventEmitter`.Only one event may be emitted – `update`.
 * The event emitted when query data is updated. With event is arrived an object
 * of proprties for each fragment.
 */

var QueryExecutor = function (_EventEmitter) {
  _inherits(QueryExecutor, _EventEmitter);

  function QueryExecutor(fragments, initVarsOverride, containerClass, prepareVariables) {
    _classCallCheck(this, QueryExecutor);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(QueryExecutor).call(this));

    _this.containerClass = containerClass;
    _this.fragmentNames = (0, _keys3.default)(fragments);
    _this.initVarsOverride = initVarsOverride;
    _this.context = new _ExecutionContext2.default();
    _this.variables = _this.context.getVariables(containerClass, initVarsOverride, {}, prepareVariables);
    _this._handleDataChanges = (0, _marsdb.debounce)(_this._handleDataChanges.bind(_this), 1000 / 60, 5);
    return _this;
  }

  /**
   * Change a batch size of updater.
   * Btach size is a number of changes must be happen
   * in debounce interval to force execute debounced
   * function (update a result, in our case)
   *
   * @param  {Number} batchSize
   * @return {CursorObservable}
   */


  _createClass(QueryExecutor, [{
    key: 'batchSize',
    value: function batchSize(_batchSize) {
      this._handleDataChanges.updateBatchSize(_batchSize);
      return this;
    }

    /**
     * Change debounce wait time of the updater
     * @param  {Number} waitTime
     * @return {CursorObservable}
     */

  }, {
    key: 'debounce',
    value: function debounce(waitTime) {
      this._handleDataChanges.updateWait(waitTime);
      return this;
    }

    /**
     * Execute the query and return a Promise, that resolved
     * when all props will be filled with data.
     * If query already executing it just returns a promise
     * for currently executing query.
     * @return {Promise}
     */

  }, {
    key: 'execute',
    value: function execute() {
      var _this2 = this;

      if (!this._execution) {
        (function () {
          _this2.result = {};
          _this2.context.withinContext(function () {
            (0, _forEach2.default)(_this2.fragmentNames, function (k) {
              _this2.result[k] = _this2.containerClass.getFragment(k);
            });
          });

          var updater = function updater() {
            _this2._execution = _this2._handleDataChanges();
          };

          _this2._stoppers = (0, _map3.default)(_this2.fragmentNames, function (k) {
            return _this2.result[k].addChangeListener(updater);
          });

          updater();
        })();
      }

      return this._execution;
    }

    /**
     * Stops query executing and listening for changes.
     * Returns a promise resolved when query stopped.
     * @return {Promise}
     */

  }, {
    key: 'stop',
    value: function stop() {
      var _this3 = this;

      (0, _invariant2.default)(this._execution, 'stop(...): query is not executing');

      // Remove all update listeners synchronously to avoid
      // updates of old data
      this.removeAllListeners();

      return this._execution.then(function () {
        (0, _forEach2.default)(_this3._stoppers, function (stop) {
          return stop();
        });
        _this3.context.emitCleanup();
        _this3._execution = null;
      });
    }

    /**
     * Update top level variables of the query by setting
     * values in variable props from given object. If field
     * exists in a given object and not exists in variables map
     * then it will be ignored.
     * @param  {Object} nextProps
     * @return {Promise} resolved when variables updated
     */

  }, {
    key: 'updateVariables',
    value: function updateVariables(nextProps) {
      var _this4 = this;

      (0, _invariant2.default)(this._execution, 'updateVariables(...): query is not executing');

      return this._execution.then(function () {
        var updated = false;
        (0, _forEach2.default)(nextProps, function (prop, k) {
          if (_this4.variables[k] && _this4.variables[k]() !== prop) {
            _this4.variables[k](prop);
            updated = true;
          }
        });
        return updated;
      });
    }

    /**
     * The method is invoked when some of fragment's property is updated.
     * It emits an `update` event only when all `prop.promise` is resolved.
     */

  }, {
    key: '_handleDataChanges',
    value: function _handleDataChanges() {
      var _this5 = this;

      var nextPromises = (0, _map3.default)(this.fragmentNames, function (k) {
        return _this5.result[k].promise;
      });
      var resultPromise = Promise.all(nextPromises).then(function () {
        if (_this5._resultPromise === resultPromise) {
          _this5.emit('update', _this5.result);
        }
        return _this5.result;
      }, function (error) {
        _this5.emit('error', error);
        return _this5.result;
      });

      this._resultPromise = resultPromise;
      return this._resultPromise;
    }
  }]);

  return QueryExecutor;
}(_marsdb.EventEmitter);

exports.default = QueryExecutor;
},{"./ExecutionContext":2,"fast.js/forEach":9,"fast.js/map":11,"fast.js/object/keys":14,"invariant":16,"marsdb":undefined}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = createContainer;

var _keys2 = require('fast.js/object/keys');

var _keys3 = _interopRequireDefault(_keys2);

var _assign2 = require('fast.js/object/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _ExecutionContext = require('./ExecutionContext');

var _ExecutionContext2 = _interopRequireDefault(_ExecutionContext);

var _QueryExecutor = require('./QueryExecutor');

var _QueryExecutor2 = _interopRequireDefault(_QueryExecutor);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * High-order data container creator
 * @param  {Component} Component
 * @param  {Object} options.fragments
 * @param  {Object} options.initVars
 * @return {Component}
 */
function createContainer(Component, _ref) {
  var _ref$fragments = _ref.fragments;
  var fragments = _ref$fragments === undefined ? {} : _ref$fragments;
  var _ref$initialVariables = _ref.initialVariables;
  var initialVariables = _ref$initialVariables === undefined ? {} : _ref$initialVariables;
  var _ref$prepareVariables = _ref.prepareVariables;
  var prepareVariables = _ref$prepareVariables === undefined ? null : _ref$prepareVariables;

  var componentName = Component.displayName || Component.name;
  var containerName = 'Mars(' + componentName + ')';
  var fragmentKeys = (0, _keys3.default)(fragments);

  var Container = function (_React$Component) {
    _inherits(Container, _React$Component);

    function Container() {
      _classCallCheck(this, Container);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(Container).apply(this, arguments));
    }

    _createClass(Container, [{
      key: 'render',
      value: function render() {
        var variables = this.props[fragmentKeys[0]].context.getVariables(Container);

        return _react2.default.createElement(Component, _extends({}, this.props, { variables: variables }));
      }
    }], [{
      key: 'getFragment',
      value: function getFragment(name, mapping) {
        var initVarsOverride = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var parentContext = arguments[3];

        parentContext = parentContext || _ExecutionContext2.default.getCurrentContext();
        (0, _invariant2.default)(parentContext, 'getFragment(...): must be invoked within some context');

        var childContext = parentContext.createChildContext();
        var fragment = fragments[name];
        var initVars = (0, _assign3.default)({}, initialVariables, initVarsOverride);
        var vars = childContext.getVariables(Container, initVars, mapping, prepareVariables);

        (0, _invariant2.default)(typeof fragment === 'function' || (typeof fragment === 'undefined' ? 'undefined' : _typeof(fragment)) === 'object', 'getFragment(...): a fragment must be a function or an object');

        if ((typeof fragment === 'undefined' ? 'undefined' : _typeof(fragment)) === 'object') {
          return utils._getJoinFunction(Container, fragment, vars, childContext);
        } else {
          return utils._getFragmentValue(Container, fragment, vars, childContext);
        }
      }
    }, {
      key: 'getQuery',
      value: function getQuery() {
        var initVarsOverride = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var initVars = (0, _assign3.default)({}, initialVariables, initVarsOverride);
        return new _QueryExecutor2.default(fragments, initVars, Container, prepareVariables);
      }
    }]);

    return Container;
  }(_react2.default.Component);

  Container.displayName = containerName;
  return Container;
}
},{"./ExecutionContext":2,"./QueryExecutor":3,"./utils":5,"fast.js/object/assign":12,"fast.js/object/keys":14,"invariant":16,"react":undefined}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.noop = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports._isProperty = _isProperty;
exports._isCursor = _isCursor;
exports._getFragmentValue = _getFragmentValue;
exports._getJoinFunction = _getJoinFunction;
exports._createProperty = _createProperty;
exports._createPropertyWithContext = _createPropertyWithContext;

var _forEach = require('fast.js/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _map2 = require('fast.js/map');

var _map3 = _interopRequireDefault(_map2);

var _keys2 = require('fast.js/object/keys');

var _keys3 = _interopRequireDefault(_keys2);

var _marsdb = require('marsdb');

var _CursorObservable = require('marsdb/dist/CursorObservable');

var _CursorObservable2 = _interopRequireDefault(_CursorObservable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Internals
var _propertyVersionId = 0;
var noop = exports.noop = function noop() {}; // eslint-disable-line

/**
 * Return true if given value is a property
 * @param  {Object}  val
 * @return {Boolean}
 */
function _isProperty(val) {
  return typeof val === 'function' && !!val.isProperty;
}

/**
 * Return true if given value is a CursorObservable
 * @param  {OBject}  val
 * @return {Boolean}
 */
function _isCursor(val) {
  return val instanceof _CursorObservable2.default;
}

/**
 * Return a property, that updated when value
 * of fragment changed or variable changed. It do nothing
 * if generated value is already a property (just returns
 * the property).
 *
 * @param  {Class} containerClass
 * @param  {Function} valueGenerator
 * @param  {Object} vars
 * @param  {ExecutionContext} context
 * @return {Property}
 */
function _getFragmentValue(containerClass, valueGenerator, vars, context) {
  var _createFragmentProp = function _createFragmentProp() {
    var value = context.withinContext(function () {
      return valueGenerator(vars);
    });

    var prop = undefined;
    if (_isProperty(value)) {
      prop = value;
    } else {
      prop = _createPropertyWithContext(null, context);

      if (_isCursor(value)) {
        context.trackCursorChange(prop, value);
      } else {
        prop(value);
      }

      context.trackVariablesChange(prop, vars, valueGenerator);
    }

    return prop;
  };

  if (vars.promise) {
    var _ret = function () {
      var proxyProp = _createPropertyWithContext(null, context);
      proxyProp.promise = vars.promise.then(function () {
        var fragProp = _createFragmentProp();
        if (fragProp() !== null) {
          proxyProp.emitChange();
        }
        proxyProp.proxyTo(fragProp);
        return fragProp.promise;
      });
      return {
        v: proxyProp
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  } else {
    return _createFragmentProp();
  }
}

/**
 * Return a function that join the result of given joinObj.
 * @param  {Class} containerClass
 * @param  {Object} joinObj
 * @param  {Object} vars
 * @param  {ExecutionContext} context
 * @return {Function}
 */
function _getJoinFunction(containerClass, joinObj, vars, context) {
  var joinObjKeys = (0, _keys3.default)(joinObj);

  return function (doc) {
    var updated = arguments.length <= 1 || arguments[1] === undefined ? noop : arguments[1];

    if ((typeof doc === 'undefined' ? 'undefined' : _typeof(doc)) === 'object' && doc !== null) {
      return (0, _map3.default)(joinObjKeys, function (k) {
        if (doc[k] === undefined) {
          var _ret2 = function () {
            var valueGenerator = function valueGenerator(opts) {
              return joinObj[k](doc, opts);
            };
            var prop = _getFragmentValue(containerClass, valueGenerator, vars, context);
            doc[k] = prop;

            return {
              v: Promise.resolve(prop.promise).then(function (res) {
                var changeStopper = prop.addChangeListener(updated);
                var cleanStopper = context.addCleanupListener(function (isRoot) {
                  if (!isRoot) {
                    cleanStopper();
                    changeStopper();
                  }
                });
                return res;
              })
            };
          }();

          if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
        }
      });
    }
  };
}

/**
 * Creates a getter-setter property function.
 * The function returns current value if called without
 * arguments. If first argument passed then it sets new
 * value and returns new value.
 *
 * On set of a new value it emits a change event. You can
 * listen on a change event by calling `addChangeListener`
 * which adds a change event handler that returns a function
 * for stopping listening.
 *
 * A property also have a `version` field. It's a unique value
 * across all active properties. A version is changed when
 * property have changed before emitting change event.
 *
 * @param  {Mixed} initValue
 * @return {Property}
 */
function _createProperty(initValue) {
  var emitter = new _marsdb.EventEmitter();
  var store = initValue;
  var proxyProp = null;

  var prop = function prop() {
    if (proxyProp) {
      return proxyProp.apply(null, arguments);
    } else {
      if (arguments.length > 0) {
        store = arguments[0];
        if (arguments.length === 1) {
          prop.emitChange();
        }
      }
      return store;
    }
  };

  prop.emitChange = function () {
    prop.version = ++_propertyVersionId;
    emitter.emit('change');
  };

  prop.addChangeListener = function (func) {
    emitter.on('change', func);
    return function () {
      emitter.removeListener('change', func);
    };
  };

  prop.proxyTo = function (toProp) {
    proxyProp = toProp;
    Object.defineProperty(prop, 'version', {
      get: function get() {
        return toProp.version;
      },
      set: function set(newValue) {
        return toProp.version = newValue;
      }
    });
    prop.addChangeListener = toProp.addChangeListener;
    prop.emitChange = toProp.emitChange;
    (0, _forEach2.default)(emitter.listeners('change'), function (cb) {
      return toProp.addChangeListener(cb);
    });
    emitter = toProp.__emitter;
    store = null;
  };

  prop.version = ++_propertyVersionId;
  prop.isProperty = true;
  prop.__emitter = emitter;
  return prop;
}

/**
 * Create a property that holds given value and context.
 * @param  {Mixed} value
 * @param  {ExecutionContext} context
 * @return {Property}
 */
function _createPropertyWithContext(value, context) {
  var nextProp = _createProperty(value);
  nextProp.context = context;
  return nextProp;
}
},{"fast.js/forEach":9,"fast.js/map":11,"fast.js/object/keys":14,"marsdb":undefined,"marsdb/dist/CursorObservable":undefined}],6:[function(require,module,exports){
var createContainer = require('./dist/createContainer').default;
var DataManagerContainer = require('./dist/DataManagerContainer').default;


module.exports = {
  __esModule: true,
  createContainer: createContainer,
  DataManagerContainer: DataManagerContainer
};

},{"./dist/DataManagerContainer":1,"./dist/createContainer":4}],7:[function(require,module,exports){
'use strict';

var bindInternal3 = require('../function/bindInternal3');

/**
 * # For Each
 *
 * A fast `.forEach()` implementation.
 *
 * @param  {Array}    subject     The array (or array-like) to iterate over.
 * @param  {Function} fn          The visitor function.
 * @param  {Object}   thisContext The context for the visitor.
 */
module.exports = function fastForEach (subject, fn, thisContext) {
  var length = subject.length,
      iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn,
      i;
  for (i = 0; i < length; i++) {
    iterator(subject[i], i, subject);
  }
};

},{"../function/bindInternal3":10}],8:[function(require,module,exports){
'use strict';

var bindInternal3 = require('../function/bindInternal3');

/**
 * # Map
 *
 * A fast `.map()` implementation.
 *
 * @param  {Array}    subject     The array (or array-like) to map over.
 * @param  {Function} fn          The mapper function.
 * @param  {Object}   thisContext The context for the mapper.
 * @return {Array}                The array containing the results.
 */
module.exports = function fastMap (subject, fn, thisContext) {
  var length = subject.length,
      result = new Array(length),
      iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn,
      i;
  for (i = 0; i < length; i++) {
    result[i] = iterator(subject[i], i, subject);
  }
  return result;
};

},{"../function/bindInternal3":10}],9:[function(require,module,exports){
'use strict';

var forEachArray = require('./array/forEach'),
    forEachObject = require('./object/forEach');

/**
 * # ForEach
 *
 * A fast `.forEach()` implementation.
 *
 * @param  {Array|Object} subject     The array or object to iterate over.
 * @param  {Function}     fn          The visitor function.
 * @param  {Object}       thisContext The context for the visitor.
 */
module.exports = function fastForEach (subject, fn, thisContext) {
  if (subject instanceof Array) {
    return forEachArray(subject, fn, thisContext);
  }
  else {
    return forEachObject(subject, fn, thisContext);
  }
};
},{"./array/forEach":7,"./object/forEach":13}],10:[function(require,module,exports){
'use strict';

/**
 * Internal helper to bind a function known to have 3 arguments
 * to a given context.
 */
module.exports = function bindInternal3 (func, thisContext) {
  return function (a, b, c) {
    return func.call(thisContext, a, b, c);
  };
};

},{}],11:[function(require,module,exports){
'use strict';

var mapArray = require('./array/map'),
    mapObject = require('./object/map');

/**
 * # Map
 *
 * A fast `.map()` implementation.
 *
 * @param  {Array|Object} subject     The array or object to map over.
 * @param  {Function}     fn          The mapper function.
 * @param  {Object}       thisContext The context for the mapper.
 * @return {Array|Object}             The array or object containing the results.
 */
module.exports = function fastMap (subject, fn, thisContext) {
  if (subject instanceof Array) {
    return mapArray(subject, fn, thisContext);
  }
  else {
    return mapObject(subject, fn, thisContext);
  }
};
},{"./array/map":8,"./object/map":15}],12:[function(require,module,exports){
'use strict';

/**
 * Analogue of Object.assign().
 * Copies properties from one or more source objects to
 * a target object. Existing keys on the target object will be overwritten.
 *
 * > Note: This differs from spec in some important ways:
 * > 1. Will throw if passed non-objects, including `undefined` or `null` values.
 * > 2. Does not support the curious Exception handling behavior, exceptions are thrown immediately.
 * > For more details, see:
 * > https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 *
 *
 *
 * @param  {Object} target      The target object to copy properties to.
 * @param  {Object} source, ... The source(s) to copy properties from.
 * @return {Object}             The updated target object.
 */
module.exports = function fastAssign (target) {
  var totalArgs = arguments.length,
      source, i, totalKeys, keys, key, j;

  for (i = 1; i < totalArgs; i++) {
    source = arguments[i];
    keys = Object.keys(source);
    totalKeys = keys.length;
    for (j = 0; j < totalKeys; j++) {
      key = keys[j];
      target[key] = source[key];
    }
  }
  return target;
};

},{}],13:[function(require,module,exports){
'use strict';

var bindInternal3 = require('../function/bindInternal3');

/**
 * # For Each
 *
 * A fast object `.forEach()` implementation.
 *
 * @param  {Object}   subject     The object to iterate over.
 * @param  {Function} fn          The visitor function.
 * @param  {Object}   thisContext The context for the visitor.
 */
module.exports = function fastForEachObject (subject, fn, thisContext) {
  var keys = Object.keys(subject),
      length = keys.length,
      iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn,
      key, i;
  for (i = 0; i < length; i++) {
    key = keys[i];
    iterator(subject[key], key, subject);
  }
};

},{"../function/bindInternal3":10}],14:[function(require,module,exports){
'use strict';

/**
 * Object.keys() shim for ES3 environments.
 *
 * @param  {Object} obj The object to get keys for.
 * @return {Array}      The array of keys.
 */
module.exports = typeof Object.keys === "function" ? Object.keys : /* istanbul ignore next */ function fastKeys (obj) {
  var keys = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
};
},{}],15:[function(require,module,exports){
'use strict';

var bindInternal3 = require('../function/bindInternal3');

/**
 * # Map
 *
 * A fast object `.map()` implementation.
 *
 * @param  {Object}   subject     The object to map over.
 * @param  {Function} fn          The mapper function.
 * @param  {Object}   thisContext The context for the mapper.
 * @return {Object}               The new object containing the results.
 */
module.exports = function fastMapObject (subject, fn, thisContext) {
  var keys = Object.keys(subject),
      length = keys.length,
      result = {},
      iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn,
      i, key;
  for (i = 0; i < length; i++) {
    key = keys[i];
    result[key] = iterator(subject[key], key, subject);
  }
  return result;
};

},{"../function/bindInternal3":10}],16:[function(require,module,exports){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if ("production" !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}]},{},[6])(6)
});