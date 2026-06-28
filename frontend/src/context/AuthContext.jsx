import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/auth/profile');
          setUser(res.data);
        } catch (error) {
          console.error("Error fetching profile", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const data = res.data;

      localStorage.setItem('token', data.token);
      setUser(data.user);
      navigate('/app');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Server error. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password });
      if (res.status === 200 || res.status === 201) {
        return await login(email, password);
      } else {
        return { success: false, message: res.data?.message || 'Registration failed' };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Server error. Please try again.';
      return { success: false, message };
    }
  };

  const googleLogin = async (googleData) => {
    try {
      const res = await api.post('/api/auth/google', googleData);
      const data = res.data;

      localStorage.setItem('token', data.token);
      setUser(data.user);
      navigate('/app');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Google login failed. Please try again.';
      return { success: false, message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Server error. Please try again.';
      return { success: false, message };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const res = await api.post('/api/auth/reset-password', { token, newPassword });
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Server error. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    }
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      googleLogin,
      forgotPassword,
      resetPassword,
      logout,
      loading,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

