import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, XCircle } from 'lucide-react';

const VARIANTS = {
  danger: {
    icon: Trash2,
    iconBg: 'rgba(244,63,94,0.12)',
    iconColor: '#f43f5e',
    confirmStyle: {
      background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
      boxShadow: '0 4px 14px rgba(244,63,94,0.35)',
    },
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#f59e0b',
    confirmStyle: {
      background: 'linear-gradient(135deg,#f59e0b,#d97706)',
      boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
    },
  },
};

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const v = VARIANTS[variant] || VARIANTS.danger;
  const Icon = v.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 rounded-2xl w-full max-w-sm mx-4 overflow-hidden animate-fade-in-up"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)',
        }}
      >
        {/* Top accent line */}
        <div className="h-1 w-full" style={{ background: v.confirmStyle.background }} />

        <div className="px-6 py-6">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: v.iconBg }}
          >
            <Icon size={22} style={{ color: v.iconColor }} />
          </div>

          {/* Text */}
          <h3 className="text-base font-bold mb-1.5" style={{ color: 'var(--text-1)' }}>
            {title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            {message}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={v.confirmStyle}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
