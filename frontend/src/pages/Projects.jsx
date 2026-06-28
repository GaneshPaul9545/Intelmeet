import { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, X, GripVertical, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const TAG_COLORS = {
  'Design': 'bg-blue-500',
  'Marketing': 'bg-purple-500',
  'Content': 'bg-orange-500',
  'Dev': 'bg-emerald-500',
  'General': 'bg-gray-500',
  'Bug': 'bg-red-500',
  'Feature': 'bg-cyan-500'
};

export default function Projects() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToColumn, setAddToColumn] = useState('To Do');
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', tag: 'General', description: '', assignees: [], dueDate: '', priority: 'medium' });
  const toast = useToast();

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTask,
          status: addToColumn,
          color: TAG_COLORS[newTask.tag] || 'bg-blue-500'
        })
      });

      if (res.ok) {
        const created = await res.json();
        setTasks(prev => [created, ...prev]);
        setShowAddModal(false);
        setNewTask({ title: '', tag: 'General', description: '', assignees: [], dueDate: '', priority: 'medium' });
        toast?.success('Task created!');
      }
    } catch (err) {
      toast?.error('Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        toast?.success(`Task moved to ${newStatus}`);
      }
    } catch (err) {
      toast?.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
        toast?.success('Task deleted');
      }
    } catch (err) {
      toast?.error('Failed to delete task');
    }
  };

  const columns = [
    { title: 'To Do', status: 'To Do' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Done', status: 'Done' }
  ];

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    handleUpdateStatus(taskId, status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Task Board
            <span className="text-sm font-medium px-2 py-1 bg-[#161b22] border border-white/5 rounded-md text-gray-400">
              {tasks.length} tasks
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {users.slice(0, 4).map((u, i) => (
              <img
                key={i}
                src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                className="w-8 h-8 rounded-full border-2 border-[#0d1117] bg-gray-800"
                alt={u.name}
                title={u.name}
              />
            ))}
            {users.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-[#0d1117] bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                +{users.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {columns.map((col) => {
          const colTasks = getTasksByStatus(col.status);
          return (
            <div
              key={col.status}
              className="min-w-[300px] w-[300px] bg-[#161b22]/30 rounded-2xl p-4 flex flex-col border border-white/5"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    col.status === 'To Do' ? 'bg-blue-500' :
                    col.status === 'In Progress' ? 'bg-orange-500' :
                    'bg-emerald-500'
                  }`} />
                  {col.title}
                  <span className="text-gray-500 text-xs ml-1">{colTasks.length}</span>
                </h3>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-[200px]">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    className="glass-card p-4 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium text-white ${task.color || TAG_COLORS[task.tag] || 'bg-gray-500'}`}>
                        {task.tag}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Move buttons */}
                        {col.status !== 'To Do' && (
                          <button
                            onClick={() => handleUpdateStatus(task._id, col.status === 'Done' ? 'In Progress' : 'To Do')}
                            className="text-gray-500 hover:text-white p-1 rounded"
                            title="Move left"
                          >
                            ←
                          </button>
                        )}
                        {col.status !== 'Done' && (
                          <button
                            onClick={() => handleUpdateStatus(task._id, col.status === 'To Do' ? 'In Progress' : 'Done')}
                            className="text-gray-500 hover:text-white p-1 rounded"
                            title="Move right"
                          >
                            →
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-white font-medium mb-3">{task.title}</h4>
                    {task.description && (
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mb-3 text-xs">
                      {task.dueDate && (
                        <span className="text-gray-400">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.priority && (
                        <span className={`px-1.5 py-0.5 rounded ${
                          task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          task.priority === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {task.assignees?.length > 0 ? 'Assigned' : 'Unassigned'}
                      </span>
                      <div className="flex -space-x-2">
                        {(task.assignees || []).map((u, idx) => (
                          <img
                            key={idx}
                            src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name || idx}`}
                            className="w-6 h-6 rounded-full border border-[#161b22] bg-gray-700"
                            title={u.name}
                            alt={u.name || 'User'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setAddToColumn(col.status); setShowAddModal(true); }}
                className="mt-3 flex items-center justify-center gap-2 text-gray-500 hover:text-white hover:bg-white/5 py-3 rounded-xl transition-colors border border-dashed border-white/10"
              >
                <Plus size={18} /> Add Task
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add Task — ${addToColumn}`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Title</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Task title..."
              required
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Tag</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(TAG_COLORS).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNewTask({ ...newTask, tag })}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    newTask.tag === tag
                      ? `${TAG_COLORS[tag]} text-white border-transparent`
                      : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Assign to</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {users.map(u => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => {
                    setNewTask(prev => ({
                      ...prev,
                      assignees: prev.assignees.includes(u._id)
                        ? prev.assignees.filter(id => id !== u._id)
                        : [...prev.assignees, u._id]
                    }));
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    newTask.assignees.includes(u._id)
                      ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} className="w-5 h-5 rounded-full" alt="" />
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Due Date</label>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1 block">Priority</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
