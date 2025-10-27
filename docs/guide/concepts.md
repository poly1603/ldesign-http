# 核心概念

理解 @ldesign/http 的核心概念将帮助你更好地使用这个库。

## HTTP 客户端

HTTP 客户端是库的核心，负责发送 HTTP 请求和接收响应。

```typescript
import { createHttpClient } from '@ldesign/http'

const client = await createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
})
```

### 请求方法

客户端支持所有标准 HTTP 方法：

```typescript
// GET 请求
await client.get('/users')
await client.get('/users/1')

// POST 请求
await client.post('/users', { name: 'John' })

// PUT 请求
await client.put('/users/1', { name: 'Jane' })

// PATCH 请求
await client.patch('/users/1', { name: 'Jane' })

// DELETE 请求
await client.delete('/users/1')

// HEAD 请求
await client.head('/users/1')

// OPTIONS 请求
await client.options('/users')
```

### 请求配置

每个请求都可以配置多个选项：

```typescript
await client.get('/users', {
  params: { page: 1, limit: 10 },     // 查询参数
  headers: { 'X-Custom': 'value' },   // 自定义请求头
  timeout: 5000,                       // 超时时间
  signal: abortController.signal,      // 取消信号
  cache: { enabled: true },            // 缓存配置
  retry: { maxAttempts: 3 }           // 重试配置
})
```

## 适配器

适配器是实际发送 HTTP 请求的底层实现。@ldesign/http 支持多种适配器：

### Fetch 适配器

基于现代浏览器的 Fetch API：

```typescript
const client = await createHttpClient({
  adapter: 'fetch', // 或 new FetchAdapter()
  baseURL: 'https://api.example.com'
})
```

**优点：**
- 浏览器原生支持
- 支持流式响应
- 更轻量

**适用场景：**
- 现代浏览器应用
- 需要流式处理
- 对包体积敏感

### Axios 适配器

基于流行的 Axios 库：

```typescript
const client = await createHttpClient({
  adapter: 'axios',
  baseURL: 'https://api.example.com'
})
```

**优点：**
- 功能丰富
- 广泛使用
- 更好的浏览器兼容性

**适用场景：**
- 需要兼容老版本浏览器
- 已有 Axios 经验
- 需要上传/下载进度

### Alova 适配器

基于新一代请求库 Alova：

```typescript
const client = await createHttpClient({
  adapter: 'alova',
  baseURL: 'https://api.example.com'
})
```

**优点：**
- 现代化设计
- 性能优秀
- 内置缓存策略

**适用场景：**
- 追求最佳性能
- 需要高级缓存功能

### 自定义适配器

你也可以创建自己的适配器：

```typescript
import { BaseAdapter } from '@ldesign/http'

class CustomAdapter extends BaseAdapter {
  name = 'custom'
  
  isSupported() {
    return true
  }
  
  async request(config) {
    // 自定义请求逻辑
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.data
    })
    
    return {
      data: await response.json(),
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config
    }
  }
}

const client = await createHttpClient({
  adapter: new CustomAdapter()
})
```

## 拦截器

拦截器允许你在请求发送前或响应返回后执行自定义逻辑。

### 请求拦截器

在请求发送前处理请求配置：

```typescript
client.addRequestInterceptor((config) => {
  // 添加认证令牌
  config.headers['Authorization'] = `Bearer ${token}`
  
  // 添加时间戳
  config.params = {
    ...config.params,
    _t: Date.now()
  }
  
  return config
})
```

### 响应拦截器

在响应返回后处理响应数据或错误：

```typescript
client.addResponseInterceptor(
  // 成功回调
  (response) => {
    // 处理响应数据
    if (response.data.code !== 0) {
      throw new Error(response.data.message)
    }
    return response.data.data
  },
  
  // 错误回调
  async (error) => {
    // 处理错误
    if (error.response?.status === 401) {
      // 刷新令牌
      await refreshToken()
      // 重试请求
      return client.request(error.config)
    }
    return Promise.reject(error)
  }
)
```

### 内置拦截器

库提供了多个常用的内置拦截器：

```typescript
import {
  authInterceptor,
  loggingInterceptor,
  errorHandlingInterceptor,
  retryInterceptor
} from '@ldesign/http'

// 认证拦截器
client.addRequestInterceptor(authInterceptor({
  tokenKey: 'accessToken',
  headerName: 'Authorization',
  tokenPrefix: 'Bearer'
}))

// 日志拦截器
client.addRequestInterceptor(loggingInterceptor({
  level: 'info'
}))

// 错误处理拦截器
client.addResponseInterceptor(errorHandlingInterceptor({
  showUserFriendlyMessage: true
}))

// 重试拦截器
client.addResponseInterceptor(retryInterceptor({
  maxAttempts: 3,
  delay: 1000
}))
```

## 缓存

缓存系统可以显著提升应用性能，减少不必要的网络请求。

### 基础缓存

