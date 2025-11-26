# 适配器系统

适配器系统是 @ldesign/http 的核心特性之一，它允许你在不同的 HTTP 库之间无缝切换。

## 什么是适配器？

适配器是一个抽象层，它封装了底层 HTTP 库的实现细节，提供统一的接口。这使得你可以：

- 在不同项目中使用相同的 API
- 根据需求切换底层实现
- 利用不同库的特性和优势
- 避免供应商锁定

## 内置适配器

### Fetch 适配器

基于浏览器原生 Fetch API，轻量且现代。

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: '/api',
  adapter: 'fetch'
})
```

**优点：**
- 原生支持，无需额外依赖
- 轻量级
- 支持流式响应
- Promise 原生支持

**缺点：**
- 不支持请求进度（上传进度）
- 不支持请求超时（需要手动实现）
- 旧浏览器需要 polyfill

**适用场景：**
- 现代浏览器环境
- 对包体积敏感的项目
- 不需要复杂功能的场景

### Axios 适配器

基于流行的 Axios 库，功能丰富。

```typescript
const client = createHttpClient({
  baseURL: '/api',
  adapter: 'axios'
})
```

**优点：**
- 功能完整
- 社区成熟
- 支持请求/响应拦截
- 支持上传/下载进度
- 自动 JSON 转换
- 支持取消请求

**缺点：**
- 包体积较大
- 需要额外安装依赖

**适用场景：**
- 需要完整功能的企业应用
- 已经使用 Axios 的项目
- 需要上传进度的场景

**安装依赖：**
```bash
pnpm add axios
```

### Alova 适配器

基于轻量级的 Alova 库。

```typescript
const client = createHttpClient({
  baseURL: '/api',
  adapter: 'alova'
})
```

**优点：**
- 轻量级
- 现代化 API
- 良好的 TypeScript 支持

**缺点：**
- 相对较新，生态较小

**适用场景：**
- 追求性能的项目
- 现代化技术栈

**安装依赖：**
```bash
pnpm add alova
```

### 自动选择适配器

让库自动选择最佳适配器：

```typescript
const client = createHttpClient({
  baseURL: '/api',
  adapter: 'auto' // 默认值
})
```

选择逻辑：
1. 如果安装了 Axios → 使用 Axios
2. 如果安装了 Alova → 使用 Alova  
3. 否则 → 使用 Fetch

## 适配器比较

| 特性 | Fetch | Axios | Alova |
|------|-------|-------|-------|
| 包体积 | 0 KB | ~13 KB | ~5 KB |
| 浏览器支持 | 现代浏览器 | 广泛 | 现代浏览器 |
| 上传进度 | ❌ | ✅ | ✅ |
| 下载进度 | ✅ | ✅ | ✅ |
| 请求取消 | ✅ | ✅ | ✅ |
| 拦截器 | 需要实现 | ✅ | ✅ |
| 超时控制 | 需要实现 | ✅ | ✅ |
| TypeScript | ✅ | ✅ | ✅ |

## 自定义适配器

### 创建适配器

实现 `HttpAdapter` 接口：

```typescript
import { BaseAdapter, RequestConfig, Response } from '@ldesign/http-core'

class CustomAdapter extends BaseAdapter {
  name = 'custom'
  
  // 检查是否支持
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'fetch' in window
  }
  
  // 发送请求
  async request<T = any>(config: RequestConfig): Promise<Response<T>> {
    const { url, method, headers, data, params } = config
    
    // 构建完整 URL
    const fullUrl = this.buildURL(url, params)
    
    // 发送请求
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: config.signal
    })
    
    // 解析响应
    const responseData = await response.json()
    
    // 返回标准格式
    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config
    }
  }
  
  // 辅助方法：构建 URL
  private buildURL(url: string, params?: any): string {
    if (!params) return url
    
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    
    return `${url}?${searchParams.toString()}`
  }
}

// 使用自定义适配器
const client = createHttpClient({
  baseURL: '/api',
  adapter: new CustomAdapter()
})
```

### 高级适配器示例

带进度跟踪和取消支持的适配器：

```typescript
class AdvancedAdapter extends BaseAdapter {
  name = 'advanced'
  
  isSupported(): boolean {
    return true
  }
  
  async request<T = any>(config: RequestConfig): Promise<Response<T>> {
    const { 
      url, 
      method, 
      headers, 
      data, 
      signal,
      onUploadProgress,
      onDownloadProgress 
    } = config
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // 上传进度
      if (onUploadProgress && xhr.upload) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onUploadProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: (e.loaded / e.total) * 100
            })
          }
        })
      }
      
      // 下载进度
      if (onDownloadProgress) {
        xhr.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onDownloadProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: (e.loaded / e.total) * 100
            })
          }
        })
      }
      
      // 请求完成
      xhr.addEventListener('load', () => {
        const response: Response<T> = {
          data: JSON.parse(xhr.responseText),
          status: xhr.status,
          statusText: xhr.statusText,
          headers: this.parseHeaders(xhr.getAllResponseHeaders()),
          config
        }
        resolve(response)
      })
      
      // 请求错误
      xhr.addEventListener('error', () => {
        reject(new Error('Network Error'))
      })
      
      // 请求超时
      xhr.addEventListener('timeout', () => {
        reject(new Error('Timeout'))
      })
      
      // 取消支持
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort()
          reject(new Error('Request canceled'))
        })
      }
      
      // 打开连接
      xhr.open(method || 'GET', url)
      
      // 设置请求头
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, String(value))
        })
      }
      
      // 设置超时
      if (config.timeout) {
        xhr.timeout = config.timeout
      }
      
      // 发送请求
      xhr.send(data)
    })
  }
  
  private parseHeaders(headerStr: string): Record<string, string> {
    const headers: Record<string, string> = {}
    headerStr.split('\r\n').forEach(line => {
      const [key, value] = line.split(': ')
      if (key && value) {
        headers[key.toLowerCase()] = value
      }
    })
    return headers
  }
}
```

## 适配器注册

### 全局注册

```typescript
import { registerAdapter } from '@ldesign/http-core'

