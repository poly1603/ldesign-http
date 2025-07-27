# Vue3 集成

@ldesign/http 为 Vue3 提供了深度集成，包括组合式函数、插件系统和响应式状态管理。

## 安装插件

### 全局安装

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { createHttpPlugin } from '@ldesign/http'

const app = createApp(App)

// 安装HTTP插件
app.use(createHttpPlugin({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
}))

app.mount('#app')
```

### 局部使用

如果你不想全局安装插件，也可以在需要的地方直接使用：

```typescript
import { createHttpClient } from '@ldesign/http'

// 在组合式函数中
export function useApi() {
  const client = createHttpClient({
    baseURL: 'https://api.example.com'
  })

  return {
    client,
    // 其他API方法
  }
}
```

## 组合式函数

### useRequest - 通用请求

`useRequest` 是最基础的组合式函数，提供了完整的请求控制能力。

```vue
<script setup lang="ts">
import { useRequest } from '@ldesign/http'

const {
  data,
  loading,
  error,
  finished,
  cancelled,
  execute,
  cancel,
  reset,
  refresh
} = useRequest('/api/data', {
  immediate: false, // 不立即执行
  onSuccess: (data) => {
    console.log('请求成功:', data)
  },
  onError: (error) => {
    console.error('请求失败:', error)
  },
  onFinally: () => {
    console.log('请求完成')
  }
})
</script>

<template>
  <div>
    <button :disabled="loading" @click="execute">
      {{ loading ? '请求中...' : '发送请求' }}
    </button>

    <button :disabled="!loading" @click="cancel">
      取消请求
    </button>

    <button @click="reset">
      重置状态
    </button>

    <div v-if="loading">
      🔄 加载中...
    </div>
    <div v-else-if="error" class="error">
      ❌ {{ error.message }}
    </div>
    <div v-else-if="data">
      ✅ 请求成功: {{ data.length }} 条数据
    </div>
  </div>
</template>
```

### useGet - GET 请求

专门用于 GET 请求的组合式函数。

```vue
<script setup lang="ts">
import { useGet } from '@ldesign/http'

interface User {
  id: number
  name: string
  email: string
}

// 基础用法
const { data: users, loading, error, refresh } = useGet<User[]>('/users')

// 带参数的请求
const { data: filteredUsers } = useGet<User[]>('/users', {
  params: { status: 'active', limit: 10 }
})

// 响应式URL
const userId = ref(1)
const { data: user } = useGet<User>(() => `/users/${userId.value}`)
</script>

<template>
  <div>
    <div v-if="loading">
      加载用户中...
    </div>
    <div v-else-if="error">
      加载失败: {{ error.message }}
    </div>
    <div v-else>
      <h2>用户列表</h2>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }} - {{ user.email }}
        </li>
      </ul>
      <button @click="refresh">
        刷新
      </button>
    </div>
  </div>
</template>
```

### usePost - POST 请求

用于创建资源的 POST 请求。

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { usePost } from '@ldesign/http'

const form = reactive({
  name: '',
  email: ''
})

const {
  data,
  loading,
  error,
  execute
} = usePost('/users', {
  immediate: false,
  onSuccess: (user) => {
    console.log('用户创建成功:', user)
    // 重置表单
    form.name = ''
    form.email = ''
  }
})

function handleSubmit() {
  execute({
    data: { ...form }
  })
}
</script>

<template>
  <div>
    <form @submit.prevent="handleSubmit">
      <input v-model="form.name" placeholder="姓名" required>
      <input v-model="form.email" placeholder="邮箱" type="email" required>
      <button type="submit" :disabled="loading">
        {{ loading ? '创建中...' : '创建用户' }}
      </button>
    </form>

    <div v-if="error" class="error">
      创建失败: {{ error.message }}
    </div>

    <div v-if="data" class="success">
      用户创建成功: {{ data.name }}
    </div>
  </div>
</template>
```

### usePut - PUT 请求

用于更新资源的 PUT 请求。

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { usePut } from '@ldesign/http'

const props = defineProps<{ userId: number }>()

const form = reactive({
  name: '',
  email: ''
})

const { loading, execute } = usePut(() => `/users/${props.userId}`, {
  immediate: false,
  onSuccess: () => {
    console.log('用户更新成功')
  }
})

function handleUpdate() {
  execute({
    data: { ...form }
  })
}
</script>

<template>
  <div>
    <form @submit.prevent="handleUpdate">
      <input v-model="form.name" placeholder="姓名">
      <input v-model="form.email" placeholder="邮箱" type="email">
      <button type="submit" :disabled="loading">
        {{ loading ? '更新中...' : '更新用户' }}
      </button>
    </form>
  </div>
</template>
```

### useDelete - DELETE 请求

用于删除资源的 DELETE 请求。

```vue
<script setup lang="ts">
import { useDelete } from '@ldesign/http'

const props = defineProps<{ userId: number }>()
const emit = defineEmits<{ deleted: [id: number] }>()

