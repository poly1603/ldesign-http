/**
 * 基础类型定义
 */

/**
 * HTTP 请求方法
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'

/**
 * 响应类型
 */
export type ResponseType =
  | 'json'
  | 'text'
  | 'blob'
  | 'arrayBuffer'
  | 'formData'
  | 'stream'

/**
 * 请求配置接口
 */
export interface RequestConfig {
  /** 请求 URL */
  url?: string
  /** HTTP 方法 */
  method?: HttpMethod
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求参数（GET 请求的查询参数） */
  params?: Record<string, unknown>
  /** 请求体数据 */
  data?: unknown
  /** 超时时间（毫秒） */
  timeout?: number
  /** 基础 URL */
  baseURL?: string
  /** 响应类型 */
  responseType?: ResponseType
  /** 是否携带凭证 */
  withCredentials?: boolean
  /** 取消信号 */
  signal?: AbortSignal
  /** 自定义配置 */
  [key: string]: unknown
}

/**
 * 响应数据接口
 */
export interface ResponseData<T = unknown> {
  /** 响应数据 */
  data: T
  /** 状态码 */
  status: number
  /** 状态文本 */
  statusText: string
  /** 响应头 */
  headers: Record<string, string>
  /** 请求配置 */
  config: RequestConfig
  /** 原始响应对象 */
  raw?: unknown
}

/**
 * HTTP 错误接口
 */
export interface HttpError extends Error {
  /** 错误代码 */
  code?: string
  /** HTTP状态码 */
  status?: number
  /** 请求配置 */
  config?: RequestConfig
  /** 响应数据 */
  response?: ResponseData
  /** 是否为网络错误 */
  isNetworkError?: boolean
  /** 是否为超时错误 */
  isTimeoutError?: boolean
  /** 是否为取消错误 */
  isCancelError?: boolean
  /** 原始错误 */
  cause?: Error
}

/**
 * HTTP 状态码枚举
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * 内容类型枚举
 */
export enum ContentType {
  JSON = 'application/json',
  FORM = 'application/x-www-form-urlencoded',
  MULTIPART = 'multipart/form-data',
  TEXT = 'text/plain',
  HTML = 'text/html',
  XML = 'application/xml',
}


