/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.html",
    "./routes/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00bf63",
        dark: "#000000",
        light: "#ffffff"
      }
    },
  },
  plugins: [],
}
