/**
 * v-http 指令 - 声明式 HTTP 请求
 * 
 * 用法:
 * <div v-http="{ url: '/api/users', method: 'GET' }"></div>
 * <div v-http:get="'/api/users'"></div>
 * <div v-http:post="{ url: '/api/users', data: formData }"></div>
 */

import type { Directive, DirectiveBinding } from 'vue'
import type { HttpClient } from '@ldesign/http-core'

export interface HttpDirectiveOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  params?: Record<string, any>
  data?: any
  headers?: Record<string, string>
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  onLoading?: (loading: boolean) => void
  immediate?: boolean
}

export interface HttpDirectiveElement extends HTMLElement {
  _httpAbortController?: AbortController
  _httpClient?: HttpClient
  _httpOptions?: HttpDirectiveOptions
}

/**
 * 执行 HTTP 请求
 */
async function executeRequest(
  el: HttpDirectiveElement,
  client: HttpClient,
  options: HttpDirectiveOptions
): Promise<void> {
  // 取消之前的请求
  if (el._httpAbortController) {
    el._httpAbortController.abort()
  }

  // 创建新的 AbortController
  el._httpAbortController = new AbortController()

  try {
    // 触发 loading 回调
    options.onLoading?.(true)
    el.setAttribute('data-http-loading', 'true')

    // 发起请求
    const response = await client.request({
      url: options.url,
      method: options.method || 'GET',
      params: options.params,
      data: options.data,
      headers: options.headers,
      signal: el._httpAbortController.signal,
    } as any)

    // 成功回调
    options.onSuccess?.(response.data)
    el.setAttribute('data-http-status', 'success')
    el.removeAttribute('data-http-error')
  } catch (error: any) {
    // 如果是取消请求，不触发错误回调
    if (error.name === 'AbortError' || error.code === 'CANCELED') {
      return
    }

    // 错误回调
    options.onError?.(error)
    el.setAttribute('data-http-status', 'error')
    el.setAttribute('data-http-error', error.message || 'Unknown error')
  } finally {
    // 结束 loading
    options.onLoading?.(false)
    el.removeAttribute('data-http-loading')
  }
}

/**
 * 解析指令参数
 */
function parseDirectiveOptions(
  binding: DirectiveBinding<string | HttpDirectiveOptions>,
  arg?: string
): HttpDirectiveOptions | null {
  let options: HttpDirectiveOptions

  // 如果 value 是字符串，认为是 URL
  if (typeof binding.value === 'string') {
    options = {
      url: binding.value,
      method: arg?.toUpperCase() as HttpDirectiveOptions['method'],
    }
  } else if (binding.value && typeof binding.value === 'object') {
    options = binding.value
    if (arg) {
      options.method = arg.toUpperCase() as HttpDirectiveOptions['method']
    }
  } else {
    console.warn('[v-http] Invalid directive value:', binding.value)
    return null
  }

  // 验证 URL
  if (!options.url) {
    console.warn('[v-http] Missing required "url" option')
    return null
  }

  return options
}

/**
 * 获取 HttpClient 实例
 */
function getHttpClient(el: HttpDirectiveElement): HttpClient | null {
  // 从元素上获取
  if (el._httpClient) {
    return el._httpClient
  }

  // 从 Vue 实例上获取（通过 provide/inject）
  const vnode = (el as any).__vnode
  if (vnode?.appContext?.provides?.httpClient) {
    return vnode.appContext.provides.httpClient
  }

  console.warn('[v-http] HttpClient not found. Please provide it via plugin or directive binding.')
  return null
}

/**
 * v-http 指令定义
 */
export const vHttp: Directive<HttpDirectiveElement, string | HttpDirectiveOptions> = {
  mounted(el, binding) {
    const options = parseDirectiveOptions(binding, binding.arg)
    if (!options) return

    const client = getHttpClient(el)
    if (!client) return

    // 保存配置
    el._httpClient = client
    el._httpOptions = options

    // 如果 immediate 为 true 或未指定，立即执行
    if (options.immediate !== false) {
      executeRequest(el, client, options)
    }
  },

  updated(el, binding) {
    const options = parseDirectiveOptions(binding, binding.arg)
    if (!options) return

    const client = getHttpClient(el)
    if (!client) return

    // 更新配置
    el._httpOptions = options

    // 如果参数变化，重新执行请求
    if (binding.value !== binding.oldValue) {
      executeRequest(el, client, options)
    }
  },

  unmounted(el) {
    // 取消请求
    if (el._httpAbortController) {
      el._httpAbortController.abort()
      el._httpAbortController = undefined
    }

    // 清理引用
    el._httpClient = undefined
    el._httpOptions = undefined
  },
}

/**
 * 便捷方法：手动触发请求
 */
export function triggerHttpRequest(el: HttpDirectiveElement): void {
  if (!el._httpClient || !el._httpOptions) {
    console.warn('[v-http] Cannot trigger request: missing client or options')
    return
  }

  executeRequest(el, el._httpClient, el._httpOptions)
}

/**
 * 便捷方法：取消请求
 */
export function cancelHttpRequest(el: HttpDirectiveElement): void {
  if (el._httpAbortController) {
    el._httpAbortController.abort()
  }
}

// 默认导出
export default vHttp
