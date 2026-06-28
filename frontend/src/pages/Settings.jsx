import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { isDark, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const res = await api.put('/api/users/profile', { name, email });
      updateUser?.({ name: res.data.name, email: res.data.email });
      toast?.success('Profile updated successfully!');
    } catch (error) {
      toast?.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);

    if (newPassword.length < 6) {
      toast?.error('Password must be at least 6 characters');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast?.error('Passwords do not match');
      setPasswordLoading(false);
      return;
    }

    try {
      await api.put('/api/users/password', { currentPassword, newPassword });
      toast?.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast?.error(error.response?.data?.message || 'Error changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setPrefsLoading(true);

    try {
      await api.put('/api/users/preferences', { preferences: { darkMode: isDark } });
      toast?.success('Preferences updated!');
    } catch (error) {
      toast?.error(error.response?.data?.message || 'Error updating preferences');
    } finally {
      setPrefsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-6 md:p-8">
        <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Profile Settings</h2>
        <form className="space-y-5" onSubmit={handleProfileSubmit}>
          <div className="flex items-center gap-4 mb-4">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
              alt="Avatar"
              className="w-16 h-16 rounded-full border-2 border-white/10"
            />
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {profileLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="glass-card p-6 md:p-8">
        <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
        <form className="space-y-5" onSubmit={handlePasswordSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {passwordLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* Preferences */}
      <div className="glass-card p-6 md:p-8">
        <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>App Settings</h2>
        <form onSubmit={handlePreferencesSubmit}>
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Dark Mode</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{isDark ? 'Dark mode is on' : 'Light mode is on'}. Click to switch.</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                isDark ? 'bg-blue-600' : 'bg-gray-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${
                  isDark ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={prefsLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {prefsLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
