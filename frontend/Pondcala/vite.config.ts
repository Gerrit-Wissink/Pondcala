import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8081, // Change this to your desired port
    proxy: {
      '/ws': {
        target: 'http://localhost:8080',
        ws: true, // Enable WebSocket proxying
      },
      '/api': {
        target: 'http://localhost:8080',
      },
      '/login': {
        target: 'http://localhost:8080',
      },
      '/createAccount': {
        target: 'http://localhost:8080',
      }
    }
  },
  build: {
    outDir: resolve(__dirname, '../../backend/static'),
    sourcemap: false
  },
  plugins: [react()],
})
