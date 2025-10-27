# 并发控制

@ldesign/http 提供了强大的并发控制功能，帮助你管理同时进行的请求数量，避免资源耗尽和服务器过载。

## 基础用法

### 启用并发限制

```typescript
import { createHttpClient } from '@ldesign/http'

const client = await createHttpClient({
  baseURL: 'https://api.example.com',
  concurrency: {
    maxConcurrent: 5  // 最多同时 5 个请求
  }
})

// 发送 10 个请求，但同时只会有 5 个在执行
const promises = Array.from({ length: 10 }, (_, i) => 
  client.get(`/users/${i}`)
)

await Promise.all(promises)
```

## 并发配置

### 完整配置选项

```typescript
const client = await createHttpClient({
  concurrency: {
    // 最大并发数
    maxConcurrent: 5,
    
    // 最大队列大小
    maxQueueSize: 100,
    
    // 启用请求去重
    deduplication: true,
    
    // 超时时间（毫秒）
    timeout: 30000,
    
    // 队列满时的策略
    queueFullStrategy: 'reject', // 'reject' | 'wait' | 'drop-oldest'
    
    // 优先级队列
    priority: true
  }
})
```

## 请求去重

自动合并相同的请求，避免重复发送。

### 基础去重

```typescript
const client = await createHttpClient({
  concurrency: {
    deduplication: true
  }
})

// 这三个请求会被合并成一个
const promises = [
  client.get('/users'),
  client.get('/users'),
  client.get('/users')
]

const results = await Promise.all(promises)
// 三个结果相同，但只发送了一次请求
```

### 自定义去重键

```typescript
import { createDeduplicationKeyGenerator } from '@ldesign/http'

const keyGenerator = createDeduplicationKeyGenerator({
  // 自定义键生成逻辑
  generate: (config) => {
    // 包含 URL、方法和参数
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}`
  },
  
  // 包含请求头
  includeHeaders: ['Authorization'],
  
  // 包含请求体
  includeBody: true
})

const client = await createHttpClient({
  concurrency: {
    deduplication: true,
    keyGenerator
  }
})
```

### 去重统计

```typescript
import { createDeduplicationManager } from '@ldesign/http'

const deduplicationManager = createDeduplicationManager({
  enabled: true,
  stats: true
})

// 获取统计信息
const stats = deduplicationManager.getStats()

console.log('去重统计:', {
  total: stats.totalRequests,
  deduplicated: stats.deduplicatedRequests,
  saved: stats.savedRequests,
  savingsRate: stats.savingsRate
})
```

## 优先级队列

为请求设置优先级，确保重要请求优先执行。

### 设置优先级

```typescript
// 高优先级请求
await client.get('/critical-data', {
  priority: 'high' // 'low' | 'normal' | 'high' | 'critical'
})

// 普通优先级请求
await client.get('/normal-data', {
  priority: 'normal'
})

// 低优先级请求
await client.get('/non-urgent-data', {
  priority: 'low'
})
```

### 数字优先级

```typescript
// 数字越大优先级越高
await client.get('/data', {
  priority: 100
})
```

### 自定义优先级策略

```typescript
import { createPriorityQueue } from '@ldesign/http'

const priorityQueue = createPriorityQueue({
  // 优先级比较函数
  comparator: (a, b) => {
    // 自定义优先级逻辑
    if (a.config.urgent && !b.config.urgent) return -1
    if (!a.config.urgent && b.config.urgent) return 1
    return (b.priority || 0) - (a.priority || 0)
  }
})
```

## 并发管理器

### 创建并发管理器

```typescript
import { createConcurrencyManager } from '@ldesign/http'

const concurrencyManager = createConcurrencyManager({
  maxConcurrent: 5,
  maxQueueSize: 100,
  deduplication: true,
  priority: true
})

const client = await createHttpClient({
  concurrency: {
    manager: concurrencyManager
  }
})
```

### 获取并发状态

```typescript
const status = concurrencyManager.getStatus()

