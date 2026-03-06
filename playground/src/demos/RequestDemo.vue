<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import { FileCode, Play, XCircle, RotateCcw } from 'lucide-vue-next'
import { useRequest, useAsyncRequest, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
import type { HttpClient } from '@ldesign/http-core'

const client = inject<HttpClient>(HTTP_CLIENT_KEY)!

// === useRequest 示例 ===
const userId = ref(1)
const requestConfig = computed(() => ({
  url: '/api/users',
  params: { _single: userId.value },
}))

const {
  data: userData,
  loading: userLoading,
  error: userError,
  finished: userFinished,
  execute: userExecute,
  refresh: userRefresh,
  cancel: userCancel,
  reset: userReset,
  canCancel,
} = useRequest(client, requestConfig, {
  immediate: false,
  transform: (data: any) => Array.isArray(data) ? data[0] : data,
  onSuccess: (data) => {
    asyncLog.value.push(`[useRequest] 成功: ${JSON.stringify(data)?.slice(0, 60)}...`)
  },
  onError: (err) => {
    asyncLog.value.push(`[useRequest] 错误: ${err.message}`)
  },
})

// === useAsyncRequest 示例 ===
const asyncLog = ref<string[]>([])

const {
  data: asyncData,
  loading: asyncLoading,
  error: asyncError,
  execute: asyncExecute,
  reset: asyncReset,
} = useAsyncRequest(client, () => {
  return client.request({ url: '/api/todos' })
}, {
  onSuccess: (data) => {
    asyncLog.value.push(`[useAsyncRequest] 获取到 ${Array.isArray(data) ? data.length : 0} 条 Todo`)
  },
})
</script>

<template>
  <div class="demo-page">
    <h2>useRequest / useAsyncRequest</h2>
    <p class="page-desc">
      基于注入客户端的请求 Hook。<code>useRequest</code> 接收响应式配置，支持自动/手动执行、取消、刷新。
      <code>useAsyncRequest</code> 接收自定义异步函数，适合复杂请求逻辑。
    </p>

    <div class="card">
      <h3><FileCode :size="18" /> useRequest — 配置式请求</h3>
      <div class="flex gap-2 mb-2" style="flex-wrap:wrap">
        <label class="text-sm text-secondary" style="align-self:center">用户 ID:</label>
        <input v-model.number="userId" type="number" class="input" style="width:80px" min="1" max="5" />
        <button class="btn btn-primary" @click="userExecute()">
          <Play :size="14" /> 执行请求
        </button>
        <button class="btn" @click="userRefresh()">
          <RotateCcw :size="14" /> 刷新
        </button>
        <button class="btn btn-warning" :disabled="!canCancel" @click="userCancel()">
          <XCircle :size="14" /> 取消
        </button>
        <button class="btn" @click="userReset()">重置</button>
      </div>

      <div class="text-sm text-secondary mb-2">
        loading: <code>{{ userLoading }}</code> &nbsp;|&nbsp;
        finished: <code>{{ userFinished }}</code> &nbsp;|&nbsp;
        canCancel: <code>{{ canCancel }}</code>
      </div>

      <div v-if="userError" class="text-sm" style="color:var(--color-error)">
        错误: {{ userError.message }}
      </div>
      <div v-if="userData" class="result-panel">
        <div class="result-label">响应数据</div>
        <pre class="code-block">{{ JSON.stringify(userData, null, 2) }}</pre>
      </div>
    </div>

    <div class="card">
      <h3><FileCode :size="18" /> useAsyncRequest — 函数式请求</h3>
      <div class="flex gap-2 mb-2">
        <button class="btn btn-primary" @click="asyncExecute()">
          <Play :size="14" /> 获取 Todos
        </button>
        <button class="btn" @click="asyncReset()">重置</button>
      </div>

      <div class="text-sm text-secondary mb-2">
        loading: <code>{{ asyncLoading }}</code>
      </div>

      <div v-if="asyncError" class="text-sm" style="color:var(--color-error)">
        错误: {{ asyncError.message }}
      </div>
      <div v-if="asyncData" class="result-panel">
        <div class="result-label">获取到 {{ Array.isArray(asyncData) ? asyncData.length : 0 }} 条 Todo</div>
        <pre class="code-block" style="max-height:200px">{{ JSON.stringify(asyncData, null, 2) }}</pre>
      </div>
    </div>

    <div v-if="asyncLog.length" class="card">
      <h3>回调日志</h3>
      <div class="code-block" style="max-height:150px">
        <div v-for="(entry, i) in asyncLog" :key="i">{{ entry }}</div>
      </div>
    </div>

    <div class="card">
      <h3>useRequest vs useHttp</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useRequest</code> 需要注入的 HttpClient（通过 <code>inject(HTTP_CLIENT_KEY)</code>），
        适合需要全局配置（拦截器、baseURL 等）的场景。<br>
        <code>useHttp</code>（独立版）会自动创建客户端，适合快速使用。
      </p>
    </div>

    <div class="card">
      <h3>用法对比</h3>
      <pre class="code-block">// useRequest — 注入客户端，配置式
const client = inject(HTTP_CLIENT_KEY)!
const { data, loading, execute, cancel, refresh, reset } = useRequest(
  client,
  { url: '/api/users', params: { id: 1 } },
  {
    immediate: false,    // 不自动执行
    transform: (d) => d, // 数据转换
    onSuccess: (data) => console.log(data),
    onError: (err) => console.error(err),
    cancelOnUnmount: true, // 组件卸载时取消
  },
)

// useAsyncRequest — 注入客户端，函数式
const { data, execute } = useAsyncRequest(
  client,
  async () => {
    // 可以编排复杂的请求逻辑
    const user = await client.request({ url: '/api/user' })
    const posts = await client.request({ url: `/api/posts?userId=${user.data.id}` })
    return posts
  },
)</pre>
    </div>
  </div>
</template>
