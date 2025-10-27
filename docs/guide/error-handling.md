# 错误处理

@ldesign/http 提供了完善的错误处理机制，帮助你优雅地处理各种错误情况。

## 错误类型

### HTTP 错误

HTTP 状态码表示的错误（4xx、5xx）：

```typescript
try {
  await client.get('/api/data')
} catch (error) {
  if (error.response) {
    // 服务器返回了错误响应
    console.log('状态码:', error.response.status)
    console.log('状态文本:', error.response.statusText)
    console.log('响应数据:', error.response.data)
    console.log('响应头:', error.response.headers)
  }
}
```

### 网络错误

网络连接失败的错误：

```typescript
try {
  await client.get('/api/data')
} catch (error) {
  if (error.request && !error.response) {
    // 请求已发送，但没有收到响应
    console.error('网络错误或服务器无响应')
  }
}
```

### 超时错误

请求超时的错误：

```typescript
try {
  await client.get('/api/data', { timeout: 5000 })
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    console.error('请求超时')
  }
}
```

### 取消错误

请求被取消的错误：

```typescript
const controller = new AbortController()

try {
  const request = client.get('/api/data', {
    signal: controller.signal
  })
  
  controller.abort()
  
  await request
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('请求已取消')
  }
}
```

## 错误检测

### 类型守卫

使用类型守卫检测错误类型：

```typescript
import {
  isHttpError,
  isNetworkError,
  isTimeoutError,
  isAbortError
} from '@ldesign/http'

try {
  await client.get('/api/data')
} catch (error) {
  if (isHttpError(error)) {
    console.log('HTTP 错误:', error.response?.status)
  } else if (isNetworkError(error)) {
    console.log('网络错误')
  } else if (isTimeoutError(error)) {
    console.log('超时错误')
  } else if (isAbortError(error)) {
    console.log('取消错误')
  } else {
    console.log('未知错误:', error)
  }
}
```

### 错误分类

根据状态码分类错误：

```typescript
function classifyError(error: any) {
  if (!error.response) {
    return 'network'
  }

  const status = error.response.status

  if (status >= 400 && status < 500) {
    return 'client' // 客户端错误
  } else if (status >= 500) {
    return 'server' // 服务器错误
  }

  return 'unknown'
}

try {
  await client.get('/api/data')
} catch (error) {
  const errorType = classifyError(error)
  
  switch (errorType) {
    case 'client':
      console.error('客户端错误，请检查请求参数')
      break
    case 'server':
      console.error('服务器错误，请稍后重试')
      break
    case 'network':
      console.error('网络错误，请检查网络连接')
      break
  }
}
```

## 错误处理策略

### 统一错误处理

使用拦截器统一处理错误：

```typescript
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          alert('请求参数错误')
          break
        case 401:
          // 未授权，跳转登录
          window.location.href = '/login'
          break
        case 403:
          alert('权限不足')
          break
        case 404:
          alert('资源不存在')
          break
        case 500:
          alert('服务器错误')
          break
        default:
          alert(data?.message || '请求失败')
      }
    } else if (error.request) {
      alert('网络错误，请检查网络连接')
    } else {
      alert('请求配置错误')
    }

    return Promise.reject(error)
  }
)
```

### 错误重试

自动重试失败的请求：

```typescript
client.addResponseInterceptor(
  (response) => response,
  async (error) => {
    const config = error.config

    // 设置重试次数
    config.retryCount = config.retryCount || 0

    // 达到最大重试次数
    if (config.retryCount >= 3) {
      return Promise.reject(error)
    }

    // 增加重试计数
    config.retryCount++

    // 等待一段时间后重试
    await new Promise(resolve => setTimeout(resolve, 1000 * config.retryCount))

    // 重试请求
    return client.request(config)
  }
)
```

## 错误恢复

### 自动错误恢复

```typescript
import { ErrorHandler, builtinRecoveryStrategies } from '@ldesign/http'

// 添加内置恢复策略
ErrorHandler.addRecoveryStrategy(builtinRecoveryStrategies.networkReconnect)
ErrorHandler.addRecoveryStrategy(builtinRecoveryStrategies.authRefresh)
ErrorHandler.addRecoveryStrategy(builtinRecoveryStrategies.serviceFallback)

try {
  await client.get('/api/data')
} catch (error) {
  // 尝试自动恢复
  const recovered = await ErrorHandler.tryRecover(error)

  if (recovered) {
    console.log('错误已恢复')
    // 重试请求
    return client.request(error.config)
  } else {
    console.error('无法恢复错误')
    throw error
  }
}
```

### 自定义恢复策略

```typescript
// 添加自定义恢复策略
ErrorHandler.addRecoveryStrategy({
  name: 'custom-recovery',
  priority: 15,
  
  // 检查是否可以处理此错误
  canHandle: (error) => {
    return error.response?.status === 429 // Too Many Requests
  },
  
  // 恢复逻辑
  recover: async (error) => {
    // 获取重试延迟
    const retryAfter = error.response.headers['retry-after']
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000

    // 等待指定时间
    await new Promise(resolve => setTimeout(resolve, delay))

    return true // 表示恢复成功
  }
})
```

## 友好错误消息

### 获取用户友好的错误消息

```typescript
import { ErrorHandler } from '@ldesign/http'

try {
  await client.get('/api/data')
} catch (error) {
  // 获取友好的错误消息
  const userMessage = ErrorHandler.getUserFriendlyMessage(error)
  
  // 显示给用户
  alert(userMessage)
}
```

### 自定义错误消息

```typescript
ErrorHandler.setMessageMap({
  400: '请求参数错误，请检查输入',
  401: '请先登录',
  403: '您没有权限执行此操作',
  404: '请求的资源不存在',
  429: '请求过于频繁，请稍后再试',
  500: '服务器错误，请稍后再试',
  502: '服务暂时不可用',
  503: '服务维护中',
  504: '请求超时，请稍后再试'
})
```

