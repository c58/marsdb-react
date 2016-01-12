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

import TodoModel from '../models/TodoModel';
import {IndexLink, Link} from 'react-router';
import React from 'react';
import { createContainer } from 'marsdb-react';


class TodoListFooter extends React.Component {
  _handleRemoveCompletedTodosClick = () => {
    TodoModel.removeCompletedTodos();
  };

  render() {
    var numCompletedTodos = this.props.completedCount();
    var numRemainingTodos = this.props.totalCount() - numCompletedTodos;
    return (
      <footer className="footer">
        <span className="todo-count">
          <strong>{numRemainingTodos}</strong> item{numRemainingTodos === 1 ? '' : 's'} left
        </span>
        <ul className="filters">
          <li>
            <IndexLink to="/" activeClassName="selected">All</IndexLink>
          </li>
          <li>
            <Link to="/active" activeClassName="selected">Active</Link>
          </li>
          <li>
            <Link to="/completed" activeClassName="selected">Completed</Link>
          </li>
        </ul>
        {numCompletedTodos > 0 &&
          <button
            className="clear-completed"
            onClick={this._handleRemoveCompletedTodosClick}>
            Clear completed
          </button>
        }
      </footer>
    );
  }
}

export default createContainer(TodoListFooter, {
  fragments: {
    completedCount: () => TodoModel.count({complete: true}),
    totalCount: () => TodoModel.count(),
  },
});
