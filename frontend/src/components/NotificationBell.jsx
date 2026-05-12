import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2, BellOff } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const TYPE_STYLES = {
  task_assigned: { dot: 'bg-blue-500', icon: '📋' },
  task_updated:  { dot: 'bg-orange-500', icon: '✏️' },
  meeting_started: { dot: 'bg-emerald-500', icon: '🎥' },
  mention:       { dot: 'bg-purple-500', icon: '💬' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (notification) => {
    if (!notification.isRead) markRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-xl transition-colors hover:bg-white/10"
        aria-label="Notifications"
        title="Notifications"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-scale-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Notifications {unreadCount > 0 && (
                <span className="ml-1 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <BellOff size={32} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = TYPE_STYLES[n.type] || TYPE_STYLES.mention;
                return (
                  <div
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group border-b"
                    style={{
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(59,130,246,0.05)',
                      borderColor: 'var(--border-subtle)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = n.isRead ? 'transparent' : 'rgba(59,130,246,0.05)'}
                  >
                    {/* Icon dot */}
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${style.dot} ${n.isRead ? 'opacity-30' : ''}`} />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        <span className="mr-1">{style.icon}</span>
                        {n.message}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 transition-all shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
