/**
 * 批量创建子包的脚本
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const packages = [
  {
    name: 'http-interceptors',
    description: 'HTTP 拦截器库 - 提供请求/响应/错误拦截器管理',
    keywords: ['http', 'interceptor', 'middleware', 'ldesign'],
    dependencies: { '@ldesign/http-core': 'workspace:*' },
  },
  {
    name: 'http-features',
    description: 'HTTP 高级特性库 - 缓存、重试、熔断、限流等',
    keywords: ['http', 'cache', 'retry', 'circuit-breaker', 'ldesign'],
    dependencies: { '@ldesign/http-core': 'workspace:*', '@ldesign/http-utils': 'workspace:*' },
  },
  {
    name: 'http-utils',
    description: 'HTTP 工具函数库 - 提供各种实用工具函数',
    keywords: ['http', 'utils', 'helpers', 'ldesign'],
    dependencies: {},
  },
  {
    name: 'http-vue',
    description: 'HTTP Vue 3 集成库 - 提供 Vue 3 组合式函数和插件',
    keywords: ['http', 'vue', 'vue3', 'composables', 'ldesign'],
    dependencies: { '@ldesign/http-core': 'workspace:*', '@ldesign/http-adapters': 'workspace:*' },
    peerDependencies: { vue: '^3.3.0' },
  },
  {
    name: 'http-devtools',
    description: 'HTTP 开发者工具库 - 提供调试和监控功能',
    keywords: ['http', 'devtools', 'debug', 'monitor', 'ldesign'],
    dependencies: { '@ldesign/http-core': 'workspace:*' },
  },
  {
    name: 'http-presets',
    description: 'HTTP 预设配置库 - 提供常用的预设配置',
    keywords: ['http', 'presets', 'config', 'ldesign'],
    dependencies: { '@ldesign/http-core': 'workspace:*', '@ldesign/http-interceptors': 'workspace:*' },
  },
]

function createPackage(pkg) {
  const pkgDir = join('packages', pkg.name)
  const srcDir = join(pkgDir, 'src')

  // 创建目录
  mkdirSync(srcDir, { recursive: true })

  // package.json
  const packageJson = {
    name: `@ldesign/${pkg.name}`,
    version: '0.1.0',
    description: pkg.description,
    keywords: pkg.keywords,
    author: 'ldesign',
    license: 'MIT',
    type: 'module',
    exports: {
      '.': {
        types: './es/index.d.ts',
        import: './es/index.js',
        require: './lib/index.cjs',
      },
    },
    main: './lib/index.cjs',
    module: './es/index.js',
    types: './es/index.d.ts',
    unpkg: './dist/index.min.js',
    jsdelivr: './dist/index.min.js',
    files: ['README.md', 'LICENSE', 'package.json', 'es', 'lib', 'dist'],
    scripts: {
      build: 'ldesign-builder build',
      'build:watch': 'ldesign-builder build --watch',
      'build:clean': 'ldesign-builder clean && ldesign-builder build',
      'type-check': 'tsc --noEmit',
      lint: 'eslint . --fix',
      test: 'vitest',
      'test:run': 'vitest run',
      clean: 'rimraf es lib dist',
    },
    dependencies: pkg.dependencies,
    peerDependencies: pkg.peerDependencies || {},
    devDependencies: {
      '@ldesign/builder': 'workspace:*',
      '@types/node': '^22.0.0',
      eslint: '^9.18.0',
      typescript: '^5.7.3',
      vitest: '^3.2.4',
    },
    engines: {
      node: '>=18.0.0',
      pnpm: '>=8.0.0',
    },
  }

  writeFileSync(
    join(pkgDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  )

  // builder.config.ts
  const builderConfig = `import { defineConfig } from '@ldesign/builder'

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
  name: 'LDesign${pkg.name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}',
  minify: true,
  sourcemap: true,
  dts: true,
  clean: true,
})
`

  writeFileSync(join(pkgDir, 'builder.config.ts'), builderConfig)

  // tsconfig.json
  const tsconfig = {
    extends: '../../../../tsconfig.json',
    compilerOptions: {
      outDir: './es',
      rootDir: './src',
      declaration: true,
      declarationMap: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'es', 'lib', '**/*.test.ts', '**/*.spec.ts'],
  }

  writeFileSync(join(pkgDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))

  // src/index.ts
  const indexTs = `/**
 * @ldesign/${pkg.name}
 * 
 * ${pkg.description}
 */

// TODO: 实现具体功能
export const version = '0.1.0'
`

  writeFileSync(join(srcDir, 'index.ts'), indexTs)

  // README.md
  const readme = `# @ldesign/${pkg.name}

> ${pkg.description}

## 安装

\`\`\`bash
pnpm add @ldesign/${pkg.name}
\`\`\`

## 使用

\`\`\`typescript
import {} from '@ldesign/${pkg.name}'

// TODO: 添加使用示例
\`\`\`

## License

MIT © ldesign
`

  writeFileSync(join(pkgDir, 'README.md'), readme)

  console.log(`✅ Created package: @ldesign/${pkg.name}`)
}

// 创建所有包
packages.forEach(createPackage)

console.log('\\n🎉 All packages created successfully!')


