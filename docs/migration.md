# 迁移指南

本指南帮助你从其他HTTP库迁移到 @ldesign/http。

## 🔄 从 Axios 迁移

### 基础用法对比

#### 创建实例

```typescript
// Axios
import axios from 'axios'
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000
})

// @ldesign/http
import { createHttpClient } from '@ldesign/http'
const api = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
})
```

#### HTTP 方法

```typescript
// Axios
const response = await api.get('/users')
const user = await api.post('/users', userData)
const updated = await api.put('/users/1', userData)
await api.delete('/users/1')

// @ldesign/http (完全相同)
const response = await api.get('/users')
const user = await api.post('/users', userData)
const updated = await api.put('/users/1', userData)
await api.delete('/users/1')
```

#### 请求配置

```typescript
// Axios
const response = await api.get('/users', {
  params: { page: 1 },
  headers: { 'Accept': 'application/json' },
  timeout: 5000
})

// @ldesign/http (完全相同)
const response = await api.get('/users', {
  params: { page: 1 },
  headers: { 'Accept': 'application/json' },
  timeout: 5000
})
```

### 拦截器迁移

```typescript
// Axios
api.interceptors.request.use(
  config => {
    config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 处理未授权
    }
    return Promise.reject(error)
  }
)

// @ldesign/http
api.addRequestInterceptor({
  onFulfilled: config => {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    }
    return config
  },
  onRejected: error => Promise.reject(error)
})

api.addResponseInterceptor({
  onFulfilled: response => response,
  onRejected: error => {
    if (error.response?.status === 401) {
      // 处理未授权
    }
    return Promise.reject(error)
  }
})
```

### 取消请求

```typescript
// Axios
const source = axios.CancelToken.source()
const request = api.get('/users', {
  cancelToken: source.token
})
source.cancel('Operation canceled')

// @ldesign/http
const cancelToken = api.createCancelToken()
const request = api.get('/users', {
  cancelToken
})
cancelToken.cancel('Operation canceled')
```

### 错误处理

```typescript
// Axios
try {
  const response = await api.get('/users')
} catch (error) {
  if (axios.isCancel(error)) {
    console.log('Request canceled')
  } else if (error.response) {
    console.log('Error status:', error.response.status)
  } else if (error.request) {
    console.log('Network error')
  }
}

// @ldesign/http
try {
  const response = await api.get('/users')
} catch (error: any) {
  if (error.isCancelError) {
    console.log('Request canceled')
  } else if (error.response) {
    console.log('Error status:', error.response.status)
  } else if (error.isNetworkError) {
    console.log('Network error')
  }
}
```

## 🌐 从 Fetch 迁移

### 基础用法对比

```typescript
// 原生 Fetch
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(userData)
})

if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`)
}

const data = await response.json()

// @ldesign/http
const api = createHttpClient({
  baseURL: 'https://api.example.com'
})

const response = await api.post('/users', userData)
const data = response.data // 自动解析JSON
```

### 错误处理

```typescript
// Fetch (需要手动检查)
const response = await fetch('/api/users')
if (!response.ok) {
  if (response.status === 404) {
    throw new Error('Users not found')
  } else if (response.status >= 500) {
    throw new Error('Server error')
  }
  throw new Error(`HTTP error! status: ${response.status}`)
}

// @ldesign/http (自动错误处理)
try {
  const response = await api.get('/users')
} catch (error: any) {
  if (error.status === 404) {
    console.log('Users not found')
  } else if (error.status >= 500) {
    console.log('Server error')
  }
}
```

### 请求取消

```typescript
// Fetch
const controller = new AbortController()
const response = await fetch('/api/users', {
  signal: controller.signal
})
controller.abort()

// @ldesign/http
const cancelToken = api.createCancelToken()
const response = await api.get('/users', { cancelToken })
cancelToken.cancel()
```

## 🚀 从 Alova 迁移

### 基础用法

```typescript
// Alova
import { createAlova } from 'alova'
import GlobalFetch from 'alova/GlobalFetch'

const alova = createAlova({
  baseURL: 'https://api.example.com',
  statesHook: VueHook,
  requestAdapter: GlobalFetch()
})

const userGetter = alova.Get('/users')
const users = await userGetter

// @ldesign/http
const api = createHttpClient({
  baseURL: 'https://api.example.com'
})

const response = await api.get('/users')
const users = response.data
```

### Vue 集成

```typescript
// Alova
const { loading, data, error } = useRequest(userGetter)

// @ldesign/http
const { loading, data, error } = useGet('/users')
```

## 📦 从其他库迁移

### 通用迁移步骤

1. **安装 @ldesign/http**
   ```bash
   pnpm add @ldesign/http
   ```

2. **替换导入**
   ```typescript
   // 旧的导入
   import axios from 'axios'
   // 或
   import { request } from 'other-lib'
   
   // 新的导入
   import { createHttpClient } from '@ldesign/http'
   ```

3. **创建客户端实例**
   ```typescript
   const api = createHttpClient({
     baseURL: 'your-api-base-url',
     // 其他配置...
   })
   ```

4. **更新请求调用**
   ```typescript
   // 大多数情况下，只需要更改实例创建方式
   // HTTP方法调用保持不变
   const response = await api.get('/endpoint')
   ```

5. **迁移拦截器**
   ```typescript
   // 使用新的拦截器API
   api.addRequestInterceptor({
     onFulfilled: (config) => {
       // 请求拦截逻辑
       return config
     }
   })
   ```

6. **更新错误处理**
   ```typescript
   try {
     const response = await api.get('/data')
   } catch (error: any) {
     // 使用新的错误属性
     if (error.isNetworkError) {
       // 网络错误处理
     }
   }
   ```

## 🎯 Vue 项目迁移

### 从 Vue-Axios 迁移

```typescript
// 旧的方式 (vue-axios)
import axios from 'axios'
import VueAxios from 'vue-axios'

