# @ldesign/http 快速开始指南

## 安装

```bash
# 使用 pnpm（推荐）
pnpm add @ldesign/http

# 使用 npm
npm install @ldesign/http

# 使用 yarn
yarn add @ldesign/http
```

## 基础使用

### 1. 创建客户端

```typescript
import { createHttpClient } from '@ldesign/http'

// 异步创建（推荐）
const client = await createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
})
```

### 2. 发送请求

```typescript
// GET 请求
const response = await client.get('/users')
console.log(response.data)

// POST 请求
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// PUT 请求
await client.put('/users/1', { name: 'Jane Doe' })

// DELETE 请求
await client.delete('/users/1')
```

### 3. 类型安全

```typescript
interface User {
  id: number
  name: string
  email: string
}

// 类型化请求
const response = await client.get<User[]>('/users')
// response.data 自动推断为 User[]

const user = await client.post<User>('/users', {
  name: 'John',
  email: 'john@example.com'
})
// user.data 自动推断为 User
```

## 使用预设配置（推荐）

预设配置提供开箱即用的最佳实践配置：

```typescript
import { createHttpClient, presets } from '@ldesign/http'

// REST API 应用
const client = await createHttpClient(presets.restful)

// GraphQL 应用
const client = await createHttpClient(presets.graphql)

// 移动应用（低功耗模式）
const client = await createHttpClient(presets.lowPower)

// 实时应用
const client = await createHttpClient(presets.realtime)

// 自动选择（根据环境）
const client = await createHttpClient(autoPreset())
```

### 基于预设自定义

```typescript
import { presets, mergePreset } from '@ldesign/http'

const client = await createHttpClient(
  mergePreset('restful', {
    baseURL: 'https://api.example.com',
    timeout: 15000
  })
)

// 或者简单扩展
const client = await createHttpClient({
  ...presets.restful,
  baseURL: 'https://api.example.com'
})
```

## 高级功能

### 1. 智能缓存

```typescript
const client = await createHttpClient({
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000  // 5分钟
  }
})

// 第一次请求会缓存
await client.get('/users')

// 第二次请求直接从缓存返回
await client.get('/users')  // 超快！
```

### 2. 自动重试

```typescript
const client = await createHttpClient({
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      // 只重试网络错误和 5xx 错误
      return error.isNetworkError || (error.status >= 500)
    }
  }
})
```

### 3. 请求拦截器

```typescript
// 添加认证 token
client.addRequestInterceptor((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// 处理响应错误
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.status === 401) {
      // 跳转到登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### 4. 并发控制

```typescript
const client = await createHttpClient({
  concurrency: {
    maxConcurrent: 10,     // 最大并发数
    deduplication: true    // 自动去重相同请求
  }
})

// 同时发送多个相同请求，只会执行一次
const [r1, r2, r3] = await Promise.all([
  client.get('/users'),
  client.get('/users'),  // 自动去重
  client.get('/users'),  // 自动去重
])
```

## Vue 3 集成

### 1. 安装插件

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin, presets } from '@ldesign/http'
import App from './App.vue'

const app = createApp(App)

app.use(createHttpPlugin({
  ...presets.restful,
  baseURL: 'https://api.example.com'
}))

app.mount('#app')
```

### 2. 在组件中使用

```vue
<template>
  <div>
    <button @click="fetchUsers">获取用户</button>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

const $http = inject('http')
const users = ref<User[]>([])
const loading = ref(false)
const error = ref<Error | null>(null)

const fetchUsers = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $http.get<User[]>('/users')
    users.value = response.data
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
}
</script>
```

### 3. 使用组合式函数

```typescript
import { useHttp } from '@ldesign/http/vue'

const { data, loading, error, execute } = useHttp<User[]>('/users')

// 自动执行
await execute()

// 手动刷新
await execute()
```

## 优化技巧

### 1. 使用核心模块（最小体积）

```typescript
// 只使用核心功能（推荐，体积最小）
import { createHttpClient } from '@ldesign/http/core'

const client = await createHttpClient({
  baseURL: 'https://api.example.com'
})
```

### 2. 预加载适配器

