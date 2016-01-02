'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createContainer;

var _forEach = require('fast.js/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

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

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/**
 * High-order container creator
 * @param  {Component} Component
 * @param  {Object} options.fragments
 * @param  {Object} options.initVars
 * @return {Component}
 */
function createContainer(Component, _ref) {
  var fragments = _ref.fragments;
  var initialVariables = _ref.initialVariables;
  var versions = _ref.versions;

  (0, _invariant2.default)((typeof fragments === 'undefined' ? 'undefined' : _typeof(fragments)) === 'object' && (0, _keys3.default)(fragments).length > 0, 'createContainer(...): fragments must be non-empty object');

  var fragmentKeys = (0, _keys3.default)(fragments);
  var getPropsHash = function getPropsHash(props) {
    var hash = '';
    (0, _forEach2.default)(fragmentKeys, function (k) {
      if (versions && versions[k] && props[k]) {
        hash += versions[k](props[k]());
      } else {
        hash += props[k] && props[k].version;
      }
    });
    return hash;
  };

  var Container = (function (_React$Component) {
    _inherits(Container, _React$Component);

    function Container(props, context) {
      _classCallCheck(this, Container);

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Container).call(this, props, context));

      _this.prevHash = getPropsHash(props);
      return _this;
    }

    _createClass(Container, [{
      key: 'shouldComponentUpdate',
      value: function shouldComponentUpdate(nextProps) {
        var nextHash = getPropsHash(nextProps);
        var shouldUpdate = nextHash !== this.prevHash;
        this.prevHash = nextHash;
        return shouldUpdate;
      }
    }, {
      key: 'render',
      value: function render() {
        var variables = this.props[fragmentKeys[0]].context.variables.get(Container);
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
        var vars = childContext.getVariables(Container, initVars, mapping);

        (0, _invariant2.default)(typeof fragment === 'function' || (typeof fragment === 'undefined' ? 'undefined' : _typeof(fragment)) === 'object', 'getFragment(...): a fragment must be a function or an object');

        if ((typeof fragment === 'undefined' ? 'undefined' : _typeof(fragment)) === 'object') {
          return _utils2.default._getJoinFunction(Container, fragment, vars, childContext);
        } else {
          return _utils2.default._getFragmentValue(Container, fragment, vars, childContext);
        }
      }
    }, {
      key: 'getQuery',
      value: function getQuery(initVarsOverride) {
        return new _QueryExecutor2.default(fragments, initVarsOverride, Container);
      }
    }]);

    return Container;
  })(_react2.default.Component);

  return Container;
}