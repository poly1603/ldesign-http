/**
 * useHttp - Vue 3 HTTP 请求组合式函数
 */

import { ref, shallowRef, type Ref } from 'vue'
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
  data: Ref<T | null>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 执行请求 */
  execute: (config?: RequestConfig) => Promise<void>
  /** 重置状态 */
  reset: () => void
}

/**
 * HTTP 请求组合式函数
 * 
 * @param url - 请求 URL
 * @param options - 请求选项
 * @param client - HTTP 客户端实例
 * @returns HTTP 请求状态和方法
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useHttp } from '@ldesign/http-vue'
 * 
 * const { data, loading, error, execute } = useHttp('/api/users')
 * </script>
 * 
 * <template>
 *   <div v-if="loading">加载中...</div>
 *   <div v-else-if="error">{{ error.message }}</div>
 *   <div v-else>{{ data }}</div>
 * </template>
 * ```
 */
export function useHttp<T = unknown>(
  url: string | Ref<string>,
  options: UseHttpOptions<T> = {},
  client?: HttpClient,
): UseHttpReturn<T> {
  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * 执行 HTTP 请求
   */
  async function execute(config: RequestConfig = {}): Promise<void> {
    if (!client) {
      error.value = new Error('HTTP client not provided')
      return
    }

    loading.value = true
    error.value = null

    try {
      const requestUrl = typeof url === 'string' ? url : url.value
      const response = await client.request<T>({
        url: requestUrl,
        method: 'GET',
        ...options,
        ...config,
      })

      data.value = response.data
      options.onSuccess?.(response.data)
    }
    catch (e) {
      error.value = e as Error
      options.onError?.(e as Error)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 重置状态
   */
  function reset(): void {
    data.value = null
    loading.value = false
    error.value = null
  }

  // 立即执行
  if (options.immediate !== false) {
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

