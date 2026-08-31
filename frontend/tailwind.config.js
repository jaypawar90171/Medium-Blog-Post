/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      colors: {
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        'paper-dim': 'rgb(var(--color-paper-dim) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--color-ink-soft) / <alpha-value>)',
        meta: 'rgb(var(--color-meta) / <alpha-value>)',
        rule: 'rgb(var(--color-rule) / <alpha-value>)',
        red: 'rgb(var(--color-red) / <alpha-value>)',
        'red-dim': 'rgb(var(--color-red-dim) / <alpha-value>)',
        sage: 'rgb(var(--color-sage) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}

