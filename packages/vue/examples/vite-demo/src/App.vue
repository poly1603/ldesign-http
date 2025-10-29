<script setup lang="ts">
import { ref } from 'vue'
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-core/adapters'

const message = ref('Hello HTTP Vue!')
const loading = ref(false)
const data = ref<any>(null)
const error = ref<string | null>(null)

// 创建 HTTP 客户端
const client = createHttpClient(
  {
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
  },
  new FetchAdapter()
)

async function fetchUser() {
  loading.value = true
  error.value = null
  
  try {
    const response = await client.get('/users/1')
    data.value = response.data
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    loading.value = false
  }
}

async function fetchUsers() {
  loading.value = true
  error.value = null
  
  try {
    const response = await client.get('/users', {
      params: { _limit: 5 }
    })
    data.value = response.data
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    loading.value = false
  }
}

async function createUser() {
  loading.value = true
  error.value = null
  
  try {
    const response = await client.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    })
    data.value = response.data
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1>{{ message }}</h1>
    <p>Vue 3 HTTP 集成演示 - 使用 @ldesign/http-core</p>
    
    <div class="demo-section">
      <h2>HTTP 请求演示</h2>
      
      <div class="button-group">
        <button @click="fetchUser" :disabled="loading">
          获取单个用户
        </button>
        <button @click="fetchUsers" :disabled="loading">
          获取用户列表
        </button>
        <button @click="createUser" :disabled="loading">
          创建用户
        </button>
      </div>
      
      <div v-if="loading" class="loading">
        ⏳ 加载中...
      </div>
      
      <div v-if="error" class="error">
        ❌ 错误: {{ error }}
      </div>
      
      <div v-if="data && !loading" class="data">
        <h3>响应数据:</h3>
        <pre>{{ JSON.stringify(data, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.button-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

h3 {
  margin-bottom: 0.5rem;
  color: #666;
}

pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
  line-height: 1.5;
}
</style>
