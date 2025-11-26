/**
 * 本地HTTP类型定义
 * 
 * 用于避免从@ldesign/http-core导入类型时的问题
 */

/**
 * HTTP错误接口
 */
export interface HttpError extends Error {
  name: 'HttpError'
  code?: string | number
  status?: number
  statusText?: string
  config?: any
  request?: any
  response?: any
  isNetworkError?: boolean
  isTimeoutError?: boolean
  isCancelError?: boolean
  isClientError?: boolean
  isServerError?: boolean
  cause?: Error | any
  context?: Record<string, any>
  retryInfo?: {
    attempt: number
    maxAttempts: number
    delay: number
  }
}

/**
 * 请求配置接口
 */
export interface RequestConfig {
  url?: string
  method?: string
  headers?: Record<string, string | string[]>
  params?: Record<string, unknown>
  data?: unknown
  timeout?: number
  baseURL?: string
  responseType?: string
  withCredentials?: boolean
  signal?: AbortSignal
  [key: string]: unknown
}

/**
 * HTTP客户端接口
 */
export interface HttpClient {
  request: <T = any>(config: RequestConfig) => Promise<any>
  get: <T = any>(url: string, config?: RequestConfig) => Promise<any>
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<any>
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<any>
  delete: <T = any>(url: string, config?: RequestConfig) => Promise<any>
  patch: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<any>
}