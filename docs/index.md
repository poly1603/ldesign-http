---
layout: home

hero:
  name: "@ldesign/http"
  text: 功能强大的跨框架 HTTP 请求库
  tagline: 企业级 HTTP 客户端，支持多适配器、拦截器、缓存、重试等高级功能
  image:
    src: /logo.svg
    alt: ldesign HTTP
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/basic
    - theme: alt
      text: GitHub
      link: https://github.com/ldesign/ldesign

features:
  - icon: 🎯
    title: 多适配器支持
    details: 支持 Fetch、Axios、Alova 等多种适配器，自动选择最佳适配器，满足不同场景需求
  
  - icon: 💻
    title: TypeScript First
    details: 完整的类型定义和泛型支持，提供卓越的开发体验和类型安全保障
  
  - icon: 🔧
    title: 强大拦截器
    details: 完整的请求/响应拦截器链，支持异步处理，轻松实现认证、日志、错误处理等功能
  
  - icon: 💾
    title: 智能缓存系统
    details: 高级缓存管理，支持标签失效、依赖管理、LRU策略，显著提升应用性能
  
  - icon: 🔄
    title: 自动重试机制
    details: 智能重试策略，支持指数退避和自定义条件，确保请求的可靠性
  
  - icon: 🛡️
    title: 错误恢复
    details: 内置错误恢复策略，自动处理网络异常，提供优雅的降级方案
  
  - icon: ⚡
    title: 并发控制
    details: 内置并发限制、请求去重和队列管理，优化资源使用，提升应用性能
  
  - icon: 🌟
    title: Vue 3 深度集成
    details: 专为 Vue 3 设计的 Composition API，提供丰富的组合式函数和组件
  
  - icon: 📊
    title: 性能监控
    details: 内置统计分析和性能监控，实时了解请求状态，快速定位问题
  
  - icon: 🎭
    title: 请求取消
    details: 支持请求取消和超时控制，避免无效请求浪费资源
  
  - icon: 📁
    title: 文件操作
    details: 完善的文件上传下载功能，支持进度跟踪，提供流畅的用户体验
  
  - icon: 🧪
    title: 测试友好
    details: 372+ 测试用例，51.1% 代码覆盖率，确保库的稳定性和可靠性
---

## 快速开始

### 安装

::: code-group

```bash [pnpm]
# 核心包（框架无关）
pnpm add @ldesign/http-core

# Vue 3 适配器
pnpm add @ldesign/http-vue
```

```bash [npm]
# 核心包（框架无关）
npm install @ldesign/http-core

# Vue 3 适配器
npm install @ldesign/http-vue
```

```bash [yarn]
# 核心包（框架无关）
yarn add @ldesign/http-core

# Vue 3 适配器
yarn add @ldesign/http-vue
```

:::

### 基础用法

```typescript
import { createHttpClient } from '@ldesign/http-core'

// 创建 HTTP 客户端
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  adapter: 'fetch'
})

// 发送请求
const response = await client.get('/users')
console.log(response.data)
```

### Vue 3 集成

```typescript
import { useHttp } from '@ldesign/http-vue'

// 在 Vue 组件中
const { data, loading, error, execute } = useHttp('/api/users', {
  immediate: true
})
```

## 为什么选择 @ldesign/http？

### 🚀 企业级功能

提供生产环境所需的所有功能：拦截器、缓存、重试、错误恢复、并发控制等，让你专注于业务逻辑。

### 🎯 框架无关

核心包完全框架无关，可在任何 JavaScript/TypeScript 项目中使用。提供针对 Vue 3 的深度集成。

### 💪 类型安全

完整的 TypeScript 支持，丰富的类型定义和类型工具，让你的代码更安全、更易维护。

### ⚡ 高性能

智能缓存、请求去重、并发控制等优化策略，显著提升应用性能，减少服务器负载。

### 🧩 灵活扩展

模块化设计，支持自定义适配器、拦截器、缓存策略等，满足各种复杂场景需求。

## 谁在使用？

@ldesign/http 被用于各种规模的项目中，从个人项目到企业级应用。

## 社区支持

- 📚 [完整文档](https://ldesign.github.io/http)
- 🐙 [GitHub 仓库](https://github.com/ldesign/ldesign)
- 🐛 [问题反馈](https://github.com/ldesign/ldesign/issues)
- 💬 [讨论区](https://github.com/ldesign/ldesign/discussions)

## 许可证

[MIT License](https://github.com/ldesign/ldesign/blob/main/LICENSE)