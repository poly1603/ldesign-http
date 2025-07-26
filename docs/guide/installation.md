# 安装

本页面详细介绍如何在不同环境中安装和配置 @ldesign/http。

## 📦 包管理器安装

### pnpm (推荐)

```bash
pnpm add @ldesign/http
```

### npm

```bash
npm install @ldesign/http
```

### yarn

```bash
yarn add @ldesign/http
```

## 🎯 环境要求

### Node.js 版本

- **Node.js**: >= 16.0.0
- **npm**: >= 7.0.0
- **pnpm**: >= 7.0.0 (推荐)
- **yarn**: >= 1.22.0

### 浏览器支持

- **Chrome**: >= 63
- **Firefox**: >= 57
- **Safari**: >= 11
- **Edge**: >= 79

## 🔧 TypeScript 支持

@ldesign/http 使用 TypeScript 编写，内置完整的类型定义：

```bash
# 无需额外安装类型定义
pnpm add @ldesign/http
```

如果你使用 TypeScript，确保 `tsconfig.json` 配置正确：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 🌐 CDN 安装

### 通过 unpkg

```html
<!-- 开发版本 -->
<script src="https://unpkg.com/@ldesign/http@latest/dist/index.umd.js"></script>

<!-- 生产版本 (压缩) -->
<script src="https://unpkg.com/@ldesign/http@latest/dist/index.umd.min.js"></script>
```

### 通过 jsDelivr

```html
<!-- 开发版本 -->
<script src="https://cdn.jsdelivr.net/npm/@ldesign/http@latest/dist/index.umd.js"></script>

<!-- 生产版本 (压缩) -->
<script src="https://cdn.jsdelivr.net/npm/@ldesign/http@latest/dist/index.umd.min.js"></script>
```

### 使用示例

```html
<!DOCTYPE html>
<html>
<head>
  <title>@ldesign/http CDN 示例</title>
</head>
<body>
  <script src="https://unpkg.com/@ldesign/http@latest/dist/index.umd.js"></script>
  <script>
    const { createHttpClient } = LDesignHttp
    
    const client = createHttpClient({
      baseURL: 'https://jsonplaceholder.typicode.com'
    })
    
    client.get('/users').then(response => {
      console.log('用户列表:', response.data)
    })
  </script>
</body>
</html>
```

## 🚀 框架集成

### Vue 3

```bash
# 安装 Vue 3 和 @ldesign/http
pnpm add vue@^3.0.0 @ldesign/http
```

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http'
import App from './App.vue'

const app = createApp(App)

app.use(createHttpPlugin({
  baseURL: 'https://api.example.com'
}))

app.mount('#app')
```

### Vue 2 (实验性支持)

```bash
# Vue 2 需要额外的兼容层
pnpm add vue@^2.7.0 @vue/composition-api @ldesign/http
```

### React (计划中)

React 支持正在开发中，敬请期待。

### Angular (计划中)

Angular 支持正在开发中，敬请期待。

## 🔌 适配器依赖

@ldesign/http 支持多种适配器，根据需要安装对应的依赖：

### Fetch 适配器 (默认)

无需额外依赖，使用浏览器原生 fetch API。

### Axios 适配器

```bash
pnpm add axios
```

### Alova 适配器

```bash
pnpm add alova
```

## 🛠️ 开发环境设置

### 克隆仓库

```bash
git clone https://github.com/your-org/ldesign.git
cd ldesign/packages/http
```

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 测试

```bash
pnpm test
```

## 🔍 验证安装

创建一个简单的测试文件来验证安装：

```typescript
// test-installation.ts
import { createHttpClient } from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com'
})

async function test() {
  try {
    const response = await client.get('/users/1')
    console.log('✅ 安装成功!', response.data.name)
  } catch (error) {
    console.error('❌ 安装失败:', error)
  }
}

test()
```

运行测试：

```bash
npx tsx test-installation.ts
# 或
node test-installation.js
```

## 🚨 常见问题

### 1. TypeScript 类型错误

如果遇到类型错误，确保：

- TypeScript 版本 >= 4.5
- 正确配置 `tsconfig.json`
- 重启 TypeScript 服务

### 2. 模块解析错误

```bash
# 清除缓存
rm -rf node_modules package-lock.json
npm install

# 或使用 pnpm
pnpm store prune
pnpm install
```

### 3. 浏览器兼容性

对于旧版浏览器，可能需要 polyfill：

```bash
pnpm add core-js
```

```typescript
// 在入口文件顶部
import 'core-js/stable'
import 'regenerator-runtime/runtime'
```

### 4. Vue 2 兼容性

Vue 2 需要额外配置：

```typescript
// main.js (Vue 2)
import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'

Vue.use(VueCompositionAPI)
```

## 📚 下一步

安装完成后，建议：

1. 阅读 [快速开始](/guide/getting-started) 指南
2. 查看 [基本用法](/guide/basic-usage) 示例
3. 探索 [Vue 集成](/vue/) 功能
4. 尝试 [在线演示](/examples/live-demo)

## 🆘 获取帮助

如果遇到安装问题：

- [GitHub Issues](https://github.com/your-org/ldesign/issues)
- [GitHub Discussions](https://github.com/your-org/ldesign/discussions)
- [贡献指南](/contributing)
