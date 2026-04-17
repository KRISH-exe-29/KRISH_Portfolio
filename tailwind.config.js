/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card': 'var(--bg-card)',
        'border': 'var(--border)',
        'color-primary': 'var(--color-primary)',
        'color-accent': 'var(--color-accent)',
        'color-blue': '#00BFFF',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        cinzel: ['"Cinzel Decorative"', 'serif'],
        inter: ['"Inter"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'led-pulse': 'ledPulse 2s ease-in-out infinite',
        'bounce-down': 'bounceDown 1.8s ease-in-out infinite',
        'status-pulse': 'statusPulse 2s ease-in-out infinite',
        'spark': 'spark 0.35s linear',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        ledPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        bounceDown: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' },
        },
        statusPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0' },
        },
        spark: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,184,0,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255,184,0,0.6)' },
        },
      },
    },
  },
  plugins: [],
}