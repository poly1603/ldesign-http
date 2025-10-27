# 拦截器

拦截器是 @ldesign/http 最强大的功能之一，允许你在请求发送前和响应返回后执行自定义逻辑。

## 基础概念

拦截器分为两种类型：

- **请求拦截器** - 在请求发送前执行
- **响应拦截器** - 在响应返回后执行

## 请求拦截器

### 添加请求拦截器

```typescript
import { createHttpClient } from '@ldesign/http'

const client = await createHttpClient({
  baseURL: 'https://api.example.com'
})

// 添加请求拦截器
client.addRequestInterceptor((config) => {
  // 修改请求配置
  config.headers['X-Request-Time'] = Date.now().toString()
  config.headers['Authorization'] = `Bearer ${getToken()}`
  
  return config
})
```

### 异步请求拦截器

拦截器可以是异步的：

```typescript
client.addRequestInterceptor(async (config) => {
  // 异步获取令牌
  const token = await getTokenAsync()
  config.headers['Authorization'] = `Bearer ${token}`
  
  return config
})
```

### 条件拦截

只对特定请求生效：

```typescript
client.addRequestInterceptor((config) => {
  // 只对 API 请求添加认证
  if (config.url?.startsWith('/api/')) {
    config.headers['Authorization'] = `Bearer ${getToken()}`
  }
  
  return config
})
```

### 请求日志

记录所有请求：

```typescript
client.addRequestInterceptor((config) => {
  console.log(`[${config.method}] ${config.url}`, {
    params: config.params,
    data: config.data,
    headers: config.headers
  })
  
  return config
})
```

## 响应拦截器

### 添加响应拦截器

```typescript
client.addResponseInterceptor(
  // 成功回调
  (response) => {
    console.log('请求成功:', response.data)
    return response
  },
  
  // 错误回调
  (error) => {
    console.error('请求失败:', error.message)
    return Promise.reject(error)
  }
)
```

### 数据转换

统一处理响应数据格式：

```typescript
client.addResponseInterceptor((response) => {
  // API 返回格式: { code: 0, data: {...}, message: '' }
  const { code, data, message } = response.data
  
  if (code !== 0) {
    throw new Error(message || '请求失败')
  }
  
  // 直接返回数据部分
  response.data = data
  return response
})
```

### 错误处理

统一处理各种错误：

```typescript
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    // 处理 HTTP 错误
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 未认证
          console.error('请先登录')
          window.location.href = '/login'
          break
          
        case 403:
          // 无权限
          console.error('权限不足')
          break
          
        case 404:
          // 资源不存在
          console.error('资源不存在')
          break
          
        case 500:
          // 服务器错误
          console.error('服务器错误')
          break
          
        default:
          console.error(data?.message || '请求失败')
      }
    } 
    // 处理网络错误
    else if (error.request) {
      console.error('网络错误，请检查网络连接')
    } 
    // 其他错误
    else {
      console.error(error.message)
    }
    
    return Promise.reject(error)
  }
)
```

### 令牌刷新

自动刷新过期的令牌：

```typescript
client.addResponseInterceptor(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // 令牌过期
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // 刷新令牌
        const newToken = await refreshToken()
        
        // 更新令牌
        setToken(newToken)
        
        // 重试原请求
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return client.request(originalRequest)
      } catch (refreshError) {
        // 刷新失败，跳转登录
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)
```

## 内置拦截器

库提供了多个常用的内置拦截器。

### 认证拦截器

自动添加认证令牌：

```typescript
import { authInterceptor } from '@ldesign/http'

client.addRequestInterceptor(authInterceptor({
  // 令牌存储键
  tokenKey: 'accessToken',
  
  // 请求头名称
  headerName: 'Authorization',
  
  // 令牌前缀
  tokenPrefix: 'Bearer',
  
  // 获取令牌的函数
  getToken: () => localStorage.getItem('accessToken'),
  
  // 排除的路径
  exclude: ['/auth/login', '/auth/register']
}))
```

