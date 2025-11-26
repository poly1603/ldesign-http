# @ldesign/http-core

框架无关的核心HTTP客户端库。

## 安装

```bash
pnpm add @ldesign/http-core
```

## 特性

- ✅ 多适配器支持（Fetch、Axios、Alova）
- ✅ 请求/响应拦截器
- ✅ 智能缓存管理
- ✅ 自动重试机制
- ✅ 并发控制
- ✅ 请求去重
- ✅ TypeScript 完整支持
- ✅ 文件上传下载
- ✅ 进度跟踪

## 快速开始

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
})

const response = await client.get('/users')
console.log(response.data)
```

## 主要导出

```typescript
// 客户端
export { createHttpClient, HttpClient }

// 适配器
export { FetchAdapter, AxiosAdapter, AlovaAdapter }

// 拦截器
export { 
  authInterceptor,
  loggingInterceptor,
  retryInterceptor 
}

// 缓存
export { 
  CacheManager,
  createAdvancedCacheManager 
}

// 重试
export { RetryManager }

// 工具
export {
  isHttpError,
  isNetworkError,
  isTimeoutError,
  isCancelError
}

// 类型
export type {
  HttpConfig,
  RequestConfig,
  Response,
  HttpError
}
```

## 下一步

- [快速开始](/guide/getting-started) - 开始使用
- [HTTP 客户端](/guide/http-client) - 核心功能
- [API 参考](/api/core) - 完整 API