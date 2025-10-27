# 重试机制

@ldesign/http 提供了智能的重试机制，可以自动重试失败的请求，提高应用的可靠性。

## 基础用法

### 启用重试

```typescript
import { createHttpClient } from '@ldesign/http'

const client = await createHttpClient({
  baseURL: 'https://api.example.com',
  retry: {
    enabled: true,
    maxAttempts: 3,      // 最多重试 3 次
    delay: 1000,         // 每次重试延迟 1 秒
    backoff: 'exponential' // 指数退避
  }
})

// 请求失败会自动重试
try {
  const response = await client.get('/api/data')
} catch (error) {
  // 重试 3 次后仍然失败
  console.error('请求失败:', error)
}
```

### 请求级重试

每个请求可以单独配置重试：

```typescript
// 使用自定义重试配置
await client.get('/critical-api', {
  retry: {
    enabled: true,
    maxAttempts: 5,    // 重要接口多重试几次
    delay: 2000
  }
})

// 禁用重试
await client.get('/no-retry-api', {
  retry: {
    enabled: false
  }
})
```

## 重试配置

### 完整配置选项

```typescript
const client = await createHttpClient({
  retry: {
    // 是否启用重试
    enabled: true,
    
    // 最大重试次数
    maxAttempts: 3,
    
    // 重试延迟（毫秒）
    delay: 1000,
    
    // 退避策略
    backoff: 'exponential', // 'fixed' | 'linear' | 'exponential'
    
    // 最大延迟时间（毫秒）
    maxDelay: 30000,
    
    // 重试条件
    condition: (error) => {
      // 只重试网络错误和 5xx 错误
      return error.isNetworkError || 
             (error.response?.status >= 500 && error.response?.status < 600)
    },
    
    // 重试前的回调
    onRetry: (error, attempt) => {
      console.log(`第 ${attempt} 次重试:`, error.message)
    },
    
    // 重试失败的回调
    onMaxAttempts: (error) => {
      console.error('达到最大重试次数:', error)
    }
  }
})
```

## 退避策略

### 固定延迟（Fixed）

每次重试使用相同的延迟时间：

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000,
    backoff: 'fixed'
  }
})

// 重试延迟: 1秒 -> 1秒 -> 1秒
```

### 线性退避（Linear）

每次重试延迟线性增加：

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000,
    backoff: 'linear'
  }
})

// 重试延迟: 1秒 -> 2秒 -> 3秒
```

### 指数退避（Exponential）

每次重试延迟指数增加（推荐）：

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
})

// 重试延迟: 1秒 -> 2秒 -> 4秒 -> 8秒
```

### 自定义退避

使用自定义延迟函数：

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 5,
    delayFn: (attempt) => {
      // 自定义延迟算法
      // 第1次: 1秒，第2次: 2秒，第3次: 5秒，第4次: 10秒
      return Math.min(1000 * Math.pow(2, attempt - 1), 10000)
    }
  }
})
```

## 重试条件

### 默认重试条件

默认情况下，只重试以下情况：
- 网络错误
- 超时错误
- 5xx 服务器错误

### 自定义重试条件

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 3,
    condition: (error) => {
      // 重试网络错误
      if (error.isNetworkError) return true
      
      // 重试超时错误
      if (error.isTimeoutError) return true
      
      // 重试 500, 502, 503, 504
      if (error.response?.status === 500 ||
          error.response?.status === 502 ||
          error.response?.status === 503 ||
          error.response?.status === 504) {
        return true
      }
      
      // 重试特定的错误代码
      if (error.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
        return true
      }
      
      return false
    }
  }
})
```

### 基于响应内容的重试

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    condition: (error) => {
      // 检查响应数据
      const data = error.response?.data
      
      // 如果服务器明确说明可以重试
      if (data?.retryable === true) {
        return true
      }
      
      // 如果错误消息包含 "retry"
      if (data?.message?.includes('retry')) {
        return true
      }
      
      return false
    }
  }
})
```

## 智能重试

### 使用智能重试管理器

智能重试会根据历史数据自动调整重试策略：

```typescript
import { createSmartRetryManager } from '@ldesign/http'

const retryManager = createSmartRetryManager({
  // 基础配置
  maxAttempts: 5,
  delay: 1000,
  
  // 智能配置
  adaptive: true,        // 启用自适应重试
  learningRate: 0.1,     // 学习率
  successThreshold: 0.8, // 成功阈值
  
  // 熔断配置
  circuitBreaker: {
    enabled: true,
    threshold: 0.5,      // 错误率阈值
    timeout: 60000,      // 熔断超时时间
    minimumRequests: 10  // 最小请求数
  }
})

const client = await createHttpClient({
  retry: {
    manager: retryManager
  }
})
```

### 自适应重试

根据接口的成功率动态调整重试次数：

```typescript
const retryManager = createSmartRetryManager({
  adaptive: true,
  
  // 高成功率接口：少重试
  // 低成功率接口：多重试
  adaptiveConfig: {
    minAttempts: 1,
    maxAttempts: 5,
    adjustmentFactor: 0.5
  }
})
```

### 熔断器

当错误率过高时，自动熔断，避免雪崩：

```typescript
const retryManager = createSmartRetryManager({
  circuitBreaker: {
    enabled: true,
    threshold: 0.5,      // 50% 错误率触发熔断
    timeout: 60000,      // 熔断 60 秒
    minimumRequests: 10, // 至少 10 个请求才计算错误率
    
    // 熔断时的回调
    onOpen: () => {
      console.warn('熔断器打开')
    },
    
    // 恢复时的回调
    onClose: () => {
      console.info('熔断器关闭')
    }
  }
})
```

## 重试策略

