# Vue 插件

@ldesign/http 提供了专门的 Vue 3 插件，让你能够在整个应用中轻松使用HTTP客户端。

## 🚀 安装和配置

### 基础安装

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

### 高级配置

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http'

const app = createApp(App)

app.use(createHttpPlugin({
  // 基础配置
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,

  // 适配器配置
  adapter: 'fetch',

  // 启用插件
  enableCache: true,
  enableRetry: true,
  enableLog: import.meta.env.DEV,

  // 认证配置
  authToken: () => localStorage.getItem('auth_token'),

  // 自定义配置
  interceptors: {
    request: [
      {
        onFulfilled: (config) => {
          // 全局请求拦截
          config.headers = {
            ...config.headers,
            'X-App-Version': '1.0.0'
          }
          return config
        }
      }
    ],
    response: [
      {
        onRejected: (error) => {
          // 全局错误处理
          if (error.status === 401) {
            // 跳转登录
            router.push('/login')
          }
          return Promise.reject(error)
        }
      }
    ]
  }
}))
```

## 🎯 插件选项

### HttpPluginOptions

```typescript
interface HttpPluginOptions extends HttpClientConfig {
  // 快速配置
  enableCache?: boolean
  enableRetry?: boolean
  enableLog?: boolean

  // 认证配置
  authToken?: string | (() => string | Promise<string>)

  // 全局配置
  globalKey?: string // 全局注入的键名 (默认: '$http')
  provideKey?: string // provide/inject 的键名 (默认: 'http')

  // 路由集成
  router?: Router // Vue Router 实例

  // 错误处理
  errorHandler?: (error: HttpError) => void
}
```

### 详细配置示例

```typescript
import { createRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = createRouter({
  // 路由配置...
})

app.use(createHttpPlugin({
  baseURL: 'https://api.example.com',

  // 快速启用功能
  enableCache: true,
  enableRetry: true,
  enableLog: process.env.NODE_ENV === 'development',

  // 认证配置
  authToken: async () => {
    const token = localStorage.getItem('token')
    if (!token)
return ''

    // 检查token是否过期
    if (isTokenExpired(token)) {
      const newToken = await refreshToken()
      localStorage.setItem('token', newToken)
      return newToken
    }

    return token
  },

  // 自定义键名
  globalKey: '$api',
  provideKey: 'apiClient',

  // 路由集成
  router,

  // 全局错误处理
  errorHandler: (error) => {
    if (error.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      router.push('/login')
    }
 else if (error.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    }
 else if (error.isNetworkError) {
      ElMessage.error('网络连接失败，请检查网络设置')
    }
  }
}))
```

## 🔧 使用方式

### 组合式API

```vue
<script setup lang="ts">
import { useGet, useHttp } from '@ldesign/http'

// 方式1: 使用 useHttp 获取客户端实例
const http = useHttp()

// 方式2: 直接使用组合式函数
const { data: users, loading, error, refresh } = useGet('/users')

// 手动发送请求
async function createUser(userData: any) {
  try {
    const response = await http.post('/users', userData)
    console.log('用户创建成功:', response.data)
    refresh() // 刷新用户列表
  }
 catch (error) {
    console.error('创建用户失败:', error)
  }
}
</script>

<template>
  <div>
    <div v-if="loading">
      加载中...
    </div>
    <div v-else-if="error">
      错误: {{ error.message }}
    </div>
    <div v-else>
      <h2>用户列表</h2>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }} - {{ user.email }}
        </li>
      </ul>
    </div>

    <button @click="refresh">
      刷新
    </button>
  </div>
</template>
```

### 选项式API

```vue
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      users: []
    }
  },

  async mounted() {
    await this.fetchUsers()
  },

  methods: {
    async fetchUsers() {
      try {
        // 使用全局注入的HTTP客户端
        const response = await this.$http.get('/users')
        this.users = response.data
      }
 catch (error) {
        console.error('获取用户失败:', error)
      }
    },

    async createUser(userData: any) {
      const response = await this.$http.post('/users', userData)
      return response.data
    }
  }
})
</script>

