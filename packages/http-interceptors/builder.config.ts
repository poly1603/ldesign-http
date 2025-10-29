import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'umd'],
    dir: {
      esm: 'es',
      cjs: 'lib',
      umd: 'dist',
    },
  },
  name: 'LDesignHttpInterceptors',
  minify: true,
  sourcemap: true,
  dts: true,
  clean: true,
})
