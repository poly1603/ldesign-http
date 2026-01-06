import type { HttpClient, RequestConfig, ResponseData } from '@ldesign/http-core'
import { createHttpClient, createHttpClientSync } from '@ldesign/http-core'
import { inject, provide, ref, type Ref, shallowRef } from 'vue'
import { HTTP_CLIENT_KEY, HTTP_CONFIG_KEY } from '../lib/symbols'

/**
 * useHttp 配置选项
 * @description 继承自 RequestConfig，添加 Vue 组合式函数特有的配置
 */
export interface UseHttpOptions extends RequestConfig {
  /**
   * 是否立即执行请求
   * @description 当设置为 true 且提供了 url 时，组件挂载后会立即发送请求
   * @default false
   */
  immediate?: boolean
}

/**
 * useHttp 返回值类型
 * @template T - 响应数据的类型
 */
export interface UseHttpReturn<T> {
  /**
   * 响应数据
   * @description 请求成功后的数据，使用 shallowRef 以避免深层响应式开销
   */
  data: Ref<T | null>

  /**
   * 加载状态
   * @description 请求进行中时为 true
   */
  loading: Ref<boolean>

  /**
   * 错误信息
   * @description 请求失败时的错误对象
   */
  error: Ref<Error | null>

  /**
   * 执行请求
   * @description 手动触发请求，可以传入配置覆盖默认值
   * @param config - 可选的请求配置，会与默认配置合并
   * @returns Promise<ResponseData<T>> - 响应数据
   * @throws 请求失败时抛出错误
   */
  execute: (config?: RequestConfig) => Promise<ResponseData<T>>

  /**
   * 重置状态
   * @description 将 data、loading、error 重置为初始值
   */
  reset: () => void
}

/**
 * Vue 3 HTTP 请求组合式函数
 *
 * 提供响应式的 HTTP 请求能力，自动管理加载状态和错误处理。
 *
 * @template T - 响应数据的类型
 * @param url - 请求 URL（可选，也可在 execute 时传入）
 * @param options - 请求配置选项
 * @returns UseHttpReturn<T> - 包含响应式状态和方法的对象
 *
 * @example 基础用法
 * ```vue
 * <script setup lang="ts">
 * import { useHttp } from '@ldesign/http-vue'
 *
 * interface User {
 *   id: number
 *   name: string
 * }
 *
 * const { data, loading, error, execute } = useHttp<User[]>('/api/users', {
 *   immediate: true
 * })
 * </script>
 *
 * <template>
 *   <div v-if="loading">加载中...</div>
 *   <div v-else-if="error">{{ error.message }}</div>
 *   <ul v-else>
 *     <li v-for="user in data" :key="user.id">{{ user.name }}</li>
 *   </ul>
 * </template>
 * ```
 *
 * @example 手动触发请求
 * ```vue
 * <script setup lang="ts">
 * const { data, execute } = useHttp<User>()
 *
 * const fetchUser = async (id: number) => {
 *   await execute({ url: `/api/users/${id}` })
 * }
 * </script>
 * ```
 *
 * @example POST 请求
 * ```vue
 * <script setup lang="ts">
 * const { execute, loading } = useHttp<User>('/api/users', {
 *   method: 'POST'
 * })
 *
 * const createUser = async (userData: Partial<User>) => {
 *   await execute({ data: userData })
 * }
 * </script>
 * ```
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
