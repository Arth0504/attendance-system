import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icons = {
  dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  users:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  faculty:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14v7" /><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" /></svg>,
  csv:       <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  sessions:  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  attendance:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  create:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
  records:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></svg>,
  qr:        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="5" /><rect x="16" y="3" width="5" height="5" /><rect x="3" y="16" width="5" height="5" /><path d="M21 16h-3v3" /><path d="M21 21h-3" /><path d="M16 16v.01" /><path d="M11 3v5h5" /><path d="M11 11h5v5" /><path d="M11 16v5" /></svg>,
  face:      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
  upload:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
  analytics: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  logout:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  approve:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>,
};

const NAV = {
  admin:   [
    { key: 'dashboard',  icon: Icons.dashboard,  label: 'Dashboard' },
    { key: 'users',      icon: Icons.users,       label: 'All Users' },
    { key: 'faculty',    icon: Icons.faculty,     label: 'Add Faculty' },
    { key: 'csv',        icon: Icons.csv,         label: 'Upload CSV' },
    { key: 'sessions',   icon: Icons.sessions,    label: 'Sessions' },
    { key: 'attendance', icon: Icons.attendance,  label: 'Attendance' },
    { key: 'approvals',  icon: Icons.approve,     label: 'Approvals' },
  ],
  faculty: [
    { key: 'sessions',   icon: Icons.sessions,    label: 'My Sessions' },
    { key: 'create',     icon: Icons.create,      label: 'New Session' },
    { key: 'attendance', icon: Icons.attendance,  label: 'Attendance' },
    { key: 'approvals',  icon: Icons.approve,     label: 'Approvals' },
  ],
  student: [
    { key: 'records',    icon: Icons.records,     label: 'My Records' },
    { key: 'qr',         icon: Icons.qr,          label: 'QR Scan' },
    { key: 'face',       icon: Icons.face,        label: 'Face ID' },
    { key: 'upload',     icon: Icons.upload,      label: 'Upload Photo' },
    { key: 'analytics',  icon: Icons.analytics,   label: 'Analytics' },
  ],
};

const ROLE_COLORS = {
  admin:   'bg-red-500/20 text-red-300',
  faculty: 'bg-blue-500/20 text-blue-300',
  student: 'bg-green-500/20 text-green-300',
};

// SidebarContent is shared between desktop collapsed/expanded and mobile drawer
const SidebarContent = ({ activeTab, onTabChange, collapsed, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user?.role] || NAV.student;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 h-16 border-b border-white/10 flex-shrink-0`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">AI</div>
            <span className="font-bold text-lg tracking-wide">AttendAI</span>
          </div>
        )}
        {/* Desktop collapse toggle */}
        {onClose === undefined && (
          <button
            onClick={() => {}}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white flex-shrink-0"
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {/* Mobile close button */}
        {onClose !== undefined && (
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white ml-auto">
            {Icons.close}
          </button>
        )}
      </div>

      {/* User card */}
      {!collapsed && (
        <div className="mx-3 my-3 p-3 bg-white/5 rounded-xl border border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate leading-tight">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[user?.role] || ROLE_COLORS.student}`}>
                {user?.role}
              </span>
            </div>
          </div>
          {user?.rollNumber && (
            <p className="text-xs text-indigo-300 mt-2 font-mono truncate">#{user.rollNumber}</p>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {items.map(item => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { onTabChange(item.key); onClose?.(); }}
              title={collapsed ? item.label : ''}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 pt-3 border-t border-white/10 flex-shrink-0">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          title={collapsed ? 'Logout' : ''}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
        >
          <span className="flex-shrink-0">{Icons.logout}</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ activeTab, onTabChange, mobileOpen, onMobileClose }) => {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-50 lg:hidden
        bg-gradient-to-b from-slate-900 to-indigo-950 text-white shadow-2xl
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent activeTab={activeTab} onTabChange={onTabChange} collapsed={false} onClose={onMobileClose} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 text-white flex-col flex-shrink-0 shadow-2xl">
        <SidebarContent activeTab={activeTab} onTabChange={onTabChange} collapsed={false} />
      </aside>
    </>
  );
};

export default Sidebar;
