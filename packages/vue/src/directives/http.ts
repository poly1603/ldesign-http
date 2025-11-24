/**
 * v-http 指令
 * 
 * 简化的 HTTP 请求指令，用于快速发起请求并处理响应
 * 
 * @example
 * ```vue
 * <button v-http:get="'/api/users'" @http:success="handleSuccess">
 *   获取用户
 * </button>
 * 
 * <button v-http:post="{ url: '/api/users', data: userData }">
 *   创建用户
 * </button>
 * ```
 */
import type { Directive, DirectiveBinding } from 'vue'
import type { HttpClient, RequestConfig } from '@ldesign/http-core'
import { inject } from 'vue'
import { HTTP_CLIENT_KEY } from '../symbols'

interface HttpDirectiveValue {
  url?: string
  method?: string
  data?: any
  params?: Record<string, any>
  config?: RequestConfig
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  onFinally?: () => void
}

/**
 * 解析指令值
 */
function parseValue(value: string | HttpDirectiveValue, arg?: string): RequestConfig {
  if (typeof value === 'string') {
    return {
      url: value,
      method: arg?.toUpperCase() || 'GET',
    }
  }

  return {
    url: value.url || '',
    method: value.method?.toUpperCase() || arg?.toUpperCase() || 'GET',
    data: value.data,
    params: value.params,
    ...value.config,
  }
}

/**
 * 执行 HTTP 请求
 */
async function executeRequest(
  el: HTMLElement,
  binding: DirectiveBinding<string | HttpDirectiveValue>,
  client: HttpClient,
) {
  const value = binding.value
  const config = parseValue(value, binding.arg)

  // 添加加载状态
  el.setAttribute('data-loading', 'true')
  el.setAttribute('disabled', 'true')

  try {
    const response = await client.request(config)

    // 触发成功事件
    el.dispatchEvent(new CustomEvent('http:success', {
      detail: response.data,
    }))

    // 如果是对象值，调用成功回调
    if (typeof value === 'object' && value.onSuccess) {
      value.onSuccess(response.data)
    }

    return response
  }
  catch (error) {
    // 触发错误事件
    el.dispatchEvent(new CustomEvent('http:error', {
      detail: error,
    }))

    // 如果是对象值，调用错误回调
    if (typeof value === 'object' && value.onError) {
      value.onError(error)
    }

    throw error
  }
  finally {
    // 移除加载状态
    el.removeAttribute('data-loading')
    el.removeAttribute('disabled')

    // 触发完成事件
    el.dispatchEvent(new CustomEvent('http:finally'))

    // 如果是对象值，调用完成回调
    if (typeof value === 'object' && value.onFinally) {
      value.onFinally()
    }
  }
}

/**
 * v-http 指令定义
 */
export const vHttp: Directive<HTMLElement, string | HttpDirectiveValue> = {
  mounted(el, binding) {
    const client = inject<HttpClient>(HTTP_CLIENT_KEY)
    if (!client) {
      console.warn('[v-http] HTTP client not found. Did you forget to install the plugin?')
      return
    }

    // 添加点击事件监听器
    const clickHandler = () => {
      executeRequest(el, binding, client)
    }

    el.addEventListener('click', clickHandler)
    // 保存处理器以便卸载时移除
    ;(el as any)._httpClickHandler = clickHandler
  },

  unmounted(el) {
    // 移除事件监听器
    const clickHandler = (el as any)._httpClickHandler
    if (clickHandler) {
      el.removeEventListener('click', clickHandler)
      delete (el as any)._httpClickHandler
    }
  },
}

