import { useRef, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const FaceImageUpload = ({ onUploaded }) => {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!inputRef.current?.files[0]) { toast.error('Please select an image first'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('faceImage', inputRef.current.files[0]);
      const { data } = await api.post('/auth/face-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Face image uploaded successfully!');
      onUploaded?.(data.imageUrl);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-full mx-auto mb-2 border-4 border-indigo-200" />
        ) : (
          <div className="text-gray-400">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm font-medium">Click or drag & drop your face photo</p>
            <p className="text-xs mt-1">JPG, PNG, WEBP — max 5MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {preview && (
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : 'Upload Face Photo'}
          </button>
          <button
            onClick={() => { setPreview(null); inputRef.current.value = ''; }}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default FaceImageUpload;
