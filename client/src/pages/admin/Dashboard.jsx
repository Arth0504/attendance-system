import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatsCard from '../../components/StatsCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner w-8 h-8" />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-slate-700">{label}</p>
        <p className="text-indigo-600 font-bold">{payload[0].value} present</p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const below75 = data?.analytics?.filter(a => a.percentage < 75) || [];
  const avgAttendance = data?.analytics?.length
    ? Math.round(data.analytics.reduce((s, a) => s + a.percentage, 0) / data.analytics.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your attendance management system</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Students" value={data?.totalStudents || 0} icon="👨‍🎓" color="indigo" />
        <StatsCard title="Total Sessions" value={data?.totalSessions || 0} icon="📅" color="blue" />
        <StatsCard title="Below 75%" value={below75.length} icon="⚠️" color="red"
          subtitle={below75.length > 0 ? 'Needs attention' : 'All good!'} />
        <StatsCard title="Avg Attendance" value={`${avgAttendance}%`} icon="📊" color={avgAttendance >= 75 ? 'green' : 'yellow'}
          subtitle={avgAttendance >= 75 ? '✓ Healthy' : '↓ Below target'} />
      </div>

      {/* Chart */}
      {data?.dailyTrend?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title mb-0">Daily Attendance Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 30 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.dailyTrend} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Below 75% alert */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">⚠️ Students Below 75% Attendance</h2>
          {below75.length > 0 && (
            <span className="badge bg-red-100 text-red-700">{below75.length} students</span>
          )}
        </div>
        {below75.length === 0 ? (
          <div className="empty-state py-10">
            <div className="empty-state-icon">🎉</div>
            <p className="font-semibold text-slate-700">All students are on track!</p>
            <p className="empty-state-text mt-1">Everyone has ≥75% attendance</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Present / Total</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {below75.map(a => (
                  <tr key={a.student.id}>
                    <td className="font-medium text-slate-900">{a.student.name}</td>
                    <td><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{a.student.rollNo}</code></td>
                    <td className="text-slate-500">{a.presentCount} / {a.totalSessions}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="progress-bar w-24">
                          <div className="progress-fill bg-red-500" style={{ width: `${a.percentage}%` }} />
                        </div>
                        <span className="badge-absent">{a.percentage}%</span>
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
