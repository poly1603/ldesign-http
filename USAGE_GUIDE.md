# @ldesign/http 使用指南

完整的跨框架HTTP请求库使用指南

## 快速开始

### 1. 选择合适的包

根据你的项目框架选择对应的包:

```bash
# Vue 3项目
pnpm add @ldesign/http-vue

# React项目
pnpm add @ldesign/http-react

# Svelte项目
pnpm add @ldesign/http-svelte

# 或者使用框架无关的核心包
pnpm add @ldesign/http-core
```

## Vue 3 使用

### 安装

```bash
pnpm add @ldesign/http-vue
```

### 全局配置（推荐）

```typescript
// main.ts
import { createApp } from 'vue'
import { HttpPlugin } from '@ldesign/http-vue'
import App from './App.vue'

const app = createApp(App)

app.use(HttpPlugin, {
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

app.mount('#app')
```

### 组件中使用

```vue
<script setup lang="ts">
import { useHttp, useGet, usePost } from '@ldesign/http-vue'

// GET请求 - 立即执行
const { data: users, loading, error } = useGet<User[]>('/users', {
  immediate: true,
})

// POST请求 - 手动执行
const { execute: createUser, loading: creating } = usePost<User>('/users')

async function handleCreate() {
  try {
    await createUser({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    })
    alert('创建成功!')
  }
  catch (err) {
    console.error('创建失败:', err)
  }
}
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <div v-else>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }}
        </li>
      </ul>
    </div>
    
    <button @click="handleCreate" :disabled="creating">
      创建用户
    </button>
  </div>
</template>
```

### 使用Options API

```vue
<script>
export default {
  data() {
    return {
      users: [],
      loading: false,
    }
  },
  async mounted() {
    this.loading = true
    try {
      const response = await this.$http.get('/users')
      this.users = response.data
    }
    finally {
      this.loading = false
    }
  },
}
</script>
```

## React 使用

### 安装

```bash
pnpm add @ldesign/http-react
```

### 全局配置

```tsx
// App.tsx
import { HttpProvider } from '@ldesign/http-react'

function App() {
  return (
    <HttpProvider config={{
      baseURL: 'https://api.example.com',
      timeout: 10000,
    }}>
      <YourComponents />
    </HttpProvider>
  )
}
```

### 组件中使用

```tsx
import { useGet, usePost } from '@ldesign/http-react'

interface User {
  id: number
  name: string
  email: string
}

function UserList() {
  // GET请求
  const { data: users, loading, error } = useGet<User[]>('/users', {
    immediate: true,
  })

  // POST请求
  const { execute: createUser, loading: creating } = usePost<User>('/users')

  const handleCreate = async () => {
    try {
      await createUser({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      })
      alert('创建成功!')
    }
    catch (err) {
      console.error('创建失败:', err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <button onClick={handleCreate} disabled={creating}>
        创建用户
      </button>
    </div>
  )
}
```

## 核心包使用（框架无关）

### 安装

```bash
pnpm add @ldesign/http-core
```

### 基础使用

```typescript
import { createHttpClient } from '@ldesign/http-core'

const http = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
})

// GET请求
const response = await http.get('/users')
console.log(response.data)

// POST请求
const createResponse = await http.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
})
```

## 高级功能

### 1. 拦截器

```typescript
import { createHttpClient } from '@ldesign/http-core'

const http = createHttpClient()

// 请求拦截器
http.useRequestInterceptor({
  onFulfilled: (config) => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      }
    }
    return config
  },
  onRejected: (error) => {
    console.error('请求拦截失败:', error)
    throw error
  },
})

// 响应拦截器
http.useResponseInterceptor({
  onFulfilled: (response) => {
    // 统一处理响应数据
    return response
  },
  onRejected: (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 未授权，跳转登录
      window.location.href = '/login'
    }
    throw error
  },
})
```

### 2. 缓存

```typescript
const http = createHttpClient({
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5分钟
  },
})

// 启用缓存的请求
const response = await http.get('/users', {
  cache: { enabled: true },
})

// 第二次请求会从缓存获取
const cachedResponse = await http.get('/users', {
  cache: { enabled: true },
})
```

