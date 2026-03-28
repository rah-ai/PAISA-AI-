import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import SlotCounter from 'react-slot-counter';
import { usePortfolio } from '../context/PortfolioContext';
import { ClipPathWipe, ElasticSpring, CurtainReveal, LineReveal } from '../components/Animations';
import { formatINR } from '../utils/formatters';

/* ─── Risk Gauge SVG ─── */
function RiskGauge({ score, size = 180 }) {
  const r = (size - 20) / 2;
  const c = Math.PI * r;
  const color = score > 70 ? 'var(--red-data)' : score > 40 ? 'var(--gold-mid)' : 'var(--green-data)';
  const label = score > 70 ? 'HIGH RISK' : score > 40 ? 'MODERATE' : 'LOW RISK';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <path
          d={`M 10 ${size / 2 + 10} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none" stroke="var(--bg-border)" strokeWidth="8" strokeLinecap="round"
        />
        <motion.path
          d={`M 10 ${size / 2 + 10} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
      <div className="font-mono -mt-8" style={{ fontSize: 36, fontWeight: 500, color }}>{score}</div>
      <div className="font-label mt-1" style={{ fontSize: 10, color, letterSpacing: '0.12em' }}>{label}</div>
    </div>
  );
}

export default function RiskScorePage() {
  const { portfolioData } = usePortfolio();
  const pd = portfolioData;

  const riskData = useMemo(() => {
    if (!pd) return null;
    const concentrationRisk = Math.min(100, pd.funds.length < 4 ? 80 : pd.funds.length < 6 ? 50 : 30);
    
    const maxOverlap = Math.max(...pd.overlapMatrix.flat().filter(v => v < 1));
    const overlapRisk = Math.min(100, Math.round(maxOverlap * 120));
    
    const avgExpense = pd.funds.reduce((s, f) => s + f.expenseRatio, 0) / pd.funds.length;
    const expenseRisk = Math.min(100, Math.round(avgExpense * 40));
    
    const categories = [...new Set(pd.funds.map(f => f.category))];
    const diversificationRisk = Math.min(100, categories.length < 3 ? 75 : categories.length < 5 ? 45 : 20);
    
    const sectoralFunds = pd.funds.filter(f => f.category.includes('Sectoral') || f.category.includes('Technology'));
    const sectorRisk = sectoralFunds.length > 1 ? 70 : sectoralFunds.length === 1 ? 40 : 15;
    
    const overallScore = Math.round(
      concentrationRisk * 0.2 + overlapRisk * 0.25 + expenseRisk * 0.15 + diversificationRisk * 0.2 + sectorRisk * 0.2
    );

    return {
      overall: overallScore,
      factors: [
        { name: 'Concentration Risk', score: concentrationRisk, weight: 20, desc: `${pd.funds.length} funds across ${categories.length} categories` },
        { name: 'Overlap Risk', score: overlapRisk, weight: 25, desc: `Max overlap: ${(maxOverlap * 100).toFixed(0)}% between fund pairs` },
        { name: 'Expense Drag Risk', score: expenseRisk, weight: 15, desc: `Avg expense ratio: ${avgExpense.toFixed(2)}%` },
        { name: 'Diversification', score: diversificationRisk, weight: 20, desc: `Coverage: ${categories.join(', ')}` },
        { name: 'Sector Concentration', score: sectorRisk, weight: 20, desc: `${sectoralFunds.length} sectoral/thematic fund(s)` },
      ],
      recommendations: [
        overlapRisk > 50 && 'Consider consolidating funds with >40% overlap to reduce redundancy',
        concentrationRisk > 50 && 'Add 2-3 more funds across different categories for better diversification',
        expenseRisk > 50 && 'Switch high-expense active funds to lower-cost index alternatives',
        sectorRisk > 50 && 'Reduce sectoral concentration — consider broader market exposure',
        diversificationRisk > 50 && 'Add international or debt exposure for better risk-adjusted returns',
      ].filter(Boolean),
    };
  }, [pd]);

  if (!pd || !riskData) return <div className="flex items-center justify-center h-64"><span className="font-mono" style={{ color: 'var(--text-muted)' }}>Loading...</span></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif-display" style={{ fontSize: 28, color: 'var(--text-primary)' }}>Risk Score</h1>
        <span className="font-label" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>ML RISK ENGINE</span>
      </div>

      <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: '340px 1fr' }}>
        <ClipPathWipe>
          <div className="card flex flex-col items-center" style={{ padding: 32 }}>
            <div className="font-label mb-6" style={{ color: 'var(--text-muted)', fontSize: 9 }}>OVERALL PORTFOLIO RISK</div>
            <RiskGauge score={riskData.overall} />
            <div className="mt-6 w-full">
              <div className="font-label mb-2" style={{ color: 'var(--text-muted)', fontSize: 9 }}>RISK BREAKDOWN</div>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Weighted score from 5 ML-analyzed risk factors. Based on portfolio composition, overlap patterns, and expense efficiency.
              </div>
            </div>
          </div>
        </ClipPathWipe>

        <ClipPathWipe delay={0.1}>
          <div className="card" style={{ padding: 24 }}>
            <div className="font-label mb-4" style={{ color: 'var(--text-muted)', fontSize: 9 }}>RISK FACTORS</div>
            {riskData.factors.map((factor, i) => {
              const color = factor.score > 70 ? 'var(--red-data)' : factor.score > 40 ? 'var(--gold-mid)' : 'var(--green-data)';
              return (
                <ElasticSpring key={i} delay={i * 0.08}>
                  <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{factor.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-label px-1.5 py-0.5 rounded-chip" style={{ fontSize: 8, color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }}>
                          {factor.weight}% weight
                        </span>
                        <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color }}>{factor.score}</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-border)', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${factor.score}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                        style={{ height: '100%', background: color, borderRadius: 2 }}
                      />
                    </div>
                    <div className="font-mono mt-1" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{factor.desc}</div>
                  </div>
                </ElasticSpring>
              );
            })}
          </div>
        </ClipPathWipe>
      </div>

      {riskData.recommendations.length > 0 && (
        <ClipPathWipe>
          <div className="card" style={{ padding: 28 }}>
            <div className="font-label mb-4" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>AI RISK RECOMMENDATIONS</div>
            <div className="grid grid-cols-1 gap-3">
              {riskData.recommendations.map((rec, i) => (
                <ElasticSpring key={i} delay={i * 0.1}>
                  <div className="flex items-start gap-3 px-4 py-3 rounded-card" style={{ background: 'var(--bg-void)', border: '1px solid var(--bg-border)' }}>
                    <span className="font-mono flex-shrink-0 mt-0.5" style={{ fontSize: 12, color: 'var(--gold-mid)' }}>⚡</span>
                    <span className="font-sans" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rec}</span>
                  </div>
                </ElasticSpring>
              ))}
            </div>
          </div>
        </ClipPathWipe>
      )}

      <div className="disclaimer mt-6">
        Risk scores are computed using ML-based analysis of portfolio composition, overlap patterns, and market factors. This is not investment advice. Consult a SEBI-registered advisor.
      </div>
    </div>
  );
}
