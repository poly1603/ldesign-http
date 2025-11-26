# 基本用法

本页面展示 @ldesign/http 的基础使用示例。

## 创建客户端

### 最简单的客户端

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: 'https://api.example.com'
})
```

### 带配置的客户端

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

## GET 请求

### 基础 GET 请求

```typescript
// 简单请求
const response = await client.get('/users')
console.log(response.data)

// 带类型
interface User {
  id: number
  name: string
  email: string
}

const response = await client.get<User[]>('/users')
// response.data 类型为 User[]
```

### 带查询参数

```typescript
const response = await client.get('/users', {
  params: {
    page: 1,
    limit: 10,
    sort: 'name',
    filter: 'active'
  }
})
// 请求: /users?page=1&limit=10&sort=name&filter=active
```

### 带请求头

```typescript
const response = await client.get('/users', {
  headers: {
    'X-Custom-Header': 'value'
  }
})
```

## POST 请求

### JSON 数据

```typescript
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
})
```

### 类型安全的 POST

```typescript
interface CreateUserRequest {
  name: string
  email: string
}

interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

const response = await client.post<User, CreateUserRequest>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})

console.log(response.data.id) // 类型安全
```

### FormData

```typescript
const formData = new FormData()
formData.append('name', 'John Doe')
formData.append('email', 'john@example.com')

const response = await client.post('/users', formData)
```

## PUT 和 PATCH 请求

### PUT - 完整更新

```typescript
const response = await client.put('/users/1', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  age: 25
})
```

### PATCH - 部分更新

```typescript
const response = await client.patch('/users/1', {
  name: 'Jane Doe' // 只更新 name
})
```

## DELETE 请求

```typescript
// 删除单个资源
await client.delete('/users/1')

// 带请求体的删除
await client.delete('/users', {
  data: {
    ids: [1, 2, 3]
  }
})
```

## 错误处理

### Try-Catch

```typescript
try {
  const response = await client.get('/users')
  console.log(response.data)
} catch (error) {
  console.error('请求失败:', error.message)
}
```

### 详细错误处理

```typescript
import { isHttpError, isNetworkError } from '@ldesign/http-core'

try {
  const response = await client.get('/users')
} catch (error) {
  if (isHttpError(error)) {
    // HTTP 错误（4xx, 5xx）
    console.error('状态码:', error.response?.status)
    console.error('错误数据:', error.response?.data)
  } else if (isNetworkError(error)) {
    // 网络错误
    console.error('网络连接失败')
  } else {
    // 其他错误
    console.error('未知错误:', error.message)
  }
}
```

## 并发请求

### Promise.all

```typescript
const [users, posts, comments] = await Promise.all([
  client.get('/users'),
  client.get('/posts'),
  client.get('/comments')
])
```

### 顺序请求

```typescript
// 获取用户
const userResponse = await client.get('/users/1')
const user = userResponse.data

// 使用用户 ID 获取文章
const postsResponse = await client.get(`/users/${user.id}/posts`)
const posts = postsResponse.data
```

## 请求取消

```typescript
const controller = new AbortController()

// 发起请求
const request = client.get('/users', {
  signal: controller.signal
})

// 5 秒后取消
setTimeout(() => {
  controller.abort()
}, 5000)

try {
  const response = await request
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('请求已取消')
  }
}
```

## 超时控制

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

## 响应类型

### JSON（默认）

```typescript
const response = await client.get('/users')
console.log(response.data) // JavaScript 对象
```

### 文本

```typescript
const response = await client.get('/file.txt', {
  responseType: 'text'
})
console.log(response.data) // 字符串
```

### Blob（文件）

```typescript
const response = await client.get('/image.png', {
  responseType: 'blob'
})
const blob = response.data
const url = URL.createObjectURL(blob)
```

### ArrayBuffer

```typescript
const response = await client.get('/data.bin', {
  responseType: 'arraybuffer'
})
const buffer = response.data
```

## 完整示例

### 用户管理

```typescript
import { createHttpClient } from '@ldesign/http-core'

// 定义类型
interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

interface CreateUserData {
  name: string
  email: string
}

// 创建客户端
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 添加认证拦截器
client.addRequestInterceptor((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// API 函数
export const userAPI = {
  // 获取用户列表
  async getUsers(page = 1, limit = 10): Promise<User[]> {
    const response = await client.get<User[]>('/users', {
      params: { page, limit }
    })
    return response.data
  },

  // 获取单个用户
  async getUser(id: number): Promise<User> {
    const response = await client.get<User>(`/users/${id}`)
    return response.data
  },

  // 创建用户
  async createUser(data: CreateUserData): Promise<User> {
    const response = await client.post<User>('/users', data)
    return response.data
  },

  // 更新用户
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await client.patch<User>(`/users/${id}`, data)
    return response.data
  },

  // 删除用户
  async deleteUser(id: number): Promise<void> {
    await client.delete(`/users/${id}`)
  }
}

// 使用
async function main() {
  try {
    // 获取用户列表
    const users = await userAPI.getUsers(1, 10)
    console.log('用户列表:', users)

    // 创建用户
    const newUser = await userAPI.createUser({
      name: 'John Doe',
      email: 'john@example.com'
    })
    console.log('新用户:', newUser)

    // 更新用户
    const updatedUser = await userAPI.updateUser(newUser.id, {
      name: 'Jane Doe'
    })
    console.log('更新后:', updatedUser)

    // 删除用户
    await userAPI.deleteUser(newUser.id)
    console.log('用户已删除')
  } catch (error) {
    console.error('操作失败:', error)
  }
}

main()
```

## 下一步

- [GET 请求](/examples/get) - GET 请求详细示例
- [POST 请求](/examples/post) - POST 请求详细示例
- [文件上传](/examples/upload) - 文件上传示例
- [Vue 示例](/examples/vue-use-http) - Vue 3 集成示例