# 并发控制

并发控制可以限制同时进行的请求数量，避免资源耗尽和服务器过载。

## 基础配置

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: '/api',
  concurrency: {
    maxConcurrent: 5, // 最多同时 5 个请求
    maxQueueSize: 100 // 队列最多 100 个
  }
})
```

## 并发管理器

```typescript
import { ConcurrencyManager } from '@ldesign/http-core'

const manager = new ConcurrencyManager({
  maxConcurrent: 5,
  maxQueueSize: 100
})

const client = createHttpClient({
  concurrency: {
    manager
  }
})

// 获取状态
const status = manager.getStatus()
console.log('活跃请求:', status.activeCount)
console.log('队列中:', status.queuedCount)
```

## 请求优先级

```typescript
// 高优先级请求
await client.get('/critical', {
  priority: 'high'
})

// 普通优先级
await client.get('/normal', {
  priority: 'normal'
})

// 低优先级
await client.get('/background', {
  priority: 'low'
})
```

## 最佳实践

### 1. 合理设置并发数

```typescript
// 根据网络条件调整
const isMobile = /Mobile/.test(navigator.userAgent)
const maxConcurrent = isMobile ? 3 : 6

const client = createHttpClient({
  concurrency: { maxConcurrent }
})
```

### 2. 批量请求

```typescript
const urls = ['/api/1', '/api/2', '/api/3']
const results = await Promise.all(
  urls.map(url => client.get(url))
)
```

## 下一步

- [请求去重](/guide/deduplication) - 了解去重机制
- [性能监控](/guide/monitoring) - 监控性能