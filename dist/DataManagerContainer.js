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