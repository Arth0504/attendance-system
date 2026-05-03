import { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('starting');
  const [statusMsg, setStatusMsg] = useState('Starting camera...');
  const animRef = useRef(null);

  useEffect(() => {
    let stream;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        videoRef.current.srcObject = s;
        videoRef.current.play();
        setScanning(true);
        setStatus('scanning');
        setStatusMsg('Point camera at the QR code');
      })
      .catch(() => { setStatus('error'); setStatusMsg('Camera access denied — please allow camera permissions'); });
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const scan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        setStatus('success');
        setStatusMsg('QR Code detected!');
        onScan(code.data);
        return;
      }
    }
    animRef.current = requestAnimationFrame(scan);
  }, [scanning, onScan]);

  useEffect(() => {
    if (scanning) animRef.current = requestAnimationFrame(scan);
  }, [scanning, scan]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative">
        <div className={`rounded-2xl overflow-hidden border-2 transition-colors duration-300 ${
          status === 'success' ? 'border-emerald-400 shadow-lg shadow-emerald-100' :
          status === 'error'   ? 'border-red-400' :
          'border-indigo-300'
        }`}>
          <video
            ref={videoRef}
            className="w-72 h-56 object-cover block bg-slate-900"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning overlay */}
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-3 border-l-3 border-indigo-400 rounded-tl-lg" style={{ borderWidth: '3px 0 0 3px' }} />
              <div className="absolute top-4 right-4 w-8 h-8 border-indigo-400 rounded-tr-lg" style={{ borderWidth: '3px 3px 0 0' }} />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-indigo-400 rounded-bl-lg" style={{ borderWidth: '0 0 3px 3px' }} />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-indigo-400 rounded-br-lg" style={{ borderWidth: '0 3px 3px 0' }} />
              {/* Scan line */}
              <div className="absolute left-4 right-4 h-0.5 bg-indigo-400/70 animate-bounce" style={{ top: '50%' }} />
            </div>
          )}

          {/* Success overlay */}
          {status === 'success' && (
            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${
        status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
        status === 'error'   ? 'bg-red-50 border-red-200 text-red-700' :
        status === 'scanning'? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
        'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <span>{status === 'success' ? '✅' : status === 'error' ? '❌' : status === 'scanning' ? '🔍' : '⏳'}</span>
        <span>{statusMsg}</span>
      </div>
    </div>
  );
}
