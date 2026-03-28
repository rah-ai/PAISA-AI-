import React from 'react';
import { Link } from 'react-router-dom';
import { LineReveal, BlurReveal } from './Animations';

export default function Footer() {
  return (
    <footer id="about" style={{ background: 'var(--bg-void)', paddingTop: 0 }}>
      <LineReveal className="mx-6" />

      {/* About Section */}
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="flex gap-16">
          {/* Brand */}
          <div className="w-[30%]">
            <h3 className="font-display-italic mb-3" style={{ fontSize: 28, color: 'var(--gold-mid)' }}>
              PAISA
            </h3>
            <p className="font-sans" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              Portfolio AI & Intelligent Signal Advisor. The intelligence layer your portfolio never had. Har rupee ko samjho.
            </p>
          </div>

          {/* Quick Links */}
          <div className="w-[20%]">
            <div className="font-label mb-4" style={{ color: 'var(--text-muted)', fontSize: 10 }}>PRODUCT</div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Portfolio X-Ray', href: '/dashboard/xray' },
                { label: 'Opportunity Radar', href: '/dashboard/radar' },
                { label: 'Market Chat', href: '/dashboard/chat' },
                { label: 'Impact Report', href: '/dashboard/impact' },
              ].map(link => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="direction-underline font-mono transition-colors"
                  style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="w-[25%]">
            <div className="font-label mb-4" style={{ color: 'var(--text-muted)', fontSize: 10 }}>HOW IT WORKS</div>
            <div className="flex flex-col gap-3">
              {[
                'Upload your CAMS/KFintech PDF',
                'AI agents analyze your portfolio',
                'Get XIRR, overlaps & rebalancing',
                'Track insider trades & bulk deals',
              ].map(step => (
                <div key={step} className="flex items-start gap-2">
                  <span style={{ color: 'var(--gold-dim)', fontSize: 10, marginTop: 4 }}>▸</span>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech & Contact */}
          <div className="w-[25%]">
            <div className="font-label mb-4" style={{ color: 'var(--text-muted)', fontSize: 10 }}>POWERED BY</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {['Gemini 2.5 Pro', 'Gemini Flash', 'Groq Llama', 'DeepSeek R1', 'React', 'FastAPI'].map(tech => (
                <span
                  key={tech}
                  className="font-mono px-2 py-1 rounded-chip"
                  style={{ fontSize: 9, color: 'var(--text-muted)', border: '1px solid var(--bg-border)', background: 'var(--bg-surface)' }}
                >
                  {tech}
                </span>
              ))}
            </div>
            <div className="font-label mb-2" style={{ color: 'var(--text-muted)', fontSize: 10 }}>OPEN SOURCE</div>
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Built as a demonstration of multi-model AI routing for financial intelligence.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--bg-border)' }}>
        <div
          className="max-w-[1400px] mx-auto px-6 flex items-center justify-between"
          style={{ height: 48 }}
        >
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            © 2026 PAISA · Portfolio AI & Intelligent Signal Advisor
          </span>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            Multi-Model AI · Free Tier · No Investment Advice
          </span>
        </div>
      </div>
    </footer>
  );
}
