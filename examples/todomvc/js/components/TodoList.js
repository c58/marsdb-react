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
import Todo from './Todo';
import React from 'react';
import { createContainer } from 'marsdb-react';


class TodoList extends React.Component {
  _handleMarkAllChange = (e) => {
    var complete = e.target.checked;
    TodoModel.markAllTodos(complete);
  }

  renderTodos() {
    return this.props.todos().map(todo =>
      <Todo key={todo().id} todo={todo} />
    );
  }

  render() {
    var numTodos = this.props.totalCount();
    var numCompletedTodos = this.props.completedCount();
    return (
      <section className="main">
        <input
          checked={numTodos === numCompletedTodos}
          className="toggle-all"
          onChange={this._handleMarkAllChange}
          type="checkbox"
        />
        <label htmlFor="toggle-all">
          Mark all as complete
        </label>
        <ul className="todo-list">
          {this.renderTodos()}
        </ul>
      </section>
    );
  }
}

export default createContainer(TodoList, {
  initialVariables: {
    status: null,
  },

  prepareVariables({status}) {
    var nextStatus;
    if (status === 'active' || status === 'completed') {
      nextStatus = status;
    } else {
      // This matches the Backbone example, which displays all todos on an
      // invalid route.
      nextStatus = 'any';
    }
    return {
      status: nextStatus,
      limit: Number.MAX_SAFE_INTEGER || 9007199254740991,
    };
  },

  fragments: {
    totalCount: () => TodoModel.count(),
    completedCount: () => TodoModel.count({complete: true}),
    todos: ({limit, status}) =>
      TodoModel.find({status: status()}).limit(limit())
        .join(Todo.getFragment('todo'))
  },
});
