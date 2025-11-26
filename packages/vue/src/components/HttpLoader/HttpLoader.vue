<template>
  <div class="http-loader">
    <!-- 加载状态 -->
    <slot v-if="loading" name="loading">
      <component v-if="loadingComponent" :is="loadingComponent" />
      <div v-else class="http-loader__loading">
        {{ loadingText || '加载中...' }}
      </div>
    </slot>

    <!-- 错误状态 -->
    <slot v-else-if="error" name="error" :error="error" :retry="handleRetry">
      <component v-if="errorComponent" :is="errorComponent" :error="error" :retry="handleRetry" />
      <div v-else class="http-loader__error">
        <p class="http-loader__error-message">{{ error.message || '请求失败' }}</p>
        <button v-if="retryable" class="http-loader__retry-btn" @click="handleRetry">
          重试
        </button>
      </div>
    </slot>

    <!-- 空数据状态 -->
    <slot v-else-if="isEmptyData" name="empty">
      <component v-if="emptyComponent" :is="emptyComponent" />
      <div v-else class="http-loader__empty">
        {{ emptyText || '暂无数据' }}
      </div>
    </slot>

    <!-- 数据加载完成 -->
    <slot
      v-else
      :data="data"
      :loading="loading"
      :error="error"
      :refresh="handleRefresh"
      :retry="handleRetry"
      :cancel="handleCancel"
      :isEmpty="isEmptyData"
    ></slot>
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
.http-loader {
  width: 100%;
}

.http-loader__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

.http-loader__error {
  padding: 20px;
  text-align: center;
}

.http-loader__error-message {
  color: #f56c6c;
  margin-bottom: 12px;
  font-size: 14px;
}

.http-loader__retry-btn {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.http-loader__retry-btn:hover {
  background-color: #66b1ff;
}

.http-loader__retry-btn:active {
  background-color: #3a8ee6;
}

.http-loader__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}
</style>