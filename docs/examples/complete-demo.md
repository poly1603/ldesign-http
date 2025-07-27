# 完整实战示例

这是一个完整的实战示例，展示如何使用 @ldesign/http 构建一个功能完整的用户管理系统。

## 项目结构

```
src/
├── api/
│   ├── client.ts          # HTTP客户端配置
│   ├── users.ts           # 用户API
│   └── types.ts           # API类型定义
├── components/
│   ├── UserList.vue       # 用户列表组件
│   ├── UserForm.vue       # 用户表单组件
│   └── UserDetail.vue     # 用户详情组件
├── composables/
│   ├── useUsers.ts        # 用户相关组合式函数
│   └── useNotification.ts # 通知组合式函数
└── views/
    └── UserManagement.vue # 用户管理页面
```

## API 配置

### client.ts

```typescript
import {
  createAuthInterceptor,
  createCachePlugin,
  createHttpClient,
  createLogInterceptor,
  createRetryPlugin
} from '@ldesign/http'

// 创建HTTP客户端
export const apiClient = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 添加缓存插件
const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 5 * 60 * 1000, // 5分钟缓存
})
cachePlugin.install(apiClient)

// 添加重试插件
const retryPlugin = createRetryPlugin({
  retries: 3,
  retryDelay: 1000,
  strategy: 'exponential'
})
retryPlugin.install(apiClient)

// 添加日志拦截器
const logInterceptors = createLogInterceptor({
  logRequests: true,
  logResponses: true,
  logErrors: true
})
apiClient.addRequestInterceptor(logInterceptors.request)
apiClient.addResponseInterceptor(logInterceptors.response)

// 添加认证拦截器
const authInterceptor = createAuthInterceptor({
  getToken: () => localStorage.getItem('token') || '',
  tokenType: 'Bearer'
})
apiClient.addRequestInterceptor(authInterceptor)

// 全局错误处理
apiClient.addResponseInterceptor({
  onRejected: (error) => {
    if (error.response?.status === 401) {
      // 清除token并跳转到登录页
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
})

export default apiClient
```

### types.ts

```typescript
export interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  address: {
    street: string
    suite: string
    city: string
    zipcode: string
    geo: {
      lat: string
      lng: string
    }
  }
  company: {
    name: string
    catchPhrase: string
    bs: string
  }
}

export interface CreateUserRequest {
  name: string
  username: string
  email: string
  phone?: string
  website?: string
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: number
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

### users.ts

```typescript
import apiClient from './client'
import type { CreateUserRequest, UpdateUserRequest, User } from './types'

export const userApi = {
  // 获取所有用户
  async getUsers() {
    const response = await apiClient.get<User[]>('/users')
    return response.data
  },

  // 获取单个用户
  async getUser(id: number) {
    const response = await apiClient.get<User>(`/users/${id}`)
    return response.data
  },

  // 创建用户
  async createUser(userData: CreateUserRequest) {
    const response = await apiClient.post<User>('/users', userData)
    return response.data
  },

  // 更新用户
  async updateUser(userData: UpdateUserRequest) {
    const response = await apiClient.put<User>(`/users/${userData.id}`, userData)
    return response.data
  },

  // 删除用户
  async deleteUser(id: number) {
    await apiClient.delete(`/users/${id}`)
  },

  // 搜索用户
  async searchUsers(query: string) {
    const response = await apiClient.get<User[]>('/users', {
      params: { q: query }
    })
    return response.data
  }
}
```

## 组合式函数

### useUsers.ts

```typescript
import { computed, ref } from 'vue'
import { useDelete, useGet, usePost, usePut } from '@ldesign/http'
import { userApi } from '@/api/users'
import type { CreateUserRequest, UpdateUserRequest, User } from '@/api/types'

