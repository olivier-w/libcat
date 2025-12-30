/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep charcoal background
        charcoal: {
          50: '#f5f5f7',
          100: '#e5e5e9',
          200: '#ccccd3',
          300: '#a8a8b3',
          400: '#7d7d8c',
          500: '#626271',
          600: '#53535f',
          700: '#47474f',
          800: '#3d3d44',
          900: '#1a1a2e',
          950: '#0f0f1a',
        },
        // Warm amber accent
        amber: {
          50: '#fef7ed',
          100: '#fdecd4',
          200: '#fad5a8',
          300: '#f7b971',
          400: '#f4a261',
          500: '#ef8533',
          600: '#e06b29',
          700: '#ba5124',
          800: '#944124',
          900: '#783820',
        },
        // Soft cream
        cream: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf3e6',
          300: '#f5e9d4',
          400: '#eddbb8',
          500: '#e3c99a',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

