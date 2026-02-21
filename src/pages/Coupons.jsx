import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { coupons as couponsApi, clients as clientsApi, campaigns as campaignsApi } from '../api';
import styles from './Coupons.module.css';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Coupons() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [campaignList, setCampaignList] = useState([]);
  const [clientId, setClientId] = useState(user?.clientId || '');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [mobileFilter, setMobileFilter] = useState('');
  const [issuedDateFilter, setIssuedDateFilter] = useState('');
  const [billAmountMinFilter, setBillAmountMinFilter] = useState('');
  const [billAmountMaxFilter, setBillAmountMaxFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalBillAmount, setTotalBillAmount] = useState(0);
  const [totalCouponValue, setTotalCouponValue] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      clientsApi.list().then((r) => setClientList(r.data.clients || [])).catch(() => {});
    }
    campaignsApi.list().then((r) => setCampaignList(r.data.campaigns || [])).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    const id = isAdmin ? clientId : user?.clientId;
    if (!id && isAdmin) {
      setLoading(false);
      setList([]);
      setTotalCount(0);
      setTotalBillAmount(0);
      setTotalCouponValue(0);
      setTotalInvoices(0);
      return;
    }
    setLoading(true);
    const params = {};
    if (id) params.clientId = id;
    if (statusFilter) params.status = statusFilter;
    if (nameFilter) params.customerName = nameFilter;
    if (mobileFilter) params.customerMobile = mobileFilter;
    if (campaignFilter) params.campaignId = campaignFilter;
    if (issuedDateFilter) params.issuedDate = issuedDateFilter;
    if (billAmountMinFilter) params.billAmountMin = Number(billAmountMinFilter);
    if (billAmountMaxFilter) params.billAmountMax = Number(billAmountMaxFilter);
    params.page = page;
    params.limit = pageSize;
    couponsApi.list(params)
      .then((r) => {
        setList(r.data.coupons || []);
        setTotalCount(r.data.totalCount || 0);
        setTotalBillAmount(r.data.totalBillAmount || 0);
        setTotalCouponValue(r.data.totalCouponValue || 0);
        setTotalInvoices(r.data.totalInvoices || 0);
      })
      .catch(() => {
        setList([]);
        setTotalCount(0);
        setTotalBillAmount(0);
        setTotalCouponValue(0);
        setTotalInvoices(0);
      })
      .finally(() => setLoading(false));
  }, [isAdmin, clientId, user?.clientId, statusFilter, nameFilter, mobileFilter, campaignFilter, issuedDateFilter, billAmountMinFilter, billAmountMaxFilter, page, pageSize]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, nameFilter, mobileFilter, campaignFilter, issuedDateFilter, billAmountMinFilter, billAmountMaxFilter, clientId]);

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
        {campaignList.length > 0 && (
          <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className={styles.select}>
            <option value="">All campaigns</option>
            {campaignList.map((c) => (
              <option key={c._id} value={c._id}>{c.campaignName}</option>
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
        <input
          type="date"
          placeholder="Issued date"
          value={issuedDateFilter}
          onChange={(e) => setIssuedDateFilter(e.target.value)}
          className={styles.input}
        />
        <input
          type="number"
          placeholder="Min bill amount"
          value={billAmountMinFilter}
          onChange={(e) => setBillAmountMinFilter(e.target.value)}
          className={styles.input}
        />
        <input
          type="number"
          placeholder="Max bill amount"
          value={billAmountMaxFilter}
          onChange={(e) => setBillAmountMaxFilter(e.target.value)}
          className={styles.input}
        />
      </div>
      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : list.length === 0 ? (
        <p className={styles.muted}>No coupons.</p>
      ) : (
        <>
          <div className={styles.paginationInfo}>
            Showing {list.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} items
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Code</th>
                  <th>Coupon Value</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Issued</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Group coupons by issuedInvoiceNo
                  const groups = {};
                  list.forEach((c) => {
                    const key = c.issuedInvoiceNo || c._id;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(c);
                  });

                  let serialNo = (page - 1) * pageSize;
                  const rows = [];

                  Object.entries(groups).forEach(([invoiceNo, coupons]) => {
                    const billAmount = coupons[0].billAmount;
                    rows.push(
                      <tr key={`header-${invoiceNo}`} className={styles.invoiceHeader}>
                        <td colSpan="8">
                          <strong>Invoice: {coupons[0].invoiceNumber ?? invoiceNo}</strong> — {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'}
                        </td>
                        <td colSpan="3" style={{ textAlign: 'right' }}>
                          <strong>Bill Amount: ₹{billAmount?.toLocaleString('en-IN') ?? '—'}</strong>
                        </td>
                      </tr>
                    );

                    coupons.forEach((c, index) => {
                      serialNo++;
                      rows.push(
                        <tr key={c._id} className={styles.groupedRow}>
                          <td>{serialNo}</td>
                          <td className={styles.mono}>{c.couponCode}</td>
                          <td>₹{c.couponValue?.toLocaleString('en-IN')}</td>
                          <td>{c.customerName ?? '—'}</td>
                          <td>{c.customerMobile ?? '—'}</td>
                          <td>{formatDate(c.issuedAt)}</td>
                          <td>{formatDate(c.expiresAt)}</td>
                          <td><span className={styles[`status_${c.status}`]}>{c.status}</span></td>
                        </tr>
                      );
                    });
                  });

                  return rows;
                })()}
              </tbody>
            </table>
          </div>
          
          <div className={styles.summarySection}>
             <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total Invoices:</span>
              <span className={styles.summaryValue}>{totalInvoices}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total Coupons:</span>
              <span className={styles.summaryValue}>{totalCount}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total Bill Amount:</span>
              <span className={styles.summaryValue}>₹{totalBillAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total Coupon Value:</span>
              <span className={styles.summaryValue}>₹{totalCouponValue?.toLocaleString('en-IN')}</span>
            </div>
           
          </div>

          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo2}>
              Showing {list.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, totalCount)} of {totalCount} items
            </div>
            <div className={styles.paginationControls}>
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className={styles.paginationBtn}
              >
                First
              </button>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={styles.paginationBtn}
              >
                &lt;
              </button>
              
              {Array.from({ length: Math.ceil(totalCount / pageSize) }).map((_, i) => {
                const pageNum = i + 1;
                const totalPages = Math.ceil(totalCount / pageSize);
                // Show current page, first 3 pages, last 3 pages, and 2 pages around current
                const showPage = pageNum <= 3 || pageNum > totalPages - 3 || Math.abs(pageNum - page) <= 1;
                
                if (!showPage && i > 0 && i < Math.ceil(totalCount / pageSize) - 1) {
                  if (i === 3 && pageNum - page > 2) {
                    return <span key={`ellipsis-${i}`} className={styles.ellipsis}>...</span>;
                  }
                  return null;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`${styles.paginationBtn} ${page === pageNum ? styles.active : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(totalCount / pageSize)}
                className={styles.paginationBtn}
              >
                &gt;
              </button>
              <button
                onClick={() => setPage(Math.ceil(totalCount / pageSize))}
                disabled={page >= Math.ceil(totalCount / pageSize)}
                className={styles.paginationBtn}
              >
                Last
              </button>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className={styles.pageSizeSelect}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
