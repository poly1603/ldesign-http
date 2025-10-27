# 缓存系统

@ldesign/http 提供了强大的缓存系统，可以显著提升应用性能，减少不必要的网络请求。

## 基础用法

### 启用缓存

```typescript
import { createHttpClient } from '@ldesign/http'

const client = await createHttpClient({
  baseURL: 'https://api.example.com',
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5 分钟
  }
})

// 第一次请求会发送网络请求
const users1 = await client.get('/users')

// 第二次请求会使用缓存（5分钟内）
const users2 = await client.get('/users')
```

### 请求级缓存

每个请求可以单独配置缓存：

```typescript
// 使用默认缓存配置
await client.get('/users')

// 自定义缓存配置
await client.get('/users', {
  cache: {
    enabled: true,
    ttl: 10 * 60 * 1000, // 10 分钟
    key: 'users-list'     // 自定义缓存键
  }
})

// 禁用缓存
await client.get('/users', {
  cache: {
    enabled: false
  }
})
```

## 缓存配置

### 完整配置选项

```typescript
const client = await createHttpClient({
  cache: {
    // 是否启用缓存
    enabled: true,
    
    // 默认缓存时间（毫秒）
    ttl: 5 * 60 * 1000,
    
    // 缓存策略
    strategy: 'lru', // 'lru' | 'lfu' | 'fifo'
    
    // 最大缓存条目数
    maxItems: 100,
    
    // 最大缓存大小（字节）
    maxSize: 10 * 1024 * 1024, // 10MB
    
    // 启用压缩
    compression: true,
    
    // 启用统计
    stats: true,
    
    // 缓存键生成函数
    keyGenerator: (config) => {
      return `${config.method}:${config.url}:${JSON.stringify(config.params)}`
    },
    
    // 只缓存指定方法
    methods: ['GET', 'HEAD'],
    
    // 排除的路径模式
    exclude: ['/auth/*', '/user/profile']
  }
})
```

## 缓存策略

### LRU（最近最少使用）

```typescript
import { createCacheManager } from '@ldesign/http'

const cacheManager = createCacheManager({
  strategy: 'lru',
  maxItems: 100
})

const client = await createHttpClient({
  cache: {
    enabled: true,
    manager: cacheManager
  }
})
```

当缓存满时，会自动删除最久未使用的条目。

### LFU（最不经常使用）

```typescript
const cacheManager = createCacheManager({
  strategy: 'lfu',
  maxItems: 100
})
```

当缓存满时，会自动删除访问频率最低的条目。

### FIFO（先进先出）

```typescript
const cacheManager = createCacheManager({
  strategy: 'fifo',
  maxItems: 100
})
```

当缓存满时，会自动删除最早添加的条目。

## 缓存标签

使用标签可以批量管理相关的缓存。

### 添加标签

```typescript
// 用户列表
await client.get('/users', {
  cache: {
    tags: ['users', 'user-list'],
    ttl: 10 * 60 * 1000
  }
})

// 用户详情
await client.get('/users/1', {
  cache: {
    tags: ['users', 'user-detail', 'user:1'],
    ttl: 5 * 60 * 1000
  }
})

// 用户文章
await client.get('/users/1/posts', {
  cache: {
    tags: ['posts', 'user:1'],
    ttl: 10 * 60 * 1000
  }
})
```

### 按标签失效

```typescript
// 失效所有带 'users' 标签的缓存
await cacheManager.invalidateByTag('users')

// 失效特定用户的所有缓存
await cacheManager.invalidateByTag('user:1')

// 失效多个标签
await cacheManager.invalidateByTags(['users', 'posts'])
```

## 缓存依赖

设置缓存之间的依赖关系。

```typescript
// 主数据
await client.get('/users', {
  cache: {
    key: 'users-list',
    ttl: 10 * 60 * 1000
  }
})

// 依赖于主数据的缓存
await client.get('/users/stats', {
  cache: {
    key: 'users-stats',
    dependencies: ['users-list'], // 依赖于 users-list
    ttl: 10 * 60 * 1000
  }
})

// 当主数据失效时，依赖的缓存也会失效
await cacheManager.invalidate('users-list')
// users-stats 也会被自动失效
```

