# 缓存插件

缓存插件为 @ldesign/http 提供智能缓存功能，可以显著提升应用性能并减少网络请求。

## 🎯 功能特性

- **多种存储策略** - 内存、localStorage、sessionStorage
- **TTL 支持** - 灵活的生存时间配置
- **智能缓存键** - 自动生成或自定义缓存键
- **缓存控制** - 精确控制哪些请求需要缓存
- **缓存统计** - 命中率和性能监控
- **自动清理** - 过期缓存自动清理

## 🚀 快速开始

### 基础使用

```typescript
import { createCachePlugin, createHttpClient } from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://api.example.com'
})

// 创建缓存插件
const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 5 * 60 * 1000 // 5分钟缓存
})

// 安装插件
cachePlugin.install(client)

// 现在GET请求会自动缓存
const response1 = await client.get('/users') // 网络请求
const response2 = await client.get('/users') // 从缓存返回
```

### 快速配置

```typescript
import { createQuickClient } from '@ldesign/http'

const client = createQuickClient({
  baseURL: 'https://api.example.com',
  enableCache: true // 自动启用缓存
})
```

## ⚙️ 配置选项

### CacheConfig

```typescript
interface CacheConfig {
  enabled?: boolean // 是否启用缓存
  ttl?: number // 默认TTL (毫秒)
  maxSize?: number // 最大缓存条目数
  keyGenerator?: (config: RequestConfig) => string // 缓存键生成器
  storage?: CacheStorage // 存储适配器
  exclude?: (string | RegExp)[] // 排除的URL模式
  include?: (string | RegExp)[] // 包含的URL模式
  methods?: HttpMethod[] // 缓存的HTTP方法
  headers?: string[] // 影响缓存键的请求头
}
```

### 详细配置

```typescript
const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 10 * 60 * 1000, // 10分钟
  maxSize: 100, // 最多100个缓存项

  // 自定义缓存键生成
  keyGenerator: (config) => {
    const url = config.url || ''
    const params = JSON.stringify(config.params || {})
    const headers = JSON.stringify(config.headers || {})
    return `${config.method}:${url}:${params}:${headers}`
  },

  // 只缓存特定URL
  include: [
    '/api/users',
    /^\/api\/posts\/\d+$/,
    '/api/config'
  ],

  // 排除特定URL
  exclude: [
    '/api/auth',
    /^\/api\/upload/,
    '/api/realtime'
  ],

  // 只缓存GET和HEAD请求
  methods: ['GET', 'HEAD'],

  // 考虑这些请求头的缓存键
  headers: ['Authorization', 'Accept-Language']
})
```

## 💾 存储适配器

### 内存存储 (默认)

```typescript
import { createMemoryCache } from '@ldesign/http'

const cachePlugin = createCachePlugin({
  storage: createMemoryCache()
})
```

**特点:**
- ✅ 最快的访问速度
- ✅ 无大小限制 (受内存限制)
- ❌ 页面刷新后丢失
- ❌ 不跨标签页共享

### localStorage 存储

```typescript
import { createLocalStorageCache } from '@ldesign/http'

const cachePlugin = createCachePlugin({
  storage: createLocalStorageCache('api_cache_')
})
```

**特点:**
- ✅ 持久化存储
- ✅ 跨标签页共享
- ✅ 页面刷新后保持
- ❌ 有大小限制 (通常5-10MB)
- ❌ 同步操作可能阻塞

### sessionStorage 存储

```typescript
import { createSessionStorageCache } from '@ldesign/http'

const cachePlugin = createCachePlugin({
  storage: createSessionStorageCache('session_cache_')
})
```

**特点:**
- ✅ 会话级持久化
- ✅ 标签页隔离
- ❌ 关闭标签页后丢失
- ❌ 有大小限制

### 自定义存储

```typescript
class CustomCacheStorage implements CacheStorage {
  private cache = new Map<string, CacheItem>()

  async get(key: string): Promise<CacheItem | null> {
    const item = this.cache.get(key)
    if (!item)
return null

    // 检查是否过期
    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item
  }

  async set(key: string, value: CacheItem): Promise<void> {
    this.cache.set(key, value)
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys())
  }

  async size(): Promise<number> {
    return this.cache.size
  }
}

const cachePlugin = createCachePlugin({
  storage: new CustomCacheStorage()
})
```

