import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import QRGenerator from '../../components/QRGenerator';

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const FacultyDashboard = ({ activeTab }) => {
  const { user } = useAuth();
  const [sessions, setSessions]               = useState([]);
  const [form, setForm]                       = useState({ subject: '', department: '', latitude: '', longitude: '', radius: 100 });
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionAttendance, setSessionAttendance] = useState([]);
  const [expandedQR, setExpandedQR]           = useState(null);

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data)).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        subject: form.subject,
        department: form.department,
        location: form.latitude
          ? { latitude: +form.latitude, longitude: +form.longitude, radius: +form.radius }
          : undefined,
      };
      const { data } = await api.post('/sessions', payload);
      setSessions(prev => [data, ...prev]);
      setForm({ subject: '', department: '', latitude: '', longitude: '', radius: 100 });
      toast.success('Session created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    }
  };

  const handleClose = async (id) => {
    try {
      const { data } = await api.put(`/sessions/${id}/close`);
      setSessions(prev => prev.map(s => s._id === id ? data : s));
      toast.success('Session closed');
    } catch { toast.error('Failed to close session'); }
  };

  const viewAttendance = async (session) => {
    setSelectedSession(session);
    const { data } = await api.get(`/sessions/${session._id}/attendance`);
    setSessionAttendance(data);
  };

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => setForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })),
      () => toast.error('Location access denied')
    );
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* CREATE SESSION TAB */}
      {activeTab === 'create' && (
        <div>
          <SectionHeader title="New Session" subtitle="Start a new attendance session for your class" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 w-full max-w-lg">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subject</label>
                <input required value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="e.g. Data Structures" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Department</label>
                <input required value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="e.g. Computer Science" />
              </div>
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">GPS Location (optional)</span>
                  <button type="button" onClick={useMyLocation}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                    Use My Location
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Latitude" />
                  <input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Longitude" />
                </div>
                <input type="number" value={form.radius} onChange={e => setForm(f => ({ ...f, radius: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Radius (meters)" />
              </div>
              <button type="submit"
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition text-sm">
                Create Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SESSIONS TAB */}
      {activeTab === 'sessions' && (
        <div>
          <SectionHeader title="My Sessions" subtitle={`${sessions.length} total sessions`} />
          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No sessions yet</p>
              <p className="text-gray-400 text-sm mt-1">Go to New Session to create one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">{s.subject}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{s.department} &middot; {new Date(s.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap flex-shrink-0">
                      {s.isActive && (
                        <button onClick={() => setExpandedQR(expandedQR === s._id ? null : s._id)}
                          className="text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition font-medium">
                          {expandedQR === s._id ? 'Hide QR' : 'Show QR'}
                        </button>
                      )}
                      <button onClick={() => viewAttendance(s)}
                        className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition font-medium">
                        Attendance
                      </button>
                      {s.isActive && (
                        <button onClick={() => handleClose(s._id)}
                          className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium">
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedQR === s._id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <QRGenerator
                        value={JSON.stringify({ token: s.qrToken, subject: s.subject })}
                        subject={s.subject}
                        sessionId={s._id}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div>
          {!selectedSession ? (
            <>
              <SectionHeader title="Session Attendance" subtitle="Select a session below to view its attendance" />
              <div className="space-y-3">
                {sessions.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
                    No sessions available
                  </div>
                )}
                {sessions.map(s => (
                  <button key={s._id} onClick={() => viewAttendance(s)}
                    className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{s.subject}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{s.department} &middot; {new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.isActive ? 'Active' : 'Closed'}
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setSelectedSession(null)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedSession.subject}</h2>
                  <p className="text-sm text-gray-500">{sessionAttendance.length} students present</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Name', 'Roll No', 'Email', 'Method', 'Time'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sessionAttendance.map(a => (
                        <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{a.userId?.name}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.userId?.rollNumber || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{a.userId?.email}</td>
                          <td className="px-4 py-3 capitalize text-gray-600">{a.method}</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(a.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                      {sessionAttendance.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No attendance records yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
