import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const ACCENT_MAP = {
  indigo:  { from: '#6366f1', to: '#8b5cf6', glow: 'rgba(99,102,241,0.35)',  text: '#818cf8', subtle: 'rgba(99,102,241,0.12)'  },
  blue:    { from: '#3b82f6', to: '#1d4ed8', glow: 'rgba(59,130,246,0.35)',  text: '#60a5fa', subtle: 'rgba(59,130,246,0.12)'  },
  emerald: { from: '#10b981', to: '#059669', glow: 'rgba(16,185,129,0.35)', text: '#34d399', subtle: 'rgba(16,185,129,0.12)' },
  rose:    { from: '#f43f5e', to: '#e11d48', glow: 'rgba(244,63,94,0.35)',   text: '#fb7185', subtle: 'rgba(244,63,94,0.12)'   },
  amber:   { from: '#f59e0b', to: '#d97706', glow: 'rgba(245,158,11,0.35)',  text: '#fbbf24', subtle: 'rgba(245,158,11,0.12)'  },
};

export const ACCENT_COLORS = [
  { key: 'indigo',  label: 'Indigo'  },
  { key: 'blue',    label: 'Blue'    },
  { key: 'emerald', label: 'Emerald' },
  { key: 'rose',    label: 'Rose'    },
  { key: 'amber',   label: 'Amber'   },
];

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || 'indigo';
  });

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Apply accent CSS variables
  useEffect(() => {
    const c = ACCENT_MAP[accentColor] || ACCENT_MAP.indigo;
    const root = document.documentElement;
    root.style.setProperty('--accent-from', c.from);
    root.style.setProperty('--accent-to', c.to);
    root.style.setProperty('--accent-glow', c.glow);
    root.style.setProperty('--accent-text', c.text);
    root.style.setProperty('--accent-subtle', c.subtle);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  const toggleDark = () => setIsDark((d) => !d);

  // Convenience values for inline styles
  const accent = ACCENT_MAP[accentColor] || ACCENT_MAP.indigo;

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, accentColor, setAccentColor, accent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
export { ACCENT_MAP };
