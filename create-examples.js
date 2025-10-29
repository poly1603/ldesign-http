/**
 * 批量创建演示示例的脚本
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const packages = [
  {
    name: 'http-core',
    title: 'HTTP Core',
    description: '核心客户端和类型定义演示',
  },
  {
    name: 'http-adapters',
    title: 'HTTP Adapters',
    description: '多种适配器演示（Fetch, Axios, Alova）',
  },
  {
    name: 'http-interceptors',
    title: 'HTTP Interceptors',
    description: '拦截器管理演示',
  },
  {
    name: 'http-features',
    title: 'HTTP Features',
    description: '高级特性演示（缓存、重试、熔断等）',
  },
  {
    name: 'http-utils',
    title: 'HTTP Utils',
    description: '工具函数演示',
  },
  {
    name: 'http-vue',
    title: 'HTTP Vue',
    description: 'Vue 3 集成演示',
  },
  {
    name: 'http-devtools',
    title: 'HTTP DevTools',
    description: '开发者工具演示',
  },
  {
    name: 'http-presets',
    title: 'HTTP Presets',
    description: '预设配置演示',
  },
]

function createExample(pkg) {
  const exampleDir = join('packages', pkg.name, 'example')
  const srcDir = join(exampleDir, 'src')

  // 创建目录
  mkdirSync(srcDir, { recursive: true })
  mkdirSync(join(exampleDir, 'public'), { recursive: true })

  // package.json
  const packageJson = {
    name: `@ldesign/${pkg.name}-example`,
    version: '0.1.0',
    private: true,
    description: `${pkg.title} example`,
    type: 'module',
    scripts: {
      dev: 'ldesign-launcher dev',
      build: 'ldesign-launcher build',
      preview: 'ldesign-launcher preview',
    },
    dependencies: {
      [`@ldesign/${pkg.name}`]: 'workspace:*',
      '@ldesign/http-core': 'workspace:*',
      vue: '^3.4.15',
    },
    devDependencies: {
      '@ldesign/launcher': 'workspace:*',
      '@vitejs/plugin-vue': '^5.0.3',
      typescript: '^5.7.3',
    },
  }

  writeFileSync(
    join(exampleDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  )

  // launcher.config.ts
  const launcherConfig = `import { defineConfig } from '@ldesign/launcher'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})
`

  writeFileSync(join(exampleDir, 'launcher.config.ts'), launcherConfig)

  // tsconfig.json
  const tsconfig = {
    extends: '../../../../../tsconfig.json',
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      module: 'ESNext',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'preserve',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ['src/**/*.ts', 'src/**/*.d.ts', 'src/**/*.tsx', 'src/**/*.vue'],
  }

  writeFileSync(join(exampleDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))

  // index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pkg.title} - Example</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`

  writeFileSync(join(exampleDir, 'index.html'), indexHtml)

  // src/main.ts
  const mainTs = `import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
`

  writeFileSync(join(srcDir, 'main.ts'), mainTs)

  // src/App.vue
  const appVue = `<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello ${pkg.title}!')
</script>

<template>
  <div class="app">
    <h1>{{ message }}</h1>
    <p>${pkg.description}</p>
    
    <div class="demo-section">
      <h2>演示区域</h2>
      <!-- TODO: 添加具体的演示内容 -->
      <p>功能演示即将推出...</p>
    </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #42b983;
  margin-bottom: 1rem;
}

.demo-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}
</style>
`

  writeFileSync(join(srcDir, 'App.vue'), appVue)

  // src/style.css
  const styleCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  background: #42b983;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background: #35a372;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
`

  writeFileSync(join(srcDir, 'style.css'), styleCss)

  // README.md
  const readme = `# ${pkg.title} - Example

${pkg.description}

## 开发

\`\`\`bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
\`\`\`

## 构建

\`\`\`bash
pnpm build
\`\`\`

## 预览

\`\`\`bash
pnpm preview
\`\`\`
`

  writeFileSync(join(exampleDir, 'README.md'), readme)

  console.log(`✅ Created example for: @ldesign/${pkg.name}`)
}

// 创建所有示例
packages.forEach(createExample)

console.log('\\n🎉 All examples created successfully!')
console.log('\\n💡 提示: 进入 example 目录运行 pnpm dev 启动演示')


