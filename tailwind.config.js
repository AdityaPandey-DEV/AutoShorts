/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC2626', // red-600
          dark: '#B91C1C', // red-700
          light: '#EF4444', // red-500
        },
        success: {
          DEFAULT: '#16A34A', // green-600
          dark: '#15803D', // green-700
          light: '#22C55E', // green-500
        },
      },
    },
  },
  plugins: [],
}

