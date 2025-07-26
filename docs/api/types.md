# 类型定义

@ldesign/http 提供了完整的 TypeScript 类型定义，确保类型安全和优秀的开发体验。

## 🏗️ 核心类型

### HttpMethod

HTTP 请求方法枚举。

```typescript
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}
```

### ResponseType

响应数据类型。

```typescript
type ResponseType = 
  | 'json' 
  | 'text' 
  | 'blob' 
  | 'arraybuffer' 
  | 'document' 
  | 'stream'
```

## 📡 请求和响应类型

### RequestConfig

基础请求配置接口。

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
  withCredentials?: boolean
  auth?: {
    username: string
    password: string
  }
  proxy?: {
    host: string
    port: number
    auth?: {
      username: string
      password: string
    }
  }
}
```

### ExtendedRequestConfig

扩展的请求配置，包含额外功能。

```typescript
interface ExtendedRequestConfig extends RequestConfig {
  // 取消相关
  cancelToken?: CancelToken
  signal?: AbortSignal
  
  // 进度监控
  onUploadProgress?: (progress: ProgressEvent) => void
  onDownloadProgress?: (progress: ProgressEvent) => void
  
  // 缓存配置
  cache?: {
    enabled?: boolean
    ttl?: number
    key?: string
  }
  
  // 重试配置
  retry?: {
    retries?: number
    retryDelay?: number
    retryCondition?: (error: HttpError) => boolean
  }
  
  // 验证配置
  validateStatus?: (status: number) => boolean
  
  // 转换器
  transformRequest?: Array<(data: any, headers: Record<string, string>) => any>
  transformResponse?: Array<(data: any) => any>
  
  // 适配器特定配置
  adapter?: 'fetch' | 'axios' | 'alova'
  customAdapter?: HttpAdapter
}
```

### HttpResponse

HTTP 响应接口。

```typescript
interface HttpResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
  request?: any
}
```

## ⚠️ 错误类型

### HttpError

HTTP 错误接口。

```typescript
interface HttpError extends Error {
  // 基础属性
  name: string
  message: string
  stack?: string
  
  // HTTP 特有属性
  response?: HttpResponse
  request?: RequestConfig
  config?: RequestConfig
  
  // 错误类型标识
  isNetworkError: boolean
  isTimeoutError: boolean
  isCancelError: boolean
  isValidationError: boolean
  
  // 快捷访问
  status?: number
  statusText?: string
  
  // 错误代码
  code?: string
  errno?: number
}
```

### ErrorType

错误类型枚举。

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CANCEL_ERROR = 'CANCEL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  HTTP_ERROR = 'HTTP_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

## 🛡️ 拦截器类型

### RequestInterceptor

请求拦截器接口。

```typescript
interface RequestInterceptor {
  onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  onRejected?: (error: any) => any
}
```

### ResponseInterceptor

响应拦截器接口。

```typescript
interface ResponseInterceptor {
  onFulfilled?: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>
  onRejected?: (error: HttpError) => any
}
```

### InterceptorManager

拦截器管理器接口。

```typescript
interface InterceptorManager<T> {
  use(onFulfilled?: T['onFulfilled'], onRejected?: T['onRejected']): number
  eject(id: number): void
  clear(): void
}
```

## 🚫 取消相关类型

### CancelToken

取消令牌接口。

```typescript
interface CancelToken {
  promise: Promise<Cancel>
  reason?: Cancel
  isCancelled: boolean
  
  cancel(message?: string): void
  onCancel(callback: (reason: Cancel) => void): void
  throwIfRequested(): void
}
```

### Cancel

取消信息接口。

```typescript
interface Cancel {
  message: string
  __CANCEL__: boolean
}
```

### CancelTokenSource

取消令牌源接口。

```typescript
interface CancelTokenSource {
  token: CancelToken
  cancel(message?: string): void
}
```

## 📊 进度类型

### ProgressEvent

进度事件接口。

```typescript
interface ProgressEvent {
  loaded: number      // 已传输字节数
  total: number       // 总字节数
  percentage: number  // 进度百分比 (0-100)
  rate: number        // 传输速率 (字节/秒)
  estimated: number   // 预计剩余时间 (毫秒)
  lengthComputable: boolean // 是否可计算长度
}
```

## 🔧 适配器类型

### HttpAdapter

HTTP 适配器接口。

```typescript
interface HttpAdapter {
  request<T = any>(config: RequestConfig): Promise<HttpResponse<T>>
  cancel(): void
  getName(): string
  getVersion?(): string
  isSupported?(): boolean
}
```

### AdapterInfo

适配器信息接口。

```typescript
interface AdapterInfo {
  name: string
  isCustom: boolean
  version?: string
  features?: string[]
}
```

## 🎨 客户端类型

### HttpClientConfig

HTTP 客户端配置接口。

```typescript
interface HttpClientConfig extends RequestConfig {
  // 适配器配置
  adapter?: 'fetch' | 'axios' | 'alova'
  customAdapter?: HttpAdapter
  
  // 缓存配置
  cache?: CacheConfig
  
  // 重试配置
  retry?: RetryConfig
  
  // 拦截器配置
  interceptors?: {
    request?: RequestInterceptor[]
    response?: ResponseInterceptor[]
  }
  
