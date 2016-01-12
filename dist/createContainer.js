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

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * High-order data container creator
 * @param  {Component} Component
 * @param  {Object} options.fragments
 * @param  {Object} options.initVars
 * @param  {Object} options.versions
 * @return {Component}
 */
function createContainer(Component, _ref) {
  var _ref$fragments = _ref.fragments;
  var fragments = _ref$fragments === undefined ? {} : _ref$fragments;
  var _ref$initialVariables = _ref.initialVariables;
  var initialVariables = _ref$initialVariables === undefined ? {} : _ref$initialVariables;
  var _ref$versions = _ref.versions;
  var versions = _ref$versions === undefined ? {} : _ref$versions;

  var componentName = Component.displayName || Component.name;
  var containerName = 'Mars(' + componentName + ')';
  var fragmentKeys = (0, _keys3.default)(fragments);
  var versionKeys = (0, _keys3.default)(versions);

  var Container = (function (_React$Component) {
    _inherits(Container, _React$Component);

    function Container() {
      _classCallCheck(this, Container);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(Container).apply(this, arguments));
    }

    _createClass(Container, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var variables = this.props[fragmentKeys[0]].context.getVariables(Container);

        (0, _forEach2.default)(versionKeys, function (k) {
          var prop = _this2.props[k] || variables[k];
          if (utils._isProperty(prop)) {
            prop.version = versions[k](prop());
          }
        });

        return _react2.default.createElement(Component, _extends({}, this.props, {
          variables: variables
        }));
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
        return new _QueryExecutor2.default(fragments, initVars, Container);
      }
    }]);

    return Container;
  })(_react2.default.Component);

  Container.displayName = containerName;
  return Container;
}