export function useUsers() {
  // 获取用户列表
  const {
    data: users,
    loading: usersLoading,
    error: usersError,
    refresh: refreshUsers
  } = useGet<User[]>('/users')

  // 创建用户
  const {
    data: createdUser,
    loading: createLoading,
    error: createError,
    execute: executeCreate
  } = usePost<User>('/users', {
    immediate: false,
    onSuccess: () => {
      refreshUsers() // 创建成功后刷新列表
    }
  })

  // 更新用户
  const updateUser = async (userData: UpdateUserRequest) => {
    try {
      const updatedUser = await userApi.updateUser(userData)
      // 更新本地数据
      if (users.value) {
        const index = users.value.findIndex(u => u.id === userData.id)
        if (index !== -1) {
          users.value[index] = updatedUser
        }
      }
      return updatedUser
    }
 catch (error) {
      console.error('更新用户失败:', error)
      throw error
    }
  }

  // 删除用户
  const deleteUser = async (id: number) => {
    try {
      await userApi.deleteUser(id)
      // 从本地数据中移除
      if (users.value) {
        users.value = users.value.filter(u => u.id !== id)
      }
    }
 catch (error) {
      console.error('删除用户失败:', error)
      throw error
    }
  }

  // 搜索功能
  const searchQuery = ref('')
  const filteredUsers = computed(() => {
    if (!users.value || !searchQuery.value) {
      return users.value || []
    }

    const query = searchQuery.value.toLowerCase()
    return users.value.filter(user =>
      user.name.toLowerCase().includes(query)
      || user.email.toLowerCase().includes(query)
      || user.username.toLowerCase().includes(query)
    )
  })

  // 创建用户
  const createUser = async (userData: CreateUserRequest) => {
    return executeCreate({ data: userData })
  }

  return {
    // 数据
    users,
    filteredUsers,
    createdUser,

    // 状态
    usersLoading,
    createLoading,
    usersError,
    createError,

    // 搜索
    searchQuery,

    // 方法
    refreshUsers,
    createUser,
    updateUser,
    deleteUser
  }
}
```

### useNotification.ts

```typescript
import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export function useNotification() {
  const notifications = ref<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      duration: 3000,
      ...notification
    }

    notifications.value.push(newNotification)

    // 自动移除
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const success = (title: string, message?: string) => {
    return addNotification({ type: 'success', title, message })
  }

  const error = (title: string, message?: string) => {
    return addNotification({ type: 'error', title, message })
  }

  const warning = (title: string, message?: string) => {
    return addNotification({ type: 'warning', title, message })
  }

  const info = (title: string, message?: string) => {
    return addNotification({ type: 'info', title, message })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  }
}
```

## Vue 组件

### UserList.vue

```vue
<script setup lang="ts">
import { useUsers } from '@/composables/useUsers'
import { useNotification } from '@/composables/useNotification'
import type { User } from '@/api/types'

defineEmits<{
  create: []
  edit: [user: User]
  select: [user: User]
}>()

const {
  filteredUsers,
  usersLoading,
  usersError,
  searchQuery,
  refreshUsers,
  deleteUser
} = useUsers()

const { success, error } = useNotification()

async function handleDelete(user: User) {
  if (!confirm(`确定要删除用户 "${user.name}" 吗？`)) {
    return
  }

  try {
    await deleteUser(user.id)
    success('删除成功', `用户 "${user.name}" 已被删除`)
  }
 catch (err: any) {
    error('删除失败', err.message)
  }
}
</script>

<template>
  <div class="user-list">
    <div class="header">
      <h2>用户列表</h2>
      <div class="actions">
        <input
          v-model="searchQuery"
          placeholder="搜索用户..."
          class="search-input"
        >
        <button class="btn btn-primary" @click="$emit('create')">
          新增用户
        </button>
        <button :disabled="usersLoading" class="btn btn-secondary" @click="refreshUsers">
          {{ usersLoading ? '刷新中...' : '刷新' }}
        </button>
      </div>
    </div>

    <div v-if="usersLoading" class="loading">
      🔄 加载用户列表...
    </div>

    <div v-else-if="usersError" class="error">
      ❌ 加载失败: {{ usersError.message }}
      <button class="btn btn-sm" @click="refreshUsers">
        重试
      </button>
    </div>

    <div v-else class="user-grid">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-card"
        @click="$emit('select', user)"
      >
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p class="username">
            @{{ user.username }}
          </p>
          <p class="email">
            📧 {{ user.email }}
          </p>
          <p class="phone">
            📱 {{ user.phone }}
          </p>
          <p class="company">
            🏢 {{ user.company.name }}
          </p>
        </div>

        <div class="user-actions">
          <button
            class="btn btn-sm btn-outline"
            @click.stop="$emit('edit', user)"
          >
            编辑
          </button>
          <button
            class="btn btn-sm btn-danger"
            @click.stop="handleDelete(user)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="!usersLoading && filteredUsers.length === 0" class="empty">
      <p>{{ searchQuery ? '没有找到匹配的用户' : '暂无用户数据' }}</p>
    </div>
  </div>