  // 默认配置
  defaults?: Partial<RequestConfig>
}
```

### HttpClientInstance

HTTP 客户端实例接口。

```typescript
interface HttpClientInstance {
  // HTTP 方法
  get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>
  delete<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>
  head<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
  options<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
  request<T = any>(config: ExtendedRequestConfig): Promise<HttpResponse<T>>
  
  // 拦截器管理
  addRequestInterceptor(interceptor: RequestInterceptor): number
  addResponseInterceptor(interceptor: ResponseInterceptor): number
  removeInterceptor(type: 'request' | 'response', id: number): void
  clearRequestInterceptors(): void
  clearResponseInterceptors(): void
  clearAllInterceptors(): void
  
  // 配置管理
  getDefaults(): HttpClientConfig
  setDefaults(config: Partial<HttpClientConfig>): void
  
  // 取消功能
  createCancelToken(): CancelToken
  
  // 事件系统
  on(event: EventType, listener: EventListener): void
  off(event: EventType, listener: EventListener): void
  emit(event: EventType, data: any): void
  once(event: EventType, listener: EventListener): void
  
  // 适配器管理
  getAdapterInfo(): AdapterInfo
  switchAdapter(adapter: string): boolean
}
```

## 💾 缓存类型

### CacheConfig

缓存配置接口。

```typescript
interface CacheConfig {
  enabled?: boolean
  ttl?: number // 生存时间 (毫秒)
  maxSize?: number // 最大缓存条目数
  keyGenerator?: (config: RequestConfig) => string
  storage?: CacheStorage
  exclude?: string[] | RegExp[] // 排除的URL模式
  include?: string[] | RegExp[] // 包含的URL模式
}
```

### CacheStorage

缓存存储接口。

```typescript
interface CacheStorage {
  get(key: string): Promise<CacheItem | null>
  set(key: string, value: CacheItem): Promise<void>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
  keys(): Promise<string[]>
  size(): Promise<number>
}
```

### CacheItem

缓存项接口。

```typescript
interface CacheItem {
  data: any
  timestamp: number
  ttl: number
  headers?: Record<string, string>
  etag?: string
}
```

## 🔄 重试类型

### RetryConfig

重试配置接口。

```typescript
interface RetryConfig {
  retries?: number // 重试次数
  retryDelay?: number // 重试延迟 (毫秒)
  retryCondition?: (error: HttpError) => boolean // 重试条件
  onRetry?: (error: HttpError, retryCount: number) => void // 重试回调
}
```

### ExtendedRetryConfig

扩展重试配置接口。

```typescript
interface ExtendedRetryConfig extends RetryConfig {
  strategy?: 'fixed' | 'exponential' | 'linear' | 'custom'
  maxDelay?: number // 最大延迟
  jitter?: number // 抖动因子
  delayCalculator?: (retryCount: number, error: HttpError) => number
  onRetryFailed?: (error: HttpError, retryCount: number) => void
}
```

## 📡 事件类型

### EventType

事件类型枚举。

```typescript
type EventType = 
  | 'request'
  | 'response'
  | 'error'
  | 'retry'
  | 'cache-hit'
  | 'cache-miss'
  | 'upload-progress'
  | 'download-progress'
```

### EventListener

事件监听器类型。

```typescript
type EventListener = (event: EventData) => void
```

### EventData

事件数据接口。

```typescript
interface EventData {
  type: EventType
  timestamp: number
  config?: RequestConfig
  response?: HttpResponse
  error?: HttpError
  progress?: ProgressEvent
  retryCount?: number
  cacheKey?: string
}
```

## 🎨 Vue 集成类型

### UseRequestOptions

Vue 请求选项接口。

```typescript
interface UseRequestOptions<T> extends ExtendedRequestConfig {
  immediate?: boolean // 是否立即执行
  initialData?: T // 初始数据
  resetOnExecute?: boolean // 执行时是否重置状态
  
  // 生命周期回调
  onSuccess?: (data: T, response: HttpResponse<T>) => void
  onError?: (error: HttpError) => void
  onFinally?: () => void
  
  // 依赖项
  deps?: Ref<any>[] | (() => any[])
  
  // 防抖和节流
  debounce?: number
  throttle?: number
}
```

### UseRequestResult

Vue 请求结果接口。

```typescript
interface UseRequestResult<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<HttpError | null>
  finished: Ref<boolean>
  cancelled: Ref<boolean>
  
  execute: (config?: Partial<ExtendedRequestConfig>) => Promise<HttpResponse<T>>
  cancel: (reason?: string) => void
  reset: () => void
  refresh: () => Promise<HttpResponse<T>>
}
```

## 🔌 插件类型

### HttpPlugin

HTTP 插件接口。

```typescript
interface HttpPlugin {
  name: string
  version?: string
  install(client: HttpClientInstance): void
  uninstall?(client: HttpClientInstance): void
}
```

### PluginOptions

插件选项接口。

```typescript
interface PluginOptions {
  [key: string]: any
}
```

## 📚 工具类型

### DeepPartial

深度可选类型。

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
```

### Awaitable

可等待类型。

```typescript
type Awaitable<T> = T | Promise<T>
```

### MaybeRef

可能是 Ref 的类型。

```typescript
type MaybeRef<T> = T | Ref<T>
```

## 📚 下一步

了解类型定义后，你可以继续学习：

- [工具函数](/api/utils) - 实用工具函数
- [插件开发](/plugins/development) - 开发自定义插件
- [Vue 集成](/vue/) - Vue3 集成功能
- [最佳实践](/guide/best-practices) - 使用最佳实践
