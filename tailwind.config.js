/** @type {import('tailwindcss').Config} */
export default {
  future: {
    hoverOnlyWhenSupported: true, // Mobil qurilmalarda xunuk hover yopishib qolishini o'chiradi
  },
  // 'class' rejimi siz ishlatayotgan JavaScript mantiqiga 
  // (document.documentElement.classList.add('dark')) mos keladi
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
