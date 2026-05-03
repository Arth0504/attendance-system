import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchFaculty = () => api.get('/admin/faculty').then(res => setFaculty(res.data));
  useEffect(() => { fetchFaculty(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/faculty', form);
      toast.success('Faculty member created successfully');
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create faculty');
    }
    setLoading(false);
  };

  const toggleUser = async (id) => {
    await api.patch(`/admin/users/${id}/toggle`);
    fetchFaculty();
    toast.success('Status updated');
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this faculty member?')) return;
    await api.delete(`/admin/users/${id}`);
    fetchFaculty();
    toast.success('Faculty deleted');
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty</h1>
          <p className="page-subtitle">{faculty.length} faculty members</p>
        </div>
        <button onClick={() => setShowForm(p => !p)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ Add Faculty'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card border-indigo-200 bg-indigo-50/30">
          <h2 className="section-title">Add New Faculty Member</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" placeholder="Dr. Jane Smith" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input type="email" className="input" placeholder="faculty@university.edu" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Set a strong password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <><span className="spinner w-4 h-4" /> Creating...</> : 'Create Faculty'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Faculty table */}
      <div className="card">
        <h2 className="section-title">All Faculty Members</h2>
        {faculty.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👨🏫</div>
            <p className="font-semibold text-slate-700">No faculty members yet</p>
            <p className="empty-state-text">Click "Add Faculty" to create the first one</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Faculty Member</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map(f => (
                  <tr key={f._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                          {f.name[0].toUpperCase()}
                        </div>
                        <p className="font-medium text-slate-900">{f.name}</p>
                      </div>
                    </td>
                    <td className="text-slate-500">{f.email}</td>
                    <td>
                      <span className={f.isActive ? 'badge-active' : 'badge-inactive'}>
                        {f.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleUser(f._id)} className={`btn btn-sm ${f.isActive ? 'btn-secondary' : 'btn-success'}`}>
                          {f.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteUser(f._id)} className="btn btn-sm btn-danger">Delete</button>
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
