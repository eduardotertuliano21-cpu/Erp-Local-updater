/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand, var(--brand-primary, #10b981))',
          hover: 'var(--color-brand-hover, var(--brand-primary-hover, #059669))',
          light: 'var(--color-brand-light, var(--brand-primary-light, rgba(16, 185, 129, 0.15)))',
        },
        surface: {
          950: '#07090e',
          900: '#0c0f17',
          850: '#111622',
          800: '#181f2f',
          700: '#232b3e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 25px -5px var(--brand-primary-light, rgba(14, 165, 233, 0.3))',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
}
