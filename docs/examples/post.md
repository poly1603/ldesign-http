# POST 请求示例

POST 请求的完整示例。

## 基础 POST 请求

```typescript
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
```

## 类型安全

```typescript
interface CreateUserDto {
  name: string
  email: string
}

interface User {
  id: number
  name: string
  email: string
}

const response = await client.post<User, CreateUserDto>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
```

## FormData

```typescript
const formData = new FormData()
formData.append('name', 'John')
formData.append('email', 'john@example.com')

await client.post('/users', formData)
```

## 下一步

- [GET 请求](/examples/get) - GET 示例
- [文件上传](/examples/upload) - 上传示例