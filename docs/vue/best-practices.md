# Vue 最佳实践

本页面总结了在 Vue 3 项目中使用 @ldesign/http 的最佳实践和常见模式。

## 🏗️ 项目结构

### 推荐的目录结构

```
src/
├── api/                    # API 相关
│   ├── index.ts           # HTTP 客户端配置
│   ├── endpoints.ts       # API 端点定义
│   ├── types.ts           # API 类型定义
│   └── modules/           # 按模块分组的 API
│       ├── user.ts
│       ├── post.ts
│       └── auth.ts
├── composables/           # 组合式函数
│   ├── useApi.ts         # 通用 API 组合式函数
│   ├── useAuth.ts        # 认证相关
│   └── useCache.ts       # 缓存管理
├── stores/               # 状态管理
│   ├── auth.ts
│   └── api.ts
└── components/           # 组件
    ├── common/
    └── features/
```

### API 模块化

```typescript
// api/index.ts - HTTP 客户端配置
import { createHttpClient } from '@ldesign/http'

export const apiClient = createHttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 配置拦截器
apiClient.addRequestInterceptor({
  onFulfilled: (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      }
    }
    return config
  }
})

export default apiClient
```

```typescript
// api/types.ts - API 类型定义
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface Post {
  id: number
  title: string
  content: string
  authorId: number
  author?: User
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

```typescript
// api/modules/user.ts - 用户相关 API
import type { ApiResponse, PaginatedResponse, User } from '../types'
import apiClient from '../index'

export const userApi = {
  // 获取用户列表
  getUsers: (params?: {
    page?: number
    limit?: number
    search?: string
  }) => {
    return apiClient.get<PaginatedResponse<User>>('/users', { params })
  },

  // 获取用户详情
  getUser: (id: number) => {
    return apiClient.get<ApiResponse<User>>(`/users/${id}`)
  },

  // 创建用户
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiClient.post<ApiResponse<User>>('/users', userData)
  },

  // 更新用户
  updateUser: (id: number, userData: Partial<User>) => {
    return apiClient.put<ApiResponse<User>>(`/users/${id}`, userData)
  },

  // 删除用户
  deleteUser: (id: number) => {
    return apiClient.delete<ApiResponse<void>>(`/users/${id}`)
  }
}
```

## 🎯 组合式函数最佳实践

### 通用 API 组合式函数

```typescript
// composables/useApi.ts
import { type Ref, computed, ref } from 'vue'
import type { HttpError, HttpResponse } from '@ldesign/http'

interface UseApiOptions<T> {
  immediate?: boolean
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: HttpError) => void
  transform?: (data: any) => T
}

export function useApi<T>(
  apiCall: () => Promise<HttpResponse<T>>,
  options: UseApiOptions<T> = {}
) {
  const {
    immediate = true,
    initialData = null,
    onSuccess,
    onError,
    transform
  } = options

  const data = ref<T | null>(initialData) as Ref<T | null>
  const loading = ref(false)
  const error = ref<HttpError | null>(null)
  const finished = ref(false)

  const execute = async () => {
    loading.value = true
    error.value = null
    finished.value = false

    try {
      const response = await apiCall()
      let result = response.data

      // 数据转换
      if (transform) {
        result = transform(result)
      }

      data.value = result
      onSuccess?.(result)
      return response
    }
 catch (err: any) {
      error.value = err
      onError?.(err)
      throw err
    }
 finally {
      loading.value = false
      finished.value = true
    }
  }

  const reset = () => {
    data.value = initialData
    loading.value = false
    error.value = null
    finished.value = false
  }

  // 立即执行
  if (immediate) {
    execute()
  }

  return {
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    finished: computed(() => finished.value),
    execute,
    reset
  }
}
```

### 分页数据组合式函数

```typescript
// composables/usePagination.ts
import { computed, reactive, ref } from 'vue'
import type { PaginatedResponse } from '@/api/types'

interface UsePaginationOptions<T> {
  pageSize?: number
  immediate?: boolean
  transform?: (item: T) => T
}

