# @ldesign/http 常见问题解答（FAQ）

本文档收集了使用 `@ldesign/http` 时的常见问题和解决方案。

---

## 📋 目录

- [安装和配置](#安装和配置)
- [使用问题](#使用问题)
- [性能问题](#性能问题)
- [错误处理](#错误处理)
- [缓存问题](#缓存问题)
- [TypeScript 问题](#typescript-问题)
- [其他问题](#其他问题)

---

## 📦 安装和配置

### Q1: 如何安装 @ldesign/http？

**A**: 使用 pnpm、npm 或 yarn 安装：

```bash
# pnpm
pnpm add @ldesign/http

# npm
npm install @ldesign/http

# yarn
yarn add @ldesign/http
```

### Q2: 如何创建 HTTP 客户端？

**A**: 使用 `createHttpClient` 函数：

```typescript
import { createHttpClient } from '@ldesign/http'

const httpClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
})
```

### Q3: 需要手动指定适配器吗？

**A**: 不需要。`createHttpClient` 会自动选择最佳适配器：

```typescript
// ✅ 自动选择适配器（推荐）
const client = createHttpClient({ baseURL: '/api' })

// ⚠️ 手动指定适配器（高级用法）
import { FetchAdapter } from '@ldesign/http/adapters'
const client = createHttpClient({ baseURL: '/api' }, new FetchAdapter())
```

---

## 🔧 使用问题

### Q4: 如何发送 GET 请求？

**A**: 使用 `get` 方法：

```typescript
// 基础用法
const response = await httpClient.get('/users')

// 带查询参数
const response = await httpClient.get('/users', {
  params: { page: 1, size: 10 },
})

// 带类型
interface User {
  id: number
  name: string
}
const response = await httpClient.get<User[]>('/users')
```

### Q5: 如何发送 POST 请求？

**A**: 使用 `post` 方法：

```typescript
// 发送 JSON 数据
const response = await httpClient.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
})

// 发送 FormData
const formData = new FormData()
formData.append('file', file)
const response = await httpClient.post('/upload', formData)
```

### Q6: 如何添加请求拦截器？

**A**: 使用 `interceptors.request.use`：

```typescript
httpClient.interceptors.request.use(
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

### Q7: 如何添加响应拦截器？

**A**: 使用 `interceptors.response.use`：

```typescript
httpClient.interceptors.response.use(
  (response) => {
    // 处理响应数据
    return response
  },
  (error) => {
    // 处理错误
    if (error.response?.status === 401) {
      // 跳转到登录页
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
```

### Q8: 如何取消请求？

**A**: 使用 `AbortController`：

```typescript
const controller = new AbortController()

// 发送请求
const promise = httpClient.get('/users', {
  signal: controller.signal,
})

// 取消请求
controller.abort()
```

### Q9: 如何上传文件？

**A**: 使用 `upload` 方法：

```typescript
// 单文件上传
const result = await httpClient.upload('/upload', file, {
  onProgress: (progress) => {
    console.log(`上传进度: ${progress.percentage}%`)
  },
})

// 多文件上传
const result = await httpClient.upload('/upload', [file1, file2], {
  onProgress: (progress) => {
    console.log(`上传进度: ${progress.percentage}%`)
  },
})
```

### Q10: 如何下载文件？

**A**: 使用 `download` 方法：

```typescript
const result = await httpClient.download('/files/document.pdf', {
  filename: 'my-document.pdf',
  onProgress: (progress) => {
    console.log(`下载进度: ${progress.percentage}%`)
  },
  autoSave: true, // 自动保存到本地
})
```

---

## ⚡ 性能问题

### Q11: 如何提升请求性能？

**A**: 启用缓存和请求去重：

```typescript
const httpClient = createHttpClient({
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 分钟
  },
  concurrency: {
    enableDeduplication: true,
  },
})
```

### Q12: 缓存会占用多少内存？

**A**: 默认最多缓存 100 个请求。可以通过 `maxSize` 配置：

```typescript
const httpClient = createHttpClient({
  cache: {
    enabled: true,
    maxSize: 50, // 最多缓存 50 个请求
  },
})
```

### Q13: 如何清除缓存？

**A**: 使用 `clearCache` 方法：

```typescript
// 清除所有缓存
await httpClient.clearCache()
```

### Q14: 为什么请求很慢？

**A**: 可能的原因和解决方案：

1. **网络问题** - 检查网络连接
2. **服务器响应慢** - 联系后端优化
3. **未启用缓存** - 启用缓存
4. **并发过多** - 配置并发限制
5. **拦截器过多** - 减少拦截器数量

```typescript
// 启用性能监控查看详情
const httpClient = createHttpClient({
  monitor: { enabled: true },
})

// 查看慢请求
const slowRequests = httpClient.getSlowRequests()
console.log(slowRequests)
```

---

## 🛡️ 错误处理

### Q15: 如何处理网络错误？

**A**: 使用错误拦截器：

```typescript
httpClient.interceptors.error.use((error) => {
  if (error.isNetworkError) {
    message.error('网络连接失败，请检查网络设置')
  }
  return Promise.reject(error)
})
```

### Q16: 如何处理超时错误？

**A**: 配置超时时间和重试：

```typescript
const httpClient = createHttpClient({
  timeout: 10000, // 10 秒超时
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => error.isTimeoutError,
  },
})
```

### Q17: 如何处理 401 未授权错误？

**A**: 使用响应拦截器：

```typescript
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除 Token
      localStorage.removeItem('token')
      // 跳转到登录页
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
```

---

## 💾 缓存问题

### Q18: 缓存什么时候会失效？

**A**: 缓存在以下情况会失效：

1. **超过 TTL 时间** - 默认 5 分钟
2. **手动清除** - 调用 `clearCache()`
3. **缓存满了** - 使用 LRU 算法淘汰最少使用的项

### Q19: 如何禁用某个请求的缓存？

**A**: 在请求配置中设置：

```typescript
await httpClient.get('/real-time-data', {
  cache: { enabled: false },
})
```

### Q20: 缓存键是如何生成的？

**A**: 默认使用 `method:url:params:data` 格式：

```typescript
// GET /users?page=1
// 缓存键: "GET:/users:{"page":1}:"

// 可以自定义缓存键生成器
const httpClient = createHttpClient({
  cache: {
    keyGenerator: (config) => {
      return `${config.method}:${config.url}`
    },
  },
})
```

---

## 📘 TypeScript 问题

### Q21: 如何定义响应类型？

**A**: 使用泛型参数：

```typescript
interface User {
  id: number
  name: string
  email: string
}

const response = await httpClient.get<User>('/users/1')
// response.data 的类型是 User
console.log(response.data.name)
```

### Q22: 如何定义请求配置类型？

**A**: 使用 `RequestConfig` 类型：

```typescript
import type { RequestConfig } from '@ldesign/http'

const config: RequestConfig = {
  url: '/users',
  method: 'GET',
  params: { page: 1 },
}

await httpClient.request(config)
```

### Q23: 类型提示不完整怎么办？

**A**: 确保安装了类型定义：

```bash
# 类型定义已包含在包中，无需额外安装
pnpm add @ldesign/http
```

如果仍然没有类型提示，检查 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

---

## 🔍 其他问题

### Q24: 如何在 Vue 3 中使用？

**A**: 使用 Vue 插件或组合式 API：

```typescript
// 方式 1: 使用插件
import { createApp } from 'vue'
import { HttpPlugin } from '@ldesign/http/vue'

const app = createApp(App)
app.use(HttpPlugin, {
  baseURL: '/api',
})

// 在组件中使用
import { useHttp } from '@ldesign/http/vue'

const { get, post } = useHttp()
const users = await get('/users')
```

```typescript
// 方式 2: 直接使用
import { createHttpClient } from '@ldesign/http'

const httpClient = createHttpClient({ baseURL: '/api' })

// 在组件中使用
const users = await httpClient.get('/users')
```

### Q25: 如何在 React 中使用？

**A**: 创建自定义 Hook：

```typescript
// hooks/useHttp.ts
import { useMemo } from 'react'
import { createHttpClient } from '@ldesign/http'

export function useHttp() {
  return useMemo(() => {
    return createHttpClient({
      baseURL: '/api',
    })
  }, [])
}

// 在组件中使用
function UserList() {
  const http = useHttp()
  const [users, setUsers] = useState([])

  useEffect(() => {
    http.get('/users').then(res => setUsers(res.data))
  }, [http])

  return <div>{/* ... */}</div>
}
```

### Q26: 如何调试请求？

**A**: 启用调试模式：

```typescript
import { createHttpClient } from '@ldesign/http'
import { createDebugger } from '@ldesign/http/utils'

const debugger = createDebugger({
  enabled: true,
  logLevel: 'debug',
})

const httpClient = createHttpClient({
  baseURL: '/api',
})

// 调试器会自动记录所有请求和响应
```

或者使用浏览器开发者工具的 Network 面板。

### Q27: 如何处理跨域问题？

**A**: 跨域问题需要在服务器端配置 CORS：

```typescript
// 服务器端（Express 示例）
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))
```

客户端配置：

```typescript
const httpClient = createHttpClient({
  baseURL: 'https://api.example.com',
  withCredentials: true, // 发送 Cookie
})
```

### Q28: 如何设置请求超时？

**A**: 在配置中设置 `timeout`：

```typescript
// 全局超时
const httpClient = createHttpClient({
  timeout: 10000, // 10 秒
})

// 单个请求超时
await httpClient.get('/users', {
  timeout: 5000, // 5 秒
})
```

### Q29: 如何批量发送请求？

**A**: 使用 `batch` 方法：

```typescript
const results = await httpClient.batch([
  { url: '/users' },
  { url: '/posts' },
  { url: '/comments' },
])

console.log(results[0].data) // 用户数据
console.log(results[1].data) // 文章数据
console.log(results[2].data) // 评论数据
```

### Q30: 如何实现请求重试？

**A**: 配置重试策略：

```typescript
const httpClient = createHttpClient({
  retry: {
    retries: 3, // 重试 3 次
    retryDelay: 1000, // 每次重试延迟 1 秒
    retryCondition: (error) => {
      // 只重试网络错误和 5xx 错误
      return error.isNetworkError || (error.response?.status || 0) >= 500
    },
  },
})
```

### Q31: 如何监控请求性能？

**A**: 启用性能监控：

```typescript
const httpClient = createHttpClient({
  monitor: {
    enabled: true,
    slowRequestThreshold: 3000, // 3 秒
  },
})

// 查看性能统计
const stats = httpClient.getPerformanceStats()
console.log('平均响应时间:', stats.averageResponseTime)

// 查看慢请求
const slowRequests = httpClient.getSlowRequests()
console.log('慢请求:', slowRequests)
```

### Q32: 如何处理大文件上传？

**A**: 使用分片上传：

```typescript
// 方式 1: 使用内置的 upload 方法
await httpClient.upload('/upload', largeFile, {
  chunkSize: 1024 * 1024, // 1MB 分片
  onProgress: (progress) => {
    console.log(`上传进度: ${progress.percentage}%`)
  },
})

// 方式 2: 手动分片
const chunkSize = 1024 * 1024 // 1MB
const chunks = Math.ceil(file.size / chunkSize)

for (let i = 0; i < chunks; i++) {
  const start = i * chunkSize
  const end = Math.min(start + chunkSize, file.size)
  const chunk = file.slice(start, end)

  await httpClient.post('/upload-chunk', {
    chunk,
    index: i,
    total: chunks,
  })
}
```

### Q33: 如何实现请求队列？

**A**: 使用并发控制：

```typescript
const httpClient = createHttpClient({
  concurrency: {
    maxConcurrent: 3, // 最多同时 3 个请求
  },
})

// 发送 10 个请求，但最多同时只有 3 个在执行
const promises = Array.from({ length: 10 }, (_, i) =>
  httpClient.get(`/users/${i}`)
)

const results = await Promise.all(promises)
```

### Q34: 如何实现请求优先级？

**A**: 使用优先级队列：

```typescript
const httpClient = createHttpClient({
  priorityQueue: {
    enabled: true,
  },
})

// 高优先级请求（用户操作）
await httpClient.post('/order', data, {
  priority: 'high',
})

// 低优先级请求（预加载）
await httpClient.get('/recommendations', {
  priority: 'low',
})
```

### Q35: 如何销毁客户端？

**A**: 调用 `destroy` 方法：

```typescript
// 销毁客户端，释放所有资源
httpClient.destroy()

// 销毁后不能再使用
// await httpClient.get('/users') // 会抛出错误
```

---

## 📚 更多资源

- [最佳实践指南](./BEST_PRACTICES.md)
- [性能优化指南](./PERFORMANCE.md)
- [API 文档](./api/README.md)
- [示例代码](../examples/README.md)
- [GitHub Issues](https://github.com/ldesign/http/issues)

---

## 💡 没有找到答案？

如果您的问题没有在这里找到答案，可以：

1. 查看 [API 文档](./api/README.md)
2. 查看 [示例代码](../examples/README.md)
3. 在 [GitHub Issues](https://github.com/ldesign/http/issues) 提问
4. 加入我们的社区讨论

---

**持续更新中...** 如果您有好的问题和解答，欢迎贡献！ 🙏


