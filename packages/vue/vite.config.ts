import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HttpVue',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'index.js'
        if (format === 'cjs') return 'index.cjs'
        return 'index.umd.js'
      }
    },
    
    rollupOptions: {
      external: ['vue', '@ldesign/http-core'],
      output: {
        globals: {
          vue: 'Vue',
          '@ldesign/http-core': 'HttpCore'
        },
        exports: 'named'
      }
    },
    
    outDir: 'dist',
    sourcemap: true,
    minify: false
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})