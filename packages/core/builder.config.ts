import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    format: ['esm', 'cjs'],
    dir: {
      esm: 'es',
      cjs: 'lib',
    },
  },
  dts: {
    enabled: true,
  },
  external: ['axios'],
})
