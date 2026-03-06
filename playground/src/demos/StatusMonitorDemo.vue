<script setup lang="ts">
import { ref } from 'vue'
import { Activity, Play, RotateCcw, AlertTriangle } from 'lucide-vue-next'
import { useStatusMonitor } from '@ldesign/http-vue'

const {
  total, active, completed, failed,
  avgResponseTime, errorRate, recentErrors, metrics,
  trackStart, trackEnd, trackError, reset, refresh,
} = useStatusMonitor()

const isBatchRunning = ref(false)

async function simulateRequests() {
  isBatchRunning.value = true

  // Simulate 5 successful requests
  for (let i = 0; i < 5; i++) {
    const id = trackStart(`/api/users/${i + 1}`, 'GET')
    await new Promise(r => setTimeout(r, 100 + Math.random() * 400))
    trackEnd(id, 200)
  }

  // Simulate 2 failed requests
  for (let i = 0; i < 2; i++) {
    const id = trackStart('/api/error', 'GET')
    await new Promise(r => setTimeout(r, 50 + Math.random() * 200))
    trackError(id, `Server Error ${500 + i}`, 500 + i)
  }

  // Simulate 3 more successes
  for (let i = 0; i < 3; i++) {
    const id = trackStart('/api/random', 'POST')
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
    trackEnd(id, 201)
  }

  isBatchRunning.value = false
}

async function simulateConcurrent() {
  isBatchRunning.value = true
  const ids: string[] = []

  // Start 5 requests simultaneously
  for (let i = 0; i < 5; i++) {
    ids.push(trackStart(`/api/users/${i}`, ['GET', 'POST', 'PUT'][i % 3]))
  }

  // Complete them one by one
  for (const id of ids) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500))
    if (Math.random() > 0.7) {
      trackError(id, 'Random failure', 503)
    } else {
      trackEnd(id, 200)
    }
  }

  isBatchRunning.value = false
}

function formatPercent(v: number) {
  return (v * 100).toFixed(1) + '%'
}
</script>

