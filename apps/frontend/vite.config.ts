import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const serverPort = process.env.PORT || 5001;

export default defineConfig({
  plugins: [
    svelte({
      /* plugin options */
    }),
  ],
  server: {
    proxy: {
      '/api': `http://localhost:${serverPort}`,
      '/ws': {
        target: `ws://localhost:${serverPort}`,
        ws: true,
      },
    },
  },
});
