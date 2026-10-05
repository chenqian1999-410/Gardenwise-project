/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18221f",
        moss: "#506b4d",
        sage: "#d7e0d1",
        clay: "#b8674f",
        fog: "#f4f1eb",
        oat: "#e9ddc7",
        bay: "#315d68"
      },
      boxShadow: {
        soft: "0 20px 70px rgba(28, 39, 34, 0.12)"
      }
    }
  },
  plugins: []
};
