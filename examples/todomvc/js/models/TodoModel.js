import Collection from './ConfiguredCollection';


const TodoModel = new Collection('todos');
export default TodoModel;

TodoModel.query = {
  completedCount: TodoModel.count({complete: true}),
  totalCount: TodoModel.count(),
}

TodoModel.addTodo = (text) => {
  TodoModel.insert({
    text: (text || '').trim(),
    complete: false,
    updatedAt: new Date(),
  });
};

TodoModel.changeTodoStatus = (status, todo) => {
  TodoModel.update(
    {_id: todo._id},
    {$set: {
      complete: status,
      updatedAt: new Date(),
    }}
  );
};

TodoModel.renameTodo = (text, todo) => {
  TodoModel.update(
    {_id: todo._id},
    {$set: {
      text: text,
      updatedAt: new Date(),
    }}
  );
};

TodoModel.removeTodo = (todo) => {
  TodoModel.remove(todo._id);
};

TodoModel.markAllTodos = (status) => {
  TodoModel.update({},
    {$set: {
      complete: status,
      updatedAt: new Date(),
    }},
    {multi: true}
  );
};

TodoModel.removeCompletedTodos = () => {
  TodoModel.remove({complete: true}, {multi: true});
};
