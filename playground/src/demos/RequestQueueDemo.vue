<script setup lang="ts">
import { ref, inject } from 'vue'
import { ListOrdered, Play, Pause, Trash2, RotateCcw } from 'lucide-vue-next'
import { useRequestQueue, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
import type { HttpClient } from '@ldesign/http-core'

const client = inject<HttpClient>(HTTP_CLIENT_KEY)!

// 队列1：默认并发=3
const queue = useRequestQueue(client, { concurrency: 3 })
const log = ref<string[]>([])

async function addBatchRequests() {
  log.value = []
  log.value.push('[开始] 添加 6 个请求到队列（并发=3）')
  for (let i = 1; i <= 6; i++) {
    const priority = i <= 2 ? 10 : 0
    log.value.push(`[入队] 请求 #${i}，优先级=${priority}`)
    queue.enqueue({ url: '/api/users', params: { _delay: 500 } }, priority)
      .then(() => {
        log.value.push(`[完成] 请求 #${i} 成功 ✓`)
      })
      .catch((err: any) => {
        log.value.push(`[失败] 请求 #${i}: ${err.message}`)
      })
  }
}

function pauseQueue() {
  queue.pause()
  log.value.push('[暂停] 队列已暂停')
}

function resumeQueue() {
  queue.resume()
  log.value.push('[恢复] 队列已恢复')
}

function clearQueue() {
  queue.clear()
  log.value.push('[清空] 队列已清空')
}

function resetQueue() {
  queue.reset()
  log.value = []
}
</script>

<template>
  <div class="demo-page">
    <h2>useRequestQueue 请求队列</h2>
    <p class="page-desc">
      管理请求队列，控制并发数量，支持优先级排序、暂停/恢复、清空和取消操作。
    </p>

    <div class="card">
      <h3><ListOrdered :size="18" /> 队列控制面板</h3>
      <div class="flex gap-2 mb-2" style="flex-wrap:wrap">
        <button class="btn btn-primary" @click="addBatchRequests">
          <Play :size="14" /> 添加 6 个请求
        </button>
        <button class="btn" :class="queue.isPaused.value ? 'btn-success' : 'btn-warning'" @click="queue.isPaused.value ? resumeQueue() : pauseQueue()">
          <component :is="queue.isPaused.value ? Play : Pause" :size="14" />
          {{ queue.isPaused.value ? '恢复' : '暂停' }}
        </button>
        <button class="btn btn-error" @click="clearQueue">
          <Trash2 :size="14" /> 清空队列
        </button>
        <button class="btn" @click="resetQueue">
          <RotateCcw :size="14" /> 重置
        </button>
      </div>

      <div class="grid grid-cols-4 gap-2 mb-2">
        <div class="stat-card">
          <div class="stat-label">等待中</div>
          <div class="stat-value" style="color: var(--color-warning)">{{ queue.pending.value }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">执行中</div>
          <div class="stat-value" style="color: var(--color-primary)">{{ queue.active.value }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">已完成</div>
          <div class="stat-value" style="color: var(--color-success)">{{ queue.completed.value }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">失败</div>
          <div class="stat-value" style="color: var(--color-error)">{{ queue.failed.value }}</div>
        </div>
      </div>

      <div class="text-sm text-secondary mb-2">
        队列状态: {{ queue.isPaused.value ? '⏸️ 已暂停' : '▶️ 运行中' }}
        &nbsp;|&nbsp; 总计: {{ queue.total.value }}
      </div>

      <div v-if="log.length" class="result-panel">
        <div class="result-label">操作日志</div>
        <div class="code-block" style="max-height: 250px">
          <div v-for="(entry, i) in log" :key="i" :style="{
            color: entry.includes('[完成]') ? 'var(--color-success)'
              : entry.includes('[失败]') ? 'var(--color-error)'
              : entry.includes('[暂停]') || entry.includes('[清空]') ? 'var(--color-warning)'
              : 'var(--color-text-secondary)'
          }">{{ entry }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <strong>请求队列</strong>可以限制同时发出的请求数量，防止大量并发请求压垮服务器。
        高优先级请求会排在队列前面优先处理。
      </p>
      <p class="text-sm text-secondary">
        常见场景：批量上传文件、批量 API 调用、资源预加载、爬虫限流。
      </p>
    </div>

    <div class="card">
      <h3>用法示例</h3>
      <pre class="code-block">import { useRequestQueue, HTTP_CLIENT_KEY } from '@ldesign/http-vue'

const client = inject(HTTP_CLIENT_KEY)!
const queue = useRequestQueue(client, {
  concurrency: 3,   // 最大并发数
  autoStart: true,   // 自动开始处理
  timeout: 30000,    // 超时时间
})

// 添加请求到队列（返回 Promise）
const result = await queue.enqueue(
  { url: '/api/data' },
  10,  // 优先级（越大越优先）
)

// 控制队列
queue.pause()      // 暂停
queue.resume()     // 恢复
queue.clear()      // 清空（reject 所有等待请求）
queue.cancelAll()  // 取消所有活动请求
queue.reset()      // 重置统计

// 队列状态（全部响应式）
queue.pending    // 等待中数量
queue.active     // 执行中数量
queue.completed  // 已完成数量
queue.failed     // 失败数量
queue.total      // 总计
queue.isPaused   // 是否暂停</pre>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 12px;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  text-align: center;
}
.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
}
.grid {
  display: grid;
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}
</style>
