/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a1012',
        panel: '#10191c',
        'panel-2': '#152023',
        line: '#233034',
        'text-main': '#e7eef0',
        'text-dim': '#8fa5ab',
        'text-faint': '#526266',
        teal: {
          DEFAULT: '#22e6c4',
          glow: 'rgba(34, 230, 196, 0.15)',
        },
        amber: {
          DEFAULT: '#ffb238',
          glow: 'rgba(255, 178, 56, 0.15)',
        },
        blue: {
          DEFAULT: '#5fa8ff',
          glow: 'rgba(95, 168, 255, 0.15)',
        },
        red: {
          DEFAULT: '#ff6b5e',
          glow: 'rgba(255, 107, 94, 0.15)',
        },
        green: {
          DEFAULT: '#63d98a',
          glow: 'rgba(99, 217, 138, 0.15)',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-teal': '0 0 15px -3px rgba(34, 230, 196, 0.3)',
        'glow-amber': '0 0 15px -3px rgba(255, 178, 56, 0.3)',
        'glow-blue': '0 0 15px -3px rgba(95, 168, 255, 0.3)',
        'glow-red': '0 0 15px -3px rgba(255, 107, 94, 0.3)',
        'glow-green': '0 0 15px -3px rgba(99, 217, 138, 0.3)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
