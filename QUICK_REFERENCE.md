# @ldesign/http 快速参考

## 📦 安装

```bash
# 选择你的框架
pnpm add @ldesign/http-vue      # Vue 3
pnpm add @ldesign/http-react    # React
pnpm add @ldesign/http-svelte   # Svelte
pnpm add @ldesign/http-solid    # Solid
pnpm add @ldesign/http-angular  # Angular
pnpm add @ldesign/http-preact   # Preact
pnpm add @ldesign/http-lit      # Lit
pnpm add @ldesign/http-qwik     # Qwik

# 或使用框架无关的核心包
pnpm add @ldesign/http-core
```

## 🚀 快速开始

### Vue 3

```vue
<script setup>
import { useGet } from '@ldesign/http-vue'

const { data, loading, error } = useGet('/api/users', { immediate: true })
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error.message }}</div>
  <ul v-else>
    <li v-for="user in data" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

### React

```tsx
import { useGet } from '@ldesign/http-react'

function Users() {
  const { data, loading, error } = useGet('/api/users', { immediate: true })
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>{error.message}</div>
  
  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

### Svelte

```svelte
<script>
  import { createGetStore } from '@ldesign/http-svelte'
  
  const users = createGetStore('/api/users', { immediate: true })
</script>

{#if $users.loading}
  <div>Loading...</div>
{:else if $users.error}
  <div>{$users.error.message}</div>
{:else}
  <ul>
    {#each $users.data as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{/if}
```

### Solid

```tsx
import { createHttpResource } from '@ldesign/http-solid'
import { Show, For } from 'solid-js'

function Users() {
  const users = createHttpResource('/api/users')
  
  return (
    <Show when={!users.loading()} fallback={<div>Loading...</div>}>
      <ul>
        <For each={users.data()}>
          {user => <li>{user.name}</li>}
        </For>
      </ul>
    </Show>
  )
}
```

### Angular

```typescript
import { Component } from '@angular/core'
import { HttpService } from '@ldesign/http-angular'

@Component({
  selector: 'app-users',
  template: `
    <div *ngIf="loading">Loading...</div>
    <ul *ngIf="users">
      <li *ngFor="let user of users">{{ user.name }}</li>
    </ul>
  `
})
export class UsersComponent {
  users: any[]
  loading = false
  
  constructor(private http: HttpService) {
    this.loadUsers()
  }
  
  async loadUsers() {
    this.loading = true
    const response = await this.http.get('/api/users')
    this.users = response.data
    this.loading = false
  }
}
```

### Preact

```jsx
import { useGet } from '@ldesign/http-preact'

function Users() {
  const { data, loading } = useGet('/api/users', { immediate: true })
  
  if (loading) return <div>Loading...</div>
  
  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

### Lit

```typescript
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { HttpController } from '@ldesign/http-lit'

@customElement('user-list')
class UserList extends LitElement {
  users = new HttpController(this, '/api/users', { immediate: true })
  
  render() {
    if (this.users.loading) return html`<div>Loading...</div>`
    
    return html`
      <ul>
        ${this.users.data?.map(user => html`<li>${user.name}</li>`)}
      </ul>
    `
  }
}
```

### Qwik

```tsx
import { component$ } from '@builder.io/qwik'
import { useGet } from '@ldesign/http-qwik'

export default component$(() => {
  const { data, loading } = useGet('/api/users', { immediate: true })
  
  return (
    <>
      {loading.value ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {data.value?.map(user => <li key={user.id}>{user.name}</li>)}
        </ul>
      )}
    </>
  )
})
```

## 🎯 核心功能

### 基础请求

```typescript
import { createHttpClient } from '@ldesign/http-core'

const http = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
})

// GET
const users = await http.get('/users')

// POST
const newUser = await http.post('/users', { name: 'John' })

// PUT
const updated = await http.put('/users/1', { name: 'Jane' })

// DELETE
await http.delete('/users/1')

