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

var _CursorObservable = require('marsdb/dist/CursorObservable');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _ExecutionContext = require('./ExecutionContext');

var _ExecutionContext2 = _interopRequireDefault(_ExecutionContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 *
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
    _this._handleDataChanges = (0, _CursorObservable.debounce)(_this._handleDataChanges.bind(_this), 1000 / 60, 5);
    return _this;
  }

  _createClass(QueryExecutor, [{
    key: 'execute',
    value: function execute() {
      var _this2 = this;

      if (!this._execution) {
        this.result = {};
        this.context.withinContext(function () {
          (0, _forEach2.default)(_this2.fragmentNames, function (k) {
            _this2.result[k] = _this2.containerClass.getFragment(k);
          });
        });

        this._stoppers = (0, _map3.default)(this.fragmentNames, function (k) {
          return _this2.result[k].addChangeListener(_this2._handleDataChanges);
        });

        this._execution = Promise.resolve();
        this._handleDataChanges();
      }

      return this._execution;
    }
  }, {
    key: 'stop',
    value: function stop() {
      var _this3 = this;

      (0, _invariant2.default)(this._execution, 'stop(...): query is not executing');

      this._execution.then(function () {
        (0, _forEach2.default)(_this3._stoppers, function (stop) {
          return stop();
        });
        _this3.removeAllListeners();
        _this3.context.emitCleanup();
        _this3._execution = null;
      });
    }
  }, {
    key: 'updateVariables',
    value: function updateVariables(nextProps) {
      var _this4 = this;

      (0, _invariant2.default)(this._execution, 'updateVariables(...): query is not executing');

      this._execution.then(function () {
        (0, _forEach2.default)(nextProps, function (prop, k) {
          if (_this4.variables[k]) {
            _this4.variables[k](prop);
          }
        });
      });
    }
  }, {
    key: '_handleDataChanges',
    value: function _handleDataChanges() {
      var _this5 = this;

      var nextPromises = (0, _map3.default)(this.fragmentNames, function (k) {
        return _this5.result[k].promise;
      });
      var allPromise = Promise.all(nextPromises).then(function () {
        if (_this5._execution === allPromise) {
          _this5.emit('update', _this5.result);
        }
      });

      this._execution = allPromise;
    }
  }]);

  return QueryExecutor;
})(_marsdb.EventEmitter);

exports.default = QueryExecutor;