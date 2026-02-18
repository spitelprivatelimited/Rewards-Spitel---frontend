import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { campaigns as campaignsApi, clients as clientsApi } from '../api';
import styles from './CampaignForm.module.css';

const emptyCampaign = {
  campaignName: '',
  collectionStartDate: '',
  collectionEndDate: '',
  redemptionStartDate: '',
  redemptionEndDate: '',
  slabStepAmount: 500,
  minBillAmount: 500,
  allowMultipleCoupons: false,
  maxCouponsPerInvoice: 1,
  allowPartialRedemption: false,
  requireBillGreaterThanCoupon: true,
  orderTypeAllowed: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'],
  status: 'DRAFT',
};

export default function CampaignForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const [clientList, setClientList] = useState([]);
  const [form, setForm] = useState(emptyCampaign);
  const [clientId, setClientId] = useState(user?.clientId || '');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      clientsApi.list().then((r) => setClientList(r.data.clients || [])).catch(() => {});
    } else if (user?.clientId) {
      setClientId(user.clientId);
    }
  }, [user]);

  useEffect(() => {
    if (!isEdit) {
      setForm({ ...emptyCampaign, clientId: clientId || undefined });
      return;
    }
    campaignsApi.get(id)
      .then((r) => {
        const c = r.data.campaign;
        setForm({
          campaignName: c.campaignName,
          collectionStartDate: c.collectionStartDate?.slice(0, 10) || '',
          collectionEndDate: c.collectionEndDate?.slice(0, 10) || '',
          redemptionStartDate: c.redemptionStartDate?.slice(0, 10) || '',
          redemptionEndDate: c.redemptionEndDate?.slice(0, 10) || '',
          slabStepAmount: c.slabStepAmount ?? 500,
          minBillAmount: c.minBillAmount ?? 500,
          allowMultipleCoupons: c.allowMultipleCoupons ?? false,
          maxCouponsPerInvoice: c.maxCouponsPerInvoice ?? 1,
          allowPartialRedemption: c.allowPartialRedemption ?? false,
          requireBillGreaterThanCoupon: c.requireBillGreaterThanCoupon ?? true,
          orderTypeAllowed: c.orderTypeAllowed ?? ['DINE_IN', 'TAKEAWAY', 'DELIVERY'],
          status: c.status || 'DRAFT',
        });
        setClientId(c.clientId?._id || c.clientId);
      })
      .catch(() => setError('Campaign not found'))
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      clientId: user?.role === 'CLIENT' ? user.clientId : clientId,
      collectionStartDate: form.collectionStartDate,
      collectionEndDate: form.collectionEndDate,
      redemptionStartDate: form.redemptionStartDate,
      redemptionEndDate: form.redemptionEndDate,
    };
    try {
      if (isEdit) {
        await campaignsApi.update(id, payload);
      } else {
        await campaignsApi.create(payload);
      }
      navigate('/campaigns');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={styles.muted}>Loading…</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{isEdit ? 'Edit campaign' : 'New campaign'}</h1>
      <Link to="/campaigns" className={styles.back}>← Campaigns</Link>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        {user?.role === 'ADMIN' && (
          <div className={styles.field}>
            <label>Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className={styles.input}>
              <option value="">Select client</option>
              {clientList.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className={styles.field}>
          <label>Campaign name</label>
          <input
            value={form.campaignName}
            onChange={(e) => update('campaignName', e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Collection start</label>
            <input
              type="date"
              value={form.collectionStartDate}
              onChange={(e) => update('collectionStartDate', e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Collection end</label>
            <input
              type="date"
              value={form.collectionEndDate}
              onChange={(e) => update('collectionEndDate', e.target.value)}
              required
              className={styles.input}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Redemption start</label>
            <input
              type="date"
              value={form.redemptionStartDate}
              onChange={(e) => update('redemptionStartDate', e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Redemption end</label>
            <input
              type="date"
              value={form.redemptionEndDate}
              onChange={(e) => update('redemptionEndDate', e.target.value)}
              required
              className={styles.input}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Slab step (₹)</label>
            <input
              type="number"
              min={1}
              value={form.slabStepAmount}
              onChange={(e) => update('slabStepAmount', Number(e.target.value))}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Min bill (₹)</label>
            <input
              type="number"
              min={0}
              value={form.minBillAmount}
              onChange={(e) => update('minBillAmount', Number(e.target.value))}
              className={styles.input}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label>
            <input
              type="checkbox"
              checked={form.requireBillGreaterThanCoupon}
              onChange={(e) => update('requireBillGreaterThanCoupon', e.target.checked)}
            />
            {' '}Require bill ≥ coupon value
          </label>
        </div>
        {isEdit && (
          <div className={styles.field}>
            <label>Status</label>
            <select value={form.status} onChange={(e) => update('status', e.target.value)} className={styles.input}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ENDED">Ended</option>
            </select>
          </div>
        )}
        <div className={styles.actions}>
          <button type="submit" disabled={saving} className={styles.btnPrimary}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
          <Link to="/campaigns" className={styles.btnSecondary}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
