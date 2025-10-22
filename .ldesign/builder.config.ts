/**
 * @ldesign/http 构建配置
 * 
 * 使用 rolldown 打包，避免 TypeScript 插件问题
 */

export default {
  // 使用 rolldown 以获得更好的性能和兼容性
  bundler: 'rolldown',
  
  // 输出配置
  output: {
    format: ['esm', 'cjs'],
    esm: {
      dir: 'es',
      preserveStructure: true
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true
    },
    sourcemap: true
  },
  
  // 外部依赖
  external: ['vue', 'axios', 'alova'],
  
  // TypeScript 配置
  typescript: {
    declaration: true,
    declarationMap: true,
    compilerOptions: {
      moduleResolution: 'bundler',
      allowImportingTsExtensions: false,
      noEmit: false
    }
  }
}
