/**
 * 重新组织 HTTP 包结构 - 参考 engine 包
 * 
 * 新结构:
 * packages/http/
 * ├── packages/
 * │   ├── core/          # 核心HTTP客户端（框架无关）
 * │   ├── vue/           # Vue 3 适配器
 * │   ├── react/         # React 适配器
 * │   ├── solid/         # Solid 适配器
 * │   └── svelte/        # Svelte 适配器
 * ├── ldesign.config.ts  # 主包配置
 * └── package.json       # 主包配置
 */

import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

console.log('🚀 开始重新组织 HTTP 包结构...\n')

// 核心包结构
const corePackage = {
  name: 'core',
  fullName: '@ldesign/http-core',
  description: 'Framework-agnostic HTTP client with adapters, interceptors, caching, and more',
  keywords: ['http', 'client', 'fetch', 'axios', 'alova', 'typescript', 'framework-agnostic'],
  modules: [
    'adapters',    // HTTP适配器（Fetch, Axios, Alova）
    'cache',       // 缓存管理
    'interceptors',// 拦截器
    'middleware',  // 中间件
    'retry',       // 重试机制
    'types',       // 类型定义
    'utils',       // 工具函数
  ],
  peerDependencies: {},
  devDependencies: {
    axios: '^1.12.2',
    alova: '^3.3.4',
  },
}

// 框架适配器包
const frameworkPackages = [
  {
    name: 'vue',
    fullName: '@ldesign/http-vue',
    description: 'Vue 3 adapter for @ldesign/http-core',
    keywords: ['vue3', 'http', 'composables', 'typescript'],
    modules: ['composables', 'plugin'],
    peerDependencies: {
      'vue': '^3.3.0',
      '@ldesign/http-core': 'workspace:*',
    },
    devDependencies: {
      'vue': '^3.5.18',
      'vue-tsc': '^3.0.5',
      '@vitejs/plugin-vue': '^5.0.3',
    },
  },
  {
    name: 'react',
    fullName: '@ldesign/http-react',
    description: 'React adapter for @ldesign/http-core',
    keywords: ['react', 'http', 'hooks', 'typescript'],
    modules: ['hooks', 'provider'],
    peerDependencies: {
      'react': '^18.0.0',
      '@ldesign/http-core': 'workspace:*',
    },
    devDependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@types/react': '^18.2.21',
      '@types/react-dom': '^18.2.7',
    },
  },
  {
    name: 'solid',
    fullName: '@ldesign/http-solid',
    description: 'Solid adapter for @ldesign/http-core',
    keywords: ['solid', 'solidjs', 'http', 'hooks', 'typescript'],
    modules: ['hooks', 'provider'],
    peerDependencies: {
      'solid-js': '^1.7.0',
      '@ldesign/http-core': 'workspace:*',
    },
    devDependencies: {
      'solid-js': '^1.8.0',
    },
  },
  {
    name: 'svelte',
    fullName: '@ldesign/http-svelte',
    description: 'Svelte adapter for @ldesign/http-core',
    keywords: ['svelte', 'http', 'stores', 'typescript'],
    modules: ['stores', 'actions'],
    peerDependencies: {
      'svelte': '^4.0.0',
      '@ldesign/http-core': 'workspace:*',
    },
    devDependencies: {
      'svelte': '^4.2.0',
    },
  },
]

