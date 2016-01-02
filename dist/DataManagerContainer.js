'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataManagerContainer = undefined;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 *
 */

var DataManagerContainer = exports.DataManagerContainer = (function (_React$Component) {
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
      this.query.execute().then(function () {
        _this2._resolved = true;
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
    key: 'render',
    value: function render() {
      var Component = this.props.component;
      return this._resolved ? _react2.default.createElement(Component, this.state.result) : null;
    }
  }]);

  return DataManagerContainer;
})(_react2.default.Component);