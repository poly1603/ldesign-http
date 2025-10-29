/**
 * 批量创建所有包的示例项目
 */

import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

console.log('🚀 开始创建所有示例项目...\n')

const examples = [
  {
    name: 'core',
    title: 'HTTP Core',
    framework: 'vanilla',
    description: 'HTTP 核心功能演示',
  },
  {
    name: 'vue',
    title: 'HTTP Vue',
    framework: 'vue',
    description: 'Vue 3 HTTP 集成演示',
  },
  {
    name: 'react',
    title: 'HTTP React',
    framework: 'react',
    description: 'React HTTP 集成演示',
  },
  {
    name: 'solid',
    title: 'HTTP Solid',
    framework: 'solid',
    description: 'Solid HTTP 集成演示',
  },
  {
    name: 'svelte',
    title: 'HTTP Svelte',
    framework: 'svelte',
    description: 'Svelte HTTP 集成演示',
  },
]

function createExample(example) {
  const exampleDir = join('packages', example.name, 'examples', 'vite-demo')
  const srcDir = join(exampleDir, 'src')

  console.log(`📦 创建示例: ${example.title}`)

  // 创建目录
  mkdirSync(srcDir, { recursive: true })
  mkdirSync(join(exampleDir, 'public'), { recursive: true })

  // package.json
  const dependencies = {
    [`@ldesign/http-${example.name}`]: 'workspace:*',
    '@ldesign/http-core': 'workspace:*',
  }

  if (example.framework === 'vue') {
    dependencies.vue = '^3.5.18'
  }
  else if (example.framework === 'react') {
    dependencies.react = '^18.2.0'
    dependencies['react-dom'] = '^18.2.0'
  }
  else if (example.framework === 'solid') {
    dependencies['solid-js'] = '^1.8.0'
  }
  else if (example.framework === 'svelte') {
    dependencies.svelte = '^4.2.0'
  }

  const devDependencies = {
    '@ldesign/launcher': 'workspace:*',
    typescript: '^5.7.3',
    vite: '^5.0.12',
  }

  if (example.framework === 'vue') {
    devDependencies['@vitejs/plugin-vue'] = '^5.0.3'
  }
  else if (example.framework === 'react') {
    devDependencies['@vitejs/plugin-react'] = '^4.2.1'
    devDependencies['@types/react'] = '^18.2.21'
    devDependencies['@types/react-dom'] = '^18.2.7'
  }
  else if (example.framework === 'solid') {
    devDependencies['vite-plugin-solid'] = '^2.8.0'
  }
  else if (example.framework === 'svelte') {
    devDependencies['@sveltejs/vite-plugin-svelte'] = '^3.0.0'
  }

  const packageJson = {
    name: `@ldesign/http-${example.name}-example`,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies,
    devDependencies,
  }

  writeFileSync(
    join(exampleDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  )

  // vite.config.ts
  let viteConfig = ''
  if (example.framework === 'vue') {
    viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
  },
})
`
  }
  else if (example.framework === 'react') {
    viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
})
`
  }
  else if (example.framework === 'solid') {
    viteConfig = `import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 3002,
  },
})
`
  }
  else if (example.framework === 'svelte') {
    viteConfig = `import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3003,
  },
})
`
  }
  else {
    viteConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
  },
})
`
  }

  writeFileSync(join(exampleDir, 'vite.config.ts'), viteConfig)

  // tsconfig.json
  const tsconfig = {
    extends: '../../tsconfig.json',
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
      jsx: example.framework === 'react' ? 'react-jsx' : (example.framework === 'solid' ? 'preserve' : 'preserve'),
    },
    include: ['src/**/*'],
  }

  writeFileSync(join(exampleDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))

  // index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${example.title} - Example</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${example.framework === 'svelte' ? 'ts' : (example.framework === 'react' || example.framework === 'solid' ? 'tsx' : 'ts')}"></script>
  </body>
</html>
`

  writeFileSync(join(exampleDir, 'index.html'), indexHtml)

  // 创建源文件
  createSourceFiles(srcDir, example)

  // style.css
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

#app {
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
  background: white;
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
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

button:hover {
  background: #35a372;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading {
  color: #999;
}

.error {
  color: #f56c6c;
}

.data {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}
`

  writeFileSync(join(srcDir, 'style.css'), styleCss)

  // README.md
  const readme = `# ${example.title} - Example

${example.description}

## 开发

\`\`\`bash
pnpm install
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

  console.log(`✅ ${example.title} 示例创建完成\n`)
}

function createSourceFiles(srcDir, example) {
  if (example.framework === 'vue') {
    // main.ts
    const mainTs = `import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
`
    writeFileSync(join(srcDir, 'main.ts'), mainTs)

    // App.vue
    const appVue = `<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello HTTP Vue!')
const loading = ref(false)
const data = ref<any>(null)
const error = ref<string | null>(null)

