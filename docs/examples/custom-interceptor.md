# 自定义拦截器示例

自定义拦截器的完整示例。

## 请求拦截器

```typescript
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({ baseURL: '/api' })

// 添加认证令牌
client.addRequestInterceptor((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// 添加请求 ID
client.addRequestInterceptor((config) => {
  config.headers['X-Request-ID'] = crypto.randomUUID()
  return config
})

// 添加时间戳
client.addRequestInterceptor((config) => {
  config.headers['X-Timestamp'] = Date.now().toString()
  return config
})
```

## 响应拦截器

```typescript
// 处理错误
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 数据转换
client.addResponseInterceptor((response) => {
  if (response.data.code !== 0) {
    throw new Error(response.data.message)
  }
  response.data = response.data.data
  return response
})
```

## 下一步

- [缓存策略](/examples/cache-strategies) - 缓存示例
- [拦截器指南](/guide/interceptors) - 拦截器文档