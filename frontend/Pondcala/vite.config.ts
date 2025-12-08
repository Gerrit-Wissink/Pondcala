import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8080, // Change this to your desired port
    host: "172.16.0.39",
    allowedHosts: ["pondcala.webdev.gccis.rit.edu"]
  },
  plugins: [react()],
})
