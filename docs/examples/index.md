# 示例概览

这里提供了各种使用 @ldesign/http 的实际示例，从基础用法到高级功能。

## 🚀 快速开始示例

### 基础HTTP请求

```typescript
import { createHttpClient } from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com'
})

// GET 请求
const users = await client.get('/users')
console.log(users.data)

// POST 请求
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
```

### Vue3 组合式函数

```vue
<script setup>
import { useGet } from '@ldesign/http'

const { data, loading, error } = useGet('/users')
</script>

<template>
  <div>
    <div v-if="loading">
      加载中...
    </div>
    <div v-else-if="error">
      错误: {{ error.message }}
    </div>
    <div v-else>
      <ul>
        <li v-for="user in data" :key="user.id">
          {{ user.name }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

## 📚 示例分类

### 基础示例
- [基础用法](/examples/basic) - 最简单的使用方式
- [配置选项](/examples/configuration) - 各种配置示例
- [错误处理](/examples/error-handling) - 错误处理最佳实践

### 真实API示例
- [JSONPlaceholder API](/examples/real-api) - 使用免费测试API
- [GitHub API](/examples/github-api) - 获取GitHub数据
- [天气API](/examples/weather-api) - 天气数据查询
- [在线演示](/examples/live-demo) - 可交互的在线演示

### 高级功能
- [文件上传](/examples/upload) - 文件上传和进度监控
- [认证示例](/examples/auth) - JWT认证和token管理
- [缓存策略](/examples/caching) - 各种缓存使用场景
- [重试机制](/examples/retry) - 智能重试配置

### 完整项目
- [用户管理系统](/examples/complete-demo) - 完整的CRUD应用
- [博客系统](/examples/blog-system) - 内容管理示例
- [电商购物车](/examples/shopping-cart) - 购物车功能实现

## 🎯 按场景分类

### 数据获取
```typescript
// 用户列表
const { data: users } = useGet('/users')

// 分页数据
const { data: posts } = useGet('/posts', {
  params: { page: 1, limit: 10 }
})

// 条件查询
const searchQuery = ref('')
const { data: results } = useGet(() =>
  searchQuery.value ? `/search?q=${searchQuery.value}` : null
)
```

### 数据提交
```typescript
// 创建用户
const { execute: createUser, loading } = usePost('/users', {
  immediate: false,
  onSuccess: (user) => {
    console.log('用户创建成功:', user)
  }
})

// 更新数据
const { execute: updateUser } = usePut('/users/1', {
  immediate: false
})

// 删除数据
const { execute: deleteUser } = useDelete('/users/1', {
  immediate: false
})
```

### 文件操作
```typescript
// 文件上传
async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await client.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progress) => {
      console.log(`上传进度: ${progress.percentage}%`)
    }
  })

  return response.data
}
```

## 🔧 配置示例

### 基础配置
```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  }
})
```

### 高级配置
```typescript
const client = createQuickClient({
  baseURL: 'https://api.example.com',
  adapter: 'fetch',
  enableCache: true,
  enableRetry: true,
  enableLog: true,
  authToken: () => localStorage.getItem('token')
})
```

### 插件配置
```typescript
import {
  createCachePlugin,
  createLogInterceptor,
  createRetryPlugin
} from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://api.example.com'
})

// 缓存插件
const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 5 * 60 * 1000
})
cachePlugin.install(client)

// 重试插件
const retryPlugin = createRetryPlugin({
  retries: 3,
  strategy: 'exponential'
})
retryPlugin.install(client)

// 日志拦截器
const logInterceptors = createLogInterceptor()
client.addRequestInterceptor(logInterceptors.request)
client.addResponseInterceptor(logInterceptors.response)
```

## 🎨 Vue3 集成示例

### 插件安装
```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http'

const app = createApp(App)
app.use(createHttpPlugin({
  baseURL: 'https://api.example.com'
}))
```

### 组合式函数
```vue
<script setup>
import { ref } from 'vue'
import { useGet, usePost, useRequest } from '@ldesign/http'

// 通用请求
const { data, loading, error, execute } = useRequest('/api/data', {
  immediate: false
})

// GET 请求
const { data: users } = useGet('/users')

// POST 请求
const { execute: createUser } = usePost('/users', {
  immediate: false
})

// 动态URL
const userId = ref(1)
const { data: user } = useGet(() => `/users/${userId.value}`)
</script>
```

## 🌟 最佳实践

### 1. 统一API管理
```typescript
// api/index.ts
export const userApi = {
  getUsers: () => client.get('/users'),
  getUser: id => client.get(`/users/${id}`),
  createUser: data => client.post('/users', data),
  updateUser: (id, data) => client.put(`/users/${id}`, data),
  deleteUser: id => client.delete(`/users/${id}`)
}
```

### 2. 错误处理
```typescript
// 全局错误处理
client.addResponseInterceptor({
  onRejected: (error) => {
    if (error.response?.status === 401) {
      // 跳转登录
      router.push('/login')
    }
 else if (error.response?.status >= 500) {
      // 显示错误提示
      showErrorMessage('服务器错误')
    }
    return Promise.reject(error)
  }
})
```

### 3. 类型安全
```typescript
interface User {
  id: number
  name: string
  email: string
}

const { data } = useGet<User[]>('/users')
// data 的类型自动推断为 User[] | null
```

## 📖 更多资源

- [API 参考](/api/) - 完整的API文档
- [Vue3 集成](/vue/) - Vue3专用功能
- [插件系统](/plugins/) - 插件开发指南
- [迁移指南](/migration) - 从其他库迁移

## 🤝 社区示例

欢迎提交你的示例到我们的 [GitHub仓库](https://github.com/your-org/ldesign)！

---

选择一个示例开始探索 @ldesign/http 的强大功能吧！ 🚀
