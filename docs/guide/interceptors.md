# 拦截器

拦截器允许你在请求发送前或响应返回后执行自定义逻辑，是实现认证、日志、错误处理等功能的强大工具。

## 基础概念

拦截器分为两类：

- **请求拦截器**：在请求发送前执行
- **响应拦截器**：在响应返回后执行

## 请求拦截器

### 添加请求拦截器

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: '/api'
})

// 添加请求拦截器
client.addRequestInterceptor((config) => {
  // 修改请求配置
  config.headers['X-Timestamp'] = Date.now().toString()
  return config
})
```

### 异步请求拦截器

```typescript
// 异步获取令牌
client.addRequestInterceptor(async (config) => {
  const token = await getTokenFromStorage()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})
```

### 条件拦截

```typescript
client.addRequestInterceptor((config) => {
  // 只对特定 URL 添加认证
  if (config.url?.startsWith('/api/auth')) {
    const token = localStorage.getItem('token')
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})
```

### 请求拦截器示例

#### 添加认证令牌

```typescript
client.addRequestInterceptor((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})
```

#### 添加请求 ID

```typescript
client.addRequestInterceptor((config) => {
  config.headers['X-Request-ID'] = crypto.randomUUID()
  return config
})
```

#### 添加时间戳和签名

```typescript
import { createSignature } from './utils'

client.addRequestInterceptor((config) => {
  const timestamp = Date.now().toString()
  const signature = createSignature(config, timestamp)
  
  config.headers['X-Timestamp'] = timestamp
  config.headers['X-Signature'] = signature
  
  return config
})
```

#### 请求日志

```typescript
client.addRequestInterceptor((config) => {
  console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`)
  console.log('Headers:', config.headers)
  console.log('Data:', config.data)
  return config
})
```

## 响应拦截器

### 添加响应拦截器

```typescript
client.addResponseInterceptor(
  // 成功回调
  (response) => {
    console.log('请求成功:', response.status)
    return response
  },
  // 错误回调
  (error) => {
    console.error('请求失败:', error.message)
    return Promise.reject(error)
  }
)
```

### 响应数据转换

```typescript
// 提取嵌套的数据
client.addResponseInterceptor((response) => {
  // API 返回格式: { code: 0, message: 'ok', data: {...} }
  const apiResponse = response.data
  
  if (apiResponse.code !== 0) {
    throw new Error(apiResponse.message)
  }
  
  // 直接返回业务数据
  response.data = apiResponse.data
  return response
})
```

### 错误处理

```typescript
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.response) {
      // HTTP 错误
      switch (error.response.status) {
        case 401:
          // 未认证，跳转登录
          window.location.href = '/login'
          break
        case 403:
          // 无权限
          alert('权限不足')
          break
        case 404:
          // 资源不存在
          console.error('资源不存在')
          break
        case 500:
          // 服务器错误
          alert('服务器错误，请稍后重试')
          break
      }
    } else if (error.request) {
      // 网络错误
      alert('网络连接失败，请检查网络')
    }
    
    return Promise.reject(error)
  }
)
```

### Token 刷新

```typescript
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

client.addResponseInterceptor(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // 401 且未刷新过
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 正在刷新，等待
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            resolve(client.request(originalRequest))
          })
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      try {
        // 刷新 token
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await client.post('/auth/refresh', { refreshToken })
        const { accessToken } = response.data
        
        // 保存新 token
        localStorage.setItem('accessToken', accessToken)
        
        // 通知等待的请求
        refreshSubscribers.forEach(cb => cb(accessToken))
        refreshSubscribers = []
        
        // 重试原请求
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        return client.request(originalRequest)
      } catch (refreshError) {
        // 刷新失败，跳转登录
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)
```

## 内置拦截器

### 认证拦截器

```typescript
import { authInterceptor } from '@ldesign/http-core'

client.addRequestInterceptor(authInterceptor({
  // Token 存储键名
  tokenKey: 'accessToken',
  
  // 请求头名称
  headerName: 'Authorization',
  
  // Token 前缀
  tokenPrefix: 'Bearer',
  
  // Token 获取函数（可选）
  getToken: () => localStorage.getItem('token'),
  
  // 是否包含特定 URL
  include: ['/api/*'],
  
  // 排除特定 URL
  exclude: ['/api/public/*']
}))
```

### 日志拦截器

```typescript
import { loggingInterceptor } from '@ldesign/http-core'

client.addRequestInterceptor(loggingInterceptor({
  // 日志级别
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'
  
  // 是否包含请求头
  includeHeaders: true,
  
  // 是否包含请求体
  includeBody: true,
  
  // 自定义日志函数
  logger: (message, data) => {
    console.log(`[HTTP] ${message}`, data)
  }
}))
```

### 重试拦截器

```typescript
import { retryInterceptor } from '@ldesign/http-core'

client.addResponseInterceptor(
  (response) => response,
  retryInterceptor({
    // 最大重试次数
    maxRetries: 3,
    
    // 重试延迟（毫秒）
    delay: 1000,
    
    // 重试条件
    shouldRetry: (error) => {
      // 只重试网络错误和 5xx 错误
      return !error.response || error.response.status >= 500
    },
    
    // 延迟函数（指数退避）
    delayFn: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000)
  })
)
```

### 缓存拦截器

```typescript
import { cacheInterceptor } from '@ldesign/http-core'

const { request, response } = cacheInterceptor({
  // 缓存有效期
  ttl: 5 * 60 * 1000, // 5 分钟
  
  // 缓存存储
  storage: 'memory', // 'memory' | 'localStorage' | 'indexedDB'
  
  // 缓存键生成函数
  keyGenerator: (config) => {
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}`
  },
  
  // 是否缓存
  shouldCache: (response) => {
    return response.status === 200
  }
})

