/**
 * v-retry 指令
 * 
 * 失败重试指令，自动重试失败的请求
 * 
 * @example
 * ```vue
 * <button v-retry="{ maxRetries: 3, delay: 1000 }" @click="fetchData">
 *   获取数据
 * </button>
 * 
 * <div v-retry:auto="{ maxRetries: 5, backoff: true }">
 *   自动重试内容
 * </div>
 * ```
 */
import type { Directive, DirectiveBinding } from 'vue'

interface RetryOptions {
  /** 最大重试次数 */
  maxRetries?: number
  /** 重试延迟（毫秒） */
  delay?: number
  /** 是否使用指数退避 */
  backoff?: boolean
  /** 退避因子 */
  backoffFactor?: number
  /** 重试回调 */
  onRetry?: (attempt: number) => void
  /** 失败回调 */
  onFailed?: (error: any) => void
}

/**
 * 计算重试延迟
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  useBackoff: boolean,
  backoffFactor: number,
): number {
  if (!useBackoff) {
    return baseDelay
  }
  return baseDelay * Math.pow(backoffFactor, attempt - 1)
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 执行重试逻辑
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const maxRetries = options.maxRetries || 3
  const baseDelay = options.delay || 1000
  const useBackoff = options.backoff || false
  const backoffFactor = options.backoffFactor || 2

  let lastError: any

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn()
    }
    catch (error) {
      lastError = error

      if (attempt <= maxRetries) {
        // 触发重试回调
        options.onRetry?.(attempt)

        // 计算延迟时间
        const delayMs = calculateDelay(attempt, baseDelay, useBackoff, backoffFactor)

        // 等待后重试
        await delay(delayMs)
      }
    }
  }

  // 所有重试都失败
  options.onFailed?.(lastError)
  throw lastError
}

/**
 * 解析指令值
 */
function parseValue(value: number | RetryOptions): RetryOptions {
  if (typeof value === 'number') {
    return { maxRetries: value }
  }
  return value
}

/**
 * v-retry 指令定义
 */
export const vRetry: Directive<HTMLElement, number | RetryOptions> = {
  mounted(el, binding) {
    const options = parseValue(binding.value)

    // 包装原始点击处理器
    const originalHandler = (el as any).onclick
    if (originalHandler) {
      ;(el as any).onclick = async function (event: Event) {
        try {
          await executeWithRetry(
            () => Promise.resolve(originalHandler.call(this, event)),
            options,
          )
        }
        catch (error) {
          console.error('[v-retry] All retries failed:', error)
        }
      }
    }

    // 监听自定义重试事件
    const retryHandler = async (event: CustomEvent) => {
      const fn = event.detail?.fn
      if (typeof fn === 'function') {
        try {
          await executeWithRetry(fn, options)
        }
        catch (error) {
          console.error('[v-retry] All retries failed:', error)
        }
      }
    }

    el.addEventListener('retry', retryHandler as EventListener)
    ;(el as any)._retryHandler = retryHandler
  },

  updated(el, binding) {
    const options = parseValue(binding.value)

    // 更新重试选项
    ;(el as any)._retryOptions = options
  },

  unmounted(el) {
    // 移除事件监听器
    const retryHandler = (el as any)._retryHandler
    if (retryHandler) {
      el.removeEventListener('retry', retryHandler as EventListener)
      delete (el as any)._retryHandler
    }

    delete (el as any)._retryOptions
  },
}

/**
 * 触发重试
 * 
 * @example
 * ```ts
 * import { triggerRetry } from '@ldesign/http-vue'
 * 
 * triggerRetry(element, async () => {
 *   return await fetchData()
 * })
 * ```
 */
export function triggerRetry(el: HTMLElement, fn: () => Promise<any>): void {
  el.dispatchEvent(new CustomEvent('retry', {
    detail: { fn },
  }))
}

