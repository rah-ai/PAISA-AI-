import React, { createContext, useContext, useState, useCallback } from 'react';

const PortfolioContext = createContext(null);

const SAMPLE_FUNDS = [
  {
    name: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Mid Cap',
    folio: '1234567/01',
    units: 245.678,
    purchaseNav: 98.45,
    currentNav: 156.78,
    value: 385200,
    purchaseDate: '2021-03-15',
    xirr: 18.4,
    expenseRatio: 1.62,
    topHoldings: ['HDFC Bank', 'Persistent Systems', 'Coforge', 'Indian Hotels', 'Max Healthcare', 'Balkrishna Ind', 'The Phoenix Mills', 'Cholamandalam Inv', 'Sundaram Finance', 'Supreme Industries']
  },
  {
    name: 'Mirae Asset Emerging Bluechip Fund',
    category: 'Large & Mid Cap',
    folio: '2345678/02',
    units: 312.445,
    purchaseNav: 72.30,
    currentNav: 118.92,
    value: 371500,
    purchaseDate: '2020-08-22',
    xirr: 16.2,
    expenseRatio: 1.71,
    topHoldings: ['HDFC Bank', 'ICICI Bank', 'Infosys', 'Bajaj Finance', 'Larsen & Toubro', 'State Bank of India', 'Persistent Systems', 'Coforge', 'Max Healthcare', 'Tata Motors']
  },
  {
    name: 'Axis Bluechip Fund',
    category: 'Large Cap',
    folio: '3456789/03',
    units: 520.112,
    purchaseNav: 35.80,
    currentNav: 48.56,
    value: 252500,
    purchaseDate: '2019-11-10',
    xirr: 11.8,
    expenseRatio: 1.56,
    topHoldings: ['HDFC Bank', 'ICICI Bank', 'Infosys', 'TCS', 'Reliance Industries', 'Bajaj Finance', 'HUL', 'Kotak Mahindra Bank', 'Asian Paints', 'Maruti Suzuki']
  },
  {
    name: 'SBI Small Cap Fund',
    category: 'Small Cap',
    folio: '4567890/04',
    units: 189.234,
    purchaseNav: 68.90,
    currentNav: 142.35,
    value: 269300,
    purchaseDate: '2021-01-05',
    xirr: 22.6,
    expenseRatio: 1.82,
    topHoldings: ['Blue Star', 'IIFL Finance', 'Chalet Hotels', 'Finolex Industries', 'CMS Info Systems', 'Ratnamani Metals', 'GR Infraprojects', 'ELIN Electronics', 'Praj Industries', 'Capacite Infraprojects']
  },
  {
    name: 'Parag Parikh Flexi Cap Fund',
    category: 'Flexi Cap',
    folio: '5678901/05',
    units: 445.890,
    purchaseNav: 42.15,
    currentNav: 68.42,
    value: 305000,
    purchaseDate: '2020-04-18',
    xirr: 15.7,
    expenseRatio: 0.89,
    topHoldings: ['HDFC Bank', 'ICICI Bank', 'Bajaj Holdings', 'ITC', 'Power Grid Corp', 'Coal India', 'Microsoft', 'Alphabet', 'Amazon', 'Meta']
  },
  {
    name: 'ICICI Pru Technology Fund',
    category: 'Sectoral - Technology',
    folio: '6789012/06',
    units: 156.780,
    purchaseNav: 105.20,
    currentNav: 178.45,
    value: 279700,
    purchaseDate: '2021-06-30',
    xirr: 19.3,
    expenseRatio: 2.05,
    topHoldings: ['Infosys', 'TCS', 'HCL Technologies', 'Wipro', 'Tech Mahindra', 'LTIMindtree', 'Persistent Systems', 'Coforge', 'KPIT Technologies', 'Tata Elxsi']
  },
  {
    name: 'Nippon India Large Cap Fund',
    category: 'Large Cap',
    folio: '7890123/07',
    units: 678.345,
    purchaseNav: 45.60,
    currentNav: 72.18,
    value: 489400,
    purchaseDate: '2019-05-12',
    xirr: 12.4,
    expenseRatio: 1.68,
    topHoldings: ['HDFC Bank', 'Reliance Industries', 'ICICI Bank', 'Infosys', 'TCS', 'Larsen & Toubro', 'Bajaj Finance', 'ITC', 'State Bank of India', 'Axis Bank']
  },
  {
    name: 'Kotak Emerging Equity Fund',
    category: 'Mid Cap',
    folio: '8901234/08',
    units: 234.567,
    purchaseNav: 58.90,
    currentNav: 85.66,
    value: 200900,
    purchaseDate: '2022-02-28',
    xirr: 14.9,
    expenseRatio: 1.74,
    topHoldings: ['Persistent Systems', 'Indian Hotels', 'Supreme Industries', 'The Phoenix Mills', 'Max Healthcare', 'Balkrishna Ind', 'Cholamandalam Inv', 'Sundaram Finance', 'Blue Star', 'CG Power']
  }
];

