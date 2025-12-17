/**
 * LEAP RPC 类型定义
 *
 * 兼容老系统 LEAP.request / leapclient.request 的请求方式
 * 支持 Java 后端的 RPC 风格接口调用
 *
 * @module @ldesign/http/leap
 */

/**
 * LEAP 请求配置
 */
export interface LeapRequestConfig {
  /**
   * 方法名称（对应 method 参数）
   * @example 'app_getLogicModuleOperations'
   */
  name: string

  /**
   * 请求参数对象
   * @example { n: 'moduleName', g: true, r: false }
   */
  par?: Record<string, unknown>

  /**
   * 扩展参数（对应 extend 参数）
   */
  extend?: string

  /**
   * 回调函数（异步请求时使用）
   */
  callback?: LeapCallback

  /**
   * 回调函数的执行域
   */
  domain?: unknown

  /**
   * 回调函数的附加参数
   */
  arg?: unknown

  /**
   * 服务名称
   * @default 'leap'
   */
  service?: string

  /**
   * 调用服务名称
   * @default 'leap'
   */
  callService?: string

  /**
   * 请求类型
   * - 1: 普通请求
   * - 2: 资源请求
   */
  requestType?: number

  /**
   * 是否返回 JSON
   * @default true
   */
  isreturnjson?: boolean

  /**
   * 是否使用 GET 方法
   * @default false
   */
  useGet?: boolean

  /**
   * 是否使用 Web Worker
   * @default false
   */
  isworker?: boolean

  /**
   * 路由标识
   * @example 'leap'
   */
  router?: string

  /**
   * URL 附加参数
   */
  urlpar?: Record<string, string>

  /**
   * 响应类型
   * - 1: 文本
   * - 2: JSON
   */
  restype?: number

  /**
   * 请求分组（用于批量请求）
   */
  requestGroup?: LeapRequestGroup
}

/**
 * LEAP 回调函数类型
 */
export type LeapCallback<T = unknown> = (result: T, arg?: unknown) => void

/**
 * LEAP 请求分组
 */
export interface LeapRequestGroup {
  add: (request: LeapRequestConfig) => void
  execute: () => Promise<unknown[]>
}

/**
 * LEAP 客户端配置
 */
export interface LeapClientConfig {
  /**
   * 服务器地址
   * @example 'https://api.example.com'
   */
  serverUrl: string

  /**
   * RPC 端点路径
   * @default '/LEAP/Service/RPC/RPC.DO'
   */
  rpcPath?: string

  /**
   * 默认服务名称
   * @default 'leap'
   */
  defaultService?: string

  /**
   * 默认调用服务名称
   * @default 'leap'
   */
  defaultCallService?: string

  /**
   * 会话 ID 获取函数
   */
  getSid?: () => string | Promise<string>

  /**
   * 默认超时时间（毫秒）
   * @default 30000
   */
  timeout?: number

  /**
   * 默认请求头
   */
  headers?: Record<string, string>

  /**
   * 是否携带凭证
   * @default true
   */
  withCredentials?: boolean

  /**
   * 请求拦截器
   */
  onRequest?: (config: LeapRequestConfig) => LeapRequestConfig | Promise<LeapRequestConfig>

  /**
   * 响应拦截器
   */
  onResponse?: <T>(response: LeapResponse<T>) => T | Promise<T>

  /**
   * 错误拦截器
   */
  onError?: (error: LeapError) => void | Promise<void>
}

/**
 * LEAP 响应数据
 */
export interface LeapResponse<T = unknown> {
  /** 响应数据 */
  data: T
  /** HTTP 状态码 */
  status: number
  /** 响应头 */
  headers: Record<string, string>
  /** 原始响应文本 */
  rawText?: string
}

/**
 * LEAP 错误
 */
export interface LeapError extends Error {
  /** 错误代码 */
  code?: string
  /** HTTP 状态码 */
  status?: number
  /** 请求配置 */
  config?: LeapRequestConfig
  /** 响应数据 */
  response?: LeapResponse
  /** 是否为网络错误 */
  isNetworkError?: boolean
  /** 是否为超时错误 */
  isTimeoutError?: boolean
}

/**
 * LEAP 客户端接口
 */
export interface LeapClient {
  /**
   * 发送请求（Promise 风格）
   *
   * @example
   * ```typescript
   * const result = await client.request('app_getUserInfo', { userId: '123' })
   * ```
   */
  request<T = unknown>(
    name: string,
    par?: Record<string, unknown>,
    options?: Partial<LeapRequestConfig>
  ): Promise<T>

  /**
   * 发送请求（配置对象风格）
   *
   * @example
   * ```typescript
   * const result = await client.request2({
   *   name: 'app_getUserInfo',
   *   par: { userId: '123' }
   * })
   * ```
   */
  request2<T = unknown>(config: LeapRequestConfig): Promise<T>

  /**
   * 异步请求（回调风格）
   */
  asynRequest<T = unknown>(
    name: string,
    par?: Record<string, unknown>,
    callback?: LeapCallback<T>,
    domain?: unknown,
    arg?: unknown
  ): void

  /** 获取会话 ID */
  getSid(): string | Promise<string>

  /** 设置会话 ID */
  setSid(sid: string): void

  /** 获取服务器 URL */
  getServerUrl(): string

  /** 获取 RPC URL */
  getRpcUrl(router?: string): string

  /** 加载资源文件 */
  load(path: string): Promise<string>

  /** 加载 JavaScript */
  loadJs(path: string, doc?: Document): Promise<void>

  /** 加载 CSS */
  loadCss(path: string, doc?: Document): Promise<void>

  /** 销毁客户端 */
  destroy(): void
}

/**
 * 创建 LEAP 错误
 */
export function createLeapError(
  message: string,
  options?: Partial<LeapError>
): LeapError {
  const error = new Error(message) as LeapError
  error.name = 'LeapError'

  if (options) {
    error.code = options.code
    error.status = options.status
    error.config = options.config
    error.response = options.response
    error.isNetworkError = options.isNetworkError
    error.isTimeoutError = options.isTimeoutError
  }

  return error
}

/**
 * 类型守卫：检查是否为 LEAP 错误
 */
export function isLeapError(error: unknown): error is LeapError {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as Error).name === 'LeapError'
  )
}
