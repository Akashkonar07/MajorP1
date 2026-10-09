/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fdf2f5',
          100: '#fce7ed',
          200: '#f9d0de',
          300: '#f4a9c0',
          400: '#ec7498',
          500: '#df4974',
          600: '#ca2a57',
          700: '#aa1d43',
          800: '#8e1a3a',
          900: '#5d0325',
          950: '#3d0118',
        },
        gold: {
          50: '#fdf9e7',
          100: '#faf2c2',
          200: '#f4e288',
          300: '#edcc4b',
          400: '#e5b827',
          500: '#d49b18',
          600: '#b67811',
          700: '#755b00',
          800: '#5c4615',
          900: '#4d3a17',
          950: '#2c1f09',
        },
        cream: '#fff8f7',
        charcoal: '#2d1f1f',
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(93, 3, 37, 0.08)',
        'card': '0 4px 24px rgba(93, 3, 37, 0.10)',
        'hover': '0 8px 40px rgba(93, 3, 37, 0.18)',
      },
      borderRadius: {
        'sm': '6px',
        DEFAULT: '10px',
        'lg': '16px',
      },
    },
  },
  plugins: [],
}
