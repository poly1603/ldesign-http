# 请求取消

请求取消是现代Web应用的重要功能，可以避免不必要的网络请求和资源浪费。

## 🚫 取消机制概览

### 使用场景

- 用户导航到其他页面
- 组件卸载时取消进行中的请求
- 用户取消长时间运行的操作
- 防止过时的请求覆盖新的结果
- 避免内存泄漏

### 取消方式

- **CancelToken** - 手动取消令牌
- **AbortController** - 标准Web API
- **超时取消** - 自动超时取消
- **组件卸载取消** - Vue组件自动取消

## 🎯 CancelToken 使用

### 基础用法

```typescript
// 创建取消令牌
const cancelToken = client.createCancelToken()

// 发送可取消的请求
const requestPromise = client.get('/api/data', {
  cancelToken
})

// 取消请求
cancelToken.cancel('用户取消了请求')

try {
  const response = await requestPromise
  console.log(response.data)
} catch (error: any) {
  if (error.isCancelError) {
    console.log('请求被取消:', error.message)
  } else {
    console.error('请求失败:', error)
  }
}
```

### 延迟取消

```typescript
const cancelToken = client.createCancelToken()

// 5秒后自动取消
setTimeout(() => {
  cancelToken.cancel('请求超时')
}, 5000)

const response = await client.get('/slow-endpoint', {
  cancelToken
})
```

### 条件取消

```typescript
const cancelToken = client.createCancelToken()

// 根据条件取消
const checkAndCancel = () => {
  if (shouldCancelRequest()) {
    cancelToken.cancel('条件满足，取消请求')
  }
}

// 定期检查
const interval = setInterval(checkAndCancel, 1000)

try {
  const response = await client.get('/api/data', { cancelToken })
  clearInterval(interval)
} catch (error: any) {
  clearInterval(interval)
  if (error.isCancelError) {
    console.log('请求被取消')
  }
}
```

## 🎮 AbortController 支持

### 使用 AbortController

```typescript
// 创建 AbortController
const controller = new AbortController()

// 发送请求
const requestPromise = client.get('/api/data', {
  signal: controller.signal
})

// 取消请求
controller.abort()

try {
  const response = await requestPromise
} catch (error: any) {
  if (error.name === 'AbortError') {
    console.log('请求被中止')
  }
}
```

### 与 CancelToken 结合

```typescript
const controller = new AbortController()
const cancelToken = client.createCancelToken()

// 监听 AbortController
controller.signal.addEventListener('abort', () => {
  cancelToken.cancel('AbortController 中止')
})

const response = await client.get('/api/data', {
  cancelToken,
  signal: controller.signal
})
```

## ⏰ 超时取消

### 请求超时

```typescript
// 全局超时设置
const client = createHttpClient({
  timeout: 10000 // 10秒超时
})

// 单次请求超时
try {
  const response = await client.get('/slow-endpoint', {
    timeout: 5000 // 5秒超时
  })
} catch (error: any) {
  if (error.isTimeoutError) {
    console.log('请求超时')
  }
}
```

### 自定义超时处理

```typescript
function createTimeoutCancelToken(timeout: number) {
  const cancelToken = client.createCancelToken()
  
  const timeoutId = setTimeout(() => {
    cancelToken.cancel(`请求超时 (${timeout}ms)`)
  }, timeout)
  
  // 清理定时器
  const originalCancel = cancelToken.cancel
  cancelToken.cancel = (reason?: string) => {
    clearTimeout(timeoutId)
    originalCancel.call(cancelToken, reason)
  }
  
  return cancelToken
}

// 使用自定义超时
const cancelToken = createTimeoutCancelToken(8000)
const response = await client.get('/api/data', { cancelToken })
```

## 🔄 批量取消

### 取消多个请求

