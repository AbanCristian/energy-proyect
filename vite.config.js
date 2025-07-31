import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // server: {
  //   proxy: {
  //     // Cualquier llamada que comience con /api se redirigirá al backend externo
  //     '/api': {
  //       target: 'https://api-powergate.onrender.com', // 🔁 Cambia esto por tu URL real de la API
  //       changeOrigin: true,
  //       rewrite: path => path.replace(/^\/api/, '') // elimina el prefijo "/api"
  //     }
  //   }
  // },
})
