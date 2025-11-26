# 快速开始

本指南将帮助你在几分钟内开始使用 @ldesign/http。

## 安装

### 核心包（框架无关）

::: code-group

```bash [pnpm]
pnpm add @ldesign/http-core
```

```bash [npm]
npm install @ldesign/http-core
```

```bash [yarn]
yarn add @ldesign/http-core
```

:::

### 框架适配器（可选）

如果你在使用 Vue 3，可以安装 Vue 适配器获得更好的集成体验：

::: code-group

```bash [pnpm]
pnpm add @ldesign/http-vue
```

```bash [npm]
npm install @ldesign/http-vue
```

```bash [yarn]
yarn add @ldesign/http-vue
```

:::

## 基础用法

### 创建 HTTP 客户端

```typescript
import { createHttpClient } from '@ldesign/http-core'

// 创建一个基础客户端
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
})

// 发送 GET 请求
const response = await client.get('/users')
console.log(response.data)
```

### 类型安全的请求

使用 TypeScript 类型获得更好的开发体验：

```typescript
interface User {
  id: number
  name: string
  email: string
}

// GET 请求
const response = await client.get<User[]>('/users')
// response.data 的类型为 User[]

// POST 请求
const newUser = await client.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
// newUser.data 的类型为 User
```

### 配置适配器

@ldesign/http 支持多种 HTTP 适配器：

```typescript
// 使用 Fetch API（默认）
const client = createHttpClient({
  baseURL: '/api',
  adapter: 'fetch'
})

// 使用 Axios
const client = createHttpClient({
  baseURL: '/api',
  adapter: 'axios'
})

// 使用 Alova
const client = createHttpClient({
  baseURL: '/api',
  adapter: 'alova'
})

// 自动选择最佳适配器
const client = createHttpClient({
  baseURL: '/api',
  adapter: 'auto'
})
```

## Vue 3 集成

### 安装插件

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http-vue'
import App from './App.vue'

const app = createApp(App)

// 安装 HTTP 插件
app.use(createHttpPlugin({
  baseURL: 'https://api.example.com',
  timeout: 10000,
}))

app.mount('#app')
```

### 使用 Composables

#### useHttp

最基础的组合式函数：

```vue
<script setup lang="ts">
import { useHttp } from '@ldesign/http-vue'

interface User {
  id: number
  name: string
  email: string
}

const { data, loading, error, execute } = useHttp<User[]>('/api/users', {
  immediate: true // 自动执行请求
})
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <ul v-else>
      <li v-for="user in data" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
```

#### useRequest

更强大的请求管理：

```vue
<script setup lang="ts">
import { useRequest } from '@ldesign/http-vue'

interface User {
  id: number
  name: string
}

const {
  data,
  loading,
  error,
  execute,
  refresh,
  cancel
} = useRequest<User[]>({
  url: '/api/users',
  method: 'GET',
  immediate: true,
  // 启用缓存
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5 分钟
  },
  // 启用重试
  retry: {
    enabled: true,
    maxAttempts: 3
  }
})

// 刷新数据
const handleRefresh = () => {
  refresh()
}

// 取消请求
const handleCancel = () => {
  cancel()
}
</script>
```

#### useResource

RESTful 资源管理：

```vue
<script setup lang="ts">
import { useResource } from '@ldesign/http-vue'

interface User {
  id: number
  name: string
  email: string
}

const {
  items,
  current,
  loading,
  list,
  get,
  create,
  update,
  remove
} = useResource<User>('/api/users')

// 获取列表
const handleLoadUsers = async () => {
  await list()
}

// 创建用户
const handleCreateUser = async () => {
  await create({
    name: 'John Doe',
    email: 'john@example.com'
  })
}

// 更新用户
const handleUpdateUser = async (id: number) => {
  await update(id, {
    name: 'Jane Doe'
  })
}

// 删除用户
const handleDeleteUser = async (id: number) => {
  await remove(id)
}
</script>
```

## 常用功能

### 添加请求拦截器

```typescript
const client = createHttpClient({
  baseURL: '/api'
})

