import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎓</span>
          <span className="text-2xl font-bold tracking-wide">AttendAI</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Smart Attendance<br />Management System
          </h2>
          <p className="text-indigo-200 text-lg mb-8">
            AI-powered attendance tracking with Face Recognition, QR Codes, and GPS verification.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🤖', label: 'Face Recognition' },
              { icon: '📷', label: 'QR Code Scan' },
              { icon: '📍', label: 'GPS Verification' },
              { icon: '📊', label: 'Live Analytics' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-sm">© 2024 AttendAI. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <span className="text-3xl">🎓</span>
            <span className="text-2xl font-bold text-indigo-700">AttendAI</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sign in to your account</h1>
              <p className="text-gray-500 mt-1 text-sm">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email or Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={form.identifier}
                  onChange={e => setForm({ ...form, identifier: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition"
                  placeholder="admin@college.com or CS2024001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <p className="text-xs text-gray-500">Please contact your administrator for login credentials.</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Access is managed by your institution administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
