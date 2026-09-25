import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, pageSize, onPage }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = [];
  const delta = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="px-6 py-3 flex items-center justify-between" style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--divider)' }}>
      <span className="text-xs" style={{ color: 'var(--text-3)' }}>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-sm transition-colors disabled:opacity-30"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-7 text-center text-xs" style={{ color: 'var(--text-3)' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: p === page ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--surface)',
                border: `1px solid ${p === page ? 'transparent' : 'var(--border)'}`,
                color: p === page ? 'white' : 'var(--text-2)',
                boxShadow: p === page ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-sm transition-colors disabled:opacity-30"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
