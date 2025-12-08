import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8081, // Change this to your desired port
  },
  build: {
    outDir: resolve(__dirname, '../../backend/static'),
    sourcemap: false
  },
  plugins: [react()],
})
