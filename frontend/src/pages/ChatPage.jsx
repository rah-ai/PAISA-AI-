import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePortfolio } from '../context/PortfolioContext';
import { LineReveal, BlurReveal } from '../components/Animations';
import { formatINR } from '../utils/formatters';

function ChatMessage({ msg, isLast }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (msg.role !== 'assistant' || !isLast) {
      setDisplayed(msg.content);
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);
    const words = msg.content.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        setDisplayed(prev => prev + (i === 0 ? '' : ' ') + words[i]);
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [msg.content, msg.role, isLast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
    >
      {msg.role === 'assistant' && (
        <div className="flex-shrink-0 mt-1 w-7 h-7 rounded-full flex items-center justify-center font-mono" style={{ fontSize: 9, background: 'var(--bg-raised)', border: '1px solid var(--bg-border)', color: 'var(--gold-mid)' }}>
          P
        </div>
      )}
      <div
        className="rounded-card px-4 py-3"
        style={{
          maxWidth: '75%', lineHeight: 1.7, fontSize: 13,
          background: msg.role === 'user' ? 'rgba(201,168,76,0.06)' : 'var(--bg-raised)',
          border: msg.role === 'user' ? '1px solid rgba(201,168,76,0.12)' : '1px solid var(--bg-border)',
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {msg.role === 'assistant'
          ? displayed.replace(/\*\*|\*/g, '').replace(/^#+\s/gm, '')
          : displayed
        }
        {!done && <span className="pulse-dot inline-block ml-1" style={{ width: 6, height: 6, background: 'var(--gold-mid)', borderRadius: '50%', verticalAlign: 'middle' }} />}
        {done && msg.role === 'assistant' && (
          <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              This is analysis, not investment advice. Consult a SEBI-registered advisor.
            </span>
          </div>
        )}
        {done && msg.sources?.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {msg.sources.map((s, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-label px-2 py-0.5 rounded-chip"
                style={{ fontSize: 8, color: 'var(--blue-data)', background: 'rgba(58,127,212,0.1)', border: '1px solid rgba(58,127,212,0.2)' }}
              >
                {s}
              </motion.span>
            ))}
          </div>
        )}
      </div>
      {msg.role === 'user' && (
        <div className="flex-shrink-0 mt-1 w-7 h-7 rounded-full flex items-center justify-center font-mono" style={{ fontSize: 9, background: 'var(--bg-raised)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}>
          U
        </div>
      )}
    </motion.div>
  );
}

export default function ChatPage() {
  const { portfolioData, loadSampleData, chatMessages, sendChatMessage } = usePortfolio();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => { if (!portfolioData) loadSampleData(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendChatMessage(input.trim());
    setInput('');
  };

  const suggestedQuestions = [
    'What are my overlapping funds?',
    'Which fund has the highest expense ratio?',
    'How is my XIRR compared to Nifty 50?',
    'Should I consolidate my large-cap funds?',
    'What is my annual expense drag?',
    'Analyze my portfolio risk distribution',
  ];

  const pd = portfolioData;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif-display" style={{ fontSize: 28, color: 'var(--text-primary)' }}>Market Chat</h1>
        <span className="font-label" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>CHAT AGENT · MULTI-MODEL AI</span>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Portfolio Context Panel — 30% */}
        <div className="card overflow-y-auto" style={{ width: '30%', padding: 20 }}>
          <div className="font-label mb-4" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>PORTFOLIO CONTEXT</div>
          <LineReveal className="mb-4" />
          {pd?.funds?.map((fund, i) => (
            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fund.name.split(' Fund')[0]}
              </span>
              <div className="flex items-center gap-2">
                <div style={{ width: 40, height: 3, background: 'var(--bg-border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(fund.value / (pd.portfolioValue || 1)) * 100 * 4}%`, height: '100%', background: 'var(--blue-data)', borderRadius: 2 }} />
                </div>
                <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>
                  {((fund.value / (pd.portfolioValue || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
            <div className="font-label mb-1" style={{ color: 'var(--text-muted)', fontSize: 9 }}>PORTFOLIO XIRR</div>
            <div className="font-mono" style={{ fontSize: 32, color: 'var(--gold-mid)', fontWeight: 500 }}>{pd?.xirr?.toFixed(1) || '—'}%</div>
          </div>
          <div className="mt-4">
            <div className="font-label mb-1" style={{ color: 'var(--text-muted)', fontSize: 9 }}>TOTAL VALUE</div>
            <div className="font-mono" style={{ fontSize: 18, color: 'var(--text-primary)' }}>{pd ? formatINR(pd.portfolioValue) : '—'}</div>
          </div>
          <div className="mt-4">
            <div className="font-label mb-1" style={{ color: 'var(--text-muted)', fontSize: 9 }}>RISK PROFILE</div>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Moderate-Aggressive</div>
          </div>
        </div>

        {/* Chat Interface — 70% */}
        <div className="card flex flex-col" style={{ width: '70%', padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bg-border)' }}>
            <div className="font-label" style={{ color: 'var(--gold-mid)', fontSize: 10 }}>PAISA MARKET CHAT</div>
            <div className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              {chatMessages.length} messages · Portfolio-aware
            </div>
          </div>

          <div className="flex-1 px-5 py-5 overflow-y-auto flex flex-col gap-4">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                  <div className="font-serif-display mb-2" style={{ fontSize: 24, color: 'var(--text-primary)' }}>Ask PAISA anything</div>
                  <div className="font-sans" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Your AI advisor knows every detail of your portfolio.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-md">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendChatMessage(q)}
                      className="font-mono text-left px-3 py-2 rounded-card transition-all"
                      style={{
                        fontSize: 11, color: 'var(--text-muted)',
                        background: 'var(--bg-void)', border: '1px solid var(--bg-border)',
                        cursor: 'pointer',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} isLast={i === chatMessages.length - 1 && msg.role === 'assistant'} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-5 py-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your portfolio, market signals, or fund analysis..."
                className="flex-1 font-mono"
                style={{ fontSize: 12, padding: '12px 16px', background: 'var(--bg-void)', border: '1px solid var(--bg-border)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--gold-dim)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--bg-border)'}
              />
              <button onClick={handleSend} className="btn-gold" style={{ padding: '12px 20px', fontSize: 10 }}>
                Send
              </button>
            </div>
          </div>

          <div className="disclaimer px-5 pb-3" style={{ borderTop: 'none' }}>
            SEBI Advisory: PAISA provides analytical insights only. This platform is not a SEBI-registered investment advisor. All AI responses are analysis, not investment advice. Consult a qualified financial advisor before making investment decisions.
          </div>
        </div>
      </div>
    </div>
  );
}
