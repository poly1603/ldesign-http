/**
 * Vue3集成
 * 提供Vue3的组合式函数和插件
 */

import {
  type App,
  type InjectionKey,
  type Ref,
  inject,
  onUnmounted,
  ref,
} from 'vue'
import { createHttpClient } from '../core/HttpClientImpl'
import type {
  CancelToken,
  ExtendedRequestConfig,
  HttpClientConfig,
  HttpClientInstance,
  HttpError,
  HttpResponse,
  RequestConfig,
} from '../types'

// 注入键
export const HTTP_CLIENT_KEY: InjectionKey<HttpClientInstance> = Symbol('httpClient')

/**
 * 请求状态接口
 */
export interface RequestState<T = any> {
  /** 响应数据 */
  data: Ref<T | null>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<HttpError | null>
  /** 是否已完成（成功或失败） */
  finished: Ref<boolean>
  /** 是否被取消 */
  cancelled: Ref<boolean>
}

/**
 * 请求选项
 */
export interface UseRequestOptions<T = any> extends ExtendedRequestConfig {
  /** 是否立即执行请求 */
  immediate?: boolean
  /** 初始数据 */
  initialData?: T
  /** 成功回调 */
  onSuccess?: (data: T, response: HttpResponse<T>) => void
  /** 错误回调 */
  onError?: (error: HttpError) => void
  /** 完成回调（无论成功或失败） */
  onFinally?: () => void
  /** 重置状态时是否保留数据 */
  resetOnExecute?: boolean
}

/**
 * 请求结果接口
 */
export interface UseRequestResult<T = any> extends RequestState<T> {
  /** 执行请求 */
  execute: (config?: Partial<ExtendedRequestConfig>) => Promise<HttpResponse<T>>
  /** 取消请求 */
  cancel: () => void
  /** 重置状态 */
  reset: () => void
  /** 刷新（重新执行上次请求） */
  refresh: () => Promise<HttpResponse<T>>
}

/**
 * Vue3 HTTP插件
 */
export interface HttpPlugin {
  install: (app: App, options?: HttpClientConfig) => void
}

/**
 * 创建HTTP插件
 */
export function createHttpPlugin(config: HttpClientConfig = {}): HttpPlugin {
  return {
    install(app: App, options: HttpClientConfig = {}) {
      const mergedConfig = { ...config, ...options }
      const httpClient = createHttpClient(mergedConfig)

      // 提供HTTP客户端实例
      app.provide(HTTP_CLIENT_KEY, httpClient)

      // 全局属性
      app.config.globalProperties.$http = httpClient
    },
  }
}

/**
 * 使用HTTP客户端
 */
export function useHttp(): HttpClientInstance {
  const httpClient = inject(HTTP_CLIENT_KEY)
  if (!httpClient) {
    throw new Error('HTTP client not found. Please install the HTTP plugin first.')
  }
  return httpClient
}

/**
 * 使用请求
 */
export function useRequest<T = any>(
  url: string | (() => string),
  options: UseRequestOptions<T> = {},
): UseRequestResult<T> {
  const httpClient = useHttp()

  const {
    immediate = true,
    initialData = null,
    onSuccess,
    onError,
    onFinally,
    resetOnExecute = true,
    ...requestConfig
  } = options

  // 状态
  const data = ref<T | null>(initialData)
  const loading = ref(false)
  const error = ref<HttpError | null>(null)
  const finished = ref(false)
  const cancelled = ref(false)

  // 取消令牌
  let cancelToken: CancelToken | null = null

  // 最后一次请求配置
  let lastConfig: ExtendedRequestConfig | null = null

  /**
   * 执行请求
   */
  const execute = async (config: Partial<ExtendedRequestConfig> = {}): Promise<HttpResponse<T>> => {
    const requestUrl = typeof url === 'function' ? url() : url

    // 重置状态
    if (resetOnExecute) {
      error.value = null
      cancelled.value = false
    }

    loading.value = true
    finished.value = false

    // 取消之前的请求
    if (cancelToken) {
      cancelToken.cancel('New request initiated')
    }

    // 创建新的取消令牌
    cancelToken = httpClient.createCancelToken()

    // 合并配置
    const mergedConfig: ExtendedRequestConfig = {
      ...requestConfig,
      ...config,
      url: requestUrl,
      cancelToken,
    }

    lastConfig = mergedConfig

    try {
      const response = await httpClient.request<T>(mergedConfig)

      if (!cancelled.value) {
        data.value = response.data
        error.value = null
        onSuccess?.(response.data, response)
      }

      return response
    }
 catch (err: any) {
      if (!cancelled.value) {
        const httpError = err as HttpError
        error.value = httpError

        if (httpError.isCancelError) {
          cancelled.value = true
        }
 else {
          onError?.(httpError)
        }
      }
      throw err
    }
 finally {
      if (!cancelled.value) {
        loading.value = false
        finished.value = true
        onFinally?.()
      }
    }
  }

  /**
   * 取消请求
   */
  const cancel = () => {
    if (cancelToken) {
      cancelToken.cancel('Request cancelled by user')
      cancelled.value = true
      loading.value = false
      finished.value = true
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    data.value = initialData
    loading.value = false
    error.value = null
    finished.value = false
    cancelled.value = false
    cancelToken = null
    lastConfig = null
  }

  /**
   * 刷新（重新执行上次请求）
   */
  const refresh = async (): Promise<HttpResponse<T>> => {
    if (!lastConfig) {
      throw new Error('No previous request to refresh')
    }
    return execute(lastConfig)
  }

  // 组件卸载时取消请求
  onUnmounted(() => {
    cancel()
  })

  // 立即执行
  if (immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    finished,
    cancelled,
    execute,
    cancel,
    reset,
    refresh,
  }
}

/**
 * 使用GET请求
 */
export function useGet<T = any>(
  url: string | (() => string),
  options: Omit<UseRequestOptions<T>, 'method'> = {},
): UseRequestResult<T> {
  return useRequest<T>(url, { ...options, method: 'GET' })
}

/**
 * 使用POST请求
 */
export function usePost<T = any>(
  url: string | (() => string),
  options: Omit<UseRequestOptions<T>, 'method'> = {},
): UseRequestResult<T> {
  return useRequest<T>(url, { ...options, method: 'POST', immediate: false })
}

/**
 * 使用PUT请求
 */
export function usePut<T = any>(
  url: string | (() => string),
  options: Omit<UseRequestOptions<T>, 'method'> = {},
): UseRequestResult<T> {
  return useRequest<T>(url, { ...options, method: 'PUT', immediate: false })
}

/**
 * 使用DELETE请求
 */
export function useDelete<T = any>(
  url: string | (() => string),
  options: Omit<UseRequestOptions<T>, 'method'> = {},
): UseRequestResult<T> {
  return useRequest<T>(url, { ...options, method: 'DELETE', immediate: false })
}

// 导出类型
export type {
  ExtendedRequestConfig,
HttpClientConfig,
  HttpClientInstance,
HttpError,
HttpResponse,
RequestConfig,
}
