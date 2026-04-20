import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import SlotCounter from 'react-slot-counter';
import { usePortfolio } from '../context/PortfolioContext';
import { ClipPathWipe } from '../components/Animations';

export default function RadarPage() {
  const { signals, refreshSignals, loadSampleData, portfolioData } = usePortfolio();
  const [filter, setFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('30d');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!portfolioData) loadSampleData();
    if (signals.length === 0) refreshSignals();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshSignals();
      setLastUpdated(new Date());
    } catch (e) {
      // fallback handled by context
    }
    setTimeout(() => setIsRefreshing(false), 800);
  }, [refreshSignals]);

  // Date range filter — actually filters by signal date
  const dateFiltered = useMemo(() => {
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const maxDaysAgo = daysMap[dateRange] || 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - maxDaysAgo);

    return signals.filter(s => {
      const signalDate = new Date(s.date);
      return signalDate >= cutoff;
    });
  }, [signals, dateRange]);

  // Type filter + search
  const filtered = useMemo(() => {
    return dateFiltered.filter(s => {
      if (filter !== 'ALL' && s.signalType !== filter) return false;
      if (search && !s.company.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [dateFiltered, filter, search]);

  const insiderCount = dateFiltered.filter(s => s.signalType === 'INSIDER_BUY').length;
  const bulkCount = dateFiltered.filter(s => s.signalType === 'BULK_DEAL').length;

  // Check if any signal is actually live (from API) vs sample
  const hasLiveData = signals.some(s => s.live === true);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif-display" style={{ fontSize: 28, color: 'var(--text-primary)' }}>Opportunity Radar</h1>
          <div className="font-mono mt-1" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            Last updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {lastUpdated.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="font-label px-3 py-1.5 rounded-chip transition-all"
            style={{
              fontSize: 9, cursor: 'pointer',
              color: 'var(--gold-mid)',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              opacity: isRefreshing ? 0.5 : 1,
            }}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'REFRESHING...' : 'REFRESH NOW'}
          </button>
          <div className="flex items-center gap-1">
            <span className="pulse-dot inline-block rounded-full" style={{ width: 6, height: 6, background: hasLiveData ? 'var(--green-data)' : 'var(--gold-mid)' }} />
            <span className="font-label" style={{ color: hasLiveData ? 'var(--green-data)' : 'var(--gold-mid)', fontSize: 10 }}>
              {hasLiveData ? 'LIVE' : 'SAMPLE'}
            </span>
          </div>
          <span className="font-label" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>RADAR AGENT</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'TOTAL SIGNALS', value: String(dateFiltered.length), color: 'var(--text-primary)' },
          { label: 'INSIDER BUYS', value: String(insiderCount), color: 'var(--green-data)' },
          { label: 'BULK DEALS', value: String(bulkCount), color: 'var(--blue-data)' },
        ].map((s, i) => (
          <ClipPathWipe key={i} delay={i * 0.1}>
            <div className="card">
              <div className="font-label mb-2" style={{ color: 'var(--text-muted)', fontSize: 9 }}>{s.label}</div>
              <div className="font-mono" style={{ fontSize: 32, fontWeight: 500, color: s.color }}>
                <SlotCounter value={s.value} duration={1.2} />
              </div>
            </div>
          </ClipPathWipe>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['ALL', 'INSIDER_BUY', 'BULK_DEAL'].map(chip => (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              className={`ink-stamp font-label px-3 py-1.5 rounded-chip transition-all ${filter === chip ? 'active' : ''}`}
              style={{
                fontSize: 9, cursor: 'pointer',
                background: filter === chip ? 'var(--gold-dim)' : 'transparent',
                color: filter === chip ? 'var(--text-primary)' : 'var(--text-muted)',
                border: `1px solid ${filter === chip ? 'var(--gold-dim)' : 'var(--bg-border)'}`,
              }}
            >
              {chip.replace('_', ' ')}
            </button>
          ))}
          <div style={{ width: 1, height: 24, background: 'var(--bg-border)', margin: '0 4px' }} />
          {['7d', '30d', '90d'].map(dr => (
            <button
              key={dr}
              onClick={() => setDateRange(dr)}
              className="font-label px-2 py-1 rounded-chip transition-all"
              style={{
                fontSize: 9, cursor: 'pointer',
                background: dateRange === dr ? 'var(--bg-raised)' : 'transparent',
                color: dateRange === dr ? 'var(--text-primary)' : 'var(--text-muted)',
                border: `1px solid ${dateRange === dr ? 'var(--bg-border)' : 'transparent'}`,
              }}
            >
              {dr.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company..."
            className="font-mono"
            style={{ fontSize: 11, padding: '6px 12px', background: 'var(--bg-void)', border: '1px solid var(--bg-border)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none', width: 180 }}
          />
          <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            {filtered.length} of {signals.length}
          </span>
        </div>
      </div>

      {/* Full table */}
      <div className="rounded-card overflow-hidden" style={{ background: 'var(--bg-void)', border: '1px solid var(--bg-border)' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
              {['COMPANY', 'SIGNAL TYPE', 'DATE', 'VALUE', 'CONFIDENCE', 'DESCRIPTION'].map(h => (
                <th key={h} className="font-label text-left py-3 px-4" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((signal, i) => {
              const tc = signal.signalType === 'INSIDER_BUY'
                ? { bg: 'rgba(46,158,104,0.1)', color: 'var(--green-data)', border: 'rgba(46,158,104,0.2)' }
                : { bg: 'rgba(58,127,212,0.1)', color: 'var(--blue-data)', border: 'rgba(58,127,212,0.2)' };

              // Show relative date label
              const signalDate = new Date(signal.date);
              const daysAgo = Math.floor((new Date() - signalDate) / 86400000);
              const dateLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

              return (
                <motion.tr
                  key={i}
                  className="row-bookmark"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ borderBottom: '1px solid var(--bg-border)' }}
                >
                  <td className="py-3 px-4 font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{signal.company}</td>
                  <td className="py-3 px-4">
                    <span className="font-label px-2 py-0.5 rounded-chip" style={{ fontSize: 8, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                      {signal.signalType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{signal.date}</div>
                    <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{dateLabel}</div>
                  </td>
                  <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>₹{(signal.value / 10000000).toFixed(1)}Cr</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <svg width="22" height="22" viewBox="0 0 22 22">
                        <circle cx="11" cy="11" r="9" fill="none" stroke="var(--bg-border)" strokeWidth="2" />
                        <circle cx="11" cy="11" r="9" fill="none"
                          stroke={signal.confidence > 70 ? 'var(--gold-mid)' : 'var(--text-muted)'}
                          strokeWidth="2"
                          strokeDasharray={`${signal.confidence * 0.565} 56.5`}
                          strokeLinecap="round"
                          transform="rotate(-90 11 11)"
                          style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                        />
                      </svg>
                      <span className="font-mono" style={{ fontSize: 11, color: signal.confidence > 70 ? 'var(--gold-mid)' : 'var(--text-muted)' }}>
                        {signal.confidence}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4" style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {signal.description}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>No signals match current filters</span>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between mt-4">
        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {signals.length} signals · {dateRange.toUpperCase()} range
        </span>
        <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          Auto-refreshes every 5 min
        </span>
      </div>

      <div className="disclaimer mt-6">
        Signal data sourced from BSE/NSE public disclosures and yfinance live market data. Confidence scores are AI-generated estimates. This is not investment advice. Consult a SEBI-registered advisor.
      </div>
    </div>
  );
}
