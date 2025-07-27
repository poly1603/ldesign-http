<!--
  @ldesign/http Vue3 使用示例
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useGet, usePost, useRequest } from '../src/vue'

// 类型定义
interface User {
  id: number
  name: string
  email: string
  phone?: string
  website?: string
}

// 基础GET请求 - 获取用户列表
const {
  data: users,
  loading: usersLoading,
  error: usersError,
  refresh: refreshUsers,
} = useGet<User[]>('https://jsonplaceholder.typicode.com/users')

// POST请求 - 创建用户
const newUser = reactive({
  name: '',
  email: '',
})

const {
  data: createdUser,
  loading: createUserLoading,
  error: createUserError,
  execute: executeCreateUser,
} = usePost<User>('https://jsonplaceholder.typicode.com/users', {
  immediate: false,
  onSuccess: (data) => {
    console.log('用户创建成功:', data)
    // 重置表单
    newUser.name = ''
    newUser.email = ''
  },
})

async function handleCreateUser() {
  await executeCreateUser({
    data: { ...newUser },
  })
}

// 动态URL请求 - 获取单个用户
const selectedUserId = ref(1)

const {
  data: user,
  loading: userLoading,
  error: userError,
} = useGet<User>(() => `https://jsonplaceholder.typicode.com/users/${selectedUserId.value}`)

// 手动控制请求
const {
  data: manualData,
  loading: manualLoading,
  error: manualError,
  execute: executeManualRequest,
  cancel: cancelManualRequest,
  reset: resetManualRequest,
} = useRequest<any[]>('https://jsonplaceholder.typicode.com/posts', {
  immediate: false,
  onSuccess: (data) => {
    console.log('手动请求成功:', data.length, '条数据')
  },
  onError: (error) => {
    console.error('手动请求失败:', error.message)
  },
})

// 工具函数
function getStatusClass(loading: boolean, error: any, data: any) {
  if (loading)
return 'status-loading'
  if (error)
return 'status-error'
  if (data)
return 'status-success'
  return 'status-idle'
}

function getStatusText(loading: boolean, error: any, data: any) {
  if (loading)
return '加载中'
  if (error)
return '错误'
  if (data)
return '成功'
  return '空闲'
}
</script>

<template>
  <div class="http-examples">
    <h1>@ldesign/http Vue3 使用示例</h1>

    <!-- 基础GET请求示例 -->
    <section class="example-section">
      <h2>基础GET请求</h2>
      <div v-if="usersLoading" class="loading">
        加载中...
      </div>
      <div v-else-if="usersError" class="error">
        错误: {{ usersError.message }}
        <button @click="refreshUsers">
          重试
        </button>
      </div>
      <div v-else class="users-list">
        <h3>用户列表 ({{ users?.length || 0 }})</h3>
        <ul>
          <li v-for="user in users" :key="user.id">
            {{ user.name }} - {{ user.email }}
          </li>
        </ul>
        <button @click="refreshUsers">
          刷新
        </button>
      </div>
    </section>

    <!-- POST请求示例 -->
    <section class="example-section">
      <h2>POST请求</h2>
      <form @submit.prevent="handleCreateUser">
        <div class="form-group">
          <label>姓名:</label>
          <input v-model="newUser.name" type="text" required>
        </div>
        <div class="form-group">
          <label>邮箱:</label>
          <input v-model="newUser.email" type="email" required>
        </div>
        <button type="submit" :disabled="createUserLoading">
          {{ createUserLoading ? '创建中...' : '创建用户' }}
        </button>
      </form>

      <div v-if="createUserError" class="error">
        创建失败: {{ createUserError.message }}
      </div>
      <div v-if="createdUser" class="success">
        用户创建成功: {{ createdUser.name }}
      </div>
    </section>

    <!-- 动态URL示例 -->
    <section class="example-section">
      <h2>动态URL请求</h2>
      <div class="form-group">
        <label>用户ID:</label>
        <input v-model.number="selectedUserId" type="number" min="1" max="10">
      </div>

      <div v-if="userLoading" class="loading">
        加载用户信息...
      </div>
      <div v-else-if="userError" class="error">
        错误: {{ userError.message }}
      </div>
      <div v-else-if="user" class="user-detail">
        <h3>用户详情</h3>
        <p><strong>ID:</strong> {{ user.id }}</p>
        <p><strong>姓名:</strong> {{ user.name }}</p>
        <p><strong>邮箱:</strong> {{ user.email }}</p>
        <p><strong>电话:</strong> {{ user.phone }}</p>
        <p><strong>网站:</strong> {{ user.website }}</p>
      </div>
    </section>

    <!-- 手动控制示例 -->
    <section class="example-section">
      <h2>手动控制请求</h2>
      <div class="controls">
        <button :disabled="manualLoading" @click="executeManualRequest">
          {{ manualLoading ? '请求中...' : '发送请求' }}
        </button>
        <button :disabled="!manualLoading" @click="cancelManualRequest">
          取消请求
        </button>
        <button @click="resetManualRequest">
          重置状态
        </button>
      </div>

      <div v-if="manualLoading" class="loading">
        手动请求进行中...
      </div>
      <div v-else-if="manualError" class="error">
        请求失败: {{ manualError.message }}
      </div>
      <div v-else-if="manualData" class="success">
        请求成功: 获取到 {{ manualData.length }} 条数据
      </div>
    </section>

    <!-- 请求状态展示 -->
    <section class="example-section">
      <h2>请求状态</h2>
      <div class="status-grid">
        <div class="status-item">
          <label>用户列表:</label>
          <span :class="getStatusClass(usersLoading, usersError, users)">
            {{ getStatusText(usersLoading, usersError, users) }}
          </span>
        </div>
        <div class="status-item">
          <label>创建用户:</label>
          <span :class="getStatusClass(createUserLoading, createUserError, createdUser)">
            {{ getStatusText(createUserLoading, createUserError, createdUser) }}
          </span>
        </div>
        <div class="status-item">
          <label>用户详情:</label>
          <span :class="getStatusClass(userLoading, userError, user)">
            {{ getStatusText(userLoading, userError, user) }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.http-examples {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.example-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.example-section h2 {
  margin-top: 0;
  color: #333;
}

.loading {
  color: #007bff;
  font-weight: bold;
}

.error {
  color: #dc3545;
  padding: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin: 10px 0;
}

.success {
  color: #155724;
  padding: 10px;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  margin: 10px 0;
}

.users-list ul {
  list-style-type: none;
  padding: 0;
}

.users-list li {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.user-detail {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.controls {
  margin-bottom: 15px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.status-item label {
  font-weight: bold;
}

.status-loading {
  color: #007bff;
}

.status-error {
  color: #dc3545;
}

.status-success {
  color: #28a745;
}

.status-idle {
  color: #6c757d;
}
</style>
