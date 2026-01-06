<template>
  <div class="http-loader" :class="rootClasses">
    <!-- 加载状态 -->
    <Transition name="http-loader-fade" mode="out-in">
      <div v-if="loading" key="loading" class="http-loader__state">
        <slot name="loading">
          <component v-if="loadingComponent" :is="loadingComponent" />
          <div v-else class="http-loader__loading">
            <div class="http-loader__spinner">
              <svg class="http-loader__spinner-icon" viewBox="0 0 24 24" fill="none">
                <circle
                  class="http-loader__spinner-track"
                  cx="12" cy="12" r="10"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  class="http-loader__spinner-progress"
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <span class="http-loader__loading-text">{{ loadingText || '加载中...' }}</span>
          </div>
        </slot>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" key="error" class="http-loader__state">
        <slot name="error" :error="error" :retry="handleRetry">
          <component v-if="errorComponent" :is="errorComponent" :error="error" :retry="handleRetry" />
          <div v-else class="http-loader__error">
            <div class="http-loader__error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <circle cx="12" cy="16" r="0.5" fill="currentColor" />
              </svg>
            </div>
            <p class="http-loader__error-message">{{ error.message || '请求失败' }}</p>
            <p v-if="error.code" class="http-loader__error-code">错误码: {{ error.code }}</p>
            <button v-if="retryable" class="http-loader__btn http-loader__btn--primary" @click="handleRetry">
              <svg class="http-loader__btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              重试
            </button>
          </div>
        </slot>
      </div>

      <!-- 空数据状态 -->
      <div v-else-if="isEmptyData" key="empty" class="http-loader__state">
        <slot name="empty">
          <component v-if="emptyComponent" :is="emptyComponent" />
          <div v-else class="http-loader__empty">
            <div class="http-loader__empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p class="http-loader__empty-text">{{ emptyText || '暂无数据' }}</p>
          </div>
        </slot>
      </div>

      <!-- 数据加载完成 -->
      <div v-else key="content" class="http-loader__content">
        <slot
          :data="data"
          :loading="loading"
          :error="error"
          :refresh="handleRefresh"
          :retry="handleRetry"
          :cancel="handleCancel"
          :isEmpty="isEmptyData"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts" generic="T = any">
import { ref, computed, watch, onMounted, onUnmounted, inject, type Component } from 'vue'
import type { HttpLoaderProps } from './types'
import type { HttpClient, HttpError } from '../../types/http'
import { HTTP_PROVIDER_KEY } from '../HttpProvider/types'

// Props 定义
const props = withDefaults(defineProps<HttpLoaderProps<T>>(), {
  method: 'GET',
  immediate: true,
  cache: false,
  cacheTtl: 5 * 60 * 1000,
  retryable: true,
})

// 注入 HttpClient
const httpContext = inject(HTTP_PROVIDER_KEY, null)
const httpClient = httpContext?.client

if (!httpClient) {
  throw new Error('HttpLoader: HttpClient not found. Please wrap your component with HttpProvider.')
}

// 响应式状态
const data = ref<T | null>(null)
const loading = ref(false)
const error = ref<HttpError | null>(null)
const abortController = ref<AbortController | null>(null)
const pollingTimer = ref<number | null>(null)

// 计算属性
const isEmptyData = computed(() => {
  if (!data.value) return true
  if (props.isEmpty) {
    return props.isEmpty(data.value)
  }
  // 默认空值判断
  if (Array.isArray(data.value)) {
    return data.value.length === 0
  }
  if (typeof data.value === 'object') {
    return Object.keys(data.value).length === 0
  }
  return false
})

const loadingComponent = computed(() => {
  return typeof props.loading === 'object' ? props.loading as Component : null
})

const loadingText = computed(() => {
  return typeof props.loading === 'string' ? props.loading : null
})

const errorComponent = computed(() => {
  return typeof props.error === 'object' ? props.error as Component : null
})

const emptyComponent = computed(() => {
  return typeof props.empty === 'object' ? props.empty as Component : null
})

const emptyText = computed(() => {
  return typeof props.empty === 'string' ? props.empty : null
})

/** 根元素的动态类名 */
const rootClasses = computed(() => ({
  'http-loader--loading': loading.value,
  'http-loader--error': !!error.value,
  'http-loader--empty': isEmptyData.value && !loading.value && !error.value,
  'http-loader--dark': props.dark,
}))

// 执行请求
const executeRequest = async () => {
  // 取消上一个请求
  if (abortController.value) {
    abortController.value.abort()
  }

  // 创建新的 AbortController
  abortController.value = new AbortController()

  loading.value = true
  error.value = null

  try {
    // 构建请求配置
    const requestConfig: any = {
      url: props.url,
      method: props.method,
      params: props.params,
      data: props.data,
      signal: abortController.value.signal,
    }

    // 添加缓存配置
    if (props.cache && props.cacheTtl) {
      requestConfig.cacheConfig = {
        enabled: true,
        ttl: props.cacheTtl,
      }
    }

    // 添加重试配置
    if (props.retry) {
      requestConfig.retry = props.retry
    }

    // 合并用户的自定义配置
    if (props.requestConfig) {
      Object.assign(requestConfig, props.requestConfig)
    }

    const response = await httpClient.request<T>(requestConfig)
    
    // 数据转换
    data.value = props.transform ? props.transform(response.data) : response.data
    error.value = null
  } catch (err: any) {
    // 忽略取消错误
    if (err.name === 'AbortError' || err.message?.includes('abort')) {
      return
    }
    error.value = err as HttpError
    data.value = null
  } finally {
    loading.value = false
  }
}

// 刷新函数
const handleRefresh = async () => {
  await executeRequest()
}

// 重试函数
const handleRetry = async () => {
  await executeRequest()
}

