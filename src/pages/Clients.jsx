import React, { useState, useEffect } from 'react';
import { clients as clientsApi } from '../api';
import styles from './Clients.module.css';

export default function Clients() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'create' | 'edit', client?: {} }
  const [form, setForm] = useState({
    name: '',
    posApiKey: '',
    status: 'ACTIVE',
    clientLoginEmail: '',
    clientLoginPassword: '',
    clientLoginPasswordConfirm: '',
    clientLoginName: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    clientsApi.list()
      .then((r) => setList(r.data.clients || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const openCreate = () => {
    setModal({ type: 'create' });
    setForm({
      name: '',
      posApiKey: '',
      status: 'ACTIVE',
      clientLoginEmail: '',
      clientLoginPassword: '',
      clientLoginPasswordConfirm: '',
      clientLoginName: '',
    });
    setError('');
  };

  const openEdit = (client) => {
    setModal({ type: 'edit', client });
    setForm({
      name: client.name,
      posApiKey: client.posApiKey,
      status: client.status || 'ACTIVE',
      clientLoginEmail: '',
      clientLoginPassword: '',
      clientLoginPasswordConfirm: '',
      clientLoginName: '',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const hasLogin = form.clientLoginEmail || form.clientLoginPassword || form.clientLoginName;
    if (hasLogin) {
      if (!form.clientLoginEmail || !form.clientLoginPassword || !form.clientLoginName) {
        setError('To add a login, fill email, password and name');
        return;
      }
      if (form.clientLoginPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (form.clientLoginPassword !== form.clientLoginPasswordConfirm) {
        setError('Passwords do not match');
        return;
      }
    }
    setSaving(true);
    try {
      if (modal.type === 'create') {
        const payload = {
          name: form.name,
          posApiKey: form.posApiKey,
          status: form.status,
        };
        if (hasLogin) {
          payload.clientLoginEmail = form.clientLoginEmail;
          payload.clientLoginPassword = form.clientLoginPassword;
          payload.clientLoginName = form.clientLoginName;
        }
        await clientsApi.create(payload);
      } else {
        const updatePayload = {
          name: form.name,
          posApiKey: form.posApiKey,
          status: form.status,
        };
        if (hasLogin) {
          updatePayload.clientLoginEmail = form.clientLoginEmail;
          updatePayload.clientLoginPassword = form.clientLoginPassword;
          updatePayload.clientLoginName = form.clientLoginName;
        }
        await clientsApi.update(modal.client._id, updatePayload);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>Clients</h1>
        <button type="button" onClick={openCreate} className={styles.createBtn}>Add client</button>
      </div>
      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : list.length === 0 ? (
        <p className={styles.muted}>No clients. Add one to get started.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>POS API Key</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td className={styles.mono}>{c.posApiKey ? '••••' + c.posApiKey.slice(-6) : '—'}</td>
                  <td><span className={styles[`status_${c.status}`]}>{c.status}</span></td>
                  <td>
                    <button type="button" onClick={() => openEdit(c)} className={styles.linkBtn}>Edit</button>
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
            <h2>{modal.type === 'create' ? 'Add client' : 'Edit client'}</h2>
            <form onSubmit={handleSubmit}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.field}>
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label>POS API Key</label>
                <input
                  value={form.posApiKey}
                  onChange={(e) => setForm((f) => ({ ...f, posApiKey: e.target.value }))}
                  required={modal.type === 'create'}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={styles.input}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className={styles.loginSection}>
                <h3 className={styles.loginHeading}>
                  {modal.type === 'create' ? 'Client login (optional)' : 'Add login for this client (optional)'}
                </h3>
                <p className={styles.loginHint}>
                  {modal.type === 'create'
                    ? 'Create a user so this client can sign in to the web.'
                    : 'Add a login so this client can sign in. Leave empty if they already have one.'}
                </p>
              </div>
              <div className={styles.field}>
                <label>Login email</label>
                <input
                  type="email"
                  value={form.clientLoginEmail}
                  onChange={(e) => setForm((f) => ({ ...f, clientLoginEmail: e.target.value }))}
                  placeholder="client@restaurant.com"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label>Login name</label>
                <input
                  value={form.clientLoginName}
                  onChange={(e) => setForm((f) => ({ ...f, clientLoginName: e.target.value }))}
                  placeholder="Restaurant manager"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label>Password (min 6 characters)</label>
                <input
                  type="password"
                  value={form.clientLoginPassword}
                  onChange={(e) => setForm((f) => ({ ...f, clientLoginPassword: e.target.value }))}
                  placeholder="••••••••"
                  className={styles.input}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label>Confirm password</label>
                <input
                  type="password"
                  value={form.clientLoginPasswordConfirm}
                  onChange={(e) => setForm((f) => ({ ...f, clientLoginPasswordConfirm: e.target.value }))}
                  placeholder="••••••••"
                  className={styles.input}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.actions}>
                <button type="submit" disabled={saving} className={styles.btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={() => setModal(null)} className={styles.btnSecondary}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
