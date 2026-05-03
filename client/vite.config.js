import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Always load env from the client/ directory, regardless of where
  // the build command is run from (repo root vs client/).
  // This fixes Vercel builds where cwd = repo root and .env.production
  // lives inside client/ — Vite's default loadEnv would miss it.
  const clientDir = path.resolve(__dirname);          // __dirname = client/
  const env = loadEnv(mode, clientDir, 'VITE_');

  const RENDER_URL = 'https://attendance-system-acb5.onrender.com';
  const apiUrl = env.VITE_API_URL || RENDER_URL;

  return {
    plugins: [react()],

    // Bake the value into the bundle at build time as a hard constant.
    // import.meta.env.VITE_API_URL will equal apiUrl in every build.
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(
        mode === 'production' ? apiUrl : ''
      ),
    },

    server: {
      proxy: { '/api': 'http://localhost:5000' },
    },

    build: {
      chunkSizeWarningLimit: 1024,
    },
  };
});
