import { defineConfig } from '@ldesign/builder'

/**
 * @ldesign/http-vue 构建配置
 *
 * 产物格式:
 * - esm/ - ESM 模块 (.js)
 * - cjs/ - CommonJS 模块 (.cjs)
 */
export default defineConfig({
  entry: 'src/index.ts',

  output: {
    esm: {
      dir: 'esm',
      sourcemap: true,
    },
    cjs: {
      dir: 'cjs',
      sourcemap: true,
    },
  },

  external: [
    'vue',
    '@ldesign/http-core',
    '@ldesign/engine',
    '@ldesign/shared',
    'tslib',
  ],

  libraryType: 'vue3',
  bundler: 'rollup',

  dts: {
    enabled: true,
  },
})
