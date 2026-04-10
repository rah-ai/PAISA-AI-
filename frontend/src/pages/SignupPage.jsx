import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    try {
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const features = [
    'Portfolio X-Ray with true XIRR',
    'Real-time Opportunity Radar',
    'Multi-model AI Market Chat',
    'ML Risk Scoring & Tax Optimization',
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-void)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-20 -left-20 font-serif-display select-none" style={{ fontSize: 400, color: 'var(--bg-raised)', opacity: 0.3, lineHeight: 1 }}>₹</div>
        <div className="absolute w-full h-px" style={{ top: '25%', background: 'var(--bg-border)' }} />
        <div className="absolute w-full h-px" style={{ top: '75%', background: 'var(--bg-border)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex gap-12 items-center max-w-4xl w-full px-6"
      >
        {/* Left — value prop */}
        <div className="w-[45%] hidden lg:block">
          <Link to="/">
            <h1 className="font-serif-display mb-2" style={{ fontSize: 36, color: 'var(--gold-mid)' }}>PAISA</h1>
          </Link>
          <p className="font-display-italic mb-8" style={{ fontSize: 28, lineHeight: 1.2, color: 'var(--text-primary)' }}>
            Your portfolio.<br />
            <span style={{ color: 'var(--gold-mid)' }}>Decoded.</span>
          </p>
          <div className="flex flex-col gap-4">
            {features.map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span style={{ width: 16, height: 1, background: 'var(--gold-mid)', display: 'inline-block', flexShrink: 0 }} />
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{text}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            Trusted by investors analyzing ₹120Cr+ in portfolios.
            <br />Multi-model AI: Gemini 2.5 Pro · Groq Llama · DeepSeek R1
          </div>
        </div>

        {/* Right — form */}
        <div className="w-full lg:w-[55%]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/">
              <h1 className="font-serif-display" style={{ fontSize: 32, color: 'var(--gold-mid)' }}>PAISA</h1>
            </Link>
          </div>

          <div className="card" style={{ padding: 40 }}>
            <h2 className="font-serif-display mb-1" style={{ fontSize: 24, color: 'var(--text-primary)' }}>Create your account</h2>
            <p className="font-sans mb-6" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start analyzing your portfolio in 10 seconds</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 px-4 py-3 rounded-card font-mono"
                style={{ fontSize: 12, color: 'var(--red-data)', background: 'rgba(184,64,64,0.08)', border: '1px solid rgba(184,64,64,0.2)' }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="font-label block mb-2" style={{ fontSize: 9, color: 'var(--text-muted)' }}>FULL NAME</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full font-mono"
                  placeholder="Rahul Patel"
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

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="font-label block mb-2" style={{ fontSize: 9, color: 'var(--text-muted)' }}>CONFIRM</label>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
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
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create Account
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 7h10M9 4l3 3-3 3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--bg-border)' }}>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" className="direction-underline" style={{ color: 'var(--gold-mid)' }}>
                  Sign in
                </Link>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
