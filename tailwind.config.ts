import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#E8E4D9',
        ink: '#1A4B9E',
        silver: '#C7C2B5',
        inkSoft: '#D1CCC0',
        stamp: '#B23A3A',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        neumo:
          '5px 5px 12px rgba(0,0,0,0.07), -5px -5px 12px rgba(255,255,255,0.85)',
        'neumo-sm':
          '3px 3px 6px rgba(0,0,0,0.06), -3px -3px 6px rgba(255,255,255,0.8)',
        'neumo-inset':
          'inset 3px 3px 8px rgba(0,0,0,0.07), inset -3px -3px 8px rgba(255,255,255,0.85)',
        'neumo-inset-sm':
          'inset 2px 2px 5px rgba(0,0,0,0.06), inset -2px -2px 5px rgba(255,255,255,0.8)',
      },
      letterSpacing: {
        widest2: '0.4em',
      },
    },
  },
  plugins: [],
} satisfies Config;
