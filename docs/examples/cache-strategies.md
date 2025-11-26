# 缓存策略示例

缓存策略的完整示例。

## LRU 缓存策略

```typescript
import { createHttpClient, createAdvancedCacheManager } from '@ldesign/http-core'

const cacheManager = createAdvancedCacheManager({
  strategy: 'lru',
  maxSize: 50 * 1024 * 1024, // 50MB
  maxItems: 100
})

const client = createHttpClient({
  baseURL: '/api',
  cache: {
    enabled: true,
    manager: cacheManager
  }
})
```

## 标签失效

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

## 依赖管理

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

## 下一步

- [错误恢复](/examples/error-recovery) - 错误恢复示例
- [缓存指南](/guide/caching) - 缓存文档