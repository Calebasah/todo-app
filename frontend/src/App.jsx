import { useState, useEffect } from 'react'

function App() {
  const [todos, setTodos] = useState([])
  const [task, setTask] = useState('')

  useEffect(() => {
    fetch('http://localhost:5000/api/todos')
      .then(r => r.json())
      .then(setTodos)
      .catch(console.error)
  }, [])

  const addTodo = () => {
    fetch('http://localhost:5000/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task })
    })
      .then(r => r.json())
      .then(newTodo => setTodos([newTodo, ...todos]))
      .then(() => setTask(''))
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Todo App</h1>
      <input
        value={task}
        onChange={e => setTask(e.target.value)}
        placeholder="New task..."
        style={{ width: '70%', padding: '8px' }}
      />
      <button onClick={addTodo} style={{ padding: '8px 16px' }}>Add</button>

      <ul>
        {todos.map(t => (
          <li key={t.id}>{t.task}</li>
        ))}
      </ul>
    </div>
  )
}

export default App