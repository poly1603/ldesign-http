/**
 * useHttp - React HTTP 请求 Hook
 */

import { useState, useEffect, useCallback } from 'react'
import type { HttpClient, RequestConfig, ResponseData } from '@ldesign/http-core'

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
  data: T | null
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: Error | null
  /** 执行请求 */
  execute: (config?: RequestConfig) => Promise<void>
  /** 重置状态 */
  reset: () => void
}

/**
 * HTTP 请求 Hook
 * 
 * @param url - 请求 URL
 * @param options - 请求选项
 * @param client - HTTP 客户端实例
 * @returns HTTP 请求状态和方法
 * 
 * @example
 * ```tsx
 * import { useHttp } from '@ldesign/http-react'
 * 
 * function UserList() {
 *   const { data, loading, error, execute } = useHttp('/api/users')
 *   
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   
 *   return (
 *     <div>
 *       {data?.map(user => <div key={user.id}>{user.name}</div>)}
 *       <button onClick={() => execute()}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useHttp<T = unknown>(
  url: string,
  options: UseHttpOptions<T> = {},
  client?: HttpClient,
): UseHttpReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * 执行 HTTP 请求
   */
  const execute = useCallback(async (config: RequestConfig = {}) => {
    if (!client) {
      setError(new Error('HTTP client not provided'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await client.request<T>({
        url,
        method: 'GET',
        ...options,
        ...config,
      })

      setData(response.data)
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
  }, [url, client, options])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  // 立即执行
  useEffect(() => {
    if (options.immediate !== false) {
      execute()
    }
  }, [execute, options.immediate])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}

