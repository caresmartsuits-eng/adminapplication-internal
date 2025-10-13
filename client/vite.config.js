import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
/*server: { proxy: { '/api': 'https://adminapplication-api.onrender.com' } }*/
/*server: { proxy: { '/api': 'http://localhost:3000' } }*/
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } }

})
