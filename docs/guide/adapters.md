# 适配器

适配器是 @ldesign/http 的核心组件，负责实际发送 HTTP 请求。库提供了多种适配器，可以根据不同的环境和需求选择合适的实现。

## 适配器类型

### Fetch 适配器

基于现代浏览器的 Fetch API，是最推荐的选择。

```typescript
import { createHttpClient } from '@ldesign/http'

const client = await createHttpClient({
  adapter: 'fetch',
  baseURL: 'https://api.example.com'
})
```

**特点：**
- ✅ 浏览器原生支持，无需额外依赖
- ✅ 支持流式响应
- ✅ 更轻量，包体积更小
- ✅ 支持 AbortController 取消请求
- ❌ 不支持上传/下载进度（可通过 ReadableStream 实现）

**适用场景：**
- 现代浏览器应用（Chrome 42+, Firefox 39+, Safari 10.1+）
- 需要流式处理数据
- 对包体积敏感的应用

### Axios 适配器

基于流行的 Axios 库，功能丰富。

```typescript
import { createHttpClient } from '@ldesign/http'

const client = await createHttpClient({
  adapter: 'axios',
  baseURL: 'https://api.example.com'
})
```

**特点：**
- ✅ 功能丰富，社区成熟
- ✅ 支持上传/下载进度
- ✅ 更好的浏览器兼容性
- ✅ 自动转换 JSON 数据
- ✅ 防止 XSRF 攻击
- ❌ 包体积较大

**适用场景：**
- 需要兼容老版本浏览器
- 需要上传/下载进度功能
- 已有 Axios 使用经验

### Alova 适配器

基于新一代请求库 Alova，性能优秀。

```typescript
import { createHttpClient } from '@ldesign/http'

const client = await createHttpClient({
  adapter: 'alova',
  baseURL: 'https://api.example.com'
})
```

**特点：**
- ✅ 现代化设计
- ✅ 性能优秀
- ✅ 内置高级缓存策略
- ✅ 支持 Vue、React、Svelte 等框架
- ❌ 相对较新，生态较小

**适用场景：**
- 追求最佳性能
- 需要高级缓存功能
- 框架深度集成

## 适配器实例

除了使用字符串指定适配器，你也可以直接传入适配器实例：

```typescript
import { createHttpClient, FetchAdapter, AxiosAdapter } from '@ldesign/http'

// 使用 Fetch 适配器实例
const fetchClient = await createHttpClient({
  adapter: new FetchAdapter({
    credentials: 'include' // 自定义 Fetch 选项
  })
})

// 使用 Axios 适配器实例
const axiosClient = await createHttpClient({
  adapter: new AxiosAdapter({
    withCredentials: true // 自定义 Axios 选项
  })
})
```

## 自动选择适配器

如果不指定适配器，库会自动选择可用的最佳适配器：

```typescript
const client = await createHttpClient({
  baseURL: 'https://api.example.com'
  // 自动选择适配器
})

// 选择优先级：Fetch > Axios > Alova
```

选择逻辑：
1. 检查是否支持 Fetch API
2. 检查是否已安装 Axios
3. 检查是否已安装 Alova
4. 如果都不可用，抛出错误

## 自定义适配器

你可以创建自己的适配器来满足特殊需求。

### 基础适配器

继承 `BaseAdapter` 类：

```typescript
import { BaseAdapter, HttpConfig, HttpResponse } from '@ldesign/http'

class CustomAdapter extends BaseAdapter {
  name = 'custom'
  
  // 检查是否支持
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'fetch' in window
  }
  
  // 发送请求
  async request<T = any>(config: HttpConfig): Promise<HttpResponse<T>> {
    const { url, method, headers, data, params, signal } = config
    
    // 构建完整 URL
    const fullUrl = this.buildUrl(url, params)
    
    // 发送请求
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal
    })
    
    // 处理响应
    const responseData = await response.json()
    
    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config
    }
  }
  
  // 辅助方法：构建 URL
  private buildUrl(url: string, params?: Record<string, any>): string {
    if (!params) return url
    
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    
    return `${url}?${searchParams.toString()}`
  }
}

// 使用自定义适配器
const client = await createHttpClient({
  adapter: new CustomAdapter()
})
```

### 高级适配器示例

带错误处理和重试的适配器：

```typescript
import { BaseAdapter, HttpConfig, HttpResponse } from '@ldesign/http'

class RobustAdapter extends BaseAdapter {
  name = 'robust'
  private maxRetries = 3
  
  isSupported(): boolean {
    return true
  }
  
  async request<T = any>(config: HttpConfig): Promise<HttpResponse<T>> {
    let lastError: Error | null = null
    
    // 重试逻辑
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(config)
      } catch (error) {
        lastError = error as Error
        
        // 最后一次尝试失败
        if (attempt === this.maxRetries) {
          throw error
        }
        
        // 等待后重试
        await this.delay(Math.pow(2, attempt) * 1000)
      }
    }
    
    throw lastError
  }
  
  private async executeRequest<T>(config: HttpConfig): Promise<HttpResponse<T>> {
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
      signal: config.signal
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return {
      data: await response.json(),
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### WebSocket 适配器示例

创建支持 WebSocket 的适配器：

```typescript
import { BaseAdapter, HttpConfig, HttpResponse } from '@ldesign/http'

