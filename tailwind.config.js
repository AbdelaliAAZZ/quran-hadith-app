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
        amiri: ['Amiri', 'serif'],
        kufi: ['Reem Kufi', 'sans-serif'],
      },
      colors: {
        primary: "#0a3d62",
        accent: "#1e3799",
      },
    },
  },
  plugins: [],
}