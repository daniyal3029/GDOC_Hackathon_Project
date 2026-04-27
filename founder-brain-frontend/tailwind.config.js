/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#0A0A0F',
        surface: '#111118',
        elevated: '#1A1A24',
        'border-subtle': '#1E1E2E',
        accent: {
          primary: '#7C3AED',
          glow: '#A855F7',
          cyan: '#06B6D4',
        },
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(124,58,237,0.15), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 0 0 1px rgba(124,58,237,0.4), 0 0 32px rgba(124,58,237,0.15)',
        'card-active': '0 0 0 2px rgba(124,58,237,0.6)',
        'glow': '0 0 24px rgba(124,58,237,0.5)',
        'glow-sm': '0 0 12px rgba(124,58,237,0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
        'gradient-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.08) 50%, transparent 100%)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'pulse-dot': 'pulse-dot 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.5)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
