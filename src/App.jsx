import { useState, useEffect } from 'react'
import { db } from './firebase'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy
} from 'firebase/firestore'

const TASKS_COLLECTION = 'tasks'

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newTask, setNewTask] = useState('')
  const [filter, setFilter] = useState('all')
  const [dataSource, setDataSource] = useState('none')

  // Set up real-time Firestore listener
  useEffect(() => {
    try {
      const q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'))
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const fetchedTasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setTasks(fetchedTasks)
          setDataSource('firebase')
          setLoading(false)
        },
        (err) => {
          console.error('Firestore error:', err)
          setError(err.message)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Setup error:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  const addTask = async () => {
    if (!newTask.trim()) return
    
    try {
      await addDoc(collection(db, TASKS_COLLECTION), {
        title: newTask.trim(),
        completed: false,
        priority: 'medium',
        createdAt: Date.now()
      })
      setNewTask('')
    } catch (err) {
      console.error('Error adding task:', err)
      setError(err.message)
    }
  }

  const toggleTask = async (id, currentStatus) => {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, id)
      await updateDoc(taskRef, {
        completed: !currentStatus
      })
    } catch (err) {
      console.error('Error toggling task:', err)
      setError(err.message)
    }
  }

  const deleteTask = async (id) => {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, id)
      await deleteDoc(taskRef)
    } catch (err) {
      console.error('Error deleting task:', err)
      setError(err.message)
    }
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
          {loading ? (
            <p className="empty-state">Loading tasks...</p>
          ) : error ? (
            <p className="empty-state error">{error}</p>
          ) : filteredTasks.length === 0 ? (
            <p className="empty-state">No tasks found</p>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id, task.completed)}
                  />
                  <span className="checkmark"></span>
                </label>
                <span className="task-title">{task.title}</span>
                <span className={`priority ${task.priority || 'medium'}`}>{task.priority || 'medium'}</span>
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
          <p>🔥 Data Source: {
            loading ? <span className="status pending">Connecting...</span> :
            error ? <span className="status error">{error}</span> :
            <span className="status connected">
              Firebase Realtime ({tasks.length} tasks)
            </span>
          }</p>
          <p className="hint">
            {error ? 'Check Firebase configuration' : 'Changes sync in real-time across all devices'}
          </p>
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

        .empty-state.error {
          color: #ff4757;
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

        .status.connected {
          color: #2ed573;
        }

        .status.error {
          color: #ff4757;
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