function createPackage(pkg, isCore = false) {
  const pkgDir = join('packages', pkg.name)
  const srcDir = join(pkgDir, 'src')

  console.log(`📦 创建包: ${pkg.fullName}`)

  // 创建目录结构
  mkdirSync(srcDir, { recursive: true })
  pkg.modules.forEach(module => {
    mkdirSync(join(srcDir, module), { recursive: true })
  })

  // 创建 package.json
  const packageJson = {
    name: pkg.fullName,
    version: '0.1.0',
    description: pkg.description,
    keywords: pkg.keywords,
    author: 'ldesign',
    license: 'MIT',
    type: 'module',
    sideEffects: false,
    exports: generateExports(pkg.modules),
    main: './lib/index.cjs',
    module: './es/index.js',
    types: './es/index.d.ts',
    unpkg: './dist/index.min.js',
    jsdelivr: './dist/index.min.js',
    files: ['README.md', 'LICENSE', 'package.json', 'es', 'lib', 'dist'],
    scripts: {
      build: 'ldesign-builder build -f esm,cjs,dts',
      dev: 'ldesign-builder build -f esm,cjs,dts --watch',
      test: 'vitest',
      'test:run': 'vitest run',
      'test:coverage': 'vitest run --coverage',
      lint: 'eslint . --fix',
      'lint:check': 'eslint .',
      'type-check': isCore ? 'tsc --noEmit' : (pkg.name === 'vue' ? 'vue-tsc --noEmit' : 'tsc --noEmit'),
    },
    dependencies: isCore ? {} : { '@ldesign/http-core': 'workspace:*' },
    peerDependencies: pkg.peerDependencies,
    devDependencies: {
      '@ldesign/builder': 'workspace:../../../../../../tools/builder',
      '@types/node': '^22.0.0',
      typescript: '^5.7.3',
      vitest: '^3.2.4',
      eslint: '^9.18.0',
      ...pkg.devDependencies,
    },
  }

  writeFileSync(
    join(pkgDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  )

  // 创建 tsconfig.json
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

  // 创建 ldesign.config.ts
  const ldesignConfig = `import { defineConfig } from '@ldesign/builder'

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
      name: '${pkg.fullName.split('/')[1].split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: ${JSON.stringify(getExternal(pkg, isCore), null, 2).split('\n').join('\n  ')},
})
`

  writeFileSync(join(pkgDir, 'ldesign.config.ts'), ldesignConfig)

  // 创建 src/index.ts
  const indexTs = `/**
 * ${pkg.fullName}
 * 
 * ${pkg.description}
 */

${pkg.modules.map(module => `export * from './${module}'`).join('\n')}
export { version } from './version'
`

  writeFileSync(join(srcDir, 'index.ts'), indexTs)

  // 创建 src/version.ts
  const versionTs = `export const version = '0.1.0'
`
  writeFileSync(join(srcDir, 'version.ts'), versionTs)

  // 创建每个模块的 index.ts
  pkg.modules.forEach(module => {
    const moduleIndexTs = `/**
 * ${module} module
 */

// TODO: 实现 ${module} 模块功能
`
    writeFileSync(join(srcDir, module, 'index.ts'), moduleIndexTs)
  })

  // 创建 README.md
  const readme = `# ${pkg.fullName}

> ${pkg.description}

## 安装

\`\`\`bash
pnpm add ${pkg.fullName}
\`\`\`

## 使用

\`\`\`typescript
import {} from '${pkg.fullName}'

// TODO: 添加使用示例
\`\`\`

## API

${pkg.modules.map(m => `- \`${m}\` - ${m} 模块`).join('\n')}

## License

MIT © ldesign
`

  writeFileSync(join(pkgDir, 'README.md'), readme)

  console.log(`✅ ${pkg.fullName} 创建完成\n`)
}

function generateExports(modules) {
  const exports = {
    '.': {
      types: './es/index.d.ts',
      import: './es/index.js',
      require: './lib/index.cjs',
    },
  }

  modules.forEach(module => {
    exports[`./${module}`] = {
      types: `./es/${module}/index.d.ts`,
      import: `./es/${module}/index.js`,
      require: `./lib/${module}/index.cjs`,
    }
    exports[`./${module}/*`] = {
      types: `./es/${module}/*.d.ts`,
      import: `./es/${module}/*.js`,
      require: `./lib/${module}/*.cjs`,
    }
  })

  return exports
}

function getExternal(pkg, isCore) {
  const external = [/^@ldesign\//]

  if (!isCore) {
    external.push('@ldesign/http-core')
  }

  if (pkg.peerDependencies) {
    Object.keys(pkg.peerDependencies).forEach(dep => {
      if (dep !== '@ldesign/http-core') {
        external.push(dep)
      }
    })
  }

  if (isCore) {
    external.push('axios', 'alova')
  }

  return external
}

// 创建核心包
createPackage(corePackage, true)

// 创建框架适配器包
frameworkPackages.forEach(pkg => createPackage(pkg))

console.log('🎉 所有包创建完成!')
console.log('\n📝 下一步:')
console.log('  1. 实现各包的核心功能')
console.log('  2. 创建示例项目')
console.log('  3. 运行 node scripts/build-all.js 构建所有包')