app.use(VueAxios, axios)

// 组件中使用
this.axios.get('/users').then(response => {
  this.users = response.data
})

// 新的方式 (@ldesign/http)
import { createHttpPlugin } from '@ldesign/http'

app.use(createHttpPlugin({
  baseURL: 'https://api.example.com'
}))

// 组件中使用
const { data: users } = useGet('/users')
```

### 从 @vue/composition-api 迁移

```typescript
// 旧的方式
import { ref, onMounted } from '@vue/composition-api'
import axios from 'axios'

export default {
  setup() {
    const users = ref([])
    const loading = ref(false)
    
    const fetchUsers = async () => {
      loading.value = true
      try {
        const response = await axios.get('/users')
        users.value = response.data
      } finally {
        loading.value = false
      }
    }
    
    onMounted(fetchUsers)
    
    return { users, loading, fetchUsers }
  }
}

// 新的方式
import { useGet } from '@ldesign/http'

export default {
  setup() {
    const { data: users, loading, refresh: fetchUsers } = useGet('/users')
    
    return { users, loading, fetchUsers }
  }
}
```

## 🔧 配置迁移

### 环境配置

```typescript
// 旧的配置文件
// config/axios.js
export const axiosConfig = {
  development: {
    baseURL: 'http://localhost:3000/api'
  },
  production: {
    baseURL: 'https://api.example.com'
  }
}

// 新的配置文件
// config/http.ts
export const httpConfig = {
  development: {
    baseURL: 'http://localhost:3000/api',
    enableLog: true,
    enableCache: false
  },
  production: {
    baseURL: 'https://api.example.com',
    enableLog: false,
    enableCache: true
  }
}
```

### 插件配置

```typescript
// 旧的插件配置
axios.defaults.timeout = 10000
axios.interceptors.request.use(/* ... */)
axios.interceptors.response.use(/* ... */)

// 新的插件配置
const client = createQuickClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  enableCache: true,
  enableRetry: true,
  enableLog: true
})
```

## ⚠️ 注意事项

### 破坏性变更

1. **响应结构**
   ```typescript
   // 某些库可能直接返回数据
   const users = await oldLib.get('/users') // 直接是数组
   
   // @ldesign/http 返回完整响应对象
   const response = await api.get('/users')
   const users = response.data // 需要访问 .data 属性
   ```

2. **错误对象**
   ```typescript
   // 错误属性可能不同
   // 需要更新错误处理逻辑
   if (error.isNetworkError) { // 新的属性名
     // 处理网络错误
   }
   ```

3. **拦截器API**
   ```typescript
   // 拦截器API有所不同
   // 需要使用新的方法名和参数结构
   ```

### 兼容性考虑

1. **TypeScript 支持**
   - @ldesign/http 提供完整的 TypeScript 支持
   - 可能需要更新类型定义

2. **浏览器兼容性**
   - 检查目标浏览器是否支持
   - 可能需要添加 polyfill

3. **包大小**
   - @ldesign/http 可能比某些库更大或更小
   - 考虑对构建大小的影响

## 🧪 迁移测试

### 测试策略

1. **渐进式迁移**
   ```typescript
   // 可以同时使用两个库进行对比测试
   const oldResponse = await oldLib.get('/users')
   const newResponse = await newLib.get('/users')
   
   console.assert(
     JSON.stringify(oldResponse) === JSON.stringify(newResponse.data),
     'Response mismatch'
   )
   ```

2. **功能测试**
   ```typescript
   // 确保所有功能都正常工作
   describe('Migration Tests', () => {
     it('should get users', async () => {
       const response = await api.get('/users')
       expect(response.data).toBeDefined()
     })
     
     it('should handle errors', async () => {
       try {
         await api.get('/nonexistent')
       } catch (error: any) {
         expect(error.status).toBe(404)
       }
     })
   })
   ```

## 📚 迁移检查清单

- [ ] 安装 @ldesign/http
- [ ] 更新导入语句
- [ ] 创建新的客户端实例
- [ ] 迁移请求调用
- [ ] 更新拦截器
- [ ] 修改错误处理
- [ ] 更新类型定义
- [ ] 测试所有功能
- [ ] 更新文档
- [ ] 移除旧依赖

## 🆘 获取帮助

如果在迁移过程中遇到问题：

- [GitHub Issues](https://github.com/your-org/ldesign/issues) - 报告问题
- [GitHub Discussions](https://github.com/your-org/ldesign/discussions) - 讨论和提问
- [示例项目](/examples/) - 查看完整示例
- [API文档](/api/) - 详细的API参考

迁移愉快！ 🎉
