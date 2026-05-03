import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);

  const fetchStudents = () => api.get('/admin/students').then(res => setStudents(res.data));
  useEffect(() => { fetchStudents(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a CSV file first');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/admin/upload-students', formData);
      setUploadResult(res.data);
      toast.success(res.data.message);
      fetchStudents();
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
  };

  const toggleUser = async (id) => {
    await api.patch(`/admin/users/${id}/toggle`);
    fetchStudents();
    toast.success('Status updated');
  };

  const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    await api.delete(`/admin/users/${id}`);
    fetchStudents();
    toast.success('Student deleted');
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} students enrolled</p>
        </div>
      </div>

      {/* CSV Upload */}
      <div className="card">
        <h2 className="section-title">Upload Students via CSV</h2>
        <div className="alert-info mb-4">
          <span>ℹ️</span>
          <div>
            <p className="font-medium">CSV Format</p>
            <code className="text-xs mt-0.5 block">name,email,rollNo</code>
            <p className="text-xs mt-0.5 opacity-80">Each student's password will be set to their Roll No</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              file ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => { setFile(e.target.files[0]); setUploadResult(null); }}
            />
            <div className="text-3xl mb-2">{file ? '📄' : '📁'}</div>
            {file ? (
              <div>
                <p className="font-semibold text-indigo-700">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-slate-700">Click to select CSV file</p>
                <p className="text-xs text-slate-400 mt-1">or drag and drop here</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={!file || uploading} className="btn-primary">
              {uploading ? <><span className="spinner w-4 h-4" /> Uploading...</> : '⬆ Upload Students'}
            </button>
            {file && (
              <button type="button" onClick={() => { setFile(null); setUploadResult(null); }} className="btn-secondary">
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Upload result */}
        {uploadResult && (
          <div className="mt-4 space-y-3">
            <div className="alert-success">
              <span>✅</span>
              <p className="font-medium">{uploadResult.message}</p>
            </div>
            {uploadResult.created?.length > 0 && (
              <div className="table-wrapper">
                <table className="table text-xs">
                  <thead><tr><th>Name</th><th>Email</th><th>Username</th><th>Password</th></tr></thead>
                  <tbody>
                    {uploadResult.created.map((s, i) => (
                      <tr key={i}>
                        <td className="font-medium">{s.name}</td>
                        <td>{s.email}</td>
                        <td><code className="bg-slate-100 px-1.5 py-0.5 rounded">{s.username}</code></td>
                        <td><code className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{s.password}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {uploadResult.errors?.length > 0 && (
              <div className="alert-error">
                <span>⚠️</span>
                <div className="space-y-0.5">{uploadResult.errors.map((e, i) => <p key={i} className="text-xs">{e}</p>)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Students table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="section-title mb-0 flex-1">All Students</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              className="input pl-8 w-full sm:w-56 py-2"
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👨🎓</div>
            <p className="font-semibold text-slate-700">{search ? 'No results found' : 'No students yet'}</p>
            <p className="empty-state-text">{search ? 'Try a different search term' : 'Upload a CSV to add students'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Face</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                          {s.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{s.rollNo}</code></td>
                    <td>
                      <span className={`badge ${s.faceRegistered ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {s.faceRegistered ? '✓ Registered' : '✗ Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={s.isActive ? 'badge-active' : 'badge-inactive'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleUser(s._id)} className={`btn btn-sm ${s.isActive ? 'btn-secondary' : 'btn-success'}`}>
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteUser(s._id)} className="btn btn-sm btn-danger">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
