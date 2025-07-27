# 适配器

@ldesign/http 支持多种HTTP适配器，让你可以根据项目需求选择最适合的底层实现。

## 🎯 适配器概览

### 支持的适配器

- **Fetch** - 基于浏览器原生 fetch API
- **Axios** - 基于流行的 axios 库
- **Alova** - 基于现代的 alova 库

### 适配器选择指南

| 适配器 | 优势 | 适用场景 |
|--------|------|----------|
| **Fetch** | 原生支持、轻量、现代 | 现代浏览器、简单需求 |
| **Axios** | 功能丰富、稳定、兼容性好 | 复杂项目、需要广泛兼容性 |
| **Alova** | 现代设计、性能优化 | 新项目、追求性能 |

## 🌐 Fetch 适配器

### 特性

- ✅ 浏览器原生支持
- ✅ 轻量级，无额外依赖
- ✅ 现代 Promise API
- ✅ 支持流式响应
- ❌ 不支持请求/响应拦截器（由库层面实现）
- ❌ 不支持自动JSON转换（由库层面实现）

### 使用方式

```typescript
import { createFetchHttpClient } from '@ldesign/http'

// 方式1：直接创建
const client = createFetchHttpClient({
  baseURL: 'https://api.example.com'
})

// 方式2：通过配置指定
const client = createHttpClient({
  adapter: 'fetch',
  baseURL: 'https://api.example.com'
})
```

### Fetch 特有配置

```typescript
const client = createFetchHttpClient({
  baseURL: 'https://api.example.com',
  // Fetch 特有选项
  credentials: 'include', // 包含 cookies
  mode: 'cors', // CORS 模式
  cache: 'no-cache', // 缓存策略
  redirect: 'follow' // 重定向策略
})
```

### 兼容性检查

```typescript
import { isFetchSupported } from '@ldesign/http'

if (isFetchSupported()) {
  console.log('当前环境支持 Fetch API')
}
 else {
  console.log('需要 Fetch polyfill')
}
```

## 📦 Axios 适配器

### 特性

- ✅ 功能丰富
- ✅ 广泛的浏览器兼容性
- ✅ 内置请求/响应拦截器
- ✅ 自动JSON转换
- ✅ 请求/响应转换器
- ✅ 并发请求控制
- ❌ 包体积较大

### 安装依赖

```bash
pnpm add axios
```

### 使用方式

```typescript
import { createAxiosHttpClient } from '@ldesign/http'

// 方式1：直接创建
const client = createAxiosHttpClient({
  baseURL: 'https://api.example.com'
})

// 方式2：通过配置指定
const client = createHttpClient({
  adapter: 'axios',
  baseURL: 'https://api.example.com'
})
```

### Axios 特有配置

```typescript
const client = createAxiosHttpClient({
  baseURL: 'https://api.example.com',
  // Axios 特有选项
  maxRedirects: 5, // 最大重定向次数
  maxContentLength: 2000, // 最大内容长度
  validateStatus: status => status < 400, // 状态验证
  transformRequest: [(data) => {
    // 请求数据转换
    return JSON.stringify(data)
  }],
  transformResponse: [(data) => {
    // 响应数据转换
    return JSON.parse(data)
  }]
})
```

### 兼容性检查

```typescript
import { isAxiosSupported } from '@ldesign/http'

if (isAxiosSupported()) {
  console.log('Axios 可用')
}
 else {
  console.log('需要安装 axios')
}
```

## 🚀 Alova 适配器

### 特性

- ✅ 现代设计
- ✅ 性能优化
- ✅ TypeScript 友好
- ✅ 轻量级
- ✅ 内置缓存策略
- ❌ 相对较新，生态较小

### 安装依赖

```bash
pnpm add alova
```

### 使用方式

```typescript
import { createAlovaHttpClient } from '@ldesign/http'

// 方式1：直接创建
const client = createAlovaHttpClient({
  baseURL: 'https://api.example.com'
})

// 方式2：通过配置指定
const client = createHttpClient({
  adapter: 'alova',
  baseURL: 'https://api.example.com'
})
```

### Alova 特有配置

