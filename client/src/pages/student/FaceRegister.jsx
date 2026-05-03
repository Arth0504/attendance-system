import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import FaceCapture from '../../components/FaceCapture';
import toast from 'react-hot-toast';

const TIPS = [
  { icon: '💡', text: 'Ensure bright, even lighting on your face' },
  { icon: '👁', text: 'Look directly at the camera, not the screen' },
  { icon: '😐', text: 'Keep a neutral expression' },
  { icon: '🚫', text: 'Remove glasses, hats, or face coverings' },
  { icon: '📏', text: 'Keep your face centred in the frame' },
];

export default function FaceRegister() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('capture'); // capture | saving | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [descriptor, setDescriptor] = useState(null);

  const handleCapture = useCallback(async (desc) => {
    setDescriptor(desc);
    setPhase('saving');
    try {
      await api.post('/face/register', { faceDescriptor: desc });
      updateUser({ faceRegistered: true });
      setPhase('done');
      toast.success('Face registered! You can now mark attendance.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please try again.');
      setPhase('error');
    }
  }, [updateUser]);

  const handleRetry = () => {
    setDescriptor(null);
    setPhase('capture');
    setErrorMsg('');
  };

  if (phase === 'done') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Face Registered!</h2>
        <p className="text-slate-500 mb-6">Your biometric data has been saved securely. You can now mark attendance using face verification.</p>
        <div className="space-y-2 text-left mb-6">
          {[
            'Face descriptor stored in database',
            'Euclidean distance matching enabled',
            'Threshold: 0.6 (strict verification)',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
              {item}
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/student')} className="btn-primary w-full btn-lg">
          Go to Dashboard →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🎭</div>
          <h1 className="text-2xl font-bold text-slate-900">Face Registration</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {user?.faceRegistered
              ? 'Update your registered face data'
              : 'Register your face to enable biometric attendance'}
          </p>
        </div>

        {/* Already registered notice */}
        {user?.faceRegistered && (
          <div className="alert-warning">
            <span>⚠️</span>
            <div>
              <p className="font-medium">Face already registered</p>
              <p className="text-xs mt-0.5 opacity-80">Capturing a new face will overwrite your existing data</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {phase === 'error' && (
          <div className="alert-error">
            <span>❌</span>
            <div className="flex-1">
              <p className="font-medium">Registration failed</p>
              <p className="text-xs mt-0.5 opacity-80">{errorMsg}</p>
            </div>
            <button onClick={handleRetry} className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200 flex-shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* Camera card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${phase === 'done' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
              {phase === 'done' ? '✓' : '1'}
            </div>
            <div>
              <p className="font-semibold text-slate-900">Capture Your Face</p>
              <p className="text-xs text-slate-500">Position your face in the frame and click the button</p>
            </div>
          </div>

          {phase === 'saving' ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="spinner w-10 h-10" />
              <p className="text-sm text-slate-600 font-medium">Saving face data to server…</p>
            </div>
          ) : (
            <FaceCapture
              mode="register"
              label="Capture & Register Face"
              onCapture={handleCapture}
              onRetry={handleRetry}
            />
          )}
        </div>

        {/* Tips card */}
        <div className="card bg-indigo-50/50 border-indigo-100">
          <p className="text-sm font-semibold text-indigo-800 mb-3">📋 Tips for best results</p>
          <div className="space-y-2">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-indigo-700">
                <span className="text-base flex-shrink-0">{tip.icon}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skip link */}
        {!user?.faceRegistered && (
          <p className="text-center text-xs text-slate-400">
            <button onClick={() => navigate('/student')} className="underline hover:text-slate-600">
              Skip for now
            </button>
            {' '}— you won't be able to mark attendance without face registration
          </p>
        )}
      </div>
    </div>
  );
}
