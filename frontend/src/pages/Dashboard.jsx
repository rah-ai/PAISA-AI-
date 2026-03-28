import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import SlotCounter from 'react-slot-counter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { usePortfolio } from '../context/PortfolioContext';
import { ClipPathWipe, ElasticSpring } from '../components/Animations';
import { useCardTilt } from '../hooks/useAnimations';
import { formatINR, formatCompactINR } from '../utils/formatters';

/* Stat Card with 3D tilt */
function StatCard({ label, value, sub, color, pulse, delay = 0 }) {
  const { springRotateX, springRotateY, handleMouseMove, handleMouseLeave } = useCardTilt(4, 3);

  return (
    <ClipPathWipe delay={delay}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="card"
        style={{ perspective: 800, rotateX: springRotateX, rotateY: springRotateY }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="font-label" style={{ color: 'var(--text-muted)', fontSize: 9 }}>{label}</span>
          {pulse && <span className="pulse-dot inline-block rounded-full" style={{ width: 5, height: 5, background: 'var(--gold-mid)' }} />}
        </div>
        <div className="font-mono" style={{ fontSize: 28, fontWeight: 500, color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          <SlotCounter value={value} duration={1.2} />
        </div>
        <div className="font-mono mt-1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
      </motion.div>
    </ClipPathWipe>
  );
}

/* Overlap Cell */
function OverlapCell({ value, fundA, fundB }) {
  const bg = value > 0.4 ? 'rgba(184,64,64,0.3)' : value > 0.2 ? 'rgba(184,64,64,0.15)' : 'rgba(31,31,44,0.5)';
  return (
    <div
      className="flex items-center justify-center font-mono cursor-default relative group"
      style={{ width: '100%', aspectRatio: '1', background: bg, fontSize: 10, color: 'var(--text-secondary)', borderRadius: 2 }}
      title={`${fundA} × ${fundB}: ${(value * 100).toFixed(0)}%`}
    >
      {value === 1 ? '—' : (value * 100).toFixed(0)}
    </div>
  );
}

/* Signal Mini Row */
function MiniSignalRow({ signal }) {
  const typeColors = {
    INSIDER_BUY: { bg: 'rgba(46,158,104,0.1)', color: 'var(--green-data)', border: 'rgba(46,158,104,0.2)' },
    BULK_DEAL: { bg: 'rgba(58,127,212,0.1)', color: 'var(--blue-data)', border: 'rgba(58,127,212,0.2)' },
  };
  const tc = typeColors[signal.signalType] || typeColors.BULK_DEAL;

  return (
    <div className="row-bookmark flex items-center justify-between py-2 px-3" style={{ borderBottom: '1px solid var(--bg-border)' }}>
      <div className="flex items-center gap-3">
        <span className="font-label px-1.5 py-0.5 rounded-chip" style={{ fontSize: 8, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
          {signal.signalType === 'INSIDER_BUY' ? 'INSIDER' : 'BULK'}
        </span>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-primary)' }}>{signal.company.split(' Ltd')[0]}</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="7" fill="none" stroke="var(--bg-border)" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="7" fill="none" stroke={signal.confidence > 70 ? 'var(--gold-mid)' : 'var(--text-muted)'} strokeWidth="1.5"
            strokeDasharray={`${signal.confidence * 0.44} 44`} strokeLinecap="round" transform="rotate(-90 9 9)" />
        </svg>
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{signal.confidence}%</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { portfolioData, signals, loadSampleData, refreshSignals, chatMessages, sendChatMessage } = usePortfolio();

  useEffect(() => {
    if (!portfolioData) loadSampleData();
    if (signals.length === 0) refreshSignals();
  }, []);

  const pd = portfolioData;
  const allocationData = pd?.funds?.map(f => ({
    name: f.name.split(' Fund')[0].split(' Opportunities')[0],
    value: f.value,
    pct: ((f.value / pd.portfolioValue) * 100).toFixed(1),
  })) || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif-display" style={{ fontSize: 28, color: 'var(--text-primary)' }}>Dashboard</h1>
        <span className="font-label" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
          LAST UPDATED: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Row 1: Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="PORTFOLIO VALUE"
          value={pd ? formatINR(pd.portfolioValue) : '—'}
          sub={pd ? `+${formatINR(pd.portfolioValue * 0.13)} since last year` : ''}
          color="var(--text-primary)"
          delay={0}
        />
        <StatCard
          label="OVERALL XIRR"
          value={pd ? pd.xirr.toFixed(1) + '%' : '—'}
          sub={pd ? `vs Nifty 50: +${(pd.xirr - pd.benchmarkReturn).toFixed(1)}%` : ''}
          color="var(--green-data)"
          delay={0.1}
        />
        <StatCard
          label="ANNUAL EXPENSE DRAG"
          value={pd ? formatINR(pd.expenseDrag) : '—'}
          sub={pd ? `${((pd.expenseDrag / pd.portfolioValue) * 100).toFixed(1)}% of portfolio value` : ''}
          color="var(--red-data)"
          delay={0.2}
        />
        <StatCard
          label="LIVE SIGNALS TODAY"
          value={signals.length > 0 ? String(signals.length) : '—'}
          sub={signals.length > 0 ? `${signals.filter(s => s.signalType === 'INSIDER_BUY').length} insider buys · ${signals.filter(s => s.signalType === 'BULK_DEAL').length} bulk deals` : ''}
          color="var(--gold-mid)"
          pulse
          delay={0.3}
        />
      </div>

      {/* Row 2: Allocation + Overlap */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '60% 1fr' }}>
        <ClipPathWipe>
          <div className="card">
            <div className="font-label mb-4" style={{ color: 'var(--text-muted)', fontSize: 9 }}>ALLOCATION BREAKDOWN</div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allocationData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category" dataKey="name" width={180}
                    tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 11 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-secondary)' }}
                    formatter={(v) => [formatINR(v), 'Value']}
                  />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={16}>
                    {allocationData.map((_, i) => (
                      <Cell key={i} fill={`hsl(215, ${50 + i * 5}%, ${45 + i * 4}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ClipPathWipe>

        <ClipPathWipe delay={0.15}>
          <div className="card">
            <div className="font-label mb-3" style={{ color: 'var(--text-muted)', fontSize: 9 }}>FUND OVERLAP MATRIX</div>
            {pd && (
              <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.min(pd.funds.length, 5)}, 1fr)` }}>
                {pd.overlapMatrix.slice(0, 5).map((row, i) =>
                  row.slice(0, 5).map((val, j) => (
                    <OverlapCell key={`${i}-${j}`} value={val} fundA={pd.funds[i]?.name} fundB={pd.funds[j]?.name} />
                  ))
                )}
              </div>
            )}
            <Link to="/dashboard/xray" className="direction-underline font-mono block mt-4" style={{ fontSize: 10, color: 'var(--gold-mid)' }}>
              VIEW FULL ANALYSIS →
            </Link>
          </div>
        </ClipPathWipe>
      </div>

      {/* Row 3: Signals + Chat */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '40% 1fr' }}>
        <ClipPathWipe>
          <div className="card" style={{ padding: 0 }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <span className="font-label" style={{ color: 'var(--text-muted)', fontSize: 9 }}>TODAY'S SIGNALS</span>
              <div className="flex items-center gap-1">
                <span className="pulse-dot inline-block rounded-full" style={{ width: 4, height: 4, background: 'var(--green-data)' }} />
                <span className="font-label" style={{ color: 'var(--green-data)', fontSize: 8 }}>LIVE</span>
              </div>
            </div>
            {signals.slice(0, 5).map((s, i) => <MiniSignalRow key={i} signal={s} />)}
            <div className="px-4 py-3">
              <Link to="/dashboard/radar" className="direction-underline font-mono" style={{ fontSize: 10, color: 'var(--gold-mid)' }}>
                VIEW ALL SIGNALS →
              </Link>
            </div>
          </div>
        </ClipPathWipe>

        <ClipPathWipe delay={0.1}>
          <div className="card flex flex-col" style={{ padding: 0, minHeight: 320 }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <span className="font-label" style={{ color: 'var(--text-muted)', fontSize: 9 }}>PORTFOLIO AI CHAT</span>
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>AI</span>
            </div>
            <div className="flex-1 px-4 py-4 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ask about your portfolio...</span>
                </div>
              ) : (
                chatMessages.slice(-4).map((msg, i) => (
                  <div key={i} className={`flex gap-2 mb-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <div
                      className="font-sans rounded-card px-3 py-2"
                      style={{
                        fontSize: 12, maxWidth: '85%', lineHeight: 1.6,
                        background: msg.role === 'user' ? 'rgba(201,168,76,0.08)' : 'var(--bg-raised)',
                        color: 'var(--text-secondary)',
                        border: msg.role === 'user' ? '1px solid rgba(201,168,76,0.15)' : '1px solid var(--bg-border)',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
              <input
                type="text"
                placeholder="Ask PAISA..."
                className="flex-1 font-mono"
                style={{ fontSize: 11, padding: '8px 12px', background: 'var(--bg-void)', border: '1px solid var(--bg-border)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) { sendChatMessage(e.target.value); e.target.value = ''; } }}
              />
            </div>
            <div className="px-4 pb-3">
              <Link to="/dashboard/chat" className="direction-underline font-mono" style={{ fontSize: 10, color: 'var(--gold-mid)' }}>
                OPEN FULL CHAT →
              </Link>
            </div>
          </div>
        </ClipPathWipe>
      </div>
    </div>
  );
}
