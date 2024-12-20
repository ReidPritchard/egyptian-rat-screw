import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      aspectRatio: {
        'playing-card': '60 / 90',
      },
      keyframes: {
        appear: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        animation: {
          appear: 'appear 0.5s ease-in-out',
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['light', 'dark', 'autumn'],
  },
};
