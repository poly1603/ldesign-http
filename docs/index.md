---
layout: home

hero:
  name: "@ldesign/http"
  text: "现代化HTTP请求库"
  tagline: 支持多种适配器、Vue3深度集成、TypeScript优先
  image:
    src: /logo.svg
    alt: LDesign HTTP
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/
    - theme: alt
      text: GitHub
      link: https://github.com/your-org/ldesign

features:
  - icon: 🎯
    title: 多适配器支持
    details: 支持原生fetch、axios、alova三种适配器，可运行时动态切换
  - icon: ⚡
    title: Vue3深度集成
    details: 提供组合式函数和插件，完美融入Vue3生态系统
  - icon: 🔧
    title: TypeScript优先
    details: 完整的TypeScript支持，提供优秀的开发体验和类型安全
  - icon: 💾
    title: 智能缓存
    details: 支持内存、localStorage、sessionStorage多种缓存策略
  - icon: 🔄
    title: 智能重试
    details: 支持固定延迟、指数退避、线性增长等多种重试策略
  - icon: 🛡️
    title: 强大拦截器
    details: 支持请求/响应拦截器，轻松处理认证、日志、错误等
  - icon: 📊
    title: 进度监控
    details: 支持上传/下载进度监控，提供实时反馈
  - icon: 🚫
    title: 请求取消
    details: 支持请求取消和超时控制，避免无效请求
  - icon: 🎨
    title: 插件系统
    details: 可扩展的插件架构，支持自定义功能扩展
---

## 快速体验

### 安装

::: code-group

```bash [pnpm]
pnpm add @ldesign/http
```

```bash [npm]
npm install @ldesign/http
```

```bash [yarn]
yarn add @ldesign/http
```

:::

### 基础使用

```typescript
import { createHttpClient } from '@ldesign/http'

// 创建客户端
const http = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000
})

// 发送请求
const response = await http.get('/users')
console.log(response.data)
```

### Vue3集成

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http'

const app = createApp(App)
app.use(createHttpPlugin({
  baseURL: 'https://api.example.com'
}))
```

```vue
<!-- 组件中使用 -->
<script setup>
import { useGet } from '@ldesign/http'

const { data, loading, error } = useGet('/users')
</script>

<template>
  <div v-if="loading">
    加载中...
  </div>
  <div v-else-if="error">
    错误: {{ error.message }}
  </div>
  <div v-else>
    <h1>用户列表</h1>
    <ul>
      <li v-for="user in data" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
```

## 为什么选择 @ldesign/http？

### 🚀 现代化设计

采用最新的前端技术栈，支持ES模块、TypeScript、Vue3等现代化特性。

### 🔧 灵活配置

支持多种适配器，可以根据项目需求选择最适合的HTTP库。

### 📦 开箱即用

提供合理的默认配置和丰富的插件，让你专注于业务逻辑。

### 🎯 类型安全

完整的TypeScript类型定义，提供优秀的开发体验。

### 🌟 生态友好

深度集成Vue3，同时保持框架无关的核心设计。

## 社区

- [GitHub Issues](https://github.com/your-org/ldesign/issues) - 报告问题和功能请求
- [GitHub Discussions](https://github.com/your-org/ldesign/discussions) - 社区讨论
- [贡献指南](/contributing) - 了解如何贡献代码

## 许可证

[MIT License](https://github.com/your-org/ldesign/blob/main/LICENSE) © 2024 LDesign Team
