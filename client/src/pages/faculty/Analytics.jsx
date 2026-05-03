import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function FacultyAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    api.get('/faculty/analytics').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>
  );

  const sorted = [...(data?.analytics || [])].sort((a, b) => {
    if (sortBy === 'name') return a.student.name.localeCompare(b.student.name);
    if (sortBy === 'asc') return a.percentage - b.percentage;
    if (sortBy === 'desc') return b.percentage - a.percentage;
    return 0;
  });

  const below75 = data?.analytics?.filter(a => a.percentage < 75) || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Analytics</h1>
          <p className="page-subtitle">Attendance report for your sessions</p>
        </div>
      </div>

      {below75.length > 0 && (
        <div className="alert-warning">
          <span>⚠️</span>
          <div>
            <p className="font-semibold">{below75.length} student{below75.length > 1 ? 's' : ''} below 75% attendance</p>
            <p className="text-xs mt-0.5 opacity-80">{below75.map(a => a.student.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="section-title mb-0 flex-1">Student Attendance Report</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Sort:</span>
            <select className="input py-1.5 text-xs w-auto" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="name">Name A–Z</option>
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="empty-state py-8">
            <div className="empty-state-icon">📊</div>
            <p className="empty-state-text">No attendance data available yet</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Present</th>
                  <th>Total</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(a => (
                  <tr key={a.student.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${a.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {a.student.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{a.student.name}</span>
                      </div>
                    </td>
                    <td><code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{a.student.rollNo}</code></td>
                    <td className="font-medium">{a.presentCount}</td>
                    <td className="text-slate-500">{a.totalSessions}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="progress-bar w-24">
                          <div className={`progress-fill ${a.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${a.percentage}%` }} />
                        </div>
                        <span className={a.percentage >= 75 ? 'badge-present' : 'badge-absent'}>{a.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
