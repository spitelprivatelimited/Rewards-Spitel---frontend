import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { users as usersApi, clients as clientsApi } from '../api';
import styles from './Users.module.css';

export default function Users() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'create' | 'resetPassword', user?: {} }
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    role: 'CASHIER',
    clientId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({
    userId: '',
    userName: '',
    newPassword: '',
    confirmPassword: '',
  });

  const isAdmin = user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT';

  const load = () => {
    const params = {};
    if (!isAdmin && user?.clientId) {
      params.clientId = user.clientId;
    }
    usersApi.list(params)
      .then((r) => setList(r.data.users || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) {
      clientsApi.list()
        .then((r) => setClientList(r.data.clients || []))
        .catch(() => setClientList([]));
    }
    load();
  }, [isAdmin]);

  const openCreate = () => {
    setModal({ type: 'create' });
    setForm({
      email: '',
      password: '',
      passwordConfirm: '',
      name: '',
      role: 'CASHIER',
      clientId: isClient ? user.clientId : '',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || !form.name || !form.clientId) {
      setError('Please fill all required fields');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        clientId: form.clientId,
      };
      await usersApi.create(payload);
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await usersApi.updateStatus(userId, newStatus);
      load();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersApi.delete(userId);
      load();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const openResetPassword = (selectedUser) => {
    setModal({ type: 'resetPassword', user: selectedUser });
    setResetPasswordForm({ 
      userId: selectedUser._id,
      userName: selectedUser.name, 
      newPassword: '', 
      confirmPassword: '' 
    });
    setError('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (resetPasswordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await usersApi.resetPassword(resetPasswordForm.userId, resetPasswordForm.newPassword);
      setModal(null);
      alert('Password reset successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const filteredList = list.filter((u) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = u.name?.toLowerCase().includes(search);
      const matchesEmail = u.email?.toLowerCase().includes(search);
      if (!matchesName && !matchesEmail) return false;
    }

    if (roleFilter && u.role !== roleFilter) return false;

    if (clientFilter && u.clientId?._id !== clientFilter) return false;

    if (statusFilter && u.status !== statusFilter) return false;

    return true;
  });

  const groupedUsers = {};
  if (isAdmin) {
    filteredList.forEach((u) => {
      const clientKey = u.clientId?._id || 'no-client';
      const clientName = u.clientId?.name || 'No Client';
      if (!groupedUsers[clientKey]) {
        groupedUsers[clientKey] = { clientName, users: [] };
      }
      groupedUsers[clientKey].users.push(u);
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>{isClient ? 'Cashiers' : 'Users & Cashiers'}</h1>
        <button type="button" onClick={openCreate} className={styles.createBtn}>
          {isClient ? 'Add Cashier' : 'Add User'}
        </button>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        
        {isAdmin && (
          <>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All clients</option>
              {clientList.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All roles</option>
              <option value="CLIENT">Client</option>
              <option value="CASHIER">Cashier</option>
              <option value="ADMIN">Admin</option>
            </select>
          </>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {(searchTerm || roleFilter || clientFilter || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('');
              setClientFilter('');
              setStatusFilter('');
            }}
            className={styles.clearBtn}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : filteredList.length === 0 ? (
        <p className={styles.muted}>
          {list.length === 0 
            ? (isClient ? 'No cashiers. Add one to get started.' : 'No users. Add a cashier to get started.')
            : 'No users match your filters.'}
        </p>
      ) : isAdmin ? (
        <div>
          {Object.entries(groupedUsers).map(([clientKey, { clientName, users }]) => (
            <div key={clientKey} className={styles.clientGroup}>
              <div className={styles.clientGroupHeader}>
                <h3>{clientName}</h3>
                <span className={styles.userCount}>{users.length} {users.length === 1 ? 'user' : 'users'}</span>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td className={styles.mono}>{u.email}</td>
                        <td><span className={styles[`role_${u.role}`]}>{u.role}</span></td>
                        <td><span className={styles[`status_${u.status}`]}>{u.status}</span></td>
                        <td>
                          <button 
                            type="button" 
                            onClick={() => openResetPassword(u)} 
                            className={styles.linkBtn}
                          >
                            Reset Password
                          </button>
                          {' | '}
                          <button 
                            type="button" 
                            onClick={() => handleStatusToggle(u._id, u.status)} 
                            className={styles.linkBtn}
                          >
                            {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                          {' | '}
                          <button 
                            type="button" 
                            onClick={() => handleDelete(u._id)} 
                            className={styles.linkBtnDanger}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td className={styles.mono}>{u.email}</td>
                  <td><span className={styles[`role_${u.role}`]}>{u.role}</span></td>
                  <td><span className={styles[`status_${u.status}`]}>{u.status}</span></td>
                  <td>
                    <button 
                      type="button" 
                      onClick={() => openResetPassword(u)} 
                      className={styles.linkBtn}
                    >
                      Reset Password
                    </button>
                    {' | '}
                    <button 
                      type="button" 
                      onClick={() => handleStatusToggle(u._id, u.status)} 
                      className={styles.linkBtn}
                    >
                      {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    {' | '}
                    <button 
                      type="button" 
                      onClick={() => handleDelete(u._id)} 
                      className={styles.linkBtnDanger}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {modal.type === 'create' ? (
              <>
                <h2>{isClient ? 'Add Cashier' : 'Add User'}</h2>
                <form onSubmit={handleSubmit}>
                  {error && <div className={styles.error}>{error}</div>}
                  
                  {isAdmin && (
                    <div className={styles.field}>
                      <label>Client *</label>
                      <select
                        value={form.clientId}
                        onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                        required
                        className={styles.input}
                      >
                        <option value="">Select client</option>
                        {clientList.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={styles.field}>
                    <label>Role *</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className={styles.input}
                      disabled={isClient}
                    >
                      <option value="CASHIER">Cashier</option>
                      {isAdmin && <option value="CLIENT">Client</option>}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label>Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="John Doe"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="user@example.com"
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Password * (min 6 characters)</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className={styles.input}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      value={form.passwordConfirm}
                      onChange={(e) => setForm((f) => ({ ...f, passwordConfirm: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className={styles.input}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className={styles.actions}>
                    <button type="submit" disabled={saving} className={styles.btnPrimary}>
                      {saving ? 'Creating…' : (isClient ? 'Create Cashier' : 'Create User')}
                    </button>
                    <button type="button" onClick={() => setModal(null)} className={styles.btnSecondary}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : modal.type === 'resetPassword' ? (
              <>
                <h2>Reset Password</h2>
                <form onSubmit={handleResetPassword}>
                  {error && <div className={styles.error}>{error}</div>}
                  
                  <div className={styles.field}>
                    <label>User</label>
                    <input
                      value={resetPasswordForm.userName}
                      disabled
                      className={styles.input}
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>New Password * (min 6 characters)</label>
                    <input
                      type="password"
                      value={resetPasswordForm.newPassword}
                      onChange={(e) => setResetPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className={styles.input}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      value={resetPasswordForm.confirmPassword}
                      onChange={(e) => setResetPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className={styles.input}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className={styles.actions}>
                    <button type="submit" disabled={saving} className={styles.btnPrimary}>
                      {saving ? 'Resetting…' : 'Reset Password'}
                    </button>
                    <button type="button" onClick={() => setModal(null)} className={styles.btnSecondary}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