// 取消请求
const handleCancel = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  loading.value = false
}

// 启动轮询
const startPolling = () => {
  if (!props.pollingInterval) return

  stopPolling()
  pollingTimer.value = window.setInterval(() => {
    executeRequest()
  }, props.pollingInterval)
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

// 监听 URL 变化
watch(
  () => [props.url, props.params, props.data],
  () => {
    if (!props.immediate) return
    executeRequest()
  },
  { deep: true }
)

// 组件挂载
onMounted(() => {
  if (props.immediate) {
    executeRequest()
  }

  // 启动轮询
  if (props.pollingInterval) {
    startPolling()
  }
})

// 组件卸载
onUnmounted(() => {
  handleCancel()
  stopPolling()
})

// 暴露方法给父组件
defineExpose({
  refresh: handleRefresh,
  retry: handleRetry,
  cancel: handleCancel,
  data,
  loading,
  error,
})
</script>

<style scoped>
/* ==================== CSS 变量（主题支持） ==================== */
.http-loader {
  --http-loader-primary: #3b82f6;
  --http-loader-primary-hover: #2563eb;
  --http-loader-primary-active: #1d4ed8;
  --http-loader-error: #ef4444;
  --http-loader-error-light: #fef2f2;
  --http-loader-warning: #f59e0b;
  --http-loader-text: #374151;
  --http-loader-text-secondary: #6b7280;
  --http-loader-text-muted: #9ca3af;
  --http-loader-bg: #ffffff;
  --http-loader-bg-secondary: #f9fafb;
  --http-loader-border: #e5e7eb;
  --http-loader-radius: 8px;
  --http-loader-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --http-loader-transition: 0.2s ease;

  width: 100%;
  min-height: 120px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 深色主题支持 */
.http-loader--dark {
  --http-loader-primary: #60a5fa;
  --http-loader-primary-hover: #93c5fd;
  --http-loader-error: #f87171;
  --http-loader-error-light: #450a0a;
  --http-loader-text: #f3f4f6;
  --http-loader-text-secondary: #d1d5db;
  --http-loader-text-muted: #9ca3af;
  --http-loader-bg: #1f2937;
  --http-loader-bg-secondary: #374151;
  --http-loader-border: #4b5563;
}

/* ==================== 过渡动画 ==================== */
.http-loader-fade-enter-active,
.http-loader-fade-leave-active {
  transition: opacity var(--http-loader-transition), transform var(--http-loader-transition);
}

.http-loader-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.http-loader-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ==================== 状态容器 ==================== */
.http-loader__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: inherit;
  padding: 24px;
}

.http-loader__content {
  width: 100%;
}

/* ==================== 加载状态 ==================== */
.http-loader__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.http-loader__spinner {
  width: 40px;
  height: 40px;
  color: var(--http-loader-primary);
}

.http-loader__spinner-icon {
  width: 100%;
  height: 100%;
  animation: http-loader-spin 1s linear infinite;
}

.http-loader__spinner-track {
  opacity: 0.2;
}

.http-loader__spinner-progress {
  stroke-dasharray: 30 70;
}

@keyframes http-loader-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.http-loader__loading-text {
  font-size: 14px;
  color: var(--http-loader-text-secondary);
}

/* ==================== 错误状态 ==================== */
.http-loader__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  max-width: 320px;
  text-align: center;
}

.http-loader__error-icon {
  width: 48px;
  height: 48px;
  color: var(--http-loader-error);
}

.http-loader__error-icon svg {
  width: 100%;
  height: 100%;
}

.http-loader__error-message {
  font-size: 15px;
  font-weight: 500;
  color: var(--http-loader-text);
  margin: 0;
  line-height: 1.5;
}

.http-loader__error-code {
  font-size: 12px;
  color: var(--http-loader-text-muted);
  margin: 0;
  padding: 4px 8px;
  background: var(--http-loader-bg-secondary);
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
}

/* ==================== 空状态 ==================== */
.http-loader__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 24px;
}

.http-loader__empty-icon {
  width: 64px;
  height: 64px;
  color: var(--http-loader-text-muted);
  opacity: 0.6;
}

.http-loader__empty-icon svg {
  width: 100%;
  height: 100%;
}

.http-loader__empty-text {
  font-size: 14px;
  color: var(--http-loader-text-secondary);
  margin: 0;
}

/* ==================== 按钮样式 ==================== */
.http-loader__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  border: none;
  border-radius: var(--http-loader-radius);
  cursor: pointer;
  transition: all var(--http-loader-transition);
  outline: none;
}

.http-loader__btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.http-loader__btn--primary {
  background: var(--http-loader-primary);
  color: white;
}

.http-loader__btn--primary:hover {
  background: var(--http-loader-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--http-loader-shadow);
}

.http-loader__btn--primary:active {
  background: var(--http-loader-primary-active);
  transform: translateY(0);
}

.http-loader__btn-icon {
  width: 16px;
  height: 16px;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 480px) {
  .http-loader__state {
    padding: 16px;
  }

  .http-loader__error {
    padding: 16px;
  }

  .http-loader__spinner {
    width: 32px;
    height: 32px;
  }

  .http-loader__error-icon {
    width: 40px;
    height: 40px;
  }

  .http-loader__empty-icon {
    width: 48px;
    height: 48px;
  }
}

/* ==================== 辅助功能支持 ==================== */
@media (prefers-reduced-motion: reduce) {
  .http-loader__spinner-icon {
    animation: none;
  }

  .http-loader-fade-enter-active,
  .http-loader-fade-leave-active {
    transition: opacity 0.1s;
  }

  .http-loader-fade-enter-from,
  .http-loader-fade-leave-to {
    transform: none;
  }
}
</style>