```typescript
const client = createAlovaHttpClient({
  baseURL: 'https://api.example.com',
  // Alova 特有选项
  cacheFor: 300000, // 缓存时间
  hitSource: 'memory', // 缓存来源
  enableCache: true, // 启用缓存
  enableSilentMode: false // 静默模式
})
```

### 兼容性检查

```typescript
import { isAlovaSupported } from '@ldesign/http'

if (isAlovaSupported()) {
  console.log('Alova 可用')
}
 else {
  console.log('需要安装 alova')
}
```

## 🔄 动态切换适配器

### 运行时切换

```typescript
const client = createHttpClient({
  adapter: 'fetch'
})

// 检查适配器信息
console.log(client.getAdapterInfo()) // { name: 'fetch', isCustom: false }

// 切换到 axios（如果可用）
if (client.switchAdapter('axios')) {
  console.log('已切换到 axios 适配器')
}
 else {
  console.log('axios 不可用，保持当前适配器')
}
```

### 适配器优先级

```typescript
// 按优先级尝试适配器
const client = createHttpClient({
  adapter: ['alova', 'axios', 'fetch'] // 优先使用 alova，不可用则降级
})
```

## 🛠️ 自定义适配器

### 实现适配器接口

```typescript
import type { HttpAdapter, HttpResponse, RequestConfig } from '@ldesign/http'

class CustomAdapter implements HttpAdapter {
  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    // 实现请求逻辑
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.data ? JSON.stringify(config.data) : undefined
    })

    return {
      data: await response.json(),
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config
    }
  }

  cancel(): void {
    // 实现取消逻辑
  }

  getName(): string {
    return 'custom'
  }
}
```

### 使用自定义适配器

```typescript
const client = createHttpClient({
  customAdapter: new CustomAdapter()
})

console.log(client.getAdapterInfo()) // { name: 'custom', isCustom: true }
```

## 📊 适配器比较

### 性能对比

| 特性 | Fetch | Axios | Alova |
|------|-------|-------|-------|
| 包大小 | 0KB | ~13KB | ~5KB |
| 启动速度 | 最快 | 中等 | 快 |
| 内存占用 | 最少 | 中等 | 少 |
| 功能丰富度 | 基础 | 最丰富 | 丰富 |

### 功能对比

| 功能 | Fetch | Axios | Alova |
|------|-------|-------|-------|
| 请求拦截器 | ❌ | ✅ | ✅ |
| 响应拦截器 | ❌ | ✅ | ✅ |
| 自动JSON转换 | ❌ | ✅ | ✅ |
| 请求取消 | ✅ | ✅ | ✅ |
| 并发控制 | ❌ | ✅ | ✅ |
| 内置缓存 | ❌ | ❌ | ✅ |

## 🎯 选择建议

### 选择 Fetch 当：

- 项目追求轻量级
- 只需要基础HTTP功能
- 目标浏览器支持现代标准
- 不需要复杂的拦截器逻辑

### 选择 Axios 当：

- 需要广泛的浏览器兼容性
- 项目已经使用 axios
- 需要丰富的功能特性
- 团队熟悉 axios API

### 选择 Alova 当：

- 新项目，追求现代化
- 需要内置缓存功能
- 关注性能和包大小
- 使用 TypeScript

## 🔧 适配器工具

### 检查支持情况

```typescript
import { HttpClient } from '@ldesign/http'

// 获取所有支持的适配器
const supportedAdapters = HttpClient.getSupportedAdapters()
console.log('支持的适配器:', supportedAdapters)

// 检查特定适配器
console.log('Fetch 支持:', HttpClient.isAdapterSupported('fetch'))
console.log('Axios 支持:', HttpClient.isAdapterSupported('axios'))
console.log('Alova 支持:', HttpClient.isAdapterSupported('alova'))
```

### 适配器信息

```typescript
const client = createHttpClient()

const info = client.getAdapterInfo()
console.log('适配器名称:', info.name)
console.log('是否自定义:', info.isCustom)
console.log('版本信息:', info.version)
```

## 📚 下一步

了解适配器后，你可以继续学习：

- [拦截器](/guide/interceptors) - 请求和响应拦截
- [错误处理](/guide/error-handling) - 错误处理策略
- [插件系统](/plugins/) - 扩展功能
- [性能优化](/guide/performance) - 性能优化技巧
