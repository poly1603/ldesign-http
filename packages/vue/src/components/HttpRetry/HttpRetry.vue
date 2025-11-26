<template>
  <div class="http-retry" :class="`http-retry--${status}`">
    <!-- 重试信息 -->
    <div class="http-retry__info">
      <div class="http-retry__status">
        <span class="http-retry__status-icon">{{ statusIcon }}</span>
        <span class="http-retry__status-text">{{ statusText }}</span>
      </div>

      <div class="http-retry__counter">
        <span class="http-retry__counter-current">{{ retryCount }}</span>
        <span class="http-retry__counter-separator">/</span>
        <span class="http-retry__counter-max">{{ maxRetries }}</span>
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="showProgress && (status === 'waiting' || status === 'retrying')" class="http-retry__progress">
      <div class="http-retry__progress-bar" :style="{ width: `${progressPercent}%` }" />
    </div>

    <!-- 倒计时 -->
    <div v-if="showCountdown && status === 'waiting'" class="http-retry__countdown">
      <span class="http-retry__countdown-text">
        {{ countdownText }}后自动重试
      </span>
      <span class="http-retry__countdown-time">
        {{ formatRemainingTime(remainingTime) }}
      </span>
    </div>

    <!-- 错误信息 -->
    <div v-if="error && status === 'failed'" class="http-retry__error">
      {{ error.message || '请求失败' }}
    </div>

    <!-- 操作按钮 -->
    <div class="http-retry__actions">
      <button
        v-if="canRetry"
        class="http-retry__btn http-retry__btn--retry"
        :disabled="disabled || status === 'retrying'"
        @click="handleRetry"
      >
        {{ retryText }}
      </button>

      <button
        v-if="status === 'waiting' || status === 'retrying'"
        class="http-retry__btn http-retry__btn--cancel"
        @click="handleCancel"
      >
        {{ cancelText }}
      </button>
    </div>

    <!-- 重试历史 -->
    <div v-if="showHistory && history.length > 0" class="http-retry__history">
      <div class="http-retry__history-title">重试历史</div>
      <div class="http-retry__history-list">
        <div
          v-for="item in history"
          :key="item.attempt"
          class="http-retry__history-item"
          :class="{ 'http-retry__history-item--success': item.success }"
        >
          <span class="http-retry__history-attempt">#{{ item.attempt }}</span>
          <span class="http-retry__history-time">{{ formatTimestamp(item.timestamp) }}</span>
          <span class="http-retry__history-delay">延迟: {{ item.delay }}ms</span>
          <span v-if="item.duration" class="http-retry__history-duration">
            耗时: {{ item.duration }}ms
          </span>
          <span class="http-retry__history-status">
            {{ item.success ? '✓ 成功' : '✗ 失败' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 自定义插槽 -->
    <slot
      :status="status"
      :retry-count="retryCount"
      :max-retries="maxRetries"
      :remaining-time="remainingTime"
      :retry="handleRetry"
      :cancel="handleCancel"
      :history="history"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { HttpRetryProps, RetryStatus, RetryHistoryItem } from './types'
import { calculateRetryDelay, formatRemainingTime, formatTimestamp } from './types'

// Props 定义
const props = withDefaults(defineProps<HttpRetryProps>(), {
  retryCount: 0,
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  backoffFactor: 2,
  autoRetry: false,
  showProgress: true,
  showCountdown: true,
  showHistory: false,
  retryText: '立即重试',
  cancelText: '取消重试',
  disabled: false,
})

// Emits 定义
const emit = defineEmits<{
  retry: []
  cancel: []
  'status-change': [status: RetryStatus]
  success: []
  'max-retries-reached': []
}>()

// 响应式状态
const status = ref<RetryStatus>('idle')
const remainingTime = ref(0)
const progressPercent = ref(0)
const countdownTimer = ref<number | null>(null)
const progressTimer = ref<number | null>(null)
const history = ref<RetryHistoryItem[]>([])

// 计算属性 - 是否可以重试
const canRetry = computed(() => {
  return props.retryCount < props.maxRetries && status.value !== 'success'
})

// 计算属性 - 状态图标
const statusIcon = computed(() => {
  switch (status.value) {
    case 'idle':
      return '⏸️'
    case 'waiting':
      return '⏳'
    case 'retrying':
      return '🔄'
    case 'success':
      return '✅'
    case 'failed':
      return '❌'
    case 'cancelled':
      return '🚫'
    default:
      return '❓'
  }
})

// 计算属性 - 状态文本
const statusText = computed(() => {
  switch (status.value) {
    case 'idle':
      return '待重试'
    case 'waiting':
      return '等待中'
    case 'retrying':
      return '重试中'
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'cancelled':
      return '已取消'
    default:
      return '未知'
  }
})

// 计算属性 - 倒计时文本
const countdownText = computed(() => {
  const seconds = Math.ceil(remainingTime.value / 1000)
  return seconds
})

// 更新状态
const updateStatus = (newStatus: RetryStatus) => {
  status.value = newStatus
  emit('status-change', newStatus)
}

// 清理定时器
const clearTimers = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  if (progressTimer.value) {
    clearInterval(progressTimer.value)
    progressTimer.value = null
  }
}

// 开始倒计时
const startCountdown = () => {
  clearTimers()

  const delay = calculateRetryDelay(
    props.retryCount,
    props.retryDelay,
    props.exponentialBackoff,
    props.backoffFactor
  )

  remainingTime.value = delay
  progressPercent.value = 0

  updateStatus('waiting')

  // 倒计时定时器
  const startTime = Date.now()
  countdownTimer.value = window.setInterval(() => {
    const elapsed = Date.now() - startTime
    remainingTime.value = Math.max(0, delay - elapsed)
    progressPercent.value = Math.min(100, (elapsed / delay) * 100)

    if (remainingTime.value <= 0) {
      clearTimers()
      if (props.autoRetry) {
        handleRetry()
      }
    }
  }, 50)
}

// 处理重试
const handleRetry = () => {
  if (!canRetry.value || props.disabled) {
    return
  }

  clearTimers()
  updateStatus('retrying')

  const startTime = Date.now()

  // 记录到历史
  const historyItem: RetryHistoryItem = {
    attempt: props.retryCount + 1,
    timestamp: Date.now(),
    delay: calculateRetryDelay(
      props.retryCount,
      props.retryDelay,
      props.exponentialBackoff,
      props.backoffFactor
    ),
    success: false,
  }

  // 触发重试事件
  emit('retry')

  // 模拟进度（实际应由父组件控制）
  progressPercent.value = 0
  progressTimer.value = window.setInterval(() => {
    if (progressPercent.value < 90) {
      progressPercent.value += 2
    }
  }, 100)
}

// 处理取消
const handleCancel = () => {
  clearTimers()
  updateStatus('cancelled')
  emit('cancel')
}

// 添加历史记录
const addHistoryItem = (item: RetryHistoryItem) => {
  history.value.push(item)
  // 只保留最近 10 条记录
  if (history.value.length > 10) {
    history.value.shift()
  }
}

// 监听重试次数变化
watch(
  () => props.retryCount,
  (newCount, oldCount) => {
    if (newCount > oldCount && props.autoRetry) {
      startCountdown()
    }
  }
)

// 监听错误变化
watch(
  () => props.error,
  (newError) => {
    if (newError) {
      if (canRetry.value) {
        if (props.autoRetry) {
          startCountdown()
        } else {
          updateStatus('idle')
        }
      } else {
        updateStatus('failed')
        emit('max-retries-reached')
      }
    }
  }
)

// 组件卸载时清理
onUnmounted(() => {
  clearTimers()
})

// 暴露方法
defineExpose({
  retry: handleRetry,
  cancel: handleCancel,
  status,
  remainingTime,
})
</script>

<style scoped>
.http-retry {
  padding: 16px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.http-retry__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.http-retry__status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.http-retry__status-icon {
  font-size: 20px;
  line-height: 1;
}

.http-retry__status-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.http-retry__counter {
  font-size: 16px;
  font-weight: 600;
  color: #606266;
}

.http-retry__counter-current {
  color: #409eff;
}

.http-retry__counter-separator {
  margin: 0 4px;
  color: #dcdfe6;
}

.http-retry__progress {
  height: 4px;
  background-color: #f5f7fa;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.http-retry__progress-bar {
  height: 100%;
  background-color: #409eff;
  transition: width 0.1s linear;
}

.http-retry__countdown {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #ecf5ff;
  border-radius: 4px;
  margin-bottom: 12px;
}

.http-retry__countdown-text {
  font-size: 13px;
  color: #409eff;
}

.http-retry__countdown-time {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.http-retry__error {
  padding: 8px 12px;
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  font-size: 13px;
  color: #f56c6c;
  margin-bottom: 12px;
}

.http-retry__actions {
  display: flex;
  gap: 8px;
}

.http-retry__btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.http-retry__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.http-retry__btn--retry {
  background-color: #409eff;
  color: white;
}

.http-retry__btn--retry:hover:not(:disabled) {
  background-color: #66b1ff;
}

.http-retry__btn--cancel {
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.http-retry__btn--cancel:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.http-retry__history {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.http-retry__history-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.http-retry__history-list {
  max-height: 200px;
  overflow-y: auto;
}

.http-retry__history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  font-size: 12px;
  color: #606266;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 4px;
}

.http-retry__history-item--success {
  background-color: #f0f9ff;
  color: #409eff;
}

.http-retry__history-attempt {
  font-weight: 600;
  min-width: 24px;
}

.http-retry__history-status {
  margin-left: auto;
  font-weight: 500;
}

/* 状态样式 */
.http-retry--waiting .http-retry__progress-bar {
  background-color: #e6a23c;
}

.http-retry--retrying .http-retry__progress-bar {
  background-color: #409eff;
}

.http-retry--success {
  border-color: #67c23a;
}

.http-retry--failed {
  border-color: #f56c6c;
}

.http-retry--cancelled {
  border-color: #909399;
}
</style>