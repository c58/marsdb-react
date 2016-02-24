import _keys from 'fast.js/object/keys';
import _each from 'fast.js/forEach';
import _map from 'fast.js/map';
import { EventEmitter, debounce } from 'marsdb';
import invariant from 'invariant';
import ExecutionContext from './ExecutionContext';


/**
 * By given frgments object, varialbes and containerClass
 * creates a query executor.
 * It will execute each fragment of fragments object and
 * return a promise, that will be resolved when all fragments
 * is filled with data.
 *
 * Container class is an object with one static function – `getFragment`,
 * that must return a property function. By all properties constructed
 * a Promise that resolved when all `prop.promise` resolved.
 *
 * The class extends `EventEmitter`.Only one event may be emitted – `update`.
 * The event emitted when query data is updated. With event is arrived an object
 * of proprties for each fragment.
 */
export default class QueryExecutor extends EventEmitter {
  constructor(fragments, initVarsOverride, containerClass) {
    super();
    this.containerClass = containerClass;
    this.fragmentNames = _keys(fragments);
    this.initVarsOverride = initVarsOverride;
    this.context = new ExecutionContext();
    this.variables = this.context.getVariables(containerClass, initVarsOverride);
    this._handleDataChanges = debounce(
      this._handleDataChanges.bind(this),
      1000 / 60, 5
    );
  }

  /**
   * Change a batch size of updater.
   * Btach size is a number of changes must be happen
   * in debounce interval to force execute debounced
   * function (update a result, in our case)
   *
   * @param  {Number} batchSize
   * @return {CursorObservable}
   */
  batchSize(batchSize) {
    this._handleDataChanges.updateBatchSize(batchSize);
    return this;
  }

  /**
   * Change debounce wait time of the updater
   * @param  {Number} waitTime
   * @return {CursorObservable}
   */
  debounce(waitTime) {
    this._handleDataChanges.updateWait(waitTime);
    return this;
  }

  /**
   * Execute the query and return a Promise, that resolved
   * when all props will be filled with data.
   * If query already executing it just returns a promise
   * for currently executing query.
   * @return {Promise}
   */
  execute() {
    if (!this._execution) {
      this.result = {};
      this.context.withinContext(() => {
        _each(this.fragmentNames, k => {
          this.result[k] = this.containerClass.getFragment(k);
        });
      });

      const updater = () => {
        this._execution = this._handleDataChanges();
      };

      this._stoppers = _map(this.fragmentNames, k =>
        this.result[k].addChangeListener(updater));

      updater();
    }

    return this._execution;
  }

  /**
   * Stops query executing and listening for changes.
   * Returns a promise resolved when query stopped.
   * @return {Promise}
   */
  stop() {
    invariant(
      this._execution,
      'stop(...): query is not executing'
    );

    // Remove all update listeners synchronously to avoid
    // updates of old data
    this.removeAllListeners();

    return this._execution.then(() => {
      _each(this._stoppers, stop => stop());
      this.context.emitCleanup();
      this._execution = null;
    });
  }

  /**
   * Update top level variables of the query by setting
   * values in variable props from given object. If field
   * exists in a given object and not exists in variables map
   * then it will be ignored.
   * @param  {Object} nextProps
   * @return {Promise} resolved when variables updated
   */
  updateVariables(nextProps) {
    invariant(
      this._execution,
      'updateVariables(...): query is not executing'
    );

    return this._execution.then(() => {
      let updated = false;
      _each(nextProps, (prop, k) => {
        if (this.variables[k]) {
          this.variables[k](prop);
          updated = true;
        }
      });
      return updated;
    });
  }

  /**
   * The method is invoked when some of fragment's property is updated.
   * It emits an `update` event only when all `prop.promise` is resolved.
   */
  _handleDataChanges() {
    const nextPromises = _map(this.fragmentNames, k => this.result[k].promise);
    const resultPromise = Promise.all(nextPromises).then(() => {
      if (this._resultPromise === resultPromise) {
        this.emit('update', this.result);
      }
      return this.result;
    }, (error) => {
      this.emit('error', error);
      return this.result;
    });

    this._resultPromise = resultPromise;
    return this._resultPromise;
  }
}
