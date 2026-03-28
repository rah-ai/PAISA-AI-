const API_BASE = 'http://localhost:8000';

export async function uploadPortfolio(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function fetchSignals() {
  const res = await fetch(`${API_BASE}/api/signals`);
  if (!res.ok) throw new Error('Failed to fetch signals');
  return res.json();
}

export function streamChat(messages, portfolioContext) {
  return fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, portfolio_context: portfolioContext }),
  });
}

export async function requestRebalance(portfolioData) {
  const res = await fetch(`${API_BASE}/api/rebalance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolio_data: portfolioData }),
  });
  if (!res.ok) throw new Error('Rebalance request failed');
  return res.json();
}