console.log('并发状态:', {
  activeCount: status.activeCount,      // 活跃请求数
  queuedCount: status.queuedCount,      // 队列中请求数
  completedCount: status.completedCount, // 完成请求数
  maxConcurrent: status.maxConcurrent    // 最大并发数
})
```

### 动态调整并发数

```typescript
// 增加并发数
concurrencyManager.setMaxConcurrent(10)

// 减少并发数
concurrencyManager.setMaxConcurrent(3)
```

## 请求队列

### 队列管理

```typescript
import { createRequestQueue } from '@ldesign/http'

const queue = createRequestQueue({
  maxSize: 100,
  timeout: 30000,
  
  // 队列满时的策略
  onFull: (request) => {
    console.warn('队列已满，丢弃请求:', request.url)
  },
  
  // 请求超时的策略
  onTimeout: (request) => {
    console.error('请求超时:', request.url)
  }
})
```

### 队列操作

```typescript
// 添加到队列
queue.enqueue(requestConfig)

// 从队列取出
const request = queue.dequeue()

// 清空队列
queue.clear()

// 获取队列大小
const size = queue.size()

// 检查是否为空
const isEmpty = queue.isEmpty()

// 检查是否已满
const isFull = queue.isFull()
```

## 速率限制

控制请求的发送速率。

### 基础速率限制

```typescript
import { createRateLimitManager } from '@ldesign/http'

const rateLimitManager = createRateLimitManager({
  // 每秒最多 10 个请求
  requestsPerSecond: 10,
  
  // 时间窗口（毫秒）
  windowMs: 1000
})

const client = await createHttpClient({
  concurrency: {
    rateLimit: rateLimitManager
  }
})
```

### 令牌桶算法

```typescript
const rateLimitManager = createRateLimitManager({
  algorithm: 'token-bucket',
  
  // 桶容量
  capacity: 100,
  
  // 令牌生成速率（每秒）
  refillRate: 10
})
```

### 滑动窗口算法

```typescript
const rateLimitManager = createRateLimitManager({
  algorithm: 'sliding-window',
  
  // 窗口大小（毫秒）
  windowMs: 60000, // 1 分钟
  
  // 窗口内最大请求数
  maxRequests: 100
})
```

### 分布式速率限制

```typescript
// 使用 Redis 实现分布式速率限制
const rateLimitManager = createRateLimitManager({
  algorithm: 'sliding-window',
  windowMs: 60000,
  maxRequests: 100,
  
  // Redis 配置
  storage: {
    type: 'redis',
    client: redisClient,
    keyPrefix: 'rate-limit:'
  }
})
```

## 批量请求

### 批量发送请求

```typescript
import { createBatchManager } from '@ldesign/http'

const batchManager = createBatchManager({
  // 批次大小
  batchSize: 10,
  
  // 批次延迟（毫秒）
  batchDelay: 100,
  
  // 最大等待时间（毫秒）
  maxWaitTime: 1000
})

// 批量请求会被自动合并
const promises = Array.from({ length: 50 }, (_, i) =>
  client.get(`/users/${i}`)
)

const results = await Promise.all(promises)
```

### 手动批处理

```typescript
const requests = [
  { url: '/users/1', method: 'GET' },
  { url: '/users/2', method: 'GET' },
  { url: '/users/3', method: 'GET' }
]

// 并发执行批量请求
const results = await Promise.all(
  requests.map(req => client.request(req))
)

// 串行执行批量请求
const results = []
for (const req of requests) {
  const result = await client.request(req)
  results.push(result)
}
```

## 请求取消

### 使用 AbortController

```typescript
const controller = new AbortController()

const request = client.get('/api/data', {
  signal: controller.signal
})

// 取消请求
controller.abort()

try {
  await request
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('请求已取消')
  }
}
```

### 批量取消

```typescript
import { CancelManager } from '@ldesign/http'

const cancelManager = new CancelManager()