async function fetchData() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
    data.value = await response.json()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1>{{ message }}</h1>
    <p>Vue 3 HTTP 集成演示</p>
    
    <div class="demo-section">
      <h2>演示区域</h2>
      <button @click="fetchData" :disabled="loading">
        {{ loading ? '加载中...' : '获取数据' }}
      </button>
      
      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="error" class="error">错误: {{ error }}</div>
      <div v-if="data" class="data">
        <pre>{{ JSON.stringify(data, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>
`
    writeFileSync(join(srcDir, 'App.vue'), appVue)
  }
  else if (example.framework === 'react') {
    // main.tsx
    const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`
    writeFileSync(join(srcDir, 'main.tsx'), mainTsx)

    // App.tsx
    const appTsx = `import React, { useState } from 'react'

function App() {
  const [message] = useState('Hello HTTP React!')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
      const json = await response.json()
      setData(json)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>{message}</h1>
      <p>React HTTP 集成演示</p>
      
      <div className="demo-section">
        <h2>演示区域</h2>
        <button onClick={fetchData} disabled={loading}>
          {loading ? '加载中...' : '获取数据'}
        </button>
        
        {loading && <div className="loading">加载中...</div>}
        {error && <div className="error">错误: {error}</div>}
        {data && (
          <div className="data">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
`
    writeFileSync(join(srcDir, 'App.tsx'), appTsx)
  }
  else if (example.framework === 'solid') {
    // main.tsx
    const mainTsx = `import { render } from 'solid-js/web'
import App from './App'
import './style.css'

render(() => <App />, document.getElementById('app')!)
`
    writeFileSync(join(srcDir, 'main.tsx'), mainTsx)

    // App.tsx
    const appTsx = `import { createSignal } from 'solid-js'

function App() {
  const [message] = createSignal('Hello HTTP Solid!')
  const [loading, setLoading] = createSignal(false)
  const [data, setData] = createSignal<any>(null)
  const [error, setError] = createSignal<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
      const json = await response.json()
      setData(json)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>{message()}</h1>
      <p>Solid HTTP 集成演示</p>
      
      <div class="demo-section">
        <h2>演示区域</h2>
        <button onClick={fetchData} disabled={loading()}>
          {loading() ? '加载中...' : '获取数据'}
        </button>
        
        {loading() && <div class="loading">加载中...</div>}
        {error() && <div class="error">错误: {error()}</div>}
        {data() && (
          <div class="data">
            <pre>{JSON.stringify(data(), null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
`
    writeFileSync(join(srcDir, 'App.tsx'), appTsx)
  }
  else if (example.framework === 'svelte') {
    // main.ts
    const mainTs = `import App from './App.svelte'
import './style.css'

const app = new App({
  target: document.getElementById('app')!,
})

export default app
`
    writeFileSync(join(srcDir, 'main.ts'), mainTs)

    // App.svelte
    const appSvelte = `<script lang="ts">
  let message = 'Hello HTTP Svelte!'
  let loading = false
  let data: any = null
  let error: string | null = null

  async function fetchData() {
    loading = true
    error = null
    
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
      data = await response.json()
    } catch (e) {
      error = (e as Error).message
    } finally {
      loading = false
    }
  }
</script>

<div>
  <h1>{message}</h1>
  <p>Svelte HTTP 集成演示</p>
  
  <div class="demo-section">
    <h2>演示区域</h2>
    <button on:click={fetchData} disabled={loading}>
      {loading ? '加载中...' : '获取数据'}
    </button>
    
    {#if loading}
      <div class="loading">加载中...</div>
    {/if}
    
    {#if error}
      <div class="error">错误: {error}</div>
    {/if}
    
    {#if data}
      <div class="data">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    {/if}
  </div>
</div>
`
    writeFileSync(join(srcDir, 'App.svelte'), appSvelte)
  }
  else {
    // Vanilla JS/TS
    // main.ts
    const mainTs = `import './style.css'

const app = document.getElementById('app')!

app.innerHTML = \`
  <div>
    <h1>Hello HTTP Core!</h1>
    <p>HTTP 核心功能演示</p>
    
    <div class="demo-section">
      <h2>演示区域</h2>
      <button id="fetch-btn">获取数据</button>
      <div id="output"></div>
    </div>
  </div>
\`

const btn = document.getElementById('fetch-btn')!
const output = document.getElementById('output')!

btn.addEventListener('click', async () => {
  btn.setAttribute('disabled', 'true')
  output.innerHTML = '<div class="loading">加载中...</div>'
  
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
    const data = await response.json()
    output.innerHTML = \`
      <div class="data">
        <pre>\${JSON.stringify(data, null, 2)}</pre>
      </div>
    \`
  } catch (e) {
    output.innerHTML = \`<div class="error">错误: \${(e as Error).message}</div>\`
  } finally {
    btn.removeAttribute('disabled')
  }
})
`
    writeFileSync(join(srcDir, 'main.ts'), mainTs)
  }
}

// 创建所有示例
examples.forEach(createExample)

console.log('🎉 所有示例项目创建完成!')
console.log('\n💡 提示: 进入 packages/<name>/examples/vite-demo 目录运行 pnpm dev 启动示例')

