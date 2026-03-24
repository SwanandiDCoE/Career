import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          DEFAULT: '#0f1117',
          1: '#141720',
          2: '#1a1f2e',
          3: '#1e2333',
          4: '#242940',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease both',
        'fade-in-up': 'fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':   'scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':    'shimmer 1.6s ease-in-out infinite',
        'float':      'float 4s ease-in-out infinite',
        'spin-slow':  'spinSlow 8s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'ring-draw':  'ringDraw 1.1s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp:  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:   { from: { backgroundPosition: '-200% center' }, to: { backgroundPosition: '200% center' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        spinSlow:  { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        ringDraw:  { from: { strokeDashoffset: 'var(--ring-full)' }, to: { strokeDashoffset: 'var(--ring-offset)' } },
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)',
        'card-hover': '0 1px 3px rgba(0,0,0,0.4), 0 16px 48px rgba(0,0,0,0.35)',
        'glow-sm':    '0 0 16px rgba(99,102,241,0.25)',
        'glow-md':    '0 0 32px rgba(99,102,241,0.25)',
        'glow-lg':    '0 0 64px rgba(99,102,241,0.2)',
        'emerald-glow': '0 0 24px rgba(16,185,129,0.2)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.75rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
