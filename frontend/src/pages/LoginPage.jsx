import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-void)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 font-serif-display select-none" style={{ fontSize: 400, color: 'var(--bg-raised)', opacity: 0.3, lineHeight: 1 }}>₹</div>
        <div className="absolute w-full h-px" style={{ top: '30%', background: 'var(--bg-border)' }} />
        <div className="absolute w-full h-px" style={{ top: '70%', background: 'var(--bg-border)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="font-serif-display" style={{ fontSize: 32, color: 'var(--gold-mid)' }}>PAISA</h1>
          </Link>
          <p className="font-mono mt-2" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
            PORTFOLIO AI & INTELLIGENT SIGNAL ADVISOR
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 40 }}>
          <h2 className="font-serif-display mb-1" style={{ fontSize: 24, color: 'var(--text-primary)' }}>Welcome back</h2>
          <p className="font-sans mb-8" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sign in to access your portfolio intelligence</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-4 py-3 rounded-card font-mono"
              style={{ fontSize: 12, color: 'var(--red-data)', background: 'rgba(184,64,64,0.08)', border: '1px solid rgba(184,64,64,0.2)' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="font-label block mb-2" style={{ fontSize: 9, color: 'var(--text-muted)' }}>EMAIL</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full font-mono"
                placeholder="you@example.com"
                style={{
                  fontSize: 13, padding: '12px 16px',
                  background: 'var(--bg-void)', border: '1px solid var(--bg-border)',
                  borderRadius: 6, color: 'var(--text-primary)', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
              />
            </div>

            <div>
              <label className="font-label block mb-2" style={{ fontSize: 9, color: 'var(--text-muted)' }}>PASSWORD</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full font-mono"
                placeholder="••••••••"
                style={{
                  fontSize: 13, padding: '12px 16px',
                  background: 'var(--bg-void)', border: '1px solid var(--bg-border)',
                  borderRadius: 6, color: 'var(--text-primary)', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full justify-center mt-2"
              style={{ padding: '14px 20px', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="pulse-dot inline-block rounded-full" style={{ width: 6, height: 6, background: 'currentColor' }} />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 7h10M9 4l3 3-3 3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid var(--bg-border)' }}>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="direction-underline" style={{ color: 'var(--gold-mid)' }}>
                Sign up free
              </Link>
            </span>
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-center mt-6">
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Free forever · No credit card · Instant access
          </span>
        </div>
      </motion.div>
    </div>
  );
}
