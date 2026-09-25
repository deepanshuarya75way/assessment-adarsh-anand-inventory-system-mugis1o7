import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { ShoppingCart, Search, Eye, XCircle, Plus, CheckCircle, Download } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { parseApiError } from '../api/errors';

const PAGE_SIZE = 10;

function exportReport(rows, customers, filename) {
  const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Items', 'Total Amount', 'Status'];

  const statusColor = (s) => {
    if (s === 'confirmed') return '#065f46';
    if (s === 'cancelled') return '#991b1b';
    return '#92400e';
  };
  const statusBg = (s) => {
    if (s === 'confirmed') return '#d1fae5';
    if (s === 'cancelled') return '#fee2e2';
    return '#fef3c7';
  };

  const rows_html = rows.map((o, i) => {
    const cust = customers[o.customer_id];
    const s = o.status || 'pending';
    const cells = [
      `<td style="font-family:monospace;font-weight:600">${String(o.id).substring(0, 8).toUpperCase()}</td>`,
      `<td>${o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>`,
      `<td style="font-weight:500">${cust ? cust.full_name : '—'}</td>`,
      `<td style="color:#4b5563">${cust ? cust.email : '—'}</td>`,
      `<td style="text-align:center">${(o.items || []).length}</td>`,
      `<td style="font-weight:700;text-align:right">$${parseFloat(o.total_amount || 0).toFixed(2)}</td>`,
      `<td style="text-align:center"><span style="background:${statusBg(s)};color:${statusColor(s)};padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700;text-transform:capitalize">${s}</span></td>`,
    ].join('');
    const rowBg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `<tr style="background:${rowBg}">${cells}</tr>`;
  }).join('');

  const totalConfirmed = rows.filter(o => o.status === 'confirmed').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"></head>
<body>
<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;width:100%">
  <thead>
    <tr>
      <td colspan="7" style="background:#1e1b4b;color:#ffffff;font-size:16px;font-weight:700;padding:14px 16px;letter-spacing:0.5px">
        Sales Report &nbsp;&nbsp;<span style="font-size:11px;font-weight:400;opacity:0.7">Generated ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </td>
    </tr>
    <tr>
      <td colspan="7" style="background:#4338ca;color:#c7d2fe;font-size:11px;padding:6px 16px">
        ${rows.length} orders total &nbsp;·&nbsp; Confirmed revenue: <strong style="color:#ffffff">$${totalConfirmed.toFixed(2)}</strong>
      </td>
    </tr>
    <tr style="background:#6366f1">
      ${headers.map(h => `<th style="color:#ffffff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:10px 14px;text-align:left;border-bottom:2px solid #4338ca">${h}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${rows_html}
  </tbody>
  <tfoot>
    <tr style="background:#f1f5f9">
      <td colspan="5" style="padding:10px 14px;font-size:12px;color:#6b7280;font-weight:600">Total (confirmed orders only)</td>
      <td style="padding:10px 14px;font-weight:800;font-size:14px;color:#4338ca;text-align:right">$${totalConfirmed.toFixed(2)}</td>
      <td></td>
    </tr>
  </tfoot>
</table>
</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Orders() {
  const showToast = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([API.get('/orders'), API.get('/customers')])
      .then(([oRes, cRes]) => {
        setOrders(oRes.data);
        const m = {};
        cRes.data.forEach((c) => { m[c.id] = c; });
        setCustomers(m);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCancel = async (o) => {
    try {
      await API.delete(`/orders/${o.id}`);
      showToast('Order cancelled — stock restored');
      fetchAll();
    } catch (err) {
      showToast(parseApiError(err, 'Failed to cancel'), 'error');
    }
  };

  const handleConfirm = async (o) => {
    try {
      await API.patch(`/orders/${o.id}/confirm`);
      showToast('Order confirmed successfully');
      fetchAll();
    } catch (err) {
      showToast(parseApiError(err, 'Failed to confirm'), 'error');
    }
  };

  const pending = orders.filter((o) => o.status === 'pending');
  const confirmed = orders.filter((o) => o.status === 'confirmed');
  const cancelled = orders.filter((o) => o.status === 'cancelled');
  const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const filtered = orders
    .filter((o) => filter === 'all' || o.status === filter)
    .filter((o) => {
      if (!search) return true;
      const cust = customers[o.customer_id];
      return String(o.id).toLowerCase().includes(search.toLowerCase()) ||
        (cust && cust.full_name.toLowerCase().includes(search.toLowerCase()));
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SUMMARY_CARDS = [
    { label: 'Pending', count: pending.length, amount: fmt(pending.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    { label: 'Confirmed', count: confirmed.length, amount: fmt(confirmed.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)), color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    { label: 'Cancelled', count: cancelled.length, amount: null, color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  ];

  const TABS = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'confirmed', label: 'Confirmed', count: confirmed.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>Orders</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{orders.length} orders total</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportReport(orders, customers, 'sales-report.xls')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ border: '1px solid var(--border)', color: 'var(--text-1)', background: 'var(--surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <Download size={15} />
            Download Report
          </button>

          <button
            onClick={() => navigate('/orders/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
          >
            <Plus size={16} />Create Order
          </button>
        </div>
      </div>

      {/* Summary mini-cards */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        {SUMMARY_CARDS.map((c) => (
          <div key={c.label} className="shimmer-card rounded-2xl px-5 py-4 card-hover cursor-default transition-colors"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: c.color }}>{c.label}</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: 'var(--text-1)' }}>{c.count}</p>
            {c.amount && <p className="text-xs font-medium mt-0.5" style={{ color: c.color }}>{c.amount}</p>}
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
          {TABS.map((t) => (
            <button key={t.key}
              onClick={() => { setFilter(t.key); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === t.key ? 'var(--surface)' : 'transparent',
                color: filter === t.key ? 'var(--text-1)' : 'var(--text-3)',
                boxShadow: filter === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: filter === t.key ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.06)',
                  color: filter === t.key ? '#818cf8' : 'var(--text-3)',
                }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-3" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search by ID or customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="theme-input w-64 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '140ms' }}>
        <table className="min-w-full">
          <thead style={{ background: 'var(--table-head)' }}>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['Order & Date','Customer','Items','Amount','Status','Actions'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <ShoppingCart size={32} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>No orders found</p>
                </td>
              </tr>
            ) : paginated.map((o, idx) => {
              const cust = customers[o.customer_id];
              return (
                <tr key={o.id}
                  className="theme-row-hover transition-colors animate-fade-in-up"
                  style={{ borderBottom: '1px solid var(--divider)', animationDelay: `${200 + idx * 40}ms` }}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-1)' }}>
                      #{String(o.id).substring(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{cust ? cust.full_name : '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{cust ? cust.email : ''}</p>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-2)' }}>
                    {(o.items || []).length} item{(o.items || []).length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                    {fmt(parseFloat(o.total_amount || 0))}
                  </td>
                  <td className="px-6 py-4"><Badge label={o.status} variant={o.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/orders/${o.id}`)} className="btn-icon-view" title="View">
                        <Eye size={14} />
                      </button>
                      {o.status === 'pending' && (
                        <button onClick={() => setConfirmDialog({ type: 'confirm', order: o })} className="btn-icon-confirm" title="Confirm order">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {o.status === 'pending' && (
                        <button onClick={() => setConfirmDialog({ type: 'cancel', order: o })} className="btn-icon-delete" title="Cancel">
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
        )}
      </div>

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={confirmDialog?.type === 'cancel'}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => handleCancel(confirmDialog.order)}
        title="Cancel Order"
        message={`Order #${String(confirmDialog?.order?.id || '').substring(0, 8).toUpperCase()} will be cancelled and stock will be restored. This cannot be undone.`}
        confirmLabel="Cancel Order"
        variant="danger"
      />

      {/* Confirm order dialog */}
      <ConfirmDialog
        open={confirmDialog?.type === 'confirm'}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => handleConfirm(confirmDialog.order)}
        title="Confirm Order"
        message={`Mark order #${String(confirmDialog?.order?.id || '').substring(0, 8).toUpperCase()} as confirmed?`}
        confirmLabel="Confirm Order"
        variant="warning"
      />
    </div>
  );
}
