/**
 * HTTP请求方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/**
 * 请求配置
 */
export interface RequestConfig<D = any> {
  /** 请求URL */
  url?: string
  /** 请求方法 */
  method?: HttpMethod
  /** 基础URL */
  baseURL?: string
  /** 请求头 */
  headers?: Record<string, string>
  /** URL参数 */
  params?: Record<string, any>
  /** 请求体数据 */
  data?: D
  /** 超时时间(ms) */
  timeout?: number
  /** 响应类型 */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document' | 'stream'
  /** 是否携带凭证 */
  withCredentials?: boolean
  /** 请求适配器 */
  adapter?: RequestAdapter
  /** 取消令牌 */
  cancelToken?: CancelToken
  /** 重试配置 */
  retry?: RetryConfig
  /** 缓存配置 */
  cache?: CacheConfig
  /** 自定义元数据 */
  meta?: Record<string, any>
}

/**
 * 响应数据
 */
export interface ResponseData<T = any> {
  /** 响应数据 */
  data: T
  /** HTTP状态码 */
  status: number
  /** 状态文本 */
  statusText: string
  /** 响应头 */
  headers: Record<string, string>
  /** 请求配置 */
  config: RequestConfig
  /** 原始请求对象 */
  request?: any
}

/**
 * 请求拦截器
 */
export interface RequestInterceptor {
  /** 成功拦截 */
  onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  /** 失败拦截 */
  onRejected?: (error: any) => any
}

/**
 * 响应拦截器
 */
export interface ResponseInterceptor {
  /** 成功拦截 */
  onFulfilled?: <T = any>(response: ResponseData<T>) => ResponseData<T> | Promise<ResponseData<T>>
  /** 失败拦截 */
  onRejected?: (error: any) => any
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 重试次数 */
  retries?: number
  /** 重试延迟(ms) */
  retryDelay?: number
  /** 是否应该重试的条件函数 */
  shouldRetry?: (error: any) => boolean
  /** 重试延迟策略: 'fixed' | 'exponential' */
  retryDelayStrategy?: 'fixed' | 'exponential'
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled?: boolean
  /** 缓存时间(ms) */
  ttl?: number
  /** 缓存键生成函数 */
  keyGenerator?: (config: RequestConfig) => string
  /** 缓存存储 */
  storage?: CacheStorage
}

/**
 * 缓存存储接口
 */
export interface CacheStorage {
  get<T = any>(key: string): Promise<T | null> | T | null
  set<T = any>(key: string, value: T, ttl?: number): Promise<void> | void
  delete(key: string): Promise<void> | void
  clear(): Promise<void> | void
}

/**
 * 请求适配器
 */
export interface RequestAdapter {
  (config: RequestConfig): Promise<ResponseData>
}

/**
 * 取消令牌
 */
export interface CancelToken {
  promise: Promise<Cancel>
  reason?: Cancel
  throwIfRequested(): void
}

/**
 * 取消对象
 */
export interface Cancel {
  message: string
}

/**
 * 取消令牌源
 */
export interface CancelTokenSource {
  token: CancelToken
  cancel(message?: string): void
}

/**
 * HTTP客户端配置
 */
export interface HttpClientConfig extends RequestConfig {
  /** 请求拦截器 */
  requestInterceptors?: RequestInterceptor[]
  /** 响应拦截器 */
  responseInterceptors?: ResponseInterceptor[]
}

/**
 * HTTP错误
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public code?: string,
    public config?: RequestConfig,
    public request?: any,
    public response?: ResponseData,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}
