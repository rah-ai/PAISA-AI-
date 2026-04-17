import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart, Bar, Brush, ReferenceArea, ReferenceLine } from 'recharts';
import { BlurReveal, ElasticSpring } from '../components/Animations';
import { formatINR } from '../utils/formatters';

const API = 'http://localhost:8000';

function PredictionGauge({ value, label, confidence, targetPrice, currentPrice }) {
  const isPositive = value >= 0;
  const color = isPositive ? 'var(--green-data)' : 'var(--red-data)';

  return (
    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
      <div className="font-label mb-2" style={{ color: 'var(--text-muted)', fontSize: 9 }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 28, color, fontWeight: 600 }}>
        {value >= 0 ? '+' : ''}{value.toFixed(1)}%
      </div>
      {targetPrice != null && (
        <div className="mt-1">
          <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
            ₹{targetPrice.toLocaleString('en-IN')}
          </span>
          {currentPrice != null && (
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>
              from ₹{currentPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      )}
      <div className="mt-2 flex items-center justify-center gap-2">
        <div style={{ width: 60, height: 4, background: 'var(--bg-border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${confidence}%`, height: '100%', background: 'var(--gold-mid)', borderRadius: 2 }} />
        </div>
        <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{confidence}%</span>
      </div>
      <div className="font-label mt-1" style={{ fontSize: 8, color: 'var(--text-muted)' }}>CONFIDENCE</div>
    </div>
  );
}

function TechnicalIndicator({ label, value, signal, color }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--bg-border)' }}>
      <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</span>
        {signal && (
          <span className="font-label px-2 py-0.5 rounded-chip" style={{
            fontSize: 8,
            color: signal === 'BULLISH' || signal === 'OVERSOLD' ? 'var(--green-data)' : signal === 'BEARISH' || signal === 'OVERBOUGHT' ? 'var(--red-data)' : 'var(--gold-mid)',
            background: signal === 'BULLISH' || signal === 'OVERSOLD' ? 'rgba(46,158,104,0.1)' : signal === 'BEARISH' || signal === 'OVERBOUGHT' ? 'rgba(184,64,64,0.1)' : 'rgba(201,168,76,0.08)',
            border: `1px solid ${signal === 'BULLISH' || signal === 'OVERSOLD' ? 'rgba(46,158,104,0.2)' : signal === 'BEARISH' || signal === 'OVERBOUGHT' ? 'rgba(184,64,64,0.2)' : 'rgba(201,168,76,0.2)'}`,
          }}>{signal}</span>
        )}
      </div>
    </div>
  );
}

export default function PredictorPage() {
  const [symbol, setSymbol] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/stocks`).then(r => r.json()).then(d => setStocks(d.stocks || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (symbol.length > 0) {
      const q = symbol.toUpperCase();
      setFilteredStocks(stocks.filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q)).slice(0, 8));
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [symbol, stocks]);

  const handlePredict = useCallback(async (sym) => {
    const tickerSymbol = sym || symbol;
    if (!tickerSymbol) return;
    setLoading(true);
    setError(null);
    setPrediction(null);
    setShowDropdown(false);

    try {
      const res = await fetch(`${API}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: tickerSymbol, days: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Prediction failed');
      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const chartData = prediction ? (() => {
    const actualPoints = prediction.chart_data.actual.map(d => ({ ...d, actual: d.price }));
    const predictedPoints = prediction.chart_data.predicted.map(d => ({ ...d, predicted: d.price }));
    // Bridge: add last actual price as the first predicted point so the line connects smoothly
    const lastActual = actualPoints[actualPoints.length - 1];
    if (lastActual && predictedPoints.length > 0) {
      const bridge = { date: lastActual.date, predicted: lastActual.actual, actual: lastActual.actual };
      return [...actualPoints, bridge, ...predictedPoints];
    }
    return [...actualPoints, ...predictedPoints];
  })() : [];

  const p = prediction;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif-display" style={{ fontSize: 28, color: 'var(--text-primary)' }}>Stock Predictor</h1>
        <span className="font-label" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>ML PREDICTION ENGINE</span>
      </div>

      {/* Search Bar */}
      <div className="card mb-6" style={{ padding: 20 }}>
        <div className="flex gap-3 items-center relative">
          <div className="flex-1 relative">
            <input
              type="text"
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePredict()}
              placeholder="Search Nifty 50 stocks — RELIANCE, TCS, HDFCBANK..."
              className="w-full font-mono"
              style={{ fontSize: 13, padding: '14px 16px', background: 'var(--bg-void)', border: '1px solid var(--bg-border)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = 'var(--gold-dim)'; setShowDropdown(true); }}
              onBlur={e => { e.target.style.borderColor = 'var(--bg-border)'; setTimeout(() => setShowDropdown(false), 200); }}
            />
            {showDropdown && filteredStocks.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-card z-50 overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', maxHeight: 300, overflowY: 'auto' }}>
                {filteredStocks.map(s => (
                  <button
                    key={s.symbol}
                    className="w-full text-left px-4 py-3 flex items-center justify-between transition-colors"
                    style={{ borderBottom: '1px solid var(--bg-border)', cursor: 'pointer', background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onMouseDown={() => { setSymbol(s.symbol); handlePredict(s.symbol); }}
                  >
                    <div>
                      <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.symbol}</span>
                      <span className="font-sans ml-2" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name}</span>
                    </div>
                    <span className="font-label" style={{ fontSize: 8, color: 'var(--gold-mid)' }}>{s.sector}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => handlePredict()} className="btn-gold" style={{ padding: '14px 24px', fontSize: 11 }} disabled={loading}>
            {loading ? 'Analyzing...' : 'Predict'}
            {!loading && <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 7h10M9 4l3 3-3 3" /></svg>}
          </button>
        </div>
      </div>

      {error && (
        <div className="card mb-6" style={{ padding: 16, border: '1px solid var(--red-data)' }}>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--red-data)' }}>{error}</span>
        </div>
      )}

      {loading && (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div className="font-serif-display mb-3" style={{ fontSize: 20, color: 'var(--text-primary)' }}>Analyzing {symbol.toUpperCase()}...</div>
          <div className="font-sans" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Running ML models, computing technical indicators, fetching live data</div>
          <div className="mt-4 mx-auto" style={{ width: 40, height: 3, background: 'var(--bg-border)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }} style={{ width: '50%', height: '100%', background: 'var(--gold-mid)', borderRadius: 2 }} />
          </div>
        </div>
      )}

      {p && !loading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="card mb-4" style={{ padding: 20 }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif-display" style={{ fontSize: 22, color: 'var(--text-primary)' }}>{p.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>NSE: {p.symbol}</span>
                  <span className="font-label px-2 py-0.5 rounded-chip" style={{ fontSize: 8, color: 'var(--gold-mid)', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>{p.sector}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)' }}>₹{p.current_price.toLocaleString('en-IN')}</div>
                <span className="font-label px-2 py-1 rounded-chip" style={{
                  fontSize: 9,
                  color: p.trend === 'BULLISH' ? 'var(--green-data)' : p.trend === 'BEARISH' ? 'var(--red-data)' : 'var(--gold-mid)',
                  background: p.trend === 'BULLISH' ? 'rgba(46,158,104,0.1)' : p.trend === 'BEARISH' ? 'rgba(184,64,64,0.1)' : 'rgba(201,168,76,0.08)',
                  border: `1px solid ${p.trend === 'BULLISH' ? 'rgba(46,158,104,0.2)' : p.trend === 'BEARISH' ? 'rgba(184,64,64,0.2)' : 'rgba(201,168,76,0.2)'}`,
                  fontWeight: 600,
                }}>{p.trend}</span>
              </div>
            </div>
          </div>

          {/* Prediction Cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <PredictionGauge value={p.predictions['7_day'].change_pct} label="7-DAY FORECAST" confidence={p.predictions['7_day'].confidence} targetPrice={p.predictions['7_day'].target} currentPrice={p.current_price} />
            <PredictionGauge value={p.predictions['30_day'].change_pct} label="30-DAY FORECAST" confidence={p.predictions['30_day'].confidence} targetPrice={p.predictions['30_day'].target} currentPrice={p.current_price} />
          </div>

          {/* Price Chart */}
          <div className="card mb-4" style={{ padding: 20 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-label" style={{ color: 'var(--text-muted)', fontSize: 9 }}>PRICE CHART · ACTUAL vs PREDICTED</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>Drag the slider below to zoom · Scroll to pan</div>
            </div>
            <ResponsiveContainer width="100%" height={480}>
              <ComposedChart data={chartData}>
                <CartesianGrid stroke="var(--bg-border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickFormatter={d => d.slice(5)} interval={Math.max(1, Math.floor(chartData.length / 18))} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} domain={['auto', 'auto']} tickFormatter={v => `₹${v.toLocaleString('en-IN')}`} width={70} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 4, fontSize: 11, color: 'var(--text-primary)' }} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']} />
                <ReferenceLine x={prediction?.chart_data?.actual?.[prediction.chart_data.actual.length - 1]?.date} stroke="var(--gold-dim)" strokeDasharray="3 3" label={{ value: 'Today', position: 'top', fill: 'var(--text-muted)', fontSize: 9 }} />
                <Line type="monotone" dataKey="actual" stroke="var(--blue-data)" strokeWidth={2} dot={false} name="Actual" connectNulls={false} />
                <Line type="monotone" dataKey="predicted" stroke="var(--gold-mid)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Predicted" connectNulls={false} />
                <Brush dataKey="date" height={28} stroke="var(--gold-dim)" fill="var(--bg-void)" tickFormatter={d => d.slice(5)} startIndex={Math.max(0, chartData.length - 60)} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Technical Indicators */}
            <div className="card" style={{ padding: 20 }}>
              <div className="font-label mb-3" style={{ color: 'var(--gold-mid)', fontSize: 9 }}>TECHNICAL INDICATORS</div>
              <TechnicalIndicator label="RSI (14)" value={p.technical_indicators.rsi} signal={p.technical_indicators.rsi_signal} />
              <TechnicalIndicator label="MACD" value={p.technical_indicators.macd.macd} signal={p.technical_indicators.macd.trend} />
              <TechnicalIndicator label="MACD Signal" value={p.technical_indicators.macd.signal} />
              <TechnicalIndicator label="Histogram" value={p.technical_indicators.macd.histogram} color={p.technical_indicators.macd.histogram > 0 ? 'var(--green-data)' : 'var(--red-data)'} />
              {p.technical_indicators.sma.sma20 && <TechnicalIndicator label="SMA 20" value={`₹${p.technical_indicators.sma.sma20.toLocaleString('en-IN')}`} />}
              {p.technical_indicators.sma.sma50 && <TechnicalIndicator label="SMA 50" value={`₹${p.technical_indicators.sma.sma50.toLocaleString('en-IN')}`} />}
              {p.technical_indicators.sma.sma200 && <TechnicalIndicator label="SMA 200" value={`₹${p.technical_indicators.sma.sma200.toLocaleString('en-IN')}`} />}
              <div className="mt-3">
                {p.technical_indicators.sma.crossover_signals?.map((s, i) => (
                  <div key={i} className="font-mono py-1" style={{ fontSize: 10, color: s.includes('BULLISH') ? 'var(--green-data)' : 'var(--red-data)' }}>⚡ {s}</div>
                ))}
              </div>
            </div>

            {/* Support & Resistance */}
            <div className="card" style={{ padding: 20 }}>
              <div className="font-label mb-3" style={{ color: 'var(--gold-mid)', fontSize: 9 }}>SUPPORT & RESISTANCE</div>
              <TechnicalIndicator label="Resistance 2" value={`₹${p.technical_indicators.support_resistance.resistance_2.toLocaleString('en-IN')}`} color="var(--red-data)" />
              <TechnicalIndicator label="Resistance 1" value={`₹${p.technical_indicators.support_resistance.resistance_1.toLocaleString('en-IN')}`} color="var(--red-data)" />
              <TechnicalIndicator label="Pivot" value={`₹${p.technical_indicators.support_resistance.pivot.toLocaleString('en-IN')}`} color="var(--gold-mid)" />
              <TechnicalIndicator label="Support 1" value={`₹${p.technical_indicators.support_resistance.support_1.toLocaleString('en-IN')}`} color="var(--green-data)" />
              <TechnicalIndicator label="Support 2" value={`₹${p.technical_indicators.support_resistance.support_2.toLocaleString('en-IN')}`} color="var(--green-data)" />

              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--bg-border)' }}>
                <div className="font-label mb-2" style={{ color: 'var(--text-muted)', fontSize: 9 }}>VOLUME</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Current</span>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{p.volume.current.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>20D Avg</span>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{p.volume.average_20d.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ratio</span>
                  <span className="font-mono" style={{ fontSize: 12, color: p.volume.ratio > 1.5 ? 'var(--green-data)' : 'var(--text-primary)' }}>{p.volume.ratio}x</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Commentary */}
          {p.ai_commentary && (
            <div className="card" style={{ padding: 20 }}>
              <div className="font-label mb-3" style={{ color: 'var(--gold-mid)', fontSize: 9 }}>AI COMMENTARY</div>
              <div className="font-sans" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {p.ai_commentary.replace(/\*\*|\*/g, '').replace(/^#+\s/gm, '')}
              </div>
              <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
                <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>Model: {p.metadata.model} | Data points: {p.metadata.data_points} | This is analysis, not investment advice.</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!p && !loading && !error && (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div className="font-serif-display mb-3" style={{ fontSize: 22, color: 'var(--text-primary)' }}>ML-Powered Stock Predictions</div>
          <p className="font-sans mx-auto mb-6" style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 500 }}>
            Search any Nifty 50 stock to get 7-day and 30-day price predictions using Linear Regression, RSI, MACD, SMA crossovers, and AI commentary.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS', 'SBIN'].map(s => (
              <button key={s} onClick={() => { setSymbol(s); handlePredict(s); }}
                className="font-mono px-3 py-2 rounded-card transition-colors"
                style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-void)', border: '1px solid var(--bg-border)', cursor: 'pointer' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="disclaimer mt-4">
        Stock predictions are based on historical data analysis using Machine Learning models. Past performance is not indicative of future results. This is not investment advice. Consult a SEBI-registered advisor.
      </div>
    </div>
  );
}
