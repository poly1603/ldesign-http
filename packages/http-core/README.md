# @ldesign/http-core

> HTTP 客户端核心库 - 提供基础的 HTTP 客户端功能和类型定义

## 特性

- ✅ **类型安全** - 完整的 TypeScript 类型支持
- ✅ **灵活架构** - 可扩展的客户端设计
- ✅ **轻量级** - 零依赖的核心实现
- ✅ **现代化** - 基于 Promise 的异步 API

## 安装

```bash
pnpm add @ldesign/http-core
```

## 快速开始

```typescript
import { HttpClient } from '@ldesign/http-core'

// 创建客户端实例
const client = new HttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
})

// 发送请求
const response = await client.request({
  url: '/users',
  method: 'GET',
})
```

## API 文档

### HttpClient

核心 HTTP 客户端类

#### 构造函数

```typescript
constructor(config?: HttpClientConfig)
```

#### 方法

- `request<T>(config: RequestConfig): Promise<Response<T>>` - 发送 HTTP 请求
- `get<T>(url: string, config?: RequestConfig): Promise<Response<T>>` - GET 请求
- `post<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>` - POST 请求
- `put<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>` - PUT 请求
- `delete<T>(url: string, config?: RequestConfig): Promise<Response<T>>` - DELETE 请求
- `patch<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>` - PATCH 请求

## License

MIT © ldesign


