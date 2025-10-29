import { defineConfig } from '@ldesign/launcher'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})
