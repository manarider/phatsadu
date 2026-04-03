import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Base path ต้องตรงกับ URL ที่ nginx serve
  base: '/phatsadu/',

  server: {
    port: 3000,
    proxy: {
      // Proxy API calls → Node.js backend port 4004
      '/phatsadu/api': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/phatsadu/, ''),
      },
      // Proxy uploaded files → backend
      '/phatsadu/uploads': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/phatsadu/, ''),
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
