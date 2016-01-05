import Collection, { CursorObservable } from 'marsdb';
import Cursor from 'marsdb/dist/Cursor';
import * as utils from '../../lib/utils';
import ExecutionContext from '../../lib/ExecutionContext';
import chai, {expect} from 'chai';
import sinon from 'sinon';
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
chai.should();


describe('ExecutionContext', function () {

  describe('#addCleanupListener', function () {
    it('should create a listener', function () {
      const context = new ExecutionContext();
      const cb = sinon.spy();
      context.addCleanupListener(cb);
      cb.should.have.been.callCount(0);
      context.emitCleanup();
      cb.should.have.been.callCount(1);
    });

    it('should stop listening by calling returned stopper', function () {
      const context = new ExecutionContext();
      const cb = sinon.spy();
      const stop = context.addCleanupListener(cb);
      cb.should.have.been.callCount(0);
      context.emitCleanup();
      cb.should.have.been.callCount(1);
      stop();
      context.emitCleanup();
      cb.should.have.been.callCount(1);
    });
  });

  describe('#emitCleanup', function () {
    it('should emit event with isRoot argument', function () {
      const context = new ExecutionContext();
      const cb = sinon.spy();

      let stop = context.addCleanupListener((isRoot) => {
        isRoot.should.be.true;
        cb();
      });
      context.emitCleanup();
      cb.should.have.been.callCount(1);
      stop();

      stop = context.addCleanupListener((isRoot) => {
        isRoot.should.be.false;
        cb();
      });
      context.emitCleanup(false);
      cb.should.have.been.callCount(2);
      stop();
    });
  });

  describe('#createChildContext', function () {
    it('should create new context with save variables map', function () {
      const context = new ExecutionContext();
      const child = context.createChildContext();
      context.variables.should.be.equal(child.variables);
    });

    it('should propagate cleanup event to child context', function () {
      const context = new ExecutionContext();
      const child = context.createChildContext();
      const cb = sinon.spy();

      child.addCleanupListener((isRoot) => {
        isRoot.should.be.false;
        cb();
      });
      context.emitCleanup();
      cb.should.have.been.callCount(1);
      context.emitCleanup();
      cb.should.have.been.callCount(2);
      context.emitCleanup(false);
      cb.should.have.been.callCount(3);
      context.emitCleanup(false);
      cb.should.have.been.callCount(3);
      context.emitCleanup();
      cb.should.have.been.callCount(3);
    });

    it('should propagate cleanup to child of the child', function () {
      const context = new ExecutionContext();
      const child = context.createChildContext();
      const child2 = child.createChildContext();
      const cb = sinon.spy();

      child.addCleanupListener((isRoot) => {
        isRoot.should.be.false;
        cb();
      });
      child2.addCleanupListener((isRoot) => {
        isRoot.should.be.false;
        cb();
      });
      context.emitCleanup();
      cb.should.have.been.callCount(2);
      context.emitCleanup();
      cb.should.have.been.callCount(3);
      context.emitCleanup();
      cb.should.have.been.callCount(4);
      context.emitCleanup(false);
      cb.should.have.been.callCount(5);
      context.emitCleanup(false);
      cb.should.have.been.callCount(5);
      context.emitCleanup();
      cb.should.have.been.callCount(5);
    });
  });

  describe('#withinContext', function () {
    it('should set current context globally', function () {
      const context = new ExecutionContext();
      const cb = sinon.spy();

      expect(ExecutionContext.getCurrentContext()).to.be.undefined;
      context.withinContext(() => {
        ExecutionContext.getCurrentContext().should.be.equal(context);
        cb();
      });
      cb.should.have.been.callCount(1);
      expect(ExecutionContext.getCurrentContext()).to.be.undefined;
    });

    it('should save and restore previous active context', function () {
      const context = new ExecutionContext();
      const cb = sinon.spy();

      expect(ExecutionContext.getCurrentContext()).to.be.undefined;
      context.withinContext(() => {
        ExecutionContext.getCurrentContext().should.be.equal(context);
        cb();

        const child = context.createChildContext();
        child.withinContext(() => {
          ExecutionContext.getCurrentContext().should.be.equal(child);
          cb();
        });

        cb.should.have.been.callCount(2);
        ExecutionContext.getCurrentContext().should.be.equal(context);
      });

      cb.should.have.been.callCount(2);
      expect(ExecutionContext.getCurrentContext()).to.be.undefined;
    });
  });

  describe('#getVariables', function () {
    it('should initiate variables in context for non-existing class', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      expect(context.variables.get(ContainerClass)).to.be.undefined;
      const vars = context.getVariables(ContainerClass);
      expect(context.variables.get(ContainerClass)).to.be.equal(vars);
    });

    it('should accept only properties in variables mapping', function () {
      class ContainerClass {}
      const context = new ExecutionContext();

      (function() {
        context.getVariables(ContainerClass, {test: 1}, {test: 2});
      }).should.throw(Error);

      const prop = utils._createProperty('val');
      const res = context.getVariables(ContainerClass, {test: 1}, {test: prop});
      res.test.should.be.equal(prop);
      res.test().should.be.equal('val');
    });

    it('should set mapping value in non-existing variable field', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const prop1 = utils._createProperty('val1');
      const prop2 = utils._createProperty('val2');

      context.getVariables(ContainerClass, {test: 1}, {test: prop1});
      let res = context.getVariables(ContainerClass, {test: 1}, {test: prop2});
      res.test.should.be.equal(prop1);

      res = context.getVariables(ContainerClass, {test: 1, test2: 2}, {test2: prop2});
      res.test.should.be.equal(prop1);
      res.test2.should.be.equal(prop2);
    });

    it('should create property with initial value if no mapping provided', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const prop1 = utils._createProperty('val1');

      let res = context.getVariables(ContainerClass, {test: 1, test2: 2}, {test: prop1});
      res.test.should.be.equal(prop1);
      res.test2().should.be.equal(2);
    });
  });

  describe('#trackVariablesChange', function () {
    it('should regenerate value on variable change', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {test: 1});
      const prop = utils._createProperty('val1');
      const valGen = () => 2;

      context.trackVariablesChange(prop, vars, valGen);
      prop().should.be.equal('val1');
      vars.test(2);
      prop().should.be.equal(2);
    });

    it('should stop previous observer and create new one on variable change', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {test: 0});
      const prop = utils._createProperty('val1');
      const db = new Collection('test');
      const system = new Collection('system');
      const valGen = ({test}) => db.find({a: {$gt: test()}}).debounce(0);
      const cb = sinon.spy();

      return Promise.all([
        db.insert({a: 1, _id: '1'}),
        system.insert({field: 'value'}),
      ]).then(() => {
        context.trackCursorChange(prop, valGen(vars));
        return prop.promise;
      }).then(() => {
        context.trackVariablesChange(prop, vars, valGen);
        prop().should.have.length(1);
        utils._isProperty(prop()[0]).should.be.true;
        prop.promise.stop = cb;
        vars.test(1);
        // TODO make it to be called once
        cb.should.have.been.callCount(2);
        return prop.promise;
      }).then(() => {
        prop().should.have.length(0);
      });
    });

    it('should stop variables tracking on context cleanup', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {test: 1});
      const prop = utils._createProperty('val1');
      const valGen = () => 2;

      context.trackVariablesChange(prop, vars, valGen);
      prop().should.be.equal('val1');
      vars.test(2);
      prop().should.be.equal(2);

      context.emitCleanup();
      prop(0);
      vars.test(2);
      prop().should.be.equal(2);

      context.emitCleanup(false);
      prop(0);
      vars.test(2);
      prop().should.be.equal(0);
    });

    it('should rise an exception if generated value is a property', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {test: 1});
      const prop = utils._createProperty('val1');
      const valGen = () => prop;

      context.trackVariablesChange(prop, vars, valGen);
      prop().should.be.equal('val1');
      (() => vars.test(2)).should.throw(Error);
    });
  });

  describe('#trackCursorChange', function () {
    it('should add an observer to a cursor and set property when done', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {test: 0});
      const prop = utils._createProperty('val1');
      const db = new Collection('test');
      const system = new Collection('system');
      const valGen = ({test}) => db.find({a: {$gt: test()}}).debounce(0);
      const cb = sinon.spy();

      return Promise.all([
        db.insert({a: 1, _id: '1'}),
        system.insert({field: 'value'}),
      ]).then(() => {
        context.trackCursorChange(prop, valGen(vars));
        return prop.promise;
      }).then(() => {
        prop().should.have.length(1);
        utils._isProperty(prop()[0]).should.be.true;
        prop()[0]().should.be.deep.equal({a: 1, _id: '1'});
      })
    });

    it('should wrap all items in array with property', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {test: 0});
      const prop = utils._createProperty('val1');
      const db = new Collection('test');
      const system = new Collection('system');
      const valGen = ({test}) => db.find({a: {$gt: test()}}).debounce(0);
      const valGenOne = ({test}) => db.findOne({a: {$gt: test()}}).debounce(0);
      const cb = sinon.spy();

      return Promise.all([
        db.insert({a: 1, _id: '1'}),
        db.insert({a: 2, _id: '2'}),
        db.insert({a: 3, _id: '3'}),
        system.insert({field: 'value'}),
      ]).then(() => {
        context.trackCursorChange(prop, valGen(vars));
        return prop.promise;
      }).then(() => {
        prop().should.have.length(3);
        utils._isProperty(prop()[0]).should.be.true;
        utils._isProperty(prop()[1]).should.be.true;
        utils._isProperty(prop()[2]).should.be.true;
        prop()[0]().should.be.deep.equal({a: 1, _id: '1'});
        prop()[1]().should.be.deep.equal({a: 2, _id: '2'});
        prop()[2]().should.be.deep.equal({a: 3, _id: '3'});

        context.trackCursorChange(prop, valGenOne(vars));
        return prop.promise;
      }).then(() => {
        prop().should.be.deep.equal({a: 1, _id: '1'});
      })
    });

    it('should update property when cursor updated', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {test: 0});
      const prop = utils._createProperty('val1');
      const db = new Collection('test');
      const system = new Collection('system');
      const valGen = ({test}) => db.find({a: {$gt: test()}}).debounce(0);
      const cb = sinon.spy();

      return Promise.all([
        db.insert({a: 1, _id: '1'}),
        system.insert({field: 'value'}),
      ]).then(() => {
        context.trackCursorChange(prop, valGen(vars));
        return prop.promise;
      }).then(() => {
        prop().should.have.length(1);
        return db.insert({a: 2, _id: '2'});
      }).then(() => {
        return new Promise((resolve, reject) => {
          prop.addChangeListener(() => {
            prop().should.have.length(2);
            resolve();
          })
        });
      });
    });

    it('should remove observer when context destroyed', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {test: 0});
      const prop = utils._createProperty('val1');
      const db = new Collection('test');
      const system = new Collection('system');
      const valGen = ({test}) => db.find({a: {$gt: test()}}).debounce(0);
      const cb = sinon.spy();

      return Promise.all([
        db.insert({a: 1, _id: '1'}),
        system.insert({field: 'value'}),
      ]).then(() => {
        context.trackCursorChange(prop, valGen(vars));
        return prop.promise;
      }).then(() => {
        prop().should.have.length(1);
        context.emitCleanup();
        return db.insert({a: 2, _id: '2'});
      }).then(() => {
        return new Promise((resolve, reject) => {
          prop.addChangeListener(() => {
            prop().should.have.length(2);
            resolve();
          })
        });
      }).then(() => {
        context.emitCleanup(false);
        return db.insert({a: 3, _id: '3'});
      }).then(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            prop().should.have.length(2);
            resolve();
          }, 100);
        });
      });
    });

    it('should remove previous cursor observer of the property', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {test: 0});
      const prop = utils._createProperty('val1');
      const db = new Collection('test');
      const system = new Collection('system');
      const valGen = ({test}) => db.find({a: {$gt: test()}}).debounce(0);
      const cb = sinon.spy();

      context.trackCursorChange(prop, valGen(vars));
      const promise = prop.promise;
      promise.stop = cb;
      context.trackCursorChange(prop, valGen(vars));
      cb.should.have.been.callCount(1);
      promise.should.be.not.equal(prop.promise);
    });
  });

});