<template>
  <div class="demo-page">
    <h2>useStatusMonitor 状态监控</h2>
    <p class="page-desc">
      响应式请求指标：请求计数、响应时间、错误率和方法分布。
    </p>

    <div class="card">
      <h3><Activity :size="18" /> 请求指标仪表盘</h3>
      <div class="btn-group">
        <button class="btn btn-primary" :disabled="isBatchRunning" @click="simulateRequests">
          <Play :size="14" /> 模拟 10 个请求
        </button>
        <button class="btn" :disabled="isBatchRunning" @click="simulateConcurrent">
          <Play :size="14" /> 模拟并发请求
        </button>
        <button class="btn" @click="reset">
          <RotateCcw :size="14" /> 重置
        </button>
      </div>

      <div v-if="isBatchRunning" class="flex items-center gap-2 mb-2">
        <span class="badge badge-loading"><span class="spinner" /> 运行中...</span>
      </div>

      <div class="metrics-grid mt-4">
        <div class="metric-card">
          <div class="metric-value">{{ total }}</div>
          <div class="metric-label">总请求</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color: var(--color-primary)">{{ active }}</div>
          <div class="metric-label">活跃</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color: var(--color-success)">{{ completed }}</div>
          <div class="metric-label">已完成</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color: var(--color-error)">{{ failed }}</div>
          <div class="metric-label">失败</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ avgResponseTime }}ms</div>
          <div class="metric-label">平均响应</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" :style="{ color: errorRate > 0.1 ? 'var(--color-error)' : 'var(--color-success)' }">
            {{ formatPercent(errorRate) }}
          </div>
          <div class="metric-label">错误率</div>
        </div>
      </div>
    </div>

    <div v-if="metrics.maxResponseTime > 0" class="card">
      <h3>详细指标</h3>
      <table class="data-table">
        <tbody>
          <tr>
            <td class="text-secondary">最大响应时间</td>
            <td>{{ metrics.maxResponseTime }}ms</td>
          </tr>
          <tr>
            <td class="text-secondary">最小响应时间</td>
            <td>{{ metrics.minResponseTime }}ms</td>
          </tr>
          <tr>
            <td class="text-secondary">每秒请求数</td>
            <td>{{ metrics.requestsPerSecond }}</td>
          </tr>
          <tr>
            <td class="text-secondary">方法分布</td>
            <td>
              <span v-for="(count, method) in metrics.methodDistribution" :key="method as string" class="badge badge-loading" style="margin-right: 4px">
                {{ method }}: {{ count }}
              </span>
            </td>
          </tr>
          <tr>
            <td class="text-secondary">状态码分布</td>
            <td>
              <span v-for="(count, status) in metrics.statusDistribution" :key="status as any"
                :class="['badge', Number(status) < 400 ? 'badge-success' : 'badge-error']"
                style="margin-right: 4px"
              >
                {{ status }}: {{ count }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="recentErrors.length" class="card">
      <h3><AlertTriangle :size="18" /> 最近错误</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>URL</th>
            <th>状态码</th>
            <th>错误信息</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(err, i) in recentErrors" :key="i">
            <td class="text-xs">{{ new Date(err.timestamp).toLocaleTimeString() }}</td>
            <td>{{ err.url }}</td>
            <td><span class="badge badge-error">{{ err.status }}</span></td>
            <td>{{ err.message }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useStatusMonitor</code> 基于 <code>@ldesign/http-core</code> 的 <code>StatusMonitor</code>，
        提供响应式的请求健康监控。通过 <code>trackStart/trackEnd/trackError</code> 手动跟踪请求，
        或通过拦截器自动跟踪。所有指标自动计算并以响应式方式更新。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { useStatusMonitor } from '@ldesign/http-vue'

const {
  total,           // Ref&lt;number&gt; - 总请求数
  active,          // Ref&lt;number&gt; - 当前活跃请求数
  completed,       // Ref&lt;number&gt; - 已完成数
  failed,          // Ref&lt;number&gt; - 失败数
  avgResponseTime, // Ref&lt;number&gt; - 平均响应时间 (ms)
  errorRate,       // Ref&lt;number&gt; - 错误率 (0-1)
  recentErrors,    // Ref&lt;StatusMonitorError[]&gt; - 最近的错误列表
  metrics,         // Ref&lt;RequestMetrics&gt; - 完整指标快照
  trackStart,      // (url, method) => string - 开始跟踪
  trackEnd,        // (id, status) => void - 记录成功
  trackError,      // (id, error, status) => void - 记录失败
  reset,           // () => void - 重置所有指标
} = useStatusMonitor()</pre>
    </div>

    <div class="card">
      <h3>手动跟踪示例</h3>
      <pre class="code-block">// 手动跟踪请求生命周期
const id = trackStart('/api/users', 'GET')  // 返回唯一 ID
try {
  const res = await client.get('/api/users')
  trackEnd(id, res.status)     // 记录成功，并传入状态码
} catch (err) {
  trackError(id, err.message, err.status)  // 记录失败
}</pre>
    </div>

    <div class="card">
      <h3>通过拦截器自动跟踪</h3>
      <pre class="code-block">// 结合拦截器实现自动监控
client.addRequestInterceptor((config) => {
  config.metadata = { monitorId: trackStart(config.url, config.method) }
  return config
})

client.addResponseInterceptor((response) => {
  const id = response.config.metadata?.monitorId
  if (id) trackEnd(id, response.status)
  return response
})

client.interceptors.error.use((error) => {
  const id = error.config?.metadata?.monitorId
  if (id) trackError(id, error.message, error.status)
  throw error
})</pre>
    </div>

    <div class="card">
      <h3>RequestMetrics 完整属性</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>属性</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>total / active / completed / failed</code></td>
            <td>请求计数</td>
          </tr>
          <tr>
            <td><code>avgResponseTime / maxResponseTime / minResponseTime</code></td>
            <td>响应时间统计 (ms)</td>
          </tr>
          <tr>
            <td><code>errorRate</code></td>
            <td>错误率 (0-1)</td>
          </tr>
          <tr>
            <td><code>requestsPerSecond</code></td>
            <td>每秒请求数</td>
          </tr>
          <tr>
            <td><code>methodDistribution</code></td>
            <td>HTTP 方法分布（GET/POST/PUT...）</td>
          </tr>
          <tr>
            <td><code>statusDistribution</code></td>
            <td>状态码分布（200/404/500...）</td>
          </tr>
          <tr>
            <td><code>recentErrors</code></td>
            <td>最近的错误记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
