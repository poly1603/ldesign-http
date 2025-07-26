# 错误处理

完善的错误处理是构建健壮应用的关键。@ldesign/http 提供了丰富的错误处理机制。

## ⚠️ 错误类型

### HttpError 接口

```typescript
interface HttpError extends Error {
  // 基础属性
  message: string
  name: string
  stack?: string
  
  // HTTP 特有属性
  response?: HttpResponse
  request?: RequestConfig
  
  // 错误类型标识
  isNetworkError: boolean
  isTimeoutError: boolean
  isCancelError: boolean
  isValidationError: boolean
  
  // 状态码快捷访问
  status?: number
  statusText?: string
}
```

### 错误分类

1. **网络错误** - 无法连接到服务器
2. **超时错误** - 请求超时
3. **取消错误** - 请求被取消
4. **HTTP错误** - 服务器返回错误状态码
5. **验证错误** - 请求配置错误

## 🔍 错误检测

### 基础错误检测

```typescript
try {
  const response = await client.get('/api/data')
  console.log(response.data)
} catch (error: any) {
  // 检查错误类型
  if (error.isNetworkError) {
    console.log('网络连接失败')
  } else if (error.isTimeoutError) {
    console.log('请求超时')
  } else if (error.isCancelError) {
    console.log('请求被取消')
  } else if (error.response) {
    console.log('服务器错误:', error.response.status)
  } else {
    console.log('未知错误:', error.message)
  }
}
```

### 详细错误信息

```typescript
try {
  await client.post('/api/users', userData)
} catch (error: HttpError) {
  console.log('错误详情:')
  console.log('- 消息:', error.message)
  console.log('- 类型:', error.name)
  console.log('- 状态码:', error.status)
  console.log('- 状态文本:', error.statusText)
  
  if (error.response) {
    console.log('- 响应数据:', error.response.data)
    console.log('- 响应头:', error.response.headers)
  }
  
  if (error.request) {
    console.log('- 请求URL:', error.request.url)
    console.log('- 请求方法:', error.request.method)
  }
}
```

## 🎯 按状态码处理

### 常见状态码处理

```typescript
async function handleApiCall() {
  try {
    const response = await client.get('/api/protected')
    return response.data
  } catch (error: HttpError) {
    switch (error.status) {
      case 400:
        throw new Error('请求参数错误')
      case 401:
        // 未授权，跳转登录
        localStorage.removeItem('token')
        window.location.href = '/login'
        break
      case 403:
        throw new Error('权限不足')
      case 404:
        throw new Error('资源不存在')
      case 422:
        // 验证错误，显示详细信息
        const validationErrors = error.response?.data?.errors
        throw new Error(`验证失败: ${JSON.stringify(validationErrors)}`)
      case 429:
        throw new Error('请求过于频繁，请稍后重试')
      case 500:
        throw new Error('服务器内部错误')
      case 502:
        throw new Error('网关错误')
      case 503:
        throw new Error('服务暂时不可用')
      default:
        throw new Error(`请求失败: ${error.message}`)
    }
  }
}
```

### 状态码分组处理

```typescript
function handleHttpError(error: HttpError) {
  const status = error.status || 0
  
  if (status >= 400 && status < 500) {
    // 客户端错误
    handleClientError(error)
  } else if (status >= 500) {
    // 服务器错误
    handleServerError(error)
  } else {
    // 其他错误
    handleOtherError(error)
  }
}

function handleClientError(error: HttpError) {
  switch (error.status) {
    case 401:
      // 处理认证错误
      break
    case 403:
      // 处理权限错误
      break
    case 404:
      // 处理资源不存在
      break
    default:
      // 其他客户端错误
      break
  }
}

function handleServerError(error: HttpError) {
  // 服务器错误通常需要重试或显示通用错误信息
  console.error('服务器错误:', error.status, error.message)
  showNotification('服务器暂时不可用，请稍后重试', 'error')
}
```

## 🛡️ 全局错误处理

### 响应拦截器

