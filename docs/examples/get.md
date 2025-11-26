# GET 请求示例

GET 请求的完整示例。

## 基础 GET 请求

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  baseURL: 'https://api.example.com'
})

const response = await client.get('/users')
console.log(response.data)
```

## 带查询参数

```typescript
const response = await client.get('/users', {
  params: {
    page: 1,
    limit: 10,
    sort: 'name',
    order: 'asc'
  }
})
```

## 类型安全

```typescript
interface User {
  id: number
  name: string
  email: string
}

const response = await client.get<User[]>('/users')
const users: User[] = response.data
```

## 带缓存

```typescript
const response = await client.get('/users', {
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5 分钟
  }
})
```

## 下一步

- [POST 请求](/examples/post) - POST 示例
- [基本用法](/examples/basic) - 更多示例