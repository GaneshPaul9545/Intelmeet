import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import PreJoin from './pages/PreJoin';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MeetingRoom from './pages/MeetingRoom';
import Summary from './pages/Summary';
import Analytics from './pages/Analytics';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/pre-join" element={<PreJoin />} />
                <Route path="/meeting/:id" element={<MeetingRoom />} />

                {/* Dashboard Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/app" element={<DashboardLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="meetings" element={<Dashboard />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="summary" element={<Summary />} />
                    <Route path="summary/:meetingId" element={<Summary />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
