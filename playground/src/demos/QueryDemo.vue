<script setup lang="ts">
import { ref, inject } from 'vue'
import { Search, RefreshCw, Trash2, Clock } from 'lucide-vue-next'
import { useQuery, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
import type { HttpClient } from '@ldesign/http-core'

const client = inject<HttpClient>(HTTP_CLIENT_KEY)!

const {
  data, loading, error, isStale, isFetching,
  dataUpdatedAt, failureCount,
  execute, refresh, invalidate, reset,
} = useQuery<any>(
  client,
  'users-list',
  { url: '/api/users', method: 'GET' },
  {
    staleTime: 10000,
    retry: 2,
    immediate: false,
  },
)

const lastUpdated = ref('')

function formatTime(ts: number) {
  if (!ts) return '-'
  return new Date(ts).toLocaleTimeString()
}
</script>

<template>
  <div class="demo-page">
    <h2>useQuery 查询缓存</h2>
    <p class="page-desc">
      带内置缓存、stale-while-revalidate、重试和重新获取的数据查询。
    </p>

    <div class="card">
      <h3><Search :size="18" /> 查询：用户列表</h3>
      <div class="btn-group">
        <button class="btn btn-primary" :disabled="loading" @click="execute()">
          <Search :size="14" /> 获取数据
        </button>
        <button class="btn" :disabled="loading" @click="refresh()">
          <RefreshCw :size="14" /> 刷新
        </button>
        <button class="btn" @click="invalidate()">
          <Trash2 :size="14" /> 失效缓存
        </button>
        <button class="btn" @click="reset()">重置</button>
      </div>

      <div class="flex items-center gap-2 mb-2">
        <span v-if="loading" class="badge badge-loading"><span class="spinner" /> 加载中...</span>
        <span v-if="isFetching && !loading" class="badge badge-warning">后台刷新中...</span>
        <span v-if="isStale" class="badge badge-warning">已过期</span>
        <span v-if="data && !loading && !isFetching" class="badge badge-success">最新</span>
        <span v-if="error" class="badge badge-error">错误</span>
      </div>

      <div class="metrics-grid mb-4">
        <div class="metric-card">
          <div class="metric-value">{{ dataUpdatedAt ? formatTime(dataUpdatedAt) : '-' }}</div>
          <div class="metric-label">最后更新</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ failureCount }}</div>
          <div class="metric-label">失败次数</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">10s</div>
          <div class="metric-label">过期时间</div>
        </div>
      </div>

      <div v-if="data" class="result-panel">
        <div class="result-label">数据 ({{ Array.isArray(data?.data) ? data.data.length : 0 }} 个用户)</div>
        <pre class="code-block">{{ JSON.stringify(data, null, 2) }}</pre>
      </div>
    </div>

    <div class="card">
      <h3><Clock :size="18" /> 缓存工作原理</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useQuery</code> 实现了 <strong>Stale-While-Revalidate</strong> 缓存策略：
      </p>
      <p class="text-sm text-secondary mb-2">
        1. <strong>首次获取</strong>：从 API 加载数据并缓存结果，缓存键由 <code>queryKey</code> 确定。<br>
        2. <strong>缓存命中</strong>：在 <code>staleTime</code>（10秒）内的后续获取立即返回缓存数据，不发请求。<br>
        3. <strong>数据过期</strong>：超过 <code>staleTime</code> 后，<code>isStale</code> 变为 <code>true</code>，后台重新获取同时先展示旧数据。<br>
        4. <strong>手动失效</strong>：调用 <code>invalidate()</code> 清除缓存，下次强制从服务端获取。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { inject } from 'vue'
import { useQuery, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
import type { HttpClient } from '@ldesign/http-core'

// 注入通过插件提供的 HTTP 客户端
const client = inject&lt;HttpClient&gt;(HTTP_CLIENT_KEY)!

const { data, loading, error, isStale, isFetching,
  dataUpdatedAt, failureCount,
  execute, refresh, invalidate, reset,
} = useQuery&lt;UserListResponse&gt;(
  client,                        // HTTP 客户端实例
  'users-list',                  // 缓存键
  { url: '/api/users', method: 'GET' },  // 请求配置
  {
    staleTime: 10000,            // 缓存新鲜期 10 秒
    retry: 2,                    // 失败重试 2 次
    immediate: false,            // 不立即执行，等待手动触发
  },
)</pre>
    </div>

    <div class="card">
      <h3>返回值 API</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>属性/方法</th>
            <th>类型</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>data</code></td>
            <td><code>Ref&lt;T | null&gt;</code></td>
            <td>查询返回的数据</td>
          </tr>
          <tr>
            <td><code>loading</code></td>
            <td><code>Ref&lt;boolean&gt;</code></td>
            <td>首次加载状态（无缓存时）</td>
          </tr>
          <tr>
            <td><code>isFetching</code></td>
            <td><code>Ref&lt;boolean&gt;</code></td>
            <td>后台重新获取状态（有缓存时）</td>
          </tr>
          <tr>
            <td><code>isStale</code></td>
            <td><code>Ref&lt;boolean&gt;</code></td>
            <td>数据是否已过期</td>
          </tr>
          <tr>
            <td><code>dataUpdatedAt</code></td>
            <td><code>Ref&lt;number&gt;</code></td>
            <td>数据最后更新的时间戳</td>
          </tr>
          <tr>
            <td><code>failureCount</code></td>
            <td><code>Ref&lt;number&gt;</code></td>
            <td>连续失败次数</td>
          </tr>
          <tr>
            <td><code>execute(config?)</code></td>
            <td><code>Promise</code></td>
            <td>执行查询，优先使用缓存</td>
          </tr>
          <tr>
            <td><code>refresh()</code></td>
            <td><code>Promise</code></td>
            <td>强制重新获取，忽略缓存</td>
          </tr>
          <tr>
            <td><code>invalidate()</code></td>
            <td><code>void</code></td>
            <td>清除当前 queryKey 的缓存</td>
          </tr>
          <tr>
            <td><code>reset()</code></td>
            <td><code>void</code></td>
            <td>重置所有状态到初始值</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>配置选项</h3>
      <pre class="code-block">useQuery(client, key, config, {
  staleTime: 300000,             // 缓存新鲜期，默认 5 分钟
  retry: 3,                      // 重试次数，默认 3
  retryDelay: 1000,              // 重试间隔（指数退避）
  immediate: true,               // 是否立即执行
  enabled: true,                 // 是否启用查询
  initialData: null,             // 初始数据
  transform: (data) => data,     // 数据转换函数
  onSuccess: (data, response) => {},  // 成功回调
  onError: (error) => {},        // 错误回调
})</pre>
    </div>
  </div>
</template>
