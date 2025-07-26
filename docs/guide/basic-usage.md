# 基本用法

本页面介绍 @ldesign/http 的基本使用方法，涵盖最常用的功能和场景。

## 🚀 创建客户端

### 基础创建

```typescript
import { createHttpClient } from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
})
```

### 带配置创建

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  }
})
```

## 📡 HTTP 方法

### GET 请求

```typescript
// 简单 GET 请求
const response = await client.get('/users')
console.log(response.data)

// 带查询参数
const response = await client.get('/users', {
  params: {
    page: 1,
    limit: 10,
    status: 'active'
  }
})

// 带请求头
const response = await client.get('/users', {
  headers: {
    'X-Custom-Header': 'value'
  }
})
```

### POST 请求

```typescript
// 创建用户
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
})

// 带自定义配置
const response = await client.post('/users', userData, {
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
})
```

### PUT 请求

```typescript
// 更新用户
const updatedUser = await client.put('/users/1', {
  name: 'Jane Doe',
  email: 'jane@example.com'
})
```

### DELETE 请求

```typescript
// 删除用户
await client.delete('/users/1')

// 带确认参数
await client.delete('/users/1', {
  params: {
    confirm: true
  }
})
```

### PATCH 请求

```typescript
// 部分更新
const response = await client.patch('/users/1', {
  email: 'newemail@example.com'
})
```

### HEAD 和 OPTIONS

```typescript
// 检查资源是否存在
const headResponse = await client.head('/users/1')
console.log(headResponse.status) // 200 表示存在

// 获取允许的方法
const optionsResponse = await client.options('/users')
console.log(optionsResponse.headers['allow'])
```

## 🔧 请求配置

### 查询参数

```typescript
// 方式1：通过 params 选项
const response = await client.get('/search', {
  params: {
    q: 'javascript',
    type: 'repositories',
    sort: 'stars'
  }
})
// 实际请求: /search?q=javascript&type=repositories&sort=stars

// 方式2：直接在 URL 中
const response = await client.get('/search?q=javascript&type=repositories')
```

### 请求头

```typescript
// 全局请求头（在创建客户端时设置）
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: {
    'User-Agent': 'MyApp/1.0',
    'Accept': 'application/json'
  }
})

// 单次请求头
const response = await client.get('/users', {
  headers: {
    'Authorization': 'Bearer token',
    'X-Request-ID': 'unique-id'
  }
})
```

### 超时设置

```typescript
// 全局超时
const client = createHttpClient({
  timeout: 10000 // 10秒
})

// 单次请求超时
const response = await client.get('/slow-endpoint', {
  timeout: 30000 // 30秒
})
```

## 📊 响应处理

### 响应结构

```typescript
const response = await client.get('/users/1')

console.log(response.data)       // 响应数据
console.log(response.status)     // 状态码 (200, 404, etc.)
console.log(response.statusText) // 状态文本 ('OK', 'Not Found', etc.)
console.log(response.headers)    // 响应头
console.log(response.config)     // 请求配置
```

### 类型安全

```typescript
interface User {
  id: number
  name: string
  email: string
}

// 指定响应类型
const response = await client.get<User>('/users/1')
// response.data 的类型为 User

const users = await client.get<User[]>('/users')
// users.data 的类型为 User[]
```

## ⚠️ 错误处理

### 基础错误处理

```typescript
try {
  const response = await client.get('/users/999')
  console.log(response.data)
} catch (error) {
  console.error('请求失败:', error.message)
}
```

### 详细错误处理

```typescript
try {
  const response = await client.get('/users/999')
} catch (error: any) {
  if (error.response) {
    // 服务器响应了错误状态码
    console.log('状态码:', error.response.status)
    console.log('错误数据:', error.response.data)
    console.log('响应头:', error.response.headers)
  } else if (error.isNetworkError) {
    // 网络错误
    console.log('网络连接失败')
  } else if (error.isTimeoutError) {
    // 超时错误
    console.log('请求超时')
  } else {
    // 其他错误
    console.log('未知错误:', error.message)
  }
}
```

### 错误类型判断

```typescript
import type { HttpError } from '@ldesign/http'

try {
  await client.get('/api/data')
} catch (error: HttpError) {
  // 检查错误类型
  if (error.isNetworkError) {
    // 处理网络错误
  } else if (error.isTimeoutError) {
    // 处理超时错误
  } else if (error.isCancelError) {
    // 处理取消错误
  } else if (error.response?.status === 401) {
    // 处理认证错误
  } else if (error.response?.status >= 500) {
    // 处理服务器错误
  }
}
```

## 🔄 并发请求

### Promise.all

```typescript
// 并发发送多个请求
const [users, posts, comments] = await Promise.all([
  client.get('/users'),
  client.get('/posts'),
  client.get('/comments')
])

console.log('用户数:', users.data.length)
console.log('文章数:', posts.data.length)
console.log('评论数:', comments.data.length)
```

### Promise.allSettled

```typescript
// 即使某些请求失败也继续执行
const results = await Promise.allSettled([
  client.get('/users'),
  client.get('/posts'),
  client.get('/invalid-endpoint') // 这个会失败
])

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`请求 ${index} 成功:`, result.value.data)
  } else {
    console.log(`请求 ${index} 失败:`, result.reason.message)
  }
})
```

## 📝 数据格式

### JSON 数据

```typescript
// 自动序列化 JSON
const response = await client.post('/users', {
  name: 'John',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
    language: 'zh-CN'
  }
})
```

### FormData

```typescript
// 文件上传
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('description', '头像图片')

const response = await client.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})
```

### URL 编码

```typescript
// application/x-www-form-urlencoded
const params = new URLSearchParams()
params.append('username', 'john')
params.append('password', 'secret')

const response = await client.post('/login', params, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})
```

## 🌐 基础URL处理

### 相对URL

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com/v1'
})

// 这些请求会自动拼接 baseURL
await client.get('/users')        // https://api.example.com/v1/users
await client.get('users')         // https://api.example.com/v1/users
await client.get('./users')       // https://api.example.com/v1/users
```

### 绝对URL

```typescript
// 绝对URL会忽略 baseURL
await client.get('https://other-api.com/data')
```

## 🔗 链式调用

```typescript
// 可以链式处理响应
const userData = await client
  .get('/users/1')
  .then(response => response.data)
  .then(user => ({
    ...user,
    displayName: `${user.firstName} ${user.lastName}`
  }))
```

## 📚 下一步

掌握基本用法后，你可以继续学习：

- [配置选项](/guide/configuration) - 详细的配置说明
- [适配器](/guide/adapters) - 不同适配器的使用
- [拦截器](/guide/interceptors) - 请求和响应拦截
- [Vue 集成](/vue/) - 在 Vue 项目中使用
