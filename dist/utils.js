'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._isProperty = _isProperty;
exports._isCursor = _isCursor;
exports._getFragmentValue = _getFragmentValue;
exports._getJoinFunction = _getJoinFunction;
exports._createProperty = _createProperty;
exports._createPropertyWithContext = _createPropertyWithContext;

var _map2 = require('fast.js/map');

var _map3 = _interopRequireDefault(_map2);

var _bind2 = require('fast.js/function/bind');

var _bind3 = _interopRequireDefault(_bind2);

var _marsdb = require('marsdb');

var _CursorObservable = require('marsdb/dist/CursorObservable');

var _CursorObservable2 = _interopRequireDefault(_CursorObservable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

// Internals
var _propertyVersionId = 0;
var noop = function noop() {};

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

    context.trackVariablesChange(prop, vars, valueGenerator);;
  }

  return prop;
}

/**
 * Return a function that join the result to given joinObj.
 * @param  {Class} containerClass
 * @param  {Object} joinObj
 * @param  {Object} vars
 * @param  {ExecutionContext} context
 * @return {Function}
 */
function _getJoinFunction(containerClass, joinObj, vars, context) {
  return function () {
    var doc = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var updated = arguments.length <= 1 || arguments[1] === undefined ? noop : arguments[1];

    if ((typeof doc === 'undefined' ? 'undefined' : _typeof(doc)) === 'object') {
      return (0, _map3.default)(joinObj, function (fragment, k) {
        var valueGenerator = (0, _bind3.default)(fragment, null, doc);
        var prop = _getFragmentValue(containerClass, valueGenerator, vars, context);
        doc[k] = prop;

        if (!prop.promise) {
          (function () {
            var changeStopper = prop.addChangeListener(updated);
            var cleanStopper = context.addCleanupListener(function (isRoot) {
              if (!isRoot) {
                cleanStopper();
                changeStopper();
              }
            });
          })();
        }

        return prop.promise;
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
  emitter.setMaxListeners(Infinity);
  var store = initValue;

  var prop = function prop() {
    if (arguments.length > 0) {
      store = arguments[0];
      prop.emitChange();
    }
    return store;
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

  prop.version = ++_propertyVersionId;
  prop.isProperty = true;
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