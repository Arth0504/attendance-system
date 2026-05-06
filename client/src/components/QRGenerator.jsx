import { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

const QRGenerator = ({ value, subject, sessionId, size = 200 }) => {
  const [qrSize, setQrSize] = useState(size);
  const [fgColor, setFgColor] = useState('#312e81');
  const [bgColor, setBgColor] = useState('#ffffff');
  const canvasRef = useRef(null);

  const downloadQR = () => {
    const canvas = document.getElementById(`qr-canvas-${sessionId}`);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${subject?.replace(/\s+/g, '_') || 'session'}.png`;
    a.click();
  };

  if (!value) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Session QR Code</h4>
        <span className="text-xs text-gray-400">{subject}</span>
      </div>

      <div className="flex justify-center p-3 bg-gray-50 rounded-lg">
        <QRCodeSVG
          value={value}
          size={qrSize}
          fgColor={fgColor}
          bgColor={bgColor}
          level="H"
          includeMargin
        />
        {/* Hidden canvas for download */}
        <div className="hidden">
          <QRCodeCanvas
            id={`qr-canvas-${sessionId}`}
            value={value}
            size={256}
            fgColor={fgColor}
            bgColor={bgColor}
            level="H"
            includeMargin
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <label className="block text-gray-500 mb-1">Size</label>
          <input
            type="range" min={100} max={300} step={10}
            value={qrSize}
            onChange={e => setQrSize(+e.target.value)}
            className="w-full accent-indigo-600"
          />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">QR Color</label>
          <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
            className="w-full h-8 rounded cursor-pointer border border-gray-200" />
        </div>
        <div>
          <label className="block text-gray-500 mb-1">Background</label>
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
            className="w-full h-8 rounded cursor-pointer border border-gray-200" />
        </div>
      </div>

      <button
        onClick={downloadQR}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
      >
        ⬇ Download QR Code
      </button>
    </div>
  );
};

export default QRGenerator;
