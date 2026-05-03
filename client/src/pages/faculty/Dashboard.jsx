import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatsCard from '../../components/StatsCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useAuth } from '../../context/AuthContext';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faculty/analytics').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>
  );

  const below75 = data?.analytics?.filter(a => a.percentage < 75).length || 0;
  const avgAttendance = data?.analytics?.length
    ? Math.round(data.analytics.reduce((s, a) => s + a.percentage, 0) / data.analytics.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name}!</h1>
          <p className="page-subtitle">Here's an overview of your classes</p>
        </div>
        <Link to="/faculty/sessions" className="btn-primary">+ New Session</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="My Sessions" value={data?.totalSessions || 0} icon="📅" color="indigo" />
        <StatsCard title="Total Students" value={data?.analytics?.length || 0} icon="👨🎓" color="blue" />
        <StatsCard title="Below 75%" value={below75} icon="⚠️" color="red"
          subtitle={below75 > 0 ? 'Need attention' : 'All on track!'} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/faculty/sessions" className="card-hover flex items-center gap-4 border-indigo-100 hover:border-indigo-300">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📅</div>
          <div>
            <p className="font-semibold text-slate-900">Manage Sessions</p>
            <p className="text-sm text-slate-500">Create sessions & generate QR codes</p>
          </div>
          <span className="ml-auto text-slate-300">→</span>
        </Link>
        <Link to="/faculty/requests" className="card-hover flex items-center gap-4 border-amber-100 hover:border-amber-300">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📋</div>
          <div>
            <p className="font-semibold text-slate-900">Review Requests</p>
            <p className="text-sm text-slate-500">Approve or reject student requests</p>
          </div>
          <span className="ml-auto text-slate-300">→</span>
        </Link>
      </div>

      {/* Chart */}
      {data?.analytics?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title mb-0">Class Attendance Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Average: {avgAttendance}%</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.analytics.slice(0, 15)} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="student.name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={40} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `${v}%`} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                {data.analytics.slice(0, 15).map((entry, i) => (
                  <Cell key={i} fill={entry.percentage >= 75 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
