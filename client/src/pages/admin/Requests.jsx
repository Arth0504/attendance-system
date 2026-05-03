import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchRequests = () => {
    const endpoint = user.role === 'admin' ? '/admin/requests' : '/faculty/requests';
    api.get(endpoint).then(res => setRequests(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const review = async (id, status) => {
    const endpoint = user.role === 'admin' ? `/admin/requests/${id}` : `/faculty/requests/${id}`;
    try {
      await api.patch(endpoint, { status });
      toast.success(`Request ${status.toLowerCase()}`);
      fetchRequests();
    } catch {
      toast.error('Failed to update request');
    }
  };

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);
  const counts = STATUS_FILTERS.slice(1).reduce((acc, s) => ({ ...acc, [s]: requests.filter(r => r.status === s).length }), {});

  if (loading) return (
    <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Requests</h1>
          <p className="page-subtitle">{requests.length} total requests</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-sm text-center border-amber-200 bg-amber-50">
          <p className="text-2xl font-bold text-amber-700">{counts.Pending || 0}</p>
          <p className="text-xs text-amber-600 font-medium mt-0.5">Pending</p>
        </div>
        <div className="card-sm text-center border-emerald-200 bg-emerald-50">
          <p className="text-2xl font-bold text-emerald-700">{counts.Approved || 0}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Approved</p>
        </div>
        <div className="card-sm text-center border-red-200 bg-red-50">
          <p className="text-2xl font-bold text-red-700">{counts.Rejected || 0}</p>
          <p className="text-xs text-red-600 font-medium mt-0.5">Rejected</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {s} {s !== 'All' && counts[s] > 0 && <span className="ml-1 text-xs opacity-60">({counts[s]})</span>}
          </button>
        ))}
      </div>

      {/* Requests */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="font-semibold text-slate-700">No {filter !== 'All' ? filter.toLowerCase() : ''} requests</p>
            <p className="empty-state-text">Requests will appear here when students submit them</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r._id} className={`card border-l-4 ${
              r.status === 'Pending' ? 'border-l-amber-400' :
              r.status === 'Approved' ? 'border-l-emerald-400' : 'border-l-red-400'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                      {r.studentId?.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900">{r.studentId?.name}</span>
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-600">{r.studentId?.rollNo}</code>
                    <span className={`badge-${r.status.toLowerCase()}`}>{r.status}</span>
                  </div>

                  {/* Session info */}
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <span>📅</span>
                    <span>{r.sessionId?.subject} — {r.sessionId?.className}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs">{new Date(r.sessionId?.startTime).toLocaleString()}</span>
                  </div>

                  {/* Reason */}
                  <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 border border-slate-100">
                    <span className="font-medium text-slate-500 text-xs uppercase tracking-wide">Reason: </span>
                    {r.reason}
                  </div>

                  {/* Proof image */}
                  {r.proofImage && (
                    <img src={r.proofImage} alt="Proof" className="w-28 h-20 object-cover rounded-lg border border-slate-200" />
                  )}

                  {/* Review info */}
                  {r.reviewedBy && (
                    <p className="text-xs text-slate-400">
                      Reviewed by <span className="font-medium">{r.reviewedBy?.name}</span> · {new Date(r.reviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {r.status === 'Pending' && (
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    <button onClick={() => review(r._id, 'Approved')} className="btn-success btn-sm">✓ Approve</button>
                    <button onClick={() => review(r._id, 'Rejected')} className="btn-danger btn-sm">✗ Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
