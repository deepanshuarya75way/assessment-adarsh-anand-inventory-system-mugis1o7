import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Bell, Moon, Sun, Check, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme, ACCENT_COLORS, ACCENT_MAP } from '../context/ThemeContext';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/customers': 'Customers',
  '/orders': 'Orders',
  '/orders/new': 'Create Order',
};


function ToggleSwitch({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none"
      style={{ background: on ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--border)', border: '2px solid transparent' }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300"
        style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

function ProfileDropdown({ onClose }) {
  const { isDark, toggleDark, accentColor, setAccentColor } = useTheme();

  return (
    <div
      className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-slide-down"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
    >
      {/* Profile section */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,var(--accent-from),var(--accent-to))', boxShadow: '0 4px 12px var(--accent-glow)' }}>
            IM
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Inventory Manager</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Admin · Full Access</p>
          </div>
        </div>
      </div>

      {/* Dark mode */}
      <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--divider)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.05)' }}>
              {isDark ? <Moon size={14} style={{ color: '#818cf8' }} /> : <Sun size={14} style={{ color: '#f59e0b' }} />}
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <ToggleSwitch on={isDark} onClick={toggleDark} />
        </div>
      </div>

      {/* Accent color picker */}
      <div className="px-5 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
          Accent Color
        </p>
        <div className="flex items-center gap-2">
          {ACCENT_COLORS.map((c) => {
            const colors = ACCENT_MAP[c.key];
            return (
              <button
                key={c.key}
                onClick={() => setAccentColor(c.key)}
                title={c.label}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                  boxShadow: accentColor === c.key ? `0 0 0 3px var(--surface), 0 0 0 5px ${colors.from}` : 'none',
                }}
              >
                {accentColor === c.key && <Check size={11} color="white" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-3)' }}>
          Accent: <span style={{ color: 'var(--text-2)' }} className="font-medium capitalize">{accentColor}</span>
        </p>
      </div>

      {/* Theme preview */}
      <div className="px-5 py-3.5" style={{ borderTop: '1px solid var(--divider)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-3)' }}>
          Mode
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: false, icon: Sun, label: 'Light' },
            { key: true, icon: Moon, label: 'Dark' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => key !== isDark && toggleDark()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: isDark === key ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))' : 'var(--surface-2)',
                border: `1px solid ${isDark === key ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                color: isDark === key ? '#818cf8' : 'var(--text-2)',
              }}
            >
              <Icon size={13} />
              {label}
              {isDark === key && <Check size={11} className="ml-auto" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { pathname } = useLocation();

  const title = PAGE_TITLES[pathname]
    || (pathname.startsWith('/orders/') ? 'Order Detail' : 'Inventory Manager');

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between h-16 px-6 flex-shrink-0 transition-colors duration-300"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-[15px] font-bold" style={{ color: 'var(--text-1)' }}>{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              <Bell size={18} />
            </button>

            {/* Profile button + dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all hover:scale-105"
                style={{
                  background: profileOpen ? 'var(--accent-subtle)' : 'transparent',
                  border: `1px solid ${profileOpen ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
                }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,var(--accent-from),var(--accent-to))' }}>
                  IM
                </div>
                <ChevronDown
                  size={13}
                  style={{ color: 'var(--text-3)', transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {profileOpen && (
                <ProfileDropdown onClose={() => setProfileOpen(false)} />
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
