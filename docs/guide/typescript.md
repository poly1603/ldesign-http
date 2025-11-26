# TypeScript 类型系统

@ldesign/http 提供完整的 TypeScript 支持，确保类型安全。

## 基础类型

### 请求类型

```typescript
interface User {
  id: number
  name: string
  email: string
}

// GET 请求类型
const response = await client.get<User[]>('/users')
// response.data 类型为 User[]

// POST 请求类型
interface CreateUserDto {
  name: string
  email: string
}

const newUser = await client.post<User, CreateUserDto>('/users', {
  name: 'John',
  email: 'john@example.com'
})
// newUser.data 类型为 User
```

### 响应类型

```typescript
import { Response } from '@ldesign/http-core'

function handleResponse<T>(response: Response<T>) {
  console.log(response.data) // 类型为 T
  console.log(response.status) // 类型为 number
  console.log(response.headers) // 类型为 Record<string, string>
}
```

### 配置类型

```typescript
import { HttpConfig, RequestConfig } from '@ldesign/http-core'

const config: HttpConfig = {
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
}

const requestConfig: RequestConfig = {
  url: '/users',
  method: 'GET',
  params: { page: 1 }
}
```

## 泛型类型

### 类型推断

```typescript
// 自动推断返回类型
const response = await client.get<User[]>('/users')
const users = response.data // 类型自动推断为 User[]

// 泛型函数
async function fetchResource<T>(url: string): Promise<T> {
  const response = await client.get<T>(url)
  return response.data
}

const users = await fetchResource<User[]>('/users')
```

### 类型约束

```typescript
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

async function apiRequest<T>(url: string): Promise<T> {
  const response = await client.get<ApiResponse<T>>(url)
  
  if (response.data.code !== 0) {
    throw new Error(response.data.message)
  }
  
  return response.data.data
}
```

## 类型守卫

```typescript
import { 
  isHttpError, 
  isNetworkError,
  HttpError 
} from '@ldesign/http-core'

function handleError(error: unknown) {
  if (isHttpError(error)) {
    // error 类型为 HttpError
    console.log(error.response?.status)
  } else if (isNetworkError(error)) {
    console.log('网络错误')
  }
}
```

## 工具类型

```typescript
import { 
  DeepPartial,
  DeepReadonly,
  RequiredKeys,
  OptionalKeys
} from '@ldesign/http-core'

// 深度部分类型
type PartialUser = DeepPartial<User>

// 深度只读类型
type ReadonlyUser = DeepReadonly<User>

// 必需键
type UserRequiredKeys = RequiredKeys<User> // 'id' | 'name' | 'email'

// 可选键
type UserOptionalKeys = OptionalKeys<User> // never
```

## 类型安全的API

```typescript
// 定义API类型
interface UserAPI {
  getUsers: () => Promise<User[]>
  getUser: (id: number) => Promise<User>
  createUser: (data: CreateUserDto) => Promise<User>
  updateUser: (id: number, data: Partial<User>) => Promise<User>
  deleteUser: (id: number) => Promise<void>
}

// 实现API
const userAPI: UserAPI = {
  getUsers: () => 
    client.get<User[]>('/users').then(r => r.data),
  
  getUser: (id) => 
    client.get<User>(`/users/${id}`).then(r => r.data),
  
  createUser: (data) => 
    client.post<User>('/users', data).then(r => r.data),
  
  updateUser: (id, data) => 
    client.patch<User>(`/users/${id}`, data).then(r => r.data),
  
  deleteUser: (id) => 
    client.delete(`/users/${id}`).then(() => undefined)
}
```

## 下一步

- [类型工具](/guide/type-utilities) - 类型工具函数
- [API 参考](/api/core) - 完整类型定义