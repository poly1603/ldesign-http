/**
 * v-debounce 指令 - 防抖处理
 * 
 * 用法:
 * <input v-debounce="handleInput" />
 * <input v-debounce:500="handleInput" />
 * <button v-debounce="{ fn: handleClick, delay: 300 }">点击</button>
 */

import type { Directive, DirectiveBinding } from 'vue'

export interface DebounceDirectiveOptions {
  /** 防抖函数 */
  fn: (...args: any[]) => void
  /** 防抖延迟（毫秒） */
  delay?: number
  /** 是否在开始时立即执行 */
  immediate?: boolean
  /** 最大等待时间（毫秒） - 防止一直不执行 */
  maxWait?: number
  /** 事件类型 */
  event?: string
}

export interface DebounceDirectiveElement extends HTMLElement {
  _debounceInstance?: {
    options: DebounceDirectiveOptions
    timer?: number
    maxWaitTimer?: number
    lastCallTime?: number
    lastInvokeTime?: number
    handler: (event: Event) => void
  }
}

/**
 * 创建防抖函数
 */
function createDebouncedFunction(
  fn: (...args: any[]) => void,
  delay: number,
  immediate: boolean,
  maxWait?: number
): {
  execute: (...args: any[]) => void
  cancel: () => void
  flush: () => void
  pending: () => boolean
} {
  let timer: number | undefined
  let maxWaitTimer: number | undefined
  let lastCallTime: number | undefined
  let lastInvokeTime = 0
  let lastArgs: any[] | undefined
  let lastThis: any

  function invokeFunc(time: number) {
    const args = lastArgs
    const thisArg = lastThis

    lastArgs = undefined
    lastThis = undefined
    lastInvokeTime = time

    return fn.apply(thisArg, args!)
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime || 0)
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    )
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // 重新启动定时器
    const timeSinceLastCall = time - (lastCallTime || 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = delay - timeSinceLastCall
    const timeUntilMaxWait =
      maxWait === undefined
        ? Infinity
        : maxWait - timeSinceLastInvoke

    const newDelay = Math.min(timeWaiting, timeUntilMaxWait)
    timer = window.setTimeout(timerExpired, newDelay)
  }

  function trailingEdge(time: number) {
    timer = undefined

    if (lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = undefined
    lastThis = undefined
    return undefined
  }

  function cancel() {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    if (maxWaitTimer !== undefined) {
      clearTimeout(maxWaitTimer)
      maxWaitTimer = undefined
    }
    lastInvokeTime = 0
    lastCallTime = undefined
    lastArgs = undefined
    lastThis = undefined
  }

  function flush() {
    if (timer === undefined) {
      return undefined
    }
    cancel()
    return invokeFunc(Date.now())
  }

  function pending(): boolean {
    return timer !== undefined
  }

  function execute(this: any, ...args: any[]) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timer === undefined && immediate) {
        // 立即执行
        lastInvokeTime = time
        timer = window.setTimeout(timerExpired, delay)
        return invokeFunc(time)
      }
      if (timer === undefined) {
        timer = window.setTimeout(timerExpired, delay)
      }
    }

    // maxWait 定时器
    if (maxWait !== undefined && maxWaitTimer === undefined) {
      maxWaitTimer = window.setTimeout(() => {
        maxWaitTimer = undefined
        if (timer !== undefined) {
          clearTimeout(timer)
          timer = undefined
          invokeFunc(Date.now())
        }
      }, maxWait)
    }

    return undefined
  }

  return { execute, cancel, flush, pending }
}

/**
 * 解析指令选项
 */
