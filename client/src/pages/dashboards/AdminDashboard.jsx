import { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const StatCard = ({ icon, label, value, color }) => (
  <div className={`rounded-xl p-4 sm:p-5 ${color} flex items-center gap-3 sm:gap-4`}>
    <div className="text-2xl sm:text-3xl">{icon}</div>
    <div>
      <div className="text-xl sm:text-2xl font-bold leading-tight">{value}</div>
      <div className="text-xs sm:text-sm font-medium opacity-80">{label}</div>
    </div>
  </div>
);

const AdminDashboard = ({ activeTab }) => {
  const [users, setUsers]             = useState([]);
  const [sessions, setSessions]       = useState([]);
  const [attendance, setAttendance]   = useState([]);
  const [editUser, setEditUser]       = useState(null);
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', password: '', department: '' });
  const [csvFile, setCsvFile]         = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [pending, setPending]           = useState([]);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
    api.get('/sessions').then(r => setSessions(r.data)).catch(() => {});
    api.get('/attendance/all').then(r => setAttendance(r.data)).catch(() => {});
    api.get('/attendance/pending').then(r => setPending(r.data)).catch(() => {});
  }, []);

  const refreshPending = () => api.get('/attendance/pending').then(r => setPending(r.data)).catch(() => {});

  const handleApprove = async (id) => {
    try { await api.put(`/attendance/pending/${id}/approve`); toast.success('Approved'); refreshPending(); }
    catch { toast.error('Failed'); }
  };
  const handleReject = async (id) => {
    try { await api.put(`/attendance/pending/${id}/reject`); toast.success('Rejected'); refreshPending(); }
    catch { toast.error('Failed'); }
  };

  const refreshUsers = () => api.get('/users').then(r => setUsers(r.data)).catch(() => {});

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(u => u.filter(x => x._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/users/${editUser._id}`, editUser);
      setUsers(u => u.map(x => x._id === data._id ? data : x));
      setEditUser(null);
      toast.success('User updated');
    } catch { toast.error('Update failed'); }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/users/faculty', facultyForm);
      const pwd = data._password_plain || facultyForm.password;
      toast.success(`Faculty created! Login: ${data.email} / ${pwd}`);
      setFacultyForm({ name: '', email: '', password: '', department: '' });
      refreshUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create faculty');
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) { toast.error('Please select a CSV file'); return; }
    setCsvUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const { data } = await api.post('/users/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'CSV uploaded successfully!');
      setCsvFile(null);
      refreshUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV upload failed');
    } finally {
      setCsvUploading(false);
    }
  };

  const roleData = ['admin', 'faculty', 'student'].map(role => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
    value: users.filter(u => u.role === role).length,
  }));

  const stats = [
    { label: 'Total Users',        value: users.length,                            icon: '👥', color: 'bg-indigo-100 text-indigo-700' },
    { label: 'Total Sessions',     value: sessions.length,                         icon: '📋', color: 'bg-blue-100 text-blue-700' },
    { label: 'Attendance Records', value: attendance.length,                       icon: '✅', color: 'bg-green-100 text-green-700' },
    { label: 'Active Sessions',    value: sessions.filter(s => s.isActive).length, icon: '🟢', color: 'bg-yellow-100 text-yellow-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto">

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateUser} className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-2">
              <h3 className="font-bold text-lg text-gray-800">Edit User</h3>
              <p className="text-sm text-gray-500">Update user details below</p>
            </div>
            {[
              { field: 'name',       placeholder: 'Full Name' },
              { field: 'email',      placeholder: 'Email Address' },
              { field: 'department', placeholder: 'Department' },
              { field: 'rollNumber', placeholder: 'Roll Number' },
            ].map(({ field, placeholder }) => (
              <input key={field} value={editUser[field] || ''}
                onChange={e => setEditUser({ ...editUser, [field]: e.target.value })}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            ))}
            <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              {['student', 'faculty', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">Save Changes</button>
              <button type="button" onClick={() => setEditUser(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-200 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <SectionHeader title="Dashboard Overview" subtitle="System-wide statistics at a glance" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(s => <StatCard key={s.label} {...s} />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <h3 className="font-semibold text-gray-700 mb-1">Users by Role</h3>
              <p className="text-xs text-gray-400 mb-4">Distribution across all roles</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                    {roleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <h3 className="font-semibold text-gray-700 mb-1">Sessions Overview</h3>
              <p className="text-xs text-gray-400 mb-4">Active vs closed sessions</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Active', count: sessions.filter(s => s.isActive).length },
                  { name: 'Closed', count: sessions.filter(s => !s.isActive).length },
                ]}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div>
          <SectionHeader title="All Users" subtitle={`${users.length} registered users in the system`} />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Email', 'Role', 'Department', 'Roll No', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full capitalize text-xs font-medium whitespace-nowrap ${
                          u.role === 'admin'   ? 'bg-red-100 text-red-700' :
                          u.role === 'faculty' ? 'bg-blue-100 text-blue-700' :
                                                 'bg-green-100 text-green-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.department || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">{u.rollNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => setEditUser(u)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors">Edit</button>
                          <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY TAB */}
      {activeTab === 'faculty' && (
        <div>
          <SectionHeader title="Add Faculty" subtitle="Create a new faculty account" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 w-full max-w-lg">
            <form onSubmit={handleCreateFaculty} className="space-y-4">
              {[
                { field: 'name',       placeholder: 'Full Name',     type: 'text' },
                { field: 'email',      placeholder: 'Email Address', type: 'email' },
                { field: 'password',   placeholder: 'Password',      type: 'password' },
                { field: 'department', placeholder: 'Department',    type: 'text' },
              ].map(({ field, placeholder, type }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{placeholder}</label>
                  <input
                    type={type} required value={facultyForm[field]}
                    onChange={e => setFacultyForm({ ...facultyForm, [field]: e.target.value })}
                    placeholder={`Enter ${placeholder.toLowerCase()}`}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>
              ))}
              <button type="submit"
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition text-sm mt-2">
                Create Faculty Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSV TAB */}
      {activeTab === 'csv' && (
        <div>
          <SectionHeader title="Upload CSV" subtitle="Bulk import students from a CSV file" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 w-full max-w-lg">
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Expected CSV format:</p>
              <code className="text-xs text-indigo-600 font-mono break-all">name, email, rollNumber, department</code>
            </div>
            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                  csvFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
                }`}
                onClick={() => document.getElementById('csv-input').click()}
              >
                {csvFile ? (
                  <div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{csvFile.name}</p>
                    <p className="text-gray-400 text-xs mt-1">{(csvFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">Click to select a CSV file</p>
                    <p className="text-xs text-gray-400 mt-1">Only .csv files accepted</p>
                  </div>
                )}
                <input id="csv-input" type="file" accept=".csv" className="hidden"
                  onChange={e => setCsvFile(e.target.files[0] || null)} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={csvUploading || !csvFile}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {csvUploading ? 'Uploading...' : 'Upload & Import'}
                </button>
                {csvFile && (
                  <button type="button" onClick={() => setCsvFile(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition">
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SESSIONS TAB */}
      {activeTab === 'sessions' && (
        <div>
          <SectionHeader title="All Sessions" subtitle={`${sessions.length} total sessions`} />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Subject', 'Department', 'Faculty', 'Status', 'Created'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{s.subject}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{s.department}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.facultyId?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.isActive ? 'Active' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No sessions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div>
          <SectionHeader title="Attendance Records" subtitle={`${attendance.length} total records`} />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Student', 'Subject', 'Status', 'Method', 'Time'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendance.map(a => (
                    <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{a.userId?.name}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.sessionId?.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${a.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-500 whitespace-nowrap">{a.method}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No attendance records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* APPROVALS TAB */}
      {activeTab === 'approvals' && (
        <div>
          <SectionHeader title="Attendance Approvals" subtitle={`${pending.length} pending requests`} />
          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-500 font-medium">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(a => (
                <div key={a._id} className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800">{a.userId?.name}</p>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Pending</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {a.userId?.rollNumber && <span className="font-mono mr-2">#{a.userId.rollNumber}</span>}
                        {a.sessionId?.subject} &middot; {a.sessionId?.department}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {a.distanceFromCampus != null && <span className="mr-2">📍 {a.distanceFromCampus}m from campus</span>}
                        {new Date(a.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleApprove(a._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                        Approve
                      </button>
                      <button onClick={() => handleReject(a._id)}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
