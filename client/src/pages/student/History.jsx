import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AttendanceHistory() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');

  useEffect(() => {
    api.get('/attendance/my').then(res => setAttendance(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>
  );

  const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'Approved').length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance History</h1>
          <p className="page-subtitle">{attendance.length} records · {presentCount} present</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setView('table')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
            ☰ Table
          </button>
          <button onClick={() => setView('cards')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'cards' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
            ⊞ Cards
          </button>
        </div>
      </div>

      {attendance.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <p className="font-semibold text-slate-700">No attendance records yet</p>
            <p className="empty-state-text">Your attendance history will appear here after you mark attendance</p>
          </div>
        </div>
      ) : view === 'table' ? (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Verifications</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a._id}>
                    <td className="font-medium text-slate-900">{a.sessionId?.subject}</td>
                    <td className="text-slate-500">{a.sessionId?.className}</td>
                    <td className="text-slate-500 text-xs">{new Date(a.markedAt).toLocaleString()}</td>
                    <td><span className={`badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span title="Face" className={`text-xs px-1.5 py-0.5 rounded ${a.verifications?.face ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          🎭{a.verifications?.face ? '✓' : '✗'}
                        </span>
                        <span title="GPS" className={`text-xs px-1.5 py-0.5 rounded ${a.verifications?.gps ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          📍{a.verifications?.gps ? '✓' : '✗'}
                        </span>
                        <span title="QR" className={`text-xs px-1.5 py-0.5 rounded ${a.verifications?.qr ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          🔲{a.verifications?.qr ? '✓' : '✗'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attendance.map(a => (
            <div key={a._id} className={`card-sm border-l-4 ${a.status === 'Present' ? 'border-l-emerald-400' : a.status === 'Approved' ? 'border-l-indigo-400' : 'border-l-slate-300'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{a.sessionId?.subject}</p>
                  <p className="text-xs text-slate-500">{a.sessionId?.className}</p>
                </div>
                <span className={`badge-${a.status.toLowerCase()}`}>{a.status}</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{new Date(a.markedAt).toLocaleString()}</p>
              <div className="flex items-center gap-2">
                {[
                  { key: 'face', label: '🎭 Face', val: a.verifications?.face },
                  { key: 'gps', label: '📍 GPS', val: a.verifications?.gps },
                  { key: 'qr', label: '🔲 QR', val: a.verifications?.qr },
                ].map(v => (
                  <span key={v.key} className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.val ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {v.label} {v.val ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