### 3. 重试机制

```typescript
const http = createHttpClient({
  retry: {
    retries: 3, // 最多重试3次
    retryDelay: 1000, // 初始延迟1秒
    retryDelayStrategy: 'exponential', // 指数退避
    shouldRetry: (error) => {
      // 只重试网络错误和5xx错误
      return !error.response || error.response.status >= 500
    },
  },
})

// 请求失败会自动重试
const response = await http.get('/users')
```

### 4. 取消请求

```typescript
import { HttpClient } from '@ldesign/http-core'

const http = new HttpClient()

// 创建取消令牌
const { token, cancel } = HttpClient.createCancelToken()

// 发起请求
const promise = http.get('/slow-endpoint', { cancelToken: token })

// 取消请求
setTimeout(() => {
  cancel('用户取消请求')
}, 2000)

try {
  await promise
}
catch (error) {
  console.error('请求被取消:', error)
}
```

### 5. 自定义适配器

```typescript
import type { RequestAdapter, RequestConfig, ResponseData } from '@ldesign/http-core'

// 创建Fetch适配器
const FetchAdapter: RequestAdapter = async (config: RequestConfig): Promise<ResponseData> => {
  const { url, method = 'GET', headers, data } = config
  
  const response = await fetch(url!, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  })

  return {
    data: await response.json(),
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers),
    config,
  }
}

// 使用自定义适配器
const http = createHttpClient({
  adapter: FetchAdapter,
})
```

### 6. 并发请求

```typescript
// 使用Promise.all
const [users, posts] = await Promise.all([
  http.get('/users'),
  http.get('/posts'),
])

// 使用Promise.allSettled（更安全）
const results = await Promise.allSettled([
  http.get('/users'),
  http.get('/posts'),
  http.get('/comments'),
])

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`请求${index}成功:`, result.value.data)
  }
  else {
    console.error(`请求${index}失败:`, result.reason)
  }
})
```

### 7. 分页请求

```typescript
async function fetchAllPages() {
  const allData = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await http.get('/users', {
      params: {
        page,
        pageSize: 20,
      },
    })

    allData.push(...response.data.items)
    hasMore = response.data.hasMore
    page++
  }

  return allData
}
```

### 8. 上传文件

```typescript
async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await http.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}
```

### 9. 下载文件

```typescript
async function downloadFile(url: string, filename: string) {
  const response = await http.get(url, {
    responseType: 'blob',
  })

  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
```

## 最佳实践

### 1. 创建API服务层

```typescript
// services/userService.ts
import { createHttpClient } from '@ldesign/http-core'

const http = createHttpClient({
  baseURL: 'https://api.example.com',
})

export const userService = {
  getAll: () => http.get<User[]>('/users'),
  getById: (id: number) => http.get<User>(`/users/${id}`),
  create: (data: Partial<User>) => http.post<User>('/users', data),
  update: (id: number, data: Partial<User>) => http.put<User>(`/users/${id}`, data),
  delete: (id: number) => http.delete(`/users/${id}`),
}
```

### 2. 错误处理

```typescript
try {
  const response = await http.get('/users')
  console.log(response.data)
}
catch (error) {
  if (error instanceof HttpError) {
    if (error.response) {
      // 服务器返回错误响应
      console.error('服务器错误:', error.response.status, error.response.data)
    }
    else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('网络错误')
    }
    else {
      // 其他错误
      console.error('请求配置错误:', error.message)
    }
  }
}
```

### 3. TypeScript类型安全

```typescript
interface User {
  id: number
  name: string
  email: string
}

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 使用泛型
const response = await http.get<ApiResponse<User[]>>('/users')
console.log(response.data.data) // 类型安全
```

## 故障排查

### 常见问题

1. **CORS错误**
   - 确保服务器配置了正确的CORS头
   - 检查是否需要设置 `withCredentials: true`

2. **401未授权**
   - 检查token是否正确
   - 确认请求拦截器中添加了认证头

3. **请求超时**
   - 增加timeout配置
   - 检查网络连接
   - 服务器响应时间

4. **缓存问题**
   - 清除缓存或禁用缓存
   - 检查缓存键生成逻辑

## License

MIT
