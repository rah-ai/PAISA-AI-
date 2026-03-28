import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import SlotCounter from 'react-slot-counter';
import { usePortfolio } from '../context/PortfolioContext';
import { ClipPathWipe, ElasticSpring, CurtainReveal, LineReveal } from '../components/Animations';
import { formatINR } from '../utils/formatters';

export default function TaxPage() {
  const { portfolioData } = usePortfolio();
  const pd = portfolioData;

  const taxData = useMemo(() => {
    if (!pd) return null;
    const now = new Date();

    const fundAnalysis = pd.funds.map(fund => {
      const purchaseDate = new Date(fund.purchaseDate);
      const holdingMonths = Math.round((now - purchaseDate) / (1000 * 60 * 60 * 24 * 30));
      const isLongTerm = holdingMonths >= 12;
      const gains = fund.value - (fund.units * fund.purchaseNav);
      const isEquity = !fund.category.includes('Debt');

      let taxRate, taxAmount;
      if (isEquity) {
        if (isLongTerm) {
          const taxableGains = Math.max(0, gains - 125000); // ₹1.25L exemption for LTCG
          taxRate = 12.5;
          taxAmount = Math.round(taxableGains * 0.125);
        } else {
          taxRate = 20;
          taxAmount = Math.round(gains * 0.20);
        }
      } else {
        taxRate = isLongTerm ? 20 : 30;
        taxAmount = Math.round(gains * (taxRate / 100));
      }

      return {
        name: fund.name,
        category: fund.category,
        purchaseDate: fund.purchaseDate,
        holdingMonths,
        isLongTerm,
        gains,
        taxRate,
        taxAmount: Math.max(0, taxAmount),
        value: fund.value,
        harvestable: gains < 0,
        lossAmount: gains < 0 ? Math.abs(gains) : 0,
      };
    });

    const totalGains = fundAnalysis.reduce((s, f) => s + Math.max(0, f.gains), 0);
    const totalTax = fundAnalysis.reduce((s, f) => s + f.taxAmount, 0);
    const harvestable = fundAnalysis.filter(f => f.harvestable);
    const totalHarvestable = harvestable.reduce((s, f) => s + f.lossAmount, 0);
    const potentialSaved = Math.round(totalHarvestable * 0.125);

    // Smart rebalance suggestions to reduce tax
    const suggestions = [];
    fundAnalysis.forEach(f => {
      if (f.holdingMonths >= 10 && f.holdingMonths < 12 && f.gains > 0) {
        suggestions.push({
          type: 'WAIT',
          fund: f.name.split(' Fund')[0],
          detail: `${12 - f.holdingMonths} months to LTCG. Waiting saves ₹${formatINR(Math.round(f.gains * 0.075))} in tax.`,
          priority: 'HIGH',
        });
      }
    });
    if (totalGains > 125000) {
      suggestions.push({
        type: 'HARVEST',
        fund: 'Portfolio-wide',
        detail: `Book ₹${formatINR(125000)} LTCG annually using exemption window. Reset cost basis to defer future tax.`,
        priority: 'MEDIUM',
      });
    }
    fundAnalysis.filter(f => f.taxRate >= 20 && !f.isLongTerm && f.gains > 50000).forEach(f => {
      suggestions.push({
        type: 'DEFER',
        fund: f.name.split(' Fund')[0],
        detail: `Hold ${12 - f.holdingMonths} more months to convert ${f.taxRate}% STCG to 12.5% LTCG. Saves ₹${formatINR(Math.round(f.gains * ((f.taxRate - 12.5) / 100)))}`,
        priority: 'HIGH',
      });
    });

    return { fundAnalysis, totalGains, totalTax, totalHarvestable, potentialSaved, suggestions };
  }, [pd]);

  if (!pd || !taxData) return <div className="flex items-center justify-center h-64"><span className="font-mono" style={{ color: 'var(--text-muted)' }}>Loading...</span></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif-display" style={{ fontSize: 28, color: 'var(--text-primary)' }}>Tax Optimizer</h1>
        <span className="font-label" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>AI TAX ENGINE</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'TOTAL GAINS', value: formatINR(taxData.totalGains), color: 'var(--green-data)' },
          { label: 'ESTIMATED TAX', value: formatINR(taxData.totalTax), color: 'var(--red-data)' },
          { label: 'HARVESTABLE LOSSES', value: formatINR(taxData.totalHarvestable), color: 'var(--blue-data)' },
          { label: 'POTENTIAL TAX SAVED', value: formatINR(taxData.potentialSaved), color: 'var(--gold-mid)' },
        ].map((stat, i) => (
          <ClipPathWipe key={i} delay={i * 0.08}>
            <div className="card">
              <div className="font-label mb-2" style={{ color: 'var(--text-muted)', fontSize: 9 }}>{stat.label}</div>
              <div className="font-mono" style={{ fontSize: 24, fontWeight: 500, color: stat.color }}>
                <SlotCounter value={stat.value} duration={1.2} />
              </div>
            </div>
          </ClipPathWipe>
        ))}
      </div>

      {/* Fund Tax Table */}
      <ClipPathWipe>
        <div className="card mb-8" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--bg-border)' }}>
            <span className="font-label" style={{ color: 'var(--text-muted)', fontSize: 9 }}>FUND-WISE TAX ANALYSIS</span>
          </div>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                {['FUND', 'HOLDING', 'TYPE', 'GAINS', 'TAX RATE', 'TAX DUE'].map(h => (
                  <th key={h} className="font-label text-left py-3 px-4" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taxData.fundAnalysis.map((fund, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ borderBottom: '1px solid var(--bg-border)' }}
                  className="row-bookmark"
                >
                  <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fund.name.split(' Fund')[0]}
                  </td>
                  <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {fund.holdingMonths}mo
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-label px-2 py-0.5 rounded-chip" style={{
                      fontSize: 8,
                      background: fund.isLongTerm ? 'rgba(46,158,104,0.1)' : 'rgba(184,64,64,0.1)',
                      color: fund.isLongTerm ? 'var(--green-data)' : 'var(--red-data)',
                      border: `1px solid ${fund.isLongTerm ? 'rgba(46,158,104,0.2)' : 'rgba(184,64,64,0.2)'}`,
                    }}>
                      {fund.isLongTerm ? 'LTCG' : 'STCG'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: fund.gains >= 0 ? 'var(--green-data)' : 'var(--red-data)' }}>
                    {fund.gains >= 0 ? '+' : ''}{formatINR(fund.gains)}
                  </td>
                  <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {fund.taxRate}%
                  </td>
                  <td className="py-3 px-4 font-mono" style={{ fontSize: 11, color: fund.taxAmount > 0 ? 'var(--red-data)' : 'var(--text-muted)' }}>
                    {formatINR(fund.taxAmount)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </ClipPathWipe>

      {/* AI Tax Suggestions */}
      {taxData.suggestions.length > 0 && (
        <ClipPathWipe>
          <div className="card" style={{ padding: 28 }}>
            <div className="font-label mb-4" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>AI TAX OPTIMIZATION STRATEGIES</div>
            <div className="flex flex-col gap-3">
              {taxData.suggestions.map((s, i) => {
                const colors = {
                  WAIT: { bg: 'rgba(46,158,104,0.08)', border: 'rgba(46,158,104,0.2)', text: 'var(--green-data)' },
                  HARVEST: { bg: 'rgba(58,127,212,0.08)', border: 'rgba(58,127,212,0.2)', text: 'var(--blue-data)' },
                  DEFER: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.2)', text: 'var(--gold-mid)' },
                };
                const c = colors[s.type] || colors.DEFER;
                return (
                  <ElasticSpring key={i} delay={i * 0.1}>
                    <div className="flex items-start gap-4 px-4 py-3 rounded-card" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <span className="font-label px-2 py-0.5 rounded-btn flex-shrink-0 mt-0.5" style={{ fontSize: 9, color: c.text, border: `1px solid ${c.border}` }}>
                        {s.type}
                      </span>
                      <div>
                        <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{s.fund}</div>
                        <div className="font-sans mt-1" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.detail}</div>
                      </div>
                      <span className="font-label px-1.5 py-0.5 rounded-chip flex-shrink-0 ml-auto" style={{
                        fontSize: 8,
                        color: s.priority === 'HIGH' ? 'var(--red-data)' : 'var(--gold-mid)',
                        border: `1px solid ${s.priority === 'HIGH' ? 'rgba(184,64,64,0.3)' : 'rgba(201,168,76,0.3)'}`,
                      }}>
                        {s.priority}
                      </span>
                    </div>
                  </ElasticSpring>
                );
              })}
            </div>
          </div>
        </ClipPathWipe>
      )}

      <div className="disclaimer mt-6">
        Tax calculations are estimates based on current Indian tax law (FY 2025-26). Actual tax liability may vary. This is not tax advice. Consult a qualified chartered accountant for filing.
      </div>
    </div>
  );
}
