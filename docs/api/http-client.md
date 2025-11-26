# HTTP 客户端 API

HTTP 客户端的完整 API 参考。

## HttpClient

### 构造函数

```typescript
constructor(config?: HttpConfig)
```

### HTTP 方法

#### get

```typescript
get<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
```

#### post

```typescript
post<T = any, D = any>(url: string, data?: D, config?: RequestConfig): Promise<Response<T>>
```

#### put

```typescript
put<T = any, D = any>(url: string, data?: D, config?: RequestConfig): Promise<Response<T>>
```

#### patch

```typescript
patch<T = any, D = any>(url: string, data?: D, config?: RequestConfig): Promise<Response<T>>
```

#### delete

```typescript
delete<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
```

#### head

```typescript
head<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
```

#### options

```typescript
options<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>
```

### 文件操作

#### upload

```typescript
upload(url: string, data: FormData, config?: UploadConfig): Promise<UploadResponse>
```

#### download

```typescript
download(url: string, config?: DownloadConfig): Promise<DownloadResponse>
```

### 拦截器

#### addRequestInterceptor

```typescript
addRequestInterceptor(interceptor: RequestInterceptor): number
```

#### addResponseInterceptor

```typescript
addResponseInterceptor(
  onFulfilled?: ResponseInterceptor,
  onRejected?: ErrorInterceptor
): number
```

#### removeRequestInterceptor

```typescript
removeRequestInterceptor(id: number): void
```

#### removeResponseInterceptor

```typescript
removeResponseInterceptor(id: number): void
```

### 其他方法

#### clearCache

```typescript
clearCache(pattern?: string | RegExp): Promise<void>
```

#### getStats

```typescript
getStats(): HttpStats
```

#### setConfig

```typescript
setConfig(config: Partial<HttpConfig>): void
```

## 类型定义

### HttpConfig

```typescript
interface HttpConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  adapter?: 'fetch' | 'axios' | 'alova' | HttpAdapter
  withCredentials?: boolean
  responseType?: ResponseType
  cache?: CacheConfig
  retry?: RetryConfig
  concurrency?: ConcurrencyConfig
}
```

### RequestConfig

```typescript
interface RequestConfig {
  url?: string
  method?: HttpMethod
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
  signal?: AbortSignal
  responseType?: ResponseType
  cache?: boolean | CacheConfig
  retry?: boolean | RetryConfig
  onUploadProgress?: (progress: ProgressEvent) => void
  onDownloadProgress?: (progress: ProgressEvent) => void
}
```

### Response

```typescript
interface Response<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
}
```

## 下一步

- [核心 API](/api/core) - 完整 API 参考
- [HTTP 客户端](/guide/http-client) - 使用指南