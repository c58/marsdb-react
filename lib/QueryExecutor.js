import { EventEmitter } from 'marsdb';
import { debounce } from 'marsdb/dist/CursorObservable';


/**
 *
 */
class QueryExecutor extends EventEmitter {
  constructor(fragments, initVarsOverride, containerClass) {
    super();
    this.containerClass = containerClass;
    this.fragmentNames = Object.keys(fragments);
    this.initVarsOverride = initVarsOverride;
    this.context = new ExecutionContext();
    this.variables = this.context.getVariables(containerClass, initVarsOverride);
    this._handleDataChanges = debounce(
      this._handleDataChanges.bind(this),
      10, 5
    );
  }

  execute() {
    if (!this._execution) {
      this.result = {};
      this.context.withinContext(() => {
        this.fragmentNames.forEach(k => {
          this.result[k] = this.containerClass.getFragment(k);
        });
      });

      this._stoppers = this.fragmentNames.map(k =>
        this.result[k].addChangeListener(this._handleDataChanges));

      this._execution = Promise.resolve();
      this._handleDataChanges();
    }

    return this._execution;
  }

  stop() {
    invariant(
      this._execution,
      'stop(...): query is not executing'
    );

    this._execution.then(() => {
      this._stoppers.forEach(stop => stop());
      this.removeAllListeners();
      this.context.emitCleanup();
      this._execution = null;
    });
  }

  updateVariables(nextProps) {
    invariant(
      this._execution,
      'updateVariables(...): query is not executing'
    );

    this._execution.then(() => {
      Object.keys(nextProps).forEach(k => {
        if (this.variables[k]) {
          this.variables[k](nextProps[k]);
        }
      })
    });
  }

  _handleDataChanges() {
    const nextPromises = this.fragmentNames.map(k => this.result[k].promise);
    const allPromise = Promise.all(nextPromises).then(() => {
      if (this._execution === allPromise) {
        this.emit('update', this.result);
      }
    });

    this._execution = allPromise;
  }
}
