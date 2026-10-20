export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        game: ['Orbitron', 'monospace'],
        body: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        game: {
          dark: '#0f1a1a',
          darker: '#081010',
          purple: '#0d9488',
          'purple-light': '#2dd4bf',
          cyan: '#38bdf8',
          'cyan-light': '#7dd3fc',
          pink: '#ec4899',
          card: '#12211f',
          border: '#1f3330',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'correct-pulse': 'correctPulse 0.6s ease-out',
        'incorrect-shake': 'incorrectShake 0.5s ease-out',
        'bounce-slow': 'bounceSlow 2.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        correctPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(45, 212, 191, 0.6)' },
          '70%': { boxShadow: '0 0 0 16px rgba(45, 212, 191, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(45, 212, 191, 0)' },
        },
        incorrectShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}