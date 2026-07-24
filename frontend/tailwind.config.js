/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        glassCard: "rgba(17, 25, 40, 0.7)",
        glassBorder: "rgba(255, 255, 255, 0.1)",
        brandCyan: "#06B6D4",
        brandBlue: "#3B82F6",
        brandPurple: "#8B5CF6",
      },
    },
  },
  plugins: [],
}
