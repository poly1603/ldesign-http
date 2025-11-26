# 重试 API

重试机制的 API 参考。

## RetryManager

### 构造函数

```typescript
constructor(config: RetryConfig)
```

### 方法

#### retry

```typescript
retry<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>
```

#### getStats

```typescript
getStats(): RetryStats
```

## 类型定义

### RetryConfig

```typescript
interface RetryConfig {
  enabled: boolean
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  condition?: (error: any) => boolean
  delayFn?: (attempt: number) => number
  onRetry?: (attempt: number, error: any) => void
  onMaxRetries?: (error: any) => void
}
```

### RetryStats

```typescript
interface RetryStats {
  totalRetries: number
  successfulRetries: number
  failedRetries: number
}
```

## 下一步

- [重试指南](/guide/retry) - 使用指南