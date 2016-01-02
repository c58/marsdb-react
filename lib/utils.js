import CursorObservable from 'marsdb/dist/CursorObservable';


// Internals
let _contextedPropertyId = 0;


/**
 * Return true if given value is a property
 * @param  {Object}  val
 * @return {Boolean}
 */
export function _isProperty(val) {
  return typeof val === 'function' && val.isProperty;
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
 * of fragment changed.
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
    prop = _createPropertyWithContext(null, vars);

    if (_isCursor(value)) {
      context.trackCursorChange(prop, value, vars);
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
export function _getJoinFunction(containerClass, joinObj, vars, context) {
  return (doc, updated, i, len) => {
    if (typeof doc === 'object') {
      return Object.keys(joinObj).map(k => {
        const valueGenerator = joinObj[k].bind(null, doc);
        const prop = _getFragmentValue(containerClass, valueGenerator, vars, context);
        doc[k] = prop;

        if (!prop.promise) {
          const changeStopper = prop.addChangeListener(updated);
          const cleanStopper = context.addCleanupListener((isRoot) => {
            if (!isRoot) {
              cleanStopper();
              changeStopper();
            }
          });
        }

        return prop.promise;
      });
    }
  };
}

/**
 * Creates a getter-setter property function
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
    } else {
      return store;
    }
  };

  prop.emitChange = function() {
    emitter.emit('change');
  };

  prop.addChangeListener = function(func) {
    emitter.on('change', func);
    return function() {
      emitter.removeListener('change', func);
    };
  };

  prop.isProperty = true;
  return prop;
}

/**
 * Create a property that holds given value and variables
 * @param  {Mixed} value
 * @param  {Object} variables
 * @return {Property}
 */
export function _createPropertyWithContext(value, variables) {
  const nextProp = _createProperty(value);
  const nextVersion = () => nextProp.version = _contextedPropertyId++;
  nextProp.variables = variables;
  nextProp.addChangeListener(nextVersion);
  nextProp.nextVersion = nextVersion;
  nextVersion();
  return nextProp;
}
