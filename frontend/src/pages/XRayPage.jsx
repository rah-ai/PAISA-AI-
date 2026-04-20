import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import SlotCounter from 'react-slot-counter';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '../context/PortfolioContext';
import { CurtainReveal, ElasticSpring, ClipPathWipe, LineReveal } from '../components/Animations';
import { formatINR, getActionColor } from '../utils/formatters';

/* Generate portfolio vs benchmark chart data */
function generateChartData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let portfolio = 100, nifty = 100;
  return months.map(m => {
    portfolio += (Math.random() - 0.35) * 8;
    nifty += (Math.random() - 0.4) * 6;
    return { month: m, portfolio: parseFloat(portfolio.toFixed(1)), nifty: parseFloat(nifty.toFixed(1)) };
  });
}

export default function XRayPage() {
  const { portfolioData, loadSampleData } = usePortfolio();
  const [sortField, setSortField] = useState('value');
  const [sortDir, setSortDir] = useState(-1);
  const [selectedCell, setSelectedCell] = useState(null);
  const chartData = React.useMemo(() => generateChartData(), []);

  useEffect(() => { if (!portfolioData) loadSampleData(); }, []);

  const pd = portfolioData;
  if (!pd) return <div className="flex items-center justify-center h-64"><span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading portfolio...</span></div>;

  const sortedFunds = [...pd.funds].sort((a, b) => (a[sortField] - b[sortField]) * sortDir);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d * -1);
    else { setSortField(field); setSortDir(-1); }
  };

  const xByPeriod = [
    { period: '1Y', value: pd.xirr - 2.1, color: pd.xirr - 2.1 > 12 ? 'var(--green-data)' : 'var(--text-primary)' },
    { period: '3Y', value: pd.xirr - 0.8, color: pd.xirr - 0.8 > 12 ? 'var(--green-data)' : 'var(--text-primary)' },
    { period: '5Y', value: pd.xirr + 1.2, color: 'var(--green-data)' },
    { period: 'Since Inception', value: pd.xirr, color: 'var(--green-data)' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif-display" style={{ fontSize: 28, color: 'var(--text-primary)' }}>Portfolio X-Ray</h1>
        <span className="font-label" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>X-RAY AGENT</span>
      </div>

      {/* Section A — XIRR Deep Dive */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: '40% 1fr' }}>
        <ClipPathWipe>
          <div className="card">
            <div className="font-label mb-3" style={{ color: 'var(--text-muted)', fontSize: 9 }}>PORTFOLIO XIRR</div>
            <div className="font-mono mb-6" style={{
              fontSize: 56, fontWeight: 500,
              color: pd.xirr > 12 ? 'var(--green-data)' : 'var(--text-primary)',
            }}>
              <SlotCounter value={pd.xirr.toFixed(1) + '%'} duration={1.2} />
            </div>
            <LineReveal className="mb-4" />
            <div className="font-label mb-3" style={{ color: 'var(--text-muted)', fontSize: 9 }}>XIRR BY PERIOD</div>
            {xByPeriod.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.period}</span>
                <span className="font-mono" style={{ fontSize: 14, fontWeight: 500, color: p.color }}>{p.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </ClipPathWipe>

        <ClipPathWipe delay={0.15}>
          <div className="card">
            <div className="font-label mb-3" style={{ color: 'var(--text-muted)', fontSize: 9 }}>PORTFOLIO VS NIFTY 50</div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={{ stroke: 'var(--bg-border)' }} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 6, fontFamily: 'IBM Plex Mono', fontSize: 11, color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-secondary)' }} />
                  <Line type="monotone" dataKey="portfolio" stroke="var(--gold-mid)" strokeWidth={2} dot={false} name="Portfolio" />
                  <Line type="monotone" dataKey="nifty" stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Nifty 50" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ClipPathWipe>
      </div>

      {/* Section B — Overlap Heatmap */}
      <ClipPathWipe>
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="font-label" style={{ color: 'var(--text-muted)', fontSize: 9 }}>FUND OVERLAP HEATMAP</div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Click any cell to see shared stock details</div>
          </div>
          <div className="overflow-x-auto">
            <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${pd.funds.length}, 1fr)`, gap: 2 }}>
              <div />
              {pd.funds.map((f, i) => (
                <div key={i} className="font-mono text-center" style={{ fontSize: 8, color: 'var(--text-muted)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 80, overflow: 'hidden' }}>
                  {f.name.split(' Fund')[0]}
                </div>
              ))}
              {pd.overlapMatrix.map((row, i) => (
                <React.Fragment key={i}>
                  <div className="font-mono flex items-center" style={{ fontSize: 9, color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {pd.funds[i].name.split(' Fund')[0]}
                  </div>
                  {row.map((val, j) => {
                    const isSelected = selectedCell && selectedCell.i === i && selectedCell.j === j;
                    const bg = i === j ? 'var(--bg-raised)' : val > 0.4 ? 'rgba(184,64,64,0.35)' : val > 0.2 ? 'rgba(184,64,64,0.15)' : 'var(--bg-raised)';
                    return (
                      <div
                        key={j}
                        className="flex items-center justify-center font-mono transition-all"
                        onClick={() => i !== j && setSelectedCell(isSelected ? null : { i, j, val })}
                        style={{
                          aspectRatio: '1', background: bg, fontSize: 9, color: 'var(--text-secondary)', borderRadius: 2,
                          cursor: i === j ? 'default' : 'pointer',
                          border: isSelected ? '2px solid var(--gold-mid)' : '2px solid transparent',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        {i === j ? '—' : `${(val * 100).toFixed(0)}%`}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1"><div style={{ width: 12, height: 12, background: 'var(--bg-raised)', borderRadius: 2 }} /><span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{'< 20% (Safe)'}</span></div>
            <div className="flex items-center gap-1"><div style={{ width: 12, height: 12, background: 'rgba(184,64,64,0.15)', borderRadius: 2 }} /><span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>20–40% (Watch)</span></div>
            <div className="flex items-center gap-1"><div style={{ width: 12, height: 12, background: 'rgba(184,64,64,0.35)', borderRadius: 2 }} /><span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{'>40% (Dangerous)'}</span></div>
          </div>

          {/* Detail Panel — appears when a cell is clicked */}
          {selectedCell && selectedCell.i !== selectedCell.j && (() => {
            const fundA = pd.funds[selectedCell.i];
            const fundB = pd.funds[selectedCell.j];
            const overlapPct = (selectedCell.val * 100).toFixed(0);
            const sharedHoldings = fundA.topHoldings.filter(h => fundB.topHoldings.includes(h));
            const severity = selectedCell.val > 0.4 ? { label: 'DANGEROUS', color: 'var(--red-data)', bg: 'rgba(184,64,64,0.08)' }
              : selectedCell.val > 0.2 ? { label: 'MODERATE', color: 'var(--gold-mid)', bg: 'rgba(201,168,76,0.06)' }
              : { label: 'LOW', color: 'var(--green-data)', bg: 'rgba(46,158,104,0.06)' };

            return (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-card"
                style={{ padding: 20, background: severity.bg, border: `1px solid var(--bg-border)` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-label px-2 py-0.5 rounded-chip" style={{ fontSize: 8, color: severity.color, border: `1px solid ${severity.color}33` }}>{severity.label} OVERLAP</span>
                    <span className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: severity.color }}>{overlapPct}%</span>
                  </div>
                  <button onClick={() => setSelectedCell(null)} className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="font-label mb-1" style={{ fontSize: 8, color: 'var(--text-muted)' }}>FUND A</div>
                    <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{fundA.name}</div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fundA.category} · XIRR {fundA.xirr}%</div>
                  </div>
                  <div>
                    <div className="font-label mb-1" style={{ fontSize: 8, color: 'var(--text-muted)' }}>FUND B</div>
                    <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{fundB.name}</div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fundB.category} · XIRR {fundB.xirr}%</div>
                  </div>
                </div>

                {sharedHoldings.length > 0 && (
                  <div className="mb-4">
                    <div className="font-label mb-2" style={{ fontSize: 8, color: 'var(--text-muted)' }}>SHARED STOCK HOLDINGS ({sharedHoldings.length} stocks)</div>
                    <div className="flex flex-wrap gap-2">
                      {sharedHoldings.map(stock => (
                        <span key={stock} className="font-mono px-2 py-1 rounded-chip" style={{ fontSize: 10, color: severity.color, background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>{stock}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-card" style={{ padding: 12, background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
                  <div className="font-label mb-1" style={{ fontSize: 8, color: 'var(--gold-mid)' }}>WHAT THIS MEANS</div>
                  <div className="font-sans" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {selectedCell.val > 0.4
                      ? `These two funds share ${overlapPct}% of their top holdings. This means a significant portion of your money in both funds is invested in the same companies like ${sharedHoldings.slice(0, 3).join(', ')}. You are paying two expense ratios for essentially the same exposure. Consider consolidating into one fund to save on costs and improve diversification.`
                      : selectedCell.val > 0.2
                      ? `These funds share ${overlapPct}% overlap through stocks like ${sharedHoldings.slice(0, 3).join(', ')}. This is moderate — not alarming, but worth monitoring. If both funds are in similar categories, you may benefit from replacing one with a fund from a different segment.`
                      : `Only ${overlapPct}% overlap — these funds are well diversified from each other. ${sharedHoldings.length > 0 ? `They share only ${sharedHoldings.join(', ')}.` : 'They hold completely different stocks.'} This is good portfolio construction.`
                    }
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </div>
      </ClipPathWipe>

      {/* Section C — Fund Breakdown Table */}
      <ClipPathWipe>
        <div className="card mb-8" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
            <span className="font-label" style={{ color: 'var(--text-muted)', fontSize: 9 }}>FUND BREAKDOWN</span>
          </div>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                {[
                  { key: 'name', label: 'FUND NAME' },
                  { key: 'category', label: 'CATEGORY' },
                  { key: 'units', label: 'UNITS' },
                  { key: 'value', label: 'VALUE' },
                  { key: 'xirr', label: 'XIRR' },
                  { key: 'expenseRatio', label: 'EXP. RATIO' },
                  { key: 'action', label: 'ACTION' },
                ].map(col => (
                  <th
                    key={col.key}
                    className="font-label text-left py-3 px-4 cursor-pointer select-none transition-colors hover:text-text-secondary"
                    style={{ fontSize: 9, color: sortField === col.key ? 'var(--gold-mid)' : 'var(--text-muted)' }}
                    onClick={() => col.key !== 'action' && handleSort(col.key)}
                  >
                    {col.label} {sortField === col.key && (sortDir > 0 ? '↑' : '↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedFunds.map((fund, i) => {
                const plan = pd.rebalancingPlan.find(p => fund.name.includes(p.fund.split(' Fund')[0]));
                const action = plan?.action || 'HOLD';
                const ac = getActionColor(action);
                return (
                  <motion.tr
                    key={fund.name}
                    className="row-bookmark"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ borderBottom: '1px solid var(--bg-border)' }}
                  >
                    <td className="py-3 px-4" style={{ fontSize: 12, color: 'var(--text-primary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fund.name}</td>
                    <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fund.category}</td>
                    <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{fund.units.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: 'var(--text-primary)' }}>{formatINR(fund.value)}</td>
                    <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: fund.xirr > 15 ? 'var(--green-data)' : 'var(--text-secondary)' }}>{fund.xirr}%</td>
                    <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: fund.expenseRatio > 1.8 ? 'var(--red-data)' : 'var(--text-muted)' }}>{fund.expenseRatio}%</td>
                    <td className="py-3 px-4">
                      <span className="font-label px-2 py-0.5 rounded-btn" style={{ fontSize: 8, background: ac.bg, color: ac.text }}>{action}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ClipPathWipe>

      {/* Section D — AI Rebalancing */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-label" style={{ color: 'var(--text-muted)', fontSize: 9 }}>AI REBALANCING PLAN</span>
        <button className="btn-gold" style={{ padding: '8px 16px', fontSize: 10 }}>GENERATE FRESH ANALYSIS</button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {pd.rebalancingPlan.map((item, i) => {
          const ac = getActionColor(item.action);
          return (
            <ElasticSpring key={i} delay={i * 0.1}>
              <div className="card flex items-start gap-4" style={{ padding: 24 }}>
                <span className="font-label px-2 py-1 rounded-btn flex-shrink-0" style={{ fontSize: 9, background: ac.bg, color: ac.text }}>{item.action}</span>
                <div className="flex-1">
                  <h4 className="font-serif-display" style={{ fontSize: 18, color: 'var(--text-primary)' }}>{item.fund}</h4>
                  <p className="font-sans mt-1" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.reason}</p>
                </div>
                <span className="font-label px-2 py-0.5 rounded-chip flex-shrink-0" style={{
                  fontSize: 8,
                  color: item.priority === 'HIGH' ? 'var(--red-data)' : item.priority === 'MEDIUM' ? 'var(--gold-mid)' : 'var(--text-muted)',
                  border: `1px solid ${item.priority === 'HIGH' ? 'rgba(184,64,64,0.3)' : item.priority === 'MEDIUM' ? 'rgba(201,168,76,0.3)' : 'var(--bg-border)'}`,
                }}>
                  {item.priority}
                </span>
              </div>
            </ElasticSpring>
          );
        })}
      </div>
      <div className="disclaimer mt-6">
        This is AI-generated analysis based on the uploaded portfolio data. This is not investment advice. Please consult a SEBI-registered investment advisor before making any financial decisions.
      </div>
    </div>
  );
}
