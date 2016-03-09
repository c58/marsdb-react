import Collection, { CursorObservable } from 'marsdb';
import Cursor from 'marsdb/dist/Cursor';
import * as utils from '../../lib/utils';
import createContainer from '../../lib/createContainer';
import QueryExecutor from '../../lib/QueryExecutor';
import chai, { expect } from 'chai';
import sinon from 'sinon';
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
chai.should();


describe('QueryExecutor', function () {

  describe('#constructor', function () {
    it('should overwrite variables by given initial vars object', function () {
      class TestComponent {}
      const containerClass = createContainer(TestComponent, {
        initialVariables: { testVar: 'val' },
        fragments: { test: ({testVar}) => testVar() + 'val' },
      });
      const query = containerClass.getQuery({ testVar: 'another_val' });
      query.execute();
      query.result.test().should.be.equal('another_valval');
    });

    it('should properly handle null values variables', function () {
      class TestComponent {}
      const containerClass = createContainer(TestComponent, {
        initialVariables: { testVar: 'val' },
        fragments: { test: ({testVar}) => testVar() + 'val' },
      });
      let query = containerClass.getQuery({ testVar: null });
      let res = query.execute();
      query.result.test().should.be.equal('nullval');

      query = containerClass.getQuery({ testVar: undefined });
      res = query.execute();
      query.result.test().should.be.equal('undefinedval');

      query = containerClass.getQuery({ testVar: '' });
      res = query.execute();
      query.result.test().should.be.equal('val');

      query = containerClass.getQuery({ testVar: 0 });
      res = query.execute();
      query.result.test().should.be.equal('0val');
    });
  });

  describe('#execute', function () {
    it('should return a promise that resolved when all data revceived', function () {
      class TestComponent {}
      let resolveVars = null;
      const containerClass = createContainer(TestComponent, {
        initialVariables: { testVar: null },
        fragments: {
          test: ({testVar}) => testVar() + 'val',
          test2: ({testVar}) => testVar() + 'val2',
        },
        prepareVariables: ({testVar}) =>
          (new Promise(r => resolveVars = r)).then(() => {
            testVar('val');
          }),
      });
      const query = containerClass.getQuery();
      expect(query.result).to.be.undefined;
      const res = query.execute();
      expect(query.result.test()).to.be.null;
      resolveVars();
      return res.then(() => {
        query.result.test().should.be.equal('valval');
        query.result.test2().should.be.equal('valval2');
      });
    });

    it('should return the same promise until prev is not resolved', function () {
      const db = new Collection('test');
      return db.insert({a: 1, _id: '1'}).then(() => {
        class TestComponent {}
        const containerClass = createContainer(TestComponent, {
          initialVariables: { testVar: 'val' },
          fragments: { test: ({testVar}) => db.findOne().debounce(0) },
        });
        const query = containerClass.getQuery();
        expect(query.result).to.be.undefined;
        const res = query.execute();
        query.execute().should.be.equal(res);
        expect(query.result.test()).to.be.null;
        return res.then((tmp) => {
          query.result.test().should.be.deep.equal({a: 1, _id: '1'});
        });
      });
    });

    it('should emit an update event when data is ready', function () {
      const db = new Collection('test');
      const cb = sinon.spy();

      return db.insert({a: 1, _id: '1'}).then(() => {
        class TestComponent {}
        const containerClass = createContainer(TestComponent, {
          initialVariables: { testVar: 'val' },
          fragments: { test: ({testVar}) => db.findOne().debounce(0) },
        });
        const query = containerClass.getQuery();
        query.on('update', cb);
        expect(query.result).to.be.undefined;
        const res = query.execute();
        expect(query.result.test()).to.be.null;
        cb.should.have.been.callCount(0);
        return res.then((tmp) => {
          cb.should.have.been.callCount(1);
        });
      });
    });
  });

  describe('#stop', function () {
    it('should rise an exception if not executing', function () {
      const db = new Collection('test');
      const cb = sinon.spy();

      return db.insert({a: 1, _id: '1'}).then(() => {
        class TestComponent {}
        const containerClass = createContainer(TestComponent, {
          initialVariables: { testVar: 'val' },
          fragments: { test: ({testVar}) => db.findOne().debounce(0) },
        });
        const query = containerClass.getQuery();
        (() => query.stop()).should.throw(Error);
      });
    });

    it('should wait untils query is executed', function (done) {
      const db = new Collection('test');
      const cb = sinon.spy();

      return db.insert({a: 1, _id: '1'}).then(() => {
        class TestComponent {}
        const containerClass = createContainer(TestComponent, {
          initialVariables: { testVar: 'val' },
          fragments: { test: ({testVar}) => db.find().debounce(0) },
        });
        const query = containerClass.getQuery();
        query.execute().then(() => {
          query.on('update', cb);
          db.insert({a: 2, _id: '2'}).then(() => {
            setTimeout(() => {
              cb.should.have.callCount(0);
              done()
            }, 30);
          })
        })
        query.stop();
      });
    });

    it('should remove all listeners and cleanup context', function () {
      const db = new Collection('test');
      const cb1 = sinon.spy();
      const cb2 = sinon.spy();

      return db.insert({a: 1, _id: '1'}).then(() => {
        class TestComponent {}
        const containerClass = createContainer(TestComponent, {
          initialVariables: { testVar: 'val' },
          fragments: { test: ({testVar}) => db.find().debounce(0) },
        });
        const query = containerClass.getQuery();
        query.execute();
        query.on('update', cb1);
        query.context.addCleanupListener(cb2);
        return query.stop().then(() => {
          cb1.should.have.callCount(0);
          cb2.should.have.callCount(1);
          query.listeners('update', true).should.be.false;
          query.context.listeners('cleanup', true).should.be.true;
        });
      });
    });
  });

  describe('#updateVariables', function () {
    it('should resolve with true if some variable updated, false otherwise', function () {
      // TODO
    });

    it('should update only eisting variables', function () {
      class TestComponent {}
      const containerClass = createContainer(TestComponent, {
        initialVariables: { testVar: 0 },
        fragments: { test: ({testVar}) => testVar() },
      });
      const query = containerClass.getQuery();
      query.variables.testVar().should.be.equal(0);
      query.debounce(0).batchSize(0);
      query.execute();
      return query.updateVariables({testVar: 1, anotherVar: 2}).then(() => {
        query.variables.testVar().should.be.equal(1);
        expect(query.variables.anotherVar).to.be.undefined;
      })
    });

    it('should rise an exception if not executing', function () {
      const db = new Collection('test');
      const cb = sinon.spy();

      return db.insert({a: 1, _id: '1'}).then(() => {
        class TestComponent {}
        const containerClass = createContainer(TestComponent, {
          initialVariables: { testVar: 'val' },
          fragments: { test: ({testVar}) => db.findOne().debounce(0) },
        });
        const query = containerClass.getQuery();
        (() => query.updateVariables({test: 1})).should.throw(Error);
      });
    });

    it('should wait untils query is executed', function () {
      const db = new Collection('test');
      const cb = sinon.spy();

      return db.insert({a: 1, _id: '1'}).then(() => {
        class TestComponent {}
        const containerClass = createContainer(TestComponent, {
          initialVariables: { testVar: 0 },
          fragments: { test: ({testVar}) => db.findOne({a: {$gt: testVar()}}).debounce(0) },
        });
        const query = containerClass.getQuery();
        query.debounce(0).batchSize(0);
        return Promise.all([
          query.execute().then((res) => {
            res.test().should.be.deep.equal({a: 1, _id: '1'});
          }),
          query.updateVariables({testVar: 1}).then(() => {
            query.variables.testVar().should.be.equal(1);
            return query.execute().then((res) => {
              expect(res.test()).to.be.deep.equal(undefined);
            });
          })
        ]);
      });
    });

    it('should set new values in existing properties', function () {
      class TestComponent {}
      const containerClass = createContainer(TestComponent, {
        initialVariables: { testVar: 0 },
        fragments: { test: ({testVar}) => testVar() },
      });
      const query = containerClass.getQuery();
      query.variables.testVar().should.be.equal(0);
      query.debounce(0).batchSize(0);
      query.execute();
      return query.updateVariables({testVar: 1}).then(() => {
        query.variables.testVar().should.be.equal(1);
        return query.execute().then((res) => {
          expect(res.test()).to.be.deep.equal(1);
        });
      })
    });

    it('should set new value to var only if val changed', function () {
      class TestComponent {}
      const containerClass = createContainer(TestComponent, {
        initialVariables: { testVar: 0, testVarChanged: 1 },
        fragments: { test: ({testVar}) => testVar() },
      });
      const query = containerClass.getQuery();
      const cbSpy_1 = sinon.spy();
      const cbSpy_ch = sinon.spy();
      query.variables.testVar().should.be.equal(0);
      query.variables.testVarChanged().should.be.equal(1);
      query.variables.testVar.addChangeListener(cbSpy_1);
      query.variables.testVarChanged.addChangeListener(cbSpy_ch);
      query.debounce(0).batchSize(0);
      query.execute();
      return query.updateVariables({testVar: 0, testVarChanged: 0}).then(() => {
        query.variables.testVar().should.be.equal(0);
        query.variables.testVarChanged().should.be.equal(0);
        cbSpy_1.should.have.callCount(0);
        cbSpy_ch.should.have.callCount(1);
      })
    });
  });

  describe('#_handleDataChanges', function () {
    it('should be debounced and resolves the result of update', function () {
      class TestComponent {}
      const containerClass = createContainer(TestComponent, {
        initialVariables: { testVar: 0 },
        fragments: { test: ({testVar}) => testVar() },
      });
      const query = containerClass.getQuery();
      query.result = {test: utils._createProperty('test')};
      query._handleDataChanges().then((res) => {
        res.test().should.be.equal('test');
      })
    });

    it('should emit an update event only when all properties ready', function () {
      const db = new Collection('test');
      const cb = sinon.spy();

      return db.insert({a: 1, _id: '1'}).then(() => {
        class TestComponent {}
        const containerClass = createContainer(TestComponent, {
          initialVariables: { testVar: 0 },
          fragments: {
            test_1: ({testVar}) => db.findOne({a: {$gt: testVar()}}).debounce(0),
            test_2: ({testVar}) => db.findOne({a: {$gt: testVar()}}).debounce(0),
          },
        });
        const query = containerClass.getQuery();
        query.debounce(0).batchSize(0);
        query.result = {
          test_1: query.context.withinContext(() => containerClass.getFragment('test_1')),
          test_2: query.context.withinContext(() => containerClass.getFragment('test_2')),
        };
        query.on('update', cb);
        const promise = query._handleDataChanges();
        cb.should.have.callCount(0);
        return promise.then((res) => {
          res.test_1().should.be.deep.equal({a: 1, _id: '1'});
          res.test_2().should.be.deep.equal({a: 1, _id: '1'});
        });
      });
    });
  });
});
