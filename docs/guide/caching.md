# 缓存管理

缓存是提升应用性能的重要手段。@ldesign/http 提供了强大而灵活的缓存系统。

## 基础缓存

### 启用缓存

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: '/api',
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5 分钟
  }
})
```

### 请求级别缓存

```typescript
// 使用默认缓存配置
const response = await client.get('/users', {
  cache: true
})

// 自定义缓存配置
const response = await client.get('/users', {
  cache: {
    enabled: true,
    ttl: 10 * 60 * 1000 // 10 分钟
  }
})

// 禁用缓存
const response = await client.get('/users', {
  cache: false
})
```

## 缓存存储

### 内存缓存（默认）

```typescript
const client = createHttpClient({
  cache: {
    enabled: true,
    storage: 'memory'
  }
})
```

**优点：**
- 速度最快
- 无需序列化

**缺点：**
- 页面刷新后丢失
- 内存占用

### LocalStorage 缓存

```typescript
const client = createHttpClient({
  cache: {
    enabled: true,
    storage: 'localStorage'
  }
})
```

**优点：**
- 持久化存储
- 页面刷新保留

**缺点：**
- 5-10MB 限制
- 同步操作

### IndexedDB 缓存

```typescript
const client = createHttpClient({
  cache: {
    enabled: true,
    storage: 'indexedDB'
  }
})
```

**优点：**
- 大容量存储
- 异步操作
- 持久化

**缺点：**
- API 复杂
- 初始化开销

## 缓存策略

### LRU (Least Recently Used)

```typescript
import { createAdvancedCacheManager } from '@ldesign/http-core'

const cacheManager = createAdvancedCacheManager({
  strategy: 'lru',
  maxSize: 50 * 1024 * 1024, // 50MB
  maxItems: 100
})

const client = createHttpClient({
  cache: {
    enabled: true,
    manager: cacheManager
  }
})
```

### FIFO (First In First Out)

```typescript
const cacheManager = createAdvancedCacheManager({
  strategy: 'fifo',
  maxSize: 50 * 1024 * 1024
})
```

### LFU (Least Frequently Used)

```typescript
const cacheManager = createAdvancedCacheManager({
  strategy: 'lfu',
  maxSize: 50 * 1024 * 1024
})
```

## 高级功能

### 标签失效

```typescript
// 添加标签
await client.get('/users', {
  cache: {
    enabled: true,
    tags: ['users', 'user-list']
  }
})

// 按标签失效
await cacheManager.invalidateByTag('users')
```

### 依赖管理

```typescript
// 设置依赖
await client.get('/user/profile', {
  cache: {
    enabled: true,
    dependencies: ['user:123']
  }
})

// 失效依赖
await cacheManager.invalidateByDependency('user:123')
```

### 缓存键生成

```typescript
const client = createHttpClient({
  cache: {
    enabled: true,
    keyGenerator: (config) => {
      return `${config.method}:${config.url}:${JSON.stringify(config.params)}`
    }
  }
})
```

### 条件缓存

```typescript
const client = createHttpClient({
  cache: {
    enabled: true,
    shouldCache: (response) => {
      // 只缓存成功响应
      return response.status === 200
    }
  }
})
```

## 缓存操作

### 清除缓存

```typescript
// 清除所有缓存
await client.clearCache()

// 清除特定 URL
await client.clearCache('/users')

// 清除匹配模式
await client.clearCache(/^\/api\/users/)
```

### 预加载缓存

```typescript
// 预热缓存
await client.get('/users', { cache: true })
await client.get('/posts', { cache: true })
```

### 手动设置缓存

```typescript
import { cacheManager } from '@ldesign/http-core'

await cacheManager.set('custom-key', {
  data: { id: 1, name: 'John' },
  timestamp: Date.now()
})
```

### 手动获取缓存

```typescript
const cached = await cacheManager.get('custom-key')
if (cached) {
  console.log(cached.data)
}
```

## 缓存统计

```typescript
const stats = cacheManager.getStats()

console.log('缓存命中率:', stats.hitRate)
console.log('缓存大小:', stats.size)
console.log('缓存项数:', stats.count)
console.log('热门键:', stats.hotKeys)
```

## 最佳实践

### 1. 选择合适的存储方式

```typescript
// 临时数据用内存
const tempClient = createHttpClient({
  cache: { storage: 'memory' }
})

// 用户数据用 localStorage
const userClient = createHttpClient({
  cache: { storage: 'localStorage' }
})

// 大量数据用 IndexedDB
const dataClient = createHttpClient({
  cache: { storage: 'indexedDB' }
})
```

### 2. 设置合理的 TTL

```typescript
// 静态数据 - 长 TTL
await client.get('/config', {
  cache: { ttl: 24 * 60 * 60 * 1000 } // 1 天
})

// 动态数据 - 短 TTL
await client.get('/realtime', {
  cache: { ttl: 30 * 1000 } // 30 秒
})
```

### 3. 使用标签管理

```typescript
// 相关请求使用相同标签
await client.get('/users', {
  cache: { tags: ['users'] }
})

await client.get('/users/1', {
  cache: { tags: ['users', 'user:1'] }
})

// 更新后失效
await client.post('/users', data)
await cacheManager.invalidateByTag('users')
```

### 4. 监控缓存性能

```typescript
setInterval(() => {
  const stats = cacheManager.getStats()
  console.log('缓存命中率:', stats.hitRate)
  
  if (stats.hitRate < 0.5) {
    console.warn('缓存命中率过低')
  }
}, 60000) // 每分钟检查
```

## 下一步

- [重试机制](/guide/retry) - 了解重试策略
- [错误处理](/guide/error-handling) - 学习错误处理
- [缓存 API](/api/cache) - 完整 API 参考