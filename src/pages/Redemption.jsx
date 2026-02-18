import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { coupons as couponsApi } from '../api';
import styles from './Redemption.module.css';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Redemption() {
  const { user } = useAuth();
  const [mobile, setMobile] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redeemCoupon, setRedeemCoupon] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const clientId = user?.role === 'ADMIN' ? null : user?.clientId;

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setCoupons([]);
    setRedeemCoupon(null);
    setLastResult(null);
    if (!mobile.trim()) return;
    setLoading(true);
    try {
      const res = await couponsApi.byCustomer(mobile.trim(), clientId);
      setCoupons(res.data.coupons || []);
      if ((res.data.coupons || []).length === 0) setError('No active coupons for this number.');
    } catch (err) {
      setError(err.response?.data?.error || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const startRedeem = (coupon) => {
    setRedeemCoupon(coupon);
    setInvoiceNo('');
    setBillAmount('');
    setRedeemError('');
    setLastResult(null);
  };

  const cancelRedeem = () => {
    setRedeemCoupon(null);
    setRedeemError('');
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!redeemCoupon) return;
    setRedeemError('');
    setRedeeming(true);
    setLastResult(null);
    try {
      const res = await couponsApi.redeem({
        couponId: redeemCoupon._id,
        invoiceNo: invoiceNo.trim(),
        billAmount: Number(billAmount),
        clientId: user?.role === 'ADMIN' ? redeemCoupon.clientId : undefined,
      });
      setLastResult(res.data.redemption);
      setCoupons((prev) => prev.filter((c) => c._id !== redeemCoupon._id));
      setRedeemCoupon(null);
      setInvoiceNo('');
      setBillAmount('');
    } catch (err) {
      setRedeemError(err.response?.data?.error || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Redeem coupon</h1>
      <p className={styles.subtitle}>Enter customer mobile to fetch active coupons</p>

      <form onSubmit={handleLookup} className={styles.lookupForm}>
        <input
          type="tel"
          placeholder="Customer mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className={styles.input}
        />
        <button type="submit" disabled={loading} className={styles.btnPrimary}>
          {loading ? 'Searching…' : 'Lookup'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {coupons.length > 0 && (
        <div className={styles.couponList}>
          <h2>Active coupons</h2>
          {coupons.map((c) => (
            <div key={c._id} className={styles.couponCard}>
              <div className={styles.couponRow}>
                <span className={styles.code}>{c.couponCode}</span>
                <span className={styles.value}>₹{c.couponValue}</span>
              </div>
              <div className={styles.couponMeta}>
                {c.campaignId?.campaignName && <span>{c.campaignId.campaignName}</span>}
                <span>Valid till {formatDate(c.expiresAt)}</span>
              </div>
              <button type="button" onClick={() => startRedeem(c)} className={styles.redeemBtn}>
                Redeem
              </button>
            </div>
          ))}
        </div>
      )}

      {redeemCoupon && (
        <div className={styles.redeemPanel}>
          <h3>Redeem: {redeemCoupon.couponCode} (₹{redeemCoupon.couponValue})</h3>
          <form onSubmit={handleRedeem}>
            {redeemError && <div className={styles.error}>{redeemError}</div>}
            <div className={styles.field}>
              <label>Invoice no.</label>
              <input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label>Bill amount (₹)</label>
              <input
                type="number"
                min={redeemCoupon.couponValue}
                step="0.01"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.actions}>
              <button type="submit" disabled={redeeming} className={styles.btnPrimary}>
                {redeeming ? 'Redeeming…' : 'Confirm redeem'}
              </button>
              <button type="button" onClick={cancelRedeem} className={styles.btnSecondary}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {lastResult && (
        <div className={styles.success}>
          Redeemed. Discount: ₹{lastResult.discountAmount}, Final payable: ₹{lastResult.finalPayable}.
        </div>
      )}
    </div>
  );
}