```typescript
import { createErrorHandlerInterceptor } from '@ldesign/http'

const globalErrorHandler = createErrorHandlerInterceptor((error: HttpError) => {
  // 全局错误处理逻辑
  if (error.isNetworkError) {
    showNotification('网络连接失败，请检查网络设置', 'error')
  } else if (error.isTimeoutError) {
    showNotification('请求超时，请稍后重试', 'warning')
  } else if (error.status === 401) {
    // 全局认证处理
    store.dispatch('auth/logout')
    router.push('/login')
  } else if (error.status >= 500) {
    showNotification('服务器错误，请稍后重试', 'error')
  }
})

client.addResponseInterceptor(globalErrorHandler)
```

### 自定义全局处理器

```typescript
class GlobalErrorHandler {
  private notificationService: NotificationService
  private authService: AuthService
  
  constructor(notificationService: NotificationService, authService: AuthService) {
    this.notificationService = notificationService
    this.authService = authService
  }
  
  handle(error: HttpError): void {
    // 记录错误
    this.logError(error)
    
    // 根据错误类型处理
    if (this.isAuthError(error)) {
      this.handleAuthError(error)
    } else if (this.isValidationError(error)) {
      this.handleValidationError(error)
    } else if (this.isNetworkError(error)) {
      this.handleNetworkError(error)
    } else {
      this.handleGenericError(error)
    }
  }
  
  private isAuthError(error: HttpError): boolean {
    return error.status === 401 || error.status === 403
  }
  
  private isValidationError(error: HttpError): boolean {
    return error.status === 422 || error.isValidationError
  }
  
  private isNetworkError(error: HttpError): boolean {
    return error.isNetworkError || error.isTimeoutError
  }
  
  private handleAuthError(error: HttpError): void {
    this.authService.logout()
    this.notificationService.error('登录已过期，请重新登录')
  }
  
  private handleValidationError(error: HttpError): void {
    const errors = error.response?.data?.errors || {}
    Object.entries(errors).forEach(([field, messages]) => {
      this.notificationService.warning(`${field}: ${messages}`)
    })
  }
  
  private handleNetworkError(error: HttpError): void {
    this.notificationService.error('网络连接失败，请检查网络设置')
  }
  
  private handleGenericError(error: HttpError): void {
    this.notificationService.error(error.message || '请求失败')
  }
  
  private logError(error: HttpError): void {
    console.error('HTTP Error:', {
      message: error.message,
      status: error.status,
      url: error.request?.url,
      method: error.request?.method,
      timestamp: new Date().toISOString()
    })
  }
}

// 使用全局错误处理器
const errorHandler = new GlobalErrorHandler(notificationService, authService)

client.addResponseInterceptor({
  onRejected: (error) => {
    errorHandler.handle(error)
    return Promise.reject(error)
  }
})
```

## 🔄 错误重试

### 自动重试

```typescript
import { createRetryPlugin } from '@ldesign/http'

const retryPlugin = createRetryPlugin({
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: HttpError) => {
    // 只重试网络错误和5xx错误
    return error.isNetworkError || 
           error.isTimeoutError || 
           (error.status >= 500 && error.status < 600)
  },
  onRetry: (error: HttpError, retryCount: number) => {
    console.log(`第${retryCount}次重试:`, error.message)
  }
})

retryPlugin.install(client)
```

### 手动重试

```typescript
async function requestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error: any) {
      lastError = error
      
      // 最后一次重试失败
      if (i === maxRetries) {
        break
      }
      
      // 检查是否应该重试
      if (!shouldRetry(error)) {
        break
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  
  throw lastError
}

function shouldRetry(error: HttpError): boolean {
  return error.isNetworkError || 
         error.isTimeoutError || 
         (error.status >= 500 && error.status < 600)
}

// 使用示例
try {
  const data = await requestWithRetry(() => client.get('/api/data'))
  console.log(data)
} catch (error) {
  console.error('重试后仍然失败:', error)
}
```

## 🎨 用户友好的错误提示

### 错误消息映射