```typescript
// 在应用启动时预加载
import { preloadAdapters } from '@ldesign/http'

await preloadAdapters(['fetch'])

// 之后可以同步创建
import { createHttpClientSync } from '@ldesign/http'
const client = createHttpClientSync()
```

### 3. 按需导入高级功能

```typescript
// 只在需要时导入
import { createHttpClient } from '@ldesign/http/core'
import { withCache } from '@ldesign/http/features/cache'
import { withRetry } from '@ldesign/http/features/retry'
```

## 常见场景

### 文件上传

```typescript
const file = document.querySelector('input[type="file"]').files[0]

const result = await client.upload('/upload', file, {
  onProgress: (progress) => {
    console.log(`上传进度: ${progress.percentage}%`)
  }
})
```

### 文件下载

```typescript
const result = await client.download('/files/document.pdf', {
  filename: 'document.pdf',
  onProgress: (progress) => {
    console.log(`下载进度: ${progress.percentage}%`)
  }
})
```

### 请求取消

```typescript
const controller = new AbortController()

const request = client.get('/api/data', {
  signal: controller.signal
})

// 取消请求
controller.abort()
```

### 错误处理

```typescript
import { 
  isHttpError, 
  isNetworkError, 
  isTimeoutError 
} from '@ldesign/http'

try {
  await client.get('/users')
} catch (error) {
  if (isHttpError(error)) {
    console.log('HTTP 错误:', error.status)
  } else if (isNetworkError(error)) {
    console.log('网络错误')
  } else if (isTimeoutError(error)) {
    console.log('请求超时')
  }
}
```

## 最佳实践

### 1. 使用预设配置

```typescript
import { presets } from '@ldesign/http'

// ✅ 推荐：使用预设
const client = await createHttpClient(presets.restful)

// ❌ 不推荐：手动配置所有选项
const client = await createHttpClient({
  timeout: 10000,
  cache: { enabled: true, ttl: 300000 },
  retry: { retries: 3, retryDelay: 1000 },
  // ...
})
```

### 2. 类型安全

```typescript
// ✅ 推荐：定义接口
interface User {
  id: number
  name: string
}

const response = await client.get<User[]>('/users')

// ❌ 不推荐：不指定类型
const response = await client.get('/users')
```

### 3. 错误处理

```typescript
// ✅ 推荐：使用类型守卫
import { isHttpError } from '@ldesign/http'

try {
  await client.get('/users')
} catch (error) {
  if (isHttpError(error)) {
    // TypeScript 知道 error 有 status 属性
    console.log(error.status)
  }
}

// ❌ 不推荐：直接访问属性
catch (error: any) {
  console.log(error.status)  // 不安全
}
```

### 4. 使用核心模块

```typescript
// ✅ 推荐：只使用核心功能（体积更小）
import { createHttpClient } from '@ldesign/http/core'

// ❌ 不推荐：导入所有功能（体积更大）
import { createHttpClient } from '@ldesign/http'
```

## 性能优化

### 包体积优化

```typescript
// 方案1：使用核心模块（最小 ~25KB）
import { createHttpClient } from '@ldesign/http/core'

// 方案2：按需导入（~30-40KB）
import { createHttpClient } from '@ldesign/http/core'
import { withCache } from '@ldesign/http/features/cache'

// 方案3：完整导入（~60KB）
import { createHttpClient } from '@ldesign/http'
```

### 运行时优化

```typescript
// 1. 预加载适配器
await preloadAdapters(['fetch'])

// 2. 使用预设配置
const client = await createHttpClient(presets.restful)

// 3. 启用缓存
const client = await createHttpClient({
  cache: { enabled: true }
})

// 4. 启用请求去重
const client = await createHttpClient({
  concurrency: { deduplication: true }
})
```

## 下一步

- 查看[完整文档](./README.md)
- 查看[API 参考](./docs/api)
- 查看[示例项目](./examples)
- 查看[性能优化指南](./OPTIMIZATION_SUMMARY.md)

## 获取帮助

- [GitHub Issues](https://github.com/ldesign/http/issues)
- [讨论区](https://github.com/ldesign/http/discussions)
- [更新日志](./CHANGELOG.md)


