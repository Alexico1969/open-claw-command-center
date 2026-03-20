import { useState } from 'react'

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Welcome to OpenClaw Command Center', completed: false, priority: 'high' },
    { id: 2, title: 'Set up Google Sheets integration', completed: false, priority: 'medium' },
    { id: 3, title: 'Deploy to Netlify', completed: false, priority: 'high' },
  ])
  const [newTask, setNewTask] = useState('')
  const [filter, setFilter] = useState('all')

  const addTask = () => {
    if (!newTask.trim()) return
    const task = {
      id: Date.now(),
      title: newTask,
      completed: false,
      priority: 'medium'
    }
    setTasks([...tasks, task])
    setNewTask('')
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎮 OpenClaw Command Center</h1>
        <p className="subtitle">Task Tracker</p>
      </header>

      <main className="main">
        <section className="stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Done</span>
          </div>
        </section>

        <section className="add-task">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a new task..."
            className="task-input"
          />
          <button onClick={addTask} className="add-btn">Add Task</button>
        </section>

        <section className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </section>

        <section className="task-list">
          {filteredTasks.length === 0 ? (
            <p className="empty-state">No tasks found</p>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className="checkmark"></span>
                </label>
                <span className="task-title">{task.title}</span>
                <span className={`priority ${task.priority}`}>{task.priority}</span>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="delete-btn"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </section>

        <section className="connection-status">
          <p>📊 Google Sheets: <span className="status pending">Setup Required</span></p>
          <p className="hint">Configure your Google Sheets API key to enable data sync</p>
        </section>
      </main>

      <style>{`
        .app {
          min-height: 100vh;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #646cff 0%, #9356fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: #888;
          font-size: 1rem;
        }

        .stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          flex: 1;
          background: #1a1a2e;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          border: 1px solid #333;
        }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: bold;
          color: #646cff;
        }

        .stat-label {
          color: #888;
          font-size: 0.875rem;
        }

        .add-task {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .task-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #333;
          border-radius: 8px;
          background: #1a1a2e;
          color: white;
          font-size: 1rem;
        }

        .task-input:focus {
          outline: none;
          border-color: #646cff;
        }

        .add-btn {
          background: #646cff;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .add-btn:hover {
          background: #535bf2;
        }

        .filters {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .filter-btn {
          background: transparent;
          border: 1px solid #333;
          color: #888;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
        }

        .filter-btn.active {
          background: #646cff;
          border-color: #646cff;
          color: white;
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #1a1a2e;
          border-radius: 8px;
          border: 1px solid #333;
        }

        .task-item.completed {
          opacity: 0.6;
        }

        .task-item.completed .task-title {
          text-decoration: line-through;
        }

        .checkbox-wrapper input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .task-title {
          flex: 1;
          font-size: 1rem;
        }

        .priority {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .priority.high {
          background: #ff4757;
          color: white;
        }

        .priority.medium {
          background: #ffa502;
          color: black;
        }

        .priority.low {
          background: #2ed573;
          color: black;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: #ff4757;
          cursor: pointer;
          padding: 0.5rem;
          font-size: 1rem;
        }

        .delete-btn:hover {
          color: #ff6b81;
        }

        .empty-state {
          text-align: center;
          color: #888;
          padding: 2rem;
        }

        .connection-status {
          text-align: center;
          padding: 1rem;
          background: #1a1a2e;
          border-radius: 8px;
          border: 1px solid #333;
        }

        .status.pending {
          color: #ffa502;
        }

        .hint {
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  )
}

export default App
