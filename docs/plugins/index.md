# 插件系统

@ldesign/http 提供了强大的插件系统，让你可以轻松扩展HTTP客户端的功能。

## 🎯 插件概览

### 内置插件

- **[缓存插件](/plugins/cache)** - 智能缓存系统
- **[重试插件](/plugins/retry)** - 智能重试机制
- **[拦截器插件](/plugins/interceptors)** - 预置拦截器

### 插件特性

- 🔌 **即插即用** - 简单的安装和配置
- 🎛️ **高度可配置** - 丰富的配置选项
- 🔄 **可组合** - 多个插件可以同时使用
- 🛠️ **可扩展** - 支持自定义插件开发

## 🚀 快速开始

### 使用内置插件

```typescript
import { 
  createHttpClient,
  createCachePlugin,
  createRetryPlugin
} from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://api.example.com'
})

// 安装缓存插件
const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 5 * 60 * 1000 // 5分钟缓存
})
cachePlugin.install(client)

// 安装重试插件
const retryPlugin = createRetryPlugin({
  retries: 3,
  retryDelay: 1000
})
retryPlugin.install(client)
```

### 快速配置

```typescript
import { createQuickClient } from '@ldesign/http'

// 自动启用常用插件
const client = createQuickClient({
  baseURL: 'https://api.example.com',
  enableCache: true,    // 启用缓存
  enableRetry: true,    // 启用重试
  enableLog: true       // 启用日志
})
```

## 🔌 插件接口

### HttpPlugin 接口

```typescript
interface HttpPlugin {
  name: string                                    // 插件名称
  version?: string                               // 插件版本
  install(client: HttpClientInstance): void     // 安装方法
  uninstall?(client: HttpClientInstance): void  // 卸载方法
}
```

### 基础插件示例

```typescript
class LoggerPlugin implements HttpPlugin {
  name = 'logger'
  version = '1.0.0'
  
  constructor(private options: LoggerOptions = {}) {}
  
  install(client: HttpClientInstance): void {
    // 添加请求日志
    client.addRequestInterceptor({
      onFulfilled: (config) => {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`)
        return config
      }
    })
    
    // 添加响应日志
    client.addResponseInterceptor({
      onFulfilled: (response) => {
        console.log(`✅ ${response.status} ${response.config.url}`)
        return response
      },
      onRejected: (error) => {
        console.log(`❌ ${error.message}`)
        return Promise.reject(error)
      }
    })
  }
  
  uninstall(client: HttpClientInstance): void {
    // 清理逻辑
    console.log('Logger plugin uninstalled')
  }
}

// 使用插件
const loggerPlugin = new LoggerPlugin()
loggerPlugin.install(client)
```

## 📦 内置插件详解

### 缓存插件

智能缓存系统，支持多种存储策略。

```typescript
import { createCachePlugin } from '@ldesign/http'

const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 10 * 60 * 1000,        // 10分钟缓存
  storage: 'localStorage',     // 存储类型
  maxSize: 100,               // 最大缓存条目
  include: ['/api/users'],    // 包含的URL
  exclude: ['/api/auth']      // 排除的URL
})

cachePlugin.install(client)
```

**特性:**
- 多种存储策略（内存、localStorage、sessionStorage）
- 智能缓存键生成
- TTL（生存时间）支持
- 缓存统计和监控

### 重试插件

智能重试机制，支持多种重试策略。

```typescript
import { createRetryPlugin } from '@ldesign/http'

const retryPlugin = createRetryPlugin({
  retries: 3,                 // 重试次数
  retryDelay: 1000,          // 重试延迟
  strategy: 'exponential',    // 重试策略
  retryCondition: (error) => {
    // 自定义重试条件
    return error.isNetworkError || error.status >= 500
  }
})

retryPlugin.install(client)
```

**特性:**
- 多种重试策略（固定、指数退避、线性增长）
- 自定义重试条件
- 重试事件监听
- 智能延迟计算

### 拦截器插件

预置的常用拦截器。

```typescript
import { 
  createAuthInterceptor,
  createLogInterceptor,
  createErrorHandlerInterceptor
} from '@ldesign/http'

// 认证拦截器
const authInterceptor = createAuthInterceptor({
  getToken: () => localStorage.getItem('token'),
  refreshToken: async () => {
    // 刷新token逻辑
  }
})

// 日志拦截器
const logInterceptors = createLogInterceptor({
  logRequests: true,
  logResponses: true,
  logErrors: true
})

// 错误处理拦截器
const errorHandler = createErrorHandlerInterceptor((error) => {
  // 全局错误处理逻辑
})