### 日志拦截器

记录请求和响应：

```typescript
import { loggingInterceptor } from '@ldesign/http'

client.addRequestInterceptor(loggingInterceptor({
  // 日志级别
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'
  
  // 包含请求头
  includeHeaders: true,
  
  // 包含请求体
  includeBody: true,
  
  // 自定义日志函数
  logger: (level, message, data) => {
    console[level](message, data)
  }
}))
```

### 重试拦截器

自动重试失败的请求：

```typescript
import { retryInterceptor } from '@ldesign/http'

client.addResponseInterceptor(retryInterceptor({
  // 最大重试次数
  maxAttempts: 3,
  
  // 重试延迟（毫秒）
  delay: 1000,
  
  // 退避策略
  backoff: 'exponential', // 'fixed' | 'linear' | 'exponential'
  
  // 重试条件
  condition: (error) => {
    // 只重试网络错误和 5xx 错误
    return error.isNetworkError || 
           (error.response?.status >= 500 && error.response?.status < 600)
  },
  
  // 重试前回调
  onRetry: (error, attempt) => {
    console.log(`第 ${attempt} 次重试:`, error.message)
  }
}))
```

### 缓存拦截器

添加请求缓存：

```typescript
import { cacheInterceptor } from '@ldesign/http'

client.addRequestInterceptor(cacheInterceptor({
  // 默认缓存时间（毫秒）
  ttl: 5 * 60 * 1000, // 5 分钟
  
  // 缓存键生成函数
  keyGenerator: (config) => {
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}`
  },
  
  // 只缓存 GET 请求
  methods: ['GET'],
  
  // 排除的路径
  exclude: ['/auth/*', '/user/profile']
}))
```

### 错误处理拦截器

统一错误处理：

```typescript
import { errorHandlingInterceptor } from '@ldesign/http'

client.addResponseInterceptor(errorHandlingInterceptor({
  // 显示用户友好的错误消息
  showUserFriendlyMessage: true,
  
  // 错误消息映射
  messageMap: {
    401: '请先登录',
    403: '权限不足',
    404: '资源不存在',
    500: '服务器错误',
    503: '服务暂时不可用'
  },
  
  // 自动重试的状态码
  autoRetryOn: [500, 502, 503, 504],
  
  // 错误回调
  onError: (error) => {
    // 上报错误到监控系统
    reportError(error)
  }
}))
```

### 超时拦截器

为请求添加超时控制：

```typescript
import { timeoutInterceptor } from '@ldesign/http'

client.addRequestInterceptor(timeoutInterceptor({
  // 默认超时时间
  timeout: 10000,
  
  // 不同路径的超时配置
  timeouts: {
    '/api/upload': 60000,  // 上传接口 60 秒
    '/api/download': 120000 // 下载接口 120 秒
  }
}))
```

### 请求 ID 拦截器

为每个请求添加唯一 ID：

```typescript
import { requestIdInterceptor } from '@ldesign/http'

client.addRequestInterceptor(requestIdInterceptor({
  // 请求头名称
  headerName: 'X-Request-ID',
  
  // ID 生成函数
  generator: () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}))
```

### 时间戳拦截器

添加请求时间戳：

```typescript
import { timestampInterceptor } from '@ldesign/http'

client.addRequestInterceptor(timestampInterceptor({
  // 参数名称
  paramName: '_t',
  
  // 添加到查询参数
  location: 'params' // 'params' | 'headers'
}))
```

### Content-Type 拦截器

自动设置 Content-Type：

```typescript
import { contentTypeInterceptor } from '@ldesign/http'

client.addRequestInterceptor(contentTypeInterceptor({
  // 默认 Content-Type
  default: 'application/json',
  
  // 根据数据类型自动设置
  auto: true,
  
  // 自定义映射
  mappings: {
    FormData: 'multipart/form-data',
    URLSearchParams: 'application/x-www-form-urlencoded',
    ArrayBuffer: 'application/octet-stream'
  }
}))
```

## 拦截器管理

### 移除拦截器

```typescript
// 添加拦截器时会返回 ID
const interceptorId = client.addRequestInterceptor((config) => {
  return config
})