client.addRequestInterceptor(request)
client.addResponseInterceptor(response)
```

## 拦截器链

拦截器按添加顺序执行：

```typescript
// 1. 添加认证
client.addRequestInterceptor(authInterceptor())

// 2. 添加日志
client.addRequestInterceptor(loggingInterceptor())

// 3. 添加签名
client.addRequestInterceptor(signatureInterceptor())

// 执行顺序: 认证 -> 日志 -> 签名 -> 发送请求
```

响应拦截器按相反顺序执行：

```typescript
// 1. 添加缓存
client.addResponseInterceptor(cacheInterceptor())

// 2. 添加日志
client.addResponseInterceptor(loggingInterceptor())

// 3. 添加错误处理
client.addResponseInterceptor(errorHandler())

// 执行顺序: 收到响应 -> 错误处理 -> 日志 -> 缓存
```

## 移除拦截器

```typescript
// 添加时保存 ID
const interceptorId = client.addRequestInterceptor((config) => {
  // ...
  return config
})

// 稍后移除
client.removeRequestInterceptor(interceptorId)

// 移除所有请求拦截器
client.clearRequestInterceptors()

// 移除所有响应拦截器
client.clearResponseInterceptors()
```

## 高级模式

### 拦截器工厂

创建可配置的拦截器：

```typescript
function createAuthInterceptor(options: {
  tokenKey: string
  headerName: string
  refreshUrl: string
}) {
  return (config: RequestConfig) => {
    const token = localStorage.getItem(options.tokenKey)
    if (token) {
      config.headers[options.headerName] = `Bearer ${token}`
    }
    return config
  }
}

// 使用
client.addRequestInterceptor(
  createAuthInterceptor({
    tokenKey: 'accessToken',
    headerName: 'Authorization',
    refreshUrl: '/auth/refresh'
  })
)
```

### 条件拦截器

根据配置决定是否执行：

```typescript
function conditionalInterceptor(
  condition: (config: RequestConfig) => boolean,
  interceptor: (config: RequestConfig) => RequestConfig
) {
  return (config: RequestConfig) => {
    if (condition(config)) {
      return interceptor(config)
    }
    return config
  }
}

// 使用：只对 API 请求添加认证
client.addRequestInterceptor(
  conditionalInterceptor(
    (config) => config.url?.startsWith('/api'),
    authInterceptor()
  )
)
```

### 组合拦截器

组合多个拦截器：

```typescript
function composeInterceptors(...interceptors: Array<(config: RequestConfig) => RequestConfig>) {
  return async (config: RequestConfig) => {
    let result = config
    for (const interceptor of interceptors) {
      result = await interceptor(result)
    }
    return result
  }
}

