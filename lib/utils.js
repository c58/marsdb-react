import _map from 'fast.js/map';
import _keys from 'fast.js/object/keys';
import { EventEmitter } from 'marsdb';
import CursorObservable from 'marsdb/dist/CursorObservable';


// Internals
let _propertyVersionId = 0;
const noop = function() {};


/**
 * Return true if given value is a property
 * @param  {Object}  val
 * @return {Boolean}
 */
export function _isProperty(val) {
  return typeof val === 'function' && !!val.isProperty;
}

/**
 * Return true if given value is a CursorObservable
 * @param  {OBject}  val
 * @return {Boolean}
 */
export function _isCursor(val) {
  return val instanceof CursorObservable;
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
export function _getFragmentValue(containerClass, valueGenerator, vars, context) {
  const value = context.withinContext(() => valueGenerator(vars));

  let prop;
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
}

/**
 * Return a function that join the result of given joinObj.
 * @param  {Class} containerClass
 * @param  {Object} joinObj
 * @param  {Object} vars
 * @param  {ExecutionContext} context
 * @return {Function}
 */
export function _getJoinFunction(containerClass, joinObj, vars, context) {
  const joinObjKeys = _keys(joinObj);

  return (doc = {}, updated = noop) => {
    if (typeof doc === 'object') {
      return _map(joinObjKeys, (k) => {
        const valueGenerator = (opts) => joinObj[k](doc, opts);
        const prop = _getFragmentValue(containerClass, valueGenerator, vars, context);
        doc[k] = prop;

        return Promise.resolve(prop.promise).then((res) => {
          const changeStopper = prop.addChangeListener(updated);
          const cleanStopper = context.addCleanupListener((isRoot) => {
            if (!isRoot) {
              cleanStopper();
              changeStopper();
            }
          });
          return res;
        });
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
export function _createProperty(initValue) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(Infinity);
  let store = initValue;

  const prop = function() {
    if (arguments.length > 0) {
      store = arguments[0];
      prop.emitChange();
    }
    return store;
  };

  prop.emitChange = function() {
    prop.version = ++_propertyVersionId;
    emitter.emit('change');
  };

  prop.addChangeListener = function(func) {
    emitter.on('change', func);
    return function() {
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
export function _createPropertyWithContext(value, context) {
  const nextProp = _createProperty(value);
  nextProp.context = context;
  return nextProp;
}