</template>

<style scoped>
.user-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.user-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  background: #f7fafc;
  cursor: pointer;
  transition: all 0.2s;
}

.user-card:hover {
  border-color: #4299e1;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.1);
}

.user-info h3 {
  margin: 0 0 8px 0;
  color: #2d3748;
}

.username {
  color: #4a5568;
  font-weight: 500;
  margin: 4px 0;
}

.user-info p {
  margin: 4px 0;
  color: #718096;
  font-size: 14px;
}

.user-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-outline {
  background: transparent;
  border: 1px solid #4299e1;
  color: #4299e1;
}

.btn-danger {
  background: #f56565;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:hover {
  opacity: 0.8;
}

.btn:disabled {
  opacity: 0.5;
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
</style>
```

### UserForm.vue

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useUsers } from '@/composables/useUsers'
import { useNotification } from '@/composables/useNotification'
import type { CreateUserRequest, UpdateUserRequest, User } from '@/api/types'

interface Props {
  user?: User
}

const props = defineProps<Props>()

defineEmits<{
  cancel: []
  success: [user: User]
}>()

const { createUser, updateUser } = useUsers()
const { success: showSuccess, error: showError } = useNotification()

const isEdit = computed(() => !!props.user)
const loading = ref(false)
const error = ref<Error | null>(null)

const form = reactive({
  name: '',
  username: '',
  email: '',
  phone: '',
  website: ''
})

// 监听用户数据变化，填充表单
watch(() => props.user, (user) => {
  if (user) {
    form.name = user.name
    form.username = user.username
    form.email = user.email
    form.phone = user.phone || ''
    form.website = user.website || ''
  }
 else {
    // 重置表单
    Object.assign(form, {
      name: '',
      username: '',
      email: '',
      phone: '',
      website: ''
    })
  }
}, { immediate: true })

async function handleSubmit() {
  loading.value = true
  error.value = null

  try {
    let result: User

    if (isEdit.value && props.user) {
      // 编辑模式
      const updateData: UpdateUserRequest = {
        id: props.user.id,
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone || undefined,
        website: form.website || undefined
      }
      result = await updateUser(updateData)
      showSuccess('更新成功', `用户 "${result.name}" 已更新`)
    }
 else {
      // 新增模式
      const createData: CreateUserRequest = {
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone || undefined,
        website: form.website || undefined
      }
      result = await createUser(createData)
      showSuccess('创建成功', `用户 "${result.name}" 已创建`)
    }

    emit('success', result)
  }
 catch (err: any) {
    error.value = err
    showError(
      isEdit.value ? '更新失败' : '创建失败',
      err.message
    )
  }
 finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="user-form">
    <h3>{{ isEdit ? '编辑用户' : '新增用户' }}</h3>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">姓名 *</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          :disabled="loading"
        >
      </div>

      <div class="form-group">
        <label for="username">用户名 *</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          required
          :disabled="loading"
        >
      </div>

      <div class="form-group">
        <label for="email">邮箱 *</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          :disabled="loading"
        >
      </div>

      <div class="form-group">
        <label for="phone">电话</label>
        <input
          id="phone"
          v-model="form.phone"
          type="tel"
          :disabled="loading"
        >
      </div>

      <div class="form-group">
        <label for="website">网站</label>
        <input
          id="website"
          v-model="form.website"
          type="url"
          :disabled="loading"
        >
      </div>

      <div class="form-actions">
        <button type="button" :disabled="loading" @click="$emit('cancel')">
          取消
        </button>
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? '保存中...' : '保存' }}
        </button>
      </div>
    </form>

    <div v-if="error" class="error">
      ❌ {{ error.message }}
    </div>
  </div>
</template>

<style scoped>
.user-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #2d3748;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-group input:disabled {
  background: #f7fafc;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
}

.form-actions button {
  padding: 10px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #4299e1;
  color: white;
  border-color: #4299e1;
}

.form-actions button:hover {
  opacity: 0.8;
}

.form-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  margin-top: 20px;
  padding: 10px;
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 4px;
  color: #c53030;
}
</style>
```

### UserManagement.vue

```vue
<script setup lang="ts">
import { ref } from 'vue'
import UserList from '@/components/UserList.vue'
import UserForm from '@/components/UserForm.vue'
import UserDetail from '@/components/UserDetail.vue'
import NotificationContainer from '@/components/NotificationContainer.vue'
import type { User } from '@/api/types'

type ViewType = 'list' | 'form' | 'detail'

const currentView = ref<ViewType>('list')
const selectedUser = ref<User | undefined>()

function showList() {
  currentView.value = 'list'
  selectedUser.value = undefined
}

function showCreateForm() {
  currentView.value = 'form'
  selectedUser.value = undefined
}

function showEditForm(user: User) {
  currentView.value = 'form'
  selectedUser.value = user
}

function showUserDetail(user: User) {
  currentView.value = 'detail'
  selectedUser.value = user
}

function handleFormSuccess(user: User) {
  showList()
}
</script>

<template>
  <div class="user-management">
    <header class="page-header">
      <h1>用户管理系统</h1>
      <p>基于 @ldesign/http 构建的完整示例</p>
    </header>

    <!-- 用户列表 -->
    <UserList
      v-if="currentView === 'list'"
      @create="showCreateForm"
      @edit="showEditForm"
      @select="showUserDetail"
    />

    <!-- 用户表单 -->
    <UserForm
      v-else-if="currentView === 'form'"
      :user="selectedUser"
      @cancel="showList"
      @success="handleFormSuccess"
    />

    <!-- 用户详情 -->
    <UserDetail
      v-else-if="currentView === 'detail'"
      :user="selectedUser!"
      @edit="showEditForm"
      @back="showList"
    />

    <!-- 通知组件 -->
    <NotificationContainer />
  </div>
</template>

<style scoped>
.user-management {
  min-height: 100vh;
  background: #f7fafc;
}

.page-header {
  background: white;
  padding: 30px 20px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 10px 0;
  color: #2d3748;
  font-size: 2.5em;
}

.page-header p {
  margin: 0;
  color: #718096;
  font-size: 1.1em;
}
</style>
```

## 运行示例

### 1. 安装依赖

```bash
npm install @ldesign/http vue@^3.0.0
```

### 2. 配置 main.ts

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import { createHttpPlugin } from '@ldesign/http'

const app = createApp(App)

// 安装HTTP插件
app.use(createHttpPlugin({
  baseURL: 'https://jsonplaceholder.typicode.com'
}))

app.mount('#app')
```

### 3. 使用组件

```vue
<script setup lang="ts">
import UserManagement from '@/views/UserManagement.vue'
</script>

<template>
  <div id="app">
    <UserManagement />
  </div>
</template>
```

## 功能特性

这个完整示例展示了以下功能：

### ✅ 核心功能
- 用户列表展示
- 用户创建和编辑
- 用户删除
- 用户详情查看
- 实时搜索

### ✅ HTTP功能
- 多种HTTP方法（GET、POST、PUT、DELETE）
- 请求缓存
- 自动重试
- 错误处理
- 加载状态管理

### ✅ Vue3集成
- 组合式函数
- 响应式状态
- 自动请求取消
- 类型安全

### ✅ 用户体验
- 加载状态提示
- 错误信息展示
- 成功操作反馈
- 确认对话框

## 扩展建议

你可以基于这个示例继续扩展：

1. **分页功能** - 添加分页组件和API
2. **高级搜索** - 支持多字段搜索和过滤
3. **批量操作** - 支持批量删除和编辑
4. **文件上传** - 添加头像上传功能
5. **权限控制** - 基于角色的访问控制
6. **离线支持** - 使用缓存实现离线功能

这个示例展示了 @ldesign/http 在实际项目中的强大能力和灵活性。
