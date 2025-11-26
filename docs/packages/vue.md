# @ldesign/http-vue

Vue 3 专用适配器，提供深度集成的 Composition API、组件和指令。

## 安装

```bash
pnpm add @ldesign/http-vue
```

## 插件安装

### 基础安装

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http-vue'
import App from './App.vue'

const app = createApp(App)

app.use(createHttpPlugin({
  baseURL: '/api',
  timeout: 10000
}))

app.mount('#app')
```

### 完整配置

```typescript
app.use(createHttpPlugin({
  // HTTP 客户端配置
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000
  },
  
  // 重试配置
  retry: {
    enabled: true,
    maxAttempts: 3
  },
  
  // 全局错误处理
  onError: (error) => {
    console.error('HTTP Error:', error)
  },
  
  // 全局成功处理
  onSuccess: (response) => {
    console.log('HTTP Success:', response)
  }
}))
```

## Composables

### useHttp

基础 HTTP 请求 hook。

```vue
<script setup lang="ts">
import { useHttp } from '@ldesign/http-vue'

interface User {
  id: number
  name: string
  email: string
}

const { data, loading, error, execute, refresh } = useHttp<User[]>('/api/users', {
  immediate: true, // 自动执行
  method: 'GET'
})

// 手动执行
const handleFetch = () => {
  execute()
}

// 刷新数据
const handleRefresh = () => {
  refresh()
}
</script>

<template>
  <div>
    <button @click="handleRefresh">刷新</button>
    
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <ul v-else>
      <li v-for="user in data" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
```

**选项：**

```typescript
interface UseHttpOptions {
  // 是否立即执行
  immediate?: boolean
  
  // HTTP 方法
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  
  // 请求配置
  config?: RequestConfig
  
  // 成功回调
  onSuccess?: (data: T) => void
  
  // 错误回调
  onError?: (error: Error) => void
  
  // 初始数据
  initialData?: T
}
```

### useRequest

更强大的请求管理。

```vue
<script setup lang="ts">
import { useRequest } from '@ldesign/http-vue'

const {
  data,
  loading,
  error,
  execute,
  refresh,
  cancel,
  reset
} = useRequest<User[]>({
  url: '/api/users',
  method: 'GET',
  immediate: true,
  
  // 缓存
  cache: {
    enabled: true,
    ttl: 10000
  },
  
  // 重试
  retry: {
    enabled: true,
    maxAttempts: 3
  },
  
  // 轮询
  polling: {
    enabled: true,
    interval: 5000
  },
  
  // 防抖
  debounce: 300,
  
  // 节流
  throttle: 1000
})
</script>
```

### useResource

RESTful 资源管理。

```vue
<script setup lang="ts">
import { useResource } from '@ldesign/http-vue'

interface User {
  id: number
  name: string
  email: string
}

const {
  items,       // 资源列表
  current,     // 当前资源
  loading,     // 加载状态
  error,       // 错误信息
  list,        // 获取列表
  get,         // 获取单个
  create,      // 创建
  update,      // 更新
  remove,      // 删除
  refresh      // 刷新
} = useResource<User>('/api/users')

// 获取列表
await list()

// 获取单个资源
await get(1)

// 创建资源
await create({
  name: 'John Doe',
  email: 'john@example.com'
})

// 更新资源
await update(1, {
  name: 'Jane Doe'
})

// 删除资源
await remove(1)
</script>

<template>
  <div>
    <button @click="list">加载列表</button>
    <button @click="create({ name: 'New User', email: 'new@example.com' })">
      创建用户
    </button>
    
    <div v-if="loading">加载中...</div>
    <ul v-else>
      <li v-for="user in items" :key="user.id">
        {{ user.name }}
        <button @click="update(user.id, { name: 'Updated' })">更新</button>
        <button @click="remove(user.id)">删除</button>
      </li>
    </ul>
  </div>
</template>
```

### useForm

表单管理。

```vue
<script setup lang="ts">
import { useForm } from '@ldesign/http-vue'

interface UserForm {
  name: string
  email: string
  age: number
}

const {
  data,
  errors,
  submitting,
  touched,
  submit,
  validate,
  reset,
  setField,
  setValidationRules
} = useForm<UserForm>({
  initialData: {
    name: '',
    email: '',
    age: 0
  },
  url: '/api/users',
  method: 'POST'
})

// 设置验证规则
setValidationRules({
  name: [
    { required: true, message: '姓名必填' },
    { min: 2, max: 50, message: '姓名长度 2-50' }
  ],
  email: [
    { required: true, message: '邮箱必填' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }
  ],
  age: [
    { required: true, message: '年龄必填' },
    { min: 1, max: 150, message: '年龄范围 1-150' }
  ]
})

