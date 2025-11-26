# HTTP 客户端

HTTP 客户端是 @ldesign/http 的核心，提供了发送 HTTP 请求的基础功能。

## 创建客户端

### 基础创建

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
})
```

### 完整配置

```typescript
const client = createHttpClient({
  // 基础 URL
  baseURL: 'https://api.example.com',
  
  // 超时时间（毫秒）
  timeout: 10000,
  
  // 默认请求头
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // 适配器选择
  adapter: 'fetch', // 'fetch' | 'axios' | 'alova' | 'auto'
  
  // 是否携带凭证
  withCredentials: true,
  
  // 响应类型
  responseType: 'json', // 'json' | 'text' | 'blob' | 'arraybuffer'
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000
  },
  
  // 重试配置
  retry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000
  },
  
  // 并发控制
  concurrency: {
    maxConcurrent: 10,
    deduplication: true
  }
})
```

## HTTP 方法

### GET 请求

```typescript
// 基础 GET
const response = await client.get('/users')

// 带查询参数
const response = await client.get('/users', {
  params: {
    page: 1,
    limit: 10,
    sort: 'name'
  }
})

// 类型安全
interface User {
  id: number
  name: string
}

const response = await client.get<User[]>('/users')
// response.data 的类型为 User[]
```

### POST 请求

```typescript
// JSON 数据
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// FormData
const formData = new FormData()
formData.append('name', 'John Doe')
const response = await client.post('/users', formData)

// 类型安全
interface CreateUserRequest {
  name: string
  email: string
}

interface User {
  id: number
  name: string
  email: string
}

const response = await client.post<User, CreateUserRequest>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
```

### PUT 请求

```typescript
// 完整更新
const response = await client.put('/users/1', {
  name: 'Jane Doe',
  email: 'jane@example.com'
})
```

### PATCH 请求

```typescript
// 部分更新
const response = await client.patch('/users/1', {
  name: 'Jane Doe'
})
```

### DELETE 请求

```typescript
// 删除资源
const response = await client.delete('/users/1')

// 带请求体
const response = await client.delete('/users', {
  data: {
    ids: [1, 2, 3]
  }
})
```

### HEAD 请求

```typescript
// 获取响应头
const response = await client.head('/users/1')
console.log(response.headers)
```

### OPTIONS 请求

```typescript
// 获取允许的方法
const response = await client.options('/users')
console.log(response.headers['allow'])
```

## 请求配置

### 单个请求配置

每个请求都可以有自己的配置，会覆盖全局配置：

```typescript
const response = await client.get('/users', {
  // 超时
  timeout: 5000,
  
  // 请求头
  headers: {
    'X-Custom-Header': 'value'
  },
  
  // 查询参数
  params: {
    page: 1
  },
  
  // 缓存
  cache: {
    enabled: true,
    ttl: 10000
  },
  
  // 重试
  retry: {
    enabled: true,
    maxAttempts: 5
  },
  
  // 取消信号
  signal: controller.signal,
  
  // 响应类型
  responseType: 'blob',
  
  // 进度回调
  onUploadProgress: (progress) => {
    console.log(progress.percentage)
  },
  onDownloadProgress: (progress) => {
    console.log(progress.percentage)
  }
})
```

### 查询参数

```typescript
// 对象形式
await client.get('/users', {
  params: {
    page: 1,
    limit: 10,
    sort: 'name',
    filter: ['active', 'verified']
  }
})
// 生成: /users?page=1&limit=10&sort=name&filter=active&filter=verified

// URLSearchParams
const params = new URLSearchParams()
params.append('page', '1')
params.append('limit', '10')
await client.get('/users', { params })

// 字符串形式
await client.get('/users?page=1&limit=10')
```

### 请求头

```typescript
// 全局请求头
const client = createHttpClient({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  }
})

// 单个请求头
await client.get('/users', {
  headers: {
    'X-Custom-Header': 'value'
  }
})

// 动态请求头
client.addRequestInterceptor((config) => {
  config.headers['X-Timestamp'] = Date.now().toString()
  return config
})
```

### 请求体

```typescript
// JSON
await client.post('/users', {
  name: 'John',
  email: 'john@example.com'
})

// FormData
const formData = new FormData()
formData.append('name', 'John')
formData.append('file', file)
await client.post('/users', formData)

// URLSearchParams
const params = new URLSearchParams()
params.append('name', 'John')
await client.post('/users', params)

// 文本
await client.post('/users', 'plain text', {
  headers: {
    'Content-Type': 'text/plain'
  }
})

// Blob
await client.post('/users', blob, {
  headers: {
    'Content-Type': 'application/octet-stream'
  }
})
```

## 响应处理

### 响应结构

```typescript
interface Response<T = any> {
  // 响应数据
  data: T
  
  // HTTP 状态码
  status: number
  
  // 状态文本
  statusText: string
  
  // 响应头
  headers: Record<string, string>
  
  // 请求配置
  config: RequestConfig
  
  // 原始响应（适配器相关）
  raw?: any
}
```

### 访问响应数据

```typescript
const response = await client.get<User[]>('/users')

// 响应数据
console.log(response.data)

// HTTP 状态
console.log(response.status) // 200
console.log(response.statusText) // 'OK'

// 响应头
console.log(response.headers['content-type'])

// 请求配置
console.log(response.config.url)
```

### 响应类型

```typescript
// JSON（默认）
const response = await client.get('/users', {
  responseType: 'json'
})
console.log(response.data) // JavaScript 对象

