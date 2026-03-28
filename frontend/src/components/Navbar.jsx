import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useScroll } from 'framer-motion';
import { useScramble } from 'use-scramble';
import { ThemeToggle } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

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

  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 50));
  }, [scrollY]);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'About', href: '/#about' },
  ];

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        height: scrolled ? 48 : 64,
        background: 'var(--bg-void)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--bg-border)',
        transition: 'height 0.3s ease, background 0.3s ease',
      }}
    >
      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-1">
          <span
            ref={scrambleRef}
            className="font-serif-display"
            style={{ fontSize: scrolled ? 18 : 20, transition: 'font-size 0.3s ease', color: 'var(--gold-mid)' }}
          />
          <span className="font-mono" style={{ fontSize: 9, marginTop: 8, color: 'var(--text-muted)' }}>
            beta
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="direction-underline font-mono transition-colors"
              style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}
            >
              {link.label}
            </a>
          ))}
          <ThemeToggle />
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="btn-gold"
              style={{ padding: '8px 16px', fontSize: '0.625rem' }}
            >
              Dashboard
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 6h8M7 3l3 3-3 3" />
              </svg>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="font-mono direction-underline"
                style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}
              >
                SIGN IN
              </Link>
              <Link
                to="/signup"
                className="btn-gold"
                style={{ padding: '8px 16px', fontSize: '0.625rem' }}
              >
                Get Started
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 6h8M7 3l3 3-3 3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
