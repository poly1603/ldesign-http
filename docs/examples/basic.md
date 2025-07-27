# 基础示例

这里提供了 @ldesign/http 的基础使用示例，帮助你快速上手。

## 🚀 快速开始

### 创建客户端

```typescript
import { createHttpClient } from '@ldesign/http'

// 基础配置
const client = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### 发送第一个请求

```typescript
// GET 请求
async function getUsers() {
  try {
    const response = await client.get('/users')
    console.log('用户列表:', response.data)
    return response.data
  }
 catch (error) {
    console.error('获取用户失败:', error.message)
    throw error
  }
}

// 调用函数
getUsers()
```

## 📡 HTTP 方法示例

### GET 请求

```typescript
// 1. 简单 GET 请求
const users = await client.get('/users')

// 2. 带查询参数
const posts = await client.get('/posts', {
  params: {
    userId: 1,
    _limit: 5
  }
})
// 实际请求: /posts?userId=1&_limit=5

// 3. 带自定义头部
const data = await client.get('/protected', {
  headers: {
    Authorization: 'Bearer your-token'
  }
})

// 4. 类型安全的请求
interface User {
  id: number
  name: string
  email: string
}

const response = await client.get<User[]>('/users')
// response.data 的类型为 User[]
```

### POST 请求

```typescript
// 1. 创建新用户
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
  username: 'johndoe'
})

// 2. 发送表单数据
const formData = new FormData()
formData.append('title', 'My Post')
formData.append('content', 'Post content here')

const post = await client.post('/posts', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

// 3. 发送 JSON 数据
const article = await client.post('/articles', {
  title: 'New Article',
  content: 'Article content...',
  tags: ['javascript', 'vue', 'http'],
  published: true
})
```

### PUT 请求

```typescript
// 完整更新用户
const updatedUser = await client.put('/users/1', {
  id: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  username: 'janedoe'
})
```

### PATCH 请求

```typescript
// 部分更新用户
const partialUpdate = await client.patch('/users/1', {
  email: 'newemail@example.com'
})
```

### DELETE 请求

```typescript
// 删除用户
await client.delete('/users/1')

// 带确认参数的删除
await client.delete('/users/1', {
  params: {
    confirm: true
  }
})
```

## 🔧 配置示例

### 请求配置

```typescript
// 超时配置
const response = await client.get('/slow-endpoint', {
  timeout: 30000 // 30秒超时
})

// 响应类型配置
const blob = await client.get('/download/file.pdf', {
  responseType: 'blob'
})

// 自定义验证状态码
const response = await client.get('/api/data', {
  validateStatus: status => status < 500 // 只有5xx才算错误
})
```

### 全局配置

```typescript
// 创建带默认配置的客户端
const apiClient = createHttpClient({
  baseURL: 'https://api.example.com/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'MyApp/1.0'
  }
})

