import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analytics, clients } from '../api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [clientList, setClientList] = useState([]);
  const [clientId, setClientId] = useState(user?.clientId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      clients.list().then((r) => setClientList(r.data.clients || [])).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    const id = isAdmin ? clientId : user?.clientId;
    setLoading(true);
    analytics.dashboard(id || undefined)
      .then((r) => {
        setData(r.data.dashboard);
        setError('');
      })
      .catch((e) => setError(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isAdmin, clientId, user?.clientId]);

  if (loading) return <div className={styles.loading}>Loading dashboard…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const d = data || {};
  const cards = [
    { label: 'Coupons issued', value: d.couponsIssued ?? 0 },
    { label: 'Coupons redeemed', value: d.couponsRedeemed ?? 0 },
    { label: 'Total discount (₹)', value: (d.totalDiscount ?? 0).toLocaleString('en-IN') },
    { label: 'Active campaigns', value: d.campaignsActive ?? 0 },
  ];

  // Add admin-only metrics when viewing global stats
  if (isAdmin && !clientId) {
    cards.push(
      { label: 'Total clients', value: d.totalClients ?? 0 },
      { label: 'Total cashiers', value: d.totalCashiers ?? 0 },
      { label: 'Total amount (₹)', value: (d.totalAmount ?? 0).toLocaleString('en-IN') }
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>
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
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} className={styles.card}>
            <span className={styles.cardLabel}>{card.label}</span>
            <span className={styles.cardValue}>{card.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