// 移除拦截器
client.removeRequestInterceptor(interceptorId)
```

### 清除所有拦截器

```typescript
// 清除所有请求拦截器
client.clearRequestInterceptors()

// 清除所有响应拦截器
client.clearResponseInterceptors()
```

### 拦截器执行顺序

拦截器按添加顺序执行：

```typescript
// 第一个添加的拦截器先执行
client.addRequestInterceptor((config) => {
  console.log('拦截器 1')
  return config
})

client.addRequestInterceptor((config) => {
  console.log('拦截器 2')
  return config
})

// 输出顺序: 拦截器 1 -> 拦截器 2
```

## 高级用法

### 拦截器链

组合多个拦截器：

```typescript
import { compose } from '@ldesign/http'

const interceptorChain = compose(
  authInterceptor({ tokenKey: 'token' }),
  loggingInterceptor({ level: 'info' }),
  timestampInterceptor({ paramName: '_t' })
)

client.addRequestInterceptor(interceptorChain)
```

### 条件拦截器

根据条件动态应用拦截器：

```typescript
function createConditionalInterceptor(condition, interceptor) {
  return (config) => {
    if (condition(config)) {
      return interceptor(config)
    }
    return config
  }
}

// 只对 POST 请求添加 CSRF 令牌
client.addRequestInterceptor(
  createConditionalInterceptor(
    (config) => config.method === 'POST',
    (config) => {
      config.headers['X-CSRF-Token'] = getCsrfToken()
      return config
    }
  )
)
```

### 拦截器工厂

创建可配置的拦截器：

```typescript
function createApiKeyInterceptor(apiKey: string) {
  return (config) => {
    config.headers['X-API-Key'] = apiKey
    return config
  }
}

// 使用
client.addRequestInterceptor(
  createApiKeyInterceptor('your-api-key')
)
```

## 最佳实践

### 1. 使用内置拦截器

优先使用内置拦截器，它们经过充分测试：

```typescript
import {
  authInterceptor,
  loggingInterceptor,
  retryInterceptor
} from '@ldesign/http'

client.addRequestInterceptor(authInterceptor({...}))
client.addRequestInterceptor(loggingInterceptor({...}))
client.addResponseInterceptor(retryInterceptor({...}))
```

### 2. 合理组织拦截器

将相关的拦截器组织在一起：

```typescript
// interceptors/auth.ts
export function setupAuthInterceptors(client) {
  client.addRequestInterceptor(authInterceptor({...}))
  client.addResponseInterceptor(refreshTokenInterceptor())
}

// interceptors/logging.ts
export function setupLoggingInterceptors(client) {
  client.addRequestInterceptor(requestLogger())
  client.addResponseInterceptor(responseLogger())
}

// main.ts
import { setupAuthInterceptors, setupLoggingInterceptors } from './interceptors'

setupAuthInterceptors(client)
setupLoggingInterceptors(client)
```

### 3. 错误处理优先

将错误处理拦截器放在最后：

```typescript
// 其他拦截器
client.addRequestInterceptor(authInterceptor({...}))
client.addRequestInterceptor(loggingInterceptor({...}))

// 错误处理拦截器放在最后
client.addResponseInterceptor(errorHandlingInterceptor({...}))
```

### 4. 避免副作用

拦截器应该是纯函数，避免副作用：

```typescript
// ❌ 不好：有副作用
client.addRequestInterceptor((config) => {
  window.requestCount++ // 副作用
  return config
})

// ✅ 好：无副作用
client.addRequestInterceptor((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Request-Count': window.requestCount
    }
  }
})
```

## 下一步

- [缓存系统](/guide/cache) - 了解缓存功能
- [错误处理](/guide/error-handling) - 深入了解错误处理
- [API 参考](/api/interceptors/) - 查看完整的拦截器 API

