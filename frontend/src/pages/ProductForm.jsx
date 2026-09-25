import React, { useState } from 'react';
import API from '../api/client';
import { parseApiError } from '../api/errors';
import { useToast } from '../components/Toast';

export default function ProductForm({ product, onSuccess }) {
  const showToast = useToast();
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    price: product?.price || '',
    quantity: product?.quantity ?? 0,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.price || parseFloat(form.price) < 0.01) errs.price = 'Price must be at least $0.01';
    if (parseInt(form.quantity, 10) < 0) errs.quantity = 'Quantity cannot be negative';
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
      const payload = { name: form.name.trim(), sku: form.sku.trim(), price: parseFloat(form.price), quantity: parseInt(form.quantity, 10) || 0 };
      if (product?.id) {
        await API.put(`/products/${product.id}`, payload);
        showToast('Product updated successfully');
      } else {
        await API.post('/products', payload);
        showToast('Product created successfully');
      }
      onSuccess();
    } catch (err) {
      setErrors({ submit: parseApiError(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (field) => `theme-input block w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${errors[field] ? 'ring-2 ring-red-400' : ''}`;

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
        <Label>Name *</Label>
        <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Wireless Headphones" className={fieldClass('name')} />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>
      <div>
        <Label>SKU *</Label>
        <input name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. WH-001" className={fieldClass('sku')} />
        {errors.sku && <p className="mt-1 text-xs text-red-400">{errors.sku}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Price *</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm" style={{ color: 'var(--text-3)' }}>$</span>
            <input name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00"
              className={`${fieldClass('price')} pl-7`} />
          </div>
          {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price}</p>}
        </div>
        <div>
          <Label>Quantity</Label>
          <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} className={fieldClass('quantity')} />
        </div>
      </div>
      <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--divider)', marginTop: 8 }}>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
        >
          {submitting ? 'Saving...' : product?.id ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
