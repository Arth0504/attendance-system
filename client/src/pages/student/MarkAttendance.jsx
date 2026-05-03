import { useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import QRScanner from '../../components/QRScanner';
import FaceCapture from '../../components/FaceCapture';
import FaceGuard from '../../components/FaceGuard';

const STEPS = [
  { id: 'qr',     label: 'Scan QR',  icon: '🔲' },
  { id: 'gps',    label: 'Location', icon: '📍' },
  { id: 'face',   label: 'Face',     icon: '🎭' },
  { id: 'submit', label: 'Submit',   icon: '✅' },
];

function StepDot({ index, current }) {
  const done = index < current;
  const active = index === current;
  return (
    <div className={`step-dot ${done ? 'step-dot-done' : active ? 'step-dot-active' : 'step-dot-idle'}`}>
      {done ? '✓' : index + 1}
    </div>
  );
}

function MarkAttendanceInner() {
  const [step, setStep] = useState(0);
  const [qrData, setQrData] = useState(null);
  const [location, setLocation] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null); // { matched, confidence, distance }
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // ── Step 0: QR ────────────────────────────────────────────────────────────
  const handleQRScan = useCallback((data) => {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.sessionId || !parsed.token) { toast.error('Invalid QR code'); return; }
      setQrData(parsed);
      setTimeout(() => setStep(1), 700);
    } catch {
      toast.error('Could not read QR code');
    }
  }, []);

  // ── Step 1: GPS ───────────────────────────────────────────────────────────
  const getLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        toast.success('Location captured!');
        setGettingLocation(false);
      },
      () => { toast.error('Location denied — please enable GPS'); setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Step 2: Face capture → verify via API ─────────────────────────────────
  const handleFaceCapture = useCallback(async (descriptor) => {
    setFaceDescriptor(descriptor);
    setVerifying(true);
    try {
      const res = await api.post('/face/verify', { faceDescriptor: descriptor });
      const vr = { matched: res.data.matched, confidence: res.data.confidence, distance: res.data.distance };
      setVerifyResult(vr);
      if (vr.matched) {
        toast.success(`Face verified! Confidence: ${vr.confidence.toFixed(1)}%`);
        setTimeout(() => setStep(3), 1200);
      } else {
        toast.error('Face verification failed — please try again');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification error';
      toast.error(msg);
      setVerifyResult({ matched: false, confidence: 0, distance: 1, error: msg });
    }
    setVerifying(false);
  }, []);

  const handleFaceRetry = () => {
    setFaceDescriptor(null);
    setVerifyResult(null);
  };

  // ── Step 3: Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/attendance/mark', {
        sessionId: qrData.sessionId,
        qrToken: qrData.token,
        latitude: location.latitude,
        longitude: location.longitude,
        faceDescriptor,
      });
      setResult({ success: true, message: res.data.message });
    } catch (err) {
      const errData = err.response?.data;
      setResult({ success: false, message: errData?.message, details: errData?.details });
    }
    setSubmitting(false);
  };

  const reset = () => {
    setStep(0); setQrData(null); setLocation(null);
    setFaceDescriptor(null); setVerifyResult(null); setResult(null);
  };

  // ── Result screen ─────────────────────────────────────────────────────────
  if (result) return (
    <div className="max-w-md mx-auto mt-8">
      <div className={`card text-center border-2 ${result.success ? 'border-emerald-300 bg-emerald-50/50' : 'border-red-300 bg-red-50/50'}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 ${result.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
          {result.success ? '✅' : '❌'}
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          {result.success ? 'Attendance Marked!' : 'Verification Failed'}
        </h2>
        <p className="text-slate-600 text-sm mb-5">{result.message}</p>

        {result.details && (
          <div className="text-left space-y-2 mb-5 bg-white rounded-xl p-4 border border-slate-200">
            {Object.entries(result.details).map(([k, v]) => (
              <div key={k} className="flex items-start gap-3 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${v.startsWith('Passed') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {v.startsWith('Passed') ? '✓' : '✗'}
                </span>
                <div className="flex-1">
                  <span className="capitalize font-semibold text-slate-700">{k}: </span>
                  <span className={v.startsWith('Passed') ? 'text-emerald-600' : 'text-red-600'}>{v}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={reset} className="btn-primary w-full">
          {result.success ? 'Done' : 'Try Again'}
        </button>
      </div>
    </div>
  );

  // ── Main wizard ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">Complete all 4 verification steps</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="card py-4 px-6">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <StepDot index={i} current={step} />
                <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${i < step ? 'bg-indigo-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 0: QR ── */}
      {step === 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🔲</div>
            <div>
              <h2 className="font-semibold text-slate-900">Step 1: Scan QR Code</h2>
              <p className="text-sm text-slate-500">Point your camera at the session QR code displayed by your faculty</p>
            </div>
          </div>
          <QRScanner onScan={handleQRScan} />
          {qrData && (
            <div className="mt-4 alert-success">
              <span>✅</span>
              <p className="text-sm font-medium">QR scanned! Moving to location check…</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: GPS ── */}
      {step === 1 && (
        <div className="card text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📍</div>
          <h2 className="font-semibold text-slate-900 text-lg mb-1">Step 2: Verify Location</h2>
          <p className="text-sm text-slate-500 mb-5">
            Allow location access to confirm you're within the classroom radius
          </p>
          {location ? (
            <div className="space-y-3">
              <div className="alert-success text-left">
                <span>✅</span>
                <div>
                  <p className="font-medium">Location captured</p>
                  <p className="text-xs opacity-80 mt-0.5 font-mono">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full">
                Continue to Face Verification →
              </button>
            </div>
          ) : (
            <button onClick={getLocation} disabled={gettingLocation} className="btn-primary btn-lg">
              {gettingLocation
                ? <><span className="spinner w-4 h-4" /> Getting location…</>
                : '📍 Get My Location'}
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Face ── */}
      {step === 2 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🎭</div>
            <div>
              <h2 className="font-semibold text-slate-900">Step 3: Face Verification</h2>
              <p className="text-sm text-slate-500">
                {verifying ? 'Comparing with registered face…' : 'Look directly at the camera in good lighting'}
              </p>
            </div>
          </div>

          {verifying ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="spinner w-10 h-10" />
              <p className="text-sm text-slate-600 font-medium">Verifying identity with server…</p>
            </div>
          ) : (
            <FaceCapture
              mode="verify"
              label="Verify My Face"
              onCapture={handleFaceCapture}
              verifyResult={verifyResult}
              onRetry={handleFaceRetry}
            />
          )}

          {/* Proceed button after successful verify */}
          {verifyResult?.matched && (
            <button onClick={() => setStep(3)} className="btn-success w-full mt-4">
              Continue to Submit →
            </button>
          )}
        </div>
      )}

      {/* ── Step 3: Submit ── */}
      {step === 3 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">✅</div>
            <div>
              <h2 className="font-semibold text-slate-900">Step 4: Submit Attendance</h2>
              <p className="text-sm text-slate-500">All verifications passed — ready to submit</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {[
              { label: 'QR Code', value: 'Scanned & validated', icon: '🔲', ok: true },
              { label: 'GPS Location', value: `${location?.latitude?.toFixed(5)}, ${location?.longitude?.toFixed(5)}`, icon: '📍', ok: true },
              { label: 'Face', value: `Verified (${verifyResult?.confidence?.toFixed(1)}% confidence)`, icon: '🎭', ok: true },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-500 truncate">{item.value}</p>
                </div>
                <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary btn-lg w-full">
            {submitting
              ? <><span className="spinner w-4 h-4" /> Submitting…</>
              : '✓ Mark My Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}

// Wrap with FaceGuard so unregistered students are blocked
export default function MarkAttendance() {
  return (
    <FaceGuard>
      <MarkAttendanceInner />
    </FaceGuard>
  );
}
