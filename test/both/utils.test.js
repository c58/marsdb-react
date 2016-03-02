import Collection, { CursorObservable } from 'marsdb';
import Cursor from 'marsdb/dist/Cursor';
import * as utils from '../../lib/utils';
import ExecutionContext from '../../lib/ExecutionContext';
import chai, {expect} from 'chai';
import sinon from 'sinon';
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
chai.should();


describe('Utils', function () {
  describe('#noop', function () {
    it('should noooooooooooop', function () {
      expect(utils.noop()).to.be.undefined;
    });
  });

  describe('#_isProperty', function () {
    it('should detect property correctrly', function () {
      utils._isProperty(undefined).should.be.false;
      utils._isProperty(null).should.be.false;
      utils._isProperty({}).should.be.false;
      utils._isProperty(function(){}).should.be.false;

      let property = function(){};
      property.isProperty = true
      utils._isProperty(property).should.be.true;

      property = {};
      property.isProperty = true
      utils._isProperty(property).should.be.false;
    });
  });

  describe('#_isCursor', function () {
    it('should detect cursor correctrly', function () {
      class TestClass {}
      utils._isCursor(null).should.be.false;
      utils._isCursor(undefined).should.be.false;
      utils._isCursor(new TestClass()).should.be.false;
      utils._isCursor(new Cursor()).should.be.false;
      utils._isCursor(new CursorObservable()).should.be.true;
    });
  });

  describe('#_createProperty', function () {
    it('should create new property', function () {
      utils._createProperty('init value')().should.be.equal('init value');
      expect(utils._createProperty(null)()).to.be.null;
      expect(utils._createProperty()()).to.be.undefined;
    });

    it('should update a property', function () {
      const property = utils._createProperty('val');
      property().should.be.equal('val');
      property('val1').should.be.equal('val1');
      property().should.be.equal('val1');
    });

    it('should emit change event on update and stop listening', function () {
      var cb = sinon.spy();
      const property = utils._createProperty('val');
      const stopper = property.addChangeListener(cb);
      property();
      cb.should.have.been.callCount(0);
      property('val1').should.be.equal('val1');
      cb.should.have.been.callCount(1);
      stopper();
      property('val2').should.be.equal('val2');
      cb.should.have.been.callCount(1);
    });

    it('should emit change event', function () {
      var cb = sinon.spy();
      const property = utils._createProperty('val');
      const stopper = property.addChangeListener(cb);
      property();
      cb.should.have.been.callCount(0);
      property.emitChange();
      cb.should.have.been.callCount(1);
    });

    it('should change version on change', function () {
      const property = utils._createProperty('val');
      let versionOld = property.version;
      property();
      property.version.should.be.equal(versionOld);
      property('val1');
      property.version.should.not.be.equal(versionOld);
      versionOld = property.version;
      property.emitChange();
      property.version.should.not.be.equal(versionOld);
    });

    it('should emit change only when one argument passed', function () {
      var cb = sinon.spy();
      const property = utils._createProperty('val');
      const stopper = property.addChangeListener(cb);
      property();
      cb.should.have.been.callCount(0);
      property.emitChange();
      cb.should.have.been.callCount(1);
      property('val1');
      cb.should.have.been.callCount(2);
      property('val1', true);
      cb.should.have.been.callCount(2);
    });

    it('should be able to proxy to another prop', function () {
      var cb = sinon.spy();
      const propA = utils._createProperty('val');
      const toPropB = utils._createProperty('val2');
      const stopper = propA.addChangeListener(cb);
      propA.proxyTo(toPropB);
      propA().should.be.equal('val2');
      toPropB().should.be.equal('val2');
      propA.version.should.be.equal(toPropB.version);
      propA.version++;
      propA.version.should.be.equal(toPropB.version);
      cb.should.have.callCount(0);
      toPropB('val3');
      cb.should.have.callCount(1);
      toPropB().should.be.equal('val3');
      stopper();
      toPropB('val4');
      cb.should.have.callCount(1);
      toPropB().should.be.equal('val4');
    });
  });

  describe('#_createPropertyWithContext', function () {
    it('should create property with context', function () {
      const context = {a: 1};
      const property = utils._createPropertyWithContext('val', context);
      property.context.should.be.equal(context);
      property().should.be.equal('val');
    });
  });

  describe('#_getFragmentValue', function () {
    it('should do nothing if valueGenerator return a property', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {testVar: 123});
      const prop = utils._createProperty('val');
      const valGen = () => prop;
      const res = utils._getFragmentValue(ContainerClass, valGen, vars, context);
      const cb = sinon.spy();
      const stopListen = res.addChangeListener(cb);

      res.should.be.equal(prop);
      vars.testVar();
      cb.should.have.been.callCount(0);
      vars.testVar('next val');
      cb.should.have.been.callCount(0);
      prop('next val');
      cb.should.have.been.callCount(1);
    });

    it('should track variable changes when valueGenerator returns not a cursor', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {testVar: 123});
      let val = 10;
      const valGen = () => val++;
      const res = utils._getFragmentValue(ContainerClass, valGen, vars, context);
      const cb = sinon.spy();
      const stopListen = res.addChangeListener(cb);

      res().should.be.equal(10);
      res().should.be.equal(10);
      vars.testVar();
      cb.should.have.been.callCount(0);
      vars.testVar('next val');
      cb.should.have.been.callCount(1);
      res().should.be.equal(11);
    });

    it('should track variable changes and cursor changes when valueGenerator returns cursor', function () {
      class ContainerClass {}
      const db = new Collection('test');
      return db.insert({a: 1, _id: '1'}).then(() => {
        const context = new ExecutionContext();
        const vars = context.getVariables(ContainerClass, {gtVal: 0});
        const valGen = ({gtVal}) => db.find({a: {$gt: gtVal()}}).debounce(0).batchSize(0);
        const res = utils._getFragmentValue(ContainerClass, valGen, vars, context);
        const cb = sinon.spy();
        const stopListen = res.addChangeListener(cb);

        expect(res()).to.be.null;
        let oldPromise = res.promise;

        return oldPromise.then(() => {
          res().should.have.length(1);
          res()[0]().should.be.deep.equal({a: 1, _id: '1'});
          cb.should.have.been.callCount(1);
          vars.gtVal().should.be.equal(0);
          cb.should.have.been.callCount(1);
          oldPromise.should.be.equal(res.promise);
          vars.gtVal(1).should.be.equal(1);
          cb.should.have.been.callCount(2);
          oldPromise.should.not.be.equal(res.promise);
          res().should.have.length(1);
          res()[0]().should.be.deep.equal({a: 1, _id: '1'});
          oldPromise = res.promise;
          return oldPromise;
        })
        .then(() => {
          cb.should.have.been.callCount(3);
          res().should.have.length(0);
          return Promise.all([
            db.insert({a: 2, _id: '2'}),
            new Promise((resolve, reject) => {
              res.addChangeListener(() => {
                res().should.have.length(1);
                res()[0]().should.be.deep.equal({a: 2, _id: '2'});
                resolve();
              });
            }),
          ]);
        })
      })
    });
    it('should wait until vars is ready', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      let resolveVars = null;
      const vars = context.getVariables(ContainerClass, {testVar: 123}, {}, (vrs) => {
        return new Promise(r => {
          vrs.testVar(321);
          resolveVars = r
        });
      });
      let val = 10;
      const valGen = sinon.spy(() => val++);
      const res = utils._getFragmentValue(ContainerClass, valGen, vars, context);
      const cb = sinon.spy();
      const stopListen = res.addChangeListener(cb);

      expect(res()).to.be.null;
      cb.should.have.callCount(0);
      valGen.should.have.callCount(0);
      resolveVars();
      return res.promise.then(() => {
        vars.testVar().should.be.equal(321);
        res().should.be.equal(10);
        cb.should.have.callCount(1);
        valGen.should.have.callCount(1);
      })
    });
  });

  describe('#_getJoinFunction', function () {
    it('should update when joined prop updated and cleanup on context destroy', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {testVar: 123});
      const prop = utils._createProperty('val');
      const joinObj = { test: () => prop };
      const joinFn = utils._getJoinFunction(ContainerClass, joinObj, vars, context);

      const res = {};
      const cb = sinon.spy();
      const joinRes = joinFn(res, cb);
      utils._isProperty(res.test).should.be.true;
      res.test().should.be.equal('val');

      return Promise.all(joinRes).then(() => {
        prop('val1');
        cb.should.have.been.callCount(1);
        res.test().should.be.equal('val1');

        context.emitCleanup(false);
        prop('val2');
        cb.should.have.been.callCount(1);
        res.test().should.be.equal('val2');
      });
    });

    it('should update a parent observer on variable change', function () {
      class ContainerClass {}
      const db = new Collection('test');
      const system = new Collection('system');
      return Promise.all([
        db.insert({a: 1, _id: '1'}),
        system.insert({field: 'value'}),
      ]).then(() => {
        class ContainerClass {}
        let resolveVars = null;
        const context = new ExecutionContext();
        const vars = context.getVariables(ContainerClass, {gtVal: 100}, {}, ({gtVal}) => {
          gtVal(0);
          return new Promise(r => resolveVars = r);
        });
        const prop = utils._createProperty('val');
        const joinObj = { test: (doc, {gtVal}) => db.find({a: {$gt: gtVal()}}).debounce(0).batchSize(0) };
        const joinFn = utils._getJoinFunction(ContainerClass, joinObj, vars, context);

        return new Promise((resolve, reject) => {
          let calls = 0;
          system.findOne().join(joinFn).debounce(0).observe((doc) => {
            if (calls === 0) {
              calls++;
              utils._isProperty(doc.test).should.be.true;
              doc.test().should.have.length(1);
              vars.gtVal(1);
            } else {
              utils._isProperty(doc.test).should.be.true;
              doc.test().should.have.length(0);
              resolve();
            }
          });
          setTimeout(() => {
            calls.should.be.equal(0);
            resolveVars();
          }, 50);
        });
      })
    });

    it('should update parent observer once when joined cursor changed', function () {
      class ContainerClass {}
      const db = new Collection('test');
      const system = new Collection('system');
      return Promise.all([
        db.insert({a: 1, _id: '1'}),
        system.insert({field: 'value'}),
      ]).then(() => {
        class ContainerClass {}
        const context = new ExecutionContext();
        const vars = context.getVariables(ContainerClass, {gtVal: 0});
        const prop = utils._createProperty('val');
        const joinObj = { test: (doc, {gtVal}) => db.find({a: {$gt: gtVal()}}).debounce(0) };
        const joinFn = utils._getJoinFunction(ContainerClass, joinObj, vars, context);

        return new Promise((resolve, reject) => {
          let calls = 0;
          system.findOne().join(joinFn).debounce(0).batchSize(0).observe((doc) => {
            if (calls === 0) {
              calls++;
              utils._isProperty(doc.test).should.be.true;
              doc.test().should.have.length(1);
              db.insert({a: 2, _id: '2'});
            } else if (calls === 1) {
              utils._isProperty(doc.test).should.be.true;
              doc.test().should.have.length(2);
              setTimeout(resolve, 50);
            } else {
              reject();
            }
          });
        });
      })
    });

    it('should ignore non-object documents', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {gtVal: 0});
      const prop = utils._createProperty('val');
      const joinObj = { test: (doc, {gtVal}) => db.find({a: {$gt: gtVal()}}).debounce(0) };
      const joinFn = utils._getJoinFunction(ContainerClass, joinObj, vars, context);

      expect(joinFn(undefined)).to.be.undefined;
      expect(joinFn(null)).to.be.undefined;
      expect(joinFn('something')).to.be.undefined;
      expect(joinFn(10)).to.be.undefined;
    });

    it('should join only non-existing fields in a doc', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {gtVal: 0});
      const prop = utils._createProperty('val');
      const joinObj = { test: () => 2 };
      const joinFn = utils._getJoinFunction(ContainerClass, joinObj, vars, context);

      let doc = {test: 3};
      joinFn(doc);
      doc.should.be.deep.equal({test: 3});

      doc = {test1: 0};
      joinFn(doc);
      doc.test().should.be.deep.equal(2);

      doc = {test: null};
      joinFn(doc);
      doc.should.be.deep.equal({test: null});

      doc = {test: 0};
      joinFn(doc);
      doc.should.be.deep.equal({test: 0});

      doc = {test: undefined};
      joinFn(doc);
      doc.test().should.be.deep.equal(2);
    });

    it('should use noop updater function if not provided to joinFn', function () {
      class ContainerClass {}
      const context = new ExecutionContext();
      const vars = context.getVariables(ContainerClass, {gtVal: 0});
      const prop = utils._createProperty('val');
      const joinObj = { test: () => 2 };
      const joinFn = utils._getJoinFunction(ContainerClass, joinObj, vars, context);
      joinFn({});
      vars.gtVal(1);
    });
  });

});
