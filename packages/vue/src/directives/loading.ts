/**
 * v-loading 指令
 * 
 * 请求加载状态指令，自动显示/隐藏加载状态
 * 
 * @example
 * ```vue
 * <div v-loading="isLoading">
 *   内容区域
 * </div>
 * 
 * <div v-loading="{ loading: isLoading, text: '加载中...', spinner: 'dots' }">
 *   内容区域
 * </div>
 * ```
 */
import type { Directive, DirectiveBinding } from 'vue'

interface LoadingOptions {
  /** 是否显示加载状态 */
  loading: boolean
  /** 加载文本 */
  text?: string
  /** 加载图标类型 */
  spinner?: 'default' | 'dots' | 'circle'
  /** 背景颜色 */
  background?: string
  /** 自定义类名 */
  customClass?: string
}

/**
 * 创建加载遮罩层
 */
function createLoadingMask(options: LoadingOptions): HTMLElement {
  const mask = document.createElement('div')
  mask.className = `http-loading-mask ${options.customClass || ''}`

  // 设置样式
  Object.assign(mask.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: options.background || 'rgba(255, 255, 255, 0.9)',
    zIndex: '1000',
  })

  // 创建加载内容
  const content = document.createElement('div')
  content.className = 'http-loading-content'
  content.style.textAlign = 'center'

  // 创建加载图标
  const spinner = document.createElement('div')
  spinner.className = `http-loading-spinner http-loading-spinner-${options.spinner || 'default'}`
  spinner.innerHTML = getSpinnerHTML(options.spinner || 'default')

  content.appendChild(spinner)

  // 添加加载文本
  if (options.text) {
    const text = document.createElement('div')
    text.className = 'http-loading-text'
    text.textContent = options.text
    text.style.marginTop = '8px'
    text.style.color = '#666'
    content.appendChild(text)
  }

  mask.appendChild(content)
  return mask
}

/**
 * 获取加载图标 HTML
 */
function getSpinnerHTML(type: string): string {
  switch (type) {
    case 'dots':
      return `
        <div style="display: flex; gap: 8px;">
          <div class="dot" style="width: 8px; height: 8px; border-radius: 50%; background: #409eff; animation: bounce 1.4s infinite ease-in-out both;"></div>
          <div class="dot" style="width: 8px; height: 8px; border-radius: 50%; background: #409eff; animation: bounce 1.4s infinite ease-in-out both; animation-delay: 0.16s;"></div>
          <div class="dot" style="width: 8px; height: 8px; border-radius: 50%; background: #409eff; animation: bounce 1.4s infinite ease-in-out both; animation-delay: 0.32s;"></div>
        </div>
      `
    case 'circle':
      return `
        <div style="width: 32px; height: 32px; border: 3px solid #f3f3f3; border-top: 3px solid #409eff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      `
    default:
      return `
        <div style="width: 32px; height: 32px; border: 3px solid #f3f3f3; border-top: 3px solid #409eff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      `
  }
}

/**
 * 添加动画样式
 */
function addAnimationStyles() {
  if (document.getElementById('http-loading-styles')) {
    return
  }

  const style = document.createElement('style')
  style.id = 'http-loading-styles'
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `
  document.head.appendChild(style)
}

/**
 * 解析指令值
 */
function parseValue(value: boolean | LoadingOptions): LoadingOptions {
  if (typeof value === 'boolean') {
    return { loading: value }
  }
  return value
}

/**
 * v-loading 指令定义
 */
export const vLoading: Directive<HTMLElement, boolean | LoadingOptions> = {
  mounted(el, binding) {
    addAnimationStyles()

    const options = parseValue(binding.value)

    if (options.loading) {
      // 设置父元素为相对定位
      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative'
      }

      // 创建并添加遮罩层
      const mask = createLoadingMask(options)
      ;(el as any)._loadingMask = mask
      el.appendChild(mask)
    }
  },

  updated(el, binding) {
    const options = parseValue(binding.value)
    const existingMask = (el as any)._loadingMask

    if (options.loading && !existingMask) {
      // 显示加载状态
      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative'
      }

      const mask = createLoadingMask(options)
      ;(el as any)._loadingMask = mask
      el.appendChild(mask)
    }
    else if (!options.loading && existingMask) {
      // 隐藏加载状态
      el.removeChild(existingMask)
      delete (el as any)._loadingMask
    }
  },

  unmounted(el) {
    const mask = (el as any)._loadingMask
    if (mask && el.contains(mask)) {
      el.removeChild(mask)
      delete (el as any)._loadingMask
    }
  },
}

