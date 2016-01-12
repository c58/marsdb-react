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
import TodoListFooter from './TodoListFooter';
import TodoTextInput from './TodoTextInput';
import React from 'react';
import { createContainer } from 'marsdb-react';

class TodoApp extends React.Component {
  _handleTextInputSave = (text) => {
    TodoModel.addTodo(text);
  };

  render() {
    var hasTodos = this.props.totalCount() > 0;
    return (
      <div>
        <section className="todoapp">
          <header className="header">
            <h1>
              todos
            </h1>
            <TodoTextInput
              autoFocus={true}
              className="new-todo"
              onSave={this._handleTextInputSave}
              placeholder="What needs to be done?"
            />
          </header>

          {this.props.children}

          {hasTodos &&
            <TodoListFooter
              totalCount={this.props.totalCount}
              completedCount={this.props.completedCount}
            />
          }
        </section>
        <footer className="info">
          <p>
            Double-click to edit a todo
          </p>
          <p>
            Created by the <a href="https://facebook.github.io/relay/">
              Relay team
            </a>
          </p>
          <p>
            Part of <a href="http://todomvc.com">TodoMVC</a>
          </p>
        </footer>
      </div>
    );
  }
}

export default createContainer(TodoApp, {
  fragments: {
    totalCount: () => TodoListFooter.getFragment('totalCount'),
    completedCount: () => TodoListFooter.getFragment('completedCount'),
  },
});
