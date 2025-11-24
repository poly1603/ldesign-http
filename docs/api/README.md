# @ldesign/http API 文档

欢迎使用 `@ldesign/http` API 文档！本文档提供了完整的 API 参考和使用指南。

---

## 📋 目录

- [核心 API](#核心-api)
- [客户端 API](#客户端-api)
- [拦截器 API](#拦截器-api)
- [缓存 API](#缓存-api)
- [工具函数](#工具函数)
- [类型定义](#类型定义)
- [Vue 集成](#vue-集成)

---

## 🎯 核心 API

### `createHttpClient(config?, adapter?)`

创建 HTTP 客户端实例。

**参数**:
- `config` (可选): `HttpClientConfig` - 客户端配置
- `adapter` (可选): `HttpAdapter` - HTTP 适配器

**返回**: `HttpClient` - HTTP 客户端实例

**示例**:
```typescript
import { createHttpClient } from '@ldesign/http'

const httpClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

**配置选项**:

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `baseURL` | `string` | `''` | 基础 URL |
| `timeout` | `number` | `10000` | 超时时间（毫秒） |
| `headers` | `Record<string, string>` | `{}` | 默认请求头 |
| `withCredentials` | `boolean` | `false` | 是否发送 Cookie |
| `cache` | `CacheConfig` | - | 缓存配置 |
| `retry` | `RetryConfig` | - | 重试配置 |
| `concurrency` | `ConcurrencyConfig` | - | 并发配置 |
| `monitor` | `MonitorConfig` | - | 监控配置 |

---

## 🌐 客户端 API

### `httpClient.get<T>(url, config?)`

发送 GET 请求。

**类型参数**:
- `T`: 响应数据类型

**参数**:
- `url`: `string` - 请求 URL
- `config` (可选): `RequestConfig` - 请求配置

**返回**: `Promise<HttpResponse<T>>` - 响应对象

**示例**:
```typescript
interface User {
  id: number
  name: string
  email: string
}

const response = await httpClient.get<User>('/users/1')
console.log(response.data.name)
```

### `httpClient.post<T>(url, data?, config?)`

发送 POST 请求。

**类型参数**:
- `T`: 响应数据类型

**参数**:
- `url`: `string` - 请求 URL
- `data` (可选): `any` - 请求体数据
- `config` (可选): `RequestConfig` - 请求配置

**返回**: `Promise<HttpResponse<T>>` - 响应对象

**示例**:
```typescript
const response = await httpClient.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
})
```

### `httpClient.put<T>(url, data?, config?)`

发送 PUT 请求。

**参数**: 同 `post`

**返回**: `Promise<HttpResponse<T>>`

### `httpClient.patch<T>(url, data?, config?)`

发送 PATCH 请求。

**参数**: 同 `post`

**返回**: `Promise<HttpResponse<T>>`

### `httpClient.delete<T>(url, config?)`

发送 DELETE 请求。

**参数**: 同 `get`

**返回**: `Promise<HttpResponse<T>>`

### `httpClient.request<T>(config)`

发送自定义请求。

**参数**:
- `config`: `RequestConfig` - 完整的请求配置

**返回**: `Promise<HttpResponse<T>>`

**示例**:
```typescript
const response = await httpClient.request<User>({
  url: '/users/1',
  method: 'GET',
  params: { include: 'posts' },
})
```

### `httpClient.upload(url, files, config?)`

上传文件。

**参数**:
- `url`: `string` - 上传 URL
- `files`: `File | File[]` - 文件或文件数组
- `config` (可选): `UploadConfig` - 上传配置

**返回**: `Promise<UploadResult>` - 上传结果

**示例**:
```typescript
const result = await httpClient.upload('/upload', file, {
  onProgress: (progress) => {
    console.log(`上传进度: ${progress.percentage}%`)
  },
  chunkSize: 1024 * 1024, // 1MB 分片
})
```

### `httpClient.download(url, config?)`

下载文件。

**参数**:
- `url`: `string` - 下载 URL
- `config` (可选): `DownloadConfig` - 下载配置

**返回**: `Promise<DownloadResult>` - 下载结果

**示例**:
```typescript
const result = await httpClient.download('/files/document.pdf', {
  filename: 'my-document.pdf',
  onProgress: (progress) => {
    console.log(`下载进度: ${progress.percentage}%`)
  },
  autoSave: true,
})
```

### `httpClient.batch(requests)`

批量发送请求。

**参数**:
- `requests`: `RequestConfig[]` - 请求配置数组

**返回**: `Promise<HttpResponse[]>` - 响应数组

**示例**:
```typescript
const results = await httpClient.batch([
  { url: '/users' },
  { url: '/posts' },
  { url: '/comments' },
])
```

---

## 🔌 拦截器 API

### `httpClient.interceptors.request.use(onFulfilled, onRejected?)`

添加请求拦截器。

**参数**:
- `onFulfilled`: `(config: RequestConfig) => RequestConfig | Promise<RequestConfig>` - 成功处理函数
- `onRejected` (可选): `(error: any) => any` - 错误处理函数

**返回**: `number` - 拦截器 ID

**示例**:
```typescript
const id = httpClient.interceptors.request.use(
  (config) => {
    // 添加 Token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

### `httpClient.interceptors.request.eject(id)`

移除请求拦截器。

**参数**:
- `id`: `number` - 拦截器 ID

**示例**:
```typescript
httpClient.interceptors.request.eject(id)
```

### `httpClient.interceptors.response.use(onFulfilled, onRejected?)`

添加响应拦截器。

**参数**:
- `onFulfilled`: `(response: HttpResponse) => HttpResponse | Promise<HttpResponse>` - 成功处理函数
- `onRejected` (可选): `(error: any) => any` - 错误处理函数

**返回**: `number` - 拦截器 ID

**示例**:
```typescript
httpClient.interceptors.response.use(
  (response) => {
    // 处理响应数据
    return response
  },
  (error) => {
    // 处理错误
    if (error.response?.status === 401) {
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
```

### `httpClient.interceptors.response.eject(id)`

移除响应拦截器。

**参数**:
- `id`: `number` - 拦截器 ID

### `httpClient.interceptors.error.use(onRejected)`

添加错误拦截器。

**参数**:
- `onRejected`: `(error: any) => any` - 错误处理函数

**返回**: `number` - 拦截器 ID

**示例**:
```typescript
httpClient.interceptors.error.use((error) => {
  if (error.isNetworkError) {
    message.error('网络连接失败')
  }
  return Promise.reject(error)
})
```

---

## 💾 缓存 API

### `httpClient.clearCache()`

清除所有缓存。

**返回**: `Promise<void>`

**示例**:
```typescript
await httpClient.clearCache()
```

### `httpClient.invalidateCache(url)`

使指定 URL 的缓存失效。

**参数**:
- `url`: `string` - 要失效的 URL

**返回**: `Promise<void>`

**示例**:
```typescript
// 更新用户后，使用户列表缓存失效
await httpClient.post('/users', userData)
await httpClient.invalidateCache('/users')
```

### `httpClient.getCacheStats()`

获取缓存统计信息。

**返回**: `CacheStats` - 缓存统计

**示例**:
```typescript
const stats = httpClient.getCacheStats()
console.log('缓存命中率:', stats.hitRate)
console.log('缓存大小:', stats.size)
```

---

## 🛠️ 工具函数

### `RequestSerializer`

请求序列化器，用于生成缓存键。

**构造函数**:
```typescript
new RequestSerializer(options?: SerializerOptions)
```

**选项**:
- `includeMethod`: `boolean` - 是否包含请求方法（默认: `true`）
- `includeUrl`: `boolean` - 是否包含 URL（默认: `true`）
- `includeParams`: `boolean` - 是否包含查询参数（默认: `true`）
- `includeData`: `boolean` - 是否包含请求体（默认: `true`）
- `includeHeaders`: `boolean` - 是否包含请求头（默认: `false`）

**方法**:

#### `generateKey(config)`

生成缓存键。

**参数**:
- `config`: `RequestConfig` - 请求配置

**返回**: `string` - 缓存键

**示例**:
```typescript
import { RequestSerializer } from '@ldesign/http/utils'

const serializer = new RequestSerializer({
  includeMethod: true,
  includeUrl: true,
  includeParams: true,
})

const key = serializer.generateKey({
  method: 'GET',
  url: '/users',
  params: { page: 1 },
})
// 返回: "GET:/users:{"page":1}"
```

#### `serialize(config)`

序列化请求配置。

**参数**:
- `config`: `RequestConfig` - 请求配置

**返回**: `string` - 序列化后的字符串

### `createDebugger(options)`

创建调试器。

**参数**:
- `options`: `DebuggerOptions` - 调试器选项

**返回**: `Debugger` - 调试器实例

**示例**:
```typescript
import { createDebugger } from '@ldesign/http/utils'

const debugger = createDebugger({
  enabled: true,
  logLevel: 'debug',
})
```

---

## 📘 类型定义

### `HttpClientConfig`

HTTP 客户端配置。

```typescript
interface HttpClientConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  withCredentials?: boolean
  cache?: CacheConfig
  retry?: RetryConfig
  concurrency?: ConcurrencyConfig
  monitor?: MonitorConfig
}
```

### `RequestConfig`

请求配置。

```typescript
interface RequestConfig {
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: Record<string, any>
  data?: any
  headers?: Record<string, string>
  timeout?: number
  signal?: AbortSignal
  cache?: CacheConfig
  retry?: RetryConfig
  priority?: 'high' | 'normal' | 'low'
}
```

### `HttpResponse<T>`

HTTP 响应。

```typescript
interface HttpResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
}
```

### `CacheConfig`

缓存配置。

```typescript
interface CacheConfig {
  enabled?: boolean
  ttl?: number
  maxSize?: number
  keyGenerator?: (config: RequestConfig) => string
}
```

### `RetryConfig`

重试配置。

```typescript
interface RetryConfig {
  retries?: number
  retryDelay?: number
  retryCondition?: (error: any) => boolean
}
```

### `ConcurrencyConfig`

并发配置。

```typescript
interface ConcurrencyConfig {
  maxConcurrent?: number
  enableDeduplication?: boolean
}
```

### `MonitorConfig`

监控配置。

```typescript
interface MonitorConfig {
  enabled?: boolean
  slowRequestThreshold?: number
}
```

### `UploadConfig`

上传配置。

```typescript
interface UploadConfig extends RequestConfig {
  onProgress?: (progress: UploadProgress) => void
  chunkSize?: number
}
```

### `UploadProgress`

上传进度。

```typescript
interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}
```

### `DownloadConfig`

下载配置。

```typescript
interface DownloadConfig extends RequestConfig {
  filename?: string
  onProgress?: (progress: DownloadProgress) => void
  autoSave?: boolean
}
```

---

## 🎨 Vue 集成

### `useHttp()`

Vue 3 组合式 API Hook。

**返回**: `HttpClient` - HTTP 客户端实例

**示例**:
```typescript
import { useHttp } from '@ldesign/http/vue'

export default {
  setup() {
    const http = useHttp()

    const fetchUsers = async () => {
      const response = await http.get('/users')
      return response.data
    }

    return { fetchUsers }
  }
}
```

### `HttpPlugin`

Vue 3 插件。

**安装**:
```typescript
import { createApp } from 'vue'
import { HttpPlugin } from '@ldesign/http/vue'

const app = createApp(App)
app.use(HttpPlugin, {
  baseURL: '/api',
  timeout: 10000,
})
```

**使用**:
```typescript
import { useHttp } from '@ldesign/http/vue'

const http = useHttp()
```

---

## 📊 性能监控 API

### `httpClient.getPerformanceStats()`

获取性能统计。

**返回**: `PerformanceStats` - 性能统计

**示例**:
```typescript
const stats = httpClient.getPerformanceStats()
console.log('总请求数:', stats.totalRequests)
console.log('平均响应时间:', stats.averageResponseTime)
```

### `httpClient.getSlowRequests()`

获取慢请求列表。

**返回**: `SlowRequest[]` - 慢请求数组

**示例**:
```typescript
const slowRequests = httpClient.getSlowRequests()
slowRequests.forEach((req) => {
  console.log(`慢请求: ${req.url}, 耗时: ${req.duration}ms`)
})
```

### `httpClient.exportMetrics()`

导出所有性能指标。

**返回**: `Metrics` - 性能指标

**示例**:
```typescript
const metrics = httpClient.exportMetrics()
await fetch('/analytics', {
  method: 'POST',
  body: JSON.stringify(metrics),
})
```

---

## 🧹 资源管理 API

### `httpClient.destroy()`

销毁客户端，释放所有资源。

**返回**: `void`

**示例**:
```typescript
// 应用卸载时销毁客户端
window.addEventListener('beforeunload', () => {
  httpClient.destroy()
})
```

---

## 📚 更多资源

- [最佳实践指南](../BEST_PRACTICES.md)
- [性能优化指南](../PERFORMANCE.md)
- [常见问题](../FAQ.md)
- [示例代码](../../examples/README.md)

---

**持续更新中...** 如果您发现文档有误或需要补充，欢迎贡献！ 🙏