export function usePagination<T>(
  apiCall: (params: { page: number, limit: number }) => Promise<any>,
  options: UsePaginationOptions<T> = {}
) {
  const { pageSize = 10, immediate = true, transform } = options

  const data = ref<T[]>([])
  const loading = ref(false)
  const error = ref(null)

  const pagination = reactive({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0
  })

  const hasNextPage = computed(() => pagination.page < pagination.totalPages)
  const hasPrevPage = computed(() => pagination.page > 1)

  const fetchData = async (page = pagination.page) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiCall({
        page,
        limit: pagination.limit
      })

      const result = response.data as PaginatedResponse<T>

      // 数据转换
      let items = result.data
      if (transform) {
        items = items.map(transform)
      }

      data.value = items

      // 更新分页信息
      Object.assign(pagination, {
        page: result.pagination.page,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      })

      return result
    }
 catch (err: any) {
      error.value = err
      throw err
    }
 finally {
      loading.value = false
    }
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      return fetchData(pagination.page + 1)
    }
  }

  const prevPage = () => {
    if (hasPrevPage.value) {
      return fetchData(pagination.page - 1)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      return fetchData(page)
    }
  }

  const refresh = () => fetchData(pagination.page)

  // 立即执行
  if (immediate) {
    fetchData()
  }

  return {
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    pagination: computed(() => ({ ...pagination })),
    hasNextPage,
    hasPrevPage,
    fetchData,
    nextPage,
    prevPage,
    goToPage,
    refresh
  }
}
```

### 表单提交组合式函数

```typescript
// composables/useForm.ts
import { reactive, ref } from 'vue'
import type { HttpError } from '@ldesign/http'

interface UseFormOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: HttpError) => void
  resetOnSuccess?: boolean
  validate?: (data: any) => string[] | null
}

export function useForm<T, R = any>(
  submitFn: (data: T) => Promise<R>,
  initialData: T,
  options: UseFormOptions<R> = {}
) {
  const {
    onSuccess,
    onError,
    resetOnSuccess = false,
    validate
  } = options

  const formData = reactive<T>({ ...initialData })
  const loading = ref(false)
  const errors = ref<string[]>([])
  const fieldErrors = ref<Record<string, string>>({})

  const submit = async () => {
    loading.value = true
    errors.value = []
    fieldErrors.value = {}

    try {
      // 客户端验证
      if (validate) {
        const validationErrors = validate(formData)
        if (validationErrors && validationErrors.length > 0) {
          errors.value = validationErrors
          return
        }
      }

      const result = await submitFn(formData)

      onSuccess?.(result)

      if (resetOnSuccess) {
        reset()
      }

      return result
    }
 catch (err: any) {
      // 处理验证错误
      if (err.status === 422 && err.response?.data?.errors) {
        fieldErrors.value = err.response.data.errors
      }
 else {
        errors.value = [err.message || '提交失败']
      }

      onError?.(err)
      throw err
    }
 finally {
      loading.value = false
    }
  }

  const reset = () => {
    Object.assign(formData, initialData)
    errors.value = []
    fieldErrors.value = {}
  }

  const setFieldError = (field: string, message: string) => {
    fieldErrors.value[field] = message
  }

  const clearFieldError = (field: string) => {
    delete fieldErrors.value[field]
  }

  return {
    formData,
    loading: computed(() => loading.value),
    errors: computed(() => errors.value),
    fieldErrors: computed(() => fieldErrors.value),
    submit,
    reset,
    setFieldError,
    clearFieldError
  }
}
```

## 🗄️ 状态管理集成

### Pinia Store 最佳实践

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { userApi } from '@/api/modules/user'
import type { User } from '@/api/types'

export const useUserStore = defineStore('user', () => {
  // 状态
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const userCount = computed(() => users.value.length)
  const isLoggedIn = computed(() => !!currentUser.value)

  // 操作
  const fetchUsers = async (params?: any) => {
    loading.value = true
    error.value = null

    try {
      const response = await userApi.getUsers(params)
      users.value = response.data.data
      return response.data
    }
 catch (err: any) {
      error.value = err.message
      throw err
    }
 finally {
      loading.value = false
    }
  }

  const fetchUser = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      const response = await userApi.getUser(id)
      const user = response.data.data

      // 更新用户列表中的用户信息
      const index = users.value.findIndex(u => u.id === id)
      if (index !== -1) {
        users.value[index] = user
      }

      return user
    }
 catch (err: any) {
      error.value = err.message
      throw err
    }
 finally {
      loading.value = false
    }
  }

  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true
    error.value = null

    try {
      const response = await userApi.createUser(userData)
      const newUser = response.data.data

      users.value.push(newUser)
      return newUser
    }
 catch (err: any) {
      error.value = err.message
      throw err
    }
 finally {
      loading.value = false
    }
  }

  const updateUser = async (id: number, userData: Partial<User>) => {
    loading.value = true
    error.value = null

    try {
      const response = await userApi.updateUser(id, userData)
      const updatedUser = response.data.data

      // 更新本地状态
      const index = users.value.findIndex(u => u.id === id)
      if (index !== -1) {
        users.value[index] = updatedUser
      }

      if (currentUser.value?.id === id) {
        currentUser.value = updatedUser
      }

      return updatedUser
    }
 catch (err: any) {
      error.value = err.message
      throw err
    }
 finally {
      loading.value = false
    }
  }

  const deleteUser = async (id: number) => {
    loading.value = true
    error.value = null

    try {
      await userApi.deleteUser(id)

      // 从本地状态中移除
      users.value = users.value.filter(u => u.id !== id)

      if (currentUser.value?.id === id) {
        currentUser.value = null
      }
    }
 catch (err: any) {
      error.value = err.message
      throw err
    }
 finally {
      loading.value = false
    }
  }

  const setCurrentUser = (user: User | null) => {
    currentUser.value = user
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    users: computed(() => users.value),
    currentUser: computed(() => currentUser.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // 计算属性
    userCount,
    isLoggedIn,

    // 操作
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    setCurrentUser,
    clearError
  }
})
```

