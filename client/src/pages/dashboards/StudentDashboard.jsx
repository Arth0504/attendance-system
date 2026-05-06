import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as faceapi from 'face-api.js';
import FaceImageUpload from '../../components/FaceImageUpload';

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const StudentDashboard = ({ activeTab }) => {
  const { user } = useAuth();
  const [records, setRecords]       = useState([]);
  const [sessions, setSessions]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [location, setLocation]     = useState(null);
  const [faceLoaded, setFaceLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState('');
  const [faceImageUrl, setFaceImageUrl] = useState(null);
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    api.get('/attendance/my').then(r => setRecords(r.data)).catch(() => {});
    api.get('/attendance/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/sessions').then(r => setSessions(r.data.filter(s => s.isActive))).catch(() => {});
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // QR Scanner lifecycle
  useEffect(() => {
    if (activeTab === 'qr') {
      const timer = setTimeout(() => {
        if (document.getElementById('qr-reader') && !scannerRef.current) {
          const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false);
          scanner.render(
            async (decodedText) => {
              try {
                const { token, subject } = JSON.parse(decodedText);
                const session = sessions.find(s => s.qrToken === token);
                if (!session) { toast.error('Invalid or expired QR code'); return; }
                await api.post('/attendance/mark', { sessionId: session._id, method: 'qr', qrToken: token, location });
                toast.success(`Attendance marked for ${subject}!`);
                scanner.clear();
                scannerRef.current = null;
                const r = await api.get('/attendance/my');
                setRecords(r.data);
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to mark attendance');
              }
            },
            () => {}
          );
          scannerRef.current = scanner;
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [activeTab]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
      await api.post('/attendance/mark', { sessionId: session._id, method: 'face', location });
      toast.success(`Face attendance marked for ${session.subject}!`);
      setFaceStatus('Attendance marked successfully!');
      stopCamera();
      const r = await api.get('/attendance/my');
      setRecords(r.data);
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
                { label: 'Total Classes', value: stats.total,       color: 'bg-blue-100 text-blue-700' },
                { label: 'Present',       value: stats.present,     color: 'bg-green-100 text-green-700' },
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {r.status}
                        </span>
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
          <SectionHeader title="QR Scan" subtitle="Scan the session QR code to mark attendance" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 w-full max-w-md mx-auto">
            {sessions.length === 0 && (
              <div className="bg-yellow-50 text-yellow-700 rounded-xl p-3 text-sm text-center mb-4 border border-yellow-100">
                No active sessions available right now
              </div>
            )}
            <div id="qr-reader" className="w-full" />
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
                <span className="text-lg">&#10003;</span>
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