// 添加可取消的请求
const request1 = client.get('/api/data1', {
  cancelToken: cancelManager.token('group1')
})

const request2 = client.get('/api/data2', {
  cancelToken: cancelManager.token('group1')
})

// 取消整个组
cancelManager.cancel('group1')

// 取消所有请求
cancelManager.cancelAll()
```

### 超时取消

```typescript
import { createTimeoutCancelToken } from '@ldesign/http'

// 5 秒后自动取消
const timeoutToken = createTimeoutCancelToken(5000)

const request = client.get('/api/data', {
  cancelToken: timeoutToken
})
```

## 连接池

### 创建连接池

```typescript
import { createRequestPool } from '@ldesign/http'

const pool = createRequestPool({
  // 最大连接数
  maxConnections: 10,
  
  // 空闲超时（毫秒）
  idleTimeout: 30000,
  
  // 连接超时（毫秒）
  connectionTimeout: 5000,
  
  // 启用连接复用
  keepAlive: true
})

const client = await createHttpClient({
  pool
})
```

### 连接池统计

```typescript
const stats = pool.getStats()

console.log('连接池统计:', {
  active: stats.activeConnections,
  idle: stats.idleConnections,
  total: stats.totalConnections,
  pending: stats.pendingRequests
})
```

## 自适应并发

根据系统负载自动调整并发数。

```typescript
import { createAdaptiveConcurrencyManager } from '@ldesign/http'

const concurrencyManager = createAdaptiveConcurrencyManager({
  // 初始并发数
  initialConcurrency: 5,
  
  // 最小并发数
  minConcurrency: 1,
  
  // 最大并发数
  maxConcurrency: 20,
  
  // 调整因子
  adjustmentFactor: 1.5,
  
  // 监控指标
  metrics: {
    // 目标响应时间（毫秒）
    targetResponseTime: 1000,
    
    // 目标错误率
    targetErrorRate: 0.01,
    
    // 目标 CPU 使用率
    targetCpuUsage: 0.7
  }
})
```

## 最佳实践

### 1. 合理设置并发数

```typescript
// 浏览器环境：6-8 个并发
const browserClient = await createHttpClient({
  concurrency: { maxConcurrent: 6 }
})

// Node.js 环境：根据服务器能力设置
const serverClient = await createHttpClient({
  concurrency: { maxConcurrent: 50 }
})

// 移动设备：降低并发数以节省资源
const mobileClient = await createHttpClient({
  concurrency: { maxConcurrent: 3 }
})
```

### 2. 使用请求去重

```typescript
// 启用去重，避免重复请求
const client = await createHttpClient({
  concurrency: {
    deduplication: true
  }
})
```

### 3. 设置优先级

```typescript
// 关键数据高优先级
await client.get('/critical-data', {
  priority: 'high'
})

// 分析数据低优先级
await client.get('/analytics-data', {
  priority: 'low'
})
```

### 4. 监控并发状态

```typescript
// 定期检查并发状态
setInterval(() => {
  const status = concurrencyManager.getStatus()
  
  if (status.queuedCount > 50) {
    console.warn('请求队列过长:', status.queuedCount)
  }
  
  if (status.activeCount === status.maxConcurrent) {
    console.warn('达到最大并发数')
  }
}, 5000)
```

### 5. 合理使用批处理

```typescript
// 批量获取用户数据
const userIds = [1, 2, 3, 4, 5]

// ❌ 不好：逐个请求
for (const id of userIds) {
  await client.get(`/users/${id}`)
}

// ✅ 好：批量请求
const promises = userIds.map(id => client.get(`/users/${id}`))
await Promise.all(promises)

// ✅ 更好：使用批量接口
await client.post('/users/batch', { ids: userIds })
```

## 下一步

- [错误处理](/guide/error-handling) - 了解错误处理机制
- [性能监控](/guide/monitoring) - 了解性能监控功能
- [API 参考](/api/features/concurrency) - 查看完整的并发控制 API

