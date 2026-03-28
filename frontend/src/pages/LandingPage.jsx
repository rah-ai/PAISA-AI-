import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CurtainReveal, WordSplitReveal, BlurReveal, ClipPathWipe, ElasticSpring } from '../components/Animations';
import { useScrollProgress, useCardTilt } from '../hooks/useAnimations';

/* ─── Scroll Progress Line ─── */
function ScrollProgressLine() {
  const progress = useScrollProgress();
  const scaleX = useSpring(progress, { stiffness: 100, damping: 30 });
  const bg = useTransform(progress, [0, 0.5, 1], ['#8B6914', '#C9A84C', '#C9A84C']);

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX, background: bg, width: '100%' }}
    />
  );
}

/* ─── SVG Wireframe Dashboard ─── */
function WireframeDashboard() {
  const { springRotateX, springRotateY, handleMouseMove, handleMouseLeave } = useCardTilt();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 800, rotateX: springRotateX, rotateY: springRotateY }}
      className="w-full max-w-[500px] aspect-[4/3] relative"
    >
      <div className="w-full h-full rounded-card p-6 relative overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
      >
        <svg className="w-full h-full" fill="none" viewBox="0 0 400 300">
          {[
            <rect key="tb" x="20" y="20" width="360" height="30" rx="2" />,
            <rect key="tl" x="30" y="31" width="60" height="8" rx="1" />,
            <circle key="tc" cx="360" cy="35" r="8" />,
            <rect key="c1" x="20" y="65" width="170" height="100" rx="2" />,
            <rect key="c2" x="210" y="65" width="170" height="100" rx="2" />,
            <line key="l1" x1="40" y1="85" x2="150" y2="85" />,
            <line key="l2" x1="40" y1="105" x2="110" y2="105" />,
            <line key="l3" x1="40" y1="125" x2="130" y2="125" />,
            <line key="l4" x1="230" y1="85" x2="360" y2="85" />,
            <line key="l5" x1="230" y1="105" x2="320" y2="105" />,
            <rect key="b" x="20" y="180" width="360" height="90" rx="2" />,
            <line key="b1" x1="40" y1="210" x2="360" y2="210" />,
            <line key="b2" x1="40" y1="235" x2="360" y2="235" />,
            <line key="b3" x1="40" y1="260" x2="280" y2="260" />,
          ].map((el, i) =>
            React.cloneElement(el, {
              stroke: 'var(--gold-dim)',
              strokeWidth: 1,
              strokeDasharray: inView ? 0 : 1000,
              strokeDashoffset: inView ? 0 : 1000,
              style: { transition: `stroke-dashoffset 1.8s ease ${i * 0.15}s, stroke-dasharray 1.8s ease ${i * 0.15}s` },
            })
          )}
        </svg>
        <div className="absolute top-8 right-8 font-mono rounded-btn"
          style={{ fontSize: 10, padding: '4px 8px', color: 'var(--green-data)', background: 'rgba(46,158,104,0.1)', border: '1px solid rgba(46,158,104,0.2)' }}
        >XIRR +14.3%</div>
        <div className="absolute bottom-24 left-8 font-mono rounded-btn"
          style={{ fontSize: 10, padding: '4px 8px', color: 'var(--gold-mid)', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}
        >₹24.4L AUM</div>
      </div>
    </motion.div>
  );
}