// 运行时更新默认配置
apiClient.setDefaults({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`
  }
})
```

## ⚠️ 错误处理示例

### 基础错误处理

```typescript
async function fetchUserData(userId: number) {
  try {
    const response = await client.get(`/users/${userId}`)
    return response.data
  }
 catch (error: any) {
    // 检查错误类型
    if (error.response) {
      // 服务器响应了错误状态码
      console.log('错误状态:', error.response.status)
      console.log('错误数据:', error.response.data)
    }
 else if (error.isNetworkError) {
      // 网络错误
      console.log('网络连接失败')
    }
 else if (error.isTimeoutError) {
      // 超时错误
      console.log('请求超时')
    }
 else {
      // 其他错误
      console.log('未知错误:', error.message)
    }

    throw error
  }
}
```

### 详细错误处理

```typescript
async function robustApiCall() {
  try {
    const response = await client.get('/api/data')
    return response.data
  }
 catch (error: any) {
    // 根据状态码处理
    switch (error.response?.status) {
      case 400:
        throw new Error('请求参数错误')
      case 401:
        // 重定向到登录页
        window.location.href = '/login'
        break
      case 403:
        throw new Error('权限不足')
      case 404:
        throw new Error('资源不存在')
      case 429:
        throw new Error('请求过于频繁，请稍后重试')
      case 500:
        throw new Error('服务器内部错误')
      default:
        if (error.isNetworkError) {
          throw new Error('网络连接失败，请检查网络设置')
        }
 else if (error.isTimeoutError) {
          throw new Error('请求超时，请稍后重试')
        }
 else {
          throw new Error('请求失败，请稍后重试')
        }
    }
  }
}
```

## 🔄 并发请求示例

### Promise.all

```typescript
// 并发获取多个资源
async function fetchDashboardData() {
  try {
    const [users, posts, comments] = await Promise.all([
      client.get('/users'),
      client.get('/posts'),
      client.get('/comments')
    ])

    return {
      users: users.data,
      posts: posts.data,
      comments: comments.data
    }
  }
 catch (error) {
    console.error('获取仪表板数据失败:', error)
    throw error
  }
}
```

### Promise.allSettled

```typescript
// 即使部分请求失败也继续执行
async function fetchOptionalData() {
  const results = await Promise.allSettled([
    client.get('/users'),
    client.get('/posts'),
    client.get('/analytics'), // 这个可能失败
    client.get('/notifications')
  ])

  const data: any = {}

  results.forEach((result, index) => {
    const keys = ['users', 'posts', 'analytics', 'notifications']

    if (result.status === 'fulfilled') {
      data[keys[index]] = result.value.data
    }
 else {
      console.warn(`获取 ${keys[index]} 失败:`, result.reason.message)
      data[keys[index]] = null
    }
  })

  return data
}
```

## 📝 数据处理示例

### JSON 数据

```typescript
// 发送复杂的 JSON 数据
const complexData = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    preferences: {
      theme: 'dark',
      language: 'zh-CN',
      notifications: {
        email: true,
        push: false
      }
    }
  },
  metadata: {
    source: 'web',
    timestamp: Date.now()
  }
}

const response = await client.post('/api/user-data', complexData)
```

### FormData

```typescript
// 文件上传
async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('description', '用户头像')
  formData.append('category', 'avatar')

  const response = await client.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}

// 使用示例
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
const file = fileInput.files?.[0]

if (file) {
  const result = await uploadFile(file)
  console.log('上传成功:', result)
}
```

### URL 编码数据

```typescript
// 发送表单编码数据
const params = new URLSearchParams()
params.append('username', 'john')
params.append('password', 'secret123')
params.append('remember', 'true')

const response = await client.post('/login', params, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})
```

## 🎯 实际应用示例

### 用户认证

```typescript
class AuthService {
  private client = createHttpClient({
    baseURL: 'https://api.example.com'
  })

  async login(username: string, password: string) {
    try {
      const response = await this.client.post('/auth/login', {
        username,
        password
      })

      // 保存token
      localStorage.setItem('token', response.data.token)

      // 设置默认认证头
      this.client.setDefaults({
        headers: {
          Authorization: `Bearer ${response.data.token}`
        }
      })

      return response.data.user
    }
 catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('用户名或密码错误')
      }
      throw error
    }
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    }
 finally {
      // 清除本地数据
      localStorage.removeItem('token')

      // 移除认证头
      this.client.setDefaults({
        headers: {
          Authorization: undefined
        }
      })
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me')
    return response.data
  }
}

// 使用示例
const authService = new AuthService()

// 登录
try {
  const user = await authService.login('john', 'password123')
  console.log('登录成功:', user)
}
 catch (error) {
  console.error('登录失败:', error.message)
}
```

### 数据管理

```typescript
class UserManager {
  private client = createHttpClient({
    baseURL: 'https://api.example.com'
  })

  async getUsers(page = 1, limit = 10) {
    const response = await this.client.get('/users', {
      params: { page, limit }
    })
    return response.data
  }

  async getUser(id: number) {
    const response = await this.client.get(`/users/${id}`)
    return response.data
  }

  async createUser(userData: any) {
    const response = await this.client.post('/users', userData)
    return response.data
  }

  async updateUser(id: number, userData: any) {
    const response = await this.client.put(`/users/${id}`, userData)
    return response.data
  }

  async deleteUser(id: number) {
    await this.client.delete(`/users/${id}`)
  }

  async searchUsers(query: string) {
    const response = await this.client.get('/users/search', {
      params: { q: query }
    })
    return response.data
  }
}

// 使用示例
const userManager = new UserManager()

// 获取用户列表
const users = await userManager.getUsers(1, 20)

// 创建新用户
const newUser = await userManager.createUser({
  name: 'Alice Smith',
  email: 'alice@example.com'
})

// 搜索用户
const searchResults = await userManager.searchUsers('john')
```

## 🎯 交互式演示

你可以在下面的工具中直接测试这些基础示例：

<ApiTester />

## 📚 下一步

掌握基础示例后，你可以继续学习：

- [真实API示例](/examples/real-api) - 使用真实API的示例
- [API测试工具](/examples/api-tester) - 功能完整的测试工具
- [完整项目示例](/examples/complete-demo) - 完整的应用示例
- [Vue集成](/vue/) - 在Vue项目中使用
- [高级功能](/guide/interceptors) - 拦截器和插件