```typescript
class RequestManager {
  private cancelTokens: Map<string, CancelToken> = new Map()
  
  async request<T>(id: string, config: RequestConfig): Promise<HttpResponse<T>> {
    // 取消之前的同类请求
    this.cancel(id)
    
    // 创建新的取消令牌
    const cancelToken = client.createCancelToken()
    this.cancelTokens.set(id, cancelToken)
    
    try {
      const response = await client.request<T>({
        ...config,
        cancelToken
      })
      
      // 请求成功，移除令牌
      this.cancelTokens.delete(id)
      return response
    } catch (error) {
      this.cancelTokens.delete(id)
      throw error
    }
  }
  
  cancel(id: string, reason?: string): void {
    const cancelToken = this.cancelTokens.get(id)
    if (cancelToken) {
      cancelToken.cancel(reason || `取消请求: ${id}`)
      this.cancelTokens.delete(id)
    }
  }
  
  cancelAll(reason?: string): void {
    this.cancelTokens.forEach((cancelToken, id) => {
      cancelToken.cancel(reason || '批量取消所有请求')
    })
    this.cancelTokens.clear()
  }
}

// 使用示例
const requestManager = new RequestManager()

// 发送请求
requestManager.request('user-list', { url: '/users' })
requestManager.request('user-detail', { url: '/users/1' })

// 取消特定请求
requestManager.cancel('user-list')

// 取消所有请求
requestManager.cancelAll('页面卸载')
```

### 分组取消

```typescript
class GroupedRequestManager {
  private groups: Map<string, Set<CancelToken>> = new Map()
  
  addToGroup(groupId: string, cancelToken: CancelToken): void {
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, new Set())
    }
    this.groups.get(groupId)!.add(cancelToken)
  }
  
  cancelGroup(groupId: string, reason?: string): void {
    const group = this.groups.get(groupId)
    if (group) {
      group.forEach(cancelToken => {
        cancelToken.cancel(reason || `取消分组: ${groupId}`)
      })
      this.groups.delete(groupId)
    }
  }
  
  async requestInGroup<T>(
    groupId: string, 
    config: RequestConfig
  ): Promise<HttpResponse<T>> {
    const cancelToken = client.createCancelToken()
    this.addToGroup(groupId, cancelToken)
    
    try {
      return await client.request<T>({
        ...config,
        cancelToken
      })
    } finally {
      // 请求完成后从分组中移除
      const group = this.groups.get(groupId)
      if (group) {
        group.delete(cancelToken)
        if (group.size === 0) {
          this.groups.delete(groupId)
        }
      }
    }
  }
}

// 使用示例
const groupManager = new GroupedRequestManager()

// 将请求添加到分组
groupManager.requestInGroup('dashboard', { url: '/dashboard/stats' })
groupManager.requestInGroup('dashboard', { url: '/dashboard/charts' })
groupManager.requestInGroup('profile', { url: '/user/profile' })

// 取消整个分组
groupManager.cancelGroup('dashboard', '切换页面')
```

## 🎨 Vue 集成

### 组件卸载自动取消

```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error.message }}</div>
    <div v-else>{{ data }}</div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useRequest } from '@ldesign/http'

// useRequest 会自动在组件卸载时取消请求
const { data, loading, error, cancel } = useRequest('/api/data')

// 手动取消
const handleCancel = () => {
  cancel('用户手动取消')
}

// 组件卸载时会自动调用 cancel()
onUnmounted(() => {
  console.log('组件卸载，请求已自动取消')
})
</script>
```

### 手动控制取消

```vue
<template>
  <div>
    <button @click="fetchData" :disabled="loading">
      {{ loading ? '加载中...' : '获取数据' }}
    </button>
    <button @click="cancelRequest" :disabled="!loading">
      取消请求
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRequest } from '@ldesign/http'

const {
  data,
  loading,
  error,
  execute: fetchData,
  cancel: cancelRequest
} = useRequest('/api/data', {
  immediate: false // 不立即执行
})
</script>
```

### 路由切换取消

