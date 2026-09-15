/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vinuni: {
          navy: {
            DEFAULT: '#1E3A6E',
            dark: '#14274E',
            light: '#2E5496',
            subtle: '#EDF2FA',
          },
          red: {
            DEFAULT: '#C8232C',
            light: '#FDF2F2',
          },
        },
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
    },
  },
  plugins: [],
}