const { loading, execute } = useDelete(() => `/users/${props.userId}`, {
  immediate: false,
  onSuccess: () => {
    console.log('用户删除成功')
    emit('deleted', props.userId)
  }
})

function handleDelete() {
  if (confirm('确定要删除这个用户吗？')) {
    execute()
  }
}
</script>

<template>
  <div>
    <button :disabled="loading" class="danger" @click="handleDelete">
      {{ loading ? '删除中...' : '删除用户' }}
    </button>
  </div>
</template>
```

## 高级用法

### 条件请求

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGet } from '@ldesign/http'

const shouldFetch = ref(false)
const userId = ref<number | null>(null)

// 只有当 shouldFetch 为 true 且 userId 存在时才发送请求
const url = computed(() => {
  return shouldFetch.value && userId.value
    ? `/users/${userId.value}`
    : null
})

const { data: user, loading } = useGet(url)
</script>
```

### 依赖请求

```vue
<script setup lang="ts">
import { useGet } from '@ldesign/http'

// 首先获取用户信息
const { data: user } = useGet('/user/profile')

// 基于用户信息获取其文章
const { data: posts } = useGet(() =>
  user.value ? `/users/${user.value.id}/posts` : null
)
</script>
```

### 轮询请求

```vue
<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useGet } from '@ldesign/http'

const { data, refresh } = useGet('/api/status')

// 每5秒轮询一次
const timer = setInterval(() => {
  refresh()
}, 5000)

onUnmounted(() => {
  clearInterval(timer)
})
</script>
```

### 错误重试

```vue
<script setup lang="ts">
import { useGet } from '@ldesign/http'

const { data, error, refresh } = useGet('/api/data', {
  onError: (error) => {
    // 网络错误时自动重试
    if (error.isNetworkError) {
      setTimeout(() => {
        refresh()
      }, 3000)
    }
  }
})
</script>
```

## 全局配置

### 使用 provide/inject

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpClient } from '@ldesign/http'

const app = createApp(App)

const httpClient = createHttpClient({
  baseURL: 'https://api.example.com'
})

app.provide('httpClient', httpClient)
```

```vue
<!-- 组件中使用 -->
<script setup lang="ts">
import { inject } from 'vue'
import type { HttpClientInstance } from '@ldesign/http'

const http = inject<HttpClientInstance>('httpClient')

async function fetchData() {
  const response = await http?.get('/data')
  console.log(response?.data)
}
</script>
```

### 自定义组合式函数

```typescript
// composables/useApi.ts
import { createHttpClient } from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: {
    Authorization: () => `Bearer ${localStorage.getItem('token')}`
  }
})

export function useApi() {
  return {
    client,

    // 用户相关API
    async getUsers() {
      return client.get('/users')
    },

    async createUser(userData: any) {
      return client.post('/users', userData)
    },

    // 文章相关API
    async getPosts() {
      return client.get('/posts')
    }
  }
}
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
import { useApi } from '@/composables/useApi'

const { getUsers, createUser } = useApi()

const users = await getUsers()
</script>
```

## 最佳实践

### 1. 统一错误处理

```typescript
// composables/useErrorHandler.ts
import { ref } from 'vue'

export function useErrorHandler() {
  const globalError = ref<string | null>(null)

  const handleError = (error: any) => {
    if (error.response?.status === 401) {
      // 跳转到登录页
      router.push('/login')
    }
 else if (error.response?.status >= 500) {
      globalError.value = '服务器错误，请稍后重试'
    }
 else if (error.isNetworkError) {
      globalError.value = '网络连接失败'
    }
 else {
      globalError.value = error.message
    }
  }

  return {
    globalError,
    handleError
  }
}
```

### 2. 请求状态管理

```typescript
// composables/useRequestState.ts
import { computed, ref } from 'vue'

export function useRequestState() {
  const loadingStates = ref<Record<string, boolean>>({})

  const setLoading = (key: string, loading: boolean) => {
    loadingStates.value[key] = loading
  }

  const isLoading = (key: string) => {
    return computed(() => loadingStates.value[key] || false)
  }

  const hasAnyLoading = computed(() => {
    return Object.values(loadingStates.value).some(Boolean)
  })

  return {
    setLoading,
    isLoading,
    hasAnyLoading
  }
}
```

### 3. 缓存管理

```vue
<script setup lang="ts">
import { useGet } from '@ldesign/http'

// 启用缓存的请求
const { data: users } = useGet('/users', {
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5分钟缓存
  }
})

// 手动清除缓存
function clearCache() {
  // 通过客户端实例清除缓存
  const client = inject('httpClient')
  client?.cache?.clear()
}
</script>
```

## 下一步

- [组合式函数详细API](/vue/composables) - 了解所有组合式函数的详细用法
- [插件配置](/vue/plugin) - 学习如何配置Vue插件
- [最佳实践](/vue/best-practices) - 了解在Vue项目中的最佳实践
