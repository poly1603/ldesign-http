<script setup lang="ts">
import { ref } from 'vue'
import { Timer, Play, Square, RefreshCw } from 'lucide-vue-next'
import { usePolling } from '@ldesign/http-vue'

// Server time polling
const {
  data: serverTime,
  loading: timeLoading,
  isPolling: timePolling,
  pollCount: timePollCount,
  start: startTimePolling,
  stop: stopTimePolling,
  restart: restartTimePolling,
} = usePolling<any>(
  { url: '/api/server-time', method: 'GET' },
  {
    interval: 2000,
    immediate: false,
    pauseWhenHidden: true,
  },
)

// Task status polling
const taskId = ref<string | null>(null)
const taskData = ref<any>(null)
const taskPolling = ref(false)
let taskTimer: ReturnType<typeof setInterval> | null = null

async function startTask() {
  const res = await fetch('/api/tasks/start', { method: 'POST' })
  const data = await res.json()
  taskId.value = data.id
  taskData.value = data
  taskPolling.value = true

  taskTimer = setInterval(async () => {
    if (!taskId.value) return
    const r = await fetch(`/api/tasks/${taskId.value}`)
    const d = await r.json()
    taskData.value = d
    if (d.status === 'completed' || d.status === 'failed') {
      taskPolling.value = false
      if (taskTimer) clearInterval(taskTimer)
    }
  }, 1500)
}

function stopTask() {
  taskPolling.value = false
  if (taskTimer) clearInterval(taskTimer)
}
</script>

<template>
  <div class="demo-page">
    <h2>usePolling 轮询</h2>
    <p class="page-desc">
      智能轮询，支持页面隐藏暂停、最大轮询次数、停止条件和错误处理。
    </p>

    <div class="card">
      <h3><Timer :size="18" /> 服务器时间轮询（2秒间隔）</h3>
      <div class="btn-group">
        <button class="btn btn-primary" :disabled="timePolling" @click="startTimePolling">
          <Play :size="14" /> 开始
        </button>
        <button class="btn btn-error" :disabled="!timePolling" @click="stopTimePolling">
          <Square :size="14" /> 停止
        </button>
        <button class="btn" @click="restartTimePolling">
          <RefreshCw :size="14" /> 重启
        </button>
      </div>

      <div class="flex items-center gap-2 mb-2">
        <span v-if="timePolling" class="badge badge-loading"><span class="spinner" /> 轮询中...</span>
        <span v-else class="badge badge-warning">已停止</span>
        <span class="text-xs text-secondary">轮询次数: {{ timePollCount }}</span>
      </div>

      <div v-if="serverTime" class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value text-sm" style="font-size: 16px">{{ serverTime.time }}</div>
          <div class="metric-label">服务器时间</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{ serverTime.uptime }}s</div>
          <div class="metric-label">运行时间</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3><Timer :size="18" /> 任务进度轮询</h3>
      <p class="text-sm text-secondary mb-2">
        启动模拟异步任务，轮询监控其状态直到完成。
      </p>
      <div class="btn-group">
        <button class="btn btn-primary" :disabled="taskPolling" @click="startTask">
          <Play :size="14" /> 启动任务
        </button>
        <button class="btn" :disabled="!taskPolling" @click="stopTask">
          <Square :size="14" /> 停止轮询
        </button>
      </div>

      <div v-if="taskData" class="mt-2">
        <div class="flex items-center gap-2 mb-2">
          <span :class="['badge', taskData.status === 'completed' ? 'badge-success' : taskData.status === 'failed' ? 'badge-error' : 'badge-loading']">
            {{ taskData.status }}
          </span>
          <span class="text-sm text-secondary">{{ taskData.progress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${taskData.progress}%` }" />
        </div>
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>usePolling</code> 提供智能轮询能力，不同于简单的 <code>setInterval</code>，
        它支持页面不可见时暂停、离线暂停、最大轮询次数、条件停止等高级特性。
        内部会自动创建 HTTP 客户端，也可传入自定义客户端。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { usePolling } from '@ldesign/http-vue'

const {
  data,          // 最新的轮询数据
  loading,       // 当前轮询请求是否在加载
  error,         // 错误信息
  isPolling,     // 是否正在轮询
  pollCount,     // 已轮询次数
  start,         // 开始轮询
  stop,          // 停止轮询
  restart,       // 重启轮询（重置计数）
  execute,       // 手动执行一次请求
} = usePolling&lt;ServerTimeResponse&gt;(
  { url: '/api/server-time', method: 'GET' },  // 请求配置
  {
    interval: 2000,            // 轮询间隔 2 秒
    immediate: false,          // 不自动开始，等待手动触发
    pauseWhenHidden: true,     // 页面不可见时自动暂停
  },
)</pre>
    </div>

    <div class="card">
      <h3>配置选项</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>属性</th>
            <th>类型</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>interval</code></td>
            <td><code>number</code></td>
            <td>轮询间隔（毫秒）</td>
          </tr>
          <tr>
            <td><code>immediate</code></td>
            <td><code>boolean</code></td>
            <td>是否立即开始轮询，默认 <code>true</code></td>
          </tr>
          <tr>
            <td><code>pauseWhenHidden</code></td>
            <td><code>boolean</code></td>
            <td>页面不可见时暂停（节省资源）</td>
          </tr>
          <tr>
            <td><code>pauseWhenOffline</code></td>
            <td><code>boolean</code></td>
            <td>网络离线时暂停</td>
          </tr>
          <tr>
            <td><code>maxPolls</code></td>
            <td><code>number</code></td>
            <td>最大轮询次数，达到后自动停止</td>
          </tr>
          <tr>
            <td><code>stopWhen</code></td>
            <td><code>(data) => boolean</code></td>
            <td>停止条件函数，返回 true 停止轮询</td>
          </tr>
          <tr>
            <td><code>stopOnError</code></td>
            <td><code>boolean</code></td>
            <td>出错时是否停止轮询</td>
          </tr>
          <tr>
            <td><code>onSuccess</code></td>
            <td><code>(data) => void</code></td>
            <td>每次轮询成功回调</td>
          </tr>
          <tr>
            <td><code>onError</code></td>
            <td><code>(error) => void</code></td>
            <td>轮询出错回调</td>
          </tr>
          <tr>
            <td><code>client</code></td>
            <td><code>HttpClient</code></td>
            <td>自定义 HTTP 客户端（可选）</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>任务进度轮询示例</h3>
      <pre class="code-block">// 监控异步任务直到完成
const { data: task, stop } = usePolling&lt;TaskStatus&gt;(
  { url: `/api/tasks/${taskId}` },
  {
    interval: 1500,
    stopWhen: (data) => data.status === 'completed' || data.status === 'failed',
    onSuccess: (data) => {
      if (data.status === 'completed') {
        showNotification('任务完成!')
      }
    },
  },
)</pre>
    </div>
  </div>
</template>
