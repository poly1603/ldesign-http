/**
 * v-retry 指令 - 重试控制
 * 
 * 用法:
 * <button v-retry="retryFn">重试</button>
 * <button v-retry="{ fn: retryFn, maxRetries: 3 }">重试</button>
 * <button v-retry:auto="{ fn: retryFn, delay: 1000 }">自动重试</button>
 */

import type { Directive, DirectiveBinding } from 'vue'

export interface RetryDirectiveOptions {
  /** 重试函数 */
  fn: () => Promise<any> | any
  /** 最大重试次数 */
  maxRetries?: number
  /** 重试延迟（毫秒） */
  delay?: number
  /** 指数退避 */
  exponentialBackoff?: boolean
  /** 退避因子 */
  backoffMultiplier?: number
  /** 成功回调 */
  onSuccess?: (result: any) => void
  /** 失败回调 */
  onError?: (error: Error) => void
  /** 重试回调 */
  onRetry?: (attempt: number, maxRetries: number) => void
  /** 禁用状态 */
  disabled?: boolean
  /** 自动重试（无需用户点击） */
  auto?: boolean
}

export interface RetryDirectiveElement extends HTMLElement {
  _retryInstance?: {
    options: RetryDirectiveOptions
    currentAttempt: number
    isRetrying: boolean
    timer?: number
    abortController?: AbortController
  }
  _retryOriginalText?: string
  _retryClickHandler?: () => void
}

/**
 * 计算重试延迟
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  exponentialBackoff: boolean,
  backoffMultiplier: number
): number {
  if (!exponentialBackoff) {
    return baseDelay
  }
  return baseDelay * Math.pow(backoffMultiplier, attempt - 1)
}

/**
 * 更新元素状态
 */
function updateElementState(
  el: RetryDirectiveElement,
  state: 'idle' | 'retrying' | 'success' | 'error'
): void {
  el.setAttribute('data-retry-state', state)

  const instance = el._retryInstance
  if (!instance) return

  switch (state) {
    case 'idle':
      el.removeAttribute('disabled')
      if (el._retryOriginalText) {
        el.textContent = el._retryOriginalText
      }
      break

    case 'retrying':
      el.setAttribute('disabled', 'true')
      if (el._retryOriginalText === undefined) {
        el._retryOriginalText = el.textContent || ''
      }
      el.textContent = `重试中 (${instance.currentAttempt}/${instance.options.maxRetries || 3})...`
      break

    case 'success':
      el.removeAttribute('disabled')
      if (el._retryOriginalText) {
        el.textContent = el._retryOriginalText
      }
      setTimeout(() => {
        el.removeAttribute('data-retry-state')
      }, 2000)
      break

    case 'error':
      el.removeAttribute('disabled')
      if (el._retryOriginalText) {
        el.textContent = el._retryOriginalText
      }
      break
  }
}

/**
 * 执行重试
 */
async function executeRetry(el: RetryDirectiveElement): Promise<void> {
  const instance = el._retryInstance
  if (!instance || instance.isRetrying) return

  const { options } = instance
  const maxRetries = options.maxRetries || 3
  const baseDelay = options.delay || 1000
  const exponentialBackoff = options.exponentialBackoff ?? true
  const backoffMultiplier = options.backoffMultiplier || 2

  // 如果已禁用，不执行
  if (options.disabled) {
    return
  }

  instance.isRetrying = true
  instance.currentAttempt = 0
  instance.abortController = new AbortController()

  while (instance.currentAttempt < maxRetries) {
    instance.currentAttempt++

    try {
      // 更新状态
      updateElementState(el, 'retrying')

      // 触发重试回调
      options.onRetry?.(instance.currentAttempt, maxRetries)

      // 执行重试函数
      const result = await Promise.resolve(options.fn())

      // 检查是否已取消
      if (instance.abortController.signal.aborted) {
        return
      }

      // 成功
      updateElementState(el, 'success')
      options.onSuccess?.(result)
      instance.isRetrying = false
      return
    } catch (error: any) {
      // 检查是否已取消
      if (instance.abortController.signal.aborted) {
        return
      }

      // 如果已达到最大重试次数
      if (instance.currentAttempt >= maxRetries) {
        updateElementState(el, 'error')
        options.onError?.(error)
        instance.isRetrying = false
        return
      }

      // 计算延迟时间
      const delay = calculateDelay(
        instance.currentAttempt,
        baseDelay,
        exponentialBackoff,
        backoffMultiplier
      )

      // 等待延迟
      await new Promise<void>((resolve) => {
        instance.timer = window.setTimeout(() => {
          resolve()
        }, delay)
      })

      // 检查是否已取消
      if (instance.abortController.signal.aborted) {
        return
      }
    }
  }
}

