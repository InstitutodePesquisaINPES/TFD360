/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#cce3ff',
          200: '#99c7ff',
          300: '#66abff',
          400: '#338fff',
          500: '#0073ff',
          600: '#005ccc',
          700: '#004599',
          800: '#002e66',
          900: '#001733',
        },
        secondary: {
          50: '#e6f5f5',
          100: '#ccebeb',
          200: '#99d7d7',
          300: '#66c2c2',
          400: '#33aeae',
          500: '#00999a',
          600: '#007a7b',
          700: '#005b5c',
          800: '#003d3d',
          900: '#001e1e',
        },
        danger: '#e53e3e',
        warning: '#dd6b20',
        success: '#38a169',
        info: '#3182ce',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
} 