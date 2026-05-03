import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps any student page that requires face registration.
 * If the student hasn't registered their face, shows a blocking screen
 * with a redirect to /student/register-face.
 */
export default function FaceGuard({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user?.faceRegistered) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🎭</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Face Registration Required</h2>
          <p className="text-slate-500 text-sm mb-6">
            You must register your face before marking attendance. This is a one-time setup that takes less than a minute.
          </p>
          <div className="space-y-2 text-left mb-6">
            {[
              { icon: '🔒', text: 'Prevents proxy attendance' },
              { icon: '⚡', text: 'One-time setup only' },
              { icon: '🛡', text: 'Data stored securely on server' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/student/register-face')}
            className="btn-primary w-full btn-lg"
          >
            Register Face Now →
          </button>
          <button
            onClick={() => navigate('/student')}
            className="mt-3 text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2 block"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
}