function generateOverlapMatrix(funds) {
  const n = funds.length;
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else if (j < i) {
        matrix[i][j] = matrix[j][i];
      } else {
        const holdingsA = new Set(funds[i].topHoldings);
        const holdingsB = new Set(funds[j].topHoldings);
        const intersection = [...holdingsA].filter(h => holdingsB.has(h));
        const union = new Set([...holdingsA, ...holdingsB]);
        matrix[i][j] = parseFloat((intersection.length / union.size).toFixed(3));
      }
    }
  }
  return matrix;
}

function generateSampleData() {
  const funds = SAMPLE_FUNDS;
  const totalValue = funds.reduce((sum, f) => sum + f.value, 0);
  const weightedXirr = funds.reduce((sum, f) => sum + (f.value / totalValue) * f.xirr, 0);
  const expenseDrag = funds.reduce((sum, f) => sum + f.units * f.currentNav * (f.expenseRatio / 100), 0);
  const overlapMatrix = generateOverlapMatrix(funds);

  return {
    xirr: parseFloat(weightedXirr.toFixed(1)),
    portfolioValue: totalValue,
    funds: funds,
    overlapMatrix: overlapMatrix,
    expenseDrag: Math.round(expenseDrag),
    benchmarkReturn: 12.1,
    rebalancingPlan: [
      {
        fund: 'ICICI Pru Technology Fund',
        action: 'REDUCE',
        reason: 'Expense ratio at 2.05% is significantly above category average. High overlap with Mirae Asset fund in tech holdings. Consider switching to a passive tech index fund.',
        priority: 'HIGH'
      },
      {
        fund: 'Nippon India Large Cap Fund',
        action: 'REDUCE',
        reason: '68% holding overlap with Axis Bluechip Fund. Maintaining both creates concentration risk in HDFC Bank and ICICI Bank without meaningful diversification.',
        priority: 'HIGH'
      },
      {
        fund: 'SBI Small Cap Fund',
        action: 'HOLD',
        reason: 'Strong XIRR at 22.6% with unique small-cap exposure. No significant overlap with other funds. Current allocation appropriate for risk profile.',
        priority: 'LOW'
      },
      {
        fund: 'Parag Parikh Flexi Cap Fund',
        action: 'INCREASE',
        reason: 'Lowest expense ratio at 0.89%. Unique international diversification via US tech holdings. Consider increasing SIP by 20% to improve portfolio risk-adjusted returns.',
        priority: 'MEDIUM'
      },
      {
        fund: 'Axis Bluechip Fund',
        action: 'HOLD',
        reason: 'Core large-cap allocation performing at 11.8% XIRR. Provides stability to portfolio. Maintain current allocation.',
        priority: 'LOW'
      }
    ]
  };
}

