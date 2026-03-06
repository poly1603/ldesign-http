<script setup lang="ts">
import { ref } from 'vue'
import { Shield, Play, Trash2 } from 'lucide-vue-next'
import { createHttpClient } from '@ldesign/http-core'

const log = ref<string[]>([])
const responseData = ref('')

async function runWithInterceptors() {
  log.value = []
  responseData.value = ''

  const client = await createHttpClient({ adapter: 'fetch' })

  // Request interceptor: add auth token
  client.addRequestInterceptor((config) => {
    log.value.push(`[Request] ${config.method || 'GET'} ${config.url}`)
    log.value.push(`[Request] Adding Authorization header`)
    config.headers = {
      ...config.headers as any,
      'Authorization': 'Bearer demo-token-123',
      'X-Request-Id': `req-${Date.now()}`,
    }
    return config
  })

  // Response interceptor: transform data
  client.addResponseInterceptor((response) => {
    log.value.push(`[Response] Status: ${response.status}`)
    log.value.push(`[Response] Data keys: ${Object.keys(response.data as any).join(', ')}`)
    return response
  })

  // Error interceptor
  client.interceptors.error.use((error: any) => {
    log.value.push(`[Error] ${error.message}`)
    throw error
  })

  try {
    const res = await client.get('/api/users')
    responseData.value = JSON.stringify(res.data, null, 2)
    log.value.push(`[Done] Request completed successfully`)
  } catch (e: any) {
    log.value.push(`[Failed] ${e.message}`)
  }
}

async function runWithErrorInterceptor() {
  log.value = []
  responseData.value = ''

  const client = await createHttpClient({ adapter: 'fetch' })

  client.addRequestInterceptor((config) => {
    log.value.push(`[Request] ${config.method || 'GET'} ${config.url}`)
    return config
  })

  client.interceptors.error.use((error: any) => {
    log.value.push(`[Error Interceptor] Caught: ${error.message}`)
    log.value.push(`[Error Interceptor] Status: ${error.status || 'N/A'}`)
    throw error
  })

  try {
    await client.get('/api/error?status=500')
  } catch (e: any) {
    log.value.push(`[Catch] Error handled: ${e.message}`)
  }
}
</script>

<template>
  <div class="demo-page">
    <h2>拦截器</h2>
    <p class="page-desc">
      请求/响应/错误拦截器，用于认证、日志、错误处理等场景。
    </p>

    <div class="card">
      <h3><Shield :size="18" /> 拦截器管线</h3>
      <div class="btn-group">
        <button class="btn btn-primary" @click="runWithInterceptors">
          <Play :size="14" /> 运行认证拦截器
        </button>
        <button class="btn btn-error" @click="runWithErrorInterceptor">
          <Play :size="14" /> 运行错误拦截器
        </button>
        <button class="btn" @click="log = []; responseData = ''">
          <Trash2 :size="14" /> 清空
        </button>
      </div>

      <div v-if="log.length" class="result-panel mb-4">
        <div class="result-label">拦截器日志</div>
        <div class="code-block">
          <div v-for="(entry, i) in log" :key="i" :style="{ color: entry.startsWith('[Error') ? '#ef4444' : entry.startsWith('[Response') ? '#22c55e' : 'inherit' }">
            {{ entry }}
          </div>
        </div>
      </div>

      <div v-if="responseData" class="result-panel">
        <div class="result-label">响应数据</div>
        <pre class="code-block">{{ responseData }}</pre>
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>HttpClientImpl</code> 提供三种拦截器，分别在请求的不同阶段执行：
      </p>
      <p class="text-sm text-secondary mb-2">
        1. <strong>请求拦截器</strong>：在发送请求前修改配置（如添加 token、日志）<br>
        2. <strong>响应拦截器</strong>：在收到响应后处理数据（如解包、转换）<br>
        3. <strong>错误拦截器</strong>：在请求失败时统一处理错误（如 401 跳转登录）
      </p>
    </div>

    <div class="card">
      <h3>请求拦截器</h3>
      <pre class="code-block">import { createHttpClient } from '@ldesign/http-core'

const client = await createHttpClient({ adapter: 'fetch' })

// 添加请求拦截器 —— 每个请求发送前执行
client.addRequestInterceptor((config) => {
  // 自动添加认证头
  config.headers = {
    ...config.headers,
    'Authorization': `Bearer ${getToken()}`,
    'X-Request-Id': `req-${Date.now()}`,
  }
  return config  // 必须返回修改后的 config
})</pre>
    </div>

    <div class="card">
      <h3>响应拦截器</h3>
      <pre class="code-block">// 添加响应拦截器 —— 每个响应返回后执行
client.addResponseInterceptor((response) => {
  // 解包 API 响应结构
  // 比如将 { code: 0, data: {...}, msg: 'ok' } 变为直接返回 data
  if (response.data?.code === 0) {
    response.data = response.data.data
  }
  return response  // 必须返回修改后的 response
})</pre>
    </div>

    <div class="card">
      <h3>错误拦截器</h3>
      <pre class="code-block">// 使用 interceptors.error.use() 注册
client.interceptors.error.use((error) => {
  // 统一处理 401 未授权
  if (error.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    return  // 不再抛出错误
  }

  // 统一处理 500 服务器错误
  if (error.status === 500) {
    showNotification('服务器错误，请稍后重试')
  }

  throw error  // 继续抛出错误让调用方处理
})</pre>
    </div>

    <div class="card">
      <h3>拦截器执行顺序</h3>
      <pre class="code-block">// 请求流程：
//
// client.get('/api/users')
//   │
//   ├── 请求拦截器 1 (config) => config
//   ├── 请求拦截器 2 (config) => config
//   │
//   ├── 发送 HTTP 请求 (Fetch/Axios)
//   │
//   ├── 响应拦截器 1 (response) => response
//   ├── 响应拦截器 2 (response) => response
//   │
//   └── 返回结果
//
// 如果任何阶段抛出错误 → 错误拦截器 (error) => throw error</pre>
    </div>

    <div class="card">
      <h3>拦截器管理</h3>
      <pre class="code-block">// 添加拦截器，返回 ID 用于后续移除
const id = client.interceptors.request.use(handler)

// 移除特定拦截器
client.interceptors.request.eject(id)

// 清除所有请求拦截器
client.interceptors.request.clear()</pre>
    </div>
  </div>
</template>
