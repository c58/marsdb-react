import Collection from 'marsdb';


const TodoModel = new Collection('todos');
export default TodoModel;


TodoModel.addTodo = (text) => {
  TodoModel.insert({
    text: (text || '').trim(),
    complete: false,
  });
};

TodoModel.changeTodoStatus = (status, todo) => {
  TodoModel.update(
    {_id: todo._id},
    {$set: {complete: status}}
  );
};

TodoModel.renameTodo = (text, todo) => {
  TodoModel.update(
    {_id: todo._id},
    {$set: {text: text}}
  );
};

TodoModel.removeTodo = (todo) => {
  TodoModel.remove(todo._id);
};

TodoModel.markAllTodos = (status) => {
  TodoModel.update({},
    {$set: {complete: status}}
  );
};

TodoModel.removeCompletedTodos = () => {
  TodoModel.remove({complete: true});
};