// PATCH
await http.patch('/users/1', { name: 'Bob' })
```

### 拦截器

```typescript
// 请求拦截器
http.useRequestInterceptor({
  onFulfilled: (config) => {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    }
    return config
  },
})

// 响应拦截器
http.useResponseInterceptor({
  onFulfilled: (response) => response,
  onRejected: (error) => {
    if (error.response?.status === 401) {
      // 跳转登录
    }
    throw error
  },
})
```

### 缓存

```typescript
const http = createHttpClient({
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5分钟
  },
})

// 启用缓存的请求
await http.get('/users', { cache: { enabled: true } })
```

### 重试

```typescript
const http = createHttpClient({
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryDelayStrategy: 'exponential',
  },
})
```

### 取消请求

```typescript
const { token, cancel } = HttpClient.createCancelToken()

const promise = http.get('/users', { cancelToken: token })

// 取消请求
cancel('User cancelled')
```

### 进度跟踪

```typescript
import { uploadWithProgress, downloadWithProgress } from '@ldesign/http-core'

// 上传
await uploadWithProgress(url, file, (progress) => {
  console.log(`${progress.percentage}%`)
})

// 下载
await downloadWithProgress(url, (progress) => {
  console.log(`${progress.percentage}%`)
})
```

### 请求队列

```typescript
import { RequestQueue } from '@ldesign/http-core'

const queue = new RequestQueue({ concurrency: 3 })

await queue.enqueue(config, () => http.request(config))
```

### 请求去重

```typescript
import { RequestDeduplication } from '@ldesign/http-core'

const dedup = new RequestDeduplication()

// 相同请求会复用
await dedup.execute(config, () => http.request(config))
```

### 批量优化

```typescript
import { BatchOptimizer } from '@ldesign/http-core'

const optimizer = new BatchOptimizer((configs) => {
  return Promise.all(configs.map(c => http.request(c)))
})

await optimizer.add(config1)
await optimizer.add(config2)
// 自动批量处理
```

### Fetch适配器

```typescript
import { FetchAdapter } from '@ldesign/http-core'

const http = createHttpClient({
  adapter: FetchAdapter,
})
```

## 📚 框架特定API

### Vue Plugin

```typescript
import { HttpPlugin } from '@ldesign/http-vue'

app.use(HttpPlugin, {
  baseURL: 'https://api.example.com',
})

// 使用 $http
this.$http.get('/users')
```

### React Provider

```tsx
import { HttpProvider } from '@ldesign/http-react'

<HttpProvider config={{ baseURL: 'https://api.example.com' }}>
  <App />
</HttpProvider>
```

### Angular Module

```typescript
import { HttpModule } from '@ldesign/http-angular'

@NgModule({
  imports: [
    HttpModule.forRoot({
      baseURL: 'https://api.example.com',
    }),
  ],
})
```

### Svelte Stores

```typescript
import { createHttpStore, combineHttpStores } from '@ldesign/http-svelte'

const users = createGetStore('/api/users')
const posts = createGetStore('/api/posts')

const combined = combineHttpStores({ users, posts })
```

### Solid Signals

```typescript
import { createHttpSignal } from '@ldesign/http-solid'

const { data, loading, execute } = createHttpSignal('/api/users')

// 手动执行
await execute({ params: { page: 1 } })
```

## 🔧 配置选项

```typescript
interface RequestConfig {
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  baseURL?: string
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'
  withCredentials?: boolean
  adapter?: RequestAdapter
  cancelToken?: CancelToken
  retry?: RetryConfig
  cache?: CacheConfig
}
```

## 🎨 TypeScript支持

```typescript
interface User {
  id: number
  name: string
  email: string
}

// 类型安全的请求
const response = await http.get<User[]>('/users')
const users: User[] = response.data

// 泛型hook
const { data } = useGet<User[]>('/users')
// data的类型是 User[] | null
```

## 📖 更多资源

- [完整文档](./USAGE_GUIDE.md)
- [架构说明](./ARCHITECTURE.md)
- [功能增强](./ENHANCEMENT_SUMMARY.md)
- [项目总结](./PROJECT_SUMMARY.md)