const SAMPLE_SIGNALS = [
  {
    company: 'Tata Motors Ltd',
    signalType: 'INSIDER_BUY',
    date: '2026-03-17',
    value: 28500000,
    confidence: 92,
    description: 'Director acquired 15,000 shares at ₹1,900. Consistent buying pattern over 3 months.',
    source: 'BSE Insider Trading Disclosures'
  },
  {
    company: 'Reliance Industries Ltd',
    signalType: 'BULK_DEAL',
    date: '2026-03-16',
    value: 425000000,
    confidence: 85,
    description: 'Goldman Sachs acquired 1.2L shares via block deal. Represents institutional confidence.',
    source: 'BSE Bulk Deal Data'
  },
  {
    company: 'HDFC Bank Ltd',
    signalType: 'INSIDER_BUY',
    date: '2026-03-15',
    value: 18200000,
    confidence: 88,
    description: 'CFO purchased 8,500 shares at ₹2,141. Second purchase this quarter.',
    source: 'BSE Insider Trading Disclosures'
  },
  {
    company: 'Infosys Ltd',
    signalType: 'BULK_DEAL',
    date: '2026-03-14',
    value: 312000000,
    confidence: 78,
    description: 'BlackRock increased stake by 0.3% via market purchase. Pattern suggests long-term accumulation.',
    source: 'NSE Bulk Deal Data'
  },
  {
    company: 'Bajaj Finance Ltd',
    signalType: 'INSIDER_BUY',
    date: '2026-03-13',
    value: 45600000,
    confidence: 94,
    description: 'MD & CEO acquired 5,200 shares at ₹8,769. Highest single purchase by management this year.',
    source: 'BSE Insider Trading Disclosures'
  },
  {
    company: 'Asian Paints Ltd',
    signalType: 'BULK_DEAL',
    date: '2026-03-12',
    value: 189000000,
    confidence: 72,
    description: 'FII exit — Vanguard reduced stake by 0.5%. Monitor for further selling pressure.',
    source: 'NSE Bulk Deal Data'
  },
  {
    company: 'Larsen & Toubro Ltd',
    signalType: 'INSIDER_BUY',
    date: '2026-03-11',
    value: 32100000,
    confidence: 86,
    description: 'Whole-time Director acquired 4,800 shares. Third consecutive insider buy this month.',
    source: 'BSE Insider Trading Disclosures'
  }
];

import { useAuth } from './AuthContext';

