import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// Importar o plugin personalizado de axe (comentado para usar apenas quando necessário)
// import viteAxePlugin from './vite-axe-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // viteAxePlugin() // Descomente para ativar o plugin de verificação de acessibilidade
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './src/assets')
    },
  },
  server: {
    port: 5173,
    open: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
})