// 安装拦截器
client.addRequestInterceptor(authInterceptor)
client.addRequestInterceptor(logInterceptors.request)
client.addResponseInterceptor(logInterceptors.response)
client.addResponseInterceptor(errorHandler)
```

## 🛠️ 自定义插件开发

### 简单插件

```typescript
class TimestampPlugin implements HttpPlugin {
  name = 'timestamp'
  
  install(client: HttpClientInstance): void {
    client.addRequestInterceptor({
      onFulfilled: (config) => {
        config.headers = {
          ...config.headers,
          'X-Timestamp': Date.now().toString()
        }
        return config
      }
    })
  }
}
```

### 复杂插件

```typescript
interface MetricsOptions {
  endpoint?: string
  batchSize?: number
  flushInterval?: number
}

class MetricsPlugin implements HttpPlugin {
  name = 'metrics'
  version = '1.0.0'
  
  private metrics: any[] = []
  private timer?: NodeJS.Timeout
  
  constructor(private options: MetricsOptions = {}) {
    this.options = {
      batchSize: 10,
      flushInterval: 30000, // 30秒
      ...options
    }
  }
  
  install(client: HttpClientInstance): void {
    // 开始定时上报
    this.startReporting()
    
    // 监听请求事件
    client.on('request', (event) => {
      this.recordMetric('request', {
        url: event.config.url,
        method: event.config.method,
        timestamp: Date.now()
      })
    })
    
    // 监听响应事件
    client.on('response', (event) => {
      this.recordMetric('response', {
        url: event.response.config.url,
        status: event.response.status,
        duration: Date.now() - event.timestamp
      })
    })
    
    // 监听错误事件
    client.on('error', (event) => {
      this.recordMetric('error', {
        url: event.error.request?.url,
        error: event.error.message,
        timestamp: Date.now()
      })
    })
  }
  
  uninstall(client: HttpClientInstance): void {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer)
    }
    
    // 最后一次上报
    this.flushMetrics()
  }
  
  private recordMetric(type: string, data: any): void {
    this.metrics.push({ type, data, timestamp: Date.now() })
    
    // 达到批次大小时立即上报
    if (this.metrics.length >= this.options.batchSize!) {
      this.flushMetrics()
    }
  }
  
  private startReporting(): void {
    this.timer = setInterval(() => {
      this.flushMetrics()
    }, this.options.flushInterval)
  }
  
  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return
    
    const metricsToSend = [...this.metrics]
    this.metrics = []
    
    try {
      if (this.options.endpoint) {
        await fetch(this.options.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metricsToSend)
        })
      } else {
        console.log('Metrics:', metricsToSend)
      }
    } catch (error) {
      console.error('Failed to send metrics:', error)
      // 重新加入队列
      this.metrics.unshift(...metricsToSend)
    }
  }
}

// 使用插件
const metricsPlugin = new MetricsPlugin({
  endpoint: '/api/metrics',
  batchSize: 20,
  flushInterval: 60000
})

metricsPlugin.install(client)
```

## 🔧 插件管理

### 插件注册

```typescript
class PluginManager {
  private plugins = new Map<string, HttpPlugin>()
  
