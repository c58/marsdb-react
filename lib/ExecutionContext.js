import _map from 'fast.js/map';
import { EventEmitter } from 'marsdb';
import invariant from 'invariant';
import * as utils from './utils';


/**
 *
 */
export default class ExecutionContext extends EventEmitter {
  constructor(variables = new Map()) {
    super();
    this.variables = variables;
    this.emitCleanup = this.emitCleanup.bind(this);
    this.setMaxListeners(Infinity);
  }

  addCleanupListener(fn) {
    this.on('cleanup', fn);
    return () => this.removeListener('cleanup', fn);
  }

  emitCleanup(isRoot = true) {
    this.emit('cleanup', isRoot);
  }

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

  withinContext(fn) {
    const prevContext = ExecutionContext.getCurrentContext();
    ExecutionContext.__currentContext = this;
    try {
      return fn();
    } finally {
      ExecutionContext.__currentContext = prevContext;
    }
  }

  getVariables(containerClass, initVars = {}, mapVars = {}) {
    let contextVars = this.variables.get(containerClass);
    if (!contextVars) {
      contextVars = {};
      this.variables.set(containerClass, contextVars);
    }

    const result = {};
    for (const k in initVars) {
      if (mapVars[k] !== undefined) {
        invariant(
          utils._isProperty(mapVars[k]),
          'You can pass to a mapping only parent variables'
        );
        result[k] = mapVars[k];
      } else if (contextVars[k] !== undefined) {
        result[k] = contextVars[k];
      } else {
        contextVars[k] = utils._createProperty(initVars[k]);
        result[k] = contextVars[k];
      }
    }

    return result;
  }

  trackVariablesChange(prop, vars, valueGenerator) {
    const updater = () => {
      this.emitCleanup();
      if (prop.promise) {
        prop.promise.stop();
      }

      const nextValue = this.withinContext(() => valueGenerator(vars));
      if (utils._isCursor(nextValue)) {
        this.trackCursorChange(prop, nextValue);
      } else if (!utils._isProperty(nextValue)) {
        prop(nextValue);
      } else {
        throw new Error(`Next value can't be a property`);
      }
    };

    const varTrackers = _map(vars, (val) =>
      val.addChangeListener(updater));

    const stopper = this.addCleanupListener((isRoot) => {
      if (!isRoot) {
        varTrackers.forEach(stop => stop());
        stopper();
      }
    });
  }

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

  static getCurrentContext() {
    return ExecutionContext.__currentContext;
  }
}
