<template>
  <div class="http-error" :class="`http-error--${errorType}`">
    <!-- 错误图标 -->
    <div v-if="displayIcon" class="http-error__icon" :style="{ color: errorConfig.color }">
      {{ displayIcon }}
    </div>

    <!-- 错误标题 -->
    <h3 class="http-error__title">
      {{ displayTitle }}
    </h3>

    <!-- 错误消息 -->
    <p class="http-error__message">
      {{ displayMessage }}
    </p>

    <!-- 错误代码 -->
    <div v-if="showCode && errorCode" class="http-error__code">
      错误代码: {{ errorCode }}
    </div>

    <!-- 重试信息 -->
    <div v-if="retryCount !== undefined && maxRetries !== undefined" class="http-error__retry-info">
      重试次数: {{ retryCount }} / {{ maxRetries }}
    </div>

    <!-- 错误详情（可折叠） -->
    <div v-if="showDetails && error" class="http-error__details">
      <button class="http-error__details-toggle" @click="toggleDetails">
        {{ detailsVisible ? '隐藏详情' : '查看详情' }}
      </button>
      <div v-if="detailsVisible" class="http-error__details-content">
        <pre>{{ errorDetails }}</pre>
      </div>
    </div>

    <!-- 错误堆栈（开发模式） -->
    <div v-if="showStack && errorStack" class="http-error__stack">
      <details>
        <summary>错误堆栈</summary>
        <pre>{{ errorStack }}</pre>
      </details>
    </div>

    <!-- 操作按钮 -->
    <div class="http-error__actions">
      <!-- 重试按钮 -->
      <button
        v-if="retryable"
        class="http-error__btn http-error__btn--retry"
        @click="handleRetry"
      >
        {{ retryText }}
      </button>

      <!-- 联系支持 -->
      <a
        v-if="showSupport && (supportUrl || supportEmail)"
        :href="supportUrl || `mailto:${supportEmail}`"
        class="http-error__btn http-error__btn--support"
        target="_blank"
      >
        联系支持
      </a>

      <!-- 自定义插槽 -->
      <slot name="actions" :error="error" :retry="handleRetry" />
    </div>

    <!-- 完全自定义插槽 -->
    <slot :error="error" :retry="handleRetry" :config="errorConfig" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HttpErrorProps } from './types'
import { getErrorTypeConfig } from './types'

// Props 定义
const props = withDefaults(defineProps<HttpErrorProps>(), {
  retryable: true,
  retryText: '重试',
  showDetails: false,
  showCode: true,
  showStack: false,
  showSupport: false,
})

// Emits 定义
const emit = defineEmits<{
  retry: []
}>()

// 响应式状态
const detailsVisible = ref(false)

// 计算属性 - 错误配置
const errorConfig = computed(() => {
  return getErrorTypeConfig(props.error)
})

// 计算属性 - 错误类型
const errorType = computed(() => {
  const httpError = props.error as any
  if (httpError?.isNetworkError) return 'network'
  if (httpError?.isTimeoutError) return 'timeout'
  if (httpError?.isCancelError) return 'cancel'
  if (httpError?.status === 401) return 'unauthorized'
  if (httpError?.status === 403) return 'forbidden'
  if (httpError?.status === 404) return 'not-found'
  if (httpError?.status >= 500) return 'server'
  return 'default'
})

// 计算属性 - 显示标题
const displayTitle = computed(() => {
  return props.title || errorConfig.value.title
})

// 计算属性 - 显示消息
const displayMessage = computed(() => {
  if (props.message) return props.message
  if (props.error?.message) return props.error.message
  return errorConfig.value.message
})

// 计算属性 - 显示图标
const displayIcon = computed(() => {
  return props.icon || errorConfig.value.icon
})

// 计算属性 - 错误代码
const errorCode = computed(() => {
  const httpError = props.error as any
  return httpError?.code || httpError?.status
})

// 计算属性 - 错误详情
const errorDetails = computed(() => {
  if (!props.error) return ''
  
  const details: any = {
    message: props.error.message,
    name: props.error.name,
  }

  const httpError = props.error as any
  if (httpError.status) details.status = httpError.status
  if (httpError.statusText) details.statusText = httpError.statusText
  if (httpError.code) details.code = httpError.code
  if (httpError.config?.url) details.url = httpError.config.url
  if (httpError.config?.method) details.method = httpError.config.method

  return JSON.stringify(details, null, 2)
})

// 计算属性 - 错误堆栈
const errorStack = computed(() => {
  return props.error?.stack || ''
})

// 切换详情显示
const toggleDetails = () => {
  detailsVisible.value = !detailsVisible.value
}

// 处理重试
const handleRetry = () => {
  emit('retry')
}
</script>

<style scoped>
.http-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.http-error__icon {
  font-size: 48px;
  margin-bottom: 16px;
  line-height: 1;
}

.http-error__title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.http-error__message {
  margin: 0 0 16px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.http-error__code {
  margin-bottom: 12px;
  padding: 6px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

.http-error__retry-info {
  margin-bottom: 16px;
  font-size: 13px;
  color: #909399;
}

.http-error__details {
  width: 100%;
  margin-bottom: 16px;
}

.http-error__details-toggle {
  padding: 6px 12px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
}

.http-error__details-toggle:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.http-error__details-content {
  margin-top: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: left;
  max-height: 200px;
  overflow: auto;
}

.http-error__details-content pre {
  margin: 0;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.http-error__stack {
  width: 100%;
  margin-bottom: 16px;
  text-align: left;
}

.http-error__stack details {
  padding: 12px;
  background-color: #fff5f5;
  border: 1px solid #fde2e2;
  border-radius: 4px;
}

.http-error__stack summary {
  font-size: 13px;
  color: #f56c6c;
  cursor: pointer;
  user-select: none;
}

.http-error__stack pre {
  margin-top: 8px;
  font-size: 11px;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 150px;
  overflow: auto;
}

.http-error__actions {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.http-error__btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
}

.http-error__btn--retry {
  background-color: #409eff;
  color: white;
}

.http-error__btn--retry:hover {
  background-color: #66b1ff;
}

.http-error__btn--retry:active {
  background-color: #3a8ee6;
}

.http-error__btn--support {
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.http-error__btn--support:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

/* 错误类型样式 */
.http-error--network .http-error__title,
.http-error--server .http-error__title {
  color: #f56c6c;
}

.http-error--timeout .http-error__title {
  color: #e6a23c;
}

.http-error--unauthorized .http-error__title,
.http-error--forbidden .http-error__title {
  color: #f56c6c;
}

.http-error--not-found .http-error__title,
.http-error--cancel .http-error__title {
  color: #909399;
}
</style>