// 注册自定义适配器
registerAdapter('custom', CustomAdapter)

// 之后可以通过名称使用
const client = createHttpClient({
  adapter: 'custom'
})
```

### 实例注册

```typescript
// 为特定实例使用适配器
const client = createHttpClient({
  adapter: new CustomAdapter()
})
```

## 适配器工厂

创建可配置的适配器：

```typescript
class ConfigurableAdapter extends BaseAdapter {
  constructor(
    private options: {
      retries?: number
      timeout?: number
      cache?: boolean
    }
  ) {
    super()
  }
  
  name = 'configurable'
  
  isSupported(): boolean {
    return true
  }
  
  async request<T = any>(config: RequestConfig): Promise<Response<T>> {
    // 使用 this.options 中的配置
    const timeout = config.timeout || this.options.timeout
    // ... 实现逻辑
  }
}

// 创建适配器工厂
function createConfigurableAdapter(options: any) {
  return new ConfigurableAdapter(options)
}

// 使用
const client = createHttpClient({
  adapter: createConfigurableAdapter({
    retries: 3,
    timeout: 5000,
    cache: true
  })
})
```

## 适配器链

组合多个适配器：

```typescript
class AdapterChain extends BaseAdapter {
  constructor(private adapters: BaseAdapter[]) {
    super()
  }
  
  name = 'chain'
  
  isSupported(): boolean {
    return this.adapters.some(adapter => adapter.isSupported())
  }
  
  async request<T = any>(config: RequestConfig): Promise<Response<T>> {
    // 尝试每个适配器，直到成功
    for (const adapter of this.adapters) {
      if (adapter.isSupported()) {
        try {
          return await adapter.request<T>(config)
        } catch (error) {
          // 继续尝试下一个适配器
          continue
        }
      }
    }
    throw new Error('All adapters failed')
  }
}

// 使用
const client = createHttpClient({
  adapter: new AdapterChain([
    new AxiosAdapter(),
    new FetchAdapter(),
    new CustomAdapter()
  ])
})
```

## 最佳实践

### 1. 环境检测

根据环境自动选择适配器：

```typescript
function createAdapterForEnvironment() {
  if (typeof window === 'undefined') {
    // Node.js 环境
    return 'axios'
  } else if ('fetch' in window) {
    // 现代浏览器
    return 'fetch'
  } else {
    // 旧浏览器
    return 'axios'
  }
}

const client = createHttpClient({
  adapter: createAdapterForEnvironment()
})
```

### 2. 功能检测

根据需要的功能选择适配器：

```typescript
function selectAdapter(requirements: {
  uploadProgress?: boolean
  downloadProgress?: boolean
  timeout?: boolean
}) {
  if (requirements.uploadProgress) {
    return 'axios' // Fetch 不支持上传进度
  }
  return 'fetch'
}

const client = createHttpClient({
  adapter: selectAdapter({ uploadProgress: true })
})
```

### 3. 回退策略

提供降级方案：

```typescript
const adapters = ['axios', 'alova', 'fetch']

for (const adapter of adapters) {
  try {
    const client = createHttpClient({ adapter })
    await client.get('/health')
    // 成功，使用此适配器
    break
  } catch {
    // 失败，尝试下一个
    continue
  }
}
```

### 4. 性能监控

监控适配器性能：

```typescript
class MonitoredAdapter extends BaseAdapter {
  constructor(private adapter: BaseAdapter) {
    super()
  }
  
  name = `monitored-${this.adapter.name}`
  
  isSupported() {
    return this.adapter.isSupported()
  }
  
  async request<T = any>(config: RequestConfig): Promise<Response<T>> {
    const start = Date.now()
    
    try {
      const response = await this.adapter.request<T>(config)
      const duration = Date.now() - start
      
      console.log(`[${this.adapter.name}] ${config.method} ${config.url} - ${duration}ms`)
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      console.error(`[${this.adapter.name}] ${config.method} ${config.url} - Failed after ${duration}ms`)
      throw error
    }
  }
}
```

## 下一步

- [拦截器](/guide/interceptors) - 学习请求/响应拦截
- [缓存管理](/guide/caching) - 了解缓存策略
- [自定义适配器示例](/examples/custom-adapter) - 查看完整示例