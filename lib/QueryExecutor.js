import _keys from 'fast.js/object/keys';
import _each from 'fast.js/forEach';
import _map from 'fast.js/map';
import { EventEmitter } from 'marsdb';
import { debounce } from 'marsdb/dist/CursorObservable';


/**
 *
 */
class QueryExecutor extends EventEmitter {
  constructor(fragments, initVarsOverride, containerClass) {
    super();
    this.containerClass = containerClass;
    this.fragmentNames = _keys(fragments);
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
        _each(this.fragmentNames, k => {
          this.result[k] = this.containerClass.getFragment(k);
        });
      });

      this._stoppers = _map(this.fragmentNames, k =>
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
      _each(this._stoppers, stop => stop());
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
      _each(nextProps, (prop, k) => {
        if (this.variables[k]) {
          this.variables[k](prop);
        }
      })
    });
  }

  _handleDataChanges() {
    const nextPromises = _map(this.fragmentNames, k => this.result[k].promise);
    const allPromise = Promise.all(nextPromises).then(() => {
      if (this._execution === allPromise) {
        this.emit('update', this.result);
      }
    });

    this._execution = allPromise;
  }
}