## 错误日志

### 记录错误

```typescript
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    // 记录错误
    console.error('请求失败:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      timestamp: new Date().toISOString()
    })

    // 上报到错误监控系统
    reportError({
      type: 'http-error',
      error: error,
      context: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        data: error.config?.data
      }
    })

    return Promise.reject(error)
  }
)
```

### 错误统计

```typescript
import { ErrorHandler } from '@ldesign/http'

// 启用错误统计
ErrorHandler.enableStats()

// 获取错误统计
const stats = ErrorHandler.getStats()

console.log('错误统计:', {
  total: stats.total,
  byStatus: stats.byStatus,
  byType: stats.byType,
  mostCommon: stats.mostCommon
})
```

## 错误分析

### 分析错误模式

```typescript
import { ErrorAnalyzer } from '@ldesign/http'

// 获取错误历史
const errors = ErrorHandler.getErrorHistory()

// 分析错误模式
const analysis = ErrorAnalyzer.analyzeErrorPatterns(errors)

console.log('错误分析:', {
  patterns: analysis.patterns,
  recommendations: analysis.recommendations,
  trends: analysis.trends
})
```

### 错误预测

```typescript
// 预测可能的错误
const prediction = ErrorAnalyzer.predictErrors({
  url: '/api/users',
  method: 'GET',
  timeOfDay: new Date().getHours()
})

if (prediction.probability > 0.5) {
  console.warn('此请求可能失败:', prediction)
  
  // 采取预防措施
  // 例如：增加重试次数、使用缓存等
}
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
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { isHttpError } from '@ldesign/http'

const error = ref<Error | null>(null)

function handleError(err: Error) {
  if (isHttpError(err)) {
    error.value = err
  } else {
    throw err
  }
}

function retry() {
  error.value = null
  // 重试逻辑
}

// 提供错误处理函数
provide('handleError', handleError)
</script>
```

### React 错误边界

```typescript
import React from 'react'
import { isHttpError } from '@ldesign/http'

class ErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null }

  componentDidCatch(error: Error, errorInfo: any) {
    if (isHttpError(error)) {
      this.setState({
        error,
        errorInfo
      })
    } else {
      // 重新抛出非 HTTP 错误
      throw error
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h3>出错了</h3>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })}>
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## 降级处理

### 服务降级

```typescript
async function fetchDataWithFallback(url: string) {
  try {
    // 尝试从主服务获取
    return await client.get(url)
  } catch (error) {
    console.warn('主服务失败，使用备用服务')
    
    try {
      // 尝试从备用服务获取
      return await client.get(url, {
        baseURL: 'https://backup-api.example.com'
      })
    } catch (backupError) {
      console.warn('备用服务失败，使用缓存')
      
      // 使用缓存数据
      const cached = await cacheManager.get(url)
      if (cached) {
        return cached
      }
      
      // 都失败了，抛出错误
      throw error
    }
  }
}
```

### 功能降级

```typescript
async function fetchDataWithDegradation(url: string) {
  try {
    // 尝试获取完整数据
    return await client.get(url, {
      params: { detail: 'full' }
    })
  } catch (error) {
    console.warn('获取完整数据失败，降级为简略数据')
    
    try {
      // 降级：只获取简略数据
      return await client.get(url, {
        params: { detail: 'basic' }
      })
    } catch (degradedError) {
      console.warn('降级失败，使用静态数据')
      
      // 使用静态数据
      return { data: getStaticData() }
    }
  }
}
```

## 最佳实践

### 1. 分层错误处理

```typescript
// 第 1 层：请求级错误处理
try {
  const response = await client.get('/api/data')
  return response.data
} catch (error) {
  // 处理特定请求的错误
  console.error('获取数据失败:', error)
  throw error
}

// 第 2 层：业务级错误处理
async function getUserData(userId: number) {
  try {
    return await client.get(`/users/${userId}`)
  } catch (error) {
    // 处理业务逻辑相关的错误
    if (error.response?.status === 404) {
      throw new Error('用户不存在')
    }
    throw error
  }
}

// 第 3 层：全局错误处理
window.addEventListener('unhandledrejection', (event) => {
  // 处理未捕获的 Promise 错误
  console.error('未处理的错误:', event.reason)
  
  // 上报到监控系统
  reportError(event.reason)
})
```

### 2. 错误重试策略

```typescript
// 只重试可恢复的错误
async function retryableRequest(url: string) {
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    try {
      return await client.get(url)
    } catch (error) {
      attempts++

      // 只重试网络错误和 5xx 错误
      const shouldRetry =
        error.isNetworkError ||
        (error.response?.status >= 500 && error.response?.status < 600)

      if (!shouldRetry || attempts >= maxAttempts) {
        throw error
      }

      // 指数退避
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempts) * 1000)
      )
    }
  }
}
```

### 3. 用户体验优化

```typescript
// 提供友好的错误提示和恢复选项
async function fetchWithUX(url: string) {
  try {
    // 显示加载状态
    showLoading()

    const response = await client.get(url)

    // 隐藏加载状态
    hideLoading()

    return response.data
  } catch (error) {
    // 隐藏加载状态
    hideLoading()

    // 显示友好的错误消息
    const message = ErrorHandler.getUserFriendlyMessage(error)
    showError(message)

    // 提供重试选项
    if (await confirm('是否重试？')) {
      return fetchWithUX(url)
    }

    throw error
  }
}
```

## 下一步

- [性能监控](/guide/monitoring) - 了解性能监控功能
- [重试机制](/guide/retry) - 深入了解重试机制
- [API 参考](/api/utils/error) - 查看完整的错误处理 API