```typescript
const errorMessages: Record<number, string> = {
  400: '请求参数有误，请检查输入',
  401: '登录已过期，请重新登录',
  403: '权限不足，无法访问该资源',
  404: '请求的资源不存在',
  422: '数据验证失败，请检查输入',
  429: '请求过于频繁，请稍后重试',
  500: '服务器内部错误，请稍后重试',
  502: '服务器网关错误，请稍后重试',
  503: '服务暂时不可用，请稍后重试'
}

function getUserFriendlyMessage(error: HttpError): string {
  if (error.isNetworkError) {
    return '网络连接失败，请检查网络设置'
  }
  
  if (error.isTimeoutError) {
    return '请求超时，请稍后重试'
  }
  
  if (error.isCancelError) {
    return '请求已取消'
  }
  
  if (error.status && errorMessages[error.status]) {
    return errorMessages[error.status]
  }
  
  return error.message || '请求失败，请稍后重试'
}
```

### 错误通知组件

```typescript
// Vue 3 错误通知组件
import { ref } from 'vue'

interface ErrorNotification {
  id: string
  message: string
  type: 'error' | 'warning' | 'info'
  duration?: number
}

export function useErrorNotification() {
  const notifications = ref<ErrorNotification[]>([])
  
  const showError = (error: HttpError) => {
    const message = getUserFriendlyMessage(error)
    const notification: ErrorNotification = {
      id: Date.now().toString(),
      message,
      type: 'error',
      duration: 5000
    }
    
    notifications.value.push(notification)
    
    // 自动移除
    setTimeout(() => {
      removeNotification(notification.id)
    }, notification.duration)
  }
  
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  return {
    notifications,
    showError,
    removeNotification
  }
}
```

## 🧪 错误处理测试

### 模拟错误

```typescript
// 测试错误处理
describe('错误处理', () => {
  it('应该正确处理网络错误', async () => {
    // 模拟网络错误
    const mockError = new Error('Network Error')
    mockError.isNetworkError = true
    
    jest.spyOn(client, 'get').mockRejectedValue(mockError)
    
    try {
      await client.get('/api/data')
    } catch (error) {
      expect(error.isNetworkError).toBe(true)
    }
  })
  
  it('应该正确处理HTTP错误', async () => {
    const mockError = {
      response: {
        status: 404,
        data: { message: 'Not Found' }
      }
    }
    
    jest.spyOn(client, 'get').mockRejectedValue(mockError)
    
    try {
      await client.get('/api/nonexistent')
    } catch (error) {
      expect(error.response.status).toBe(404)
    }
  })
})
```

## 📚 最佳实践

### 1. 分层错误处理

```typescript
// 应用层：用户友好的错误提示
// 服务层：业务逻辑错误处理
// 网络层：HTTP错误处理

class UserService {
  async getUser(id: string): Promise<User> {
    try {
      const response = await client.get(`/users/${id}`)
      return response.data
    } catch (error: HttpError) {
      // 服务层错误处理
      if (error.status === 404) {
        throw new Error('用户不存在')
      }
      throw error // 其他错误向上传递
    }
  }
}
```

### 2. 错误边界

```typescript
// React 错误边界示例
class HttpErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    if (error instanceof HttpError) {
      // 处理HTTP错误
      this.handleHttpError(error)
    }
  }
  
  handleHttpError(error: HttpError) {
    // 记录错误
    console.error('HTTP Error caught by boundary:', error)
    
    // 显示错误页面或通知
    this.setState({ hasError: true, error })
  }
}
```

### 3. 错误恢复

```typescript
// 提供错误恢复机制
function createRecoverableRequest<T>(requestFn: () => Promise<T>) {
  return {
    async execute(): Promise<T> {
      try {
        return await requestFn()
      } catch (error: HttpError) {
        // 提供恢复选项
        if (error.isNetworkError) {
          throw new RecoverableError('网络错误', () => this.execute())
        }
        throw error
      }
    }
  }
}

class RecoverableError extends Error {
  constructor(message: string, public recover: () => Promise<any>) {
    super(message)
  }
}
```

## 📚 下一步

了解错误处理后，你可以继续学习：

- [请求取消](/guide/cancellation) - 请求取消机制
- [进度监控](/guide/progress) - 进度监控功能
- [插件系统](/plugins/) - 扩展功能
- [Vue 集成](/vue/) - 在 Vue 中使用
