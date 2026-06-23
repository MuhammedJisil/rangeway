/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#DE4F26',      // Rangeway logo orange
          orangeHover: '#C43E19', // Darker shade for hover
          darkest: '#090B0F',     // Very deep gray/black for main bg
          card: '#121620',        // Deep gray for cards/sections
          input: '#1A202E',       // Input element bg
          border: '#293548',      // Border color
          textMain: '#F3F4F6',    // Off white text
          textMuted: '#9CA3AF'    // Muted gray text
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
