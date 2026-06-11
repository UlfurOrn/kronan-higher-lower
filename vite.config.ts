import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Project page lives at https://ulfurorn.github.io/kronan-higher-lower/
  base: '/kronan-higher-lower/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
