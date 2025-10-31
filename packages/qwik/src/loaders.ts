import type { RequestConfig } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { type Signal, useSignal, useTask$ } from '@builder.io/qwik'

export interface QwikHttpOptions extends RequestConfig {
  /** 是否立即执行 */
  immediate?: boolean
}

export interface QwikHttpReturn<T> {
  /** 响应数据 */
  data: Signal<T | null>
  /** 加载状态 */
  loading: Signal<boolean>
  /** 错误信息 */
  error: Signal<Error | null>
  /** 执行请求 */
  execute: (config?: RequestConfig) => Promise<void>
  /** 重置状态 */
  reset: () => void
}

/**
 * Qwik HTTP hook
 */
export function useHttp<T = any>(
  url?: string,
  options: QwikHttpOptions = {},
): QwikHttpReturn<T> {
  const client = createHttpClient()

  const data = useSignal<T | null>(null)
  const loading = useSignal(false)
  const error = useSignal<Error | null>(null)

  const { immediate = false, ...requestConfig } = options

  const execute = async (config?: RequestConfig) => {
    loading.value = true
    error.value = null

    try {
      const mergedConfig: RequestConfig = {
        ...requestConfig,
        ...config,
        url: config?.url || url,
      }

      const response = await client.request<T>(mergedConfig)
      data.value = response.data
    }
    catch (err: any) {
      error.value = err
    }
    finally {
      loading.value = false
    }
  }

  const reset = () => {
    data.value = null
    loading.value = false
    error.value = null
  }

  // 立即执行
  useTask$(({ track }) => {
    track(() => immediate)
    if (immediate && url) {
      execute()
    }
  })

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}

export const useGet = <T = any>(url: string, options: QwikHttpOptions = {}) =>
  useHttp<T>(url, { ...options, method: 'GET' })

export const usePost = <T = any>(url: string, options: QwikHttpOptions = {}) =>
  useHttp<T>(url, { ...options, method: 'POST' })
