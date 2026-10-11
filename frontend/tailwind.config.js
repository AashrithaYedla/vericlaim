/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /** Match existing `style.css` look */
        primary: { DEFAULT: "#03131a", light: "#0b1d24" },
        accent: { DEFAULT: "#20e0ff", hover: "#00bcd4" },
        surface: { DEFAULT: "rgba(255,255,255,0.08)" },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
