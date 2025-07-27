# 组合式函数

@ldesign/http 为 Vue 3 提供了丰富的组合式函数，让你能够以声明式的方式处理HTTP请求。

## 🎯 核心组合式函数

### useRequest

通用请求组合式函数，是其他所有HTTP方法函数的基础。

```typescript
function useRequest<T>(
  url: MaybeRef<string | null>,
  options?: UseRequestOptions<T>
): UseRequestResult<T>
```

**基础用法:**
```vue
<script setup lang="ts">
import { useRequest } from '@ldesign/http'

const { data, loading, error, execute, cancel } = useRequest('/api/users', {
  immediate: true, // 立即执行
  onSuccess: (data) => {
    console.log('请求成功:', data)
  },
  onError: (error) => {
    console.error('请求失败:', error)
  }
})
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
      {{ data }}
    </div>

    <button @click="execute">
      重新请求
    </button>
    <button @click="cancel">
      取消请求
    </button>
  </div>
</template>
```

**动态URL:**
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRequest } from '@ldesign/http'

const userId = ref(1)

// URL会随着userId的变化而自动更新
const { data: user } = useRequest(() =>
  userId.value ? `/api/users/${userId.value}` : null
)

// 切换用户
function switchUser(id: number) {
  userId.value = id // 会自动触发新的请求
}
</script>
```

### useGet

GET 请求的专用组合式函数。

```typescript
function useGet<T>(
  url: MaybeRef<string | null>,
  options?: UseRequestOptions<T>
): UseRequestResult<T>
```

**示例:**
```vue
<script setup lang="ts">
import { useGet } from '@ldesign/http'

interface User {
  id: number
  name: string
  email: string
}

const {
  data: users,
  loading,
  error,
  refresh
} = useGet<User[]>('/api/users')
</script>

<template>
  <div>
    <h2>用户列表</h2>
    <div v-if="loading">
      加载中...
    </div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} - {{ user.email }}
      </li>
    </ul>
    <button @click="refresh">
      刷新
    </button>
  </div>
</template>
```

### usePost

POST 请求的专用组合式函数。

```typescript
function usePost<T>(
  url: MaybeRef<string>,
  options?: UseRequestOptions<T>
): UseRequestResult<T>
```

**示例:**
```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { usePost } from '@ldesign/http'

const form = reactive({
  name: '',
  email: ''
})

const { data, loading, error, execute } = usePost('/api/users', {
  immediate: false, // 不立即执行
  onSuccess: () => {
    // 重置表单
    form.name = ''
    form.email = ''
  }
})

function handleSubmit() {
  execute({ data: form })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.name" placeholder="姓名" required>
    <input v-model="form.email" placeholder="邮箱" required>
    <button type="submit" :disabled="loading">
      {{ loading ? '创建中...' : '创建用户' }}
    </button>
  </form>

  <div v-if="error" class="error">
    {{ error.message }}
  </div>

  <div v-if="data" class="success">
    用户创建成功: {{ data.name }}
  </div>
</template>
```

### usePut

PUT 请求的专用组合式函数。

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { usePut } from '@ldesign/http'

const props = defineProps<{ userId: number }>()

const userForm = reactive({
  name: '',
  email: ''
})

const { loading: updating, execute: updateUser } = usePut(
  () => `/api/users/${props.userId}`,
  {
    immediate: false,
    onSuccess: () => {
      console.log('用户更新成功')
    }
  }
)

function handleUpdate() {
  updateUser({ data: userForm })
}
</script>

<template>
  <form @submit.prevent="updateUser">
    <input v-model="userForm.name">
    <input v-model="userForm.email">
    <button type="submit" :disabled="updating">
      {{ updating ? '更新中...' : '更新用户' }}
    </button>
  </form>
</template>
```

### useDelete

DELETE 请求的专用组合式函数。

```vue
<script setup lang="ts">
import { useDelete } from '@ldesign/http'

const props = defineProps<{ userId: number }>()
const emit = defineEmits<{ deleted: [id: number] }>()

const { loading: deleting, execute: deleteUser } = useDelete(
  () => `/api/users/${props.userId}`,
  {
    immediate: false,
    onSuccess: () => {
      emit('deleted', props.userId)
    }
  }
)
</script>

<template>
  <div>
    <button :disabled="deleting" @click="deleteUser">
      {{ deleting ? '删除中...' : '删除用户' }}
    </button>
  </div>
</template>
```

## 🔧 配置选项

### UseRequestOptions

```typescript
interface UseRequestOptions<T> extends RequestConfig {
  // 执行控制
  immediate?: boolean // 是否立即执行 (默认: true)
  initialData?: T // 初始数据
  resetOnExecute?: boolean // 执行时是否重置状态 (默认: true)

  // 生命周期回调
  onSuccess?: (data: T, response: HttpResponse<T>) => void
  onError?: (error: HttpError) => void
  onFinally?: () => void

  // 依赖项
  deps?: Ref<any>[] | (() => any[]) // 依赖项变化时重新执行

  // 防抖和节流
  debounce?: number // 防抖延迟 (毫秒)
  throttle?: number // 节流间隔 (毫秒)

  // 缓存配置
  cache?: {
    enabled?: boolean
    ttl?: number
    key?: string
  }

  // 重试配置
  retry?: {
    retries?: number
    retryDelay?: number
  }
}
```

### UseRequestResult

```typescript
interface UseRequestResult<T> {
  // 响应式状态
  data: Ref<T | null> // 响应数据
  loading: Ref<boolean> // 加载状态
  error: Ref<HttpError | null> // 错误信息
  finished: Ref<boolean> // 是否完成
  cancelled: Ref<boolean> // 是否被取消

  // 操作方法
  execute: (config?: Partial<RequestConfig>) => Promise<HttpResponse<T>>
  cancel: (reason?: string) => void
  reset: () => void // 重置状态
  refresh: () => Promise<HttpResponse<T>> // 刷新 (重新执行)
}
```

## 🎨 高级用法

### 依赖项监听

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useGet } from '@ldesign/http'

