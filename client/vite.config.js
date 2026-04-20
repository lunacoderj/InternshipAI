import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    force: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5051',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