/**
 * 取消重试
 */
function cancelRetry(el: RetryDirectiveElement): void {
  const instance = el._retryInstance
  if (!instance) return

  // 取消定时器
  if (instance.timer) {
    clearTimeout(instance.timer)
    instance.timer = undefined
  }

  // 取消 AbortController
  if (instance.abortController) {
    instance.abortController.abort()
    instance.abortController = undefined
  }

  instance.isRetrying = false
  updateElementState(el, 'idle')
}

/**
 * 解析指令选项
 */
function parseOptions(
  binding: DirectiveBinding<RetryDirectiveOptions | (() => any)>,
  arg?: string
): RetryDirectiveOptions | null {
  let options: RetryDirectiveOptions

  // 如果 value 是函数
  if (typeof binding.value === 'function') {
    options = { fn: binding.value }
  } else if (typeof binding.value === 'object' && binding.value) {
    options = binding.value
  } else {
    console.warn('[v-retry] Invalid directive value:', binding.value)
    return null
  }

  // 验证 fn
  if (typeof options.fn !== 'function') {
    console.warn('[v-retry] Missing required "fn" option')
    return null
  }

  // 处理参数
  if (arg === 'auto' || binding.modifiers.auto) {
    options.auto = true
  }

  return options
}

/**
 * 设置点击处理器
 */
function setupClickHandler(el: RetryDirectiveElement): void {
  // 移除旧的处理器
  if (el._retryClickHandler) {
    el.removeEventListener('click', el._retryClickHandler)
  }

  // 创建新的处理器
  el._retryClickHandler = () => {
    executeRetry(el)
  }

  // 添加事件监听
  el.addEventListener('click', el._retryClickHandler)
}

/**
 * v-retry 指令定义
 */
export const vRetry: Directive<RetryDirectiveElement, RetryDirectiveOptions | (() => any)> = {
  mounted(el, binding) {
    const options = parseOptions(binding, binding.arg)
    if (!options) return

    // 初始化实例
    el._retryInstance = {
      options,
      currentAttempt: 0,
      isRetrying: false,
    }

    // 设置点击处理器
    setupClickHandler(el)

    // 如果是自动重试模式，立即执行
    if (options.auto) {
      Promise.resolve().then(() => {
        executeRetry(el)
      })
    }

    // 初始化状态
    updateElementState(el, 'idle')
  },

  updated(el, binding) {
    const options = parseOptions(binding, binding.arg)
    if (!options) return

    const instance = el._retryInstance
    if (!instance) return

    // 更新配置
    instance.options = options

    // 如果配置变化，取消当前重试
    if (binding.value !== binding.oldValue) {
      cancelRetry(el)

      // 如果是自动重试模式，重新执行
      if (options.auto && !options.disabled) {
        executeRetry(el)
      }
    }
  },

  unmounted(el) {
    // 取消重试
    cancelRetry(el)

    // 移除事件监听
    if (el._retryClickHandler) {
      el.removeEventListener('click', el._retryClickHandler)
      el._retryClickHandler = undefined
    }

    // 清理引用
    el._retryInstance = undefined
    el._retryOriginalText = undefined
  },
}

/**
 * 便捷方法：手动触发重试
 */
export function triggerRetry(el: RetryDirectiveElement): void {
  executeRetry(el)
}

/**
 * 便捷方法：取消重试
 */
export function cancelRetryDirective(el: RetryDirectiveElement): void {
  cancelRetry(el)
}

// 默认导出
export default vRetry