## 🎛️ 缓存控制

### 单次请求控制

```typescript
// 禁用此次请求的缓存
const response = await client.get('/users', {
  cache: { enabled: false }
})

// 自定义此次请求的TTL
const response = await client.get('/config', {
  cache: { ttl: 60 * 60 * 1000 } // 1小时
})

// 自定义缓存键
const response = await client.get('/users', {
  cache: { key: 'current_user_list' }
})
```

### 条件缓存

```typescript
const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 5 * 60 * 1000,

  // 动态决定是否缓存
  shouldCache: (config, response) => {
    // 只缓存成功的响应
    if (response.status !== 200)
return false

    // 不缓存空数据
    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      return false
    }

    // 不缓存错误响应
    if (response.data.error)
return false

    return true
  }
})
```

### 缓存更新策略

```typescript
// 强制刷新缓存
const response = await client.get('/users', {
  cache: { refresh: true }
})

// 后台更新 (返回缓存数据，同时更新缓存)
const response = await client.get('/users', {
  cache: { staleWhileRevalidate: true }
})
```

## 📊 缓存管理

### 手动缓存操作

```typescript
// 获取缓存实例
const cache = cachePlugin.getCache()

// 手动设置缓存
await cache.set('custom_key', {
  data: { message: 'Hello World' },
  timestamp: Date.now(),
  ttl: 60000
})

// 手动获取缓存
const item = await cache.get('custom_key')
console.log(item?.data)

// 删除特定缓存
await cache.delete('custom_key')

// 清空所有缓存
await cache.clear()

// 获取缓存统计
const stats = await cachePlugin.getStats()
console.log('缓存命中率:', stats.hitRate)
console.log('缓存大小:', stats.size)
```

### 缓存事件

```typescript
// 监听缓存事件
client.on('cache-hit', (event) => {
  console.log('缓存命中:', event.cacheKey)
})

client.on('cache-miss', (event) => {
  console.log('缓存未命中:', event.cacheKey)
})

client.on('cache-set', (event) => {
  console.log('缓存设置:', event.cacheKey)
})

client.on('cache-delete', (event) => {
  console.log('缓存删除:', event.cacheKey)
})
```

## 🎨 Vue 集成

### 组合式函数缓存

```vue
<script setup lang="ts">
import { useCache, useGet } from '@ldesign/http'

// 带缓存的请求
const { data: users, loading, refresh } = useGet('/users', {
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000
  }
})

// 缓存管理
const { clearCache } = useCache()
</script>

<template>
  <div>
    <div v-if="loading">
      加载中...
    </div>
    <div v-else>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }}
        </li>
      </ul>
      <button @click="refresh">
        刷新
      </button>
      <button @click="clearCache">
        清除缓存
      </button>
    </div>
  </div>
</template>
```

### 缓存状态管理

```typescript
// composables/useCache.ts
import { computed, ref } from 'vue'
import { useHttp } from '@ldesign/http'

export function useCache() {
  const http = useHttp()
  const cacheStats = ref({
    size: 0,
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0
  })

  const updateStats = async () => {
    const plugin = http.getPlugin('cache')
    if (plugin) {
      cacheStats.value = await plugin.getStats()
    }
  }

  const clearCache = async () => {
    const plugin = http.getPlugin('cache')
    if (plugin) {
      await plugin.clear()
      await updateStats()
    }
  }

  const clearExpired = async () => {
    const plugin = http.getPlugin('cache')
    if (plugin) {
      await plugin.clearExpired()
      await updateStats()
    }
  }

  return {
    cacheStats: computed(() => cacheStats.value),
    updateStats,
    clearCache,
    clearExpired
  }
}
```

## 🔧 高级功能

### 缓存预热

```typescript
// 预热关键数据
async function preloadCache() {
  const criticalEndpoints = [
    '/api/user/profile',
    '/api/config/app',
    '/api/menu/navigation'
  ]

  await Promise.all(
    criticalEndpoints.map(url =>
      client.get(url, {
        cache: { ttl: 30 * 60 * 1000 } // 30分钟
      })
    )
  )
}

// 应用启动时预热
preloadCache()
```

### 缓存同步

