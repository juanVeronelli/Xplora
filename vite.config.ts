import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiPort = process.env.API_PORT || '8787';

export default defineConfig({
  plugins: [react()],
  publicDir: 'src/public',
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        /**
         * Forma de función y no objeto: con la forma de array, `scheduler` (dependencia
         * compartida entre react-dom y el reconciler de react-three-fiber) caía dentro
         * del chunk `three` y entonces todo el sitio lo importaba de forma estática,
         * anulando la carga diferida del render 3D.
         */
        manualChunks(id) {
          const m = id.split('node_modules/')[1];
          if (!m) return;
          if (/^(react|react-dom|scheduler)\//.test(m)) return 'vendor';
          if (/^@supabase\//.test(m)) return 'supabase';
          if (/^(three|@react-three|react-reconciler|zustand|its-fine|suspend-react|react-use-measure)\//.test(m)) {
            return 'three';
          }
        },
      },
    },
  },
});
