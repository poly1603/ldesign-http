# 缓存 API

缓存系统的 API 参考。

## CacheManager

### 方法

#### get

```typescript
get(key: string): Promise<CachedData | null>
```

#### set

```typescript
set(key: string, data: any, ttl?: number): Promise<void>
```

#### delete

```typescript
delete(key: string): Promise<void>
```

#### clear

```typescript
clear(): Promise<void>
```

#### has

```typescript
has(key: string): Promise<boolean>
```

#### invalidateByTag

```typescript
invalidateByTag(tag: string): Promise<void>
```

#### invalidateByDependency

```typescript
invalidateByDependency(dependency: string): Promise<void>
```

#### getStats

```typescript
getStats(): CacheStats
```

## 类型定义

### CacheConfig

```typescript
interface CacheConfig {
  enabled: boolean
  ttl?: number
  storage?: 'memory' | 'localStorage' | 'indexedDB'
  keyGenerator?: (config: RequestConfig) => string
  tags?: string[]
  dependencies?: string[]
}
```

### CacheStats

```typescript
interface CacheStats {
  hitRate: number
  size: number
  count: number
  hotKeys: string[]
}
```

## 下一步

- [缓存指南](/guide/caching) - 使用指南
- [缓存策略](/examples/cache-strategies) - 示例