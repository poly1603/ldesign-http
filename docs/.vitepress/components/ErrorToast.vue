<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  error: any
  type?: 'error' | 'warning' | 'info'
  duration?: number
  showRetry?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  duration: 5000,
  showRetry: false,
  position: 'top-right',
  maxWidth: '400px',
})

const emit = defineEmits<{
  close: []
  retry: []
}>()

const visible = ref(true)
const showDetails = ref(false)
let autoCloseTimer: NodeJS.Timeout | null = null

// 计算属性
const toastClass = computed(() => [
  `toast-${props.type}`,
  `toast-${props.position}`,
])

const canShowDetails = computed(() => {
  return props.error && (
    props.error.response?.data
    || props.error.status
    || props.error.request?.url
  )
})

const canRetry = computed(() => {
  return props.showRetry && (
    props.error?.isNetworkError
    || props.error?.isTimeoutError
    || (props.error?.status && props.error.status >= 500)
  )
})

// 方法
function getIcon(): string {
  switch (props.type) {
    case 'error': return '❌'
    case 'warning': return '⚠️'
    case 'info': return 'ℹ️'
    default: return '❌'
  }
}

function getTitle(): string {
  if (!props.error)
return '未知错误'

  if (props.error.isNetworkError)
return '网络连接失败'
  if (props.error.isTimeoutError)
return '请求超时'
  if (props.error.isCancelError)
return '请求已取消'

  switch (props.error.status) {
    case 400: return '请求参数错误'
    case 401: return '身份验证失败'
    case 403: return '权限不足'
    case 404: return '资源不存在'
    case 405: return '请求方法不允许'
    case 408: return '请求超时'
    case 409: return '请求冲突'
    case 422: return '请求参数验证失败'
    case 429: return '请求过于频繁'
    case 500: return '服务器内部错误'
    case 502: return '网关错误'
    case 503: return '服务不可用'
    case 504: return '网关超时'
    default:
      if (props.error.status >= 400 && props.error.status < 500) {
        return '客户端错误'
      }
 else if (props.error.status >= 500) {
        return '服务器错误'
      }
      return '请求失败'
  }
}

function getMessage(): string {
  if (!props.error)
return '发生了未知错误'

  // 优先使用自定义错误消息
  if (props.error.message) {
    return props.error.message
  }

  // 根据错误类型返回友好的消息
  if (props.error.isNetworkError) {
    return '请检查网络连接是否正常'
  }

  if (props.error.isTimeoutError) {
    return '请求处理时间过长，请稍后重试'
  }

  if (props.error.isCancelError) {
    return '请求已被用户取消'
  }

  // 根据状态码返回消息
  switch (props.error.status) {
    case 400:
      return '请求参数格式不正确，请检查输入'
    case 401:
      return '请先登录后再进行操作'
    case 403:
      return '您没有权限执行此操作'
    case 404:
      return '请求的资源不存在或已被删除'
    case 408:
      return '请求处理超时，请稍后重试'
    case 429:
      return '请求过于频繁，请稍后再试'
    case 500:
      return '服务器遇到了问题，请稍后重试'
    case 502:
      return '服务器网关错误，请稍后重试'
    case 503:
      return '服务暂时不可用，请稍后重试'
    case 504:
      return '服务器响应超时，请稍后重试'
    default:
      return '请求处理失败，请稍后重试'
  }
}

function formatErrorData(data: any): string {
  if (typeof data === 'string') {
    return data
  }

  try {
    return JSON.stringify(data, null, 2)
  }
 catch (e) {
    return String(data)
  }
}

function toggleDetails() {
  showDetails.value = !showDetails.value
}

async function copyError() {
  try {
    const errorInfo = {
      title: getTitle(),
      message: getMessage(),
      status: props.error.status,
      url: props.error.request?.url,
      timestamp: new Date().toISOString(),
      details: props.error.response?.data,
    }

    await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2))

    // 显示复制成功的简短提示
    showCopySuccess()
  }
 catch (error) {
    console.error('复制失败:', error)
  }
}

