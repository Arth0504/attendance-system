import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ subject: '', className: '', startTime: '', endTime: '', latitude: '', longitude: '', radius: 100 });
  const [qrData, setQrData] = useState({});
  const [qrTimers, setQrTimers] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionAttendance, setSessionAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const fetchSessions = () => api.get('/sessions').then(res => setSessions(res.data));
  useEffect(() => { fetchSessions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/sessions', form);
      toast.success('Session created successfully');
      setShowForm(false);
      setForm({ subject: '', className: '', startTime: '', endTime: '', latitude: '', longitude: '', radius: 100 });
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    }
    setLoading(false);
  };

  const generateQR = async (sessionId) => {
    try {
      const res = await api.post(`/sessions/${sessionId}/qr`);
      setQrData(prev => ({ ...prev, [sessionId]: { ...res.data, remaining: 60 } }));
      toast.success('QR code generated — valid for 60 seconds');

      // Countdown timer
      let remaining = 60;
      const interval = setInterval(() => {
        remaining -= 1;
        setQrData(prev => prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], remaining } } : prev);
        if (remaining <= 0) {
          clearInterval(interval);
          setQrData(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
        }
      }, 1000);
      setQrTimers(prev => { if (prev[sessionId]) clearInterval(prev[sessionId]); return { ...prev, [sessionId]: interval }; });
    } catch {
      toast.error('Failed to generate QR code');
    }
  };

  const viewAttendance = async (session) => {
    setSelectedSession(session);
    setLoadingAttendance(true);
    const res = await api.get(`/sessions/${session._id}/attendance`);
    setSessionAttendance(res.data);
    setLoadingAttendance(false);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        console.log('📍 GPS Location captured:');
        console.log(`   Latitude : ${lat}`);
        console.log(`   Longitude: ${lng}`);
        console.log(`   Accuracy : ±${pos.coords.accuracy?.toFixed(1)}m`);
        setForm(p => ({ ...p, latitude: lat, longitude: lng }));
        toast.success(`Location captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setLocLoading(false);
      },
      err => {
        const messages = {
          1: 'Permission denied — please allow location access in your browser settings',
          2: 'Location unavailable — GPS signal could not be obtained',
          3: 'Location request timed out — please try again',
        };
        toast.error(messages[err.code] || 'Failed to get location');
        console.error('Geolocation error:', err.message);
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const deleteSession = async (id) => {
    if (!confirm('Delete this session and all its attendance records?')) return;
    await api.delete(`/sessions/${id}`);
    fetchSessions();
    toast.success('Session deleted');
  };

  const formatDateTime = (dt) => new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="page-subtitle">{sessions.length} sessions created</p>
        </div>
        <button onClick={() => setShowForm(p => !p)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ New Session'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card border-indigo-200 bg-indigo-50/30">
          <h2 className="section-title">Create New Session</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Subject</label>
              <input className="input" placeholder="e.g. Mathematics" value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Class / Section</label>
              <input className="input" placeholder="e.g. CS-A Sem 4" value={form.className}
                onChange={e => setForm(p => ({ ...p, className: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Start Time</label>
              <input type="datetime-local" className="input" value={form.startTime}
                onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">End Time</label>
              <input type="datetime-local" className="input" value={form.endTime}
                onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Latitude</label>
              <input className="input" placeholder="e.g. 23.0225" type="number" step="any" value={form.latitude}
                onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Longitude</label>
              <input className="input" placeholder="e.g. 72.5714" type="number" step="any" value={form.longitude}
                onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Radius (meters)</label>
              <input className="input" type="number" value={form.radius}
                onChange={e => setForm(p => ({ ...p, radius: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={getLocation}
                disabled={locLoading}
                className="btn-secondary w-full"
              >
                {locLoading
                  ? <><span className="spinner w-4 h-4" /> Fetching location…</>
                  : '📍 Use My Current Location'}
              </button>
            </div>
            {form.latitude && form.longitude && (
              <div className="md:col-span-2">
                <div className="alert-success">
                  <span>📍</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Location captured</p>
                    <div className="mt-1 grid grid-cols-2 gap-x-4 text-xs font-mono">
                      <span>Latitude: <strong>{Number(form.latitude).toFixed(6)}</strong></span>
                      <span>Longitude: <strong>{Number(form.longitude).toFixed(6)}</strong></span>
                    </div>
                    <p className="text-xs opacity-70 mt-0.5">Radius: {form.radius}m</p>
                  </div>
                </div>
              </div>
            )}
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><span className="spinner w-4 h-4" /> Creating...</> : 'Create Session'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Attendance panel */}
      {selectedSession && (
        <div className="card border-slate-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title mb-0">Attendance — {selectedSession.subject}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{selectedSession.className} · {formatDateTime(selectedSession.startTime)}</p>
            </div>
            <button onClick={() => setSelectedSession(null)} className="btn-ghost btn-sm">✕ Close</button>
          </div>
          {loadingAttendance ? (
            <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div>
          ) : sessionAttendance.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">No attendance records for this session</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Student</th><th>Roll No</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {sessionAttendance.map(a => (
                    <tr key={a._id}>
                      <td className="font-medium">{a.studentId?.name}</td>
                      <td><code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{a.studentId?.rollNo}</code></td>
                      <td><span className={`badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                      <td className="text-slate-500 text-xs">{new Date(a.markedAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sessions list */}
      <div className="card">
        <h2 className="section-title">All Sessions</h2>
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p className="font-semibold text-slate-700">No sessions yet</p>
            <p className="empty-state-text">Create a session to start taking attendance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s._id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{s.subject}</h3>
                      <span className="badge bg-slate-100 text-slate-600">{s.className}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatDateTime(s.startTime)} → {new Date(s.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {user.role === 'admin' && s.facultyId && (
                      <p className="text-xs text-slate-400 mt-0.5">👨🏫 {s.facultyId?.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => generateQR(s._id)} className="btn-success btn-sm">🔲 Generate QR</button>
                    <button onClick={() => viewAttendance(s)} className="btn-secondary btn-sm">👁 Attendance</button>
                    <button onClick={() => deleteSession(s._id)} className="btn-danger btn-sm">🗑</button>
                  </div>
                </div>

                {/* QR display */}
                {qrData[s._id] && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 p-4 bg-white border border-emerald-200 rounded-xl">
                    <img src={qrData[s._id].qrImage} alt="QR Code" className="w-40 h-40 rounded-lg shadow-sm" />
                    <div className="text-center sm:text-left">
                      <p className="font-semibold text-slate-800 mb-1">QR Code Active</p>
                      <p className="text-sm text-slate-500 mb-3">Students can scan this to mark attendance</p>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-32">
                          <div
                            className={`progress-fill transition-all ${qrData[s._id].remaining > 20 ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${(qrData[s._id].remaining / 60) * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${qrData[s._id].remaining > 20 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {qrData[s._id].remaining}s
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Expires at {new Date(qrData[s._id].expiresAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
