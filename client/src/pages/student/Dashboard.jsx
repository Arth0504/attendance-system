import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/attendance/my-stats').then(res => setStats(res.data));
  }, []);

  const attendancePct = stats?.percentage || 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">
            <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{user?.rollNo || user?.username}</code>
            {' '}· Student Dashboard
          </p>
        </div>
      </div>

      {/* Face registration status banner */}
      {!user?.faceRegistered ? (
        <div className="card border-2 border-amber-300 bg-amber-50/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🎭</div>
            <div className="flex-1">
              <h2 className="font-bold text-amber-900">Face Registration Required</h2>
              <p className="text-sm text-amber-700 mt-0.5">
                Register your face to enable biometric attendance verification. This is a one-time setup.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/register-face')}
            className="btn-warning w-full mt-4"
          >
            🎭 Register Face Now →
          </button>
        </div>
      ) : (
        <div className="alert-success">
          <span>✅</span>
          <div className="flex-1">
            <p className="font-medium">Face registered</p>
            <p className="text-xs opacity-80 mt-0.5">Biometric verification is active for attendance</p>
          </div>
          <button
            onClick={() => navigate('/student/register-face')}
            className="btn btn-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex-shrink-0"
          >
            Update
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Total Sessions" value={stats.totalSessions} icon="📅" color="indigo" />
          <StatsCard title="Present" value={stats.presentCount} icon="✅" color="green" />
          <StatsCard
            title="Attendance"
            value={`${attendancePct}%`}
            icon="📊"
            color={attendancePct >= 75 ? 'green' : 'red'}
            subtitle={attendancePct < 75 ? '⚠️ Below 75% threshold' : '✓ Good standing'}
          />
        </div>
      )}

      {/* Attendance progress */}
      {stats && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Attendance Progress</h2>
            <span className={`badge ${attendancePct >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {attendancePct >= 75 ? '✓ On Track' : '⚠️ At Risk'}
            </span>
          </div>
          <div className="progress-bar h-3 mb-2">
            <div
              className={`progress-fill h-3 ${attendancePct >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${attendancePct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{stats.presentCount} present out of {stats.totalSessions} sessions</span>
            <span className="font-semibold">{attendancePct}%</span>
          </div>
          {attendancePct < 75 && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 px-3 py-2 rounded-lg">
              You need {Math.ceil((0.75 * stats.totalSessions - stats.presentCount))} more sessions to reach 75%
            </p>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/student/mark-attendance" className="card-hover flex items-center gap-4 border-indigo-100 hover:border-indigo-300">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">✅</div>
          <div>
            <p className="font-semibold text-slate-900">Mark Attendance</p>
            <p className="text-sm text-slate-500">Scan QR · Verify face · Check GPS</p>
          </div>
          <span className="ml-auto text-slate-300 text-lg">→</span>
        </Link>
        <Link to="/student/history" className="card-hover flex items-center gap-4 border-emerald-100 hover:border-emerald-300">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📜</div>
          <div>
            <p className="font-semibold text-slate-900">View History</p>
            <p className="text-sm text-slate-500">Check all attendance records</p>
          </div>
          <span className="ml-auto text-slate-300 text-lg">→</span>
        </Link>
        <Link to="/student/requests" className="card-hover flex items-center gap-4 border-amber-100 hover:border-amber-300">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📋</div>
          <div>
            <p className="font-semibold text-slate-900">Submit Request</p>
            <p className="text-sm text-slate-500">Request attendance correction</p>
          </div>
          <span className="ml-auto text-slate-300 text-lg">→</span>
        </Link>
      </div>
    </div>
  );
}
