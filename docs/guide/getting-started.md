# 快速开始

本指南将帮助你快速上手 @ldesign/http。

## 安装

::: code-group

```bash [pnpm]
pnpm add @ldesign/http
```

```bash [npm]
npm install @ldesign/http
```

```bash [yarn]
yarn add @ldesign/http
```

:::

## 基础使用

### 创建客户端

```typescript
import { createHttpClient } from '@ldesign/http'

const http = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### 发送请求

```typescript
// GET 请求
const users = await http.get('/users')
console.log(users.data)

// POST 请求
const newUser = await http.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// PUT 请求
const updatedUser = await http.put('/users/1', {
  name: 'Jane Doe',
  email: 'jane@example.com'
})

// DELETE 请求
await http.delete('/users/1')
```

## Vue3 集成

### 安装插件

```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http'
import App from './App.vue'

const app = createApp(App)

// 安装HTTP插件
app.use(createHttpPlugin({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000
}))

app.mount('#app')
```

### 在组件中使用

```vue
<template>
  <div>
    <!-- 用户列表 -->
    <div v-if="usersLoading">加载用户中...</div>
    <div v-else-if="usersError" class="error">
      加载失败: {{ usersError.message }}
      <button @click="refreshUsers">重试</button>
    </div>
    <div v-else>
      <h2>用户列表</h2>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }} - {{ user.email }}
        </li>
      </ul>
      <button @click="refreshUsers">刷新</button>
    </div>

    <!-- 创建用户 -->
    <div class="create-user">
      <h2>创建用户</h2>
      <form @submit.prevent="handleCreateUser">
        <input v-model="newUser.name" placeholder="姓名" required />
        <input v-model="newUser.email" placeholder="邮箱" type="email" required />
        <button type="submit" :disabled="createLoading">
          {{ createLoading ? '创建中...' : '创建用户' }}
        </button>
      </form>
      <div v-if="createError" class="error">
        创建失败: {{ createError.message }}
      </div>
      <div v-if="createdUser" class="success">
        用户创建成功: {{ createdUser.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useGet, usePost } from '@ldesign/http'

// 定义用户类型
interface User {
  id: number
  name: string
  email: string
}

// 获取用户列表
const {
  data: users,
  loading: usersLoading,
  error: usersError,
  refresh: refreshUsers
} = useGet<User[]>('/users')

// 创建用户
const newUser = reactive({
  name: '',
  email: ''
})

const {
  data: createdUser,
  loading: createLoading,
  error: createError,
  execute: executeCreate
} = usePost<User>('/users', {
  immediate: false,
  onSuccess: () => {
    // 重置表单
    newUser.name = ''
    newUser.email = ''
    // 刷新用户列表
    refreshUsers()
  }
})

const handleCreateUser = () => {
  executeCreate({
    data: { ...newUser }
  })
}
</script>

<style scoped>
.error {
  color: #f56565;
  margin: 10px 0;
}

.success {
  color: #48bb78;
  margin: 10px 0;
}

.create-user {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.create-user input {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.create-user button {
  padding: 10px 20px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.create-user button:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}
</style>
```

## 真实API示例

让我们使用一些真实的公开API来演示功能：

### JSONPlaceholder API

```typescript
import { createHttpClient } from '@ldesign/http'

// 创建客户端
const api = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com'
})

// 获取所有用户
const users = await api.get('/users')
console.log('用户数量:', users.data.length)

// 获取特定用户
const user = await api.get('/users/1')
console.log('用户信息:', user.data.name)

// 获取用户的文章
const posts = await api.get('/posts?userId=1')
console.log('用户文章数:', posts.data.length)

// 创建新文章
const newPost = await api.post('/posts', {
  title: '我的第一篇文章',
  body: '这是文章内容...',
  userId: 1
})
console.log('新文章ID:', newPost.data.id)
```

### GitHub API

```typescript
const github = createHttpClient({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json'
  }
})

// 获取用户信息
const user = await github.get('/users/octocat')
console.log('GitHub用户:', user.data.login)

// 获取仓库信息
const repos = await github.get('/users/octocat/repos')
console.log('仓库数量:', repos.data.length)
```

### 天气API (OpenWeatherMap)

```typescript
const weather = createHttpClient({
  baseURL: 'https://api.openweathermap.org/data/2.5'
})

// 获取天气信息 (需要API key)
const weatherData = await weather.get('/weather', {
  params: {
    q: 'Beijing',
    appid: 'your-api-key',
    units: 'metric',
    lang: 'zh_cn'
  }
})
console.log('北京天气:', weatherData.data.weather[0].description)
```

## 快速配置

使用 `createQuickClient` 快速创建带有常用功能的客户端：

```typescript
import { createQuickClient } from '@ldesign/http'

const client = createQuickClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  adapter: 'fetch',
  enableCache: true,    // 启用缓存
  enableRetry: true,    // 启用重试
  enableLog: true,      // 启用日志
  authToken: () => localStorage.getItem('token') // 自动添加认证
})

// 现在客户端已经配置了缓存、重试、日志和认证功能
const response = await client.get('/protected-data')
```

## 错误处理

```typescript
try {
  const response = await http.get('/users/999')
} catch (error) {
  if (error.response?.status === 404) {
    console.log('用户不存在')
  } else if (error.isNetworkError) {
    console.log('网络连接失败')
  } else if (error.isTimeoutError) {
    console.log('请求超时')
  } else {
    console.log('其他错误:', error.message)
  }
}
```

## 下一步

现在你已经了解了基本用法，可以继续学习：

- [配置选项](/guide/configuration) - 了解所有可用的配置选项
- [适配器](/guide/adapters) - 学习如何使用不同的适配器
- [插件](/plugins/) - 了解如何使用和创建插件
- [Vue集成](/vue/) - 深入了解Vue3集成功能
