# 拦截器

拦截器是 @ldesign/http 的强大功能，允许你在请求发送前和响应返回后执行自定义逻辑。

## 🛡️ 拦截器概览

### 拦截器类型

- **请求拦截器** - 在请求发送前执行
- **响应拦截器** - 在响应返回后执行

### 常见用途

- 添加认证头
- 记录请求日志
- 统一错误处理
- 数据转换
- 加载状态管理

## 📤 请求拦截器

### 基础用法

```typescript
// 添加请求拦截器
const interceptorId = client.addRequestInterceptor({
  onFulfilled: (config) => {
    // 在请求发送前执行
    console.log('发送请求:', config.url)

    // 添加时间戳
    config.headers = {
      ...config.headers,
      'X-Timestamp': Date.now().toString()
    }

    return config
  },
  onRejected: (error) => {
    // 请求配置错误时执行
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
})
```

### 认证拦截器

```typescript
// 自动添加认证头
client.addRequestInterceptor({
  onFulfilled: (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      }
    }
    return config
  }
})
```

### 动态配置

```typescript
// 根据请求URL动态配置
client.addRequestInterceptor({
  onFulfilled: (config) => {
    // 为特定API添加特殊头部
    if (config.url?.includes('/admin/')) {
      config.headers = {
        ...config.headers,
        'X-Admin-Request': 'true'
      }
    }

    // 为上传请求设置超时
    if (config.url?.includes('/upload')) {
      config.timeout = 60000 // 60秒
    }

    return config
  }
})
```

## 📥 响应拦截器

### 基础用法

```typescript
// 添加响应拦截器
const interceptorId = client.addResponseInterceptor({
  onFulfilled: (response) => {
    // 响应成功时执行
    console.log('收到响应:', response.status)

    // 统一处理响应数据格式
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '请求失败')
      }
      // 返回实际数据
      response.data = response.data.data
    }

    return response
  },
  onRejected: (error) => {
    // 响应错误时执行
    console.error('响应错误:', error.message)

    // 统一错误处理
    if (error.response?.status === 401) {
      // 清除token并跳转登录
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
})
```

### 数据转换

```typescript
// 响应数据转换
client.addResponseInterceptor({
  onFulfilled: (response) => {
    // 转换日期字符串为Date对象
    if (response.data && typeof response.data === 'object') {
      response.data = transformDates(response.data)
    }
    return response
  }
})

function transformDates(obj: any): any {
  if (obj === null || typeof obj !== 'object')
return obj

  if (Array.isArray(obj)) {
    return obj.map(transformDates)
  }

  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      result[key] = new Date(value)
    }
 else if (typeof value === 'object') {
      result[key] = transformDates(value)
    }
 else {
      result[key] = value
    }
  }
  return result
}
```

## 🔧 内置拦截器

### 认证拦截器

```typescript
import { createAuthInterceptor } from '@ldesign/http'

const authInterceptor = createAuthInterceptor({
  getToken: () => localStorage.getItem('token') || '',
  tokenType: 'Bearer',
  headerName: 'Authorization',
  refreshToken: async () => {
    // 刷新token逻辑
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    })
    const data = await response.json()
    localStorage.setItem('token', data.token)
    return data.token
  }
})

client.addRequestInterceptor(authInterceptor)
```

### 日志拦截器

```typescript
import { createLogInterceptor } from '@ldesign/http'

const logInterceptors = createLogInterceptor({
  logRequests: true,
  logResponses: true,
  logErrors: true,
  logLevel: 'info',
  formatter: (type, data) => {
    return `[${type.toUpperCase()}] ${JSON.stringify(data, null, 2)}`
  }
})

client.addRequestInterceptor(logInterceptors.request)
client.addResponseInterceptor(logInterceptors.response)
```

### 错误处理拦截器

```typescript
import { createErrorHandlerInterceptor } from '@ldesign/http'

const errorHandler = createErrorHandlerInterceptor((error) => {
  // 统一错误处理逻辑
  if (error.response?.status === 401) {
    // 未授权
    store.dispatch('auth/logout')
    router.push('/login')
  }
 else if (error.response?.status === 403) {
    // 权限不足
    showMessage('权限不足', 'error')
  }
 else if (error.response?.status >= 500) {
    // 服务器错误
    showMessage('服务器错误，请稍后重试', 'error')
  }
 else if (error.isNetworkError) {
    // 网络错误
    showMessage('网络连接失败', 'error')
  }
})

client.addResponseInterceptor(errorHandler)
```

## 🔄 拦截器管理

### 移除拦截器

```typescript
// 添加拦截器时会返回ID
const requestInterceptorId = client.addRequestInterceptor({
  onFulfilled: config => config
})

const responseInterceptorId = client.addResponseInterceptor({
  onFulfilled: response => response
})

// 移除特定拦截器
client.removeInterceptor('request', requestInterceptorId)
client.removeInterceptor('response', responseInterceptorId)
```

