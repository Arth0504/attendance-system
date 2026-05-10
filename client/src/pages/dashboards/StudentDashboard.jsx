import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import * as faceapi from 'face-api.js';
import FaceImageUpload from '../../components/FaceImageUpload';

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    present: 'bg-green-100 text-green-700',
    absent:  'bg-red-100 text-red-600',
    pending: 'bg-yellow-100 text-yellow-700',
    late:    'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
};

// Approval Request Modal
const ApprovalModal = ({ data, onSubmit, onCancel }) => {
  const [reason, setReason] = useState('');
  const [note, setNote]     = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    'Internet/connectivity issue',
    'Medical emergency',
    'Transport delay',
    'Family emergency',
    'Working remotely',
    'Other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) { toast.error('Please select a reason'); return; }
    setLoading(true);
    await onSubmit({ reason, note });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Outside Campus</h3>
              <p className="text-xs text-gray-500">Send an approval request to your faculty</p>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
          <p className="text-xs text-yellow-800 font-medium">
            📍 You are <span className="font-bold">{data.distance}m</span> away from campus
            ({data.subject} — {data.department})
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Your attendance will be marked as <span className="font-semibold">Pending</span> until faculty approves.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Reason select */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map(r => (
                <button
                  key={r} type="button"
                  onClick={() => setReason(r)}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    reason === r
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Optional note */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Additional Note <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Add any additional context for your faculty..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading || !reason}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Requests Tab — standalone component that fetches its own data
const RequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/attendance/my')
      .then(r => {
        // Show only records that were submitted as approval requests (have a reason)
        // or are still pending
        const reqs = r.data.filter(rec => rec.approvalReason || rec.status === 'pending');
        setRequests(reqs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusConfig = {
    pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    present:  { label: 'Approved', cls: 'bg-green-100  text-green-700  border-green-200'  },
    absent:   { label: 'Rejected', cls: 'bg-red-100    text-red-600    border-red-200'    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="My Requests" subtitle="Track your attendance approval requests" />

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-600">No requests submitted yet</p>
          <p className="text-sm text-gray-400 mt-1">Approval requests appear here when you are outside campus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const cfg = statusConfig[r.status] || statusConfig.pending;
            return (
              <div
                key={r._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {/* Status badge — left accent */}
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold border ${cfg.cls}`}>
                      {r.status === 'pending' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5 animate-pulse" />
                      )}
                      {cfg.label}
                    </span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">{r.sessionId?.subject || 'Unknown Subject'}</p>
                      <span className="text-xs text-gray-400">{r.sessionId?.department}</span>
                    </div>

                    {/* Reason */}
                    {r.approvalReason && (
                      <div className="flex items-start gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-gray-500 mt-0.5 flex-shrink-0">Reason:</span>
                        <span className="text-xs text-gray-700">{r.approvalReason}</span>
                      </div>
                    )}

                    {/* Note */}
                    {r.approvalNote && (
                      <div className="flex items-start gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-gray-500 mt-0.5 flex-shrink-0">Note:</span>
                        <span className="text-xs text-gray-500 italic">{r.approvalNote}</span>
                      </div>
                    )}

                    {/* Distance + date */}
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {r.distanceFromCampus != null && (
                        <span className="text-xs text-gray-400">
                          📍 {r.distanceFromCampus}m from campus
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        🕐 {new Date(r.timestamp).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        via {r.method}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Faculty decision banner */}
                {r.status === 'present' && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                    </svg>
                    <p className="text-xs text-green-700 font-medium">Faculty approved your attendance request</p>
                  </div>
                )}
                {r.status === 'absent' && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p className="text-xs text-red-600 font-medium">Faculty rejected your attendance request</p>
                  </div>
                )}
                {r.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs text-yellow-700 font-medium">Awaiting faculty review</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StudentDashboard = ({ activeTab }) => {
  const { user } = useAuth();
  const [records, setRecords]       = useState([]);
  const [sessions, setSessions]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [location, setLocation]     = useState(null);
  const [faceLoaded, setFaceLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState('');
  const [faceImageUrl, setFaceImageUrl] = useState(null);
  const [scanning, setScanning]     = useState(false);
  // Pending approval modal state
  const [approvalModal, setApprovalModal] = useState(null); // { sessionId, qrToken, method, subject, department, distance }
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const scannerRef = useRef(null);

  const refreshRecords = () => {
    api.get('/attendance/my').then(r => setRecords(r.data)).catch(() => {});
    api.get('/attendance/stats').then(r => setStats(r.data)).catch(() => {});
  };

  useEffect(() => {
    refreshRecords();
    api.get('/sessions').then(r => setSessions(r.data.filter(s => s.isActive))).catch(() => {});
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Helper: attempt to mark attendance; if outside campus, open modal instead
  const attemptMark = async ({ sessionId, qrToken, method, subject, department }) => {
    try {
      const res = await api.post('/attendance/mark', {
        sessionId, method, qrToken, location,
      });
      if (res.data.status === 'pending') {
        // Show what happened but don't open modal — already submitted without reason
        toast('Attendance pending faculty approval.', { icon: '⏳' });
      } else {
        toast.success(`Attendance marked for ${subject}!`);
      }
      refreshRecords();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      // If outside radius, backend returns 400 with distanceFromCampus hint — open modal
      if (msg.includes('outside') || err.response?.data?.distanceFromCampus) {
        setApprovalModal({
          sessionId, qrToken, method, subject, department,
          distance: err.response?.data?.distanceFromCampus || '?',
        });
      } else {
        toast.error(msg || 'Failed to mark attendance');
      }
    }
  };

  // Submit approval request with reason/note
  const handleApprovalSubmit = async ({ reason, note }) => {
    if (!approvalModal) return;
    try {
      const res = await api.post('/attendance/mark', {
        sessionId:      approvalModal.sessionId,
        method:         approvalModal.method,
        qrToken:        approvalModal.qrToken,
        location,
        approvalReason: reason,
        approvalNote:   note,
      });
      setApprovalModal(null);
      toast('Approval request sent. Pending faculty review.', { icon: '⏳' });
      refreshRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  // QR Scanner — uses rear camera
  useEffect(() => {
    if (activeTab !== 'qr') { stopQRScanner(); return; }

    const startScanner = async () => {
      const el = document.getElementById('qr-reader');
      if (!el || scannerRef.current) return;

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);

      const onScan = async (decodedText) => {
        try {
          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);

          const { token, subject } = JSON.parse(decodedText);
          const { data: liveSessions } = await api.get('/sessions');
          const session = liveSessions.filter(s => s.isActive).find(s => s.qrToken === token);

          if (!session) { toast.error('Session closed by faculty'); return; }

          await attemptMark({
            sessionId:  session._id,
            qrToken:    token,
            method:     'qr',
            subject:    session.subject,
            department: session.department,
          });
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to mark attendance');
        }
      };

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      try {
        await scanner.start({ facingMode: { exact: 'environment' } }, config, onScan, () => {});
      } catch {
        try {
          await scanner.start({ facingMode: 'user' }, config, onScan, () => {});
        } catch {
          setScanning(false);
          toast.error('Camera access denied. Please allow camera permissions.');
        }
      }
    };

    const timer = setTimeout(startScanner, 300);
    return () => { clearTimeout(timer); stopQRScanner(); };
  }, [activeTab]);

  const stopQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
      setScanning(false);
    }
  };

  useEffect(() => { if (activeTab !== 'face') stopCamera(); }, [activeTab]);

  const loadFaceModels = async () => {
    setFaceStatus('Loading face models...');
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setFaceLoaded(true);
      setFaceStatus('Models loaded. Starting camera...');
      startCamera();
    } catch {
      setFaceStatus('Failed to load face models. Check internet connection.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setFaceStatus('Camera ready. Click "Capture & Mark" to mark attendance.');
      }
    } catch { setFaceStatus('Camera access denied.'); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleFaceAttendance = async () => {
    if (!faceLoaded || !videoRef.current) return;
    setFaceStatus('Detecting face...');
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks().withFaceDescriptor();
      if (!detection) { setFaceStatus('No face detected. Please look at the camera.'); return; }

      await api.put('/auth/face-descriptor', { descriptor: Array.from(detection.descriptor) });

      if (sessions.length === 0) { setFaceStatus('No active sessions available.'); return; }
      const session = sessions[0];

      await attemptMark({
        sessionId:  session._id,
        method:     'face',
        subject:    session.subject,
        department: session.department,
      });
      setFaceStatus('Done.');
      stopCamera();
    } catch (err) {
      setFaceStatus(err.response?.data?.message || 'Face recognition failed.');
    }
  };

  const chartData = stats?.bySubject?.map(s => ({
    subject: s._id?.slice(0, 10) || 'Unknown',
    present: s.present,
    total:   s.total,
  })) || [];

  return (
    <div className="max-w-5xl mx-auto">

      {/* Approval Request Modal */}
      {approvalModal && (
        <ApprovalModal
          data={approvalModal}
          onSubmit={handleApprovalSubmit}
          onCancel={() => setApprovalModal(null)}
        />
      )}

      {/* RECORDS TAB */}
      {activeTab === 'records' && (
        <div>
          <SectionHeader title="My Records" subtitle="Your personal attendance history" />
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Classes', value: stats.total,   color: 'bg-blue-100 text-blue-700' },
                { label: 'Present',       value: stats.present, color: 'bg-green-100 text-green-700' },
                { label: 'Attendance %',  value: `${stats.percentage}%`,
                  color: stats.percentage >= 75 ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-600' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl p-4 sm:p-5 ${s.color} text-center`}>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-sm font-medium opacity-80 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Subject', 'Department', 'Status', 'Method', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.sessionId?.subject}</td>
                      <td className="px-4 py-3 text-gray-500">{r.sessionId?.department}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge status={r.status} />
                          {r.status === 'pending' && r.approvalReason && (
                            <span className="text-xs text-gray-400 mt-0.5">Reason: {r.approvalReason}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-500">{r.method}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(r.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No attendance records yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QR TAB */}
      {activeTab === 'qr' && (
        <div>
          <SectionHeader title="QR Scan" subtitle="Point your rear camera at the session QR code" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 w-full max-w-md mx-auto">
            {sessions.length === 0 && (
              <div className="bg-yellow-50 text-yellow-700 rounded-xl p-3 text-sm text-center mb-4 border border-yellow-100">
                No active sessions available right now
              </div>
            )}
            {scanning && (
              <div className="text-center text-xs text-indigo-600 mb-3 font-medium">
                📷 Rear camera active — point at QR code
              </div>
            )}
            <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
          </div>
        </div>
      )}

      {/* FACE TAB */}
      {activeTab === 'face' && (
        <div>
          <SectionHeader title="Face ID" subtitle="Mark attendance using face recognition" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 w-full max-w-md mx-auto">
            {faceStatus && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-700 text-center">{faceStatus}</p>
              </div>
            )}
            <div className="relative mb-4 bg-gray-100 rounded-xl overflow-hidden" style={{ minHeight: 240 }}>
              <video ref={videoRef} autoPlay muted className="w-full rounded-xl" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            </div>
            {sessions.length === 0 && (
              <div className="bg-yellow-50 text-yellow-700 rounded-xl p-3 text-sm mb-4 border border-yellow-100 text-center">
                No active sessions available
              </div>
            )}
            <div className="flex gap-3 justify-center">
              {!faceLoaded ? (
                <button onClick={loadFaceModels}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold">
                  Start Face ID
                </button>
              ) : (
                <button onClick={handleFaceAttendance} disabled={sessions.length === 0}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  Capture &amp; Mark Attendance
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD TAB */}
      {activeTab === 'upload' && (
        <div>
          <SectionHeader title="Upload Photo" subtitle="Register your face photo for face recognition attendance" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 w-full max-w-md mx-auto">
            <FaceImageUpload onUploaded={(url) => setFaceImageUrl(url)} />
            {faceImageUrl && (
              <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 text-sm text-green-700 flex items-center gap-3">
                <span className="text-lg">✓</span>
                <span className="flex-1">Face photo registered successfully!</span>
                <img
                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${faceImageUrl}`}
                  alt="Uploaded face"
                  className="w-10 h-10 rounded-full object-cover border-2 border-green-300 flex-shrink-0"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUESTS TAB */}
      {activeTab === 'requests' && (
        <RequestsTab />
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div>
          <SectionHeader title="Analytics" subtitle="Your attendance breakdown by subject" />
          {stats?.bySubject?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {stats.bySubject.map(s => (
                <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="font-semibold text-gray-800 truncate mb-2">{s._id}</p>
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{s.present} / {s.total} classes</span>
                    <span className={`font-bold ${s.total && Math.round((s.present/s.total)*100) >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                      {s.total ? Math.round((s.present / s.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${s.total && Math.round((s.present/s.total)*100) >= 75 ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${s.total ? Math.round((s.present / s.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            {chartData.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <p className="text-lg mb-1">No data yet</p>
                <p className="text-sm">Attendance data will appear here once you have records</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} barGap={4}>
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="present" name="Present" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="total"   name="Total"   fill="#e0e7ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
