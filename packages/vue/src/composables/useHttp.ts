import type { HttpClient, RequestConfig, ResponseData } from '@ldesign/http-core'
import { createHttpClient, createHttpClientSync } from '@ldesign/http-core'
import { inject, provide, ref, type Ref, shallowRef } from 'vue'
import { HTTP_CLIENT_KEY, HTTP_CONFIG_KEY } from '../lib/symbols'

export interface UseHttpOptions extends RequestConfig {
  /** 是否立即执行 */
  immediate?: boolean
}

export interface UseHttpReturn<T> {
  /** 响应数据 */
  data: Ref<T | null>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 执行请求 */
  execute: (config?: RequestConfig) => Promise<ResponseData<T>>
  /** 重置状态 */
  reset: () => void
}

/**
 * Vue HTTP请求 composable
 */
export function useHttp<T = any>(
  url?: string,
  options: UseHttpOptions = {},
): UseHttpReturn<T> {
  // 尝试注入全局客户端，否则创建新实例
  const client = inject<HttpClient>(HTTP_CLIENT_KEY) || createHttpClientSync({})

  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const { immediate = false, ...requestConfig } = options

  const execute = async (config?: RequestConfig): Promise<ResponseData<T>> => {
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
      return response
    }
    catch (err: any) {
      error.value = err
      throw err
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
  if (immediate && url) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}

/**
 * GET请求
 */
export function useGet<T = any>(
  url: string,
  options: UseHttpOptions = {},
): UseHttpReturn<T> {
  return useHttp<T>(url, { ...options, method: 'GET' })
}

/**
 * POST请求
 */
export function usePost<T = any>(
  url: string,
  options: UseHttpOptions = {},
): UseHttpReturn<T> {
  return useHttp<T>(url, { ...options, method: 'POST' })
}

/**
 * PUT请求
 */
export function usePut<T = any>(
  url: string,
  options: UseHttpOptions = {},
): UseHttpReturn<T> {
  return useHttp<T>(url, { ...options, method: 'PUT' })
}

/**
 * DELETE请求
 */
export function useDelete<T = any>(
  url: string,
  options: UseHttpOptions = {},
): UseHttpReturn<T> {
  return useHttp<T>(url, { ...options, method: 'DELETE' })
}

/**
 * PATCH请求
 */
export function usePatch<T = any>(
  url: string,
  options: UseHttpOptions = {},
): UseHttpReturn<T> {
  return useHttp<T>(url, { ...options, method: 'PATCH' })
}

/**
 * 提供 HTTP 客户端到子组件
 */
export function provideHttpClient(client: HttpClient): void {
  provide(HTTP_CLIENT_KEY, client)
}

/**
 * 注入 HTTP 客户端
 */
export function injectHttpClient(): HttpClient | undefined {
  return inject<HttpClient>(HTTP_CLIENT_KEY, undefined)
}

/**
 * 注入 HTTP 配置
 */
export function injectHttpConfig(): Ref<RequestConfig> | undefined {
  return inject<Ref<RequestConfig>>(HTTP_CONFIG_KEY, undefined)
}
