'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

var QueryExecutor = (function (_EventEmitter) {
  _inherits(QueryExecutor, _EventEmitter);

  function QueryExecutor(fragments, initVarsOverride, containerClass) {
    _classCallCheck(this, QueryExecutor);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(QueryExecutor).call(this));

    _this.containerClass = containerClass;
    _this.fragmentNames = (0, _keys3.default)(fragments);
    _this.initVarsOverride = initVarsOverride;
    _this.context = new _ExecutionContext2.default();
    _this.variables = _this.context.getVariables(containerClass, initVarsOverride);
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

      return this._execution.then(function () {
        (0, _forEach2.default)(_this3._stoppers, function (stop) {
          return stop();
        });
        _this3.removeAllListeners();
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
          if (_this4.variables[k]) {
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
})(_marsdb.EventEmitter);

exports.default = QueryExecutor;