// 文本
const response = await client.get('/file.txt', {
  responseType: 'text'
})
console.log(response.data) // 字符串

// Blob（用于文件）
const response = await client.get('/image.png', {
  responseType: 'blob'
})
const url = URL.createObjectURL(response.data)

// ArrayBuffer
const response = await client.get('/file.bin', {
  responseType: 'arraybuffer'
})
const buffer = response.data
```

## 错误处理

### 错误类型

```typescript
try {
  await client.get('/users')
} catch (error) {
  if (error.response) {
    // 服务器响应了错误状态码（4xx, 5xx）
    console.log('状态码:', error.response.status)
    console.log('错误数据:', error.response.data)
    console.log('响应头:', error.response.headers)
  } else if (error.request) {
    // 请求已发送但没有收到响应（网络错误）
    console.log('网络错误')
  } else {
    // 请求配置错误
    console.log('配置错误:', error.message)
  }
}
```

### 类型守卫

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
    console.log('请求被取消')
  }
}
```

### 全局错误处理

```typescript
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 未认证，跳转登录
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      // 无权限
      alert('权限不足')
    } else if (error.response?.status >= 500) {
      // 服务器错误
      alert('服务器错误，请稍后重试')
    }
    return Promise.reject(error)
  }
)
```

## 实例方法

### addRequestInterceptor

添加请求拦截器：

```typescript
client.addRequestInterceptor((config) => {
  // 修改配置
  config.headers['X-Timestamp'] = Date.now().toString()
  return config
})

// 异步拦截器
client.addRequestInterceptor(async (config) => {
  const token = await getToken()
  config.headers['Authorization'] = `Bearer ${token}`
  return config
})
```

### addResponseInterceptor

添加响应拦截器：

```typescript
client.addResponseInterceptor(
  (response) => {
    // 处理响应
    console.log('请求成功:', response.config.url)
    return response
  },
  (error) => {
    // 处理错误
    console.error('请求失败:', error.message)
    return Promise.reject(error)
  }
)
```

### clearCache

清除缓存：

```typescript
// 清除所有缓存
await client.clearCache()

// 清除特定 URL 的缓存
await client.clearCache('/users')

// 清除符合模式的缓存
await client.clearCache(/^\/users/)
```

### getStats

获取统计信息：

```typescript
const stats = client.getStats()

console.log('总请求数:', stats.totalRequests)
console.log('成功率:', stats.successRate)
console.log('平均响应时间:', stats.averageResponseTime)
console.log('缓存命中率:', stats.cacheHitRate)
```

### setConfig

更新配置：

```typescript
client.setConfig({
  timeout: 15000,
  headers: {
    'X-New-Header': 'value'
  }
})
```

## 最佳实践

### 1. 使用单例模式

```typescript
// api/client.ts
import { createHttpClient } from '@ldesign/http-core'

export const apiClient = createHttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 在其他文件中使用
import { apiClient } from './api/client'
await apiClient.get('/users')
```

### 2. 创建 API 服务层

```typescript
// api/users.ts
import { apiClient } from './client'

export interface User {
  id: number
  name: string
  email: string
}

export const userService = {
  getUsers: () => 
    apiClient.get<User[]>('/users'),
  
  getUser: (id: number) => 
    apiClient.get<User>(`/users/${id}`),
  
  createUser: (data: Omit<User, 'id'>) => 
    apiClient.post<User>('/users', data),
  
  updateUser: (id: number, data: Partial<User>) => 
    apiClient.patch<User>(`/users/${id}`, data),
  
  deleteUser: (id: number) => 
    apiClient.delete(`/users/${id}`)
}
```

### 3. 环境变量配置

```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:3000/api

// .env.production
VITE_API_BASE_URL=https://api.production.com

// client.ts
const client = createHttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: import.meta.env.PROD ? 10000 : 30000
})
```

### 4. 类型化响应

```typescript
// 定义统一的 API 响应格式
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 添加响应拦截器提取数据
client.addResponseInterceptor(
  (response) => {
    const apiResponse = response.data as ApiResponse<any>
    if (apiResponse.code !== 0) {
      throw new Error(apiResponse.message)
    }
    // 直接返回业务数据
    response.data = apiResponse.data
    return response
  }
)

// 使用时更简洁
const response = await client.get<User[]>('/users')
console.log(response.data) // 直接是 User[] 数组
```

### 5. 请求取消管理

```typescript
class RequestManager {
  private controllers = new Map<string, AbortController>()
  
  request<T>(key: string, requestFn: (signal: AbortSignal) => Promise<T>) {
    // 取消之前的同名请求
    this.cancel(key)
    
    // 创建新的控制器
    const controller = new AbortController()
    this.controllers.set(key, controller)
    
    // 发送请求
    return requestFn(controller.signal).finally(() => {
      this.controllers.delete(key)
    })
  }
  
  cancel(key: string) {
    const controller = this.controllers.get(key)
    if (controller) {
      controller.abort()
      this.controllers.delete(key)
    }
  }
  
  cancelAll() {
    this.controllers.forEach(controller => controller.abort())
    this.controllers.clear()
  }
}

// 使用
const manager = new RequestManager()

await manager.request('search', (signal) => 
  client.get('/search', { params: { q: 'query' }, signal })
)
```

## 下一步

- [适配器系统](/guide/adapters) - 了解适配器的工作原理
- [拦截器](/guide/interceptors) - 深入学习拦截器
- [缓存管理](/guide/caching) - 掌握缓存策略
- [错误处理](/guide/error-handling) - 完善错误处理