class WebSocketAdapter extends BaseAdapter {
  name = 'websocket'
  private connections = new Map<string, WebSocket>()
  
  isSupported(): boolean {
    return typeof WebSocket !== 'undefined'
  }
  
  async request<T = any>(config: HttpConfig): Promise<HttpResponse<T>> {
    const ws = this.getConnection(config.url)
    
    return new Promise((resolve, reject) => {
      // 发送消息
      ws.send(JSON.stringify({
        method: config.method,
        data: config.data
      }))
      
      // 等待响应
      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data)
        ws.removeEventListener('message', handler)
        
        resolve({
          data: response,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        })
      }
      
      ws.addEventListener('message', handler)
      
      // 错误处理
      ws.addEventListener('error', (error) => {
        reject(error)
      })
    })
  }
  
  private getConnection(url: string): WebSocket {
    if (!this.connections.has(url)) {
      const ws = new WebSocket(url)
      this.connections.set(url, ws)
    }
    return this.connections.get(url)!
  }
}
```

## 适配器工厂

使用工厂模式创建适配器：

```typescript
import { AdapterFactory } from '@ldesign/http'

// 注册自定义适配器
AdapterFactory.register('custom', CustomAdapter)

// 创建适配器
const adapter = AdapterFactory.create('custom')

const client = await createHttpClient({
  adapter
})
```

## 适配器配置

每个适配器都可以单独配置：

### Fetch 适配器配置

```typescript
import { FetchAdapter } from '@ldesign/http'

const adapter = new FetchAdapter({
  // Fetch API 选项
  credentials: 'include',    // 包含 cookies
  mode: 'cors',              // CORS 模式
  cache: 'no-cache',         // 缓存策略
  redirect: 'follow',        // 重定向策略
  referrerPolicy: 'no-referrer' // Referrer 策略
})
```

### Axios 适配器配置

```typescript
import { AxiosAdapter } from '@ldesign/http'

const adapter = new AxiosAdapter({
  // Axios 选项
  withCredentials: true,     // 发送 cookies
  maxRedirects: 5,          // 最大重定向次数
  maxContentLength: 2000,   // 响应体最大长度
  validateStatus: (status) => status < 500, // 验证状态码
  transformRequest: [(data) => JSON.stringify(data)], // 转换请求
  transformResponse: [(data) => JSON.parse(data)]     // 转换响应
})
```

## 适配器对比

| 特性 | Fetch | Axios | Alova |
| --- | --- | --- | --- |
| 包体积 | 最小 | 较大 | 中等 |
| 浏览器支持 | 现代浏览器 | 全部 | 现代浏览器 |
| 上传进度 | 需自实现 | ✅ | ✅ |
| 下载进度 | ✅ | ✅ | ✅ |
| 取消请求 | ✅ | ✅ | ✅ |
| 拦截器 | 需自实现 | ✅ | ✅ |
| 流式响应 | ✅ | ❌ | ❌ |
| 性能 | 优秀 | 良好 | 优秀 |

## 最佳实践

### 1. 根据环境选择适配器

```typescript
const adapter = process.env.NODE_ENV === 'production' 
  ? 'fetch'  // 生产环境使用 Fetch
  : 'axios'  // 开发环境使用 Axios（更好的调试信息）

const client = await createHttpClient({
  adapter,
  baseURL: 'https://api.example.com'
})
```

### 2. 为不同场景创建多个客户端

```typescript
// API 客户端（使用 Fetch）
const apiClient = await createHttpClient({
  adapter: 'fetch',
  baseURL: 'https://api.example.com'
})

// 文件上传客户端（使用 Axios）
const uploadClient = await createHttpClient({
  adapter: 'axios',
  baseURL: 'https://upload.example.com',
  timeout: 60000  // 更长的超时时间
})

// WebSocket 客户端
const wsClient = await createHttpClient({
  adapter: new WebSocketAdapter(),
  baseURL: 'wss://ws.example.com'
})
```

### 3. 适配器降级

```typescript
function createAdaptiveClient() {
  // 尝试使用 Fetch
  if (typeof fetch !== 'undefined') {
    return createHttpClient({ adapter: 'fetch' })
  }
  
  // 降级到 Axios
  if (typeof window !== 'undefined' && window.axios) {
    return createHttpClient({ adapter: 'axios' })
  }
  
  // 使用自定义适配器
  return createHttpClient({ adapter: new CustomAdapter() })
}
```

## 下一步

- [拦截器](/guide/interceptors) - 了解拦截器系统
- [请求配置](/guide/config) - 深入了解配置选项
- [API 参考](/api/adapters/) - 查看完整的适配器 API

