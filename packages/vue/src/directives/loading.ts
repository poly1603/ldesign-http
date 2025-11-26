/**
 * v-loading 指令 - 加载状态管理
 * 
 * 用法:
 * <div v-loading="isLoading">内容</div>
 * <div v-loading="isLoading" v-loading:fullscreen>全屏加载</div>
 * <div v-loading="isLoading" v-loading:lock>锁定滚动</div>
 */

import type { Directive, DirectiveBinding } from 'vue'

export interface LoadingDirectiveOptions {
  /** 是否显示加载状态 */
  loading: boolean
  /** 加载文本 */
  text?: string
  /** 背景颜色 */
  background?: string
  /** 自定义类名 */
  customClass?: string
  /** 是否全屏 */
  fullscreen?: boolean
  /** 是否锁定滚动 */
  lock?: boolean
  /** spinner 图标 */
  spinner?: string
  /** 最小显示时间（毫秒）- 防止闪烁 */
  minDisplayTime?: number
}

export interface LoadingDirectiveElement extends HTMLElement {
  _loadingInstance?: {
    container: HTMLElement
    spinner: HTMLElement
    text?: HTMLElement
    startTime?: number
    hideTimer?: number
  }
  _loadingOriginalPosition?: string
  _loadingOriginalOverflow?: string
}

/**
 * 创建加载遮罩
 */
function createLoadingMask(
  options: LoadingDirectiveOptions
): { container: HTMLElement; spinner: HTMLElement; text?: HTMLElement } {
  // 创建容器
  const container = document.createElement('div')
  container.className = 'v-loading-mask'
  if (options.customClass) {
    container.className += ` ${options.customClass}`
  }

  // 设置样式
  Object.assign(container.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: options.background || 'rgba(255, 255, 255, 0.9)',
    zIndex: '9999',
    transition: 'opacity 0.3s',
  })

  // 创建 spinner 容器
  const spinnerWrapper = document.createElement('div')
  spinnerWrapper.className = 'v-loading-spinner-wrapper'
  Object.assign(spinnerWrapper.style, {
    textAlign: 'center',
  })

  // 创建 spinner
  const spinner = document.createElement('div')
  spinner.className = options.spinner || 'v-loading-spinner'
  spinner.innerHTML = `
    <svg viewBox="0 0 50 50" style="width: 42px; height: 42px; animation: rotate 2s linear infinite;">
      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" 
        stroke-dasharray="80, 200" stroke-linecap="round"
        style="animation: dash 1.5s ease-in-out infinite; color: #409eff;" />
    </svg>
  `
  spinnerWrapper.appendChild(spinner)

  // 添加文本
  let textElement: HTMLElement | undefined
  if (options.text) {
    textElement = document.createElement('p')
    textElement.className = 'v-loading-text'
    textElement.textContent = options.text
    Object.assign(textElement.style, {
      margin: '12px 0 0',
      fontSize: '14px',
      color: '#606266',
    })
    spinnerWrapper.appendChild(textElement)
  }

  container.appendChild(spinnerWrapper)

  // 添加动画样式
  if (!document.getElementById('v-loading-animations')) {
    const style = document.createElement('style')
    style.id = 'v-loading-animations'
    style.textContent = `
      @keyframes rotate {
        100% { transform: rotate(360deg); }
      }
      @keyframes dash {
        0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
        50% { stroke-dasharray: 90, 200; stroke-dashoffset: -35px; }
        100% { stroke-dasharray: 90, 200; stroke-dashoffset: -125px; }
      }
    `
    document.head.appendChild(style)
  }

  return { container, spinner, text: textElement }
}

/**
 * 显示加载状态
 */
