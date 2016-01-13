import React from 'react';


/**
 *
 */
export default class DataManagerContainer extends React.Component {
  static defaultProps = {
    renderLoading: () => null,
  };

  constructor(props, context) {
    super(props, context);
    this.state = { result: {} };
    this.query = props.component.getQuery(props.variables);
    this.query.on('update', this._handleDataChanges.bind(this));
    this._executeQuery();
  }

  _executeQuery() {
    this._resolved = false;
    this.query.execute().then((result) => {
      this._resolved = true;
      this.setState({ result });
    });
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

  renderLoading() {
    return this.props.renderLoading();
  }

  render() {
    const Component = this.props.component; // eslint-disable-line
    return this._resolved
      ? <Component {...this.props} {...this.state.result} />
      : this.renderLoading();
  }
}
