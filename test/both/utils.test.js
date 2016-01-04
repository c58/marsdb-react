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
          cb.should.have.been.callCount(1);
          oldPromise.should.not.be.equal(res.promise);
          res().should.have.length(1);
          res()[0]().should.be.deep.equal({a: 1, _id: '1'});
          oldPromise = res.promise;
          return oldPromise;
        })
        .then(() => {
          cb.should.have.been.callCount(2);
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
        const context = new ExecutionContext();
        const vars = context.getVariables(ContainerClass, {gtVal: 0});
        const prop = utils._createProperty('val');
        const joinObj = { test: (doc, {gtVal}) => db.find({a: {$gt: gtVal()}}).debounce(0).batchSize(0) };
        const joinFn = utils._getJoinFunction(ContainerClass, joinObj, vars, context);

        return new Promise((resolve, reject) => {
          let calls = 0;
          system.findOne().join(joinFn).debounce(0).batchSize(0).observe((doc) => {
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
        const joinObj = { test: (doc, {gtVal}) => db.find({a: {$gt: gtVal()}}).debounce(0).batchSize(0) };
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
              setTimeout(resolve, 100);
            } else {
              reject();
            }
          });
        });
      })
    });

  });
});