## 高级缓存管理器

### 创建高级缓存管理器

```typescript
import { createEnhancedCacheManager } from '@ldesign/http'

const cacheManager = createEnhancedCacheManager({
  // 基础配置
  strategy: 'lru',
  maxSize: 50 * 1024 * 1024, // 50MB
  maxAge: 30 * 60 * 1000,    // 30 分钟
  
  // 压缩配置
  compression: {
    enabled: true,
    threshold: 1024, // 大于 1KB 的数据才压缩
    level: 6         // 压缩级别 (1-9)
  },
  
  // 失效配置
  invalidation: {
    tags: true,        // 支持标签失效
    dependencies: true // 支持依赖失效
  },
  
  // 统计配置
  stats: {
    enabled: true,
    detailed: true
  },
  
  // 持久化配置
  persistence: {
    enabled: true,
    storage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'indexedDB'
    prefix: 'http-cache:'
  }
})
```

### 缓存统计

```typescript
// 获取缓存统计
const stats = cacheManager.getStats()

console.log('缓存命中率:', stats.hitRate)
console.log('缓存大小:', stats.size)
console.log('缓存条目数:', stats.count)
console.log('热门键:', stats.hotKeys)
console.log('总命中次数:', stats.hits)
console.log('总未命中次数:', stats.misses)
```

### 缓存预热

```typescript
// 预热关键数据
const warmupData = [
  { url: '/users', data: usersData },
  { url: '/posts', data: postsData },
  { url: '/categories', data: categoriesData }
]

for (const item of warmupData) {
  await cacheManager.set(item.url, item.data, {
    ttl: 30 * 60 * 1000
  })
}
```

## 缓存控制

### 手动设置缓存

```typescript
// 设置缓存
await cacheManager.set('users-list', usersData, {
  ttl: 10 * 60 * 1000,
  tags: ['users']
})
```

### 手动获取缓存

```typescript
// 获取缓存
const cached = await cacheManager.get('users-list')

if (cached) {
  console.log('缓存数据:', cached.data)
  console.log('剩余时间:', cached.ttl)
}
```

### 手动删除缓存

```typescript
// 删除单个缓存
await cacheManager.delete('users-list')

// 删除多个缓存
await cacheManager.deleteMany(['users-list', 'posts-list'])

// 清空所有缓存
await cacheManager.clear()
```

### 检查缓存是否存在

```typescript
const exists = await cacheManager.has('users-list')
if (exists) {
  console.log('缓存存在')
}
```

## 缓存更新策略

### 缓存优先（Cache First）

优先使用缓存，缓存不存在时才请求网络：

```typescript
async function getCachedData(url: string) {
  // 尝试从缓存获取
  const cached = await cacheManager.get(url)
  if (cached) {
    return cached.data
  }
  
  // 缓存不存在，请求网络
  const response = await client.get(url)
  
  // 存入缓存
  await cacheManager.set(url, response.data, {
    ttl: 10 * 60 * 1000
  })
  
  return response.data
}
```

### 网络优先（Network First）

优先请求网络，失败时使用缓存：

```typescript
async function getNetworkFirstData(url: string) {
  try {
    // 尝试请求网络
    const response = await client.get(url)
    
    // 更新缓存
    await cacheManager.set(url, response.data, {
      ttl: 10 * 60 * 1000
    })
    
    return response.data
  } catch (error) {
    // 网络失败，尝试使用缓存
    const cached = await cacheManager.get(url)
    if (cached) {
      return cached.data
    }
    
    throw error
  }
}
```

### 缓存后台更新（Stale While Revalidate）

立即返回缓存，同时在后台更新：

```typescript
async function getStaleWhileRevalidate(url: string) {
  // 获取缓存
  const cached = await cacheManager.get(url)
  
  // 后台更新
  client.get(url).then((response) => {
    cacheManager.set(url, response.data, {
      ttl: 10 * 60 * 1000
    })
  })
  
  // 立即返回缓存（可能是旧数据）
  if (cached) {
    return cached.data
  }
  
  // 缓存不存在，等待网络请求
  const response = await client.get(url)
  return response.data
}
```

## 响应头缓存控制

### 支持 HTTP 缓存头

