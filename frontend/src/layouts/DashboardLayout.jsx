import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full relative overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Background blobs */}
      <div className="bg-blobs"></div>

      <Sidebar
        className="z-20"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#161b22]/50 border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu size={22} />
            </button>
            <span className="text-white font-semibold">IntelliMeet</span>
          </div>
          <NotificationBell />
        </div>

        {/* Desktop header (optional, if you want a top bar for desktop, currently it seems there isn't one, but we can add a simple header or put it floating) */}
        <div className="hidden md:flex justify-end p-4 absolute top-0 right-0 z-20">
          <NotificationBell />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