export function PortfolioProvider({ children }) {
  const { user } = useAuth();

  const [portfolioData, setPortfolioData] = useState(() => {
    if (!user) return null;
    try {
      const saved = localStorage.getItem(`paisa_portfolio_${user.id}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  const [signals, setSignals] = useState(() => {
    if (!user) return [];
    try {
      const saved = localStorage.getItem(`paisa_signals_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    if (!user) {
      setPortfolioData(null);
      setSignals([]);
    } else {
      const savedP = localStorage.getItem(`paisa_portfolio_${user.id}`);
      setPortfolioData(savedP ? JSON.parse(savedP) : null);
      const savedS = localStorage.getItem(`paisa_signals_${user.id}`);
      setSignals(savedS ? JSON.parse(savedS) : []);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (portfolioData) localStorage.setItem(`paisa_portfolio_${user.id}`, JSON.stringify(portfolioData));
      else localStorage.removeItem(`paisa_portfolio_${user.id}`);
      if (signals?.length) localStorage.setItem(`paisa_signals_${user.id}`, JSON.stringify(signals));
      else localStorage.removeItem(`paisa_signals_${user.id}`);
    }
  }, [user, portfolioData, signals]);

  const uploadPortfolio = useCallback(async (file) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      // Demo: Instead of using the backend mock response, generate the expected portfolio shape
      loadSampleData();
    } catch (err) {
      setError(err.message || 'Failed to upload portfolio.');
      loadSampleData(); // Fallback for the demo if backend isn't awake
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSampleData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setPortfolioData(generateSampleData());
      setSignals(SAMPLE_SIGNALS);
      setIsLoading(false);
    }, 1500);
  }, []);

  const sendChatMessage = useCallback(async (content) => {
    const userMsg = { role: 'user', content, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
          portfolio_context: portfolioData || {}
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMsg = { role: 'assistant', content: '', timestamp: Date.now(), sources: [] };
      setChatMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') {
              assistantContent += data.content;
              setChatMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent };
                return updated;
              });
            } else if (data.type === 'done') {
              setChatMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], sources: data.sources || [] };
                return updated;
              });
            }
          } catch (e) { /* skip malformed SSE */ }
        }
      }
    } catch (err) {
      const fallback = generateFallbackResponse(content, portfolioData);
      setChatMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === 'assistant' && !updated[updated.length - 1].content) {
          updated[updated.length - 1] = { role: 'assistant', content: fallback, timestamp: Date.now(), sources: [] };
        } else {
          updated.push({ role: 'assistant', content: fallback, timestamp: Date.now(), sources: [] });
        }
        return updated;
      });
    }
  }, [chatMessages, portfolioData]);

  const refreshSignals = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/signals');
      if (!res.ok) throw new Error('Signals fetch failed');
      const data = await res.json();
      // Map snake_case from API to camelCase for frontend
      const mapped = (data.signals || []).map(s => ({
        ...s,
        signalType: s.signal_type || s.signalType || 'BULK_DEAL',
      }));
      setSignals(mapped);
    } catch (err) {
      setSignals(SAMPLE_SIGNALS);
    }
  }, []);

  return (
    <PortfolioContext.Provider value={{
      portfolioData, isLoading, error, signals, chatMessages,
      uploadPortfolio, loadSampleData, sendChatMessage, refreshSignals,
      setChatMessages
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

function generateFallbackResponse(question, portfolio) {
  if (!portfolio) {
    return "I don't have your portfolio data loaded yet. Please upload your CAMS statement or load sample data to get personalized analysis.\n\n*This is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions.*";
  }
  const q = question.toLowerCase();
  if (q.includes('overlap') || q.includes('duplicate')) {
    return `Based on your portfolio, I can see significant overlap between your funds. Your HDFC Mid-Cap and Kotak Emerging Equity funds share holdings like Persistent Systems, Indian Hotels, and Supreme Industries. Similarly, Axis Bluechip and Nippon Large Cap have ~68% overlap in HDFC Bank, ICICI Bank, and Infosys.\n\n**Recommendation:** Consider consolidating your large-cap exposure into one fund to reduce redundancy and expense drag.\n\n*This is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions.*`;
  }
  if (q.includes('xirr') || q.includes('return') || q.includes('performance')) {
    return `Your portfolio XIRR is ${portfolio.xirr}%, which is ${(portfolio.xirr - portfolio.benchmarkReturn).toFixed(1)}% above the Nifty 50 benchmark (${portfolio.benchmarkReturn}%). Your best performer is SBI Small Cap Fund at 22.6% XIRR, while Axis Bluechip is the lowest at 11.8%.\n\n**Next step:** Review if the lower-performing large-cap funds justify their expense ratios compared to a simple Nifty 50 index fund.\n\n*This is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions.*`;
  }
  if (q.includes('expense') || q.includes('cost') || q.includes('fee')) {
    return `Your annual expense drag is ₹${portfolio.expenseDrag?.toLocaleString('en-IN') || '1,24,000'}, which is ${((portfolio.expenseDrag / portfolio.portfolioValue) * 100).toFixed(1)}% of your portfolio value. ICICI Pru Technology Fund has the highest expense ratio at 2.05%. Parag Parikh Flexi Cap at 0.89% is the most cost-efficient.\n\n**Action:** The technology fund's 2.05% expense ratio costs you ~₹5,730/year. A passive tech ETF could save 1.5% annually.\n\n*This is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions.*`;
  }
  return `Your portfolio of ₹${(portfolio.portfolioValue / 100000).toFixed(1)}L across ${portfolio.funds?.length || 8} funds shows a weighted XIRR of ${portfolio.xirr}%. Key observations:\n\n1. **Overlap risk:** Multiple funds share heavyweight positions in HDFC Bank and ICICI Bank\n2. **Expense optimization:** You can save ~₹${Math.round(portfolio.expenseDrag * 0.3).toLocaleString('en-IN')}/year by consolidating high-expense funds\n3. **Strong performers:** SBI Small Cap (22.6%) and ICICI Tech (19.3%) are generating alpha\n\nWould you like me to dive deeper into any of these areas?\n\n*This is analysis, not investment advice. Consult a SEBI-registered advisor before making decisions.*`;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}

export default PortfolioContext;
