import { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// Shared singleton so models only load once per session
let modelsPromise = null;
const loadModels = () => {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  }
  return modelsPromise;
};

/**
 * FaceCapture
 *
 * mode="register" — captures descriptor and calls onCapture(descriptor[])
 * mode="verify"   — captures descriptor, calls onCapture(descriptor[])
 *                   parent is responsible for calling /api/face/verify
 *                   and passing back verifyResult = { matched, confidence, distance }
 *
 * Props:
 *   mode           'register' | 'verify'
 *   label          button label
 *   onCapture      (descriptor: number[]) => void
 *   verifyResult   { matched: bool, confidence: number, distance: number } | null
 *   onRetry        () => void   — shown when verifyResult.matched === false
 */
export default function FaceCapture({
  mode = 'register',
  label,
  onCapture,
  verifyResult = null,
  onRetry,
}) {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [phase, setPhase] = useState('loading'); // loading | ready | detecting | captured | error
  const [msg, setMsg] = useState('Loading AI models…');
  const [attempts, setAttempts] = useState(0);

  const btnLabel = label ?? (mode === 'register' ? 'Register Face' : 'Verify Face');

  useEffect(() => {
    loadModels()
      .then(() => { setModelsLoaded(true); setPhase('ready'); setMsg('Position your face in the frame'); })
      .catch(() => { setPhase('error'); setMsg('Failed to load face-api models. Check your connection.'); });
  }, []);

  const capture = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded) return;
    setPhase('detecting');
    setMsg('Detecting face…');
    try {
      const video = webcamRef.current.video;
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setAttempts(p => p + 1);
        setPhase('error');
        setMsg('No face detected — ensure good lighting and look directly at the camera');
        return;
      }

      setPhase('captured');
      setMsg(mode === 'register' ? 'Face captured! Saving…' : 'Face captured! Verifying…');
      onCapture(Array.from(detection.descriptor));
    } catch {
      setPhase('error');
      setMsg('Detection error — please try again');
    }
  }, [modelsLoaded, mode, onCapture]);

  const retry = () => {
    setPhase('ready');
    setMsg('Position your face in the frame');
    onRetry?.();
  };

  // ── Derived UI state ──────────────────────────────────────────────────────
  const borderColor =
    verifyResult?.matched === true  ? 'border-emerald-400 shadow-emerald-100 shadow-lg' :
    verifyResult?.matched === false ? 'border-red-400 shadow-red-100 shadow-lg' :
    phase === 'captured'            ? 'border-indigo-400 shadow-indigo-100 shadow-lg' :
    phase === 'detecting'           ? 'border-amber-400 shadow-amber-100 shadow-lg' :
    phase === 'error'               ? 'border-red-300' :
    'border-slate-200';

  const pillStyle =
    phase === 'loading'   ? 'bg-slate-50 border-slate-200 text-slate-600' :
    phase === 'ready'     ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
    phase === 'detecting' ? 'bg-amber-50 border-amber-200 text-amber-700' :
    phase === 'captured'  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
    'bg-red-50 border-red-200 text-red-700';

  const pillIcon =
    phase === 'loading'   ? '⏳' :
    phase === 'ready'     ? '📷' :
    phase === 'detecting' ? '🔍' :
    phase === 'captured'  ? '⏳' :
    '❌';

  const showVerifyResult = verifyResult !== null;
  const confidence = verifyResult?.confidence ?? 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full">

      {/* ── Camera frame ── */}
      <div className="relative">
        <div className={`rounded-2xl overflow-hidden border-2 transition-all duration-300 ${borderColor}`}>
          <Webcam
            ref={webcamRef}
            width={320}
            height={240}
            mirrored
            videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
            className="block bg-slate-900"
          />

          {/* Corner alignment guides */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              'top-3 left-3 border-t-2 border-l-2 rounded-tl',
              'top-3 right-3 border-t-2 border-r-2 rounded-tr',
              'bottom-3 left-3 border-b-2 border-l-2 rounded-bl',
              'bottom-3 right-3 border-b-2 border-r-2 rounded-br',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-6 h-6 border-white/70 ${cls}`} />
            ))}
          </div>

          {/* Detecting spinner overlay */}
          {phase === 'detecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">Scanning…</span>
              </div>
            </div>
          )}

          {/* Verify result overlay */}
          {showVerifyResult && (
            <div className={`absolute inset-0 flex items-center justify-center ${verifyResult.matched ? 'bg-emerald-500/20' : 'bg-red-500/20'} backdrop-blur-[1px]`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl ${verifyResult.matched ? 'bg-emerald-500' : 'bg-red-500'}`}>
                <span className="text-white text-3xl">{verifyResult.matched ? '✓' : '✗'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Attempt counter badge */}
        {attempts > 0 && phase !== 'captured' && !showVerifyResult && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {attempts}
          </div>
        )}
      </div>

      {/* ── Status pill ── */}
      {!showVerifyResult && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${pillStyle}`}>
          <span>{pillIcon}</span>
          <span>{msg}</span>
        </div>
      )}

      {/* ── Verify result card ── */}
      {showVerifyResult && (
        <div className={`w-full max-w-xs rounded-2xl border-2 p-4 text-center ${verifyResult.matched ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          <p className={`text-lg font-bold mb-1 ${verifyResult.matched ? 'text-emerald-700' : 'text-red-700'}`}>
            {verifyResult.matched ? '✅ Face Matched' : '❌ Face Not Matched'}
          </p>
          <p className="text-xs text-slate-500 mb-3">{verifyResult.matched ? 'Identity confirmed' : 'Could not verify your identity'}</p>

          {/* Confidence meter */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Confidence</span>
              <span className="font-semibold">{confidence.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${confidence >= 60 ? 'bg-emerald-500' : confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(confidence, 100)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">Distance: {verifyResult.distance?.toFixed(4)} (threshold: 0.6)</p>
        </div>
      )}

      {/* ── Action buttons ── */}
      {!showVerifyResult && (
        <button
          onClick={capture}
          disabled={!modelsLoaded || phase === 'detecting' || phase === 'captured'}
          className="btn-primary btn-lg w-full max-w-xs"
        >
          {phase === 'detecting' ? (
            <><span className="spinner w-4 h-4" /> Detecting…</>
          ) : phase === 'captured' ? (
            <><span className="spinner w-4 h-4" /> Processing…</>
          ) : (
            btnLabel
          )}
        </button>
      )}

      {/* Retry after failed verify */}
      {showVerifyResult && !verifyResult.matched && (
        <button onClick={retry} className="btn-secondary w-full max-w-xs">
          🔄 Try Again
        </button>
      )}

      {/* Retry after detection error */}
      {phase === 'error' && (
        <button onClick={retry} className="btn-ghost text-sm text-slate-500">
          🔄 Retry capture
        </button>
      )}
    </div>
  );
}
