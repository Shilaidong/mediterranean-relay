import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './providers/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#E8E4D9',
        ink: '#1A4B9E',
        silver: '#C7C2B5',
        inkSoft: '#D6E0F2',
        stamp: '#B23A3A',
        bronze: '#7D634C',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        neumo:
          '0 18px 38px rgba(26, 75, 158, 0.12), 0 2px 10px rgba(255, 255, 255, 0.26)',
        'neumo-sm':
          '0 10px 22px rgba(26, 75, 158, 0.09), 0 2px 6px rgba(255, 255, 255, 0.2)',
        'neumo-inset':
          '0 0 0 1px rgba(26, 75, 158, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 12px 28px rgba(26, 75, 158, 0.08)',
        'neumo-inset-sm':
          '0 0 0 1px rgba(26, 75, 158, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 8px 18px rgba(26, 75, 158, 0.06)',
        'paper-card': '0 18px 38px rgba(26, 75, 158, 0.12)',
      },
      letterSpacing: {
        widest2: '0.4em',
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
} satisfies Config;
