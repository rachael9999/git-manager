import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// vite.config.js
export default defineConfig({
  plugins: [vue()],
  server: {
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [
        { from: /\/repositories/, to: '/repositories' },
        { from: /\/user/, to: '/user' },
        { from: /^\/.*/, to: '/index.html' }
      ]
    },
    proxy: {
      '/repositories': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/user': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})