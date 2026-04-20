import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    build: {
      target: 'es2022',
      modulePreload: false
    },
    esbuild: {
      target: 'es2022',
      supported: {
        'top-level-await': true
      }
    },
    define: {
      // API Key removed from client-side for security
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      hmr: false, // Force disable HMR to avoid port conflicts in dev environment
    },
  };
});
