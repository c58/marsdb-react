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
      const containerClass = createContainer(TestComponent, {
        initialVariables: { testVar: 'val' },
        fragments: { test: ({testVar}) => testVar() + 'val' },
      });
      const query = containerClass.getQuery();
      expect(query.result).to.be.undefined;
      const res = query.execute();
      query.result.test().should.be.equal('valval');
      return res.then(() => {
        query.result.test().should.be.equal('valval');
      });
    });

    it('should return the same promise until prev is not resolved', function () {
      const db = new Collection('test');
      return db.insert({a: 1, _id: '1'}).then(() => {
        class TestComponent {}
        const containerClass = createContainer(TestComponent, {
          initialVariables: { testVar: 'val' },
          fragments: { test: ({testVar}) => db.findOne() },
        });
        const query = containerClass.getQuery();
        expect(query.result).to.be.undefined;
        const res = query.execute();
        query.execute().should.be.equal(res);
        expect(query.result.test()).to.be.null;
        return res.then(() => {
          query.result.test().should.be.deep.equal({a: 1, _id: '1'});
          query.execute().should.be.equal(res);
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
          fragments: { test: ({testVar}) => db.findOne() },
        });
        const query = containerClass.getQuery();
        query.on('update', cb);
        expect(query.result).to.be.undefined;
        const res = query.execute();
        expect(query.result.test()).to.be.null;
        cb.should.have.been.callCount(0);
        return res.then(() => {
          cb.should.have.been.callCount(1);
        });
      });
    });
  });

  describe('#stop', function () {

  });

  describe('#updateVariables', function () {

  });

  describe('#_handleDataChanges', function () {

  });

  describe('#_doHandleDataChanges', function () {

  });
});