const searchQuery = ref('')
const pageSize = ref(10)
const currentPage = ref(1)

// 当依赖项变化时自动重新请求
const { data: searchResults } = useGet('/api/search', {
  params: () => ({
    q: searchQuery.value,
    page: currentPage.value,
    size: pageSize.value
  }),
  deps: [searchQuery, currentPage, pageSize], // 依赖项
  debounce: 300 // 防抖300ms
})
</script>
```

### 条件请求

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGet } from '@ldesign/http'

const userId = ref<number | null>(null)

// 只有当userId有值时才发送请求
const { data: userProfile } = useGet(
  computed(() => userId.value ? `/api/users/${userId.value}` : null)
)
</script>
```

### 分页处理

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useGet } from '@ldesign/http'

interface PaginatedResponse<T> {
  items: T[]
  currentPage: number
  totalPages: number
  totalItems: number
}

const currentPage = ref(1)
const pageSize = ref(10)

const { data, loading, error } = useGet<PaginatedResponse<any>>('/api/items', {
  params: () => ({
    page: currentPage.value,
    size: pageSize.value
  }),
  deps: [currentPage, pageSize]
})

function nextPage() {
  if (data.value && currentPage.value < data.value.totalPages) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}
</script>

<template>
  <div>
    <div v-if="loading && !data">
      首次加载中...
    </div>

    <div v-if="data">
      <div v-for="item in data.items" :key="item.id">
        {{ item.name }}
      </div>

      <div class="pagination">
        <button
          :disabled="currentPage <= 1 || loading"
          @click="prevPage"
        >
          上一页
        </button>

        <span>第 {{ currentPage }} 页，共 {{ data.totalPages }} 页</span>

        <button
          :disabled="currentPage >= data.totalPages || loading"
          @click="nextPage"
        >
          下一页
        </button>
      </div>
    </div>

    <div v-if="loading && data" class="loading-overlay">
      加载中...
    </div>
  </div>
</template>
```

### 文件上传

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usePost } from '@ldesign/http'

const fileInput = ref<HTMLInputElement>()
const uploadProgress = ref(0)

const {
  data: uploadResult,
  loading: uploading,
  execute: upload,
  cancel: cancelUpload
} = usePost('/api/upload', {
  immediate: false,
  onUploadProgress: (progress) => {
    uploadProgress.value = progress.percentage
  },
  onSuccess: () => {
    uploadProgress.value = 0
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
})

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const formData = new FormData()
    formData.append('file', file)

    upload({
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
</script>

<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      :disabled="uploading"
      @change="handleFileSelect"
    >

    <div v-if="uploading" class="upload-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${uploadProgress}%` }"
        />
      </div>
      <span>{{ uploadProgress.toFixed(1) }}%</span>
      <button @click="cancelUpload">
        取消
      </button>
    </div>

    <div v-if="uploadResult">
      上传成功: {{ uploadResult.filename }}
    </div>
  </div>
