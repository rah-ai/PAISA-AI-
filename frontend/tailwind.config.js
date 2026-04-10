/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#07070B',
        base: '#0C0C12',
        surface: '#111119',
        raised: '#18181F',
        border: '#1F1F2C',
        'gold-dim': '#8B6914',
        'gold-mid': '#C9A84C',
        'gold-bright': '#E8C96A',
        'text-primary': '#EAEAF0',
        'text-secondary': '#9898A8',
        'text-muted': '#52525F',
        'green-data': '#2E9E68',
        'red-data': '#B84040',
        'blue-data': '#3A7FD4',
      },
      fontFamily: {
        'serif-display': ['"Instrument Serif"', 'serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
        'sans': ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'card': '8px',
        'chip': '6px',
        'btn': '4px',
        'container': '12px',
      },
      fontSize: {
        'display': ['clamp(4.5rem, 6vw, 6rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '400' }],
        'h1': ['clamp(3rem, 4vw, 3.5rem)', { lineHeight: '1.1', fontWeight: '400' }],
        'h2': ['2.25rem', { lineHeight: '1.2', fontWeight: '400' }],
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '400' }],
        'data-xl': ['clamp(3rem, 4vw, 4rem)', { lineHeight: '1', fontWeight: '500', fontFeatureSettings: '"tnum"' }],
        'data-lg': ['2rem', { lineHeight: '1', fontWeight: '500', fontFeatureSettings: '"tnum"' }],
        'data-md': ['1.5rem', { lineHeight: '1', fontWeight: '400', fontFeatureSettings: '"tnum"' }],
        'data-sm': ['0.875rem', { lineHeight: '1.4', fontWeight: '400', fontFeatureSettings: '"tnum"' }],
        'label': ['0.6875rem', { lineHeight: '1', fontWeight: '400', letterSpacing: '0.12em', textTransform: 'uppercase' }],
        'body': ['0.9375rem', { lineHeight: '1.75', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.6', fontWeight: '400' }],
      },
      keyframes: {
        'scan-line': {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        'breathing-dash': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '40' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
      animation: {
        'scan-line': 'scan-line 1.8s linear infinite',
        'breathing-dash': 'breathing-dash 1s linear infinite',
        'marquee': 'marquee 20s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
