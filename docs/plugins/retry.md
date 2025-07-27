# 重试插件

重试插件为 @ldesign/http 提供智能重试机制，可以自动重试失败的请求，提高应用的可靠性。

## 🎯 功能特性

- **多种重试策略** - 固定延迟、指数退避、线性增长
- **智能重试条件** - 可配置的重试条件判断
- **重试事件监听** - 监听重试过程和结果
- **最大重试限制** - 防止无限重试
- **延迟抖动** - 避免雷群效应
- **重试统计** - 重试次数和成功率统计

## 🚀 快速开始

### 基础使用

```typescript
import { createHttpClient, createRetryPlugin } from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://api.example.com'
})

// 创建重试插件
const retryPlugin = createRetryPlugin({
  retries: 3, // 最大重试次数
  retryDelay: 1000, // 重试延迟 (毫秒)
  retryCondition: (error) => {
    // 只重试网络错误和5xx错误
    return error.isNetworkError
      || error.isTimeoutError
      || (error.status >= 500 && error.status < 600)
  }
})

// 安装插件
retryPlugin.install(client)

// 现在失败的请求会自动重试
try {
  const response = await client.get('/unreliable-endpoint')
  console.log('请求成功:', response.data)
}
 catch (error) {
  console.log('重试后仍然失败:', error.message)
}
```

### 快速配置

```typescript
import { createQuickClient } from '@ldesign/http'

const client = createQuickClient({
  baseURL: 'https://api.example.com',
  enableRetry: true, // 启用重试
  retryOptions: {
    retries: 5,
    strategy: 'exponential'
  }
})
```

## ⚙️ 配置选项

### RetryConfig

```typescript
interface RetryConfig {
  retries?: number // 最大重试次数 (默认: 3)
  retryDelay?: number // 基础重试延迟 (默认: 1000ms)
  strategy?: RetryStrategy // 重试策略 (默认: 'fixed')
  maxDelay?: number // 最大延迟时间 (默认: 30000ms)
  jitter?: number // 延迟抖动因子 (默认: 0.1)
  retryCondition?: (error: HttpError) => boolean // 重试条件
  onRetry?: (error: HttpError, retryCount: number) => void // 重试回调
  onRetryFailed?: (error: HttpError, retryCount: number) => void // 重试失败回调
}

type RetryStrategy = 'fixed' | 'exponential' | 'linear' | 'custom'
```

### 详细配置

```typescript
const retryPlugin = createRetryPlugin({
  retries: 5, // 最多重试5次
  retryDelay: 1000, // 基础延迟1秒
  strategy: 'exponential', // 指数退避策略
  maxDelay: 30000, // 最大延迟30秒
  jitter: 0.2, // 20%的随机抖动

  // 自定义重试条件
  retryCondition: (error) => {
    // 不重试客户端错误 (4xx)
    if (error.status >= 400 && error.status < 500) {
      return false
    }

    // 重试网络错误、超时错误和服务器错误
    return error.isNetworkError
      || error.isTimeoutError
      || error.status >= 500
  },

  // 重试回调
  onRetry: (error, retryCount) => {
    console.log(`第${retryCount}次重试: ${error.message}`)

    // 可以在这里添加用户提示
    showNotification(`请求失败，正在重试 (${retryCount}/5)`, 'warning')
  },

  // 重试失败回调
  onRetryFailed: (error, retryCount) => {
    console.log(`重试${retryCount}次后仍然失败: ${error.message}`)

    // 记录错误日志
    logError('Retry failed', {
      error: error.message,
      retryCount,
      url: error.request?.url
    })
  }
})
```

## 🔄 重试策略

### 固定延迟 (Fixed)

每次重试使用相同的延迟时间。

```typescript
const retryPlugin = createRetryPlugin({
  strategy: 'fixed',
  retryDelay: 2000 // 每次重试都等待2秒
})

// 重试时间: 2s, 2s, 2s, 2s...
```

### 指数退避 (Exponential)

延迟时间按指数增长，适合处理服务器过载情况。

