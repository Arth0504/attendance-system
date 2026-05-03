import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StudentRequests() {
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ sessionId: '', reason: '', proofImage: '' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchRequests = () => api.get('/attendance/my-requests').then(res => setRequests(res.data));
  const fetchSessions = () => api.get('/sessions').then(res => setSessions(res.data));

  useEffect(() => { fetchRequests(); fetchSessions(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/attendance/request', form);
      toast.success('Request submitted successfully');
      setShowForm(false);
      setForm({ sessionId: '', reason: '', proofImage: '' });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    }
    setLoading(false);
  };

  const pending = requests.filter(r => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Requests</h1>
          <p className="page-subtitle">
            {requests.length} total · {pending > 0 && <span className="text-amber-600">{pending} pending</span>}
          </p>
        </div>
        <button onClick={() => setShowForm(p => !p)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ New Request'}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="card border-indigo-200 bg-indigo-50/30">
          <h2 className="section-title">Submit Attendance Request</h2>
          <div className="alert-info mb-4">
            <span>ℹ️</span>
            <p className="text-sm">Requests are reviewed by your faculty. Approved requests count as attended.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Session</label>
              <select
                className="input"
                value={form.sessionId}
                onChange={e => setForm(p => ({ ...p, sessionId: e.target.value }))}
                required
              >
                <option value="">Select the session you missed</option>
                {sessions.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.subject} — {s.className} ({new Date(s.startTime).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Reason for Absence</label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Explain why you were unable to attend this session..."
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Proof Image URL <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                className="input"
                placeholder="https://example.com/proof.jpg"
                value={form.proofImage}
                onChange={e => setForm(p => ({ ...p, proofImage: e.target.value }))}
              />
              <p className="text-xs text-slate-400 mt-1">Link to a medical certificate, leave letter, or other proof</p>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><span className="spinner w-4 h-4" /> Submitting...</> : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Requests list */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="font-semibold text-slate-700">No requests yet</p>
              <p className="empty-state-text">Submit a request if you missed a session</p>
            </div>
          </div>
        ) : (
          requests.map(r => (
            <div key={r._id} className={`card border-l-4 ${
              r.status === 'Pending'  ? 'border-l-amber-400' :
              r.status === 'Approved' ? 'border-l-emerald-400' :
              'border-l-red-400'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{r.sessionId?.subject} — {r.sessionId?.className}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(r.sessionId?.startTime).toLocaleString()}</p>
                </div>
                <span className={`badge-${r.status.toLowerCase()} flex-shrink-0`}>{r.status}</span>
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-slate-100 mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Reason</p>
                {r.reason}
              </div>

              {r.proofImage && (
                <img src={r.proofImage} alt="Proof" className="w-32 h-24 object-cover rounded-xl border border-slate-200 mb-3" />
              )}

              {r.reviewedBy ? (
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  <span>{r.status === 'Approved' ? '✓' : '✗'}</span>
                  <span>
                    {r.status} by <strong>{r.reviewedBy?.name}</strong> · {new Date(r.reviewedAt).toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <span>⏳</span>
                  <span>Awaiting review from faculty</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
