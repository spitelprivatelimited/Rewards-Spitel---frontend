import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { coupons as couponsApi, clients as clientsApi } from '../api';
import styles from './Coupons.module.css';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Coupons() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [clientId, setClientId] = useState(user?.clientId || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [mobileFilter, setMobileFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) clientsApi.list().then((r) => setClientList(r.data.clients || [])).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    const id = isAdmin ? clientId : user?.clientId;
    if (!id && isAdmin) {
      setLoading(false);
      setList([]);
      return;
    }
    setLoading(true);
    const params = {};
    if (id) params.clientId = id;
    if (statusFilter) params.status = statusFilter;
    if (nameFilter) params.customerName = nameFilter;
    if (mobileFilter) params.customerMobile = mobileFilter;
    couponsApi.list(params)
      .then((r) => setList(r.data.coupons || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [isAdmin, clientId, user?.clientId, statusFilter, nameFilter, mobileFilter]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Coupons</h1>
      <div className={styles.toolbar}>
        {isAdmin && clientList.length > 0 && (
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={styles.select}>
            <option value="">Select client</option>
            {clientList.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="USED">Used</option>
          <option value="EXPIRED">Expired</option>
          <option value="VOID">Void</option>
        </select>
        <input
          type="text"
          placeholder="Filter by name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Filter by mobile"
          value={mobileFilter}
          onChange={(e) => setMobileFilter(e.target.value)}
          className={styles.input}
        />
      </div>
      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : list.length === 0 ? (
        <p className={styles.muted}>No coupons.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Value</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Campaign</th>
                <th>Issued</th>
                <th>Expires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td className={styles.mono}>{c.couponCode}</td>
                  <td>₹{c.couponValue?.toLocaleString('en-IN')}</td>
                  <td>{c.customerName ?? '—'}</td>
                  <td>{c.customerMobile ?? '—'}</td>
                  <td>{c.campaignId?.campaignName ?? '—'}</td>
                  <td>{formatDate(c.issuedAt)}</td>
                  <td>{formatDate(c.expiresAt)}</td>
                  <td><span className={styles[`status_${c.status}`]}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