```typescript
const retryPlugin = createRetryPlugin({
  strategy: 'exponential',
  retryDelay: 1000, // 基础延迟1秒
  maxDelay: 30000 // 最大延迟30秒
})

// 重试时间: 1s, 2s, 4s, 8s, 16s, 30s, 30s...
```

### 线性增长 (Linear)

延迟时间线性增长。

```typescript
const retryPlugin = createRetryPlugin({
  strategy: 'linear',
  retryDelay: 1000 // 每次增加1秒
})

// 重试时间: 1s, 2s, 3s, 4s, 5s...
```

### 自定义策略 (Custom)

完全自定义延迟计算逻辑。

```typescript
const retryPlugin = createRetryPlugin({
  strategy: 'custom',
  delayCalculator: (retryCount, error) => {
    // 根据错误类型使用不同的延迟策略
    if (error.status === 429) {
      // 限流错误使用更长的延迟
      return Math.min(5000 * 2 ** retryCount, 60000)
    }
 else if (error.isNetworkError) {
      // 网络错误使用固定延迟
      return 3000
    }
 else {
      // 其他错误使用指数退避
      return Math.min(1000 * 2 ** retryCount, 30000)
    }
  }
})
```

## 🎛️ 重试条件

### 内置条件

```typescript
// 只重试网络相关错误
const networkRetryPlugin = createRetryPlugin({
  retryCondition: (error) => {
    return error.isNetworkError || error.isTimeoutError
  }
})

// 只重试服务器错误
const serverErrorRetryPlugin = createRetryPlugin({
  retryCondition: (error) => {
    return error.status >= 500 && error.status < 600
  }
})

// 重试特定状态码
const specificRetryPlugin = createRetryPlugin({
  retryCondition: (error) => {
    const retryableStatuses = [408, 429, 502, 503, 504]
    return retryableStatuses.includes(error.status)
  }
})
```

### 复杂条件

```typescript
const smartRetryPlugin = createRetryPlugin({
  retryCondition: (error) => {
    // 不重试认证错误
    if (error.status === 401 || error.status === 403) {
      return false
    }

    // 不重试客户端错误 (除了特定的几个)
    if (error.status >= 400 && error.status < 500) {
      const retryableClientErrors = [408, 429]
      return retryableClientErrors.includes(error.status)
    }

    // 重试网络错误
    if (error.isNetworkError || error.isTimeoutError) {
      return true
    }

    // 重试服务器错误
    if (error.status >= 500) {
      return true
    }

    // 根据错误消息判断
    if (error.message.includes('ECONNRESET')
      || error.message.includes('ETIMEDOUT')) {
      return true
    }

    return false
  }
})
```

## 📊 重试统计

### 获取统计信息

```typescript
const retryPlugin = createRetryPlugin({
  retries: 3,
  strategy: 'exponential'
})

retryPlugin.install(client)

// 发送一些请求后获取统计信息
const stats = retryPlugin.getStats()

console.log('重试统计:', {
  totalRequests: stats.totalRequests, // 总请求数
  retriedRequests: stats.retriedRequests, // 重试的请求数
  totalRetries: stats.totalRetries, // 总重试次数
  successAfterRetry: stats.successAfterRetry, // 重试后成功的请求数
  retrySuccessRate: stats.retrySuccessRate // 重试成功率
})
```

### 重试事件监听

```typescript
// 监听重试事件
client.on('retry', (event) => {
  console.log('重试事件:', {
    url: event.config.url,
    method: event.config.method,
    retryCount: event.retryCount,
    error: event.error.message,
    nextDelay: event.nextDelay
  })
})

// 监听重试成功事件
client.on('retry-success', (event) => {
  console.log('重试成功:', {
    url: event.config.url,
    totalRetries: event.totalRetries,
    totalTime: event.totalTime
  })
})

// 监听重试失败事件
client.on('retry-failed', (event) => {
  console.log('重试失败:', {
    url: event.config.url,
    totalRetries: event.totalRetries,
    finalError: event.error.message
  })
})
```

## 🎨 Vue 集成

