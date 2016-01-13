/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only.  Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import 'babel-polyfill';
import 'todomvc-common';
import {IndexRoute, Route, browserHistory} from 'react-router';
import React from 'react';
import ReactDOM from 'react-dom';
import TodoApp from './components/TodoApp';
import TodoList from './components/TodoList';
import MarsRouter from 'marsdb-react-router';


ReactDOM.render(
  <MarsRouter history={browserHistory}>
    <Route path="/" component={TodoApp}>
      <IndexRoute
        component={TodoList}
        prepareParams={() => ({status: 'any'})}
      />
      <Route path=":status" component={TodoList} />
    </Route>
  </MarsRouter>,
  document.getElementById('root')
);
