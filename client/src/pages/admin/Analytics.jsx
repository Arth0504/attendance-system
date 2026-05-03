import { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, PieChart, Pie, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-slate-700 truncate max-w-[160px]">{label}</p>
        <p className={`font-bold ${payload[0].value >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
          {payload[0].value}% attendance
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>
  );

  const above75 = data?.analytics?.filter(a => a.percentage >= 75).length || 0;
  const below75 = data?.analytics?.filter(a => a.percentage < 75).length || 0;
  const pieData = [
    { name: '≥75% (Good)', value: above75, fill: '#10b981' },
    { name: '<75% (At Risk)', value: below75, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Attendance insights across all sessions</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="card xl:col-span-2">
          <h2 className="section-title">Student Attendance Overview</h2>
          {data?.analytics?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.analytics.slice(0, 20)} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="student.name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {data.analytics.slice(0, 20).map((entry, i) => (
                    <Cell key={i} fill={entry.percentage >= 75 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state h-48">
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-text">No attendance data yet</p>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h2 className="section-title">Attendance Distribution</h2>
          {above75 + below75 > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v} students`} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state h-48">
              <div className="empty-state-icon">🥧</div>
              <p className="empty-state-text">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Detailed Student Report</h2>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ≥75%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;75%</span>
          </div>
        </div>
        {data?.analytics?.length === 0 ? (
          <div className="empty-state py-8">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">No student data available</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Present</th>
                  <th>Total</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {data?.analytics?.map((a, i) => (
                  <tr key={a.student.id}>
                    <td className="text-slate-400 text-xs">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${a.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {a.student.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{a.student.name}</span>
                      </div>
                    </td>
                    <td><code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{a.student.rollNo}</code></td>
                    <td className="font-medium text-slate-700">{a.presentCount}</td>
                    <td className="text-slate-500">{a.totalSessions}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="progress-bar w-20">
                          <div
                            className={`progress-fill ${a.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${a.percentage}%` }}
                          />
                        </div>
                        <span className={a.percentage >= 75 ? 'badge-present' : 'badge-absent'}>
                          {a.percentage}%
                        </span>
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
