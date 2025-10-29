/**
 * Svelte HTTP Stores
 */

import { writable, derived, type Readable } from 'svelte/store'
import type { HttpClient, RequestConfig } from '@ldesign/http-core'

/**
 * HTTP Store 选项
 */
export interface HttpStoreOptions<T = unknown> extends RequestConfig {
  /** 是否立即执行 */
  immediate?: boolean
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 成功回调 */
  onSuccess?: (data: T) => void
}

/**
 * HTTP Store 值
 */
export interface HttpStoreValue<T = unknown> {
  /** 响应数据 */
  data: T | null
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: Error | null
}

/**
 * 创建 HTTP Store
 * 
 * @param url - 请求 URL
 * @param options - 请求选项
 * @param client - HTTP 客户端实例
 * @returns Svelte Store
 * 
 * @example
 * ```svelte
 * <script>
 * import { createHttpStore } from '@ldesign/http-svelte'
 * 
 * const users = createHttpStore('/api/users')
 * </script>
 * 
 * {#if $users.loading}
 *   <div>Loading...</div>
 * {:else if $users.error}
 *   <div>Error: {$users.error.message}</div>
 * {:else}
 *   <div>{JSON.stringify($users.data)}</div>
 * {/if}
 * ```
 */
export function createHttpStore<T = unknown>(
  url: string,
  options: HttpStoreOptions<T> = {},
  client?: HttpClient,
) {
  const store = writable<HttpStoreValue<T>>({
    data: null,
    loading: false,
    error: null,
  })

  /**
   * 执行请求
   */
  async function execute(config: RequestConfig = {}): Promise<void> {
    if (!client) {
      store.update(s => ({
        ...s,
        error: new Error('HTTP client not provided'),
      }))
      return
    }

    store.update(s => ({
      ...s,
      loading: true,
      error: null,
    }))

    try {
      const response = await client.request<T>({
        url,
        method: 'GET',
        ...options,
        ...config,
      })

      store.update(s => ({
        ...s,
        data: response.data,
        loading: false,
      }))

      options.onSuccess?.(response.data)
    }
    catch (e) {
      const err = e as Error
      store.update(s => ({
        ...s,
        error: err,
        loading: false,
      }))

      options.onError?.(err)
    }
  }

  /**
   * 重置状态
   */
  function reset(): void {
    store.set({
      data: null,
      loading: false,
      error: null,
    })
  }

  // 立即执行
  if (options.immediate !== false) {
    execute()
  }

  return {
    subscribe: store.subscribe,
    execute,
    reset,
  }
}