<template>
  <div>
    <button @click="fetchUsers">
      获取用户
    </button>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
```

### Provide/Inject

```vue
<!-- 父组件 -->
<script setup lang="ts">
// 父组件中HTTP客户端已经通过插件自动provide
</script>

<script setup lang="ts">
import { inject } from 'vue'
import type { HttpClientInstance } from '@ldesign/http'

// 注入HTTP客户端
const http = inject<HttpClientInstance>('http')

// 使用客户端
const userData = await http?.get('/user/profile')
</script>

<!-- 子组件 -->
<template>
  <ChildComponent />
</template>

<template>
  <div>{{ userData }}</div>
</template>
```

## 🎨 TypeScript 支持

### 类型声明

```typescript
// types/vue.d.ts
import type { HttpClientInstance } from '@ldesign/http'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $http: HttpClientInstance
  }
}
```

### 类型安全的API调用

```vue
<script setup lang="ts">
import { useGet, usePost } from '@ldesign/http'

// 定义API响应类型
interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

interface CreateUserRequest {
  name: string
  email: string
}

// 类型安全的GET请求
const { data: users, loading } = useGet<User[]>('/users')

// 类型安全的POST请求
const { execute: createUser } = usePost<User, CreateUserRequest>('/users', {
  immediate: false
})

// 使用时会有完整的类型提示
async function handleCreateUser() {
  const newUser = await createUser({
    data: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  })

  // newUser.data 的类型为 User
  console.log(newUser.data.name)
}
</script>
```

## 🔄 状态管理集成

### Pinia 集成

```typescript
// stores/api.ts
import { defineStore } from 'pinia'
import { useHttp } from '@ldesign/http'

export const useApiStore = defineStore('api', () => {
  const http = useHttp()

  // 状态
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 通用API调用方法
  const apiCall = async <T>(
    request: () => Promise<T>
  ): Promise<T | null> => {
    loading.value = true
    error.value = null

    try {
      const result = await request()
      return result
    }
 catch (err: any) {
      error.value = err.message
      return null
    }
 finally {
      loading.value = false
    }
  }

  // 具体API方法
  const getUsers = () => apiCall(() => http.get('/users'))
  const createUser = (data: any) => apiCall(() => http.post('/users', data))
  const updateUser = (id: number, data: any) => apiCall(() => http.put(`/users/${id}`, data))
  const deleteUser = (id: number) => apiCall(() => http.delete(`/users/${id}`))

  return {
    loading: readonly(loading),
    error: readonly(error),
    getUsers,
    createUser,
    updateUser,
    deleteUser
  }
})
```

### Vuex 集成

```typescript
// store/modules/api.ts
import type { HttpClientInstance } from '@ldesign/http'

export default {
  namespaced: true,

  state: () => ({
    loading: false,
    error: null,
    data: null
  }),

  mutations: {
    SET_LOADING(state: any, loading: boolean) {
      state.loading = loading
    },
    SET_ERROR(state: any, error: any) {
      state.error = error
    },
    SET_DATA(state: any, data: any) {
      state.data = data
    }
  },

  actions: {
    async fetchData({ commit }: any, { http, endpoint }: { http: HttpClientInstance, endpoint: string }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)

      try {
        const response = await http.get(endpoint)
        commit('SET_DATA', response.data)
        return response.data
      }
 catch (error: any) {
        commit('SET_ERROR', error.message)
        throw error
      }
 finally {
        commit('SET_LOADING', false)
      }
    }
  }
}

// 在组件中使用
export default defineComponent({
  async mounted() {
    const http = this.$http
    await this.$store.dispatch('api/fetchData', {
      http,
      endpoint: '/users'
    })
  }
})
```

## 🛣️ 路由集成

### 路由守卫

```typescript
// router/index.ts
import { createRouter } from 'vue-router'
import type { HttpClientInstance } from '@ldesign/http'