</template>
```

## 🔄 状态管理集成

### Pinia 集成

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { useDelete, useGet, usePost, usePut } from '@ldesign/http'

export const useUserStore = defineStore('user', () => {
  // 获取用户列表
  const {
    data: users,
    loading: loadingUsers,
    refresh: refreshUsers
  } = useGet<User[]>('/api/users')

  // 创建用户
  const {
    loading: creatingUser,
    execute: createUser
  } = usePost('/api/users', {
    immediate: false,
    onSuccess: () => {
      refreshUsers() // 创建成功后刷新列表
    }
  })

  // 更新用户
  const updateUser = async (id: number, userData: Partial<User>) => {
    const { execute } = usePut(`/api/users/${id}`, {
      immediate: false,
      onSuccess: () => {
        refreshUsers()
      }
    })

    return execute({ data: userData })
  }

  // 删除用户
  const deleteUser = async (id: number) => {
    const { execute } = useDelete(`/api/users/${id}`, {
      immediate: false,
      onSuccess: () => {
        refreshUsers()
      }
    })

    return execute()
  }

  return {
    users,
    loadingUsers,
    creatingUser,
    refreshUsers,
    createUser,
    updateUser,
    deleteUser
  }
})
```

### Vuex 集成

```typescript
// store/modules/api.ts
import { useRequest } from '@ldesign/http'

export default {
  namespaced: true,

  state: () => ({
    users: [],
    loading: false,
    error: null
  }),

  mutations: {
    SET_USERS(state, users) {
      state.users = users
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    }
  },

  actions: {
    async fetchUsers({ commit }) {
      const { data, loading, error, execute } = useRequest('/api/users', {
        immediate: false
      })

      // 监听状态变化
      watch(loading, (newLoading) => {
        commit('SET_LOADING', newLoading)
      })

      watch(error, (newError) => {
        commit('SET_ERROR', newError)
      })

      watch(data, (newData) => {
        if (newData) {
          commit('SET_USERS', newData)
        }
      })

      return execute()
    }
  }
}
```

## 🧪 测试

### 组合式函数测试

```typescript
// tests/composables/useRequest.test.ts
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useRequest } from '@ldesign/http'

// 模拟组件
const TestComponent = {
  template: '<div>{{ data }}</div>',
  setup() {
    return useRequest('/api/test')
  }
}

describe('useRequest', () => {
  it('应该正确处理成功响应', async () => {
    // 模拟HTTP响应
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'success' })
    })

    const wrapper = mount(TestComponent)

    // 等待请求完成
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.data).toEqual({ message: 'success' })
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBe(null)
  })

  it('应该正确处理错误响应', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network Error'))

    const wrapper = mount(TestComponent)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.data).toBe(null)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeTruthy()
  })
})
```

## 📚 最佳实践

### 1. 合理使用immediate

```typescript
// ✅ 页面数据立即加载
const { data: pageData } = useGet('/api/page-data', {
  immediate: true
})

// ✅ 用户操作触发的请求
const { execute: saveData } = usePost('/api/save', {
  immediate: false
})
```

### 2. 错误处理

```typescript
// ✅ 全局错误处理
const { data, error } = useGet('/api/data', {
  onError: (error) => {
    // 记录错误
    console.error('API Error:', error)

    // 显示用户友好的错误信息
    if (error.status === 401) {
      showMessage('登录已过期，请重新登录')
    }
 else if (error.status >= 500) {
      showMessage('服务器错误，请稍后重试')
    }
  }
})
```

### 3. 性能优化

```typescript
// ✅ 使用缓存减少重复请求
const { data: config } = useGet('/api/config', {
  cache: {
    enabled: true,
    ttl: 60 * 60 * 1000 // 1小时缓存
  }
})

// ✅ 防抖搜索请求
const { data: searchResults } = useGet('/api/search', {
  params: () => ({ q: searchQuery.value }),
  deps: [searchQuery],
  debounce: 300 // 300ms防抖
})
```

## 📚 下一步

了解组合式函数后，你可以继续学习：

- [Vue插件](/vue/plugin) - Vue插件安装和配置
- [最佳实践](/vue/best-practices) - Vue集成最佳实践
- [示例项目](/examples/complete-demo) - 完整的Vue项目示例
- [性能优化](/guide/performance) - 性能优化技巧
