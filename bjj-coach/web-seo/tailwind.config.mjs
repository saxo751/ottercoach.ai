/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#faf9f5',
        ink: '#141413',
        accent: '#d97757',
        blue: '#6a9bcc',
        green: '#788c5d',
      },
      fontFamily: {
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Lora', 'Georgia', 'serif'],
      },
    },
  },
};
