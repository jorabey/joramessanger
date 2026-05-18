/** @type {import('tailwindcss').Config} */
export default {
	future: {
    hoverOnlyWhenSupported: true, // Mobil qurilmalarda xunuk hover yopishib qolishini o'chiradi
  },
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