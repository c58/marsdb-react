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
import TodoTextInput from './TodoTextInput';
import React from 'react';
import classnames from 'classnames';
import { createContainer } from 'marsdb-react';


class Todo extends React.Component {
  state = {
    isEditing: false,
  };
  _handleCompleteChange = (e) => {
    var complete = e.target.checked;
    TodoModel.changeTodoStatus(complete, this.props.todo());
  };
  _handleDestroyClick = () => {
    this._removeTodo();
  };
  _handleLabelDoubleClick = () => {
    this._setEditMode(true);
  };
  _handleTextInputCancel = () => {
    this._setEditMode(false);
  };
  _handleTextInputDelete = () => {
    this._setEditMode(false);
    this._removeTodo();
  };
  _handleTextInputSave = (text) => {
    this._setEditMode(false);
    TodoModel.renameTodo(text, this.props.todo());
  };
  _setEditMode = (shouldEdit) => {
    this.setState({isEditing: shouldEdit});
  };
  _removeTodo() {
    TodoModel.removeTodo(this.props.todo());
  }
  renderTextInput() {
    return (
      <TodoTextInput
        className="edit"
        commitOnBlur={true}
        initialValue={this.props.todo().text}
        onCancel={this._handleTextInputCancel}
        onDelete={this._handleTextInputDelete}
        onSave={this._handleTextInputSave}
      />
    );
  }
  render() {
    return (
      <li
        className={classnames({
          completed: this.props.todo().complete,
          editing: this.state.isEditing,
        })}>
        <div className="view">
          <input
            checked={this.props.todo().complete}
            className="toggle"
            onChange={this._handleCompleteChange}
            type="checkbox"
          />
          <label onDoubleClick={this._handleLabelDoubleClick}>
            {this.props.todo().text}
          </label>
          <button
            className="destroy"
            onClick={this._handleDestroyClick}
          />
        </div>
        {this.state.isEditing && this.renderTextInput()}
      </li>
    );
  }
}

export default createContainer(Todo, {
  fragments: {
    todo: {}
    // empty fragment is used for two reasons
    // 1. As a placeholder for a future needs
    // 2. For optimal component updating when given
    //    todo is not changed
  },
  versions: {
    // Component will be updated only when todo's
    // `updatedAt` field changed
    todo: (doc) => doc.updatedAt.getTime()
  }
});