function parseOptions(
  binding: DirectiveBinding<DebounceDirectiveOptions | ((...args: any[]) => void)>,
  arg?: string
): DebounceDirectiveOptions | null {
  let options: DebounceDirectiveOptions

  // 如果 value 是函数
  if (typeof binding.value === 'function') {
    options = {
      fn: binding.value,
      delay: arg ? parseInt(arg) : 300,
    }
  } else if (typeof binding.value === 'object' && binding.value) {
    options = binding.value
    if (arg) {
      options.delay = parseInt(arg)
    }
  } else {
    console.warn('[v-debounce] Invalid directive value:', binding.value)
    return null
  }

  // 验证 fn
  if (typeof options.fn !== 'function') {
    console.warn('[v-debounce] Missing required "fn" option')
    return null
  }

  // 设置默认值
  if (options.delay === undefined) {
    options.delay = 300
  }

  return options
}

/**
 * 获取事件类型
 */
function getEventType(el: HTMLElement, options: DebounceDirectiveOptions): string {
  if (options.event) {
    return options.event
  }

  // 根据元素类型自动判断
  const tagName = el.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea') {
    return 'input'
  }
  if (tagName === 'select') {
    return 'change'
  }
  return 'click'
}

/**
 * 设置事件处理器
 */
function setupEventHandler(el: DebounceDirectiveElement): void {
  const instance = el._debounceInstance
  if (!instance) return

  const { options } = instance
  const delay = options.delay || 300
  const immediate = options.immediate ?? false
  const maxWait = options.maxWait

  // 创建防抖函数
  const debounced = createDebouncedFunction(
    options.fn,
    delay,
    immediate,
    maxWait
  )

  // 创建事件处理器
  instance.handler = (event: Event) => {
    debounced.execute(event)
  }

  // 添加事件监听
  const eventType = getEventType(el, options)
  el.addEventListener(eventType, instance.handler)

  // 保存取消和刷新方法
  ;(el as any)._debouncedCancel = debounced.cancel
  ;(el as any)._debouncedFlush = debounced.flush
  ;(el as any)._debouncedPending = debounced.pending
}

/**
 * 移除事件处理器
 */
function removeEventHandler(el: DebounceDirectiveElement): void {
  const instance = el._debounceInstance
  if (!instance) return

  // 取消防抖
  if ((el as any)._debouncedCancel) {
    ;(el as any)._debouncedCancel()
    delete (el as any)._debouncedCancel
    delete (el as any)._debouncedFlush
    delete (el as any)._debouncedPending
  }

  // 移除事件监听
  const eventType = getEventType(el, instance.options)
  el.removeEventListener(eventType, instance.handler)
}

/**
 * v-debounce 指令定义
 */
export const vDebounce: Directive<
  DebounceDirectiveElement,
  DebounceDirectiveOptions | ((...args: any[]) => void)
> = {
  mounted(el, binding) {
    const options = parseOptions(binding, binding.arg)
    if (!options) return

    // 初始化实例
    el._debounceInstance = {
      options,
      handler: () => {},
    }

    // 设置事件处理器
    setupEventHandler(el)
  },

  updated(el, binding) {
    const options = parseOptions(binding, binding.arg)
    if (!options) return

    // 如果配置变化，重新设置
    if (binding.value !== binding.oldValue) {
      removeEventHandler(el)

      el._debounceInstance = {
        options,
        handler: () => {},
      }

      setupEventHandler(el)
    }
  },

  unmounted(el) {
    // 移除事件处理器
    removeEventHandler(el)

    // 清理引用
    el._debounceInstance = undefined
  },
}

/**
 * 便捷方法：取消防抖
 */
export function cancelDebounce(el: DebounceDirectiveElement): void {
  if ((el as any)._debouncedCancel) {
    ;(el as any)._debouncedCancel()
  }
}

/**
 * 便捷方法：立即执行防抖函数
 */
export function flushDebounce(el: DebounceDirectiveElement): void {
  if ((el as any)._debouncedFlush) {
    ;(el as any)._debouncedFlush()
  }
}

/**
 * 便捷方法：检查是否有待执行的防抖函数
 */
export function isPendingDebounce(el: DebounceDirectiveElement): boolean {
  if ((el as any)._debouncedPending) {
    return (el as any)._debouncedPending()
  }
  return false
}

// 默认导出
export default vDebounce