## 🎨 组件最佳实践

### 数据展示组件

```vue
<!-- components/UserList.vue -->
<script setup lang="ts">
import { watch } from 'vue'
import UserCard from './UserCard.vue'
import Pagination from './Pagination.vue'
import { usePagination } from '@/composables/usePagination'
import { userApi } from '@/api/modules/user'
import type { User } from '@/api/types'

interface Props {
  searchQuery?: string
  filters?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  filters: () => ({})
})

const emit = defineEmits<{
  edit: [user: User]
  delete: [userId: number]
}>()

// 使用分页组合式函数
const {
  data: users,
  loading,
  error,
  pagination,
  fetchData,
  goToPage,
  refresh
} = usePagination(
  params => userApi.getUsers({
    ...params,
    search: props.searchQuery,
    ...props.filters
  }),
  {
    pageSize: 12,
    immediate: true
  }
)

// 监听搜索和过滤条件变化
watch(
  () => [props.searchQuery, props.filters],
  () => {
    fetchData(1) // 重置到第一页
  },
  { deep: true }
)

function handlePageChange(page: number) {
  goToPage(page)
}

function handleEdit(user: User) {
  emit('edit', user)
}

function handleDelete(userId: number) {
  emit('delete', userId)
}

function retry() {
  fetchData()
}
</script>

<template>
  <div class="user-list">
    <div class="user-list-header">
      <h2>用户列表</h2>
      <button :disabled="loading" class="refresh-btn" @click="refresh">
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <div v-if="loading && !users.length" class="loading">
      加载中...
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error.message }}</p>
      <button @click="retry">
        重试
      </button>
    </div>

    <div v-else-if="users.length === 0" class="empty">
      暂无用户数据
    </div>

    <div v-else class="user-grid">
      <UserCard
        v-for="user in users"
        :key="user.id"
        :user="user"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <Pagination
      v-if="pagination.totalPages > 1"
      :current-page="pagination.page"
      :total-pages="pagination.totalPages"
      :total="pagination.total"
      @page-change="handlePageChange"
    />
  </div>
</template>

<style scoped>
.user-list {
  padding: 20px;
}

.user-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-btn {
  padding: 8px 16px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  color: #718096;
}

.error {
  color: #e53e3e;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
</style>
```

### 表单组件

