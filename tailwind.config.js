/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ink: {
          900: '#0f172a',
          700: '#334155',
          500: '#64748b',
          400: '#94a3b8',
        },
        surface: '#ffffff',
        field: {
          DEFAULT: '#f8fafc',
          line: '#cbd5e1',
        },
      },
      fontSize: {
        base: ['17px', '1.5'],
        lg: ['19px', '1.45'],
        xl: ['21px', '1.35'],
        '2xl': ['24px', '1.3'],
        '3xl': ['30px', '1.25'],
        '4xl': ['36px', '1.15'],
      },
      spacing: {
        touch: '44px',
      },
      borderRadius: {
        xl2: '1rem',
      },
      boxShadow: {
        sheet: '0 -8px 30px rgba(15, 23, 42, 0.12)',
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
