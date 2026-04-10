import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'renderer/document',
  build: {
    outDir: '../../renderer/document-dist',
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});