```vue
<!-- components/UserForm.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useForm } from '@/composables/useForm'
import { userApi } from '@/api/modules/user'
import type { User } from '@/api/types'

interface Props {
  user?: User | null
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  mode: 'create'
})

const emit = defineEmits<{
  success: [user: User]
  cancel: []
}>()

const isEdit = computed(() => props.mode === 'edit')

// 初始表单数据
const initialData = computed(() => ({
  name: props.user?.name || '',
  email: props.user?.email || '',
  avatar: props.user?.avatar || ''
}))

// 提交函数
async function submitFn(data: any) {
  if (isEdit.value && props.user) {
    const response = await userApi.updateUser(props.user.id, data)
    return response.data.data
  }
 else {
    const response = await userApi.createUser(data)
    return response.data.data
  }
}

// 使用表单组合式函数
const {
  formData,
  loading,
  errors,
  fieldErrors,
  submit,
  reset
} = useForm(submitFn, initialData.value, {
  onSuccess: (user) => {
    emit('success', user)
  },
  validate: (data) => {
    const errors: string[] = []

    if (!data.name.trim()) {
      errors.push('姓名不能为空')
    }

    if (!data.email.trim()) {
      errors.push('邮箱不能为空')
    }
 else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('邮箱格式不正确')
    }

    return errors.length > 0 ? errors : null
  }
})

async function handleSubmit() {
  try {
    await submit()
  }
 catch (error) {
    // 错误已在 useForm 中处理
  }
}
</script>

<template>
  <form class="user-form" @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="name">姓名 *</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        required
        class="form-input"
        :class="{ error: fieldErrors.name }"
      >
      <span v-if="fieldErrors.name" class="field-error">
        {{ fieldErrors.name }}
      </span>
    </div>

    <div class="form-group">
      <label for="email">邮箱 *</label>
      <input
        id="email"
        v-model="formData.email"
        type="email"
        required
        class="form-input"
        :class="{ error: fieldErrors.email }"
      >
      <span v-if="fieldErrors.email" class="field-error">
        {{ fieldErrors.email }}
      </span>
    </div>

    <div class="form-group">
      <label for="avatar">头像URL</label>
      <input
        id="avatar"
        v-model="formData.avatar"
        type="url"
        class="form-input"
        :class="{ error: fieldErrors.avatar }"
      >
      <span v-if="fieldErrors.avatar" class="field-error">
        {{ fieldErrors.avatar }}
      </span>
    </div>

    <div v-if="errors.length > 0" class="form-errors">
      <ul>
        <li v-for="error in errors" :key="error">
          {{ error }}
        </li>
      </ul>
    </div>

    <div class="form-actions">
      <button type="button" :disabled="loading" @click="reset">
        重置
      </button>
      <button type="submit" :disabled="loading" class="primary">
        {{ loading ? '提交中...' : (isEdit ? '更新' : '创建') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.user-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 16px;
}

.form-input.error {
  border-color: #e53e3e;
}

.field-error {
  display: block;
  margin-top: 5px;
  color: #e53e3e;
  font-size: 14px;
}

.form-errors {
  margin-bottom: 20px;
  padding: 10px;
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 4px;
}

.form-errors ul {
  margin: 0;
  padding-left: 20px;
  color: #742a2a;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.form-actions button {
  padding: 10px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button.primary {
  background: #4299e1;
  color: white;
  border-color: #4299e1;
}

.form-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

## 🔧 性能优化

### 1. 请求去重

```typescript
// composables/useRequestDeduplication.ts
import { ref } from 'vue'

const pendingRequests = new Map<string, Promise<any>>()

export function useRequestDeduplication() {
  const deduplicate = <T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> => {
    // 如果已有相同的请求在进行中，返回该请求
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)!
    }

    // 创建新请求
    const request = requestFn().finally(() => {
      // 请求完成后清除缓存
      pendingRequests.delete(key)
    })

    pendingRequests.set(key, request)
    return request
  }

  return { deduplicate }
}
```

### 2. 智能缓存

```typescript
// composables/useSmartCache.ts
import { computed, ref } from 'vue'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheItem<any>>()

export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5 * 60 * 1000 // 5分钟
) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref(null)

  const isExpired = (item: CacheItem<T>) => {
    return Date.now() - item.timestamp > item.ttl
  }

  const getCachedData = (): T | null => {
    const item = cache.get(key)
    if (item && !isExpired(item)) {
      return item.data
    }
    return null
  }

  const fetchData = async (forceRefresh = false) => {
    // 检查缓存
    if (!forceRefresh) {
      const cachedData = getCachedData()
      if (cachedData) {
        data.value = cachedData
        return cachedData
      }
    }

    loading.value = true
    error.value = null

    try {
      const result = await fetcher()

      // 更新缓存
      cache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl
      })

      data.value = result
      return result
    }
 catch (err: any) {
      error.value = err
      throw err
    }
 finally {
      loading.value = false
    }
  }

  const refresh = () => fetchData(true)

  const clearCache = () => {
    cache.delete(key)
  }

  return {
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    fetchData,
    refresh,
    clearCache
  }
}
```

### 3. 虚拟滚动

```vue
<!-- components/VirtualUserList.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { User } from '@/api/types'

