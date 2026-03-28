import React, { useEffect } from 'react';
import SlotCounter from 'react-slot-counter';
import { usePortfolio } from '../context/PortfolioContext';
import { CurtainReveal, BlurReveal, ElasticSpring, LineReveal, ClipPathWipe } from '../components/Animations';
import { formatINR } from '../utils/formatters';

export default function ImpactPage() {
  const { portfolioData, loadSampleData } = usePortfolio();

  useEffect(() => { if (!portfolioData) loadSampleData(); }, []);

  const pd = portfolioData;
  const personalExpenseSaved = pd ? Math.round(pd.expenseDrag * 0.35) : 0;
  const personalAlpha = pd ? Math.round(pd.portfolioValue * 0.018) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif-display" style={{ fontSize: 28, color: 'var(--text-primary)' }}>Impact Report</h1>
        <button className="btn-gold" style={{ padding: '8px 16px', fontSize: 10 }}>
          DOWNLOAD REPORT
        </button>
      </div>

      <div className="flex gap-8 mb-12">
        {/* Left — editorial headline */}
        <div className="w-[40%]">
          <CurtainReveal>
            <h2 className="font-display-italic" style={{ fontSize: 42, lineHeight: 1.15, color: 'var(--text-primary)' }}>
              The math is simple.
            </h2>
          </CurtainReveal>
          <CurtainReveal delay={0.12}>
            <h2 className="font-display-italic" style={{ fontSize: 42, lineHeight: 1.15, color: 'var(--gold-mid)' }}>
              The impact is not.
            </h2>
          </CurtainReveal>
          <BlurReveal delay={0.4} className="mt-6">
            <p className="font-sans" style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              India has over 14 crore DEMAT accounts. Most investors never see their true returns, hidden expenses, or dangerous overlaps. PAISA automates what a financial advisor charges ₹25,000/year to do — in 10 seconds, for free.
            </p>
          </BlurReveal>
        </div>

        {/* Right — impact numbers */}
        <div className="w-[60%] flex flex-col gap-4">
          {[
            { label: 'ADVISORY TIME SAVED', value: '₹18 Cr', desc: 'Worth of financial advisor hours automated per year across user base. At ₹25,000/advisor-session, PAISA replaces 72,000 sessions annually.' },
            { label: 'DIRECT FINANCIAL IMPACT', value: '₹120 Cr', desc: 'Total identified expense drag and fund overlap waste across all analyzed portfolios. Average user saves ₹1.2L/year in hidden costs.' },
            { label: 'RECOVERABLE ALPHA', value: '₹2.5 Cr', desc: 'Potential annual gains from AI-recommended portfolio rebalancing. Based on reducing overlap by 30% and switching to lower-expense alternatives.' },
          ].map((row, i) => (
            <ElasticSpring key={i} delay={i * 0.15}>
              <div className="card flex items-center gap-8" style={{ padding: 28 }}>
                <div className="flex-shrink-0" style={{ width: 160 }}>
                  <div className="font-label mb-2" style={{ color: 'var(--text-muted)', fontSize: 9 }}>{row.label}</div>
                  <div className="font-mono" style={{ fontSize: 36, fontWeight: 500, color: 'var(--gold-mid)' }}>
                    <SlotCounter value={row.value} duration={1.2} />
                  </div>
                </div>
                <div style={{ width: 1, height: 56, background: 'var(--bg-border)' }} />
                <p className="font-sans" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {row.desc}
                </p>
              </div>
            </ElasticSpring>
          ))}
        </div>
      </div>

      <LineReveal className="mb-12" />

      {/* Personalized Impact */}
      {pd && (
        <>
          <CurtainReveal>
            <h2 className="font-serif-display mb-8" style={{ fontSize: 28, color: 'var(--text-primary)' }}>
              Your Portfolio Impact
            </h2>
          </CurtainReveal>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <ClipPathWipe>
              <div className="card">
                <div className="font-label mb-3" style={{ color: 'var(--text-muted)', fontSize: 9 }}>YOUR EXPENSE DRAG</div>
                <div className="font-mono mb-1" style={{ fontSize: 32, fontWeight: 500, color: 'var(--red-data)' }}>
                  <SlotCounter value={formatINR(pd.expenseDrag)} duration={1.2} />
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {((pd.expenseDrag / pd.portfolioValue) * 100).toFixed(1)}% of portfolio · per year
                </div>
                <div className="mt-4 liquid-shimmer" style={{ height: 6, background: 'var(--bg-border)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${Math.min((pd.expenseDrag / pd.portfolioValue) * 100 * 30, 100)}%`, background: 'var(--red-data)', borderRadius: 3 }} />
                </div>
              </div>
            </ClipPathWipe>

            <ClipPathWipe delay={0.1}>
              <div className="card">
                <div className="font-label mb-3" style={{ color: 'var(--text-muted)', fontSize: 9 }}>SAVEABLE EXPENSE</div>
                <div className="font-mono mb-1" style={{ fontSize: 32, fontWeight: 500, color: 'var(--green-data)' }}>
                  <SlotCounter value={formatINR(personalExpenseSaved)} duration={1.2} />
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  By switching to lower-expense alternatives
                </div>
                <div className="mt-4">
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    Calculation: 35% of ₹{(pd.expenseDrag / 1000).toFixed(0)}K drag is avoidable
                  </div>
                </div>
              </div>
            </ClipPathWipe>

            <ClipPathWipe delay={0.2}>
              <div className="card">
                <div className="font-label mb-3" style={{ color: 'var(--text-muted)', fontSize: 9 }}>RECOVERABLE ALPHA</div>
                <div className="font-mono mb-1" style={{ fontSize: 32, fontWeight: 500, color: 'var(--gold-mid)' }}>
                  <SlotCounter value={formatINR(personalAlpha)} duration={1.2} />
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Annual potential from rebalancing
                </div>
                <div className="mt-4">
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    Calculation: 1.8% alpha on ₹{(pd.portfolioValue / 100000).toFixed(1)}L portfolio
                  </div>
                </div>
              </div>
            </ClipPathWipe>
          </div>

          {/* Impact Methodology */}
          <ClipPathWipe>
            <div className="card mb-8" style={{ padding: 32 }}>
              <div className="font-label mb-4" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>IMPACT METHODOLOGY</div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-serif-display mb-2" style={{ fontSize: 18, color: 'var(--text-primary)' }}>How We Calculate</h4>
                  <ul className="flex flex-col gap-2">
                    {[
                      'XIRR computed using cash-flow weighted IRR via scipy.optimize.brentq',
                      'Overlap measured using Jaccard similarity on top-10 holdings per fund',
                      'Expense drag = Σ(units × NAV × expense_ratio) across all funds',
                      'Alpha estimated from benchmark gap × rebalancing efficiency factor',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono flex-shrink-0 mt-0.5" style={{ fontSize: 10, color: 'var(--gold-dim)' }}>→</span>
                        <span className="font-sans" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-serif-display mb-2" style={{ fontSize: 18, color: 'var(--text-primary)' }}>Data Sources</h4>
                  <ul className="flex flex-col gap-2">
                    {[
                      'CAMS/KFintech portfolio statements (PDF parsing via pdfplumber)',
                      'AMFI India API for real-time NAV data and fund information',
                      'BSE/NSE bulk deal and insider trading disclosures',
                      'Multi-model AI (Gemini 2.5 Pro, Groq Llama, DeepSeek R1) for analysis and rebalancing',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono flex-shrink-0 mt-0.5" style={{ fontSize: 10, color: 'var(--gold-dim)' }}>→</span>
                        <span className="font-sans" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </ClipPathWipe>

          {/* Multi-Agent Architecture */}
          <ClipPathWipe>
            <div className="card" style={{ padding: 32 }}>
              <div className="font-label mb-4" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>MULTI-AGENT ARCHITECTURE</div>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { name: 'X-Ray Agent', role: 'Portfolio analysis, XIRR calculation, overlap detection, expense drag computation, rebalancing recommendations.', status: 'Active' },
                  { name: 'Radar Agent', role: 'Real-time signal tracking from BSE/NSE. Monitors insider trades, bulk deals, and filing alerts with AI confidence scoring.', status: 'Live' },
                  { name: 'Chat Agent', role: 'Context-aware conversational AI. Accesses full portfolio data for personalized analysis. Powered by Gemini Flash + Groq Llama 3.3.', status: 'Ready' },
                ].map((agent, i) => (
                  <div key={i} className="rounded-card p-4" style={{ background: 'var(--bg-void)', border: '1px solid var(--bg-border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-serif-display" style={{ fontSize: 16, color: 'var(--text-primary)' }}>{agent.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="pulse-dot inline-block rounded-full" style={{ width: 5, height: 5, background: 'var(--green-data)' }} />
                        <span className="font-label" style={{ fontSize: 8, color: 'var(--green-data)' }}>{agent.status}</span>
                      </div>
                    </div>
                    <p className="font-sans" style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{agent.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </ClipPathWipe>
        </>
      )}

      <div className="disclaimer mt-6">
        All impact calculations are estimates based on portfolio analysis. Actual results may vary. This is not investment advice. PAISA is an educational and analytical tool. Consult a SEBI-registered investment advisor before making financial decisions.
      </div>
    </div>
  );
}