/* ─── Hero Stats ─── */
function HeroStats() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });
  const stats = [
    { value: '₹1.2L', label: 'AVG HIDDEN EXPENSE DRAG/YR' },
    { value: '14Cr+', label: 'DEMAT ACCOUNTS IN INDIA' },
    { value: '< 10s', label: 'TO FULL PORTFOLIO ANALYSIS' },
  ];

  return (
    <div ref={ref} className="flex flex-wrap gap-8 mt-12">
      {stats.map((stat, i) => (
        <motion.div key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: i * 0.15, ease: 'easeOut' }}
        >
          <div className="font-mono" style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
          <div className="font-label mt-1" style={{ color: 'var(--text-muted)', fontSize: 9 }}>{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ title, description, subFeatures, delay = 0, goldLabel, badge }) {
  const { springRotateX, springRotateY, handleMouseMove, handleMouseLeave } = useCardTilt();

  return (
    <ClipPathWipe delay={delay}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="card h-full"
        style={{ perspective: 800, rotateX: springRotateX, rotateY: springRotateY, padding: 32 }}
      >
        <div className="flex items-center gap-2 mb-4">
          {goldLabel && <div className="font-label" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>{goldLabel}</div>}
          {badge && (
            <span className="font-label px-1.5 py-0.5 rounded-chip" style={{ fontSize: 7, color: 'var(--gold-mid)', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>{badge}</span>
          )}
        </div>
        <h3 className="font-serif-display mb-3" style={{ fontSize: 22, color: 'var(--text-primary)' }}>{title}</h3>
        <p className="font-sans mb-5" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{description}</p>
        {subFeatures && (
          <div className="flex flex-col gap-3">
            {subFeatures.map((sf, i) => (
              <div key={i} className="flex items-start gap-3 pl-3" style={{ borderLeft: '2px solid var(--gold-dim)' }}>
                <div>
                  <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{sf.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{sf.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </ClipPathWipe>
  );
}

/* ─── Landing Page ─── */
export default function LandingPage() {
  const { scrollY } = useScroll();
  const rupeeY = useTransform(scrollY, [0, 1000], [0, 50]);
  const linesY = useTransform(scrollY, [0, 1000], [0, 150]);
  const wireframeY = useTransform(scrollY, [0, 1000], [0, 350]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
    >
      <ScrollProgressLine />
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'var(--bg-void)', paddingTop: 64 }}>
        <motion.span style={{ y: rupeeY }} className="absolute -bottom-20 -left-10 font-serif-display select-none pointer-events-none" aria-hidden>
          <span style={{ fontSize: 'clamp(300px, 40vw, 600px)', color: 'var(--bg-raised)', lineHeight: 1, opacity: 0.5 }}>₹</span>
        </motion.span>
        <motion.div style={{ y: linesY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute w-full h-px" style={{ top: '30%', background: 'var(--bg-border)' }} />
          <div className="absolute w-full h-px" style={{ top: '60%', background: 'var(--bg-border)' }} />
          <div className="absolute w-full h-px" style={{ top: '80%', background: 'var(--bg-border)' }} />
        </motion.div>

        <div className="max-w-[1400px] mx-auto w-full px-6 flex items-center gap-16" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="w-[55%]">
            <CurtainReveal>
              <h1 className="font-display-italic" style={{ fontSize: 'clamp(48px, 5.5vw, 80px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--text-primary)', paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
                Your portfolio.
              </h1>
            </CurtainReveal>
            <CurtainReveal delay={0.12}>
              <h1 className="font-display-italic" style={{ fontSize: 'clamp(48px, 5.5vw, 80px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--gold-mid)', paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
                Decoded.
              </h1>
            </CurtainReveal>
            <CurtainReveal delay={0.24}>
              <h1 className="font-display-italic" style={{ fontSize: 'clamp(48px, 5.5vw, 80px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--text-primary)', paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
                In 10 seconds.
              </h1>
            </CurtainReveal>

            <div className="mt-6">
              <WordSplitReveal
                text="Upload your CAMS statement. PAISA calculates your true XIRR, finds hidden fund overlaps, detects tax-saving opportunities, and tells you exactly what to do next."
                delay={0.5}
                className="font-sans"
              />
            </div>

            <div className="flex items-center gap-6 mt-10">
              <Link to="/signup" className="btn-gold" style={{ padding: '14px 28px' }}>
                Get Started Free
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 7h10M9 4l3 3-3 3" />
                </svg>
              </Link>
              <Link to="/login" className="direction-underline font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Sign in
              </Link>
            </div>

            <HeroStats />
          </div>

          <motion.div className="w-[45%] flex items-center justify-center" style={{ y: wireframeY }}>
            <WireframeDashboard />
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ background: 'var(--section-alt)' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-14">
          <CurtainReveal>
            <h2 className="font-serif-display text-center mb-4" style={{ fontSize: 36, color: 'var(--text-primary)' }}>How It Works</h2>
          </CurtainReveal>
          <BlurReveal className="text-center mb-16">
            <p className="font-sans mx-auto" style={{ maxWidth: 500, fontSize: 15, color: 'var(--text-secondary)' }}>Three steps. Ten seconds. Complete clarity.</p>
          </BlurReveal>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                step: '01', title: 'Drop your statement.',
                desc: 'Upload your CAMS or KFintech PDF. We accept all standard mutual fund statement formats.',
                icon: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--gold-mid)" strokeWidth="1.5"><rect x="6" y="3" width="20" height="26" rx="2" /><path d="M16 10v8M13 15l3 3 3-3" /></svg>,
              },
              {
                step: '02', title: 'AI reads every line.',
                desc: 'Five specialized agents — X-Ray, Risk, Tax, Radar, and Chat — parse your portfolio data simultaneously.',
                icon: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--gold-mid)" strokeWidth="1.5"><circle cx="16" cy="16" r="12" /><path d="M16 4v24M4 16h24" /><circle cx="16" cy="16" r="4" /></svg>,
              },
              {
                step: '03', title: 'Know exactly what to do.',
                desc: 'Get true XIRR, overlaps, risk scores, tax optimization, and AI-powered rebalancing recommendations.',
                icon: <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--gold-mid)" strokeWidth="1.5"><path d="M6 26V14l6-6 6 6v12" /><path d="M18 26V16l6-6v16" /><path d="M10 26v-6h4v6" /></svg>,
              },
            ].map((item, i) => (
              <ElasticSpring key={i} delay={i * 0.1}>
                <div className="card relative" style={{ padding: 32 }}>
                  <div className="font-mono mb-6" style={{ color: 'var(--gold-dim)', fontSize: 11, letterSpacing: '0.12em' }}>STEP {item.step}</div>
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="font-serif-display mb-3" style={{ fontSize: 20, color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p className="font-sans" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </ElasticSpring>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ background: 'var(--section-alt2)' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-14">
          <CurtainReveal>
            <h2 className="font-serif-display mb-4" style={{ fontSize: 36, color: 'var(--text-primary)' }}>What PAISA Sees</h2>
          </CurtainReveal>
          <BlurReveal className="mb-6">
            <p className="font-sans" style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 600 }}>
              Eight AI-powered tools working together to give you complete portfolio intelligence.
            </p>
          </BlurReveal>

          {/* Row 1 — 3 main features */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <FeatureCard
              goldLabel="X-RAY AGENT"
              title="Portfolio X-Ray"
              description="Complete decomposition of your mutual fund portfolio. True XIRR calculation, fund overlap detection, expense drag analysis."
              subFeatures={[
                { title: 'True XIRR', desc: 'Cash-flow weighted returns using scipy' },
                { title: 'Overlap Heatmap', desc: 'Jaccard similarity across fund pairs' },
              ]}
              delay={0}
            />
            <FeatureCard
              goldLabel="RISK ENGINE"
              badge="ML"
              title="Risk Score"
              description="ML-powered portfolio risk assessment across 5 factors. Animated risk gauge with actionable recommendations."
              subFeatures={[
                { title: '5-Factor Model', desc: 'Concentration, overlap, expense, diversification, sector' },
                { title: 'AI Recommendations', desc: 'Smart steps to reduce portfolio risk' },
              ]}
              delay={0.1}
            />
            <FeatureCard
              goldLabel="TAX ENGINE"
              badge="AI"
              title="Tax Optimizer"
              description="Automated LTCG/STCG analysis with tax-loss harvesting opportunities and optimization strategies."
              subFeatures={[
                { title: 'Harvesting', desc: 'Identify losses to offset against gains' },
                { title: 'Smart Timing', desc: 'WAIT/DEFER strategies to reduce tax' },
              ]}
              delay={0.2}
            />
          </div>

          {/* Row 2 — 3 more features */}
          <div className="grid grid-cols-3 gap-6">
            <FeatureCard
              goldLabel="RADAR AGENT"
              title="Opportunity Radar"
              description="Real-time tracking of insider trades and bulk deals from BSE/NSE with AI-scored confidence levels."
              subFeatures={[
                { title: 'Live Signals', desc: 'Director & institutional activity tracking' },
              ]}
              delay={0.3}
            />
            <FeatureCard
              goldLabel="CHAT AGENT"
              title="Market Chat"
              description="Context-aware AI advisor that knows your exact portfolio. Multi-model routing for best responses."
              subFeatures={[
                { title: 'Portfolio-Aware', desc: 'Knows your holdings, returns, overlaps' },
              ]}
              delay={0.4}
            />
            <FeatureCard
              goldLabel="IMPACT"
              title="Impact Report"
              description="Quantified financial impact — advisory time saved, expense waste identified, and recoverable alpha."
              subFeatures={[
                { title: 'Personalized', desc: 'Your portfolio-specific impact numbers' },
              ]}
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ─── TECH STACK ─── */}
      <section style={{ background: 'var(--section-alt3)' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-14">
          <div className="flex gap-16">
            <div className="w-[40%]">
              <CurtainReveal>
                <h2 className="font-display-italic" style={{ fontSize: 42, lineHeight: 1.15, color: 'var(--text-primary)' }}>Multi-model AI.</h2>
              </CurtainReveal>
              <CurtainReveal delay={0.12}>
                <h2 className="font-display-italic" style={{ fontSize: 42, lineHeight: 1.15, color: 'var(--gold-mid)' }}>Zero cost.</h2>
              </CurtainReveal>
              <BlurReveal delay={0.4} className="mt-6">
                <p className="font-sans" style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  PAISA routes different tasks to the best-fit AI model. All on free tiers. No API costs passed to you.
                </p>
              </BlurReveal>
            </div>
            <div className="w-[60%] flex flex-col gap-4">
              {[
                { model: 'Gemini 2.5 Pro', role: 'Deep portfolio analysis, rebalancing logic, complex financial reasoning', tag: 'PRIMARY' },
                { model: 'Gemini 2.0 Flash', role: 'Quick chat responses, real-time market Q&A, portfolio summaries', tag: 'SPEED' },
                { model: 'Groq Llama 3.3 70B', role: 'Signal analysis, pattern detection, bulk deal confidence scoring', tag: 'FALLBACK' },
                { model: 'DeepSeek R1', role: 'Complex mathematical reasoning, XIRR edge cases, tax calculations', tag: 'REASONING' },
                { model: 'Ollama Mistral:latest', role: 'Local deep research, unlimited secure screening, absolute fallback agent', tag: 'LOCAL' },
              ].map((row, i) => (
                <ElasticSpring key={i} delay={i * 0.1}>
                  <div className="card flex items-center gap-6" style={{ padding: 20 }}>
                    <span className="font-label px-2 py-1 rounded-chip flex-shrink-0" style={{ fontSize: 8, color: 'var(--gold-mid)', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                      {row.tag}
                    </span>
                    <div className="flex-1">
                      <div className="font-mono" style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{row.model}</div>
                      <div className="font-sans mt-1" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{row.role}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="pulse-dot inline-block rounded-full" style={{ width: 5, height: 5, background: 'var(--green-data)' }} />
                      <span className="font-label" style={{ fontSize: 8, color: 'var(--green-data)' }}>READY</span>
                    </div>
                  </div>
                </ElasticSpring>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ background: 'var(--section-alt4)' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-14 text-center">
          <CurtainReveal>
            <h2 className="font-display-italic mb-4" style={{ fontSize: 48, color: 'var(--text-primary)' }}>
              Ready to decode your portfolio?
            </h2>
          </CurtainReveal>
          <BlurReveal delay={0.3} className="mb-10">
            <p className="font-sans mx-auto" style={{ maxWidth: 500, fontSize: 15, color: 'var(--text-secondary)' }}>
              Free forever. No credit card. Under 10 seconds to your first insight.
            </p>
          </BlurReveal>
          <Link to="/signup" className="btn-gold" style={{ padding: '16px 36px', fontSize: 13 }}>
            Create Free Account
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 7h10M9 4l3 3-3 3" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </motion.div>
  );
}