interface Props {
  users: User[]
  itemHeight?: number
  containerHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 100,
  containerHeight: 400
})

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)

const totalHeight = computed(() => props.users.length * props.itemHeight)

const startIndex = computed(() =>
  Math.floor(scrollTop.value / props.itemHeight)
)

const endIndex = computed(() =>
  Math.min(
    startIndex.value + Math.ceil(props.containerHeight / props.itemHeight) + 1,
    props.users.length
  )
)

const visibleItems = computed(() =>
  props.users.slice(startIndex.value, endIndex.value)
)

const offsetY = computed(() => startIndex.value * props.itemHeight)

function handleScroll(event: Event) {
  scrollTop.value = (event.target as HTMLElement).scrollTop
}

onMounted(() => {
  containerRef.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div ref="containerRef" class="virtual-list">
    <div class="virtual-list-phantom" :style="{ height: `${totalHeight}px` }" />
    <div class="virtual-list-content" :style="{ transform: `translateY(${offsetY}px)` }">
      <UserCard
        v-for="item in visibleItems"
        :key="item.id"
        :user="item"
        :style="{ height: `${itemHeight}px` }"
      />
    </div>
  </div>
</template>

<style scoped>
.virtual-list {
  height: 400px;
  overflow-y: auto;
  position: relative;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  left: 0;
  right: 0;
  top: 0;
  position: absolute;
}
</style>
```

## 📚 测试最佳实践

### 组合式函数测试

```typescript
// tests/composables/useApi.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useApi } from '@/composables/useApi'

// Mock API 调用
const mockApiCall = vi.fn()

describe('useApi', () => {
  beforeEach(() => {
    mockApiCall.mockClear()
  })

  it('应该正确处理成功响应', async () => {
    const mockData = { id: 1, name: 'Test' }
    mockApiCall.mockResolvedValue({ data: mockData })

    const { data, loading, error, execute } = useApi(mockApiCall, {
      immediate: false
    })

    expect(loading.value).toBe(false)
    expect(data.value).toBe(null)

    await execute()

    expect(loading.value).toBe(false)
    expect(data.value).toEqual(mockData)
    expect(error.value).toBe(null)
  })

  it('应该正确处理错误响应', async () => {
    const mockError = new Error('API Error')
    mockApiCall.mockRejectedValue(mockError)

    const { data, loading, error, execute } = useApi(mockApiCall, {
      immediate: false
    })

    try {
      await execute()
    }
 catch (err) {
      expect(err).toBe(mockError)
    }

    expect(loading.value).toBe(false)
    expect(data.value).toBe(null)
    expect(error.value).toBe(mockError)
  })
})
```

### 组件测试

```typescript
// tests/components/UserList.test.ts
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserList from '@/components/UserList.vue'
import { userApi } from '@/api/modules/user'

// Mock API
vi.mock('@/api/modules/user', () => ({
  userApi: {
    getUsers: vi.fn()
  }
}))

describe('UserList', () => {
  it('应该渲染用户列表', async () => {
    const mockUsers = [
      { id: 1, name: 'User 1', email: 'user1@example.com' },
      { id: 2, name: 'User 2', email: 'user2@example.com' }
    ]

    vi.mocked(userApi.getUsers).mockResolvedValue({
      data: {
        data: mockUsers,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      }
    })

    const wrapper = mount(UserList)

    // 等待异步操作完成
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.findAll('.user-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('User 1')
    expect(wrapper.text()).toContain('User 2')
  })
})
```

## 📚 总结

遵循这些最佳实践可以帮助你：

1. **提高代码质量** - 模块化、类型安全、可测试
2. **提升开发效率** - 复用组合式函数、统一错误处理
3. **优化用户体验** - 智能缓存、加载状态、错误恢复
4. **便于维护** - 清晰的项目结构、一致的代码风格

继续学习：
- [完整示例项目](/examples/complete-demo) - 查看完整的实现
- [性能优化](/guide/performance) - 更多性能优化技巧
- [插件开发](/plugins/development) - 开发自定义插件
