import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function spaFallback404() {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const indexPath = path.resolve(__dirname, 'dist/index.html')
      const fallbackPath = path.resolve(__dirname, 'dist/404.html')
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, fallbackPath)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback404()],
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
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Keep particles on the delayed dynamic-import path (not entry/modulepreload).
          if (id.includes('@tsparticles') || id.includes('tsparticles')) return
          // One shared React instance. Do not split react-i18next / i18next into a
          // sibling chunk: that created a react-vendor ↔ i18n-vendor cycle and
          // crashed at runtime (createContext on undefined → blank page).
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)
          ) {
            return 'react-vendor'
          }
          if (id.includes('lucide-react') || id.includes('react-icons')) return 'ui-vendor'
        },
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    modulePreload: {
      polyfill: false,
      resolveDependencies(_filename, deps) {
        return deps.filter(
          (dep) => !dep.includes('tsparticles') && !dep.includes('ParticlesBackground')
        )
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
