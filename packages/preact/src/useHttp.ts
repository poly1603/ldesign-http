import type { HttpClient, RequestConfig, ResponseData } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'

export interface UseHttpOptions extends RequestConfig {
  /** 是否立即执行 */
  immediate?: boolean
}

export interface UseHttpReturn<T> {
  /** 响应数据 */
  data: T | null
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: Error | null
  /** 执行请求 */
  execute: (config?: RequestConfig) => Promise<ResponseData<T>>
  /** 重置状态 */
  reset: () => void
}

/**
 * Preact HTTP请求 hook
 */
export function useHttp<T = any>(
  url?: string,
  options: UseHttpOptions = {},
): UseHttpReturn<T> {
  const clientRef = useRef<HttpClient>(createHttpClient())

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { immediate = false, ...requestConfig } = options

  const execute = useCallback(
    async (config?: RequestConfig): Promise<ResponseData<T>> => {
      setLoading(true)
      setError(null)

      try {
        const mergedConfig: RequestConfig = {
          ...requestConfig,
          ...config,
          url: config?.url || url,
        }

        const response = await clientRef.current.request<T>(mergedConfig)
        setData(response.data)
        return response
      }
      catch (err: any) {
        setError(err)
        throw err
      }
      finally {
        setLoading(false)
      }
    },
    [url, requestConfig],
  )

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    if (immediate && url) {
      execute()
    }
  }, [immediate, url, execute])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}

export const useGet = <T = any>(url: string, options: UseHttpOptions = {}) =>
  useHttp<T>(url, { ...options, method: 'GET' })

export const usePost = <T = any>(url: string, options: UseHttpOptions = {}) =>
  useHttp<T>(url, { ...options, method: 'POST' })

export const usePut = <T = any>(url: string, options: UseHttpOptions = {}) =>
  useHttp<T>(url, { ...options, method: 'PUT' })

export const useDelete = <T = any>(url: string, options: UseHttpOptions = {}) =>
  useHttp<T>(url, { ...options, method: 'DELETE' })

export const usePatch = <T = any>(url: string, options: UseHttpOptions = {}) =>
  useHttp<T>(url, { ...options, method: 'PATCH' })
