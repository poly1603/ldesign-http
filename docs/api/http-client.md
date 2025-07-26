# HttpClient API

HttpClient 是 @ldesign/http 的核心类，提供了完整的HTTP请求功能。

## 🏗️ 构造函数

### createHttpClient

创建一个新的 HttpClient 实例。

```typescript
function createHttpClient(config?: HttpClientConfig): HttpClient
```

**参数:**
- `config` - 可选的配置对象

**示例:**
```typescript
import { createHttpClient } from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

## 📡 HTTP 方法

### get

发送 GET 请求。

```typescript
get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
```

**参数:**
- `url` - 请求URL
- `config` - 可选的请求配置

**示例:**
```typescript
// 基础 GET 请求
const response = await client.get('/users')

// 带查询参数
const response = await client.get('/users', {
  params: { page: 1, limit: 10 }
})

// 带类型定义
interface User {
  id: number
  name: string
  email: string
}

const response = await client.get<User[]>('/users')
// response.data 的类型为 User[]
```

### post

发送 POST 请求。

```typescript
post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>
```

**参数:**
- `url` - 请求URL
- `data` - 请求体数据
- `config` - 可选的请求配置

**示例:**
```typescript
// 创建用户
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// 文件上传
const formData = new FormData()
formData.append('file', file)

const response = await client.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  onUploadProgress: (progress) => {
    console.log(`上传进度: ${progress.percentage}%`)
  }
})
```

### put

发送 PUT 请求。

```typescript
put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>
```

**示例:**
```typescript
// 更新用户
const response = await client.put('/users/1', {
  name: 'Jane Doe',
  email: 'jane@example.com'
})
```

### delete

发送 DELETE 请求。

```typescript
delete<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
```

**示例:**
```typescript
// 删除用户
await client.delete('/users/1')

