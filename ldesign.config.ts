import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  libraryType: 'typescript',
  output: {
    format: ['esm', 'cjs', 'umd']
  },
  typescript: {
    tsconfig: './tsconfig.json',
    declaration: true,
    declarationDir: '',
    // 强制覆盖 tsconfig 中的设置以启用 DTS 生成
    compilerOptions: {
      noEmit: false,
      declaration: true,
      declarationMap: true,
      allowImportingTsExtensions: false
    }
  }
})
