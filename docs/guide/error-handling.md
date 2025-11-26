# 错误处理

完善的错误处理是构建健壮应用的关键。@ldesign/http 提供了多层次的错误处理机制。

## 错误类型

### HTTP 错误

服务器返回 4xx 或 5xx 状态码：

```typescript
try {
  await client.get('/users')
} catch (error) {
  if (error.response) {
    console.log('状态码:', error.response.status)
    console.log('错误数据:', error.response.data)
  }
}
```

### 网络错误

无法连接到服务器：

```typescript
try {
  await client.get('/users')
} catch (error) {
  if (error.request && !error.response) {
    console.log('网络错误')
  }
}
```

### 超时错误

请求超时：

```typescript
try {
  await client.get('/users', { timeout: 5000 })
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    console.log('请求超时')
  }
}
```

### 取消错误

请求被取消：

```typescript
const controller = new AbortController()

try {
  const promise = client.get('/users', {
    signal: controller.signal
  })
  controller.abort()
  await promise
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('请求已取消')
  }
}
```

## 类型守卫

### 使用类型守卫

```typescript
import { 
  isHttpError, 
  isNetworkError, 
  isTimeoutError,
  isCancelError 
} from '@ldesign/http-core'

try {
  await client.get('/users')
} catch (error) {
  if (isHttpError(error)) {
    console.log('HTTP 错误:', error.response?.status)
  } else if (isNetworkError(error)) {
    console.log('网络错误')
  } else if (isTimeoutError(error)) {
    console.log('超时错误')
  } else if (isCancelError(error)) {
    console.log('请求取消')
  }
}
```

## 全局错误处理

### 响应拦截器

```typescript
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未认证
          window.location.href = '/login'
          break
        case 403:
          // 无权限
          alert('权限不足')
          break
        case 404:
          // 未找到
          console.error('资源不存在')
          break
        case 500:
          // 服务器错误
          alert('服务器错误')
          break
      }
    }
    return Promise.reject(error)
  }
)
```

### 错误处理器

```typescript
import { ErrorHandler } from '@ldesign/http-core'

ErrorHandler.setGlobalHandler((error) => {
  // 记录错误
  console.error('[HTTP Error]', error)
  
  // 显示提示
  if (error.response?.status >= 500) {
    alert('服务器错误，请稍后重试')
  }
  
  // 上报错误
  reportError(error)
})
```

## 错误恢复

### 自动恢复策略

```typescript
import { 
  ErrorHandler,
  builtinRecoveryStrategies 
} from '@ldesign/http-core'

// 网络重连策略
ErrorHandler.addRecoveryStrategy(
  builtinRecoveryStrategies.networkReconnect
)

// 认证刷新策略
ErrorHandler.addRecoveryStrategy(
  builtinRecoveryStrategies.authRefresh
)

// 服务降级策略
ErrorHandler.addRecoveryStrategy(
  builtinRecoveryStrategies.serviceFallback
)
```

### 自定义恢复策略

```typescript
ErrorHandler.addRecoveryStrategy({
  name: 'rate-limit-retry',
  priority: 10,
  canHandle: (error) => {
    return error.response?.status === 429
  },
  recover: async (error) => {
    // 等待一段时间后重试
    const retryAfter = error.response.headers['retry-after']
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // 重试请求
    return await client.request(error.config)
  }
})
```

## 用户友好的错误消息

### 错误消息映射

```typescript
const ERROR_MESSAGES = {
  400: '请求参数错误',
  401: '请先登录',
  403: '权限不足',
  404: '资源不存在',
  408: '请求超时',
  429: '请求过于频繁',
  500: '服务器错误',
  502: '网关错误',
  503: '服务暂时不可用',
  504: '网关超时'
}

function getUserFriendlyMessage(error: any): string {
  if (error.response) {
    return ERROR_MESSAGES[error.response.status] || '请求失败'
  }
  if (error.request) {
    return '网络连接失败'
  }
  return '未知错误'
}
```

### 使用示例

```typescript
try {
  await client.get('/users')
} catch (error) {
  const message = getUserFriendlyMessage(error)
  alert(message)
}
```

## 错误分析

### 错误统计

```typescript
class ErrorAnalyzer {
  private errors: any[] = []
  
  record(error: any) {
    this.errors.push({
      timestamp: Date.now(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    })
  }
  
  getStats() {
    const total = this.errors.length
    const byStatus = this.groupBy('status')
    const byUrl = this.groupBy('url')
    
    return { total, byStatus, byUrl }
  }
  
  private groupBy(key: string) {
    return this.errors.reduce((acc, err) => {
      const value = err[key]
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }
}

const analyzer = new ErrorAnalyzer()

client.addResponseInterceptor(
  (response) => response,
  (error) => {
    analyzer.record(error)
    return Promise.reject(error)
  }
)
```

## 错误边界

### Vue 错误边界

```vue
<template>
  <div>
    <div v-if="error" class="error-boundary">
      <h3>出错了</h3>
      <p>{{ error.message }}</p>
      <button @click="retry">重试</button>
    </div>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const error = ref<Error | null>(null)

const retry = () => {
  error.value = null
  // 重试逻辑
}

// 捕获子组件错误
onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>
```

## 最佳实践

### 1. 分层错误处理

```typescript
// 业务层
async function getUsers() {
  try {
    return await client.get('/users')
  } catch (error) {
    // 业务错误处理
    throw new BusinessError('获取用户失败', error)
  }
}

// UI 层
try {
  const users = await getUsers()
} catch (error) {
  // UI 错误处理
  showErrorMessage(error.message)
}
```

### 2. 错误日志

```typescript
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    // 记录错误日志
    logger.error({
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      stack: error.stack
    })
    return Promise.reject(error)
  }
)
```

### 3. 错误上报

```typescript
function reportError(error: any) {
  // 上报到监控服务
  if (typeof window !== 'undefined') {
    fetch('/api/error-report', {
      method: 'POST',
      body: JSON.stringify({
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        userAgent: navigator.userAgent
      })
    }).catch(() => {
      // 上报失败，静默处理
    })
  }
}
```

## 下一步

- [重试机制](/guide/retry) - 了解自动重试
- [监控](/guide/monitoring) - 应用监控
- [并发控制](/guide/concurrency) - 并发管理