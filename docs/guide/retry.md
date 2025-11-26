# 重试机制

自动重试功能可以提高请求的可靠性，特别是在网络不稳定的环境中。

## 基础配置

### 全局重试

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: '/api',
  retry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000
  }
})
```

### 请求级别重试

```typescript
const response = await client.get('/users', {
  retry: {
    enabled: true,
    maxAttempts: 5,
    delay: 2000
  }
})
```

## 重试策略

### 线性退避

```typescript
const client = createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000,
    backoff: 'linear'
  }
})
// 重试延迟: 1s, 2s, 3s
```

### 指数退避

```typescript
const client = createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
})
// 重试延迟: 1s, 2s, 4s
```

### 自定义延迟函数

```typescript
const client = createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 3,
    delayFn: (attempt) => {
      return Math.min(1000 * Math.pow(2, attempt), 10000)
    }
  }
})
```

## 重试条件

### 默认重试条件

默认情况下，只重试以下错误：
- 网络错误
- 超时错误
- 5xx 服务器错误

### 自定义重试条件

```typescript
const client = createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 3,
    condition: (error) => {
      // 只重试特定状态码
      if (error.response) {
        return [408, 429, 500, 502, 503, 504].includes(error.response.status)
      }
      // 重试网络错误
      return error.isNetworkError
    }
  }
})
```

### 按 URL 重试

```typescript
const client = createHttpClient({
  retry: {
    enabled: true,
    condition: (error) => {
      // 只对特定 URL 重试
      return error.config.url?.startsWith('/api/critical')
    }
  }
})
```

## 重试事件

### 监听重试

```typescript
client.addRequestInterceptor((config) => {
  config.onRetry = (attempt, error) => {
    console.log(`第 ${attempt} 次重试`, error.message)
  }
  return config
})
```

### 重试回调

```typescript
const response = await client.get('/users', {
  retry: {
    enabled: true,
    maxAttempts: 3,
    onRetry: (attempt, error) => {
      console.log(`重试 ${attempt}/${3}`, error)
    },
    onMaxRetries: (error) => {
      console.error('达到最大重试次数', error)
    }
  }
})
```

## 智能重试

### 根据响应头重试

```typescript
const client = createHttpClient({
  retry: {
    enabled: true,
    delayFn: (attempt, error) => {
      // 使用 Retry-After 头
      const retryAfter = error.response?.headers['retry-after']
      if (retryAfter) {
        return parseInt(retryAfter) * 1000
      }
      return 1000 * attempt
    }
  }
})
```

### 速率限制重试

```typescript
const client = createHttpClient({
  retry: {
    enabled: true,
    condition: (error) => {
      return error.response?.status === 429
    },
    delayFn: (attempt, error) => {
      // 429 Too Many Requests - 等待更长时间
      return 5000 * attempt
    }
  }
})
```

## 重试管理器

### 创建重试管理器

```typescript
import { RetryManager } from '@ldesign/http-core'

const retryManager = new RetryManager({
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential'
})

const client = createHttpClient({
  retry: {
    manager: retryManager
  }
})
```

### 获取重试统计

```typescript
const stats = retryManager.getStats()

console.log('总重试次数:', stats.totalRetries)
console.log('成功重试:', stats.successfulRetries)
console.log('失败重试:', stats.failedRetries)
```

## 最佳实践

### 1. 幂等性检查

```typescript
const IDEMPOTENT_METHODS = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']

const client = createHttpClient({
  retry: {
    enabled: true,
    condition: (error) => {
      // 只重试幂等请求
      return IDEMPOTENT_METHODS.includes(error.config.method?.toUpperCase() || '')
    }
  }
})
```

### 2. 渐进式重试

```typescript
const client = createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 5,
    delayFn: (attempt) => {
      // 前 3 次快速重试，之后慢速重试
      if (attempt <= 3) {
        return 1000
      }
      return 5000 * (attempt - 2)
    }
  }
})
```

### 3. 重试预算

```typescript
class RetryBudget {
  private budget = 100
  private readonly maxBudget = 100
  
  canRetry(): boolean {
    return this.budget > 0
  }
  
  consume() {
    this.budget--
  }
  
  restore() {
    this.budget = Math.min(this.budget + 1, this.maxBudget)
  }
}

const budget = new RetryBudget()

const client = createHttpClient({
  retry: {
    enabled: true,
    condition: (error) => {
      return budget.canRetry()
    },
    onRetry: () => {
      budget.consume()
    }
  }
})
```

### 4. 断路器集成

```typescript
import { CircuitBreaker } from '@ldesign/http-core'

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000
})

const client = createHttpClient({
  retry: {
    enabled: true,
    condition: (error) => {
      // 断路器打开时不重试
      if (breaker.isOpen()) {
        return false
      }
      return error.isNetworkError || error.response?.status >= 500
    }
  }
})
```

## 禁用重试

### 全局禁用

```typescript
const client = createHttpClient({
  retry: {
    enabled: false
  }
})
```

### 单个请求禁用

```typescript
const response = await client.get('/users', {
  retry: false
})
```

## 下一步

- [错误处理](/guide/error-handling) - 学习错误处理
- [并发控制](/guide/concurrency) - 了解并发管理
- [重试 API](/api/retry) - 完整 API 参考