const handleSubmit = async () => {
  if (validate()) {
    await submit()
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="data.name" placeholder="姓名" />
      <span v-if="errors.name">{{ errors.name }}</span>
    </div>
    
    <div>
      <input v-model="data.email" type="email" placeholder="邮箱" />
      <span v-if="errors.email">{{ errors.email }}</span>
    </div>
    
    <div>
      <input v-model.number="data.age" type="number" placeholder="年龄" />
      <span v-if="errors.age">{{ errors.age }}</span>
    </div>
    
    <button type="submit" :disabled="submitting">
      {{ submitting ? '提交中...' : '提交' }}
    </button>
  </form>
</template>
```

### usePagination

分页管理。

```vue
<script setup lang="ts">
import { usePagination } from '@ldesign/http-vue'

const {
  data,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  hasMore,
  nextPage,
  prevPage,
  goToPage,
  setPageSize,
  refresh
} = usePagination<User>('/api/users', {
  initialPage: 1,
  initialPageSize: 10
})
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <ul v-else>
      <li v-for="user in data" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
    
    <div class="pagination">
      <button @click="prevPage" :disabled="page === 1">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button @click="nextPage" :disabled="!hasMore">下一页</button>
    </div>
  </div>
</template>
```

### useInfiniteScroll

无限滚动。

```vue
<script setup lang="ts">
import { useInfiniteScroll } from '@ldesign/http-vue'
import { ref } from 'vue'

const container = ref<HTMLElement>()

const {
  data,
  loading,
  hasMore,
  loadMore
} = useInfiniteScroll<User>('/api/users', {
  pageSize: 20,
  target: container
})
</script>

<template>
  <div ref="container" class="scroll-container">
    <div v-for="user in data" :key="user.id">
      {{ user.name }}
    </div>
    
    <div v-if="loading">加载中...</div>
    <div v-else-if="!hasMore">没有更多了</div>
  </div>
</template>
```

### usePolling

轮询。

```vue
<script setup lang="ts">
import { usePolling } from '@ldesign/http-vue'

const {
  data,
  loading,
  start,
  stop,
  pause,
  resume
} = usePolling<StatusData>('/api/status', {
  interval: 5000, // 5 秒
  immediate: true
})
</script>

<template>
  <div>
    <div>状态: {{ data?.status }}</div>
    <button @click="pause">暂停</button>
    <button @click="resume">继续</button>
    <button @click="stop">停止</button>
  </div>
</template>
```

### useMutation

数据变更。

```vue
<script setup lang="ts">
import { useMutation } from '@ldesign/http-vue'

const {
  mutate,
  loading,
  error,
  reset
} = useMutation<User, CreateUserData>('/api/users', {
  method: 'POST',
  onSuccess: (data) => {
    console.log('创建成功:', data)
  },
  onError: (error) => {
    console.error('创建失败:', error)
  }
})

const handleCreate = async () => {
  await mutate({
    name: 'John Doe',
    email: 'john@example.com'
  })
}
</script>
```

### useWebSocket

WebSocket 连接。

```vue
<script setup lang="ts">
import { useWebSocket } from '@ldesign/http-vue'

const {
  status,
  data,
  send,
  close,
  open
} = useWebSocket('ws://localhost:3000', {
  autoConnect: true,
  reconnect: true,
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  onMessage: (event) => {
    console.log('收到消息:', event.data)
  }
})
</script>

<template>
  <div>
    <div>状态: {{ status }}</div>
    <div>最新消息: {{ data }}</div>
    <button @click="send('Hello')">发送消息</button>
  </div>
</template>
```

### useSSE

Server-Sent Events。

```vue
<script setup lang="ts">
import { useSSE } from '@ldesign/http-vue'

const {
  status,
  data,
  error,
  close
} = useSSE('/api/events', {
  withCredentials: true,
  onMessage: (event) => {
    console.log('收到事件:', event.data)
  }
})
</script>

<template>
  <div>
    <div>连接状态: {{ status }}</div>
    <div v-for="(item, index) in data" :key="index">
      {{ item }}
    </div>
  </div>
</template>
```

## 组件

### HttpProvider

提供 HTTP 客户端给子组件。

```vue
<template>
  <HttpProvider
    :baseURL="'/api'"
    :timeout="10000"
    :cache="{ enabled: true }"
  >
    <YourApp />
  </HttpProvider>
</template>
```

### HttpLoader

显示加载状态。

```vue
<template>
  <HttpLoader
    :loading="loading"
    :error="error"
    loading-text="加载中..."
    error-text="加载失败"
  >
    <template #default>
      <!-- 内容 -->
    </template>
    
    <template #loading>
      <div class="custom-loading">自定义加载</div>
    </template>
    
    <template #error="{ error }">
      <div class="custom-error">{{ error.message }}</div>
    </template>
  </HttpLoader>
</template>
```

### HttpProgress

显示进度条。

```vue
<template>
  <HttpProgress
    :progress="uploadProgress"
    :color="'#42b983'"
    :height="4"
  />
</template>
```

### HttpError

错误展示组件。

```vue
<template>
  <HttpError
    :error="error"
    :retry="handleRetry"
    show-details
  />
</template>
```

## 指令

### v-loading

加载状态指令。

```vue
<template>
  <div v-loading="loading">
    内容
  </div>
</template>
```

### v-http

自动发送请求指令。

```vue
<template>
  <div v-http:get="'/api/users'" @http:success="handleSuccess">
    内容
  </div>
</template>
```

### v-retry

重试指令。

```vue
<template>
  <button v-retry="{ maxAttempts: 3, delay: 1000 }" @click="fetchData">
    加载数据
  </button>
</template>
```

## 工具函数

### useHttpClient

获取 HTTP 客户端实例。

```typescript
import { useHttpClient } from '@ldesign/http-vue'

const client = useHttpClient()
await client.get('/api/users')
```

### useNetworkStatus

网络状态监控。

```vue
<script setup lang="ts">
import { useNetworkStatus } from '@ldesign/http-vue'

const { online, offline, effectiveType, downlink } = useNetworkStatus()
</script>

<template>
  <div>
    <div v-if="offline" class="offline-banner">
      网络已断开
    </div>
    <div>网络类型: {{ effectiveType }}</div>
    <div>下载速度: {{ downlink }} Mbps</div>
  </div>
</template>
```

## 下一步

- [Composables API](/api/vue-composables) - 完整 API 参考
- [组件 API](/api/vue-components) - 组件详细说明
- [示例](/examples/vue-use-http) - 查看更多示例