function showLoading(el: LoadingDirectiveElement, options: LoadingDirectiveOptions): void {
  // 如果已经有加载实例，先移除
  if (el._loadingInstance) {
    hideLoading(el)
  }

  // 创建加载遮罩
  const { container, spinner, text } = createLoadingMask(options)

  // 保存原始样式
  el._loadingOriginalPosition = el.style.position
  el._loadingOriginalOverflow = el.style.overflow

  // 设置父元素样式
  if (!options.fullscreen) {
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative'
    }
  }

  // 锁定滚动
  if (options.lock) {
    el._loadingOriginalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  // 添加到 DOM
  const parent = options.fullscreen ? document.body : el
  parent.appendChild(container)

  // 保存实例
  el._loadingInstance = {
    container,
    spinner,
    text,
    startTime: Date.now(),
  }

  // 触发淡入动画
  requestAnimationFrame(() => {
    container.style.opacity = '1'
  })
}

/**
 * 隐藏加载状态
 */
function hideLoading(el: LoadingDirectiveElement, immediate = false): void {
  const instance = el._loadingInstance
  if (!instance) return

  const doHide = () => {
    // 淡出动画
    instance.container.style.opacity = '0'

    setTimeout(() => {
      // 移除 DOM
      instance.container.remove()

      // 恢复原始样式
      if (el._loadingOriginalPosition !== undefined) {
        el.style.position = el._loadingOriginalPosition
      }
      if (el._loadingOriginalOverflow !== undefined) {
        document.body.style.overflow = el._loadingOriginalOverflow
      }

      // 清理引用
      el._loadingInstance = undefined
      el._loadingOriginalPosition = undefined
      el._loadingOriginalOverflow = undefined
    }, 300)
  }

  // 如果设置了最小显示时间，确保至少显示该时间
  if (!immediate && instance.startTime) {
    const minDisplayTime = 300 // 默认最小显示 300ms
    const elapsed = Date.now() - instance.startTime
    const remaining = minDisplayTime - elapsed

    if (remaining > 0) {
      instance.hideTimer = window.setTimeout(doHide, remaining)
      return
    }
  }

  doHide()
}

/**
 * 解析指令选项
 */
function parseOptions(
  binding: DirectiveBinding<boolean | LoadingDirectiveOptions>,
  arg?: string
): LoadingDirectiveOptions {
  let options: LoadingDirectiveOptions

  // 如果 value 是布尔值
  if (typeof binding.value === 'boolean') {
    options = { loading: binding.value }
  } else if (typeof binding.value === 'object') {
    options = binding.value
  } else {
    options = { loading: false }
  }

  // 处理修饰符
  if (arg === 'fullscreen' || binding.modifiers.fullscreen) {
    options.fullscreen = true
  }
  if (arg === 'lock' || binding.modifiers.lock) {
    options.lock = true
  }

  return options
}

/**
 * v-loading 指令定义
 */
export const vLoading: Directive<LoadingDirectiveElement, boolean | LoadingDirectiveOptions> = {
  mounted(el, binding) {
    const options = parseOptions(binding, binding.arg)

    if (options.loading) {
      // 使用 nextTick 确保 DOM 已经渲染
      Promise.resolve().then(() => {
        showLoading(el, options)
      })
    }
  },

  updated(el, binding) {
    const options = parseOptions(binding, binding.arg)
    const prevOptions = parseOptions(
      { ...binding, value: binding.oldValue } as any,
      binding.arg
    )

    // 状态变化时切换显示/隐藏
    if (options.loading !== prevOptions.loading) {
      if (options.loading) {
        showLoading(el, options)
      } else {
        hideLoading(el)
      }
    }
    // 选项变化时更新
    else if (options.loading && binding.value !== binding.oldValue) {
      hideLoading(el, true)
      showLoading(el, options)
    }
  },

  unmounted(el) {
    // 清理定时器
    if (el._loadingInstance?.hideTimer) {
      clearTimeout(el._loadingInstance.hideTimer)
    }

    // 立即隐藏
    hideLoading(el, true)
  },
}

/**
 * 便捷方法：显示加载
 */
export function showLoadingDirective(
  el: LoadingDirectiveElement,
  options?: Partial<LoadingDirectiveOptions>
): void {
  showLoading(el, { loading: true, ...options })
}

/**
 * 便捷方法：隐藏加载
 */
export function hideLoadingDirective(el: LoadingDirectiveElement): void {
  hideLoading(el)
}

// 默认导出
export default vLoading