function showCopySuccess() {
  // 创建临时的成功提示
  const successToast = document.createElement('div')
  successToast.className = 'copy-success-toast'
  successToast.textContent = '✅ 已复制到剪贴板'
  successToast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 10001;
    animation: slideInRight 0.3s ease;
  `

  document.body.appendChild(successToast)

  setTimeout(() => {
    successToast.style.animation = 'slideOutRight 0.3s ease'
    setTimeout(() => {
      document.body.removeChild(successToast)
    }, 300)
  }, 2000)
}

function retry() {
  emit('retry')
  close()
}

function close() {
  visible.value = false
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
  }

  // 延迟触发关闭事件，等待动画完成
  setTimeout(() => {
    emit('close')
  }, 300)
}

function startAutoClose() {
  if (props.duration > 0) {
    autoCloseTimer = setTimeout(() => {
      close()
    }, props.duration)
  }
}

function pauseAutoClose() {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

function resumeAutoClose() {
  if (props.duration > 0 && !autoCloseTimer) {
    startAutoClose()
  }
}

// 生命周期
onMounted(() => {
  startAutoClose()

  // 添加全局样式
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
})

onUnmounted(() => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toast" appear>
      <div v-if="visible" class="error-toast-container">
        <div class="error-toast" :class="toastClass">
          <div class="toast-icon">
            {{ getIcon() }}
          </div>

          <div class="toast-content">
            <div class="toast-title">
              {{ getTitle() }}
            </div>
            <div class="toast-message">
              {{ getMessage() }}
            </div>

            <div v-if="showDetails" class="toast-details">
              <div v-if="error.status" class="detail-item">
                <strong>状态码:</strong> {{ error.status }}
              </div>
              <div v-if="error.response?.statusText" class="detail-item">
                <strong>状态文本:</strong> {{ error.response.statusText }}
              </div>
              <div v-if="error.request?.url" class="detail-item">
                <strong>请求URL:</strong> {{ error.request.url }}
              </div>
              <div v-if="error.response?.data" class="detail-item">
                <strong>响应数据:</strong>
                <pre class="error-data">{{ formatErrorData(error.response.data) }}</pre>
              </div>
            </div>

            <div class="toast-actions">
              <button
                v-if="canShowDetails"
                class="details-btn"
                @click="toggleDetails"
              >
                {{ showDetails ? '隐藏详情' : '显示详情' }}
              </button>

              <button
                class="copy-btn"
                title="复制错误信息"
                @click="copyError"
              >
                📋 复制
              </button>

              <button
                v-if="canRetry"
                class="retry-btn"
                @click="retry"
              >
                🔄 重试
              </button>
            </div>
          </div>

          <button class="close-btn" title="关闭" @click="close">
            ✕
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.error-toast-container {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
}

.error-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: v-bind(maxWidth);
  min-width: 300px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  pointer-events: auto;
  position: relative;
}

.toast-error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.toast-warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.toast-info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

/* 位置样式 */
.toast-top-right {
  top: 20px;
  right: 20px;
}

.toast-top-left {
  top: 20px;
  left: 20px;
}

.toast-bottom-right {
  bottom: 20px;
  right: 20px;
}

.toast-bottom-left {
  bottom: 20px;
  left: 20px;
}

.toast-top-center {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.toast-bottom-center {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 16px;
  color: #374151;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 8px;
}

.toast-details {
  margin-top: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  font-size: 12px;
}

.detail-item {
  margin-bottom: 6px;
  word-break: break-all;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item strong {
  color: #374151;
}

.error-data {
  margin: 4px 0 0 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 100px;
  overflow-y: auto;
}

.toast-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.details-btn,
.copy-btn,
.retry-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  transition: all 0.2s ease;
}

.details-btn:hover,
.copy-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.retry-btn {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.retry-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
}

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 响应式 */
@media (max-width: 768px) {
  .error-toast {
    max-width: calc(100vw - 40px);
    min-width: auto;
    margin: 0 20px;
  }

  .toast-top-center,
  .toast-bottom-center {
    left: 20px;
    right: 20px;
    transform: none;
  }

  .toast-actions {
    flex-direction: column;
  }

  .details-btn,
  .copy-btn,
  .retry-btn {
    width: 100%;
    justify-content: center;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .error-toast {
    background: #1f2937;
    color: #f9fafb;
  }

  .toast-title {
    color: #f9fafb;
  }

  .toast-message {
    color: #d1d5db;
  }

  .toast-details {
    background: rgba(255, 255, 255, 0.1);
  }

  .error-data {
    background: rgba(255, 255, 255, 0.1);
  }

  .details-btn,
  .copy-btn {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .details-btn:hover,
  .copy-btn:hover {
    background: #4b5563;
    border-color: #6b7280;
  }

  .close-btn {
    color: #9ca3af;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f9fafb;
  }
}
</style>
