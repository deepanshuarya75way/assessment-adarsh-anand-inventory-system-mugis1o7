import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';
import { parseApiError } from '../api/errors';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { Search } from 'lucide-react';

export default function CreateOrder() {
  const showToast = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState('');
  const [cart, setCart] = useState({});
  const [qtys, setQtys] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    Promise.all([API.get('/customers'), API.get('/products')])
      .then(([custRes, prodRes]) => {
        setCustomers(custRes.data);
        setProducts(prodRes.data);
        const initQtys = {};
        prodRes.data.forEach((p) => { initQtys[p.id] = 1; });
        setQtys(initQtys);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const remaining = (product) => product.quantity - (cart[product.id] || 0);

  const stockLabel = (p) => {
    if (p.quantity === 0) return 'out';
    if (p.quantity < 10) return 'low';
    return 'in';
  };

  const setQty = (productId, value, maxRemaining) => {
    const clamped = Math.max(1, Math.min(maxRemaining, parseInt(value, 10) || 1));
    setQtys((prev) => ({ ...prev, [productId]: clamped }));
    setRowErrors((prev) => ({ ...prev, [productId]: undefined }));
  };

  const addToCart = (product) => {
    const rem = remaining(product);
    if (rem <= 0) {
      setRowErrors((prev) => ({ ...prev, [product.id]: `No more stock available (${product.quantity} total)` }));
      return;
    }
    const qty = Math.min(qtys[product.id] || 1, rem);
    if (qty < 1) return;
    setCart((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + qty }));
    setQtys((prev) => ({ ...prev, [product.id]: 1 }));
    setRowErrors((prev) => ({ ...prev, [product.id]: undefined }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setQtys((prev) => ({ ...prev, [productId]: 1 }));
    setRowErrors((prev) => ({ ...prev, [productId]: undefined }));
  };

  const filteredProducts = products
    .filter((p) => {
      if (stockFilter === 'in') return p.quantity >= 10;
      if (stockFilter === 'low') return p.quantity > 0 && p.quantity < 10;
      if (stockFilter === 'out') return p.quantity === 0;
      return true;
    })
    .filter((p) => {
      if (!search) return true;
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      );
    });

  const cartItems = Object.entries(cart)
    .map(([pid, qty]) => ({ product: products.find((p) => p.id === pid), qty }))
    .filter((i) => i.product);

  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalAmount = cartItems.reduce((s, i) => s + parseFloat(i.product.price) * i.qty, 0);

  const handleSubmit = async () => {
    const errs = {};
    if (!customerId) errs.customer = 'Select a customer';
    if (cartItems.length === 0) errs.cart = 'Add at least one product';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSubmitting(true);
    try {
      await API.post('/orders', {
        customer_id: customerId,
        items: cartItems.map((i) => ({ product_id: i.product.id, quantity: i.qty })),
      });
      showToast('Order placed successfully');
      navigate('/orders');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to place order'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const STOCK_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'in', label: 'In Stock' },
    { key: 'low', label: 'Low Stock' },
    { key: 'out', label: 'Out of Stock' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
            Place New Order
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {filteredProducts.length} products available
          </p>
        </div>
      </div>

      {/* Customer select */}
      <div className="rounded-2xl shadow-sm p-4 mb-4 flex flex-wrap items-center gap-4 animate-fade-in-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '40ms' }}>
        <label className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-3)' }}>
          Customer *
        </label>
        <select
          value={customerId}
          onChange={(e) => { setCustomerId(e.target.value); setFormErrors((p) => ({ ...p, customer: undefined })); }}
          className={`theme-input flex-1 min-w-48 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.customer ? 'ring-2 ring-red-400' : ''}`}
        >
          <option value="">— Select a customer —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
          ))}
        </select>
        {formErrors.customer && <p className="text-xs font-medium" style={{ color: '#f87171' }}>{formErrors.customer}</p>}
        {formErrors.cart && <p className="text-xs font-medium" style={{ color: '#f87171' }}>{formErrors.cart}</p>}
      </div>

      {/* Search + stock filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-3" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="theme-input w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
          {STOCK_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStockFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                stockFilter === f.key
                  ? { background: 'var(--surface)', color: 'var(--text-1)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                  : { background: 'transparent', color: 'var(--text-3)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div className="rounded-2xl shadow-sm overflow-hidden mb-24 animate-fade-in-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '120ms' }}>
        <table className="min-w-full">
          <thead style={{ background: 'var(--table-head)' }}>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['Product & SKU', 'Price', 'Stock', 'Qty to Add', 'In Cart', 'Action'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--text-3)' }}>
                  No products match your filter
                </td>
              </tr>
            )}
            {filteredProducts.map((p) => {
              const inCart = !!cart[p.id];
              const cartQty = cart[p.id] || 0;
              const rem = remaining(p);
              const sl = stockLabel(p);
              const pendingQty = qtys[p.id] || 1;
              const rowErr = rowErrors[p.id];
              const isOutOfStock = p.quantity === 0;
              const isFullyAllocated = rem <= 0 && inCart;

              const rowStyle = isOutOfStock
                ? { background: 'rgba(239,68,68,0.06)', opacity: 0.8, borderBottom: '1px solid var(--divider)' }
                : sl === 'low'
                ? { background: 'rgba(245,158,11,0.07)', borderBottom: '1px solid var(--divider)' }
                : inCart
                ? { background: 'rgba(99,102,241,0.07)', borderBottom: '1px solid var(--divider)' }
                : { borderBottom: '1px solid var(--divider)' };

              return (
                <React.Fragment key={p.id}>
                  <tr className="theme-row-hover transition-colors" style={rowStyle}>
                    {/* Product name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {inCart && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: 'var(--accent-from)' }} />
                        )}
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{p.name}</p>
                          <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{p.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                      ${parseFloat(p.price).toFixed(2)}
                    </td>

                    {/* Stock badge */}
                    <td className="px-6 py-4">
                      {isOutOfStock ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ color: '#f87171', background: 'rgba(248,113,113,0.12)' }}>
                          Out of Stock
                        </span>
                      ) : sl === 'low' ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.12)' }}>
                          ⚠ Low — {p.quantity} left
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ color: '#34d399', background: 'rgba(52,211,153,0.12)' }}>
                          ✓ {p.quantity} available
                        </span>
                      )}
                      {inCart && rem > 0 && (
                        <p className="text-xs mt-1" style={{ color: 'var(--accent-text)' }}>{rem} remaining</p>
                      )}
                      {isFullyAllocated && (
                        <p className="text-xs mt-1 font-medium" style={{ color: '#fbbf24' }}>All stock in cart</p>
                      )}
                    </td>

                    {/* Qty stepper */}
                    <td className="px-6 py-4">
                      {isOutOfStock ? (
                        <span className="text-sm" style={{ color: 'var(--text-3)' }}>—</span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setQty(p.id, pendingQty - 1, rem)}
                              disabled={pendingQty <= 1}
                              className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors disabled:opacity-30"
                              style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--surface-2)' }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={rem}
                              value={pendingQty}
                              onChange={(e) => setQty(p.id, e.target.value, rem)}
                              className="w-12 text-center text-sm py-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              style={{
                                border: `1px solid ${pendingQty > rem ? '#f87171' : 'var(--border)'}`,
                                background: pendingQty > rem ? 'rgba(248,113,113,0.1)' : 'var(--input-bg)',
                                color: 'var(--text-1)',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setQty(p.id, pendingQty + 1, rem)}
                              disabled={pendingQty >= rem}
                              className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors disabled:opacity-30"
                              style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--surface-2)' }}
                            >
                              +
                            </button>
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>max {rem}</p>
                        </>
                      )}
                    </td>

                    {/* In cart qty */}
                    <td className="px-6 py-4">
                      {inCart ? (
                        <span className="inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
                          🛒 {cartQty}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4">
                      {isOutOfStock ? (
                        <span className="text-xs font-medium" style={{ color: '#f87171' }}>Unavailable</span>
                      ) : isFullyAllocated ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>Max added</span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(p.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                            style={{ border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', background: 'rgba(248,113,113,0.08)' }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : inCart ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addToCart(p)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,var(--accent-from),var(--accent-to))' }}
                          >
                            + Add More
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(p.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                            style={{ border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', background: 'rgba(248,113,113,0.08)' }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg,var(--accent-from),var(--accent-to))' }}
                        >
                          ADD
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Inline row error */}
                  {rowErr && (
                    <tr style={{ background: 'rgba(248,113,113,0.08)', borderBottom: '1px solid var(--divider)' }}>
                      <td colSpan={6} className="px-6 py-1.5">
                        <p className="text-xs font-medium" style={{ color: '#f87171' }}>⚠ {rowErr}</p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sticky bottom cart bar */}
      <div className="fixed bottom-0 left-64 right-0 px-8 py-4 flex items-center justify-between z-20"
        style={{ background: 'var(--header-bg)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)' }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            {cartItems.length > 0 && (
              <span className="text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,var(--accent-from),var(--accent-to))' }}>
                {cartItems.length}
              </span>
            )}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-2)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{cartItems.length}</span>
            {' '}product{cartItems.length !== 1 ? 's' : ''}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-2)' }}>
            Total Qty: <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{totalQty}</span>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-2)' }}>
            Total:{' '}
            <span className="font-bold text-base" style={{ color: 'var(--accent-text)' }}>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--surface-2)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || cartItems.length === 0 || !customerId}
            className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,var(--accent-from),var(--accent-to))', boxShadow: '0 4px 14px var(--accent-glow)' }}
          >
            {submitting ? 'Placing...' : 'Place Order →'}
          </button>
        </div>
      </div>
    </div>
  );
}
