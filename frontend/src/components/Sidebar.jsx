import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useScramble } from 'use-scramble';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../context/ThemeContext';

const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="2" width="6" height="6" rx="1" />
        <rect x="10" y="2" width="6" height="6" rx="1" />
        <rect x="2" y="10" width="6" height="6" rx="1" />
        <rect x="10" y="10" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Portfolio X-Ray',
    path: '/dashboard/xray',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="9" cy="9" r="7" />
        <path d="M9 2v14M2 9h14M4 4l10 10M14 4L4 14" />
      </svg>
    ),
  },
  {
    label: 'Risk Score',
    path: '/dashboard/risk',
    badge: 'ML',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M9 2l2 4 4.5.6-3.25 3.2.8 4.5L9 12.1l-4.05 2.2.8-4.5L2.5 6.6 7 6z" />
      </svg>
    ),
  },
  {
    label: 'Tax Optimizer',
    path: '/dashboard/tax',
    badge: 'AI',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="3" y="2" width="12" height="14" rx="1" />
        <path d="M6 6h6M6 9h4M6 12h5" />
        <circle cx="13" cy="13" r="3" fill="var(--bg-surface)" />
        <path d="M12 13h2M13 12v2" stroke="var(--green-data)" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: 'Opportunity Radar',
    path: '/dashboard/radar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="9" cy="9" r="7" />
        <circle cx="9" cy="9" r="3" />
        <path d="M9 2v3M9 13v3M2 9h3M13 9h3" />
      </svg>
    ),
  },
  {
    label: 'Market Chat',
    path: '/dashboard/chat',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M3 3h12v9H6l-3 3V3z" />
        <path d="M6 7h6M6 9.5h4" />
      </svg>
    ),
  },
  {
    label: 'Stock Predictor',
    path: '/dashboard/predict',
    badge: 'DL',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M2 14l4-5 3 3 5-8" />
        <circle cx="14" cy="4" r="2" />
        <path d="M2 14h14" />
      </svg>
    ),
  },
  {
    label: 'Impact Report',
    path: '/dashboard/impact',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M3 15V7l4-4 4 4v8" />
        <path d="M11 15V9l4-4v10" />
        <path d="M7 15v-4h2v4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { portfolioData } = usePortfolio();
  const { user, logout } = useAuth();

  const { ref: scrambleRef } = useScramble({
    text: 'PAISA',
    speed: 0.6,
    tick: 1,
    step: 1,
    scramble: 8,
    seed: 2,
    chance: 0.8,
    overdrive: false,
    overflow: false,
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.initials || 'U';
  const displayName = user?.name || 'User';

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 flex flex-col"
      style={{
        width: 240,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--bg-border)',
        zIndex: 40,
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-1.5">
          <span
            ref={scrambleRef}
            className="font-serif-display"
            style={{ fontSize: 20, color: 'var(--gold-mid)' }}
          />
          <span className="font-mono" style={{ fontSize: 9, marginTop: 6, color: 'var(--text-muted)' }}>
            beta
          </span>
        </div>
      </div>

      {/* User */}
      <div className="px-6 pb-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full font-mono"
            style={{
              width: 32, height: 32,
              background: 'var(--bg-raised)',
              border: '1px solid var(--bg-border)',
              fontSize: 11,
              color: 'var(--text-secondary)'
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{displayName}</div>
            <div className="flex items-center gap-1">
              <span
                className="pulse-dot inline-block rounded-full"
                style={{ width: 6, height: 6, background: portfolioData ? 'var(--green-data)' : 'var(--text-muted)' }}
              />
              <span className="font-mono" style={{ fontSize: 9, color: portfolioData ? 'var(--green-data)' : 'var(--text-muted)', letterSpacing: '0.05em' }}>
                {portfolioData ? 'Portfolio Active' : 'No Portfolio'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5 transition-all"
              style={{
                background: isActive ? 'var(--bg-raised)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                borderLeft: isActive ? '2px solid var(--gold-mid)' : '2px solid transparent',
                fontSize: 13,
              }}
            >
              <span style={{ color: isActive ? 'var(--gold-mid)' : 'inherit' }}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="font-label px-1.5 py-0.5 rounded-chip" style={{
                  fontSize: 7,
                  color: 'var(--gold-mid)',
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.2)',
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — Theme + Logout */}
      <div className="px-6 py-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 font-mono w-full transition-colors"
          style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M9 10l3-3-3-3M12 7H5" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
