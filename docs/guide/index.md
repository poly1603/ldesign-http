# 介绍

@ldesign/http 是一个功能强大、灵活且现代的 HTTP 请求库，专为 Vue3 设计，同时支持多种适配器和框架扩展。

## 特性

### 🎯 多适配器支持

支持三种主流的HTTP客户端适配器：

- **原生 Fetch** - 基于浏览器原生 fetch API，轻量且现代
- **Axios** - 基于流行的 axios 库，功能丰富且稳定
- **Alova** - 基于现代的 alova 库，专为现代前端设计

你可以根据项目需求选择最适合的适配器，甚至可以在运行时动态切换。

### ⚡ Vue3 深度集成

提供了完整的 Vue3 集成方案：

- **组合式函数** - `useRequest`、`useGet`、`usePost` 等
- **插件系统** - 一键安装，全局可用
- **响应式状态** - 自动管理加载状态、错误状态等
- **生命周期集成** - 组件卸载时自动取消请求

### 🔧 TypeScript 优先

完整的 TypeScript 支持：

- 类型安全的 API 设计
- 智能的类型推断
- 优秀的开发体验
- 完整的类型文档

### 💾 智能缓存系统

灵活的缓存策略：

- **内存缓存** - 快速访问，适合短期缓存
- **localStorage** - 持久化缓存，跨会话保持
- **sessionStorage** - 会话级缓存，标签页隔离
- **自定义存储** - 支持自定义缓存适配器

### 🔄 智能重试机制

多种重试策略：

- **固定延迟** - 固定间隔重试
- **指数退避** - 指数增长延迟，避免服务器压力
- **线性增长** - 线性增长延迟
- **自定义策略** - 完全自定义重试逻辑

### 🛡️ 强大的拦截器

完善的拦截器系统：

- **请求拦截器** - 统一处理请求配置
- **响应拦截器** - 统一处理响应数据
- **错误拦截器** - 统一错误处理
- **内置拦截器** - 认证、日志、错误处理等

## 设计理念

### 简单易用

提供简洁的 API 和合理的默认配置，让开发者能够快速上手。

```typescript
// 简单的GET请求
const response = await http.get('/users')

// Vue3组合式函数
const { data, loading, error } = useGet('/users')
```

### 类型安全

完整的 TypeScript 支持，确保类型安全。

```typescript
interface User {
  id: number
  name: string
  email: string
}

const { data } = useGet<User[]>('/users')
// data 的类型自动推断为 User[] | null
```

### 可扩展性

插件化架构，支持自定义扩展。

```typescript
// 自定义插件
const myPlugin = {
  name: 'my-plugin',
  install(client) {
    // 插件逻辑
  }
}

myPlugin.install(client)
```

### 性能优先

优化的缓存和请求策略，提升应用性能。

```typescript
// 自动缓存GET请求
const client = createQuickClient({
  enableCache: true,
  enableRetry: true
})
```

## 架构概览

@ldesign/http 采用分层架构设计：

```
┌─────────────────────────────────────┐
│           Vue3 集成层                │
│  (组合式函数、插件、响应式状态)        │
├─────────────────────────────────────┤
│           插件系统层                 │
│  (缓存、重试、拦截器、事件等)         │
├─────────────────────────────────────┤
│          HTTP客户端层               │
│  (统一接口、配置管理、生命周期)       │
├─────────────────────────────────────┤
│           适配器层                  │
│  (Fetch、Axios、Alova适配器)        │
└─────────────────────────────────────┘
```

### 核心组件

- **HttpClient** - 核心客户端类，提供统一的HTTP接口
- **Adapter** - 适配器接口，抽象不同HTTP库的差异
- **Plugin** - 插件系统，提供可扩展的功能
- **Vue Integration** - Vue3集成，提供组合式函数和插件

## 浏览器支持

@ldesign/http 支持所有现代浏览器：

- Chrome >= 63
- Firefox >= 57
- Safari >= 11
- Edge >= 79

对于旧版浏览器，你可能需要相应的 polyfill。

## 下一步

- [快速开始](/guide/getting-started) - 学习如何安装和使用
- [基本用法](/guide/basic-usage) - 了解基本的API使用
- [Vue3集成](/vue/) - 学习如何在Vue3中使用
- [示例](/examples/) - 查看实际的使用示例
