/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#f47b25',      // Orange accent
          dark: '#1a1a1a',         // Dark background
          darker: '#0f0f0f',       // Darker background
          light: '#f5f5f5',        // Light background
          border: '#333333',       // Border color
        },
      },
      fontFamily: {
        sans: ['Work Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
