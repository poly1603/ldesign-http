# @ldesign/http 🚀

一个功能强大、灵活且现代的 HTTP 请求库，专为 Vue3 设计，同时支持多种适配器和框架扩展。

## ✨ 特性

- 🎯 **多适配器支持** - 支持原生 fetch、axios 和 alova 三种适配器
- 🔧 **TypeScript 优先** - 完整的 TypeScript 支持，提供优秀的开发体验
- ⚡ **Vue3 深度集成** - 提供组合式函数和插件，完美融入 Vue3 生态
- 🔄 **智能重试机制** - 支持多种重试策略（固定延迟、指数退避、线性增长）
- 💾 **灵活缓存系统** - 支持内存、localStorage、sessionStorage 多种缓存方式
- 🛡️ **强大的拦截器** - 请求/响应拦截器，支持认证、日志、错误处理等
- 📊 **进度监控** - 支持上传/下载进度监控
- 🚫 **请求取消** - 支持请求取消和超时控制
- 🎨 **插件系统** - 可扩展的插件架构
- 🔍 **事件系统** - 完整的事件监听和触发机制

## 📦 安装

```bash
# 使用 pnpm（推荐）
pnpm add @ldesign/http

# 使用 npm
npm install @ldesign/http

# 使用 yarn
yarn add @ldesign/http
```

## 🚀 快速开始

### 基础使用

```typescript
import { createHttpClient } from '@ldesign/http'

// 创建客户端实例
const http = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
})

// 发送 GET 请求
const response = await http.get('/users')
console.log(response.data)

// 发送 POST 请求
const newUser = await http.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
```

### Vue3 集成

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http'
import App from './App.vue'

const app = createApp(App)

// 安装 HTTP 插件
app.use(createHttpPlugin({
  baseURL: 'https://api.example.com',
  timeout: 10000
}))

app.mount('#app')
```

```vue
<!-- 在组件中使用 -->
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <div v-else>
      <h1>用户列表</h1>
      <ul>
        <li v-for="user in data" :key="user.id">
          {{ user.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGet } from '@ldesign/http'

// 使用组合式函数
const { data, loading, error, refresh } = useGet<User[]>('/users')

interface User {
  id: number
  name: string
  email: string
}
</script>
```

## 🎛️ 适配器

### 原生 Fetch 适配器

```typescript
import { createFetchHttpClient } from '@ldesign/http'

const client = createFetchHttpClient({
  baseURL: 'https://api.example.com'
})
```

### Axios 适配器

```typescript
import { createAxiosHttpClient } from '@ldesign/http'

const client = createAxiosHttpClient({
  baseURL: 'https://api.example.com'
})
```

### Alova 适配器

```typescript
import { createAlovaHttpClient } from '@ldesign/http'

const client = createAlovaHttpClient({
  baseURL: 'https://api.example.com'
})
```

### 动态切换适配器

```typescript
import { createHttpClient } from '@ldesign/http'

const client = createHttpClient()

// 切换到 axios 适配器
client.switchAdapter('axios')

// 获取当前适配器信息
const info = client.getAdapterInfo()
console.log(info.name) // 'axios'
```

## 🔧 配置选项

```typescript
interface HttpClientConfig {
  // 基础配置
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>

  // 适配器配置
  adapter?: 'fetch' | 'axios' | 'alova'
  customAdapter?: HttpAdapter

  // 缓存配置
  cache?: {
    enabled?: boolean
    ttl?: number
    storage?: CacheStorage
  }

  // 重试配置
  retry?: {
    retries?: number
    retryDelay?: number
    retryCondition?: (error: HttpError) => boolean
  }

  // 拦截器配置
  interceptors?: {
    request?: RequestInterceptor[]
    response?: ResponseInterceptor[]
  }
}
```

## 🔄 重试机制

### 基础重试

```typescript
import { createHttpClient, createRetryPlugin } from '@ldesign/http'

const client = createHttpClient()

// 安装重试插件
const retryPlugin = createRetryPlugin({
  retries: 3,
  retryDelay: 1000,
  strategy: 'exponential' // 指数退避
})

retryPlugin.install(client)
```

### 自定义重试策略

```typescript
import { createCustomRetryConfig } from '@ldesign/http'

const retryConfig = createCustomRetryConfig(
  3, // 重试次数
  (retryCount, error) => {
    // 自定义延迟计算
    return Math.min(1000 * Math.pow(2, retryCount), 10000)
  },
  (error) => {
    // 自定义重试条件
    return error.isNetworkError || (error.response?.status >= 500)
  }
)
```

## 💾 缓存系统

### 内存缓存

```typescript
import { createHttpClient, createCachePlugin, createMemoryCache } from '@ldesign/http'

const client = createHttpClient()

const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 5 * 60 * 1000, // 5分钟
  storage: createMemoryCache()
})

