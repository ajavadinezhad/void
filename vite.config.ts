import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/renderer/components'),
      '@/pages': path.resolve(__dirname, './src/renderer/pages'),
      '@/hooks': path.resolve(__dirname, './src/renderer/hooks'),
      '@/stores': path.resolve(__dirname, './src/renderer/stores'),
      '@/types': path.resolve(__dirname, './src/shared/types'),
      '@/utils': path.resolve(__dirname, './src/renderer/utils')
    }
  },
  server: {
    port: 5173,
    open: false, // Prevent auto-opening browser
    strictPort: true, // Don't try other ports if 5173 is busy
    host: 'localhost' // Only bind to localhost
  }
})
