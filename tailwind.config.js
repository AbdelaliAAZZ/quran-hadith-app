/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        ebgaramond: ['EB Garamond', 'serif'],
      },
      colors: {
        primary: "#0a3d62",
        accent: "#1e3799",
      },
    },
  },
  plugins: [],
}