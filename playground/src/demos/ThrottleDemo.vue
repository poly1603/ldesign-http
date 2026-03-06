<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import { Search, MousePointer, Clock } from 'lucide-vue-next'
import { useDebouncedRequest, useThrottledRequest, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
import type { HttpClient } from '@ldesign/http-core'

const client = inject<HttpClient>(HTTP_CLIENT_KEY)!

// 防抖搜索：300ms 内只发送最后一次请求
const searchQuery = ref('')
const debounceLog = ref<string[]>([])
const { data: searchResult, loading: searchLoading, execute: debouncedSearch } = useDebouncedRequest<any>(
  client,
  { url: '/api/users', method: 'GET' },
  { delay: 300 },
)

watch(searchQuery, (q) => {
  if (q) {
    debounceLog.value.push(`[${new Date().toLocaleTimeString()}] 输入: "${q}" → 等待 300ms...`)
    debouncedSearch({ params: { q } }).then(() => {
      debounceLog.value.push(`[${new Date().toLocaleTimeString()}] 请求已发送: q="${q}"`)
    }).catch(() => {})
  }
})

// 节流请求：1秒内最多执行一次
const throttleCount = ref(0)
const throttleLog = ref<string[]>([])
const { data: throttleResult, loading: throttleLoading, execute: throttledSave } = useThrottledRequest<any>(
  client,
  { url: '/api/random', method: 'GET' },
  { delay: 1000, leading: true, trailing: false },
)

async function handleThrottleClick() {
  throttleCount.value++
  throttleLog.value.push(`[${new Date().toLocaleTimeString()}] 点击第 ${throttleCount.value} 次`)
  const result = await throttledSave()
  if (result) {
    throttleLog.value.push(`[${new Date().toLocaleTimeString()}] 请求已执行`)
  } else {
    throttleLog.value.push(`[${new Date().toLocaleTimeString()}] 被节流，未执行`)
  }
}
</script>

<template>
  <div class="demo-page">
    <h2>防抖与节流请求</h2>
    <p class="page-desc">
      <code>useDebouncedRequest</code> 防抖：延迟执行，在指定时间内只发送最后一次请求。
      <code>useThrottledRequest</code> 节流：在指定时间窗口内最多执行一次。
    </p>

    <div class="card">
      <h3><Search :size="18" /> useDebouncedRequest — 搜索防抖</h3>
      <p class="text-sm text-secondary mb-2">输入搜索关键词，300ms 内只发送最后一次请求：</p>
      <input v-model="searchQuery" class="input mb-2" placeholder="输入搜索关键词..." />
      <div class="flex items-center gap-2 mb-2">
        <span v-if="searchLoading" class="badge badge-loading"><span class="spinner" /> 搜索中...</span>
        <span v-if="searchResult && !searchLoading" class="badge badge-success">找到结果</span>
      </div>
      <div v-if="searchResult" class="result-panel mb-2">
        <div class="result-label">搜索结果</div>
        <pre class="code-block">{{ JSON.stringify(searchResult, null, 2) }}</pre>
      </div>
      <div v-if="debounceLog.length" class="code-block" style="max-height: 150px">
        <div v-for="(entry, i) in debounceLog" :key="i" class="text-xs">{{ entry }}</div>
      </div>
    </div>

    <div class="card">
      <h3><MousePointer :size="18" /> useThrottledRequest — 按钮节流</h3>
      <p class="text-sm text-secondary mb-2">快速点击按钮，1 秒内最多执行一次请求：</p>
      <div class="btn-group">
        <button class="btn btn-primary" @click="handleThrottleClick">
          <Clock :size="14" /> 点击发送请求（快速点击测试）
        </button>
        <button class="btn" @click="throttleLog = []; throttleCount = 0">清空</button>
      </div>
      <div v-if="throttleLog.length" class="code-block mt-2" style="max-height: 200px">
        <div v-for="(entry, i) in throttleLog" :key="i" class="text-xs">{{ entry }}</div>
      </div>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { useDebouncedRequest, useThrottledRequest } from '@ldesign/http-vue'

// 防抖请求 — 适合搜索输入
const { execute, data, loading, cancel } = useDebouncedRequest(
  client,
  { url: '/api/search', method: 'GET' },
  { delay: 300 },  // 300ms 防抖
)
// 用户输入时调用，300ms 内只发最后一次
watch(query, (q) => execute({ params: { q } }))

// 节流请求 — 适合按钮点击
const { execute: save } = useThrottledRequest(
  client,
  { url: '/api/save', method: 'POST' },
  {
    delay: 1000,     // 1 秒节流
    leading: true,   // 第一次立即执行
    trailing: false, // 不在尾部再执行
  },
)</pre>
    </div>

    <div class="card">
      <h3>配置选项</h3>
      <table class="data-table">
        <thead>
          <tr><th>属性</th><th>类型</th><th>说明</th></tr>
        </thead>
        <tbody>
          <tr><td><code>delay</code></td><td><code>number</code></td><td>延迟时间（毫秒），防抖默认 300，节流默认 1000</td></tr>
          <tr><td><code>leading</code></td><td><code>boolean</code></td><td>是否在前沿触发（仅节流）</td></tr>
          <tr><td><code>trailing</code></td><td><code>boolean</code></td><td>是否在后沿触发（仅节流）</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
