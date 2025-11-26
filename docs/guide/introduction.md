# 介绍

## 什么是 @ldesign/http？

@ldesign/http 是一个功能强大、类型安全的现代化 HTTP 客户端库，专为构建高性能 Web 应用而设计。它提供了企业级的功能特性，同时保持简单易用的 API。

## 核心特性

### 🎯 多适配器架构

支持多种 HTTP 适配器，可根据环境自动选择最佳方案：

- **Fetch API** - 现代浏览器原生支持
- **Axios** - 功能丰富的 HTTP 库
- **Alova** - 轻量级请求库

### 💻 TypeScript First

完整的 TypeScript 支持，提供：

- 完整的类型定义
- 泛型支持
- 类型推断
- 类型守卫和工具函数

### 🔧 强大的拦截器系统

灵活的拦截器链，支持：

- 请求拦截
- 响应拦截
- 异步处理
- 内置常用拦截器

### 💾 智能缓存管理

高级缓存系统，包含：

- 多种缓存策略（LRU、FIFO、LFU）
- 标签失效
- 依赖管理
- 压缩存储
- 统计分析

### 🔄 自动重试机制

智能重试功能：

- 可配置重试次数
- 指数退避策略
- 自定义重试条件
- 重试统计

### 🛡️ 错误处理和恢复

完善的错误处理：

- 错误分类和分析
- 自动恢复策略
- 用户友好的错误消息
- 错误统计和模式分析

### ⚡ 性能优化

多种性能优化策略：

- 请求去重
- 并发控制
- 请求队列
- 批量处理

### 🌟 框架集成

深度框架集成：

- Vue 3 Composition API
- React Hooks（规划中）
- Solid.js（规划中）

## 为什么选择 @ldesign/http？

### vs Axios

| 特性 | @ldesign/http | Axios |
|------|---------------|-------|
| TypeScript 支持 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 多适配器 | ✅ | ❌ |
| 高级缓存 | ✅ | ❌ |
| 请求去重 | ✅ | ❌ |
| 错误恢复 | ✅ | ❌ |
| Vue 3 集成 | ✅ | ❌ |
| 包大小 | 适中 | 较大 |

### vs Fetch API

| 特性 | @ldesign/http | Fetch |
|------|---------------|-------|
| 拦截器 | ✅ | ❌ |
| 缓存管理 | ✅ | 基础 |
| 重试机制 | ✅ | ❌ |
| 进度跟踪 | ✅ | ❌ |
| 超时控制 | ✅ | 需要手动实现 |
| 取消请求 | ✅ | 需要 AbortController |

### vs Alova

| 特性 | @ldesign/http | Alova |
|------|---------------|-------|
| 适配器选择 | 多种 | Fetch 为主 |
| 缓存策略 | 丰富 | 基础 |
| 错误恢复 | ✅ | ❌ |
| 请求去重 | ✅ | ✅ |
| TypeScript | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 设计理念

### 1. 简单易用

API 设计简洁直观，开箱即用，同时提供丰富的配置选项满足复杂需求。

```typescript
// 简单用法
const client = createHttpClient({ baseURL: '/api' })
const data = await client.get('/users')

// 高级配置
const client = createHttpClient({
  baseURL: '/api',
  cache: { enabled: true, ttl: 5000 },
  retry: { maxAttempts: 3 },
  concurrency: { maxConcurrent: 10 }
})
```

### 2. 类型安全

充分利用 TypeScript 的类型系统，提供完整的类型推断和类型检查。

```typescript
interface User {
  id: number
  name: string
}

// 类型安全的请求
const response = await client.get<User[]>('/users')
// response.data 的类型自动推断为 User[]
```

### 3. 性能优先

通过缓存、去重、并发控制等优化策略，最大化性能。

### 4. 可扩展性

模块化设计，支持自定义适配器、拦截器、缓存策略等。

### 5. 渐进式增强

核心功能独立，按需引入高级特性，避免不必要的包体积增加。

## 适用场景

### ✅ 适合使用的场景

- 需要企业级 HTTP 功能的项目
- 重视类型安全的 TypeScript 项目
- 需要高性能和优化的应用
- Vue 3 项目（提供深度集成）
- 需要灵活配置和扩展的项目

### ⚠️ 可能不适合的场景

- 极简项目（直接使用 Fetch 可能更合适）
- 对包体积要求极其严格的项目
- 不需要高级功能的简单应用

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

需要支持旧版浏览器？请使用合适的 polyfills。

## 下一步

- [快速开始](/guide/getting-started) - 开始使用 @ldesign/http
- [安装指南](/guide/installation) - 详细的安装说明
- [核心概念](/guide/http-client) - 了解核心功能

## 贡献

欢迎贡献代码、报告问题或提出建议！

- [GitHub 仓库](https://github.com/ldesign/ldesign)
- [问题反馈](https://github.com/ldesign/ldesign/issues)
- [讨论区](https://github.com/ldesign/ldesign/discussions)

## 许可证

[MIT License](https://github.com/ldesign/ldesign/blob/main/LICENSE) © 2024-present LDesign Team