```typescript
const client = await createHttpClient({
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5 分钟
  }
})

// 第一次请求会发送网络请求
const users1 = await client.get('/users')

// 第二次请求会使用缓存
const users2 = await client.get('/users')
```

### 请求级缓存

每个请求可以单独配置缓存：

```typescript
await client.get('/users', {
  cache: {
    enabled: true,
    ttl: 10 * 60 * 1000, // 10 分钟
    key: 'users-list'     // 自定义缓存键
  }
})
```

### 缓存标签

使用标签可以批量失效相关缓存：

```typescript
// 添加标签
await client.get('/users', {
  cache: {
    tags: ['users', 'user-list']
  }
})

await client.get('/users/1', {
  cache: {
    tags: ['users', 'user-detail']
  }
})

// 失效所有带 'users' 标签的缓存
await cacheManager.invalidateByTag('users')
```

### 缓存策略

支持多种缓存策略：

```typescript
import { createCacheManager } from '@ldesign/http'

const cacheManager = createCacheManager({
  strategy: 'lru',        // LRU（最近最少使用）
  maxSize: 50 * 1024 * 1024, // 50MB
  maxAge: 30 * 60 * 1000,    // 30 分钟
  compression: true           // 启用压缩
})
```

## 错误处理

完善的错误处理机制可以提升应用的稳定性。

### 错误类型

```typescript
import {
  isHttpError,
  isNetworkError,
  isTimeoutError,
  isAbortError
} from '@ldesign/http'

try {
  await client.get('/users')
} catch (error) {
  if (isHttpError(error)) {
    // HTTP 错误（4xx, 5xx）
    console.log('状态码:', error.response?.status)
  } else if (isNetworkError(error)) {
    // 网络错误
    console.log('网络不可用')
  } else if (isTimeoutError(error)) {
    // 超时错误
    console.log('请求超时')
  } else if (isAbortError(error)) {
    // 取消错误
    console.log('请求被取消')
  }
}
```

### 错误恢复

自动尝试从错误中恢复：

```typescript
import { ErrorHandler, builtinRecoveryStrategies } from '@ldesign/http'

// 添加恢复策略
ErrorHandler.addRecoveryStrategy(builtinRecoveryStrategies.networkReconnect)
ErrorHandler.addRecoveryStrategy(builtinRecoveryStrategies.authRefresh)

try {
  await client.get('/users')
} catch (error) {
  // 尝试恢复
  const recovered = await ErrorHandler.tryRecover(error)
  
  if (!recovered) {
    // 恢复失败，显示友好消息
    const message = ErrorHandler.getUserFriendlyMessage(error)
    alert(message)
  }
}
```

## 并发控制

控制同时发送的请求数量，避免资源耗尽。

### 并发限制

```typescript
const client = await createHttpClient({
  concurrency: {
    maxConcurrent: 5  // 最多同时 5 个请求
  }
})

// 发送 10 个请求，但同时只会有 5 个在执行
const promises = Array.from({ length: 10 }, (_, i) => 
  client.get(`/users/${i}`)
)

await Promise.all(promises)
```

### 请求去重

自动合并相同的请求：

```typescript
const client = await createHttpClient({
  concurrency: {
    deduplication: true
  }
})

// 这三个请求会被合并成一个
const promises = [
  client.get('/users'),
  client.get('/users'),
  client.get('/users')
]

const results = await Promise.all(promises)
// 三个结果相同，但只发送了一次请求
```

### 优先级队列

为请求设置优先级：

```typescript
// 高优先级请求
await client.get('/critical-data', {
  priority: 'high'
})

// 低优先级请求
await client.get('/non-urgent-data', {
  priority: 'low'
})
```

## 类型安全

充分利用 TypeScript 的类型系统，提供完整的类型支持。

### 响应类型

```typescript
interface User {
  id: number
  name: string
  email: string
}

// 响应数据自动推断为 User[]
const response = await client.get<User[]>('/users')
const users: User[] = response.data
```

### 请求类型

```typescript
interface CreateUserRequest {
  name: string
  email: string
}

interface User {
  id: number
  name: string
  email: string
}

// 请求体和响应都有类型约束
const response = await client.post<User, CreateUserRequest>(
  '/users',
  {
    name: 'John',
    email: 'john@example.com'
  }
)
```

### 品牌类型

使用品牌类型增加类型安全性：

```typescript
import { createUrl, createToken } from '@ldesign/http'

// 创建品牌类型
const url = createUrl('https://api.example.com')
const token = createToken('my-secret-token')

// 类型安全，防止混淆
function sendRequest(url: Url, token: Token) {
  // ...
}

sendRequest(url, token) // ✅ 正确
sendRequest(token, url) // ❌ 类型错误
```

## 下一步

- [HTTP 客户端](/guide/client) - 深入了解客户端 API
- [适配器](/guide/adapters) - 了解各种适配器
- [拦截器](/guide/interceptors) - 掌握拦截器用法
- [缓存系统](/guide/cache) - 探索缓存功能