### 针对不同错误的策略

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    strategies: {
      // 网络错误：快速重试
      network: {
        maxAttempts: 5,
        delay: 500,
        backoff: 'exponential'
      },
      
      // 超时错误：延长重试间隔
      timeout: {
        maxAttempts: 3,
        delay: 2000,
        backoff: 'linear'
      },
      
      // 服务器错误：缓慢重试
      server: {
        maxAttempts: 3,
        delay: 5000,
        backoff: 'exponential'
      },
      
      // 限流错误：根据 Retry-After 头重试
      rateLimit: {
        maxAttempts: 2,
        useRetryAfter: true
      }
    }
  }
})
```

### Retry-After 头支持

自动根据服务器的 Retry-After 头决定重试时间：

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    respectRetryAfter: true, // 尊重 Retry-After 头
    
    condition: (error) => {
      // 429 Too Many Requests
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after']
        if (retryAfter) {
          // 服务器会告诉我们何时重试
          return true
        }
      }
      return false
    }
  }
})
```

## 重试回调

### 监控重试过程

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    maxAttempts: 3,
    
    // 重试开始
    onRetryStart: (error, attempt) => {
      console.log(`开始第 ${attempt} 次重试`)
    },
    
    // 重试中
    onRetry: (error, attempt) => {
      console.log(`正在进行第 ${attempt} 次重试`)
      
      // 上报到监控系统
      reportRetry({
        url: error.config.url,
        attempt,
        error: error.message
      })
    },
    
    // 重试成功
    onRetrySuccess: (response, attempt) => {
      console.log(`第 ${attempt} 次重试成功`)
    },
    
    // 重试失败
    onRetryFailed: (error, attempt) => {
      console.log(`第 ${attempt} 次重试失败`)
    },
    
    // 达到最大重试次数
    onMaxAttempts: (error) => {
      console.error('达到最大重试次数，请求失败')
      
      // 显示友好的错误提示
      showErrorNotification('服务暂时不可用，请稍后再试')
    }
  }
})
```

## 与拦截器结合

### 使用重试拦截器

```typescript
import { createRetryInterceptor } from '@ldesign/http'

const retryInterceptor = createRetryInterceptor({
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
  
  condition: (error) => {
    return error.isNetworkError || error.response?.status >= 500
  },
  
  onRetry: (error, attempt) => {
    console.log(`重试 ${attempt}:`, error.message)
  }
})

// 添加到响应拦截器
client.addResponseInterceptor(
  (response) => response,
  retryInterceptor
)
```

## 重试统计

### 获取重试统计

```typescript
import { createSmartRetryManager } from '@ldesign/http'

const retryManager = createSmartRetryManager({
  stats: true // 启用统计
})

// 获取统计信息
const stats = retryManager.getStats()

console.log('总重试次数:', stats.totalRetries)
console.log('成功重试次数:', stats.successfulRetries)
console.log('失败重试次数:', stats.failedRetries)
console.log('平均重试次数:', stats.averageRetries)
console.log('重试成功率:', stats.retrySuccessRate)

// 按接口统计
console.log('接口重试统计:', stats.byEndpoint)

// 按错误类型统计
console.log('错误类型统计:', stats.byErrorType)
```

## 最佳实践

### 1. 合理设置重试次数

```typescript
// 读操作：可以多重试几次
await client.get('/users', {
  retry: { maxAttempts: 5 }
})

// 写操作：谨慎重试，避免重复提交
await client.post('/orders', orderData, {
  retry: { 
    maxAttempts: 1, // 最多重试一次
    condition: (error) => {
      // 只重试网络错误，不重试业务错误
      return error.isNetworkError
    }
  }
})

// 幂等操作：可以安全重试
await client.put('/users/1', userData, {
  retry: { maxAttempts: 3 }
})

await client.delete('/users/1', {
  retry: { maxAttempts: 3 }
})
```

### 2. 使用幂等性键

对于非幂等操作，使用幂等性键避免重复执行：

```typescript
import { v4 as uuidv4 } from 'uuid'

// 生成幂等性键
const idempotencyKey = uuidv4()

await client.post('/orders', orderData, {
  headers: {
    'Idempotency-Key': idempotencyKey
  },
  retry: {
    maxAttempts: 3
  }
})
```

### 3. 区分错误类型

```typescript
const client = await createHttpClient({
  retry: {
    enabled: true,
    condition: (error) => {
      // ✅ 可以重试的错误
      // - 网络错误
      // - 超时错误
      // - 503 服务不可用
      // - 504 网关超时
      
      // ❌ 不应该重试的错误
      // - 400 请求错误（重试也会失败）
      // - 401 未授权（需要重新登录）
      // - 403 禁止访问（权限问题）
      // - 404 资源不存在（重试也找不到）
      
      return error.isNetworkError ||
             error.isTimeoutError ||
             error.response?.status === 503 ||
             error.response?.status === 504
    }
  }
})
```

### 4. 监控和告警

```typescript
const retryManager = createSmartRetryManager({
  onRetry: (error, attempt) => {
    // 重试超过 2 次时告警
    if (attempt > 2) {
      sendAlert({
        level: 'warning',
        message: `请求重试 ${attempt} 次`,
        url: error.config.url,
        error: error.message
      })
    }
  },
  
  onMaxAttempts: (error) => {
    // 达到最大重试次数时发送严重告警
    sendAlert({
      level: 'error',
      message: '请求失败（已达最大重试次数）',
      url: error.config.url,
      error: error.message
    })
  }
})
```

## 下一步

- [并发控制](/guide/concurrency) - 了解并发控制
- [错误处理](/guide/error-handling) - 深入了解错误处理
- [API 参考](/api/features/retry) - 查看完整的重试 API

