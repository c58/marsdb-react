import { CursorObservable } from 'marsdb';
import Cursor from 'marsdb/dist/Cursor';
import * as utils from '../../lib/utils';
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

  });

  describe('#_getJoinFunction', function () {

  });
});
