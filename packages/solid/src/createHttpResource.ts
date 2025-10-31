import type { RequestConfig, ResponseData } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { createResource, createSignal, type Resource, type ResourceReturn } from 'solid-js'

export interface HttpResourceOptions extends RequestConfig {
  /** 是否立即执行 */
  immediate?: boolean
  /** 初始数据 */
  initialValue?: any
}

export interface HttpResource<T> {
  /** 资源数据 */
  data: Resource<T>
  /** 加载状态 */
  loading: () => boolean
  /** 错误信息 */
  error: () => Error | undefined
  /** 重新获取 */
  refetch: () => void
  /** 修改数据 */
  mutate: (value: T | ((prev: T | undefined) => T)) => void
}

/**
 * 创建HTTP Resource
 */
export function createHttpResource<T = any>(
  url?: string | (() => string | undefined),
  options: HttpResourceOptions = {},
): HttpResource<T> {
  const { immediate = true, initialValue, ...requestConfig } = options

  // 创建HTTP客户端
  const client = createHttpClient()

  // 创建fetcher函数
  const fetcher = async (source: string | undefined): Promise<T> => {
    if (!source) {
      throw new Error('URL is required')
    }

    const mergedConfig: RequestConfig = {
      ...requestConfig,
      url: source,
    }

    const response = await client.request<T>(mergedConfig)
    return response.data
  }

  // 创建resource
  const [resource, { refetch, mutate }] = createResource(
    typeof url === 'function' ? url : () => url,
    fetcher,
    {
      initialValue,
    },
  )

  return {
    data: resource,
    loading: () => resource.loading,
    error: () => resource.error,
    refetch,
    mutate,
  }
}

/**
 * 创建GET Resource
 */
export function createGetResource<T = any>(
  url: string | (() => string | undefined),
  options: HttpResourceOptions = {},
): HttpResource<T> {
  return createHttpResource<T>(url, { ...options, method: 'GET' })
}

/**
 * 创建可变的HTTP Signal
 */
export function createHttpSignal<T = any>(
  url?: string,
  options: HttpResourceOptions = {},
) {
  const { immediate = false, initialValue = null, ...requestConfig } = options

  const client = createHttpClient()

  const [data, setData] = createSignal<T | null>(initialValue)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  const execute = async (config?: RequestConfig): Promise<ResponseData<T>> => {
    setLoading(true)
    setError(null)

    try {
      const mergedConfig: RequestConfig = {
        ...requestConfig,
        ...config,
        url: config?.url || url,
      }

      const response = await client.request<T>(mergedConfig)
      setData(() => response.data)
      return response
    }
    catch (err: any) {
      setError(() => err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(() => initialValue)
    setLoading(false)
    setError(null)
  }

  // 立即执行
  if (immediate && url) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
  }
}

/**
 * 创建POST Signal
 */
export function createPostSignal<T = any>(
  url: string,
  options: HttpResourceOptions = {},
) {
  return createHttpSignal<T>(url, { ...options, method: 'POST' })
}

/**
 * 创建PUT Signal
 */
export function createPutSignal<T = any>(
  url: string,
  options: HttpResourceOptions = {},
) {
  return createHttpSignal<T>(url, { ...options, method: 'PUT' })
}

/**
 * 创建DELETE Signal
 */
export function createDeleteSignal<T = any>(
  url: string,
  options: HttpResourceOptions = {},
) {
  return createHttpSignal<T>(url, { ...options, method: 'DELETE' })
}

/**
 * 创建PATCH Signal
 */
export function createPatchSignal<T = any>(
  url: string,
  options: HttpResourceOptions = {},
) {
  return createHttpSignal<T>(url, { ...options, method: 'PATCH' })
}
