import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/todos');
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error('Failed to fetch todos', err);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newTask }),
      });
      const newTodo = await res.json();
      setTodos([newTodo, ...todos]);
      setNewTask('');
    } catch (err) {
      console.error('Failed to add todo', err);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const res = await fetch(`http://localhost:5000/api/todos/${id}`, {
        method: 'PATCH',
      });
      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
    } catch (err) {
      console.error('Failed to toggle', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/todos/${id}`, { method: 'DELETE' });
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  return (
    <div className="app">
      <h1>To-Do List</h1>

      <form onSubmit={addTodo} className="add-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <span 
              onClick={() => toggleTodo(todo.id)}
              style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
            >
              {todo.task}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="delete-btn">×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;