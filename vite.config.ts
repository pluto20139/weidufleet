/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-utils': ['axios', 'zustand', 'dayjs'],
        },
      },
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**', '.claude/**'],
  },
});
