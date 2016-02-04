import _each from 'fast.js/forEach';
import _map from 'fast.js/map';
import _keys from 'fast.js/object/keys';
import { EventEmitter } from 'marsdb';
import invariant from 'invariant';
import * as utils from './utils';


/**
 * ExecutionContext is used to track changes of variables
 * and cursors and cleanup listeners on parent cursor changes.
 * It also provides a method to run a function "in context":
 * while function running, `ExecutionContext.getCurrentContext()`
 * returning the context.
 */
export default class ExecutionContext extends EventEmitter {
  constructor(variables = new Map()) {
    super();
    this.variables = variables;
    this.emitCleanup = this.emitCleanup.bind(this);
  }

  /**
   * Adds a cleanup event listener and return a funtion
   * for removing listener.
   * @param {Function} fn
   * @return {Function}
   */
  addCleanupListener(fn) {
    this.on('cleanup', fn);
    return () => this.removeListener('cleanup', fn);
  }

  /**
   * Emits cleanup event. Given argument indicates the source
   * of the event. If it is `false`, then the event will be
   * interprated as "went from upper context".
   * @param  {Boolean} isRoot
   */
  emitCleanup(isRoot = true) {
    this.emit('cleanup', isRoot);
  }

  /**
   * Creates a child context, that have the same map of variables.
   * Set context cleanup listener for propagating the event to the child.
   * Return child context object.
   * @return {ExecutionContext}
   */
  createChildContext() {
    const newContext = new ExecutionContext(this.variables);
    const stopper = this.addCleanupListener((isRoot) => {
      newContext.emitCleanup(false);
      if (!isRoot) {
        stopper();
      }
    });
    return newContext;
  }

  /**
   * Execute given function "in context": set the context
   * as globally active with saving of previous active context,
   * and execute a function. While function executing
   * `ExecutionContext.getCurrentContext()` will return the context.
   * At the end of the execution it puts previous context back.
   * @param  {Function} fn
   */
  withinContext(fn) {
    const prevContext = ExecutionContext.getCurrentContext();
    ExecutionContext.__currentContext = this;
    try {
      return fn();
    } finally {
      ExecutionContext.__currentContext = prevContext;
    }
  }

  /**
   * By given container class get variables from
   * the context and merge it with given initial values
   * and variables mapping. Return the result of the merge.
   * @param  {Class} containerClass
   * @param  {OBject} initVars
   * @param  {Object} mapVars
   * @return {Object}
   */
  getVariables(containerClass, initVars = {}, mapVars = {}) {
    let contextVars = this.variables.get(containerClass);
    if (!contextVars) {
      contextVars = {};
      this.variables.set(containerClass, contextVars);
    }

    for (const k in initVars) {
      if (contextVars[k] === undefined) {
        if (mapVars[k] !== undefined) {
          invariant(
            utils._isProperty(mapVars[k]),
            'You can pass to a mapping only parent variables'
          );
          contextVars[k] = mapVars[k];
        } else {
          contextVars[k] = utils._createProperty(initVars[k]);
        }
      }
    }

    return contextVars;
  }

  /**
   * Track changes of given variable and regenerate value
   * on change. It also listen to context cleanup event
   * for stop variable change listeners
   * @param  {Property} prop
   * @param  {Object} vars
   * @param  {Function} valueGenerator
   */
  trackVariablesChange(prop, vars, valueGenerator) {
    const updater = () => {
      this.emitCleanup();
      if (prop.promise) {
        prop.promise.stop();
      }

      const nextValue = this.withinContext(() => valueGenerator(vars));
      if (utils._isCursor(nextValue)) {
        this.trackCursorChange(prop, nextValue);
        prop.emitChange();
      } else if (!utils._isProperty(nextValue)) {
        prop(nextValue);
      } else {
        // Variables tracking must be used only vhen valueGenerator
        // returns a Cursor or any type except Property.
        throw new Error(`Next value can't be a property`);
      }
    };

    const varTrackers = _map(_keys(vars), (k) =>
      vars[k].addChangeListener(updater));

    const stopper = this.addCleanupListener((isRoot) => {
      if (!isRoot) {
        _each(varTrackers, stop => stop());
        stopper();
      }
    });
  }

  /**
   * Observe given cursor for changes and set new
   * result in given property. Also tracks context
   * cleanup event for stop observers
   * @param  {Property} prop
   * @param  {Cursor} cursor
   */
  trackCursorChange(prop, cursor) {
    if (prop.removeCursorTracker) {
      prop.removeCursorTracker();
    }

    const observer = (result) => {
      if (Array.isArray(result)) {
        result = _map(result, x => utils._createPropertyWithContext(x, this));
      }
      prop(result);
    };

    cursor.on('cursorChanged', this.emitCleanup);
    prop.promise = cursor.observe(observer);
    prop.removeCursorTracker = () => {
      cursor.removeListener('cursorChanged', this.emitCleanup);
      prop.promise.stop();
    };

    const stopper = this.addCleanupListener((isRoot) => {
      if (!isRoot) {
        prop.removeCursorTracker();
        stopper();
      }
    });
  }

  /**
   * Returns a current active context, set by `withinContext`
   * @return {ExecutionContext}
   */
  static getCurrentContext() {
    return ExecutionContext.__currentContext;
  }
}
