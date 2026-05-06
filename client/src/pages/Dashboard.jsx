import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AdminDashboard from './dashboards/AdminDashboard';
import FacultyDashboard from './dashboards/FacultyDashboard';
import StudentDashboard from './dashboards/StudentDashboard';

const TAB_LABELS = {
  dashboard:  'Dashboard',
  users:      'All Users',
  faculty:    'Add Faculty',
  csv:        'Upload CSV',
  sessions:   'Sessions',
  attendance: 'Attendance',
  create:     'New Session',
  records:    'My Records',
  qr:         'QR Scan',
  face:       'Face ID',
  upload:     'Upload Photo',
  analytics:  'Analytics',
  approvals:  'Pending Approvals',
};

const TAB_SUBTITLES = {
  dashboard:  'System overview and statistics',
  users:      'Manage all registered users',
  faculty:    'Create a new faculty account',
  csv:        'Bulk import students from CSV',
  sessions:   'View and manage sessions',
  attendance: 'Browse all attendance records',
  create:     'Start a new attendance session',
  records:    'Your personal attendance history',
  qr:         'Scan a session QR code',
  face:       'Mark attendance via face recognition',
  upload:     'Register your face photo',
  analytics:  'View your attendance analytics',
  approvals:  'Review and approve pending attendance requests',
};

const Dashboard = () => {
  const { user } = useAuth();
  const defaultTab = { admin: 'dashboard', faculty: 'sessions', student: 'records' }[user?.role] || 'records';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderContent = () => {
    if (user?.role === 'admin')   return <AdminDashboard   activeTab={activeTab} />;
    if (user?.role === 'faculty') return <FacultyDashboard activeTab={activeTab} />;
    return <StudentDashboard activeTab={activeTab} />;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-gray-800 truncate">
                {TAB_LABELS[activeTab] || activeTab}
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">{TAB_SUBTITLES[activeTab] || 'AttendAI Management System'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {user?.rollNumber && (
              <span className="hidden sm:inline text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full font-mono">
                {user.rollNumber}
              </span>
            )}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2 sm:px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div key={activeTab}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
