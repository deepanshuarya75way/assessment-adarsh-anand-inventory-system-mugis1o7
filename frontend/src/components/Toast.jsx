import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in-up max-w-xs"
            style={{
              background: t.type === 'success'
                ? 'linear-gradient(135deg, #059669, #047857)'
                : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              boxShadow: t.type === 'success'
                ? '0 8px 24px -4px rgba(5,150,105,0.4)'
                : '0 8px 24px -4px rgba(220,38,38,0.4)',
              color: 'white',
            }}
          >
            {t.type === 'success'
              ? <CheckCircle size={16} className="flex-shrink-0 opacity-90" />
              : <XCircle size={16} className="flex-shrink-0 opacity-90" />}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