// 带确认参数
await client.delete('/users/1', {
  params: { confirm: true }
})
```

### patch

发送 PATCH 请求。

```typescript
patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>
```

**示例:**
```typescript
// 部分更新
const response = await client.patch('/users/1', {
  email: 'newemail@example.com'
})
```

### head

发送 HEAD 请求。

```typescript
head<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
```

**示例:**
```typescript
// 检查资源是否存在
const response = await client.head('/users/1')
console.log('用户存在:', response.status === 200)
```

### options

发送 OPTIONS 请求。

```typescript
options<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
```

**示例:**
```typescript
// 获取允许的方法
const response = await client.options('/users')
console.log('允许的方法:', response.headers['allow'])
```

### request

通用请求方法。

```typescript
request<T = any>(config: ExtendedRequestConfig): Promise<HttpResponse<T>>
```

**示例:**
```typescript
const response = await client.request({
  method: 'GET',
  url: '/users',
  params: { page: 1 },
  headers: { 'Accept': 'application/json' }
})
```

## 🛡️ 拦截器

### addRequestInterceptor

添加请求拦截器。

```typescript
addRequestInterceptor(interceptor: RequestInterceptor): number
```

**参数:**
- `interceptor` - 请求拦截器对象

**返回值:**
- `number` - 拦截器ID，用于移除

**示例:**
```typescript
const interceptorId = client.addRequestInterceptor({
  onFulfilled: (config) => {
    // 添加认证头
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${getToken()}`
    }
    return config
  },
  onRejected: (error) => {
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
})
```

### addResponseInterceptor

添加响应拦截器。

```typescript
addResponseInterceptor(interceptor: ResponseInterceptor): number
```

**示例:**
```typescript
const interceptorId = client.addResponseInterceptor({
  onFulfilled: (response) => {
    // 统一处理响应数据
    if (response.data && response.data.code !== 200) {
      throw new Error(response.data.message)
    }
    return response
  },
  onRejected: (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 跳转登录
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
})
```

### removeInterceptor

移除拦截器。

```typescript
removeInterceptor(type: 'request' | 'response', id: number): void
```

**示例:**
```typescript
// 移除请求拦截器
client.removeInterceptor('request', requestInterceptorId)

// 移除响应拦截器
client.removeInterceptor('response', responseInterceptorId)
```

### clearRequestInterceptors

清空所有请求拦截器。

```typescript
clearRequestInterceptors(): void
```

### clearResponseInterceptors

清空所有响应拦截器。

```typescript
clearResponseInterceptors(): void
```

### clearAllInterceptors

清空所有拦截器。

```typescript
clearAllInterceptors(): void
```

## ⚙️ 配置管理

### getDefaults

获取默认配置。

```typescript
getDefaults(): HttpClientConfig
```

**示例:**
```typescript
const defaults = client.getDefaults()
console.log('当前默认配置:', defaults)
```

### setDefaults

设置默认配置。

```typescript
setDefaults(config: Partial<HttpClientConfig>): void
```

**示例:**
```typescript
// 更新默认配置
client.setDefaults({
  timeout: 15000,
  headers: {
    'X-API-Version': '2.0'
  }
})
```

## 🚫 请求取消

### createCancelToken

创建取消令牌。

```typescript
createCancelToken(): CancelToken
```

**示例:**
```typescript
const cancelToken = client.createCancelToken()

// 发送可取消的请求
const requestPromise = client.get('/slow-endpoint', {
  cancelToken
})

// 5秒后取消
setTimeout(() => {
  cancelToken.cancel('请求超时')
}, 5000)

try {
  const response = await requestPromise
} catch (error: any) {
  if (error.isCancelError) {
    console.log('请求被取消:', error.message)
  }
}
```

## 📡 事件系统

### on

监听事件。

```typescript
on(event: EventType, listener: EventListener): void
```

**事件类型:**
- `'request'` - 请求发送时
- `'response'` - 响应接收时
- `'error'` - 错误发生时
- `'retry'` - 重试时
- `'cache-hit'` - 缓存命中时
- `'cache-miss'` - 缓存未命中时

**示例:**
```typescript
// 监听请求事件
client.on('request', (event) => {
  console.log('发送请求:', event.config.method, event.config.url)
})

// 监听响应事件
client.on('response', (event) => {
  console.log('收到响应:', event.response.status)
})

// 监听错误事件
client.on('error', (event) => {
  console.error('请求错误:', event.error.message)
})
```

### off

移除事件监听器。

```typescript
off(event: EventType, listener: EventListener): void
```

### emit

触发事件。

```typescript
emit(event: EventType, data: any): void
```

### once

监听一次性事件。

```typescript
once(event: EventType, listener: EventListener): void
```

## 🔧 适配器管理

### getAdapterInfo

获取当前适配器信息。

```typescript
getAdapterInfo(): AdapterInfo
```

**返回值:**
```typescript
interface AdapterInfo {
  name: string
  isCustom: boolean
  version?: string
}
```

**示例:**
```typescript
const info = client.getAdapterInfo()
console.log('适配器名称:', info.name)
console.log('是否自定义:', info.isCustom)
```

### switchAdapter

切换适配器。

```typescript
switchAdapter(adapter: 'fetch' | 'axios' | 'alova'): boolean
```

**返回值:**
- `boolean` - 是否切换成功

**示例:**
```typescript
if (client.switchAdapter('axios')) {
  console.log('已切换到 axios 适配器')
} else {
  console.log('axios 不可用，保持当前适配器')
}
```

## 📊 静态方法

### getSupportedAdapters

获取支持的适配器列表。

```typescript
static getSupportedAdapters(): string[]
```

**示例:**
```typescript
const adapters = HttpClient.getSupportedAdapters()
console.log('支持的适配器:', adapters)
```

### isAdapterSupported

检查适配器是否支持。

```typescript
static isAdapterSupported(adapter: string): boolean
```

**示例:**
```typescript
if (HttpClient.isAdapterSupported('axios')) {
  console.log('Axios 适配器可用')
}
```

## 🔍 实用方法

### isCancel

检查错误是否为取消错误。

```typescript
static isCancel(error: any): boolean
```

**示例:**
```typescript
try {
  await client.get('/api/data')
} catch (error) {
  if (HttpClient.isCancel(error)) {
    console.log('请求被取消')
  }
}
```

### all

并发执行多个请求。

```typescript
static all<T>(promises: Promise<T>[]): Promise<T[]>
```

**示例:**
```typescript
const [users, posts, comments] = await HttpClient.all([
  client.get('/users'),
  client.get('/posts'),
  client.get('/comments')
])
```

### spread

展开并发请求的结果。

```typescript
static spread<T extends any[], R>(callback: (...args: T) => R): (array: T) => R
```

**示例:**
```typescript
const handleResults = HttpClient.spread((users, posts, comments) => {
  console.log('用户:', users.data)
  console.log('文章:', posts.data)
  console.log('评论:', comments.data)
})

HttpClient.all([
  client.get('/users'),
  client.get('/posts'),
  client.get('/comments')
]).then(handleResults)
```

## 📚 类型定义

### HttpResponse

```typescript
interface HttpResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
}
```

### RequestConfig

```typescript
interface RequestConfig {
  url?: string
  method?: HttpMethod
  baseURL?: string
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
  responseType?: ResponseType
  cancelToken?: CancelToken
  onUploadProgress?: (progress: ProgressEvent) => void
  onDownloadProgress?: (progress: ProgressEvent) => void
}
```

### HttpError

```typescript
interface HttpError extends Error {
  response?: HttpResponse
  request?: RequestConfig
  isNetworkError: boolean
  isTimeoutError: boolean
  isCancelError: boolean
  status?: number
  statusText?: string
}
```

## 📚 下一步

了解 HttpClient API 后，你可以继续学习：

- [类型定义](/api/types) - 完整的类型定义
- [工具函数](/api/utils) - 实用工具函数
- [插件开发](/plugins/development) - 开发自定义插件
- [最佳实践](/guide/best-practices) - 使用最佳实践
