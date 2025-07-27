/**
 * HTTP请求系统核心类型定义
 * 支持多种适配器：原生fetch、axios、alova
 */

// HTTP方法枚举
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

// 请求配置接口
export interface RequestConfig {
  /** 请求URL */
  url: string
  /** HTTP方法 */
  method?: HttpMethod
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求参数（GET请求的query参数） */
  params?: Record<string, any>
  /** 请求体数据 */
  data?: any
  /** 超时时间（毫秒） */
  timeout?: number
  /** 基础URL */
  baseURL?: string
  /** 响应类型 */
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
  /** 是否携带凭证 */
  withCredentials?: boolean
  /** 自定义配置 */
  [key: string]: any
}

// 响应接口
export interface HttpResponse<T = any> {
  /** 响应数据 */
  data: T
  /** 状态码 */
  status: number
  /** 状态文本 */
  statusText: string
  /** 响应头 */
  headers: Record<string, string>
  /** 原始请求配置 */
  config: RequestConfig
  /** 原始响应对象 */
  raw?: any
}

// 错误响应接口
export interface HttpError extends Error {
  /** 错误码 */
  code?: string
  /** 请求配置 */
  config?: RequestConfig
  /** 响应对象（如果有） */
  response?: HttpResponse
  /** 是否为网络错误 */
  isNetworkError?: boolean
  /** 是否为超时错误 */
  isTimeoutError?: boolean
  /** 是否为取消错误 */
  isCancelError?: boolean
}

// 拦截器接口
export interface RequestInterceptor {
  /** 请求拦截器 */
  onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  /** 请求错误拦截器 */
  onRejected?: (error: any) => any
}

export interface ResponseInterceptor {
  /** 响应拦截器 */
  onFulfilled?: <T = any>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>
  /** 响应错误拦截器 */
  onRejected?: (error: HttpError) => any
}

// 缓存配置接口
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled?: boolean
  /** 缓存时间（毫秒） */
  ttl?: number
  /** 缓存键生成函数 */
  keyGenerator?: (config: RequestConfig) => string
  /** 缓存存储适配器 */
  storage?: CacheStorage
}

// 缓存存储接口
export interface CacheStorage {
  get: (key: string) => Promise<any> | any
  set: (key: string, value: any, ttl?: number) => Promise<void> | void
  delete: (key: string) => Promise<void> | void
  clear: () => Promise<void> | void
}

// 重试配置接口
export interface RetryConfig {
  /** 重试次数 */
  retries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 重试条件判断函数 */
  retryCondition?: (error: HttpError) => boolean
  /** 重试延迟计算函数 */
  retryDelayCalculator?: (retryCount: number, error: HttpError) => number
}

// HTTP客户端配置接口
export interface HttpClientConfig extends RequestConfig {
  /** 拦截器配置 */
  interceptors?: {
    request?: RequestInterceptor[]
    response?: ResponseInterceptor[]
  }
  /** 缓存配置 */
  cache?: CacheConfig
  /** 重试配置 */
  retry?: RetryConfig
  /** 适配器类型 */
  adapter?: 'fetch' | 'axios' | 'alova'
  /** 自定义适配器 */
  customAdapter?: HttpAdapter
}

// HTTP适配器接口
export interface HttpAdapter {
  /** 发送请求 */
  request: <T = any>(config: RequestConfig) => Promise<HttpResponse<T>>
  /** 取消请求 */
  cancel?: (requestId?: string) => void
  /** 获取适配器名称 */
  getName: () => string
}

// 请求取消接口
export interface CancelToken {
  /** 取消原因 */
  reason?: string
  /** 是否已取消 */
  isCancelled: boolean
  /** 取消方法 */
  cancel: (reason?: string) => void
  /** 取消Promise */
  promise: Promise<string>
}

// 上传进度接口
export interface UploadProgress {
  /** 已上传字节数 */
  loaded: number
  /** 总字节数 */
  total: number
  /** 上传进度百分比 */
  percentage: number
}

// 下载进度接口
export interface DownloadProgress {
  /** 已下载字节数 */
  loaded: number
  /** 总字节数 */
  total: number
  /** 下载进度百分比 */
  percentage: number
}

// 进度回调函数类型
export type ProgressCallback = (progress: UploadProgress | DownloadProgress) => void

// 扩展的请求配置（包含进度回调）
export interface ExtendedRequestConfig extends RequestConfig {
  /** 上传进度回调 */
  onUploadProgress?: ProgressCallback
  /** 下载进度回调 */
  onDownloadProgress?: ProgressCallback
  /** 取消令牌 */
  cancelToken?: CancelToken
}

// HTTP客户端实例接口
export interface HttpClientInstance {
  /** 发送GET请求 */
  get: <T = any>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>
  /** 发送POST请求 */
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<HttpResponse<T>>
  /** 发送PUT请求 */
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<HttpResponse<T>>
  /** 发送DELETE请求 */
  delete: <T = any>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>
  /** 发送PATCH请求 */
  patch: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<HttpResponse<T>>
  /** 发送HEAD请求 */
  head: <T = any>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>
  /** 发送OPTIONS请求 */
  options: <T = any>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>
  /** 通用请求方法 */
  request: <T = any>(config: ExtendedRequestConfig) => Promise<HttpResponse<T>>
  /** 添加请求拦截器 */
  addRequestInterceptor: (interceptor: RequestInterceptor) => number
  /** 添加响应拦截器 */
  addResponseInterceptor: (interceptor: ResponseInterceptor) => number
  /** 移除拦截器 */
  removeInterceptor: (type: 'request' | 'response', id: number) => void
  /** 创建取消令牌 */
  createCancelToken: () => CancelToken
  /** 获取默认配置 */
  getDefaults: () => HttpClientConfig
  /** 设置默认配置 */
  setDefaults: (config: Partial<HttpClientConfig>) => void
}

// 适配器工厂接口
export interface AdapterFactory {
  /** 创建适配器实例 */
  create: (config: HttpClientConfig) => HttpAdapter
  /** 获取适配器名称 */
  getName: () => string
  /** 检查是否支持当前环境 */
  isSupported: () => boolean
}

// 插件接口
export interface HttpPlugin {
  /** 插件名称 */
  name: string
  /** 插件安装方法 */
  install: (client: HttpClientInstance, options?: any) => void
  /** 插件卸载方法 */
  uninstall?: (client: HttpClientInstance) => void
}

// 中间件接口
export interface Middleware {
  /** 中间件名称 */
  name: string
  /** 请求处理 */
  request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  /** 响应处理 */
  response?: <T = any>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>
  /** 错误处理 */
  error?: (error: HttpError) => HttpError | Promise<HttpError>
}

// 事件类型
export type EventType = 'request' | 'response' | 'error' | 'retry' | 'cache-hit' | 'cache-miss'

// 事件监听器接口
export interface EventListener {
  (event: any): void
}

// 事件发射器接口
export interface EventEmitter {
  /** 添加事件监听器 */
  on: (event: EventType, listener: EventListener) => void
  /** 移除事件监听器 */
  off: (event: EventType, listener: EventListener) => void
  /** 触发事件 */
  emit: (event: EventType, data: any) => void
  /** 添加一次性事件监听器 */
  once: (event: EventType, listener: EventListener) => void
}
