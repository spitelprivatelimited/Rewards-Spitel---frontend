import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dining as diningApi, clients as clientsApi } from '../api';
import styles from './DiningForm.module.css';

function toDateTimeLocal(d) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function DiningForm() {
  const { user } = useAuth();
  const [clientList, setClientList] = useState([]);
  const [clientId, setClientId] = useState(user?.clientId || '');
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    invoiceNumber: '',
    billAmount: '',
    dateTime: toDateTimeLocal(new Date()),
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      clientsApi.list().then((r) => setClientList(r.data.clients || [])).catch(() => {});
    } else if (user?.clientId) {
      setClientId(user.clientId);
    }
  }, [isAdmin, user?.clientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    if (form.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    if (!form.billAmount) {
      setError('Bill amount is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        billAmount: Number(form.billAmount),
        dateTime: form.dateTime ? new Date(form.dateTime).toISOString() : undefined,
      };
      if (isAdmin && clientId) payload.clientId = clientId;
      const res = await diningApi.submit(payload);
      setSuccess(res.data);
      setForm({
        customerName: '',
        phone: '',
        invoiceNumber: '',
        billAmount: '',
        dateTime: toDateTimeLocal(new Date()),
      });
      setErrors({});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Customer Dining </h1>
      <p className={styles.subtitle}>Enter customer details to create a coupon. WhatsApp is sent automatically </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        {success && (
          <div className={styles.success}>
            {success.coupons ? (
              <>
                <div><strong>Coupons Created:</strong></div>
                {success.coupons.map((coupon, idx) => (
                  <div key={idx}>
                    {idx + 1}. <strong>{coupon.couponCode}</strong> - ₹{coupon.couponValue}
                  </div>
                ))}
                <div style={{marginTop: '8px'}}>
                  Total Coupon Value: <strong>₹{success.totalCouponValue}</strong>
                </div>
                {success.whatsappSent && <div style={{marginTop: '4px'}}>✓ WhatsApp sent</div>}
              </>
            ) : (
              <>
                Coupon created: <strong>{success.coupon?.couponCode}</strong> (₹{success.coupon?.couponValue})
                {success.whatsappSent && ' · WhatsApp sent.'}
              </>
            )}
          </div>
        )}

        {isAdmin && clientList.length > 0 && (
          <div className={styles.field}>
            <label>Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={styles.input}
              required
            >
              <option value="">Select client</option>
              {clientList.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label>Customer name</label>
          <input
            type="text"
            className={styles.input}
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            placeholder="Customer name"
          />
        </div>

        <div className={styles.field}>
          <label>Phone number *</label>
          <input
            type="tel"
            maxLength="10"
            pattern="\d{10}"
            className={styles.input}
            value={form.phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              setForm((f) => ({ ...f, phone: val }));
              if (val.length < 10 && val.length > 0) {
                setErrors((err) => ({ ...err, phone: 'Number is less than 10' }));
              } else {
                setErrors((err) => ({ ...err, phone: '' }));
              }
            }}
            placeholder="e.g. 9876543210"
            required
          />
          {errors.phone && <div className={styles.fieldError}>{errors.phone}</div>}
        </div>

        <div className={styles.field}>
          <label>Invoice/Bill Number</label>
          <input
            type="text"
            className={styles.input}
            value={form.invoiceNumber}
            onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
            placeholder="e.g. INV-2024-001"
          />
        </div>

        <div className={styles.field}>
          <label>Bill amount *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            value={form.billAmount}
            onChange={(e) => setForm((f) => ({ ...f, billAmount: e.target.value }))}
            placeholder="e.g. 1200"
            required
          />
          {form.billAmount && (
            <div className={styles.billAmountDisplay}>
              Amount: <strong>₹{Number(form.billAmount).toFixed(2)}</strong>
            </div>
          )}
          {form.billAmount > 2000 && (
            <div className={styles.warning}>
              ⚠️ High amount! Please verify: ₹{Number(form.billAmount).toFixed(2)}
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label>Date and time</label>
          <input
            type="datetime-local"
            className={styles.input}
            value={form.dateTime}
            onChange={(e) => setForm((f) => ({ ...f, dateTime: e.target.value }))}
          />
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
