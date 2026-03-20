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
const LOGS_COLLECTION = 'logs'

function App() {
  const [currentView, setCurrentView] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newTask, setNewTask] = useState('')
  const [filter, setFilter] = useState('all')
  const [dataSource, setDataSource] = useState('none')
  const [logSearch, setLogSearch] = useState('')
  const [logDateFilter, setLogDateFilter] = useState('')

  // Set up real-time Firestore listener for tasks
  useEffect(() => {
    if (currentView !== 'tasks') return
    
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
  }, [currentView])

  // Set up real-time Firestore listener for logs
  useEffect(() => {
    if (currentView !== 'logs') return
    
    try {
      const q = query(collection(db, LOGS_COLLECTION), orderBy('timestamp', 'desc'))
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const fetchedLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setLogs(fetchedLogs)
          setLoading(false)
        },
        (err) => {
          console.error('Firestore logs error:', err)
          setError(err.message)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Logs setup error:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [currentView])

  const addTask = async () => {
    if (!newTask.trim()) return
    
    const taskTitle = newTask.trim()
    setNewTask('')
    
    try {
      // Add the task to Firebase
      const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
        title: taskTitle,
        completed: false,
        priority: 'medium',
        createdAt: Date.now(),
        status: 'pending'
      })
      
      // Execute the task automatically
      executeTask(docRef.id, taskTitle)
      
    } catch (err) {
      console.error('Error adding task:', err)
      setError(err.message)
    }
  }
  
  // Create log entry
  const createLog = async (message, type = 'info', details = '') => {
    try {
      await addDoc(collection(db, LOGS_COLLECTION), {
        message,
        type,
        details,
        timestamp: Date.now(),
        source: 'chat'
      })
    } catch (err) {
      console.error('Error creating log:', err)
    }
  }
  
  // Log chat messages
  const logChat = async (role, content) => {
    try {
      await addDoc(collection(db, LOGS_COLLECTION), {
        message: `[${role}] ${content}`,
        type: 'chat',
        details: `Role: ${role}`,
        timestamp: Date.now(),
        source: 'chat'
      })
    } catch (err) {
      console.error('Error logging chat:', err)
    }
  }
  
  // Log initial chat when app loads
  useEffect(() => {
    logChat('system', 'OpenClaw Command Center initialized')
  }, [])

  // Auto-execute tasks based on keywords
  const executeTask = async (taskId, title) => {
    const lowerTitle = title.toLowerCase()
    
    try {
      // Check if task is about weather
      if (lowerTitle.includes('weather')) {
        // Log task start
        await createLog(`Task started: "${title}"`, 'task', 'Fetching weather data...')
        
        // Extract location (default to Freeport, NY if not specified)
        let location = 'Freeport, NY'
        const match = lowerTitle.match(/weather (?:in |for )?(.+?)(?: and|$)/)
        if (match) location = match[1].trim()
        
        // Fetch weather data
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=40.83&longitude=-73.58&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,pressure_msl&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
        )
        const weatherData = await weatherResponse.json()
        
        // Send to Notion
        const notionPageId = import.meta.env.VITE_NOTION_PAGE_ID
        if (notionPageId) {
          // Create a new page under the parent
          await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_NOTION_API_KEY}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
              parent: { page_id: notionPageId },
              properties: {
                title: { title: [{ text: { content: `Weather - ${location}` } }] }
              }
            })
          })
        }
        
        // Mark task as completed and log
        await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
          completed: true,
          status: 'completed',
          result: `Weather for ${location}: ${weatherData.current.temperature_2m}°C`
        })
        
        await createLog(`Task completed: "${title}"`, 'success', `Weather sent to Notion: ${weatherData.current.temperature_2m}°C`)
      }
      // Check if task is about sending to Notion
      else if (lowerTitle.includes('notion')) {
        const notionPageId = import.meta.env.VITE_NOTION_PAGE_ID
        if (notionPageId) {
          // Extract what to send
          let content = title.replace(/notion/gi, '').replace(/send/gi, '').trim()
          if (!content) content = 'Task update'
          
          await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_NOTION_API_KEY}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
              parent: { page_id: notionPageId },
              properties: {
                title: { title: [{ text: { content: content } }] }
              }
            })
          })
          
          await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
            completed: true,
            status: 'completed',
            result: 'Sent to Notion'
          })
        }
      }
      // Default: mark as pending for manual execution
      else {
        console.log('Task requires manual execution:', title)
      }
    } catch (err) {
      console.error('Error executing task:', err)
      await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
        status: 'error',
        error: err.message
      })
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

  // Menu items for sidebar
  const menuItems = [
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'logs', label: 'Logs', icon: '📜' },
  ]

  // Filter logs by search and date
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !logSearch || 
      (log.message && log.message.toLowerCase().includes(logSearch.toLowerCase()))
    const matchesDate = !logDateFilter || 
      (log.timestamp && new Date(log.timestamp).toISOString().split('T')[0] === logDateFilter)
    return matchesSearch && matchesDate
  })

  const renderContent = () => {
    switch (currentView) {
      case 'tasks':
        return (
          <>
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
          </>
        )
      
      case 'logs':
        return (
          <>
            <section className="log-controls">
              <input
                type="text"
                placeholder="🔍 Search logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="log-search"
              />
              <input
                type="date"
                value={logDateFilter}
                onChange={(e) => setLogDateFilter(e.target.value)}
                className="log-date"
              />
              {(logSearch || logDateFilter) && (
                <button 
                  onClick={() => { setLogSearch(''); setLogDateFilter('') }}
                  className="clear-btn"
                >
                  Clear
                </button>
              )}
            </section>

            <section className="log-list">
              {loading ? (
                <p className="empty-state">Loading logs...</p>
              ) : filteredLogs.length === 0 ? (
                <p className="empty-state">No logs found</p>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="log-item">
                    <div className="log-header">
                      <span className="log-date">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown'}
                      </span>
                      <span className={`log-type ${log.type || 'info'}`}>
                        {log.type || 'info'}
                      </span>
                    </div>
                    <div className="log-message">{log.message}</div>
                    {log.details && <div className="log-details">{log.details}</div>}
                  </div>
                ))
              )}
            </section>
          </>
        )
      
      default:
        return <p className="empty-state">Coming soon...</p>
    }
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>OpenClaw</h2>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="version">v0.2.0</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <h1>🎮 OpenClaw Command Center</h1>
          <p className="subtitle">
            {currentView === 'tasks' ? 'Task Tracker' : 'Dashboard'}
          </p>
        </header>
        <div className="content">
          {renderContent()}
        </div>
      </main>

      <style>{`
        .app-container {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 240px;
          background: #1a1a2e;
          border-right: 1px solid #333;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #333;
        }

        .sidebar-header h2 {
          color: #646cff;
          font-size: 1.25rem;
          margin: 0;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 1rem;
          text-align: left;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: rgba(100, 108, 255, 0.1);
          color: #fff;
        }

        .nav-item.active {
          background: rgba(100, 108, 255, 0.2);
          color: #646cff;
          border-right: 3px solid #646cff;
        }

        .nav-icon {
          font-size: 1.25rem;
        }

        .sidebar-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #333;
        }

        .version {
          color: #666;
          font-size: 0.75rem;
          margin: 0;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          max-width: 800px;
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

        .content {
          display: flex;
          flex-direction: column;
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

        .log-controls {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .log-search {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #333;
          border-radius: 8px;
          background: #1a1a2e;
          color: white;
          font-size: 1rem;
        }

        .log-date {
          padding: 0.75rem;
          border: 1px solid #333;
          border-radius: 8px;
          background: #1a1a2e;
          color: white;
          font-size: 1rem;
        }

        .clear-btn {
          padding: 0.75rem 1rem;
          background: #ff4757;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .log-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .log-item {
          background: #1a1a2e;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #333;
        }

        .log-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .log-date {
          color: #888;
          font-size: 0.875rem;
        }

        .log-type {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .log-type.info {
          background: #646cff;
          color: white;
        }

        .log-type.task {
          background: #ffa502;
          color: black;
        }

        .log-type.success {
          background: #2ed573;
          color: black;
        }

        .log-type.error {
          background: #ff4757;
          color: white;
        }

        .log-message {
          color: white;
          font-size: 1rem;
        }

        .log-details {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #333;
          color: #888;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}

export default App
