import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { campaigns as campaignsApi } from '../api';
import styles from './Campaigns.module.css';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Campaigns() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = statusFilter ? { status: statusFilter } : {};
    campaignsApi.list(params)
      .then((r) => setList(r.data.campaigns || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'CLIENT';

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>Campaigns</h1>
        {canEdit && (
          <Link to="/campaigns/new" className={styles.createBtn}>New campaign</Link>
        )}
      </div>
      <div className={styles.toolbar}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="ENDED">Ended</option>
        </select>
      </div>
      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : list.length === 0 ? (
        <p className={styles.muted}>No campaigns yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                {user?.role === 'ADMIN' && <th>Client</th>}
                <th>Collection</th>
                <th>Redemption</th>
                <th>Slab / Min</th>
                <th>Status</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td>{c.campaignName}</td>
                  {user?.role === 'ADMIN' && (
                    <td>{c.clientId?.name ?? c.clientId ?? '—'}</td>
                  )}
                  <td>{formatDate(c.collectionStartDate)} – {formatDate(c.collectionEndDate)}</td>
                  <td>{formatDate(c.redemptionStartDate)} – {formatDate(c.redemptionEndDate)}</td>
                  <td>₹{c.slabStepAmount} / ₹{c.minBillAmount}</td>
                  <td>
                    <span className={styles[`status_${c.status}`]}>{c.status}</span>
                  </td>
                  {canEdit && (
                    <td>
                      <Link to={`/campaigns/${c._id}/edit`} className={styles.link}>Edit</Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