// 使用
client.addRequestInterceptor(
  composeInterceptors(
    authInterceptor(),
    loggingInterceptor(),
    signatureInterceptor()
  )
)
```

### 拦截器中间件

创建可扩展的拦截器系统：

```typescript
class InterceptorMiddleware {
  private middlewares: Array<(config: RequestConfig) => RequestConfig> = []
  
  use(middleware: (config: RequestConfig) => RequestConfig) {
    this.middlewares.push(middleware)
    return this
  }
  
  async execute(config: RequestConfig): Promise<RequestConfig> {
    let result = config
    for (const middleware of this.middlewares) {
      result = await middleware(result)
    }
    return result
  }
}

// 使用
const middleware = new InterceptorMiddleware()
  .use(authInterceptor())
  .use(loggingInterceptor())
  .use(signatureInterceptor())

client.addRequestInterceptor((config) => middleware.execute(config))
```

## 最佳实践

### 1. 保持拦截器简单

```typescript
// ✅ 好的做法：单一职责
client.addRequestInterceptor((config) => {
  config.headers['X-Request-ID'] = generateId()
  return config
})

// ❌ 避免：做太多事情
client.addRequestInterceptor((config) => {
  // 认证
  config.headers['Authorization'] = getToken()
  // 日志
  console.log(config)
  // 签名
  config.headers['Signature'] = sign(config)
  // 转换
  config.data = transform(config.data)
  return config
})
```

### 2. 使用工厂函数

```typescript
// ✅ 好的做法：可配置
function createLoggingInterceptor(options: { verbose: boolean }) {
  return (config: RequestConfig) => {
    if (options.verbose) {
      console.log('详细日志:', config)
    } else {
      console.log('简单日志:', config.url)
    }
    return config
  }
}
```

### 3. 错误处理

```typescript
client.addRequestInterceptor((config) => {
  try {
    // 可能失败的操作
    const token = getTokenOrThrow()
    config.headers['Authorization'] = token
    return config
  } catch (error) {
    // 记录错误但不阻塞请求
    console.error('Failed to get token:', error)
    return config
  }
})
```

### 4. 避免副作用

```typescript
// ✅ 好的做法：不修改原对象
client.addRequestInterceptor((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Custom': 'value'
    }
  }
})

// ❌ 避免：直接修改
client.addRequestInterceptor((config) => {
  config.headers['X-Custom'] = 'value' // 可能影响其他拦截器
  return config
})
```

## 常见场景

### API 签名

```typescript
import { createHmac } from 'crypto'

client.addRequestInterceptor((config) => {
  const timestamp = Date.now().toString()
  const nonce = generateNonce()
  const signStr = `${config.method}\n${config.url}\n${timestamp}\n${nonce}`
  const signature = createHmac('sha256', SECRET_KEY)
    .update(signStr)
    .digest('hex')
  
  config.headers['X-Timestamp'] = timestamp
  config.headers['X-Nonce'] = nonce
  config.headers['X-Signature'] = signature
  
  return config
})
```

### 请求限流

```typescript
class RateLimiter {
  private queue: Array<() => void> = []
  private running = 0
  private maxConcurrent = 5
  
  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve))
    }
    
    this.running++
    try {
      return await fn()
    } finally {
      this.running--
      const next = this.queue.shift()
      if (next) next()
    }
  }
}

const limiter = new RateLimiter()

client.addRequestInterceptor((config) => {
  config._throttle = () => limiter.throttle(() => 
    client.request(config)
  )
  return config
})
```

### 离线检测

```typescript
client.addRequestInterceptor((config) => {
  if (!navigator.onLine) {
    throw new Error('当前网络不可用')
  }
  return config
})
```

## 下一步

- [缓存管理](/guide/caching) - 学习缓存策略
- [错误处理](/guide/error-handling) - 完善错误处理
- [自定义拦截器示例](/examples/custom-interceptor) - 查看完整示例