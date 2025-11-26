# 请求去重

请求去重可以防止重复发送相同的请求，节省资源并提升性能。

## 启用去重

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: '/api',
  concurrency: {
    deduplication: true
  }
})
```

## 工作原理

相同的请求会自动合并：

```typescript
// 同时发起 3 个相同请求
const promises = [
  client.get('/users'),
  client.get('/users'),
  client.get('/users')
]

// 实际只发送 1 个请求，3 个 Promise 共享结果
const results = await Promise.all(promises)
```

## 去重键

默认使用 `method + url + params` 作为去重键：

```typescript
// 自定义去重键
const client = createHttpClient({
  concurrency: {
    deduplication: true,
    deduplicationKey: (config) => {
      return `${config.method}:${config.url}:${JSON.stringify(config.params)}`
    }
  }
})
```

## 禁用去重

```typescript
// 单个请求禁用
await client.get('/users', {
  deduplication: false
})
```

## 下一步

- [并发控制](/guide/concurrency) - 了解并发管理
- [性能监控](/guide/monitoring) - 监控性能