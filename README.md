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