# 配置选项

本页面详细介绍 @ldesign/http 的所有配置选项。

## 🔧 基础配置

### HttpClientConfig

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
  cache?: CacheConfig
  
  // 重试配置
  retry?: RetryConfig
  
  // 拦截器配置
  interceptors?: {
    request?: RequestInterceptor[]
    response?: ResponseInterceptor[]
  }
}
```

### 基础选项

#### baseURL

设置所有请求的基础URL。

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com/v1'
})

// 请求 /users 实际访问 https://api.example.com/v1/users
await client.get('/users')
```

**类型**: `string`  
**默认值**: `undefined`

#### timeout

设置请求超时时间（毫秒）。

```typescript
const client = createHttpClient({
  timeout: 10000 // 10秒超时
})
```

**类型**: `number`  
**默认值**: `0` (无超时)

#### headers

设置默认请求头。

```typescript
const client = createHttpClient({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token',
    'User-Agent': 'MyApp/1.0'
  }
})
```

**类型**: `Record<string, string>`  
**默认值**: `{}`

## 🎯 适配器配置

### adapter

选择HTTP适配器。

```typescript
// 使用 fetch 适配器（默认）
const fetchClient = createHttpClient({
  adapter: 'fetch'
})

// 使用 axios 适配器
const axiosClient = createHttpClient({
  adapter: 'axios'
})

// 使用 alova 适配器
const alovaClient = createHttpClient({
  adapter: 'alova'
})
```

**类型**: `'fetch' | 'axios' | 'alova'`  
**默认值**: `'fetch'`

### customAdapter

使用自定义适配器。

```typescript
class MyCustomAdapter implements HttpAdapter {
  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    // 自定义实现
  }
  
  cancel(): void {
    // 取消逻辑
  }
  
  getName(): string {
    return 'custom'
  }
}

const client = createHttpClient({
  customAdapter: new MyCustomAdapter()
})
```

**类型**: `HttpAdapter`  
**默认值**: `undefined`

## 💾 缓存配置

### CacheConfig

```typescript
interface CacheConfig {
  enabled?: boolean
  ttl?: number
  keyGenerator?: (config: RequestConfig) => string
  storage?: CacheStorage
}
```

### 基础缓存配置

```typescript
const client = createHttpClient({
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5分钟
  }
})
```

### 自定义缓存键

```typescript
const client = createHttpClient({
  cache: {
    enabled: true,
    keyGenerator: (config) => {
      return `${config.method}:${config.url}:${JSON.stringify(config.params)}`
    }
  }
})
```

### 自定义存储

```typescript
import { createLocalStorageCache } from '@ldesign/http'

const client = createHttpClient({
  cache: {
    enabled: true,
    storage: createLocalStorageCache('api_cache_')
  }
})
```

## 🔄 重试配置

### RetryConfig

```typescript
interface RetryConfig {
  retries?: number
  retryDelay?: number
  retryCondition?: (error: HttpError) => boolean
}
```

### 基础重试配置

```typescript
const client = createHttpClient({
  retry: {
    retries: 3,
    retryDelay: 1000, // 1秒延迟
    retryCondition: (error) => {
      // 只重试网络错误和5xx错误
      return error.isNetworkError || (error.response?.status >= 500)
    }
  }
})
```

### 高级重试配置

```typescript
import { createExponentialRetryConfig } from '@ldesign/http'

const client = createHttpClient({
  retry: createExponentialRetryConfig(
    3,    // 重试次数
    1000, // 初始延迟
    10000 // 最大延迟
  )
})
```

## 🛡️ 拦截器配置

### 预设拦截器

```typescript
import { 
  createAuthInterceptor, 
  createLogInterceptor 
} from '@ldesign/http'

const authInterceptor = createAuthInterceptor({
  getToken: () => localStorage.getItem('token') || ''
})

const logInterceptors = createLogInterceptor({
  logRequests: true,
  logResponses: true
})

const client = createHttpClient({
  interceptors: {
    request: [authInterceptor, logInterceptors.request],
    response: [logInterceptors.response]
  }
})
```

## 📋 完整配置示例

### 开发环境配置

```typescript
const devClient = createHttpClient({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  adapter: 'fetch',
  cache: {
    enabled: false // 开发环境禁用缓存
  },
  retry: {
    retries: 0 // 开发环境禁用重试
  }
})
```

### 生产环境配置

```typescript
import { 
  createHttpClient,
  createCachePlugin,
  createRetryPlugin,
  createLogInterceptor,
  createAuthInterceptor
} from '@ldesign/http'

const prodClient = createHttpClient({
  baseURL: 'https://api.example.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MyApp/1.0.0'
  },
  adapter: 'fetch'
})

// 添加缓存插件
const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 5 * 60 * 1000,
  storage: createLocalStorageCache('api_')
})
cachePlugin.install(prodClient)

// 添加重试插件
const retryPlugin = createRetryPlugin({
  retries: 3,
  strategy: 'exponential',
  maxDelay: 10000
})
retryPlugin.install(prodClient)

// 添加认证拦截器
const authInterceptor = createAuthInterceptor({
  getToken: () => store.getters.authToken,
  refreshToken: () => store.dispatch('refreshToken')
})
prodClient.addRequestInterceptor(authInterceptor)

// 添加日志拦截器
const logInterceptors = createLogInterceptor({
  logRequests: false,
  logResponses: false,
  logErrors: true
})
prodClient.addResponseInterceptor(logInterceptors.response)
```

## 🎨 快速配置

### createQuickClient

使用 `createQuickClient` 快速创建预配置的客户端：

```typescript
import { createQuickClient } from '@ldesign/http'

const client = createQuickClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  adapter: 'fetch',
  enableCache: true,
  enableRetry: true,
  enableLog: true,
  authToken: () => localStorage.getItem('token')
})
```

### QuickClientOptions

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

## 🔧 运行时配置

### 获取和设置默认配置

```typescript
// 获取当前默认配置
const defaults = client.getDefaults()
console.log(defaults)

// 更新默认配置
client.setDefaults({
  timeout: 15000,
  headers: {
    'X-API-Version': '2.0'
  }
})
```

### 单次请求配置

```typescript
// 单次请求的配置会覆盖默认配置
const response = await client.get('/users', {
  timeout: 5000, // 覆盖默认超时
  headers: {
    'Accept': 'application/xml' // 覆盖默认Accept头
  },
  cache: {
    enabled: false // 禁用此次请求的缓存
  }
})
```

## 🌍 环境变量配置

### 使用环境变量

```typescript
const client = createHttpClient({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.VUE_APP_API_TIMEOUT || '10000'),
  headers: {
    'X-API-Key': process.env.VUE_APP_API_KEY || ''
  }
})
```

### 配置文件

```typescript
// config/http.ts
export const httpConfig = {
  development: {
    baseURL: 'http://localhost:3000/api',
    timeout: 30000,
    enableCache: false,
    enableRetry: false,
    enableLog: true
  },
  production: {
    baseURL: 'https://api.example.com/v1',
    timeout: 10000,
    enableCache: true,
    enableRetry: true,
    enableLog: false
  }
}

// 使用配置
const config = httpConfig[process.env.NODE_ENV || 'development']
const client = createQuickClient(config)
```

## 📚 下一步

了解配置选项后，你可以继续学习：

- [适配器](/guide/adapters) - 不同适配器的特性
- [拦截器](/guide/interceptors) - 请求和响应拦截
- [插件系统](/plugins/) - 扩展功能
- [错误处理](/guide/error-handling) - 错误处理策略
