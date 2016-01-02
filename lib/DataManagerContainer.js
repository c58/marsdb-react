import React from 'react';


/**
 *
 */
export class DataManagerContainer extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = { result: {} };
    this.query = props.component.getQuery(props.variables);
    this.query.on('update', this._handleDataChanges.bind(this));
    this._executeQuery();
  }

  _executeQuery() {
    this._resolved = false;
    this.query.execute().then(() => {
      this._resolved = true;
    })
  }

  _handleDataChanges(result) {
    if (this._resolved) {
      this.setState({ result });
    }
  }

  componentWillUnmount() {
    this.query.stop();
  }

  componentWillReceiveProps(nextProps) {
    this.query.updateVariables(nextProps);
  }

  render() {
    const Component = this.props.component;
    return this._resolved
      ? <Component {...this.state.result} />
      : null;
  }
}
