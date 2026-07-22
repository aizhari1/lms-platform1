import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces — deep ink-navy, never pure black
        ink: {
          DEFAULT: '#0B1220',
          soft: '#0F1830',
          card: '#131B2E',
          border: '#1E293B',
        },
        // Siraj — reskinned for an Arabic-language teacher brand: deep
        // burgundy/maroon (classic Arabic literature & calligraphy feel)
        // instead of the previous plain gold. Same color KEY names are
        // kept (siraj-500 etc.) so every component built against this
        // palette picks up the new look automatically.
        siraj: {
          50: '#FBF0F3',
          100: '#F4DCE3',
          300: '#DFA3B5',
          400: '#C96F8B',
          500: '#B33A5C', // primary brand maroon — kept bright enough that existing dark-text-on-500 badges/buttons stay legible
          600: '#8F2C48',
          700: '#6B2036',
          900: '#2E0E18',
        },
        // Warm gold trim — paired with the maroon for a heritage /
        // manuscript-cover accent (used sparingly: badges, ornamental
        // dividers, the lamp icon).
        gold: {
          400: '#E4B15A',
          500: '#D4A24A',
          600: '#B4842F',
        },
        // Supporting accents
        success: '#10B981',
        danger: '#F0654A',
        muted: {
          DEFAULT: '#94A3B8',
          light: '#CBD5E1',
        },
      },
      fontFamily: {
        display: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
        body: ['var(--font-tajawal)', 'Tajawal', 'sans-serif'],
        ui: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'lamp-glow':
          'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(179,58,92,0.30), transparent 70%)',
        'lamp-glow-soft':
          'radial-gradient(circle at 50% 30%, rgba(179,58,92,0.18), transparent 60%)',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        flicker: 'flicker 4s ease-in-out infinite',
        'rise-in': 'rise-in 0.6s ease-out forwards',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
