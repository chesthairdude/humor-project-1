/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backdropBlur: {
        glass: "28px",
      },
      backgroundOpacity: {
        glass: "0.55",
      },
    },
  },
  plugins: [],
};
