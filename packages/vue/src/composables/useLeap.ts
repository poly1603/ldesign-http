/**
 * LEAP RPC Vue 组合式 API
 *
 * 提供在 Vue 组件中使用 LEAP 请求的响应式 API
 *
 * @module @ldesign/http-vue/useLeap
 */

import { ref, shallowRef, computed, onUnmounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type {
  LeapClient,
  LeapClientConfig,
  LeapRequestConfig,
  LeapError,
} from '@ldesign/http-core'
import {
  createLeapClient,
  createLeap,
  isLeapError,
} from '@ldesign/http-core'

/**
 * useLeap 选项
 */
export interface UseLeapOptions {
  /**
   * 是否立即执行
   * @default false
   */
  immediate?: boolean

  /**
   * 默认请求配置
   */
  defaultConfig?: Partial<LeapRequestConfig>

  /**
   * 成功回调
   */
  onSuccess?: <T>(data: T) => void

  /**
   * 错误回调
   */
  onError?: (error: LeapError) => void

  /**
   * 完成回调
   */
  onFinally?: () => void

  /**
   * 初始数据
   */
  initialData?: unknown
}

/**
 * useLeap 返回值
 */
export interface UseLeapReturn<T = unknown> {
  /** 响应数据 */
  data: Ref<T | null>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<LeapError | null>
  /** 是否已执行 */
  executed: Ref<boolean>
  /** 是否成功 */
  isSuccess: ComputedRef<boolean>
  /** 是否失败 */
  isError: ComputedRef<boolean>

  /**
   * 执行请求
   */
  execute: (
    name: string,
    par?: Record<string, unknown>,
    config?: Partial<LeapRequestConfig>
  ) => Promise<T>

  /**
   * 使用配置对象执行请求
   */
  execute2: (config: LeapRequestConfig) => Promise<T>

  /**
   * 重置状态
   */
  reset: () => void

  /**
   * 刷新（重新执行上次请求）
   */
  refresh: () => Promise<T | undefined>
}

/**
 * LEAP RPC 组合式 API
 *
 * @param client - LEAP 客户端实例
 * @param options - 选项配置
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useLeap } from '@ldesign/http-vue'
 * import { inject } from 'vue'
 *
 * const leapClient = inject('leapClient')!
 * const { data, loading, error, execute } = useLeap(leapClient)
 *
 * const fetchUser = async (userId: string) => {
 *   await execute('app_getUserInfo', { userId })
 * }
 * </script>
 *
 * <template>
 *   <div>
 *     <button @click="fetchUser('123')" :disabled="loading">
 *       {{ loading ? '加载中...' : '获取用户' }}
 *     </button>
 *     <div v-if="error">错误: {{ error.message }}</div>
 *     <div v-if="data">用户: {{ data.name }}</div>
 *   </div>
 * </template>
 * ```
 */
export function useLeap<T = unknown>(
  client: LeapClient,
  options: UseLeapOptions = {}
): UseLeapReturn<T> {
  const data = shallowRef<T | null>(options.initialData as T | null)
  const loading = ref(false)
  const error = shallowRef<LeapError | null>(null)
  const executed = ref(false)

  // 记录上次请求参数，用于刷新
  let lastRequest: { name: string; par?: Record<string, unknown>; config?: Partial<LeapRequestConfig> } | null = null

  const isSuccess = computed(() => executed.value && !error.value)
  const isError = computed(() => executed.value && !!error.value)

  /**
   * 执行请求
   */
  const execute = async (
    name: string,
    par?: Record<string, unknown>,
    config?: Partial<LeapRequestConfig>
  ): Promise<T> => {
    loading.value = true
    error.value = null
    lastRequest = { name, par, config }

    try {
      const result = await client.request<T>(name, par, {
        ...options.defaultConfig,
        ...config,
      })

      data.value = result
      executed.value = true
      options.onSuccess?.(result)

      return result
    } catch (err) {
      const leapError = isLeapError(err)
        ? err
        : { name: 'LeapError', message: String(err) } as LeapError

      error.value = leapError
      executed.value = true
      options.onError?.(leapError)

      throw leapError
    } finally {
      loading.value = false
      options.onFinally?.()
    }
  }

  /**
   * 使用配置对象执行请求
   */
  const execute2 = async (config: LeapRequestConfig): Promise<T> => {
    return execute(config.name, config.par, config)
  }

  /**
   * 重置状态
   */
  const reset = (): void => {
    data.value = options.initialData as T | null
    loading.value = false
    error.value = null
    executed.value = false
    lastRequest = null
  }

  /**
   * 刷新（重新执行上次请求）
   */
  const refresh = async (): Promise<T | undefined> => {
    if (lastRequest) {
      return execute(lastRequest.name, lastRequest.par, lastRequest.config)
    }
    return undefined
  }

  return {
    data,
    loading,
    error,
    executed,
    isSuccess,
    isError,
    execute,
    execute2,
    reset,
    refresh,
  }
}

/**
 * 创建 LEAP 提供者
 *
 * 用于在 Vue 应用中提供全局的 LEAP 客户端
 *
 * @example
 * ```typescript
 * // main.ts
 * import { createApp } from 'vue'
 * import { createLeapProvider } from '@ldesign/http-vue'
 *
 * const app = createApp(App)
 *
 * // 创建并注入 LEAP 客户端
 * await createLeapProvider(app, {
 *   serverUrl: 'https://api.example.com',
 *   getSid: () => sessionStorage.getItem('sid') || ''
 * })
 *
 * app.mount('#app')
 * ```
 */
export async function createLeapProvider(
  app: { provide: (key: symbol | string, value: unknown) => void },
  config: LeapClientConfig
): Promise<LeapClient> {
  const client = await createLeapClient(config)

  // 注入客户端
  app.provide(LEAP_CLIENT_KEY, client)

  // 注入 LEAP 兼容对象
  const leap = createLeap(client)
  app.provide(LEAP_KEY, leap)

  return client
}

/**
 * LEAP 客户端注入键
 */
export const LEAP_CLIENT_KEY = Symbol('leapClient')

/**
 * LEAP 兼容对象注入键
 */
export const LEAP_KEY = Symbol('leap')

/**
 * 注入 LEAP 客户端
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { injectLeapClient } from '@ldesign/http-vue'
 *
 * const leapClient = injectLeapClient()
 * </script>
 * ```
 */
export function injectLeapClient(): LeapClient | undefined {
  // 在实际使用中需要从 vue 导入 inject
  // 这里返回 undefined 作为类型占位
  return undefined
}

/**
 * 注入 LEAP 兼容对象
 */
export function injectLeap(): ReturnType<typeof createLeap> | undefined {
  return undefined
}

/**
 * useLeapQuery - 用于查询操作的组合式 API
 *
 * 自动在组件挂载时执行请求，支持响应式参数
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useLeapQuery } from '@ldesign/http-vue'
 *
 * const { data, loading, error, refresh } = useLeapQuery(
 *   leapClient,
 *   'app_getUserInfo',
 *   () => ({ userId: props.userId }),
 *   { immediate: true }
 * )
 * </script>
 * ```
 */
export function useLeapQuery<T = unknown>(
  client: LeapClient,
  name: string,
  parGetter: () => Record<string, unknown>,
  options: UseLeapOptions & { immediate?: boolean } = {}
): UseLeapReturn<T> {
  const leapReturn = useLeap<T>(client, options)

  // 如果设置了 immediate，在组件挂载时执行
  if (options.immediate !== false) {
    leapReturn.execute(name, parGetter())
  }

  return leapReturn
}

/**
 * useLeapMutation - 用于变更操作的组合式 API
 *
 * 不自动执行，需要手动调用 mutate
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useLeapMutation } from '@ldesign/http-vue'
 *
 * const { mutate, loading, error } = useLeapMutation<User>(
 *   leapClient,
 *   'app_updateUser'
 * )
 *
 * const updateUser = async (userData: UserData) => {
 *   await mutate(userData)
 * }
 * </script>
 * ```
 */
export function useLeapMutation<T = unknown, P extends Record<string, unknown> = Record<string, unknown>>(
  client: LeapClient,
  name: string,
  options: UseLeapOptions = {}
): UseLeapReturn<T> & {
  mutate: (par: P) => Promise<T>
} {
  const leapReturn = useLeap<T>(client, options)

  const mutate = async (par: P): Promise<T> => {
    return leapReturn.execute(name, par)
  }

  return {
    ...leapReturn,
    mutate,
  }
}

/**
 * useLeapPagination - 用于分页查询的组合式 API
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useLeapPagination } from '@ldesign/http-vue'
 *
 * const {
 *   data,
 *   loading,
 *   page,
 *   pageSize,
 *   total,
 *   nextPage,
 *   prevPage,
 *   goToPage,
 * } = useLeapPagination(leapClient, 'app_getList', {
 *   pageSize: 20
 * })
 * </script>
 * ```
 */
export function useLeapPagination<T = unknown>(
  client: LeapClient,
  name: string,
  options: UseLeapOptions & {
    pageSize?: number
    pageField?: string
    pageSizeField?: string
    totalField?: string
    dataField?: string
  } = {}
) {
  const {
    pageSize: defaultPageSize = 20,
    pageField = 'page',
    pageSizeField = 'pageSize',
    totalField = 'total',
    dataField = 'list',
  } = options

  const page = ref(1)
  const pageSize = ref(defaultPageSize)
  const total = ref(0)
  const data = shallowRef<T[]>([])
  const loading = ref(false)
  const error = shallowRef<LeapError | null>(null)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPrevPage = computed(() => page.value > 1)

  const fetchPage = async (pageNum: number) => {
    loading.value = true
    error.value = null

    try {
      const result = await client.request<Record<string, unknown>>(name, {
        [pageField]: pageNum,
        [pageSizeField]: pageSize.value,
        ...options.defaultConfig?.par,
      })

      page.value = pageNum
      total.value = (result[totalField] as number) || 0
      data.value = (result[dataField] as T[]) || []

      return result
    } catch (err) {
      error.value = isLeapError(err)
        ? err
        : { name: 'LeapError', message: String(err) } as LeapError
      throw err
    } finally {
      loading.value = false
    }
  }

  const nextPage = async () => {
    if (hasNextPage.value) {
      await fetchPage(page.value + 1)
    }
  }

  const prevPage = async () => {
    if (hasPrevPage.value) {
      await fetchPage(page.value - 1)
    }
  }

  const goToPage = async (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages.value) {
      await fetchPage(pageNum)
    }
  }

  const refresh = async () => {
    await fetchPage(page.value)
  }

  // 初始加载
  if (options.immediate !== false) {
    fetchPage(1)
  }

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    refresh,
  }
}