cachePlugin.install(client)
```

### LocalStorage 缓存

```typescript
import { createLocalStorageCache } from '@ldesign/http'

const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 30 * 60 * 1000, // 30分钟
  storage: createLocalStorageCache('api_cache_')
})
```

### 自定义缓存键

```typescript
const cachePlugin = createCachePlugin({
  enabled: true,
  keyGenerator: (config) => {
    // 自定义缓存键生成逻辑
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}`
  }
})
```

## 🛡️ 拦截器

### 认证拦截器

```typescript
import { createAuthInterceptor } from '@ldesign/http'

const authInterceptor = createAuthInterceptor({
  getToken: () => localStorage.getItem('token') || '',
  tokenType: 'Bearer',
  headerName: 'Authorization'
})

client.addRequestInterceptor(authInterceptor)
```

### 日志拦截器

```typescript
import { createLogInterceptor } from '@ldesign/http'

const logInterceptors = createLogInterceptor({
  logRequests: true,
  logResponses: true,
  logErrors: true
})

client.addRequestInterceptor(logInterceptors.request)
client.addResponseInterceptor(logInterceptors.response)
```

### 自定义拦截器

```typescript
// 请求拦截器
client.addRequestInterceptor({
  onFulfilled: (config) => {
    // 添加时间戳
    config.headers = {
      ...config.headers,
      'X-Timestamp': Date.now().toString()
    }
    return config
  },
  onRejected: (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
})

// 响应拦截器
client.addResponseInterceptor({
  onFulfilled: (response) => {
    // 统一处理响应数据
    if (response.data.code !== 200) {
      throw new Error(response.data.message)
    }
    return response
  },
  onRejected: (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 跳转到登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
})
```

## 🎨 Vue3 组合式函数

### useRequest - 通用请求

```typescript
import { useRequest } from '@ldesign/http'

const { data, loading, error, execute, cancel, refresh } = useRequest('/api/users', {
  immediate: false, // 不立即执行
  onSuccess: (data) => {
    console.log('请求成功:', data)
  },
  onError: (error) => {
    console.error('请求失败:', error)
  }
})

// 手动执行请求
const handleSubmit = async () => {
  try {
    await execute({
      method: 'POST',
      data: { name: 'John' }
    })
  } catch (err) {
    console.error(err)
  }
}
```

### useGet - GET 请求

```typescript
import { useGet } from '@ldesign/http'

// 响应式 URL
const userId = ref(1)
const { data: user, loading, error } = useGet(() => `/users/${userId.value}`)

// 当 userId 变化时，会自动重新请求
```

### usePost - POST 请求

```typescript
import { usePost } from '@ldesign/http'

const { data, loading, error, execute } = usePost('/users', {
  immediate: false
})

const createUser = async (userData: any) => {
  await execute({ data: userData })
}
```

### 分页请求

```typescript
import { usePagination } from '@ldesign/http'

const {
  data,
  loading,
  currentPage,
  pageSize,
  total,
  totalPages,
  goToPage,
  nextPage,
  previousPage
} = usePagination('/users', {
  pageSize: 10,
  params: { status: 'active' }
})

// 跳转到第2页
await goToPage(2)

// 下一页
await nextPage()
```

## 📊 进度监控

```typescript
// 上传文件with进度监控
const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await client.post('/upload', formData, {
    onUploadProgress: (progress) => {
      console.log(`上传进度: ${progress.percentage}%`)
    }
  })

  return response.data
}

// 下载文件with进度监控
const downloadFile = async (url: string) => {
  const response = await client.get(url, {
    responseType: 'blob',
    onDownloadProgress: (progress) => {
      console.log(`下载进度: ${progress.percentage}%`)
    }
  })

  return response.data
}
```

## 🚫 请求取消

```typescript
// 创建取消令牌
const cancelToken = client.createCancelToken()

// 发送可取消的请求
const request = client.get('/long-running-task', {
  cancelToken
})

// 取消请求
setTimeout(() => {
  cancelToken.cancel('用户取消了请求')
}, 5000)

try {
  const response = await request
} catch (error) {
  if (error.isCancelError) {
    console.log('请求被取消:', error.message)
  }
}
```

## ⚠️ 错误处理

```typescript
import type { HttpError } from '@ldesign/http'

try {
  const response = await client.get('/api/data')
} catch (error: HttpError) {
  if (error.isNetworkError) {
    console.error('网络错误')
  } else if (error.isTimeoutError) {
    console.error('请求超时')
  } else if (error.isCancelError) {
    console.error('请求被取消')
  } else if (error.response) {
    // 服务器响应错误
    console.error(`HTTP错误: ${error.response.status}`)
    console.error('错误数据:', error.response.data)
  } else {
    console.error('未知错误:', error.message)
  }
}
```

## 📡 事件系统

```typescript
// 监听请求事件
client.on('request', (event) => {
  console.log('发送请求:', event.config.url)
})

// 监听响应事件
client.on('response', (event) => {
  console.log('收到响应:', event.response.status)
})

// 监听错误事件
client.on('error', (event) => {
  console.error('请求错误:', event.error.message)
})

// 监听重试事件
client.on('retry', (event) => {
  console.log(`第${event.retryCount}次重试`)
})

// 监听缓存事件
client.on('cache-hit', (event) => {
  console.log('缓存命中:', event.config.url)
})

client.on('cache-miss', (event) => {
  console.log('缓存未命中:', event.config.url)
})
```

## 🔧 高级用法

### 快速创建客户端

```typescript
import { createQuickClient } from '@ldesign/http'

const client = createQuickClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  adapter: 'fetch',
  enableCache: true,
  enableRetry: true,
  enableLog: true,
  authToken: () => localStorage.getItem('token') || ''
})
```

### 自定义适配器

```typescript
import type { HttpAdapter, RequestConfig, HttpResponse } from '@ldesign/http'

class CustomAdapter implements HttpAdapter {
  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    // 自定义请求逻辑
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.data ? JSON.stringify(config.data) : undefined
    })

    return {
      data: await response.json(),
      status: response.status,
      statusText: response.statusText,
      headers: {},
      config
    }
  }

  cancel(): void {
    // 取消逻辑
  }

  getName(): string {
    return 'custom'
  }
}

const client = createHttpClient({
  customAdapter: new CustomAdapter()
})
```

### 中间件系统

```typescript
import type { Middleware } from '@ldesign/http'

const loggingMiddleware: Middleware = {
  name: 'logging',
  request: (config) => {
    console.log('请求开始:', config.url)
    return config
  },
  response: (response) => {
    console.log('请求完成:', response.status)
    return response
  },
  error: (error) => {
    console.error('请求错误:', error.message)
    return error
  }
}
```

## 📚 API 参考

### HttpClient 方法

```typescript
interface HttpClientInstance {
  // HTTP 方法
  get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>
  delete<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>
  head<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
  options<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>
  request<T>(config: ExtendedRequestConfig): Promise<HttpResponse<T>>

  // 拦截器
  addRequestInterceptor(interceptor: RequestInterceptor): number
  addResponseInterceptor(interceptor: ResponseInterceptor): number
  removeInterceptor(type: 'request' | 'response', id: number): void

  // 配置
  getDefaults(): HttpClientConfig
  setDefaults(config: Partial<HttpClientConfig>): void

  // 取消令牌
  createCancelToken(): CancelToken

  // 事件
  on(event: EventType, listener: EventListener): void
  off(event: EventType, listener: EventListener): void
  emit(event: EventType, data: any): void
  once(event: EventType, listener: EventListener): void
}
```

### Vue3 组合式函数

```typescript
// useRequest
function useRequest<T>(
  url: string | (() => string),
  options?: UseRequestOptions<T>
): UseRequestResult<T>

// useGet
function useGet<T>(
  url: string | (() => string),
  options?: Omit<UseRequestOptions<T>, 'method'>
): UseRequestResult<T>

// usePost
function usePost<T>(
  url: string | (() => string),
  options?: Omit<UseRequestOptions<T>, 'method'>
): UseRequestResult<T>

// usePagination
function usePagination<T>(
  url: string | (() => string),
  options?: UsePaginationOptions<T>
): UsePaginationResult<T>
```

## 🎯 最佳实践

### 1. 统一错误处理

```typescript
// 创建全局错误处理拦截器
const errorHandler = createErrorHandlerInterceptor((error) => {
  // 统一错误提示
  if (error.response?.status === 401) {
    // 跳转登录
    router.push('/login')
  } else if (error.response?.status >= 500) {
    // 服务器错误提示
    ElMessage.error('服务器错误，请稍后重试')
  } else if (error.isNetworkError) {
    // 网络错误提示
    ElMessage.error('网络连接失败，请检查网络')
  }
})

client.addResponseInterceptor(errorHandler)
```

### 2. 请求去重

```typescript
const pendingRequests = new Map()

const dedupeInterceptor = {
  onFulfilled: (config) => {
    const key = `${config.method}:${config.url}:${JSON.stringify(config.params)}`

    if (pendingRequests.has(key)) {
      // 如果有相同的请求正在进行，取消当前请求
      throw new Error('Duplicate request cancelled')
    }

    pendingRequests.set(key, true)
    return config
  }
}

client.addRequestInterceptor(dedupeInterceptor)
```

### 3. 响应数据转换

```typescript
// 统一响应数据格式
const transformInterceptor = createResponseTransformInterceptor((data: any) => {
  if (data && typeof data === 'object' && 'code' in data) {
    if (data.code === 200) {
      return data.data // 返回实际数据
    } else {
      throw new Error(data.message || '请求失败')
    }
  }
  return data
})

client.addResponseInterceptor(transformInterceptor)
```

### 4. 环境配置

```typescript
// config/http.ts
const isDev = process.env.NODE_ENV === 'development'

export const httpConfig = {
  baseURL: isDev ? 'http://localhost:3000/api' : 'https://api.example.com',
  timeout: 10000,
  adapter: 'fetch' as const,
  cache: {
    enabled: !isDev, // 开发环境禁用缓存
    ttl: 5 * 60 * 1000
  },
  retry: {
    retries: isDev ? 0 : 3, // 开发环境禁用重试
    retryDelay: 1000
  }
}
```

## 🔄 迁移指南

### 从 Axios 迁移

```typescript
// Axios
import axios from 'axios'
const response = await axios.get('/users')

// @ldesign/http
import { createAxiosHttpClient } from '@ldesign/http'
const client = createAxiosHttpClient()
const response = await client.get('/users')
```

### 从 Fetch 迁移

```typescript
// 原生 Fetch
const response = await fetch('/users')
const data = await response.json()

// @ldesign/http
import { createFetchHttpClient } from '@ldesign/http'
const client = createFetchHttpClient()
const response = await client.get('/users')
const data = response.data
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/your-org/ldesign.git

# 安装依赖
cd ldesign/packages/http
pnpm install

# 运行测试
pnpm test

# 构建
pnpm build

# 开发模式
pnpm dev
```

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详细信息。

## 🙏 致谢

感谢以下优秀的开源项目为本库提供灵感：

- [Axios](https://github.com/axios/axios) - 优秀的 HTTP 客户端
- [Alova](https://github.com/alovajs/alova) - 现代的请求库
- [VueUse](https://github.com/vueuse/vueuse) - Vue 组合式工具集

---

<div align="center">
  <p>如果这个项目对你有帮助，请给我们一个 ⭐️</p>
  <p>Made with ❤️ by LDesign Team</p>
</div>