```typescript
// 跨标签页缓存同步
class SyncedCacheStorage implements CacheStorage {
  private storage = createLocalStorageCache()

  constructor() {
    // 监听其他标签页的缓存变化
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('cache_')) {
        this.handleCacheChange(event)
      }
    })
  }

  private handleCacheChange(event: StorageEvent) {
    // 处理缓存同步逻辑
    console.log('缓存已在其他标签页更新:', event.key)
  }

  // 实现 CacheStorage 接口...
}
```

### 智能缓存失效

```typescript
const cachePlugin = createCachePlugin({
  enabled: true,

  // 智能失效策略
  invalidateOn: {
    // POST/PUT/DELETE 请求后失效相关缓存
    mutations: [
      {
        pattern: /^\/api\/users\/\d+$/,
        invalidates: ['/api/users', /^\/api\/users\/\d+$/]
      },
      {
        pattern: '/api/posts',
        invalidates: ['/api/posts', '/api/dashboard/stats']
      }
    ],

    // 基于响应头失效
    headers: ['Cache-Control', 'ETag', 'Last-Modified'],

    // 定时失效
    schedule: {
      '0 0 * * *': ['/api/daily-stats'], // 每天午夜失效
      '0 */6 * * *': ['/api/config'] // 每6小时失效
    }
  }
})
```

## 📈 性能优化

### 缓存压缩

```typescript
import { compress, decompress } from 'lz-string'

class CompressedCacheStorage implements CacheStorage {
  private storage = createLocalStorageCache()

  async set(key: string, value: CacheItem): Promise<void> {
    const compressed = {
      ...value,
      data: compress(JSON.stringify(value.data))
    }
    await this.storage.set(key, compressed)
  }

  async get(key: string): Promise<CacheItem | null> {
    const item = await this.storage.get(key)
    if (!item)
return null

    return {
      ...item,
      data: JSON.parse(decompress(item.data))
    }
  }

  // 其他方法...
}
```

### 缓存分层

```typescript
class TieredCacheStorage implements CacheStorage {
  private l1Cache = createMemoryCache() // 一级缓存：内存
  private l2Cache = createLocalStorageCache() // 二级缓存：localStorage

  async get(key: string): Promise<CacheItem | null> {
    // 先查一级缓存
    let item = await this.l1Cache.get(key)
    if (item)
return item

    // 再查二级缓存
    item = await this.l2Cache.get(key)
    if (item) {
      // 提升到一级缓存
      await this.l1Cache.set(key, item)
    }

    return item
  }

  async set(key: string, value: CacheItem): Promise<void> {
    // 同时写入两级缓存
    await Promise.all([
      this.l1Cache.set(key, value),
      this.l2Cache.set(key, value)
    ])
  }

  // 其他方法...
}
```

## 📚 最佳实践

### 1. 合理设置TTL

```typescript
// ✅ 根据数据特性设置TTL
const cachePlugin = createCachePlugin({
  ttl: 5 * 60 * 1000, // 默认5分钟

  // 不同类型数据使用不同TTL
  customTTL: {
    '/api/config': 60 * 60 * 1000, // 配置数据：1小时
    '/api/users': 10 * 60 * 1000, // 用户数据：10分钟
    '/api/realtime': 30 * 1000, // 实时数据：30秒
    '/api/static': 24 * 60 * 60 * 1000 // 静态数据：24小时
  }
})
```

### 2. 缓存键设计

```typescript
// ✅ 包含影响响应的所有因素
function keyGenerator(config) {
  const parts = [
    config.method,
    config.url,
    JSON.stringify(config.params),
    config.headers?.['Accept-Language'], // 语言
    config.headers?.Authorization?.slice(-8) // 用户标识
  ]
  return parts.filter(Boolean).join(':')
}
```

### 3. 缓存监控

```typescript
// ✅ 监控缓存性能
function monitorCache() {
  setInterval(async () => {
    const stats = await cachePlugin.getStats()

    console.log('缓存统计:', {
      hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
      size: stats.size,
      memory: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`
    })

    // 命中率过低时告警
    if (stats.hitRate < 0.3) {
      console.warn('缓存命中率过低，请检查缓存策略')
    }
  }, 60000) // 每分钟检查一次
}
```

## 📚 下一步

了解缓存插件后，你可以继续学习：

- [重试插件](/plugins/retry) - 智能重试机制
- [拦截器插件](/plugins/interceptors) - 预置拦截器
- [插件开发](/plugins/development) - 开发自定义插件
- [性能优化](/guide/performance) - 性能优化技巧