### 重试状态显示

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useHttp } from '@ldesign/http'

const http = useHttp()
const loading = ref(false)
const result = ref(null)
const error = ref(null)

const retryInfo = reactive({
  isRetrying: false,
  currentRetry: 0,
  maxRetries: 3,
  countdown: 0,
  totalRetries: 0
})

let countdownTimer: NodeJS.Timeout | null = null

// 监听重试事件
http.on('retry', (event) => {
  retryInfo.isRetrying = true
  retryInfo.currentRetry = event.retryCount
  retryInfo.countdown = Math.ceil(event.nextDelay / 1000)

  // 开始倒计时
  if (countdownTimer)
clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    retryInfo.countdown--
    if (retryInfo.countdown <= 0) {
      clearInterval(countdownTimer!)
    }
  }, 1000)
})

http.on('retry-success', (event) => {
  retryInfo.isRetrying = false
  retryInfo.totalRetries = event.totalRetries
  if (countdownTimer)
clearInterval(countdownTimer)
})

http.on('retry-failed', (event) => {
  retryInfo.isRetrying = false
  retryInfo.totalRetries = event.totalRetries
  if (countdownTimer)
clearInterval(countdownTimer)
})

async function makeRequest() {
  loading.value = true
  result.value = null
  error.value = null
  retryInfo.isRetrying = false
  retryInfo.currentRetry = 0
  retryInfo.totalRetries = 0

  try {
    // 使用一个不稳定的API来演示重试
    const response = await http.get('https://httpbin.org/status/500')
    result.value = response.data
  }
 catch (err: any) {
    error.value = err
  }
 finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="retry-demo">
    <button :disabled="loading" @click="makeRequest">
      {{ loading ? '请求中...' : '发送请求' }}
    </button>

    <div v-if="retryInfo.isRetrying" class="retry-status">
      <div class="retry-message">
        请求失败，正在重试... ({{ retryInfo.currentRetry }}/{{ retryInfo.maxRetries }})
      </div>
      <div class="retry-progress">
        <div
          class="progress-bar"
          :style="{ width: `${(retryInfo.currentRetry / retryInfo.maxRetries) * 100}%` }"
        />
      </div>
      <div class="retry-countdown">
        下次重试倒计时: {{ retryInfo.countdown }}s
      </div>
    </div>

    <div v-if="result" class="result">
      <h3>请求结果:</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>

    <div v-if="error" class="error">
      <h3>最终错误:</h3>
      <p>{{ error.message }}</p>
      <p>重试次数: {{ retryInfo.totalRetries }}</p>
    </div>
  </div>
</template>

<style scoped>
.retry-demo {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.retry-status {
  margin: 20px 0;
  padding: 15px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}

.retry-message {
  font-weight: bold;
  margin-bottom: 10px;
}

.retry-progress {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background: #ffc107;
  transition: width 0.3s ease;
}

.retry-countdown {
  font-size: 14px;
  color: #856404;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
}

.error {
  margin-top: 20px;
  padding: 15px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
```

### 重试组合式函数

```typescript
// composables/useRetry.ts
import { computed, ref } from 'vue'
import { useHttp } from '@ldesign/http'

export function useRetry() {
  const http = useHttp()
  const retryStats = ref({
    totalRequests: 0,
    retriedRequests: 0,
    totalRetries: 0,
    successAfterRetry: 0
  })

  const retrySuccessRate = computed(() => {
    if (retryStats.value.retriedRequests === 0)
return 0
    return (retryStats.value.successAfterRetry / retryStats.value.retriedRequests) * 100
  })

  const updateStats = () => {
    const plugin = http.getPlugin('retry')
    if (plugin) {
      retryStats.value = plugin.getStats()
    }
  }

  const resetStats = () => {
    const plugin = http.getPlugin('retry')
    if (plugin) {
      plugin.resetStats()
      updateStats()
    }
  }

  return {
    retryStats: computed(() => retryStats.value),
    retrySuccessRate,
    updateStats,
    resetStats
  }
}
```

## 🔧 高级功能

### 条件重试

```typescript
// 根据响应内容决定是否重试
const conditionalRetryPlugin = createRetryPlugin({
  retryCondition: (error) => {
    // 检查响应数据
    if (error.response?.data?.retryable === false) {
      return false
    }

    // 检查特定错误码
    if (error.response?.data?.errorCode === 'PERMANENT_FAILURE') {
      return false
    }

    return error.status >= 500
  }
})
```

### 重试限流

```typescript
// 限制重试频率
class RateLimitedRetryPlugin {
  private retryCount = 0
  private windowStart = Date.now()
  private readonly maxRetriesPerWindow = 10
  private readonly windowSize = 60000 // 1分钟

  createPlugin() {
    return createRetryPlugin({
      retryCondition: (error) => {
        const now = Date.now()

        // 重置窗口
        if (now - this.windowStart > this.windowSize) {
          this.retryCount = 0
          this.windowStart = now
        }

        // 检查是否超过限制
        if (this.retryCount >= this.maxRetriesPerWindow) {
          console.warn('重试次数超过限制，暂停重试')
          return false
        }

        this.retryCount++
        return error.status >= 500
      }
    })
  }
}
```

### 智能退避

```typescript
// 根据服务器响应调整重试策略
const adaptiveRetryPlugin = createRetryPlugin({
  strategy: 'custom',
  delayCalculator: (retryCount, error) => {
    // 检查 Retry-After 头
    const retryAfter = error.response?.headers['retry-after']
    if (retryAfter) {
      const delay = Number.parseInt(retryAfter) * 1000
      return Math.min(delay, 60000) // 最多等待1分钟
    }

    // 检查 X-RateLimit-Reset 头
    const rateLimitReset = error.response?.headers['x-ratelimit-reset']
    if (rateLimitReset && error.status === 429) {
      const resetTime = Number.parseInt(rateLimitReset) * 1000
      const delay = resetTime - Date.now()
      return Math.max(delay, 1000) // 至少等待1秒
    }

    // 默认指数退避
    return Math.min(1000 * 2 ** retryCount, 30000)
  }
})
```

## 📚 最佳实践

### 1. 合理设置重试次数

```typescript
// ✅ 根据场景设置合适的重试次数
const retryPlugin = createRetryPlugin({
  retries: 3, // 对于大多数场景，3次重试是合理的

  // 对于关键操作，可以增加重试次数
  retryCondition: (error) => {
    const isCriticalOperation = error.request?.url?.includes('/critical/')
    const maxRetries = isCriticalOperation ? 5 : 3

    return error.retryCount < maxRetries && error.status >= 500
  }
})
```

### 2. 避免重试敏感操作

```typescript
// ✅ 不重试可能产生副作用的操作
const safeRetryPlugin = createRetryPlugin({
  retryCondition: (error) => {
    // 不重试写操作
    const writeOperations = ['POST', 'PUT', 'PATCH', 'DELETE']
    if (writeOperations.includes(error.request?.method?.toUpperCase())) {
      return false
    }

    // 只重试读操作
    return error.request?.method?.toUpperCase() === 'GET' && error.status >= 500
  }
})
```

### 3. 监控重试性能

```typescript
// ✅ 监控重试对性能的影响
const monitoredRetryPlugin = createRetryPlugin({
  onRetry: (error, retryCount) => {
    // 记录重试指标
    metrics.increment('http.retry.count', {
      url: error.request?.url,
      status: error.status,
      retryCount
    })
  },

  onRetryFailed: (error, retryCount) => {
    // 记录重试失败
    metrics.increment('http.retry.failed', {
      url: error.request?.url,
      totalRetries: retryCount
    })
  }
})
```

## 📚 下一步

了解重试插件后，你可以继续学习：

- [缓存插件](/plugins/cache) - 智能缓存系统
- [拦截器插件](/plugins/interceptors) - 预置拦截器
- [插件开发](/plugins/development) - 开发自定义插件
- [错误处理](/guide/error-handling) - 错误处理策略