```typescript
// router/index.ts
import { createRouter } from 'vue-router'

const router = createRouter({
  // ... 路由配置
})

// 全局请求管理器
const globalRequestManager = new RequestManager()

// 路由切换时取消所有请求
router.beforeEach((to, from, next) => {
  globalRequestManager.cancelAll('路由切换')
  next()
})

export { router, globalRequestManager }
```

## 🔍 取消状态检测

### 检测取消状态

```typescript
const cancelToken = client.createCancelToken()

// 检查是否已取消
if (cancelToken.isCancelled) {
  console.log('令牌已被取消')
}

// 监听取消事件
cancelToken.onCancel((reason) => {
  console.log('取消原因:', reason)
})

// 发送请求
try {
  const response = await client.get('/api/data', { cancelToken })
} catch (error: any) {
  if (error.isCancelError) {
    console.log('请求被取消:', error.message)
  }
}
```

### 取消回调

```typescript
const cancelToken = client.createCancelToken()

// 添加取消回调
cancelToken.onCancel((reason) => {
  console.log('请求被取消:', reason)
  // 清理资源
  cleanup()
})

// 多个回调
cancelToken.onCancel(() => console.log('回调1'))
cancelToken.onCancel(() => console.log('回调2'))

function cleanup() {
  // 清理逻辑
  console.log('清理资源')
}
```

## 🧪 测试取消功能

### 模拟取消

```typescript
describe('请求取消', () => {
  it('应该能够取消请求', async () => {
    const cancelToken = client.createCancelToken()
    
    // 立即取消
    cancelToken.cancel('测试取消')
    
    try {
      await client.get('/api/data', { cancelToken })
      fail('请求应该被取消')
    } catch (error: any) {
      expect(error.isCancelError).toBe(true)
      expect(error.message).toBe('测试取消')
    }
  })
  
  it('应该在组件卸载时取消请求', async () => {
    const { unmount } = mount(TestComponent)
    
    // 模拟组件卸载
    unmount()
    
    // 验证请求被取消
    expect(mockCancel).toHaveBeenCalled()
  })
})
```

## 📚 最佳实践

### 1. 及时清理

```typescript
// ✅ 好的做法：及时清理取消令牌
class ApiService {
  private cancelTokens: Set<CancelToken> = new Set()
  
  async request<T>(config: RequestConfig): Promise<T> {
    const cancelToken = client.createCancelToken()
    this.cancelTokens.add(cancelToken)
    
    try {
      const response = await client.request<T>({
        ...config,
        cancelToken
      })
      return response.data
    } finally {
      this.cancelTokens.delete(cancelToken)
    }
  }
  
  destroy(): void {
    this.cancelTokens.forEach(token => token.cancel('服务销毁'))
    this.cancelTokens.clear()
  }
}
```

### 2. 合理的取消粒度

```typescript
// ✅ 按功能模块分组取消
const userRequestManager = new GroupedRequestManager()
const orderRequestManager = new GroupedRequestManager()

// ❌ 避免过于细粒度的取消控制
// 每个小请求都单独管理会增加复杂性
```

### 3. 用户体验

```typescript
// ✅ 提供取消反馈
const handleCancel = () => {
  cancelToken.cancel('用户取消')
  showMessage('操作已取消', 'info')
}

// ✅ 防止重复请求
let currentRequest: Promise<any> | null = null

const fetchData = async () => {
  if (currentRequest) {
    // 取消之前的请求
    cancelPreviousRequest()
  }
  
  currentRequest = client.get('/api/data')
  try {
    const response = await currentRequest
    return response.data
  } finally {
    currentRequest = null
  }
}
```

## 📚 下一步

了解请求取消后，你可以继续学习：

- [进度监控](/guide/progress) - 进度监控功能
- [插件系统](/plugins/) - 扩展功能
- [Vue 集成](/vue/) - 在 Vue 中使用
- [性能优化](/guide/performance) - 性能优化技巧