const router = createRouter({
  // 路由配置...
})

// 在插件配置中传入router
app.use(createHttpPlugin({
  baseURL: 'https://api.example.com',
  router, // 传入router实例

  // 401错误自动跳转登录
  errorHandler: (error) => {
    if (error.status === 401) {
      router.push('/login')
    }
  }
}))

// 或者手动设置路由守卫
router.beforeEach(async (to, from, next) => {
  const http = app.config.globalProperties.$http as HttpClientInstance

  // 检查认证状态
  if (to.meta.requiresAuth) {
    try {
      await http.get('/auth/verify')
      next()
    }
 catch (error) {
      next('/login')
    }
  }
 else {
    next()
  }
})
```

### 路由数据预取

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useGet } from '@ldesign/http'

const route = useRoute()

// 根据路由参数获取数据
const { data: user } = useGet(() =>
  route.params.id ? `/users/${route.params.id}` : null
)
</script>
```

## 🧪 测试

### 组件测试

```typescript
// tests/components/UserList.test.ts
import { mount } from '@vue/test-utils'
import { createHttpPlugin } from '@ldesign/http'
import UserList from '@/components/UserList.vue'

describe('UserList', () => {
  it('should render users', async () => {
    // 创建测试用的HTTP插件
    const httpPlugin = createHttpPlugin({
      baseURL: 'http://localhost:3000'
    })

    const wrapper = mount(UserList, {
      global: {
        plugins: [httpPlugin]
      }
    })

    // 等待数据加载
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.user-list').exists()).toBe(true)
  })
})
```

### Mock HTTP客户端

```typescript
// tests/setup.ts
import { vi } from 'vitest'
import type { HttpClientInstance } from '@ldesign/http'

// Mock HTTP客户端
const mockHttp: HttpClientInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  // ... 其他方法
}

// 全局Mock
vi.mock('@ldesign/http', () => ({
  useHttp: () => mockHttp,
  useGet: vi.fn(),
  usePost: vi.fn(),
  // ... 其他导出
}))
```

## 📚 最佳实践

### 1. 环境配置

```typescript
// config/http.ts
const httpConfig = {
  development: {
    baseURL: 'http://localhost:3000/api',
    enableLog: true,
    enableCache: false,
    timeout: 30000
  },
  production: {
    baseURL: 'https://api.example.com',
    enableLog: false,
    enableCache: true,
    timeout: 10000
  }
}

export default httpConfig[import.meta.env.MODE]
```

### 2. 错误处理

```typescript
// utils/errorHandler.ts
import { ElMessage } from 'element-plus'
import type { HttpError } from '@ldesign/http'

export function createErrorHandler(router: Router) {
  return (error: HttpError) => {
    switch (error.status) {
      case 401:
        ElMessage.error('登录已过期')
        router.push('/login')
        break
      case 403:
        ElMessage.error('权限不足')
        break
      case 404:
        ElMessage.error('资源不存在')
        break
      case 429:
        ElMessage.warning('请求过于频繁，请稍后重试')
        break
      case 500:
        ElMessage.error('服务器错误')
        break
      default:
        if (error.isNetworkError) {
          ElMessage.error('网络连接失败')
        }
 else {
          ElMessage.error(error.message || '请求失败')
        }
    }
  }
}
```

### 3. 性能优化

```typescript
// 懒加载HTTP客户端
const lazyHttpPlugin = {
  install(app: App) {
    app.config.globalProperties.$http = markRaw(
      createHttpClient({
        baseURL: 'https://api.example.com'
      })
    )
  }
}

// 使用 markRaw 避免响应式包装
```

## 📚 下一步

了解Vue插件后，你可以继续学习：

- [组合式函数](/vue/composables) - 详细的组合式函数用法
- [最佳实践](/vue/best-practices) - Vue集成最佳实践
- [完整示例](/examples/complete-demo) - 完整的Vue项目示例
- [性能优化](/guide/performance) - 性能优化技巧
