import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    format: ['esm', 'cjs'],
    esm: {
      dir: 'es',
    },
    cjs: {
      dir: 'lib',
    },
  },
  dts: {
    enabled: true,
  },
  external: ['axios'],
})
