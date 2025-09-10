import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar bibliotecas pesadas em chunks diferentes
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@tsparticles/react', '@tsparticles/slim', 'lucide-react', 'react-icons'],
          'i18n-vendor': ['react-i18next', 'i18next'],
          'utils-vendor': ['papaparse', 'react-scroll', 'clsx']
        }
      }
    },
    // Otimizações de performance
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    // Preload modules importantes
    modulePreload: {
      polyfill: false
    }
  },
  // Otimizações de desenvolvimento
  server: {
    fs: {
      // Permitir servir arquivos fora da raiz do projeto
      allow: ['..']
    }
  },
  // Otimizações de assets
  assetsInclude: ['**/*.csv'],
  optimizeDeps: {
    include: ['react', 'react-dom', '@tsparticles/react', 'papaparse']
  }
})
