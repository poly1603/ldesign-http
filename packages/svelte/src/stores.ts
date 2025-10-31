import type { RequestConfig, ResponseData } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { derived, writable, type Readable, type Writable } from 'svelte/store'

export interface HttpStoreOptions extends RequestConfig {
  /** 是否立即执行 */
  immediate?: boolean
  /** 初始数据 */
  initialData?: any
}

export interface HttpStore<T> {
  /** 响应数据 */
  data: Readable<T | null>
  /** 加载状态 */
  loading: Readable<boolean>
  /** 错误信息 */
  error: Readable<Error | null>
  /** 执行请求 */
  execute: (config?: RequestConfig) => Promise<ResponseData<T>>
  /** 重置状态 */
  reset: () => void
  /** 设置数据 */
  setData: (data: T | null) => void
}

/**
 * 创建HTTP store
 */
export function createHttpStore<T = any>(
  url?: string,
  options: HttpStoreOptions = {},
): HttpStore<T> {
  const { immediate = false, initialData = null, ...requestConfig } = options

  // 创建HTTP客户端
  const client = createHttpClient()

  // 创建可写stores
  const dataStore = writable<T | null>(initialData)
  const loadingStore = writable(false)
  const errorStore = writable<Error | null>(null)

  // 执行请求
  const execute = async (config?: RequestConfig): Promise<ResponseData<T>> => {
    loadingStore.set(true)
    errorStore.set(null)

    try {
      const mergedConfig: RequestConfig = {
        ...requestConfig,
        ...config,
        url: config?.url || url,
      }

      const response = await client.request<T>(mergedConfig)
      dataStore.set(response.data)
      return response
    }
    catch (err: any) {
      errorStore.set(err)
      throw err
    }
    finally {
      loadingStore.set(false)
    }
  }

  // 重置
  const reset = () => {
    dataStore.set(initialData)
    loadingStore.set(false)
    errorStore.set(null)
  }

  // 设置数据
  const setData = (data: T | null) => {
    dataStore.set(data)
  }

  // 立即执行
  if (immediate && url) {
    execute()
  }

  return {
    data: { subscribe: dataStore.subscribe },
    loading: { subscribe: loadingStore.subscribe },
    error: { subscribe: errorStore.subscribe },
    execute,
    reset,
    setData,
  }
}

/**
 * 创建GET请求store
 */
export function createGetStore<T = any>(
  url: string,
  options: HttpStoreOptions = {},
): HttpStore<T> {
  return createHttpStore<T>(url, { ...options, method: 'GET' })
}

/**
 * 创建POST请求store
 */
export function createPostStore<T = any>(
  url: string,
  options: HttpStoreOptions = {},
): HttpStore<T> {
  return createHttpStore<T>(url, { ...options, method: 'POST' })
}

/**
 * 创建PUT请求store
 */
export function createPutStore<T = any>(
  url: string,
  options: HttpStoreOptions = {},
): HttpStore<T> {
  return createHttpStore<T>(url, { ...options, method: 'PUT' })
}

/**
 * 创建DELETE请求store
 */
export function createDeleteStore<T = any>(
  url: string,
  options: HttpStoreOptions = {},
): HttpStore<T> {
  return createHttpStore<T>(url, { ...options, method: 'DELETE' })
}

/**
 * 创建PATCH请求store
 */
export function createPatchStore<T = any>(
  url: string,
  options: HttpStoreOptions = {},
): HttpStore<T> {
  return createHttpStore<T>(url, { ...options, method: 'PATCH' })
}

/**
 * 创建派生store用于组合多个请求
 */
export function combineHttpStores<T extends Record<string, HttpStore<any>>>(
  stores: T,
): Readable<{ [K in keyof T]: ReturnType<T[K]['data']['subscribe']> }> {
  const storeValues = Object.entries(stores).map(([key, store]) => ({
    key,
    store: store.data,
  }))

  return derived(
    storeValues.map(s => s.store),
    values =>
      Object.fromEntries(
        storeValues.map((s, i) => [s.key, values[i]]),
      ) as any,
  )
}
