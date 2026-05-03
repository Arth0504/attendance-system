import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminFaculty from './pages/admin/Faculty';
import AdminSessions from './pages/admin/Sessions';
import AdminRequests from './pages/admin/Requests';
import AdminAnalytics from './pages/admin/Analytics';
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyAnalytics from './pages/faculty/Analytics';
import StudentDashboard from './pages/student/Dashboard';
import FaceRegister from './pages/student/FaceRegister';
import MarkAttendance from './pages/student/MarkAttendance';
import AttendanceHistory from './pages/student/History';
import StudentRequests from './pages/student/Requests';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute roles={['admin']}><AdminStudents /></ProtectedRoute>} />
          <Route path="/admin/faculty" element={<ProtectedRoute roles={['admin']}><AdminFaculty /></ProtectedRoute>} />
          <Route path="/admin/sessions" element={<ProtectedRoute roles={['admin']}><AdminSessions /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute roles={['admin']}><AdminRequests /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

          <Route path="/faculty" element={<ProtectedRoute roles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/faculty/sessions" element={<ProtectedRoute roles={['faculty']}><AdminSessions /></ProtectedRoute>} />
          <Route path="/faculty/requests" element={<ProtectedRoute roles={['faculty']}><AdminRequests /></ProtectedRoute>} />
          <Route path="/faculty/analytics" element={<ProtectedRoute roles={['faculty']}><FacultyAnalytics /></ProtectedRoute>} />

          <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/register-face" element={<ProtectedRoute roles={['student']}><FaceRegister /></ProtectedRoute>} />
          <Route path="/student/mark-attendance" element={<ProtectedRoute roles={['student']}><MarkAttendance /></ProtectedRoute>} />
          <Route path="/student/history" element={<ProtectedRoute roles={['student']}><AttendanceHistory /></ProtectedRoute>} />
          <Route path="/student/requests" element={<ProtectedRoute roles={['student']}><StudentRequests /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </AuthProvider>
  );
}
