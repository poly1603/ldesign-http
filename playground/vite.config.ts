import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ldesign/http-core': resolve(__dirname, '../packages/core/src'),
      '@ldesign/http-vue': resolve(__dirname, '../packages/vue/src'),
      '@ldesign/engine-vue3': resolve(__dirname, '../../engine/packages/vue3/src'),
      '@ldesign/engine-core': resolve(__dirname, '../../engine/packages/core/src'),
    },
  },
  server: {
    port: 5180,
  },
})
