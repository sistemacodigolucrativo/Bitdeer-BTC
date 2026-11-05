import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      allowedHosts: true as const,
      proxy: {
        '/api': 'http://127.0.0.1:8000',
        '/install': 'http://127.0.0.1:8000',
      },
      fs: {
        deny: [
          '.env',
          '.env.*',
          '*.{crt,pem}',
          '**/.git/**',
          '**/.local/**',
          '**/server/**',
          '**/bin/**',
          '**/*.sqlite*',
        ],
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Replit's .local/ contains transient agent files, not application sources.
      watch: process.env.DISABLE_HMR === 'true'
        ? null
        : { ignored: ['**/.local/**'] },
    },
  };
});

