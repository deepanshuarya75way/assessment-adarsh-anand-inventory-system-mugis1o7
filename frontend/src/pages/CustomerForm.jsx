import React, { useState } from 'react';
import API from '../api/client';
import { parseApiError } from '../api/errors';
import { useToast } from '../components/Toast';

export default function CustomerForm({ customer, onSuccess }) {
  const isEdit = !!customer;
  const showToast = useToast();
  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = { full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined };
      if (isEdit) {
        await API.put(`/customers/${customer.id}`, payload);
        showToast('Customer updated successfully');
      } else {
        await API.post('/customers', payload);
        showToast('Customer added successfully');
      }
      onSuccess();
    } catch (err) {
      setErrors({ submit: parseApiError(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (field) =>
    `theme-input block w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all ${errors[field] ? 'ring-2 ring-red-400' : ''}`;
  const Label = ({ children }) => (
    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>{children}</label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-400 border border-red-500/30" style={{ background: 'rgba(248,113,113,0.1)' }}>
          {errors.submit}
        </div>
      )}
      <div>
        <Label>Full Name *</Label>
        <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g. Jane Smith" className={fieldClass('full_name')} />
        {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name}</p>}
      </div>
      <div>
        <Label>Email *</Label>
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" className={fieldClass('email')} />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
      </div>
      <div>
        <Label>Phone <span className="normal-case font-normal" style={{ color: 'var(--text-3)' }}>(optional)</span></Label>
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 555 000 0000" className={fieldClass('phone')} />
      </div>
      <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--divider)', marginTop: 8 }}>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}
        >
          {submitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Customer')}
        </button>
      </div>
    </form>
  );
}
