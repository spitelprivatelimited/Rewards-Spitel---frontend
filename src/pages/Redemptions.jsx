import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analytics, clients } from '../api';
import styles from './Redemptions.module.css';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Redemptions() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [clientId, setClientId] = useState(user?.clientId || '');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) clients.list().then((r) => setClientList(r.data.clients || [])).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    const id = isAdmin ? clientId : user?.clientId;
    if (!id && isAdmin) {
      setLoading(false);
      setLogs([]);
      return;
    }
    setLoading(true);
    analytics.redemptions(id || undefined)
      .then((r) => setLogs(r.data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [isAdmin, clientId, user?.clientId]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Redemptions</h1>
      {isAdmin && clientList.length > 0 && (
        <div className={styles.filter}>
          <label>Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={styles.select}>
            <option value="">Select client</option>
            {clientList.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : logs.length === 0 ? (
        <p className={styles.muted}>No redemptions yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Campaign</th>
                <th>Coupon</th>
                <th>Mobile</th>
                <th>Invoice</th>
                <th>Bill</th>
                <th>Discount</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{formatDate(log.redeemedAt)}</td>
                  <td>{log.campaignId?.campaignName ?? '—'}</td>
                  <td className={styles.mono}>{log.couponId?.couponCode ?? '—'}</td>
                  <td>{log.couponId?.customerMobile ?? '—'}</td>
                  <td>{log.invoiceNo}</td>
                  <td>₹{log.billAmount?.toLocaleString('en-IN')}</td>
                  <td>₹{log.discountAmount?.toLocaleString('en-IN')}</td>
                  <td>₹{log.finalPayable?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
