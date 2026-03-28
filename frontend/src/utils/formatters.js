export function formatINR(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const str = abs.toString();
  let formatted = '';

  if (str.length <= 3) {
    formatted = str;
  } else {
    formatted = str.slice(-3);
    let remaining = str.slice(0, -3);
    while (remaining.length > 2) {
      formatted = remaining.slice(-2) + ',' + formatted;
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) {
      formatted = remaining + ',' + formatted;
    }
  }

  return (isNegative ? '-₹' : '₹') + formatted;
}

export function formatCompactINR(amount) {
  const abs = Math.abs(amount);
  if (abs >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (abs >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatINR(amount);
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function getColorForValue(value, thresholds = { green: 12, red: 8 }) {
  if (value >= thresholds.green) return 'var(--green-data)';
  if (value <= thresholds.red) return 'var(--red-data)';
  return 'var(--text-secondary)';
}

export function getActionColor(action) {
  switch (action) {
    case 'REDUCE': return { bg: 'rgba(184, 64, 64, 0.12)', text: 'var(--red-data)' };
    case 'INCREASE': return { bg: 'rgba(46, 158, 104, 0.12)', text: 'var(--green-data)' };
    case 'HOLD': return { bg: 'var(--bg-raised)', text: 'var(--text-secondary)' };
    default: return { bg: 'var(--bg-raised)', text: 'var(--text-secondary)' };
  }
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
