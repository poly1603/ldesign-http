/**
 * 批量创建框架适配包的脚本
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const frameworks = [
  { name: 'svelte', displayName: 'Svelte', peerDeps: ['svelte'] },
  { name: 'solid', displayName: 'Solid', peerDeps: ['solid-js'] },
  { name: 'preact', displayName: 'Preact', peerDeps: ['preact'] },
  { name: 'alpinejs', displayName: 'Alpine.js', peerDeps: ['alpinejs'] },
  { name: 'angular', displayName: 'Angular', peerDeps: ['@angular/core'] },
  { name: 'lit', displayName: 'Lit', peerDeps: ['lit'] },
  { name: 'qwik', displayName: 'Qwik', peerDeps: ['@builder.io/qwik'] },
  { name: 'astro', displayName: 'Astro', peerDeps: ['astro'] },
]

const metaFrameworks = [
  { name: 'nextjs', displayName: 'Next.js', basedOn: 'react', peerDeps: ['next', 'react'] },
  { name: 'nuxtjs', displayName: 'Nuxt', basedOn: 'vue', peerDeps: ['nuxt', 'vue'] },
  { name: 'remix', displayName: 'Remix', basedOn: 'react', peerDeps: ['@remix-run/react', 'react'] },
  { name: 'sveltekit', displayName: 'SvelteKit', basedOn: 'svelte', peerDeps: ['@sveltejs/kit', 'svelte'] },
]

function createPackageJson(framework: any) {
  return {
    name: `@ldesign/http-${framework.name}`,
    version: '0.1.0',
    description: `${framework.displayName} HTTP请求库`,
    keywords: [framework.name, 'http', 'request', 'typescript'],
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
    files: ['README.md', 'LICENSE', 'package.json', 'es', 'lib'],
    scripts: {
      build: 'ldesign-builder build -f esm,cjs,dts',
      dev: 'ldesign-builder build -f esm,cjs,dts --watch',
      clean: 'rimraf es lib',
    },
    dependencies: {
      '@ldesign/http-core': 'workspace:*',
    },
    peerDependencies: Object.fromEntries(
      framework.peerDeps.map((dep: string) => [dep, '*']),
    ),
    devDependencies: {
      '@ldesign/builder': 'workspace:*',
      typescript: '^5.7.3',
    },
    engines: {
      node: '>=18.0.0',
      pnpm: '>=8.0.0',
    },
  }
}

function createBuilderConfig(framework: any) {
  const external = ['@ldesign/http-core', ...framework.peerDeps]
  return `import { defineConfig } from '@ldesign/builder'

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
  external: ${JSON.stringify(external)},
})
`
}

function createTsConfig() {
  return {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      lib: ['ES2020', 'DOM'],
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowJs: false,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: './es',
      rootDir: './src',
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'es', 'lib', 'dist'],
  }
}

function createIndexTs(framework: any) {
  return `/**
 * @ldesign/http-${framework.name}
 * ${framework.displayName} HTTP请求库
 */

// 重新导出核心库
export * from '@ldesign/http-core'

// TODO: 添加${framework.displayName}特定的功能
// export * from './use${framework.displayName}'
`
}

function createReadme(framework: any) {
  return `# @ldesign/http-${framework.name}

${framework.displayName} HTTP请求库

## 安装

\`\`\`bash
pnpm add @ldesign/http-${framework.name}
\`\`\`

## 使用

\`\`\`typescript
import { createHttpClient } from '@ldesign/http-${framework.name}'

const http = createHttpClient({
  baseURL: 'https://api.example.com',
})

const response = await http.get('/users')
console.log(response.data)
\`\`\`

## License

MIT
`
}

function createFrameworkPackage(framework: any) {
  const packageDir = path.join(__dirname, '..', 'packages', framework.name)

  // 创建目录
  fs.mkdirSync(packageDir, { recursive: true })
  fs.mkdirSync(path.join(packageDir, 'src'), { recursive: true })

  // 创建文件
  fs.writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify(createPackageJson(framework), null, 2),
  )

  fs.writeFileSync(
    path.join(packageDir, 'builder.config.ts'),
    createBuilderConfig(framework),
  )

  fs.writeFileSync(
    path.join(packageDir, 'tsconfig.json'),
    JSON.stringify(createTsConfig(), null, 2),
  )

  fs.writeFileSync(
    path.join(packageDir, 'src', 'index.ts'),
    createIndexTs(framework),
  )

  fs.writeFileSync(
    path.join(packageDir, 'README.md'),
    createReadme(framework),
  )

  console.log(`✓ Created package: @ldesign/http-${framework.name}`)
}

// 创建所有框架包
console.log('Creating framework packages...\n')

frameworks.forEach(createFrameworkPackage)
metaFrameworks.forEach(createFrameworkPackage)

console.log('\n✓ All framework packages created!')
console.log('\nNext steps:')
console.log('1. Run: pnpm install')
console.log('2. Implement framework-specific features for each package')
console.log('3. Run: pnpm build')
