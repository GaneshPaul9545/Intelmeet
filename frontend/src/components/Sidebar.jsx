import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, BarChart2, Settings, Video, LogOut, Menu, X, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { name: 'Meetings', path: '/app/meetings', icon: Video },
  { name: 'Tasks', path: '/app/projects', icon: CheckSquare },
  { name: 'Summaries', path: '/app/summary', icon: Sparkles },
  { name: 'Analytics', path: '/app/analytics', icon: BarChart2 },
  { name: 'Settings', path: '/app/settings', icon: Settings },
];

export default function Sidebar({ className, isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "w-64 border-r flex flex-col justify-between h-screen p-4 transition-transform duration-300 z-30",
          // Mobile: slide in/out
          "fixed md:relative",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
      >
        <div>
          {/* Logo + Close button on mobile */}
          <div className="flex items-center justify-between mb-10 pl-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                <Sparkles size={16} />
              </div>
              <span className="text-xl font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>IntelliMeet</span>
            </div>
            <button
              onClick={onToggle}
              className="md:hidden text-gray-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/app'}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 768 && onToggle) onToggle();
                  }}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-blue-500/10 text-blue-400 font-medium"
                      : "hover:bg-white/5"
                  )}
                  style={({ isActive }) => !isActive ? { color: 'var(--text-secondary)' } : {}}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <div
            className="p-4 rounded-xl border flex items-center gap-3 transition-all"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-input)' }}
          >
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
              alt="User"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</h4>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email || 'Pro Plan'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
