import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, Zap } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true, color: '#818cf8' },
  { to: '/products', icon: Package, label: 'Products', color: '#34d399' },
  { to: '/customers', icon: Users, label: 'Customers', color: '#f472b6' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', color: '#fb923c' },
];

export default function Sidebar({ onClose }) {
  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))' }}>
          <Zap size={16} color="white" fill="white" />
        </div>
        <span className="font-bold text-white text-[15px] tracking-tight">Inventory Manager</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-3"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          Main Menu
        </p>
        {navItems.map(({ to, icon: Icon, label, end, color }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'sidebar-item-active text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  }}>
                  <Icon size={16} color={isActive ? 'white' : color} />
                </span>
                <span>{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
          <span className="text-xs text-slate-500">All systems operational</span>
        </div>
      </div>
    </div>
  );
}
