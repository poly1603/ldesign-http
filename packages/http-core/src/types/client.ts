/**
 * 客户端类型定义
 */

import type { HttpError, RequestConfig, ResponseData } from './base'

/**
 * HTTP 客户端配置接口
 */
export interface HttpClientConfig extends RequestConfig {
  /** 适配器实例 */
  adapter?: unknown
  /** 重试配置 */
  retry?: RetryConfig
  /** 缓存配置 */
  cache?: CacheConfig
}

/**
 * 重试配置接口
 */
export interface RetryConfig {
  /** 重试次数 */
  retries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 重试条件函数 */
  retryCondition?: (error: HttpError) => boolean
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled?: boolean
  /** 缓存时间（毫秒） */
  ttl?: number
  /** 缓存键生成函数 */
  keyGenerator?: (config: RequestConfig) => string
}

/**
 * HTTP 客户端接口
 */
export interface HttpClient {
  /** 发送请求 */
  request: <T = unknown>(config: RequestConfig) => Promise<ResponseData<T>>

  /** GET 请求 */
  get: <T = unknown>(url: string, config?: RequestConfig) => Promise<ResponseData<T>>

  /** POST 请求 */
  post: <T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig
  ) => Promise<ResponseData<T>>

  /** PUT 请求 */
  put: <T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig
  ) => Promise<ResponseData<T>>

  /** DELETE 请求 */
  delete: <T = unknown>(url: string, config?: RequestConfig) => Promise<ResponseData<T>>

  /** PATCH 请求 */
  patch: <T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig
  ) => Promise<ResponseData<T>>

  /** HEAD 请求 */
  head: <T = unknown>(url: string, config?: RequestConfig) => Promise<ResponseData<T>>

  /** OPTIONS 请求 */
  options: <T = unknown>(url: string, config?: RequestConfig) => Promise<ResponseData<T>>

  /** 获取当前配置 */
  getConfig: () => HttpClientConfig

  /** 销毁客户端 */
  destroy: () => void
}


