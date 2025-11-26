# 核心 API

@ldesign/http-core 的核心 API 参考。

## createHttpClient

创建 HTTP 客户端实例。

### 类型签名

```typescript
function createHttpClient(config?: HttpConfig): HttpClient
```

### 参数

```typescript
interface HttpConfig {
  // 基础 URL
  baseURL?: string
  
  // 超时时间（毫秒）
  timeout?: number
  
  // 默认请求头
  headers?: Record<string, string>
  
  // 适配器
  adapter?: 'fetch' | 'axios' | 'alova' | 'auto' | HttpAdapter
  
  // 是否携带凭证
  withCredentials?: boolean
  
  // 响应类型
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
  
  // 缓存配置
  cache?: CacheConfig
  
  // 重试配置
  retry?: RetryConfig
  
  // 并发控制
  concurrency?: ConcurrencyConfig
}
```

### 示例

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  cache: { enabled: true },
  retry: { maxAttempts: 3 }
})
```

## HttpClient

HTTP 客户端类。

### 方法

#### get\<T\>

发送 GET 请求。

```typescript
get<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
```

**示例：**

```typescript
const response = await client.get<User[]>('/users')
console.log(response.data)
```

#### post\<T\>

发送 POST 请求。

```typescript
post<T = any, D = any>(
  url: string, 
  data?: D, 
  config?: RequestConfig
): Promise<Response<T>>
```

**示例：**

```typescript
const response = await client.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
```

#### put\<T\>

发送 PUT 请求。

```typescript
put<T = any, D = any>(
  url: string, 
  data?: D, 
  config?: RequestConfig
): Promise<Response<T>>
```

#### patch\<T\>

发送 PATCH 请求。

```typescript
patch<T = any, D = any>(
  url: string, 
  data?: D, 
  config?: RequestConfig
): Promise<Response<T>>
```

#### delete\<T\>

发送 DELETE 请求。

```typescript
delete<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
```

#### head\<T\>

发送 HEAD 请求。

```typescript
head<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
```

#### options\<T\>

发送 OPTIONS 请求。

```typescript
options<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
```

#### request\<T\>

通用请求方法。

```typescript
request<T = any>(config: RequestConfig): Promise<Response<T>>
```

#### upload

上传文件。

```typescript
upload(
  url: string,
  data: FormData,
  config?: UploadConfig
): Promise<UploadResponse>
```

**示例：**

```typescript
const formData = new FormData()
formData.append('file', file)

const response = await client.upload('/upload', formData, {
  onUploadProgress: (progress) => {
    console.log(`进度: ${progress.percentage}%`)
  }
})
```

#### download

下载文件。

```typescript
download(
  url: string,
  config?: DownloadConfig
): Promise<DownloadResponse>
```

**示例：**

```typescript
const response = await client.download('/files/document.pdf', {
  onDownloadProgress: (progress) => {
    console.log(`进度: ${progress.percentage}%`)
  }
})
```

#### addRequestInterceptor

添加请求拦截器。

```typescript
addRequestInterceptor(
  interceptor: RequestInterceptor
): number
```

**返回：** 拦截器 ID

**示例：**

```typescript
const id = client.addRequestInterceptor((config) => {
  config.headers['Authorization'] = 'Bearer token'
  return config
})
```

#### addResponseInterceptor

添加响应拦截器。

```typescript
addResponseInterceptor(
  onFulfilled?: ResponseInterceptor,
  onRejected?: ErrorInterceptor
): number
```

**返回：** 拦截器 ID

**示例：**

```typescript
const id = client.addResponseInterceptor(
  (response) => response,
  (error) => Promise.reject(error)
)
```

#### removeRequestInterceptor

移除请求拦截器。

```typescript
removeRequestInterceptor(id: number): void
```

#### removeResponseInterceptor

移除响应拦截器。

```typescript
removeResponseInterceptor(id: number): void
```

#### clearCache

清除缓存。

```typescript
clearCache(pattern?: string | RegExp): Promise<void>
```

**示例：**

```typescript
// 清除所有缓存
await client.clearCache()

// 清除特定 URL
await client.clearCache('/users')

// 清除匹配模式
await client.clearCache(/^\/api/)
```

#### getStats

获取统计信息。

```typescript
getStats(): HttpStats
```

**返回：**

```typescript
interface HttpStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  successRate: number
  averageResponseTime: number
  cacheHitRate: number
}
```

#### setConfig

更新配置。

```typescript
setConfig(config: Partial<HttpConfig>): void
```

## 类型定义

### RequestConfig

请求配置。

```typescript
interface RequestConfig {
  url?: string
  method?: HttpMethod
  baseURL?: string
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
  signal?: AbortSignal
  responseType?: ResponseType
  withCredentials?: boolean
  cache?: boolean | CacheConfig
  retry?: boolean | RetryConfig
  onUploadProgress?: (progress: ProgressEvent) => void
  onDownloadProgress?: (progress: ProgressEvent) => void
}
```

### Response\<T\>

响应对象。

```typescript
interface Response<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
  raw?: any
}
```

### HttpError

HTTP 错误。

```typescript
interface HttpError extends Error {
  config: RequestConfig
  request?: any
  response?: Response
  isHttpError: true
}
```

### CacheConfig

缓存配置。

```typescript
interface CacheConfig {
  enabled: boolean
  ttl?: number
  storage?: 'memory' | 'localStorage' | 'indexedDB'
  keyGenerator?: (config: RequestConfig) => string
  tags?: string[]
  dependencies?: string[]
}
```

### RetryConfig

重试配置。

```typescript
interface RetryConfig {
  enabled: boolean
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  condition?: (error: any) => boolean
  delayFn?: (attempt: number) => number
}
```

### ConcurrencyConfig

并发控制配置。

```typescript
interface ConcurrencyConfig {
  maxConcurrent: number
  maxQueueSize?: number
  deduplication?: boolean
}
```

## 工具函数

### isHttpError

检查是否为 HTTP 错误。

```typescript
function isHttpError(error: any): error is HttpError
```

### isNetworkError

检查是否为网络错误。

```typescript
function isNetworkError(error: any): boolean
```

### isTimeoutError

检查是否为超时错误。

```typescript
function isTimeoutError(error: any): boolean
```

### isCancelError

检查是否为取消错误。

```typescript
function isCancelError(error: any): boolean
```

## 常量

### HTTP_METHODS

HTTP 方法枚举。

```typescript
enum HTTP_METHODS {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}
```

### HTTP_STATUS

HTTP 状态码。

```typescript
enum HTTP_STATUS {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503
}
```

## 下一步

- [HTTP 客户端 API](/api/http-client) - HTTP 客户端详细 API
- [适配器 API](/api/adapters) - 适配器系统 API
- [拦截器 API](/api/interceptors) - 拦截器 API