  register(plugin: HttpPlugin, client: HttpClientInstance): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`)
    }
    
    plugin.install(client)
    this.plugins.set(plugin.name, plugin)
  }
  
  unregister(name: string, client: HttpClientInstance): void {
    const plugin = this.plugins.get(name)
    if (plugin) {
      plugin.uninstall?.(client)
      this.plugins.delete(name)
    }
  }
  
  getPlugin(name: string): HttpPlugin | undefined {
    return this.plugins.get(name)
  }
  
  listPlugins(): string[] {
    return Array.from(this.plugins.keys())
  }
}

// 使用插件管理器
const pluginManager = new PluginManager()
pluginManager.register(cachePlugin, client)
pluginManager.register(retryPlugin, client)
```

### 插件配置

```typescript
// 配置文件
export const pluginConfig = {
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000,
    storage: 'localStorage'
  },
  retry: {
    enabled: true,
    retries: 3,
    strategy: 'exponential'
  },
  metrics: {
    enabled: process.env.NODE_ENV === 'production',
    endpoint: '/api/metrics'
  }
}

// 动态加载插件
function loadPlugins(client: HttpClientInstance, config: any) {
  if (config.cache?.enabled) {
    const cachePlugin = createCachePlugin(config.cache)
    cachePlugin.install(client)
  }
  
  if (config.retry?.enabled) {
    const retryPlugin = createRetryPlugin(config.retry)
    retryPlugin.install(client)
  }
  
  if (config.metrics?.enabled) {
    const metricsPlugin = new MetricsPlugin(config.metrics)
    metricsPlugin.install(client)
  }
}
```

## 🎨 Vue 插件集成

### Vue 插件包装

```typescript
// vue-plugin-wrapper.ts
import type { App } from 'vue'
import type { HttpPlugin, HttpClientInstance } from '@ldesign/http'

export function createVuePlugin(httpPlugin: HttpPlugin) {
  return {
    install(app: App, client: HttpClientInstance) {
      httpPlugin.install(client)
      
      // 提供插件实例
      app.provide(`http-plugin-${httpPlugin.name}`, httpPlugin)
    }
  }
}

// 使用示例
const app = createApp(App)
const cacheVuePlugin = createVuePlugin(cachePlugin)
app.use(cacheVuePlugin, client)
```

### 组合式函数

```typescript
// composables/usePlugins.ts
import { inject } from 'vue'
import type { HttpPlugin } from '@ldesign/http'

export function usePlugin<T extends HttpPlugin>(name: string): T | undefined {
  return inject(`http-plugin-${name}`)
}

// 使用示例
export function useCache() {
  const cachePlugin = usePlugin('cache')
  
  const clearCache = () => {
    cachePlugin?.clear()
  }
  
  const getCacheStats = () => {
    return cachePlugin?.getStats()
  }
  
  return {
    clearCache,
    getCacheStats
  }
}
```

## 📊 插件性能

### 性能监控

```typescript
class PerformancePlugin implements HttpPlugin {
  name = 'performance'
  
  install(client: HttpClientInstance): void {
    client.addRequestInterceptor({
      onFulfilled: (config) => {
        config.metadata = {
          ...config.metadata,
          startTime: performance.now()
        }
        return config
      }
    })
    
    client.addResponseInterceptor({
      onFulfilled: (response) => {
        const startTime = response.config.metadata?.startTime
        if (startTime) {
          const duration = performance.now() - startTime
          console.log(`Request to ${response.config.url} took ${duration.toFixed(2)}ms`)
        }
        return response
      }
    })
  }
}
```

### 性能优化

```typescript
// 延迟加载插件
const lazyLoadPlugin = async (name: string) => {
  switch (name) {
    case 'cache':
      const { createCachePlugin } = await import('@ldesign/http/plugins/cache')
      return createCachePlugin()
    case 'retry':
      const { createRetryPlugin } = await import('@ldesign/http/plugins/retry')
      return createRetryPlugin()
    default:
      throw new Error(`Unknown plugin: ${name}`)
  }
}

// 条件加载
if (shouldEnableCache()) {
  const cachePlugin = await lazyLoadPlugin('cache')
  cachePlugin.install(client)
}
```

## 📚 最佳实践

### 1. 插件设计原则

```typescript
// ✅ 单一职责
class CachePlugin implements HttpPlugin {
  // 只负责缓存功能
}

// ✅ 可配置
class ConfigurablePlugin implements HttpPlugin {
  constructor(private options: PluginOptions) {}
}

// ✅ 错误处理
class RobustPlugin implements HttpPlugin {
  install(client: HttpClientInstance): void {
    try {
      // 插件逻辑
    } catch (error) {
      console.error(`Plugin ${this.name} installation failed:`, error)
    }
  }
}
```

### 2. 插件组合

```typescript
// ✅ 插件顺序很重要
const client = createHttpClient()

// 1. 先安装基础功能插件
authPlugin.install(client)

// 2. 再安装增强功能插件
cachePlugin.install(client)
retryPlugin.install(client)

// 3. 最后安装监控插件
metricsPlugin.install(client)
```

### 3. 插件测试

```typescript
describe('CustomPlugin', () => {
  let client: HttpClientInstance
  let plugin: CustomPlugin
  
  beforeEach(() => {
    client = createHttpClient()
    plugin = new CustomPlugin()
  })
  
  it('should install successfully', () => {
    expect(() => plugin.install(client)).not.toThrow()
  })
  
  it('should add functionality', async () => {
    plugin.install(client)
    
    // 测试插件功能
    const response = await client.get('/test')
    expect(response.headers['X-Custom']).toBeDefined()
  })
})
```

## 📚 下一步

了解插件系统后，你可以继续学习：

- [缓存插件](/plugins/cache) - 详细的缓存功能
- [重试插件](/plugins/retry) - 智能重试机制
- [拦截器插件](/plugins/interceptors) - 预置拦截器
- [插件开发指南](/plugins/development) - 开发自定义插件
