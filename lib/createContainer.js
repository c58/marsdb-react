import _keys from 'fast.js/object/keys';
import _assign from 'fast.js/object/assign';
import React from 'react';
import invariant from 'invariant';
import ExecutionContext from './ExecutionContext';
import QueryExecutor from './QueryExecutor';
import * as utils from './utils';


/**
 * High-order data container creator
 * @param  {Component} Component
 * @param  {Object} options.fragments
 * @param  {Object} options.initVars
 * @return {Component}
 */
export default function createContainer(
  Component,
  {fragments = {}, initialVariables = {}, prepareVariables = null}
) {
  const componentName = Component.displayName || Component.name;
  const containerName = 'Mars(' + componentName + ')';
  const fragmentKeys = _keys(fragments);

  class Container extends React.Component {
    render() {
      const variables = this.props[fragmentKeys[0]]
        .context.getVariables(Container);

      return <Component {...this.props} variables={variables} />;
    }

    static getFragment(name, mapping, initVarsOverride = {}, parentContext) {
      parentContext = parentContext || ExecutionContext.getCurrentContext();
      invariant(
        parentContext,
        'getFragment(...): must be invoked within some context'
      );

      const childContext = parentContext.createChildContext();
      const fragment = fragments[name];
      const initVars = _assign({}, initialVariables, initVarsOverride);
      const vars = childContext.getVariables(Container, initVars, mapping,
        prepareVariables);

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

    static getQuery(initVarsOverride = {}) {
      const initVars = _assign({}, initialVariables, initVarsOverride);
      return new QueryExecutor(fragments, initVars,
        Container, prepareVariables);
    }
  }

  Container.displayName = containerName;
  return Container;
}
