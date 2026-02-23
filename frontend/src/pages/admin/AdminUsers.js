import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const INIT = { username:'', email:'', full_name:'', department:'', role:'student', password:'password123' };
const ROLES = ['student', 'teacher', 'admin'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(INIT);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const reload = () => api.get('/admin/users').then(r => { setUsers(r.data); setLoading(false); });

  useEffect(() => { reload(); }, []);

  const openCreate = () => { setForm(INIT); setEditUser(null); setShowModal(true); };
  const openEdit = (u) => {
    setForm({ username:u.username, email:u.email, full_name:u.full_name||'', department:u.department||'', role:u.role, password:'' });
    setEditUser(u);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editUser) {
        await api.put(`/admin/users/${editUser.id}`, form);
        showMsg('User updated!');
      } else {
        await api.post('/admin/users', form);
        showMsg('User created!');
      }
      setShowModal(false);
      reload();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const deactivate = async (uid) => {
    if (!window.confirm('Deactivate this user?')) return;
    await api.delete(`/admin/users/${uid}`);
    showMsg('User deactivated');
    reload();
  };

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const upd = k => e => setForm({...form, [k]: e.target.value});

  const filtered = users.filter(u => {
    const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name||'').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadge = { admin:'badge-amber', teacher:'badge-purple', student:'badge-blue' };
  const roleIcon = { admin:'⚙️', teacher:'👨‍🏫', student:'🎓' };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{fontSize:26,fontWeight:800}}>User Management</h1>
          <p className="text-muted text-sm" style={{marginTop:4}}>{users.length} total users</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      {msg && <div className="alert alert-success">✓ {msg}</div>}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input className="form-input" style={{maxWidth:300}} placeholder="🔍 Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="tabs" style={{marginBottom:0, width:'auto'}}>
          {['all','student','teacher','admin'].map(r => (
            <button key={r} className={`tab-btn ${roleFilter===r?'active':''}`} onClick={() => setRoleFilter(r)} style={{flex:'none', padding:'8px 14px'}}>
              {r === 'all' ? 'All' : roleIcon[r] + ' ' + r.charAt(0).toUpperCase() + r.slice(1)}
              {' '}
              <span style={{opacity:0.7,fontSize:11}}>({r === 'all' ? users.length : users.filter(u => u.role===r).length})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div style={{width:34,height:34,borderRadius:8,background:'var(--gradient-primary)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'white',flexShrink:0}}>
                      {(u.full_name||u.username||'?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{u.full_name || u.username}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)'}}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${roleBadge[u.role]}`}>{roleIcon[u.role]} {u.role}</span></td>
                <td style={{fontSize:13}}>{u.department || '—'}</td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                    {u.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </td>
                <td style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                    {u.is_active && <button className="btn btn-danger btn-sm" onClick={() => deactivate(u.id)}>Deactivate</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{fontSize:20,fontWeight:800,marginBottom:20}}>{editUser ? 'Edit User' : 'Create New User'}</h2>
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.full_name} onChange={upd('full_name')} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input className="form-input" value={form.username} onChange={upd('username')} placeholder="username" required disabled={!!editUser} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={upd('email')} placeholder="email@university.edu" required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-select" value={form.role} onChange={upd('role')}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={upd('department')} placeholder="Department" />
                </div>
              </div>
              {!editUser && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" value={form.password} onChange={upd('password')} placeholder="Default: password123" />
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : editUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}