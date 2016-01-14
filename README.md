MarsDB-React
=========

[![Build Status](https://travis-ci.org/c58/marsdb-react.svg?branch=master)](https://travis-ci.org/c58/marsdb-react)
[![npm version](https://badge.fury.io/js/marsdb-react.svg)](https://www.npmjs.com/package/marsdb-react)
[![Coverage Status](https://coveralls.io/repos/c58/marsdb-react/badge.svg?branch=master&service=github)](https://coveralls.io/github/c58/marsdb-react?branch=master)
[![Dependency Status](https://david-dm.org/c58/marsdb-react.svg)](https://david-dm.org/c58/marsdb-react)

Declarative data-binding for React based on [MarsDB](https://github.com/c58/marsdb), inspired by [Relay](https://github.com/facebook/relay), [Redux](https://github.com/rackt/redux), [Flux](https://facebook.github.io/flux/) and [Mithril](https://github.com/lhorie/mithril.js/).

* **Declarative:** Never again communicate with your data store using an imperative API. Simply declare your data requirements with flexible MarsDB cursors
* **Colocation:** Queries live next to the views that rely on them, so you can easily reason about your app.
* **Mongo-like queries/mutations:** Work with the data as always, MarsDB takes care of the rest.


## Example

### Basic concepts
MarsDB-React uses Relay-like concept of data reuirements declaration. Just make a component and create a data container below based on the component.

```
import React from 'react';
import ReactDOM from 'react-dom';
import { createContainer, DataManagerContainer } from 'marsdb-react';
import Collection from 'marsdb';

const MessageModel = new Collection('messages');

class HelloWorld extends React.Component {
  handleClickAddMessage = () => {
    MessageModel.insert({ text: this.state.text });
    this.setState({ text: '' });
  };

  handleChangeText = (e) => {
    this.setState({ text: e.target.value });
  };

  handleClickMoreLimit = () => {
    const { limit } = this.props.variables;
    limit(10 + limit());
  };

  render() {
    const { messages, variables } = this.props;
    const { limit } = variables;
    return (
      <div>
        <div>
          <h3>Add a message</h3>
          <input
            placeholder="Message text"
            value={this.state.text}
            onChange={this.handleChangeText}
          />
          <button onClick={this.handleClickAddMessage}>Say "hello"</button>
        </div>
        <div>
          <h3>Messages (with limit: {limit()})</h3>
          <div><button onClick={this.handleClickMoreLimit}>Limit +10</button></div>
          {messages().map(m => (
            <p key={m()._id}>"Hello" with message: {m().text}!</p>
          ))}
        </div>
      </div>
    );
  }
}

HelloWorld = createContainer(HelloWorld, {
  initialVariables: {
    limit: 2
  },
  fragments: {
    messages: ({limit}) => MessageModel.find().limit(limit())
  }
});

ReactDOM.render(document.body, (
  <DataManagerContainer
    component={HelloWorld}
    renderLoading(() => <span>Loading...</span>)
  />
))
```

As you can see, data declaration uses the same fields, that Relay use. But it's plain javascript! There is some things, that should be noticed:

* Variables in fragment function and in a component, data from props in a component – all is a getter-setter property functions. By calling `limit()` it returns current value, by calling `limit(10)` it sets new one and returns 10.
* Each property have a `version` variable, that changed when new value is set. It can be used in `shouldComponentUpdate`
* As we noticed above, each data property is a getter-setter property function. To access a messages list you need to call `messages()` that returns current list of messages. **Each message of the list is also a proprty function!**
* Each change of the model automatically triggers re-rendering of the component with new data. No subsribers, no listeners, no special "mutation" logic. Just insert/update.
* Data container can be rendered by `<DataManagerContainer>` component. It resolves all data requests and show a component only when all data received and ready to show.
* To use MarsDB-React with **React Router** use [MarsDB-React-Router](https://github.com/c58/marsdb-react-router)
* For more complex example, see **TodoMVC**
* **If you have any questions, please ask me by issue**

### TodoMVC
The repository comes with an implementation of [TodoMVC](http://todomvc.com/). To try it out:

```
git clone https://github.com/c58/marsdb-react.git
cd marsdb-react/examples/todomvc && npm install
npm start
```

Then, just point your browser at `http://localhost:3000`.

## Contributing
I’m waiting for your pull requests and issues.
Don’t forget to execute `gulp lint` before requesting. Accepted only requests without errors.

## License
See [License](LICENSE)