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

    });

    it('should accept only properties in variables mapping', function () {

    });

    it('should', function () {

    });
  });

  describe('#trackVariablesChange', function () {

  });

  describe('#trackCursorChange', function () {

  });

});
