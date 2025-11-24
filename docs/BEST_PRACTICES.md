# @ldesign/http 最佳实践指南

本指南提供了使用 `@ldesign/http` 的最佳实践和推荐模式，帮助您构建高性能、可维护的应用程序。

---

## 📋 目录

- [客户端配置](#客户端配置)
- [性能优化](#性能优化)
- [错误处理](#错误处理)
- [缓存策略](#缓存策略)
- [内存管理](#内存管理)
- [安全性](#安全性)
- [测试](#测试)

---

## 🔧 客户端配置

### ✅ 推荐：使用单例模式

**为什么**：避免创建多个客户端实例，减少内存占用和初始化开销。

```typescript
// ✅ 推荐：创建单例客户端
// src/api/http.ts
import { createHttpClient } from '@ldesign/http'

export const httpClient = createHttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 分钟
  },
  retry: {
    retries: 3,
    retryDelay: 1000,
  },
})

// 在其他文件中使用
import { httpClient } from '@/api/http'

const users = await httpClient.get('/users')
```

```typescript
// ❌ 不推荐：每次都创建新实例
async function fetchUsers() {
  const client = createHttpClient({ baseURL: '/api' })
  return client.get('/users')
}
```

### ✅ 推荐：合理配置超时时间

**为什么**：避免请求长时间挂起，提升用户体验。

```typescript
// ✅ 推荐：根据接口类型设置不同的超时时间
const httpClient = createHttpClient({
  timeout: 10000, // 默认 10 秒
})

// 对于文件上传，使用更长的超时时间
await httpClient.upload('/upload', file, {
  timeout: 60000, // 60 秒
})

// 对于快速接口，使用更短的超时时间
await httpClient.get('/health', {
  timeout: 3000, // 3 秒
})
```

### ✅ 推荐：使用环境变量管理配置

```typescript
// ✅ 推荐：使用环境变量
const httpClient = createHttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
})
```

---

## ⚡ 性能优化

### ✅ 推荐：启用缓存

**为什么**：减少重复请求，提升响应速度。

```typescript
// ✅ 推荐：为 GET 请求启用缓存
const httpClient = createHttpClient({
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 分钟
    maxSize: 100, // 最多缓存 100 个请求
  },
})

// 使用缓存
const users = await httpClient.get('/users') // 第一次请求，从服务器获取
const usersAgain = await httpClient.get('/users') // 从缓存获取，速度更快
```

### ✅ 推荐：使用请求去重

**为什么**：避免同时发送多个相同的请求。

```typescript
// ✅ 推荐：启用请求去重
const httpClient = createHttpClient({
  concurrency: {
    maxConcurrent: 6, // 最多同时 6 个请求
    enableDeduplication: true, // 启用去重
  },
})

// 同时发送多个相同请求，只会实际发送一次
const [users1, users2, users3] = await Promise.all([
  httpClient.get('/users'),
  httpClient.get('/users'),
  httpClient.get('/users'),
])
// 三个请求共享同一个响应
```

### ✅ 推荐：使用优先级队列

**为什么**：确保重要请求优先执行。

```typescript
// ✅ 推荐：为重要请求设置高优先级
// 紧急请求（如用户操作）
await httpClient.post('/order', orderData, {
  priority: 'high',
})

// 普通请求（如数据预加载）
await httpClient.get('/recommendations', {
  priority: 'low',
})
```

### ✅ 推荐：批量请求

**为什么**：减少网络往返次数。

```typescript
// ✅ 推荐：使用批量请求
const results = await httpClient.batch([
  { url: '/users' },
  { url: '/posts' },
  { url: '/comments' },
])

// ❌ 不推荐：逐个请求
const users = await httpClient.get('/users')
const posts = await httpClient.get('/posts')
const comments = await httpClient.get('/comments')
```

---

## 🛡️ 错误处理

### ✅ 推荐：使用统一的错误处理

```typescript
// ✅ 推荐：添加全局错误拦截器
httpClient.interceptors.error.use((error) => {
  // 统一处理错误
  if (error.response?.status === 401) {
    // 跳转到登录页
    router.push('/login')
  }
  else if (error.response?.status === 500) {
    // 显示错误提示
    message.error('服务器错误，请稍后重试')
  }
  
  return Promise.reject(error)
})
```

### ✅ 推荐：使用自动重试

```typescript
// ✅ 推荐：为不稳定的接口启用重试
const httpClient = createHttpClient({
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      // 只重试网络错误和 5xx 错误
      return error.isNetworkError || (error.response?.status || 0) >= 500
    },
  },
})
```

### ✅ 推荐：使用 TypeScript 类型

```typescript
// ✅ 推荐：定义响应类型
interface User {
  id: number
  name: string
  email: string
}

const user = await httpClient.get<User>('/users/1')
// user.data 的类型是 User，有完整的类型提示
console.log(user.data.name)
```

---

## 💾 缓存策略

### ✅ 推荐：为不同类型的数据使用不同的缓存策略

```typescript
// ✅ 推荐：静态数据使用长缓存
await httpClient.get('/config', {
  cache: {
    ttl: 60 * 60 * 1000, // 1 小时
  },
})

// 动态数据使用短缓存
await httpClient.get('/notifications', {
  cache: {
    ttl: 30 * 1000, // 30 秒
  },
})

// 实时数据不使用缓存
await httpClient.get('/stock-price', {
  cache: {
    enabled: false,
  },
})
```

### ✅ 推荐：手动清除缓存

```typescript
// ✅ 推荐：在数据更新后清除相关缓存
// 创建用户后，清除用户列表缓存
await httpClient.post('/users', userData)
await httpClient.clearCache() // 清除所有缓存

// 或者使用缓存标签（如果支持）
await httpClient.invalidateCache('/users')
```

---

## 🧹 内存管理

### ✅ 推荐：在组件卸载时取消请求

```typescript
// ✅ 推荐：Vue 3 组合式 API
import { onUnmounted } from 'vue'
import { httpClient } from '@/api/http'

export function useUsers() {
  const controller = new AbortController()

  const fetchUsers = async () => {
    return httpClient.get('/users', {
      signal: controller.signal,
    })
  }

  // 组件卸载时取消请求
  onUnmounted(() => {
    controller.abort()
  })

  return { fetchUsers }
}
```

```typescript
// ✅ 推荐：React Hooks
import { useEffect } from 'react'
import { httpClient } from '@/api/http'

function useUsers() {
  useEffect(() => {
    const controller = new AbortController()

    httpClient.get('/users', {
      signal: controller.signal,
    })

    // 清理函数
    return () => {
      controller.abort()
    }
  }, [])
}
```

### ✅ 推荐：销毁不再使用的客户端

```typescript
// ✅ 推荐：在应用卸载时销毁客户端
import { httpClient } from '@/api/http'

// 应用卸载时
window.addEventListener('beforeunload', () => {
  httpClient.destroy()
})
```

---

## 🔒 安全性

### ✅ 推荐：使用请求拦截器添加认证信息

```typescript
// ✅ 推荐：统一添加 Token
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})
```

### ✅ 推荐：避免在 URL 中传递敏感信息

```typescript
// ❌ 不推荐：在 URL 中传递密码
await httpClient.get(`/login?password=${password}`)

// ✅ 推荐：使用 POST 请求体
await httpClient.post('/login', {
  username,
  password,
})
```

### ✅ 推荐：验证响应数据

```typescript
// ✅ 推荐：使用响应验证器
import { z } from 'zod'

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
})

const response = await httpClient.get('/users/1')
const user = UserSchema.parse(response.data) // 验证数据结构
```

---

## 🧪 测试

### ✅ 推荐：使用 Mock 适配器进行测试

```typescript
// ✅ 推荐：测试时使用 Mock
import { createHttpClient } from '@ldesign/http'
import { MockAdapter } from '@ldesign/http/adapters'

describe('UserService', () => {
  it('should fetch users', async () => {
    const mockAdapter = new MockAdapter()
    mockAdapter.onGet('/users').reply(200, [
      { id: 1, name: 'John' },
    ])

    const client = createHttpClient({}, mockAdapter)
    const response = await client.get('/users')

    expect(response.data).toHaveLength(1)
  })
})
```

---

## 📊 性能监控

### ✅ 推荐：启用性能监控

```typescript
// ✅ 推荐：在开发环境启用监控
const httpClient = createHttpClient({
  monitor: {
    enabled: import.meta.env.DEV,
    slowRequestThreshold: 3000, // 3 秒
  },
})

// 查看性能统计
const stats = httpClient.getPerformanceStats()
console.log('平均响应时间:', stats.averageResponseTime)
console.log('慢请求:', httpClient.getSlowRequests())
```

---

## 🎯 总结

### 核心原则

1. **单例模式** - 避免创建多个客户端实例
2. **启用缓存** - 减少重复请求
3. **请求去重** - 避免并发相同请求
4. **错误处理** - 使用统一的错误拦截器
5. **内存管理** - 及时取消和清理请求
6. **类型安全** - 使用 TypeScript 类型
7. **性能监控** - 在开发环境启用监控

### 性能检查清单

- [ ] 是否使用了单例客户端？
- [ ] 是否启用了缓存？
- [ ] 是否配置了合理的超时时间？
- [ ] 是否使用了请求去重？
- [ ] 是否在组件卸载时取消请求？
- [ ] 是否使用了 TypeScript 类型？
- [ ] 是否添加了错误处理？
- [ ] 是否启用了性能监控？

---

**更多信息**:
- [API 文档](./api/README.md)
- [性能优化指南](./PERFORMANCE.md)
- [常见问题](./FAQ.md)


