/**
 * v-throttle 指令 - 节流处理
 * 
 * 用法:
 * <button v-throttle="handleClick">点击</button>
 * <button v-throttle:1000="handleClick">1秒节流</button>
 * <div v-throttle="{ fn: handleScroll, delay: 200, leading: true, trailing: false }" @scroll="...">滚动</div>
 */

import type { Directive, DirectiveBinding } from 'vue'

export interface ThrottleDirectiveOptions {
  /** 节流函数 */
  fn: (...args: any[]) => void
  /** 节流延迟（毫秒） */
  delay?: number
  /** 是否在开始时立即执行 */
  leading?: boolean
  /** 是否在结束时执行 */
  trailing?: boolean
  /** 事件类型 */
  event?: string
}

export interface ThrottleDirectiveElement extends HTMLElement {
  _throttleInstance?: {
    options: ThrottleDirectiveOptions
    timer?: number
    lastCallTime?: number
    lastInvokeTime?: number
    lastArgs?: any[]
    lastThis?: any
    handler: (event: Event) => void
  }
}

/**
 * 创建节流函数
 */
function createThrottledFunction(
  fn: (...args: any[]) => void,
  delay: number,
  leading: boolean,
  trailing: boolean
): {
  execute: (...args: any[]) => void
  cancel: () => void
  flush: () => void
  pending: () => boolean
} {
  let timer: number | undefined
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
      timeSinceLastCall < 0
    )
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time
    timer = window.setTimeout(timerExpired, delay)
    return leading ? invokeFunc(time) : undefined
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime || 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = delay - timeSinceLastCall

    return timeWaiting
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // 重新启动定时器
    timer = window.setTimeout(timerExpired, remainingWait(time))
  }

  function trailingEdge(time: number) {
    timer = undefined

    if (trailing && lastArgs) {
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
    lastInvokeTime = 0
    lastCallTime = undefined
    lastArgs = undefined
    lastThis = undefined
  }

  function flush() {
    if (timer === undefined) {
      return undefined
    }
    const time = Date.now()
    cancel()
    return invokeFunc(time)
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
      if (timer === undefined) {
        return leadingEdge(lastCallTime)
      }
    }

    if (timer === undefined) {
      timer = window.setTimeout(timerExpired, delay)
    }

    return undefined
  }

  return { execute, cancel, flush, pending }
}

/**
 * 解析指令选项
 */
function parseOptions(
  binding: DirectiveBinding<ThrottleDirectiveOptions | ((...args: any[]) => void)>,
  arg?: string
): ThrottleDirectiveOptions | null {
  let options: ThrottleDirectiveOptions

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
    console.warn('[v-throttle] Invalid directive value:', binding.value)
    return null
  }

  // 验证 fn
  if (typeof options.fn !== 'function') {
    console.warn('[v-throttle] Missing required "fn" option')
    return null
  }

  // 设置默认值
  if (options.delay === undefined) {
    options.delay = 300
  }
  if (options.leading === undefined) {
    options.leading = true
  }
  if (options.trailing === undefined) {
    options.trailing = true
  }

  return options
}

/**
 * 获取事件类型
 */
function getEventType(el: HTMLElement, options: ThrottleDirectiveOptions): string {
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
function setupEventHandler(el: ThrottleDirectiveElement): void {
  const instance = el._throttleInstance
  if (!instance) return

  const { options } = instance
  const delay = options.delay || 300
  const leading = options.leading ?? true
  const trailing = options.trailing ?? true

  // 创建节流函数
  const throttled = createThrottledFunction(
    options.fn,
    delay,
    leading,
    trailing
  )

  // 创建事件处理器
  instance.handler = (event: Event) => {
    throttled.execute(event)
  }

  // 添加事件监听
  const eventType = getEventType(el, options)
  el.addEventListener(eventType, instance.handler)

  // 保存取消和刷新方法
  ;(el as any)._throttledCancel = throttled.cancel
  ;(el as any)._throttledFlush = throttled.flush
  ;(el as any)._throttledPending = throttled.pending
}

/**
 * 移除事件处理器
 */
function removeEventHandler(el: ThrottleDirectiveElement): void {
  const instance = el._throttleInstance
  if (!instance) return

  // 取消节流
  if ((el as any)._throttledCancel) {
    ;(el as any)._throttledCancel()
    delete (el as any)._throttledCancel
    delete (el as any)._throttledFlush
    delete (el as any)._throttledPending
  }

  // 移除事件监听
  const eventType = getEventType(el, instance.options)
  el.removeEventListener(eventType, instance.handler)
}

/**
 * v-throttle 指令定义
 */
export const vThrottle: Directive<
  ThrottleDirectiveElement,
  ThrottleDirectiveOptions | ((...args: any[]) => void)
> = {
  mounted(el, binding) {
    const options = parseOptions(binding, binding.arg)
    if (!options) return

    // 初始化实例
    el._throttleInstance = {
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

      el._throttleInstance = {
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
    el._throttleInstance = undefined
  },
}

/**
 * 便捷方法：取消节流
 */
export function cancelThrottle(el: ThrottleDirectiveElement): void {
  if ((el as any)._throttledCancel) {
    ;(el as any)._throttledCancel()
  }
}

/**
 * 便捷方法：立即执行节流函数
 */
export function flushThrottle(el: ThrottleDirectiveElement): void {
  if ((el as any)._throttledFlush) {
    ;(el as any)._throttledFlush()
  }
}

/**
 * 便捷方法：检查是否有待执行的节流函数
 */
export function isPendingThrottle(el: ThrottleDirectiveElement): boolean {
  if ((el as any)._throttledPending) {
    return (el as any)._throttledPending()
  }
  return false
}

// 默认导出
export default vThrottle