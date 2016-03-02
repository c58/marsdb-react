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