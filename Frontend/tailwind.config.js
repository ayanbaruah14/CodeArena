/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "neon-pink":  "#ff2d78",
        "neon-cyan":  "#00f5ff",
        "tokyo-bg":   "#06030f",
        "tokyo-panel":"#0d0520",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        mono:    ["'Share Tech Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};