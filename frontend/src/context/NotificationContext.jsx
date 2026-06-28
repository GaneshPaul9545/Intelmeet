import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  // Fetch persisted notifications from DB
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  // Connect socket and register user room
  useEffect(() => {
    if (!user) return;

    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      // Join personal notification room
      newSocket.emit('register-user', user._id);
    });

    // Real-time notification pushed from server
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    setSocket(newSocket);
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, deleteNotification, refetch: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

