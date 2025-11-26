import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',

  output: {
    format: ['esm', 'cjs', 'umd'],
    esm: {
      dir: 'es',
      preserveStructure: true,
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
    },
    umd: {
      dir: 'dist',
      name: 'HttpVue',
      globals: {
        vue: 'Vue',
        '@ldesign/http-core': 'LDesignHttpCore',
      },
    },
  },

  // 关键配置：指定为 Vue 3 库类型
  libraryType: 'vue3',
  bundler: 'rollup',

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    'vue',
    '@ldesign/http-core',
    '@ldesign/engine',
    '@ldesign/shared',
  ],

  globals: {
    vue: 'Vue',
    '@ldesign/http-core': 'LDesignHttpCore',
  },
})
