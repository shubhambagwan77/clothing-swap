import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the React app calls /api, which is forwarded to the Express server
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