// 添加认证令牌
client.addRequestInterceptor((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})
```

### 添加响应拦截器

```typescript
// 处理响应
client.addResponseInterceptor(
  (response) => {
    // 成功响应处理
    console.log('请求成功:', response.config.url)
    return response
  },
  (error) => {
    // 错误处理
    if (error.response?.status === 401) {
      // 重定向到登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### 启用缓存

```typescript
const client = createHttpClient({
  baseURL: '/api',
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 分钟
    storage: 'memory' // 或 'localStorage', 'indexedDB'
  }
})

// 发送可缓存的请求
const response = await client.get('/users', {
  cache: true
})
```

### 启用重试

```typescript
const client = createHttpClient({
  baseURL: '/api',
  retry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential' // 指数退避
  }
})

// 请求失败会自动重试
const response = await client.get('/users')
```

### 请求取消

```typescript
const controller = new AbortController()

const request = client.get('/users', {
  signal: controller.signal
})

// 取消请求
controller.abort()
```

### 文件上传

```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('name', 'avatar')

const response = await client.upload('/upload', formData, {
  onUploadProgress: (progress) => {
    console.log(`上传进度: ${progress.percentage}%`)
  }
})
```

### 文件下载

```typescript
const response = await client.download('/files/document.pdf', {
  onDownloadProgress: (progress) => {
    console.log(`下载进度: ${progress.percentage}%`)
  }
})

// 保存文件
const url = URL.createObjectURL(response.data)
const a = document.createElement('a')
a.href = url
a.download = response.filename
a.click()
URL.revokeObjectURL(url)
```

## 配置选项

### 基础配置

```typescript
interface HttpConfig {
  // 基础 URL
  baseURL?: string
  
  // 超时时间（毫秒）
  timeout?: number
  
  // 请求头
  headers?: Record<string, string>
  
  // 适配器
  adapter?: 'fetch' | 'axios' | 'alova' | 'auto'
  
  // 是否携带凭证
  withCredentials?: boolean
}
```

### 缓存配置

```typescript
interface CacheConfig {
  // 是否启用缓存
  enabled: boolean
  
  // 缓存有效期（毫秒）
  ttl?: number
  
  // 存储方式
  storage?: 'memory' | 'localStorage' | 'indexedDB'
  
  // 缓存键生成函数
  keyGenerator?: (config: RequestConfig) => string
}
```

### 重试配置

```typescript
interface RetryConfig {
  // 是否启用重试
  enabled: boolean
  
  // 最大重试次数
  maxAttempts?: number
  
  // 重试延迟（毫秒）
  delay?: number
  
  // 退避策略
  backoff?: 'linear' | 'exponential'
  
  // 重试条件
  condition?: (error: any) => boolean
}
```

## 下一步

现在你已经了解了基础用法，可以继续学习：

- [HTTP 客户端](/guide/http-client) - 深入了解客户端功能
- [适配器系统](/guide/adapters) - 了解适配器的工作原理
- [拦截器](/guide/interceptors) - 掌握拦截器的使用
- [缓存管理](/guide/caching) - 学习高级缓存策略
- [Vue 集成](/packages/vue) - Vue 3 专属功能

## 常见问题

### 如何切换适配器？

```typescript
const client = createHttpClient({
  baseURL: '/api',
  adapter: 'axios' // 或 'fetch', 'alova'
})
```

### 如何禁用某个请求的缓存？

```typescript
const response = await client.get('/users', {
  cache: false
})
```

### 如何设置请求超时？

```typescript
// 全局超时
const client = createHttpClient({
  timeout: 10000 // 10 秒
})

// 单个请求超时
const response = await client.get('/users', {
  timeout: 5000 // 5 秒
})
```

### 如何处理错误？

```typescript
try {
  const response = await client.get('/users')
} catch (error) {
  if (error.response) {
    // 服务器响应错误
    console.error('状态码:', error.response.status)
  } else if (error.request) {
    // 请求已发送但没有响应
    console.error('网络错误')
  } else {
    // 其他错误
    console.error('错误:', error.message)
  }
}