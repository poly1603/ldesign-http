# API 参考

本页面提供 @ldesign/http 的完整 API 参考。

## 核心函数

### createHttpClient

创建一个新的 HTTP 客户端实例。

```typescript
function createHttpClient(config?: HttpClientConfig): HttpClient
```

**参数:**
- `config` - 可选的配置对象

**返回值:**
- `HttpClient` - HTTP 客户端实例

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

### createQuickClient

快速创建带有常用功能的 HTTP 客户端。

```typescript
function createQuickClient(options: QuickClientOptions): HttpClient
```

**参数:**
```typescript
interface QuickClientOptions {
  baseURL?: string
  timeout?: number
  adapter?: 'fetch' | 'axios' | 'alova'
  enableCache?: boolean
  enableRetry?: boolean
  enableLog?: boolean
  authToken?: string | (() => string | Promise<string>)
}
```

**示例:**
```typescript
import { createQuickClient } from '@ldesign/http'

const client = createQuickClient({
  baseURL: 'https://api.example.com',
  enableCache: true,
  enableRetry: true,
  enableLog: true,
  authToken: () => localStorage.getItem('token')
})
```

## 适配器函数

### createFetchHttpClient

创建使用 Fetch 适配器的 HTTP 客户端。

```typescript
function createFetchHttpClient(config?: HttpClientConfig): HttpClient
```

### createAxiosHttpClient

创建使用 Axios 适配器的 HTTP 客户端。

```typescript
function createAxiosHttpClient(config?: HttpClientConfig): HttpClient
```

### createAlovaHttpClient

创建使用 Alova 适配器的 HTTP 客户端。

```typescript
function createAlovaHttpClient(config?: HttpClientConfig): HttpClient
```

## Vue3 集成

### createHttpPlugin

创建 Vue3 插件。

```typescript
function createHttpPlugin(config?: HttpClientConfig): Plugin
```

**示例:**
```typescript
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http'

const app = createApp(App)
app.use(createHttpPlugin({
  baseURL: 'https://api.example.com'
}))
```

### useHttp

获取全局 HTTP 客户端实例。

```typescript
function useHttp(): HttpClientInstance
```

**示例:**
```typescript
import { useHttp } from '@ldesign/http'

const http = useHttp()
const response = await http.get('/users')
```

### useRequest

通用请求组合式函数。

```typescript
function useRequest<T>(
  url: string | (() => string | null),
  options?: UseRequestOptions<T>
): UseRequestResult<T>
```

**参数:**
```typescript
interface UseRequestOptions<T> extends ExtendedRequestConfig {
  immediate?: boolean
  initialData?: T
  onSuccess?: (data: T, response: HttpResponse<T>) => void
  onError?: (error: HttpError) => void
  onFinally?: () => void
  resetOnExecute?: boolean
}
```

**返回值:**
```typescript
interface UseRequestResult<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<HttpError | null>
  finished: Ref<boolean>
  cancelled: Ref<boolean>
  execute: (config?: Partial<ExtendedRequestConfig>) => Promise<HttpResponse<T>>
  cancel: () => void
  reset: () => void
  refresh: () => Promise<HttpResponse<T>>
}
```

### useGet

GET 请求组合式函数。

```typescript
function useGet<T>(
  url: string | (() => string | null),
  options?: Omit<UseRequestOptions<T>, 'method'>
): UseRequestResult<T>
```

### usePost

POST 请求组合式函数。

```typescript
function usePost<T>(
  url: string | (() => string | null),
  options?: Omit<UseRequestOptions<T>, 'method'>
): UseRequestResult<T>
```

### usePut

PUT 请求组合式函数。

```typescript
function usePut<T>(
  url: string | (() => string | null),
  options?: Omit<UseRequestOptions<T>, 'method'>
): UseRequestResult<T>
```

### useDelete

DELETE 请求组合式函数。

```typescript
function useDelete<T>(
  url: string | (() => string | null),
  options?: Omit<UseRequestOptions<T>, 'method'>
): UseRequestResult<T>
```

## 插件函数

### createCachePlugin

创建缓存插件。

```typescript
function createCachePlugin(config?: CacheConfig): HttpPlugin
```