```typescript
const client = await createHttpClient({
  cache: {
    enabled: true,
    // 尊重服务器的缓存控制头
    respectCacheControl: true,
    respectETag: true
  }
})
```

### Cache-Control

```typescript
// 服务器响应头: Cache-Control: max-age=3600
// 会自动使用 3600 秒的缓存时间
```

### ETag

```typescript
// 服务器响应头: ETag: "abc123"
// 下次请求会自动添加 If-None-Match: "abc123"
// 如果服务器返回 304，会使用缓存
```

## 缓存存储

### 内存存储（默认）

```typescript
import { createMemoryStorage } from '@ldesign/http'

const storage = createMemoryStorage({
  maxSize: 10 * 1024 * 1024 // 10MB
})

const cacheManager = createCacheManager({
  storage
})
```

### LocalStorage 存储

```typescript
import { createLocalStorage } from '@ldesign/http'

const storage = createLocalStorage({
  prefix: 'http-cache:',
  maxSize: 5 * 1024 * 1024 // 5MB
})

const cacheManager = createCacheManager({
  storage
})
```

### 自定义存储

```typescript
import { CacheStorage } from '@ldesign/http'

class CustomStorage implements CacheStorage {
  async get(key: string) {
    // 从自定义存储获取
  }
  
  async set(key: string, value: any, ttl?: number) {
    // 存入自定义存储
  }
  
  async delete(key: string) {
    // 从自定义存储删除
  }
  
  async clear() {
    // 清空自定义存储
  }
  
  async has(key: string) {
    // 检查是否存在
  }
}

const cacheManager = createCacheManager({
  storage: new CustomStorage()
})
```

## 性能优化

### 布隆过滤器

使用布隆过滤器快速检查缓存是否存在：

```typescript
import { createCacheWithBloomFilter } from '@ldesign/http'

const cacheManager = createCacheWithBloomFilter({
  expectedItems: 10000,
  falsePositiveRate: 0.01
})
```

### 压缩

启用压缩减少内存占用：

```typescript
const cacheManager = createCacheManager({
  compression: {
    enabled: true,
    threshold: 1024, // 大于 1KB 才压缩
    algorithm: 'gzip' // 'gzip' | 'deflate' | 'br'
  }
})
```

### 分片缓存

将大数据分片存储：

```typescript
const cacheManager = createCacheManager({
  sharding: {
    enabled: true,
    chunkSize: 100 * 1024 // 100KB per chunk
  }
})
```

## 最佳实践

### 1. 合理设置 TTL

```typescript
// 静态数据：长时间缓存
await client.get('/config', {
  cache: { ttl: 60 * 60 * 1000 } // 1 小时
})

// 动态数据：短时间缓存
await client.get('/users', {
  cache: { ttl: 5 * 60 * 1000 } // 5 分钟
})

// 实时数据：不缓存
await client.get('/realtime-data', {
  cache: { enabled: false }
})
```

### 2. 使用缓存标签

```typescript
// 创建时添加标签
await client.post('/users', userData, {
  cache: { invalidateTags: ['users'] }
})

// 更新时失效相关缓存
await client.put('/users/1', userData, {
  cache: { invalidateTags: ['users', 'user:1'] }
})

// 删除时失效相关缓存
await client.delete('/users/1', {
  cache: { invalidateTags: ['users', 'user:1'] }
})
```

### 3. 预加载关键数据

```typescript
// 应用启动时预加载
async function preloadCache() {
  await Promise.all([
    client.get('/config'),
    client.get('/menu'),
    client.get('/permissions')
  ])
}
```

### 4. 监控缓存性能

```typescript
// 定期检查缓存统计
setInterval(() => {
  const stats = cacheManager.getStats()
  
  if (stats.hitRate < 0.5) {
    console.warn('缓存命中率过低:', stats.hitRate)
  }
  
  if (stats.size > 50 * 1024 * 1024) {
    console.warn('缓存占用过大:', stats.size)
  }
}, 60000) // 每分钟检查一次
```

## 下一步

- [重试机制](/guide/retry) - 了解重试功能
- [并发控制](/guide/concurrency) - 了解并发控制
- [API 参考](/api/features/cache) - 查看完整的缓存 API

