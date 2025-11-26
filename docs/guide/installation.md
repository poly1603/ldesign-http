# 安装

本指南将帮助你在项目中安装和配置 @ldesign/http。

## 包管理器

### pnpm（推荐）

```bash
# 核心包
pnpm add @ldesign/http-core

# Vue 3 适配器
pnpm add @ldesign/http-vue
```

### npm

```bash
# 核心包
npm install @ldesign/http-core

# Vue 3 适配器
npm install @ldesign/http-vue
```

### yarn

```bash
# 核心包
yarn add @ldesign/http-core

# Vue 3 适配器
yarn add @ldesign/http-vue
```

## CDN

你也可以通过 CDN 直接引入：

```html
<!-- 核心包 -->
<script src="https://unpkg.com/@ldesign/http-core"></script>

<!-- Vue 3 适配器 -->
<script src="https://unpkg.com/@ldesign/http-vue"></script>
```

使用 CDN 时，库会暴露在全局变量中：

```html
<script>
  const { createHttpClient } = window.LdesignHttpCore
  const client = createHttpClient({ baseURL: '/api' })
</script>
```

## 包说明

### @ldesign/http-core

核心包，完全框架无关，可在任何 JavaScript/TypeScript 项目中使用。

**包含功能：**
- HTTP 客户端
- 适配器系统（Fetch、Axios、Alova）
- 拦截器
- 缓存管理
- 重试机制
- 错误处理
- 并发控制
- 工具函数

**适用场景：**
- 纯 JavaScript/TypeScript 项目
- Node.js 项目
- 任何框架（React、Vue、Svelte 等）

### @ldesign/http-vue

Vue 3 专用适配器，提供深度集成。

**包含功能：**
- Composition API（useHttp、useRequest、useResource 等）
- Vue 组件
- Vue 指令
- Vue 插件

**依赖：**
- `@ldesign/http-core`
- `vue` ^3.4.38

**适用场景：**
- Vue 3 项目
- Nuxt 3 项目

## 环境要求

### Node.js

- Node.js >= 18.0.0
- pnpm >= 8.0.0（如果使用 pnpm）

### 浏览器

现代浏览器支持：

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

如需支持旧版浏览器，请使用相应的 polyfills。

### TypeScript

推荐使用 TypeScript >= 5.0

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

## 依赖安装

### 可选依赖

根据你选择的适配器，可能需要安装额外的依赖：

#### Axios 适配器

```bash
pnpm add axios
```

#### Alova 适配器

```bash
pnpm add alova
```

::: tip
如果不安装这些依赖，库会自动回退到使用 Fetch API。
:::

## 构建工具配置

### Vite

无需额外配置，Vite 原生支持 ESM。

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  // 你的配置
})
```

### Webpack

确保配置了 ESM 支持：

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
}
```

### Rollup

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

export default {
  plugins: [
    resolve(),
    typescript()
  ]
}
```

## 验证安装

创建一个简单的测试文件验证安装：

```typescript
// test.ts
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com'
})

async function test() {
  try {
    const response = await client.get('/users/1')
    console.log('安装成功！', response.data)
  } catch (error) {
    console.error('安装失败：', error)
  }
}

test()
```

运行测试：

```bash
# 如果使用 ts-node
npx ts-node test.ts

# 如果使用 tsx
npx tsx test.ts
```

## 框架集成

### Vue 3

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http-vue'
import App from './App.vue'

const app = createApp(App)

app.use(createHttpPlugin({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
}))

app.mount('#app')
```

### Nuxt 3

创建插件文件：

```typescript
// plugins/http.ts
import { createHttpPlugin } from '@ldesign/http-vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  nuxtApp.vueApp.use(createHttpPlugin({
    baseURL: config.public.apiBase,
    timeout: 10000
  }))
})
```

配置运行时变量：

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || '/api'
    }
  }
})
```

### React（规划中）

```typescript
// App.tsx
import { HttpProvider } from '@ldesign/http-react'

function App() {
  return (
    <HttpProvider
      baseURL="/api"
      timeout={10000}
    >
      {/* 你的应用 */}
    </HttpProvider>
  )
}
```

## 开发环境设置

### 克隆仓库（贡献者）

如果你想为项目贡献代码：

```bash
# 克隆仓库
git clone https://github.com/ldesign/ldesign.git
cd ldesign/packages/http

# 安装依赖
pnpm install

# 构建
pnpm build

# 运行测试
pnpm test

# 启动文档
pnpm docs:dev
```

### 本地链接

在本地开发时链接包：

```bash
# 在 @ldesign/http-core 目录
pnpm link --global

# 在你的项目目录
pnpm link --global @ldesign/http-core
```

## 故障排除

### 模块未找到

如果遇到模块未找到错误：

```bash
# 清理缓存
rm -rf node_modules
rm pnpm-lock.yaml

# 重新安装
pnpm install
```

### 类型错误

确保安装了正确版本的 TypeScript：

```bash
pnpm add -D typescript@^5.0.0
```

### 构建错误

检查构建工具配置是否正确支持 ESM 和 TypeScript。

### 依赖冲突

使用 pnpm 的 overrides 解决依赖冲突：

```json
{
  "pnpm": {
    "overrides": {
      "package-name": "^1.0.0"
    }
  }
}
```

## 下一步

- [快速开始](/guide/getting-started) - 开始使用
- [HTTP 客户端](/guide/http-client) - 了解核心功能
- [Vue 集成](/packages/vue) - Vue 3 专属功能

## 获取帮助

遇到问题？

- 📖 查看[文档](/guide/introduction)
- 💬 加入[讨论区](https://github.com/ldesign/ldesign/discussions)
- 🐛 提交[问题](https://github.com/ldesign/ldesign/issues)