**参数:**
```typescript
interface CacheConfig {
  enabled?: boolean
  ttl?: number
  keyGenerator?: (config: RequestConfig) => string
  storage?: CacheStorage
}
```

### createRetryPlugin

创建重试插件。

```typescript
function createRetryPlugin(config?: ExtendedRetryConfig): HttpPlugin
```

**参数:**
```typescript
interface ExtendedRetryConfig extends RetryConfig {
  strategy?: 'fixed' | 'exponential' | 'linear' | 'custom'
  maxDelay?: number
  jitter?: number
  onRetry?: (error: HttpError, retryCount: number) => void
  onRetryFailed?: (error: HttpError, retryCount: number) => void
}
```

### 拦截器函数

#### createAuthInterceptor

创建认证拦截器。

```typescript
function createAuthInterceptor(config: AuthInterceptorConfig): RequestInterceptor
```

#### createLogInterceptor

创建日志拦截器。

```typescript
function createLogInterceptor(config?: LogInterceptorConfig): {
  request: RequestInterceptor
  response: ResponseInterceptor
}
```

#### createErrorHandlerInterceptor

创建错误处理拦截器。

```typescript
function createErrorHandlerInterceptor(
  errorHandler: (error: HttpError) => void | Promise<void>
): ResponseInterceptor
```

## 缓存存储

### createMemoryCache

创建内存缓存存储。

```typescript
function createMemoryCache(): MemoryCacheStorage
```

### createLocalStorageCache

创建 localStorage 缓存存储。

```typescript
function createLocalStorageCache(prefix?: string): LocalStorageCacheStorage
```

### createSessionStorageCache

创建 sessionStorage 缓存存储。

```typescript
function createSessionStorageCache(prefix?: string): SessionStorageCacheStorage
```

## 重试配置

### createFixedRetryConfig

创建固定延迟重试配置。

```typescript
function createFixedRetryConfig(
  retries?: number,
  delay?: number
): ExtendedRetryConfig
```

### createExponentialRetryConfig

创建指数退避重试配置。

```typescript
function createExponentialRetryConfig(
  retries?: number,
  initialDelay?: number,
  maxDelay?: number
): ExtendedRetryConfig
```

### createLinearRetryConfig

创建线性增长重试配置。

```typescript
function createLinearRetryConfig(
  retries?: number,
  delay?: number
): ExtendedRetryConfig
```

### createCustomRetryConfig

创建自定义重试配置。

```typescript
function createCustomRetryConfig(
  retries: number,
  delayCalculator: (retryCount: number, error: HttpError) => number,
  retryCondition?: (error: HttpError) => boolean
): ExtendedRetryConfig
```

## 默认导出

### http

默认的 HTTP 客户端实例，提供便捷的方法。

```typescript
const http: {
  get: <T>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>
  post: <T>(url: string, data?: any, config?: RequestConfig) => Promise<HttpResponse<T>>
  put: <T>(url: string, data?: any, config?: RequestConfig) => Promise<HttpResponse<T>>
  delete: <T>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>
  patch: <T>(url: string, data?: any, config?: RequestConfig) => Promise<HttpResponse<T>>
  head: <T>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>
  options: <T>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>
  request: <T>(config: ExtendedRequestConfig) => Promise<HttpResponse<T>>
  
  addRequestInterceptor: (interceptor: RequestInterceptor) => number
  addResponseInterceptor: (interceptor: ResponseInterceptor) => number
  removeInterceptor: (type: 'request' | 'response', id: number) => void
  
  getDefaults: () => HttpClientConfig
  setDefaults: (config: Partial<HttpClientConfig>) => void
  
  createCancelToken: () => CancelToken
  
  on: (event: EventType, listener: EventListener) => void
  off: (event: EventType, listener: EventListener) => void
  emit: (event: EventType, data: any) => void
  once: (event: EventType, listener: EventListener) => void
  
  getInstance: () => HttpClient
}
```

**示例:**
```typescript
import http from '@ldesign/http'

// 直接使用默认实例
const response = await http.get('/users')

// 添加拦截器
http.addRequestInterceptor({
  onFulfilled: (config) => {
    config.headers.Authorization = `Bearer ${token}`
    return config
  }
})
```

## 类型定义

详细的类型定义请参考 [类型定义](/api/types) 页面。
