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

  // QR Scanner — uses rear camera
  useEffect(() => {
    if (activeTab !== 'qr') {
      stopQRScanner();
      return;
    }

    const startScanner = async () => {
      const el = document.getElementById('qr-reader');
      if (!el || scannerRef.current) return;

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);

      try {
        await scanner.start(
          { facingMode: { exact: 'environment' } },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            try {
              await scanner.stop();
              scannerRef.current = null;
              setScanning(false);

              const { token, subject } = JSON.parse(decodedText);
              // Re-fetch active sessions at scan time for freshness
              const { data: liveSessions } = await api.get('/sessions');
              const active = liveSessions.filter(s => s.isActive);
              const session = active.find(s => s.qrToken === token);

              if (!session) {
                toast.error('Session closed by faculty');
                return;
              }

              const res = await api.post('/attendance/mark', {
                sessionId: session._id, method: 'qr', qrToken: token, location,
              });

              if (res.data._message) {
                toast(res.data._message, { icon: '⏳' });
              } else {
                toast.success(`Attendance marked for ${subject}!`);
              }
              refreshRecords();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed to mark attendance');
            }
          },
          () => {}
        );
      } catch {
        // Rear camera not available, fall back to any camera
        try {
          await scanner.start(
            { facingMode: 'user' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              try {
                await scanner.stop();
                scannerRef.current = null;
                setScanning(false);
                const { token, subject } = JSON.parse(decodedText);
                const { data: liveSessions } = await api.get('/sessions');
                const session = liveSessions.filter(s => s.isActive).find(s => s.qrToken === token);
                if (!session) { toast.error('Session closed by faculty'); return; }
                const res = await api.post('/attendance/mark', {
                  sessionId: session._id, method: 'qr', qrToken: token, location,
                });
                if (res.data._message) toast(res.data._message, { icon: '⏳' });
                else toast.success(`Attendance marked for ${subject}!`);
                refreshRecords();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to mark attendance');
              }
            },
            () => {}
          );
        } catch {
          setScanning(false);
          toast.error('Camera access denied. Please allow camera permissions.');
        }
      }
    };

    const timer = setTimeout(startScanner, 300);
    return () => {
      clearTimeout(timer);
      stopQRScanner();
    };
  }, [activeTab]);

  const stopQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
      setScanning(false);
    }
  };

  // Stop camera when leaving face tab
  useEffect(() => {
    if (activeTab !== 'face') stopCamera();
  }, [activeTab]);

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
    } catch {
      setFaceStatus('Camera access denied.');
    }
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
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) { setFaceStatus('No face detected. Please look at the camera.'); return; }

      const descriptor = Array.from(detection.descriptor);
      await api.put('/auth/face-descriptor', { descriptor });

      if (sessions.length === 0) { setFaceStatus('No active sessions available.'); return; }
      const session = sessions[0];
      const res = await api.post('/attendance/mark', { sessionId: session._id, method: 'face', location });
      if (res.data._message) {
        setFaceStatus(res.data._message);
        toast(res.data._message, { icon: '⏳' });
      } else {
        toast.success(`Face attendance marked for ${session.subject}!`);
        setFaceStatus('Attendance marked successfully!');
      }
      stopCamera();
      refreshRecords();
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
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${faceImageUrl}`}
                  alt="Uploaded face"
                  className="w-10 h-10 rounded-full object-cover border-2 border-green-300 flex-shrink-0"
                />
              </div>
            )}
          </div>
        </div>
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
                    <span className={`font-bold ${s.total ? Math.round((s.present/s.total)*100) >= 75 ? 'text-green-600' : 'text-red-500' : 'text-gray-400'}`}>
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
