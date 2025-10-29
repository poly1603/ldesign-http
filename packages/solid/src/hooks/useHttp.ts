/**
 * useHttp - Solid HTTP 请求 Hook
 */

import { createSignal, createEffect, type Accessor } from 'solid-js'
import type { HttpClient, RequestConfig } from '@ldesign/http-core'

/**
 * useHttp 选项
 */
export interface UseHttpOptions<T = unknown> extends RequestConfig {
  /** 是否立即执行 */
  immediate?: boolean
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 成功回调 */
  onSuccess?: (data: T) => void
}

/**
 * useHttp 返回值
 */
export interface UseHttpReturn<T = unknown> {
  /** 响应数据 */
  data: Accessor<T | null>
  /** 加载状态 */
  loading: Accessor<boolean>
  /** 错误信息 */
  error: Accessor<Error | null>
  /** 执行请求 */
  execute: (config?: RequestConfig) => Promise<void>
  /** 重置状态 */
  reset: () => void
}

/**
 * HTTP 请求 Hook (Solid)
 * 
 * @param url - 请求 URL
 * @param options - 请求选项
 * @param client - HTTP 客户端实例
 * @returns HTTP 请求状态和方法
 * 
 * @example
 * ```tsx
 * import { useHttp } from '@ldesign/http-solid'
 * 
 * function UserList() {
 *   const { data, loading, error } = useHttp(() => '/api/users')
 *   
 *   return (
 *     <div>
 *       {loading() && <div>Loading...</div>}
 *       {error() && <div>Error: {error().message}</div>}
 *       {data() && <div>{JSON.stringify(data())}</div>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useHttp<T = unknown>(
  url: Accessor<string> | string,
  options: UseHttpOptions<T> = {},
  client?: HttpClient,
): UseHttpReturn<T> {
  const [data, setData] = createSignal<T | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  /**
   * 执行 HTTP 请求
   */
  async function execute(config: RequestConfig = {}): Promise<void> {
    if (!client) {
      setError(new Error('HTTP client not provided'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const requestUrl = typeof url === 'function' ? url() : url
      const response = await client.request<T>({
        url: requestUrl,
        method: 'GET',
        ...options,
        ...config,
      })

      setData(() => response.data)
      options.onSuccess?.(response.data)
    }
    catch (e) {
      const err = e as Error
      setError(err)
      options.onError?.(err)
    }
    finally {
      setLoading(false)
    }
  }

  /**
   * 重置状态
   */
  function reset(): void {
    setData(null)
    setLoading(false)
    setError(null)
  }

  // 立即执行
  createEffect(() => {
    if (options.immediate !== false) {
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