### 清空所有拦截器

```typescript
// 清空所有请求拦截器
client.clearRequestInterceptors()

// 清空所有响应拦截器
client.clearResponseInterceptors()

// 清空所有拦截器
client.clearAllInterceptors()
```

### 拦截器执行顺序

```typescript
// 请求拦截器：后添加的先执行
client.addRequestInterceptor({ /* 拦截器1 */ }) // 第二个执行
client.addRequestInterceptor({ /* 拦截器2 */ }) // 第一个执行

// 响应拦截器：先添加的先执行
client.addResponseInterceptor({ /* 拦截器1 */ }) // 第一个执行
client.addResponseInterceptor({ /* 拦截器2 */ }) // 第二个执行
```

## 🎯 高级用法

### 条件拦截器

```typescript
// 只对特定请求生效的拦截器
client.addRequestInterceptor({
  onFulfilled: (config) => {
    // 只对API请求添加认证
    if (config.url?.startsWith('/api/')) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${getToken()}`
      }
    }
    return config
  }
})
```

### 异步拦截器

```typescript
// 异步请求拦截器
client.addRequestInterceptor({
  onFulfilled: async (config) => {
    // 异步获取token
    const token = await getTokenAsync()
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    }
    return config
  }
})

// 异步响应拦截器
client.addResponseInterceptor({
  onFulfilled: async (response) => {
    // 异步处理响应数据
    response.data = await processDataAsync(response.data)
    return response
  }
})
```

### 拦截器链

```typescript
// 创建拦截器链
const interceptorChain = [
  // 1. 添加认证
  {
    onFulfilled: (config) => {
      config.headers = { ...config.headers, Authorization: getAuth() }
      return config
    }
  },
  // 2. 添加时间戳
  {
    onFulfilled: (config) => {
      config.headers = { ...config.headers, 'X-Timestamp': Date.now() }
      return config
    }
  },
  // 3. 记录日志
  {
    onFulfilled: (config) => {
      console.log('Request:', config.method, config.url)
      return config
    }
  }
]

// 批量添加
interceptorChain.forEach((interceptor) => {
  client.addRequestInterceptor(interceptor)
})
```

## 🔍 调试拦截器

### 拦截器调试

```typescript
// 调试拦截器
client.addRequestInterceptor({
  onFulfilled: (config) => {
    console.group('🚀 Request Interceptor')
    console.log('URL:', config.url)
    console.log('Method:', config.method)
    console.log('Headers:', config.headers)
    console.log('Data:', config.data)
    console.groupEnd()
    return config
  }
})

client.addResponseInterceptor({
  onFulfilled: (response) => {
    console.group('📥 Response Interceptor')
    console.log('Status:', response.status)
    console.log('Headers:', response.headers)
    console.log('Data:', response.data)
    console.groupEnd()
    return response
  },
  onRejected: (error) => {
    console.group('❌ Error Interceptor')
    console.log('Message:', error.message)
    console.log('Status:', error.response?.status)
    console.log('Data:', error.response?.data)
    console.groupEnd()
    return Promise.reject(error)
  }
})
```

## 📚 最佳实践

### 1. 拦截器职责单一

```typescript
// ✅ 好的做法：每个拦截器只负责一件事
client.addRequestInterceptor(createAuthInterceptor())
client.addRequestInterceptor(createTimestampInterceptor())
client.addRequestInterceptor(createLoggingInterceptor())

// ❌ 避免：一个拦截器做太多事情
client.addRequestInterceptor({
  onFulfilled: (config) => {
    // 认证、日志、时间戳都在一个拦截器里
    // 难以维护和测试
  }
})
```

### 2. 错误处理

```typescript
// ✅ 在拦截器中处理错误
client.addRequestInterceptor({
  onFulfilled: config => config,
  onRejected: (error) => {
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
})
```

### 3. 性能考虑

```typescript
// ✅ 避免在拦截器中执行耗时操作
client.addRequestInterceptor({
  onFulfilled: (config) => {
    // 快速操作
    config.headers['X-Request-ID'] = generateQuickId()
    return config
  }
})

// ❌ 避免耗时操作
client.addRequestInterceptor({
  onFulfilled: async (config) => {
    // 避免复杂的异步操作
    await heavyAsyncOperation() // 这会影响所有请求性能
    return config
  }
})
```

## 📚 下一步

了解拦截器后，你可以继续学习：

- [错误处理](/guide/error-handling) - 错误处理策略
- [请求取消](/guide/cancellation) - 请求取消机制
- [插件系统](/plugins/) - 扩展功能
- [Vue 集成](/vue/) - 在 Vue 中使用
