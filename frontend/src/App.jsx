import { Routes, Route, Link, useLocation } from 'react-router-dom';
import CreateTaskPage from './pages/CreateTaskPage';
import TaskListPage from './pages/TaskListPage';
import TaskDetailPage from './pages/TaskDetailPage';

export default function App() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-logo">📚 学术论文搜索</Link>
        <nav className="app-nav">
          <Link to="/" className={isActive('/')}>搜索</Link>
          <Link to="/tasks" className={isActive('/tasks')}>任务列表</Link>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<CreateTaskPage />} />
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
