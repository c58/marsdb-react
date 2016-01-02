import _map from 'fast.js/map';
import _each from 'fast.js/forEach';
import _keys from 'fast.js/object/keys';
import _assign from 'fast.js/object/assign';
import React from 'react';
import invariant from 'invariant';
import ExecutionContext from './ExecutionContext';
import QueryExecutor from './QueryExecutor';
import utils from './utils';


/**
 * High-order container creator
 * @param  {Component} Component
 * @param  {Object} options.fragments
 * @param  {Object} options.initVars
 * @return {Component}
 */
export function createContainer(Component, {fragments, initialVariables, versions}) {
  invariant(
    typeof fragments === 'object' && _keys(fragments).length > 0,
    'createContainer(...): fragments must be non-empty object'
  );

  const fragmentKeys = _keys(fragments);
  const getPropsHash = (props) => {
    let hash = '';
    _each(fragmentKeys, (k) => {
      if (versions && versions[k] && props[k]) {
        hash += versions[k](props[k]());
      } else {
        hash += props[k] && props[k].version;
      }
    });
    return hash;
  };

  class Container extends React.Component {
    constructor(props, context) {
      super(props, context);
      this.prevHash = getPropsHash(props);
    }

    shouldComponentUpdate(nextProps) {
      const nextHash = getPropsHash(nextProps);
      let shouldUpdate = nextHash !== this.prevHash;
      this.prevHash = nextHash;
      return shouldUpdate;
    }

    render() {
      const variables = this.props[fragmentKeys[0]]
        .context.variables.get(Container);
      return (
        <Component {...this.props} variables={variables} />
      );
    }

    static getFragment(name, mapping, initVarsOverride = {}, parentContext) {
      parentContext = parentContext || ExecutionContext.getCurrentContext();
      invariant(
        parentContext,
        'getFragment(...): must be invoked within some context'
      )

      const childContext = parentContext.createChildContext();
      const fragment = fragments[name];
      const initVars = _assign({}, initialVariables, initVarsOverride);
      const vars = childContext.getVariables(Container, initVars, mapping);

      invariant(
        typeof fragment === 'function' ||
        typeof fragment === 'object',
        'getFragment(...): a fragment must be a function or an object'
      );

      if (typeof fragment === 'object') {
        return utils._getJoinFunction(Container, fragment, vars, childContext);
      } else {
        return utils._getFragmentValue(Container, fragment, vars, childContext);
      }
    }

    static getQuery(initVarsOverride) {
      return new QueryExecutor(fragments, initVarsOverride, Container);
    }
  }

  return Container;
}
