import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/client';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomerForm from './CustomerForm';
import Pagination from '../components/Pagination';
import { useToast } from '../components/Toast';
import { Users, Plus, Search, Trash2, Mail, Phone, Pencil } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { parseApiError } from '../api/errors';

const PAGE_SIZE = 8;

function Avatar({ name }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const PALETTES = [['#6366f1','#8b5cf6'],['#3b82f6','#1d4ed8'],['#10b981','#059669'],['#f59e0b','#d97706'],['#ec4899','#db2777']];
  const [a, b] = PALETTES[name.charCodeAt(0) % PALETTES.length];
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: `linear-gradient(135deg,${a},${b})` }}>
      {initials}
    </div>
  );
}

export default function Customers() {
  const showToast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    API.get('/customers').then((r) => setCustomers(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async (c) => {
    try {
      await API.delete(`/customers/${c.id}`);
      showToast('Customer deleted');
      fetchCustomers();
    } catch (err) {
      showToast(parseApiError(err, 'Failed to delete'), 'error');
    }
  };

  const openAdd = () => { setEditCustomer(null); setModalOpen(true); };
  const openEdit = (c) => { setEditCustomer(c); setModalOpen(true); };

  const filtered = customers.filter((c) =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>Customers</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{customers.length} registered customers</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}
        >
          <Plus size={16} />Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <Search size={15} className="absolute left-3.5 top-3" style={{ color: 'var(--text-3)' }} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="theme-input w-full max-w-sm pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl shadow-sm overflow-hidden animate-fade-in-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '100ms' }}>
        <table className="min-w-full">
          <thead style={{ background: 'var(--table-head)' }}>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['Customer', 'Email', 'Phone', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>No customers found</p>
                </td>
              </tr>
            ) : paginated.map((c, idx) => (
              <tr key={c.id}
                className="theme-row-hover transition-colors animate-fade-in-up"
                style={{ borderBottom: '1px solid var(--divider)', animationDelay: `${160 + idx * 40}ms` }}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.full_name} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{c.full_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
                    <Mail size={13} style={{ color: 'var(--text-3)' }} />{c.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {c.phone
                    ? <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-2)' }}><Phone size={13} style={{ color: 'var(--text-3)' }} />{c.phone}</div>
                    : <span style={{ color: 'var(--text-3)' }}>—</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="btn-icon-edit" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmTarget(c)} className="btn-icon-delete" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <CustomerForm
          customer={editCustomer}
          onSuccess={() => { setModalOpen(false); fetchCustomers(); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => handleDelete(confirmTarget)}
        title="Delete Customer"
        message={`"${confirmTarget?.full_name}" and all their data will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete Customer"
        variant="danger"
      />
    </div>
  );
}
