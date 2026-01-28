import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1e1b16',
        paper: '#fff7ee',
        ember: '#f97316',
        lagoon: '#0f766e',
        dusk: '#2d2316'
      },
      boxShadow: {
        glow: '0 20px 45px -30px rgba(249, 115, 22, 0.65)'
      }
    }
  },
  plugins: []
};

export default config;
