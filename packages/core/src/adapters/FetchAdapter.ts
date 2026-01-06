import type { RequestConfig, ResponseData } from '../types'
import { HttpError } from '../types'
import { BaseAdapter } from './base'

/**
 * 错误码常量
 * @description 定义了所有可能的错误代码，便于错误分类和处理
 */
export const ErrorCodes = {
  /** 请求超时 */
  TIMEOUT: 'ETIMEDOUT',
  /** 请求被取消 */
  CANCELLED: 'ECANCELLED',
  /** 网络错误 */
  NETWORK: 'ENETWORK',
  /** 参数验证错误 */
  VALIDATION: 'EVALIDATION',
  /** 解析响应错误 */
  PARSE: 'EPARSE',
  /** HTTP 错误 */
  HTTP: 'EHTTP',
  /** 未知错误 */
  UNKNOWN: 'EUNKNOWN',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * URL 验证正则表达式
 * @description 支持 http/https/相对路径
 */
const URL_PATTERN = /^(https?:\/\/|\/)/i

/**
 * 验证请求配置
 * @param config - 请求配置对象
 * @throws {HttpError} 当配置无效时抛出错误
 */
function validateConfig(config: RequestConfig): void {
  if (!config.url && !config.baseURL) {
    throw new HttpError('Request URL is required', {
      code: ErrorCodes.VALIDATION,
      config,
    })
  }

  if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout < 0)) {
    throw new HttpError('Timeout must be a non-negative number', {
      code: ErrorCodes.VALIDATION,
      config,
    })
  }
}

/**
 * 构建完整的请求 URL
 * @param config - 请求配置
 * @returns 完整的 URL 字符串
 */
function buildFullUrl(config: RequestConfig): string {
  const { url = '', baseURL = '', params } = config

  // 构建基础 URL
  let fullUrl: string
  if (url && URL_PATTERN.test(url)) {
    // url 是绝对路径，直接使用
    fullUrl = url
  } else if (baseURL) {
    // 拼接 baseURL 和相对路径
    const normalizedBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
    const normalizedPath = url.startsWith('/') ? url : `/${url}`
    fullUrl = `${normalizedBase}${normalizedPath}`
  } else {
    fullUrl = url
  }

  // 添加查询参数
  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    }
    const queryString = searchParams.toString()
    if (queryString) {
      const separator = fullUrl.includes('?') ? '&' : '?'
      fullUrl = `${fullUrl}${separator}${queryString}`
    }
  }

  return fullUrl
}

/**
 * 序列化请求体数据
 * @param data - 请求数据
 * @param headers - 请求头对象（可能被修改）
 * @returns 序列化后的请求体
 */
function serializeRequestBody(
  data: unknown,
  headers: Record<string, string>,
): BodyInit | undefined {
  if (data === undefined || data === null) {
    return undefined
  }

  // FormData 直接返回，不设置 Content-Type（浏览器会自动设置 boundary）
  if (data instanceof FormData) {
    return data
  }

  // Blob 直接返回
  if (data instanceof Blob) {
    return data
  }

  // ArrayBuffer 或 TypedArray
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return data as BodyInit
  }

  // URLSearchParams
  if (data instanceof URLSearchParams) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded'
    return data
  }

  // 字符串
  if (typeof data === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'text/plain'
    return data
  }

  // 对象或数组 -> JSON
  if (typeof data === 'object') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    try {
      return JSON.stringify(data)
    } catch {
      throw new HttpError('Failed to serialize request data to JSON', {
        code: ErrorCodes.VALIDATION,
      })
    }
  }

  // 其他类型转字符串
  return String(data)
}

/**
 * 解析响应数据
 * @param response - Fetch Response 对象
 * @param config - 请求配置
 * @returns 解析后的响应数据
 */
async function parseResponseData(
  response: Response,
  config: RequestConfig,
): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''
  const responseType = config.responseType

  try {
    // 显式指定响应类型
    if (responseType === 'blob') {
      return await response.blob()
    }
    if (responseType === 'arrayBuffer' || responseType === 'arraybuffer') {
      return await response.arrayBuffer()
    }
    if (responseType === 'text') {
      return await response.text()
    }
    if (responseType === 'stream') {
      return response.body
    }

    // 自动检测内容类型
    if (contentType.includes('application/json')) {
      const text = await response.text()
      // 空响应返回 null
      if (!text || text.trim() === '') {
        return null
      }
      return JSON.parse(text)
    }

    if (contentType.includes('text/')) {
      return await response.text()
    }

    // 二进制类型
    if (
      contentType.includes('application/octet-stream') ||
      contentType.includes('image/') ||
      contentType.includes('audio/') ||
      contentType.includes('video/')
    ) {
      return await response.blob()
    }

    // 默认尝试解析为 JSON，失败则返回文本
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  } catch (error) {
    throw new HttpError(
      `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { code: ErrorCodes.PARSE, config },
    )
  }
}

/**
 * 将 Headers 对象转换为普通对象
 * @param headers - Headers 对象
 * @returns 普通对象
 */
function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value
  })
  return result
}

/**
 * 创建 HTTP 错误（带状态码分类）
 * @param response - Fetch Response 对象
 * @param config - 请求配置
 * @param responseData - 响应数据
 * @returns HttpError 实例
 */
function createHttpStatusError(
  response: Response,
  config: RequestConfig,
  responseData: ResponseData,
): HttpError {
  const { status, statusText } = response

  // 根据状态码生成友好的错误消息
  let message: string
  if (status >= 400 && status < 500) {
    message = `Client error: ${status} ${statusText}`
  } else if (status >= 500) {
    message = `Server error: ${status} ${statusText}`
  } else {
    message = `HTTP error: ${status} ${statusText}`
  }

  return new HttpError(message, {
    code: ErrorCodes.HTTP,
    status,
    config,
    response: responseData,
  })
}

/**
 * Fetch API 适配器类
 *
 * 高性能、功能完整的 Fetch API 封装，提供以下特性：
 *
 * 功能特性：
 * - 🔄 自动超时控制和取消请求支持
 * - 📦 智能请求体序列化（JSON/FormData/Blob/URLSearchParams）
 * - 🎯 自动响应解析（根据 Content-Type 或配置）
 * - 🛡️ 完善的错误分类和处理
 * - ✅ 请求配置验证
 *
 * 性能优化：
 * - 使用 AbortSignal 组合（如浏览器支持 AbortSignal.any）
 * - 避免不必要的对象创建
 * - 优化的 URL 构建逻辑
 *
 * @example 基础 GET 请求
 * ```typescript
 * const adapter = new FetchAdapterClass()
 * const response = await adapter.request({
 *   url: '/api/users',
 *   method: 'GET',
 *   baseURL: 'https://api.example.com',
 * })
 * ```
 */
export class FetchAdapterClass extends BaseAdapter {
  name = 'fetch'

  /**
   * 检查是否支持 Fetch API
   */
  isSupported(): boolean {
    return typeof globalThis !== 'undefined' && 'fetch' in globalThis
  }

  /**
   * 发送 HTTP 请求
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    return fetchRequest<T>(config)
  }
}

/**
 * Fetch 请求函数（内部实现）
 */
async function fetchRequest<T = unknown>(
  config: RequestConfig,
): Promise<ResponseData<T>> {
  // 1. 验证配置
  validateConfig(config)

  const {
    method = 'GET',
    headers: configHeaders = {},
    data,
    timeout = 30000,
    withCredentials = false,
    signal: externalSignal,
  } = config

  // 2. 创建超时控制器
  const timeoutController = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  // 设置超时（仅当 timeout > 0 时）
  if (timeout > 0) {
    timeoutId = setTimeout(() => {
      timeoutController.abort(new DOMException('Request timeout', 'TimeoutError'))
    }, timeout)
  }

  // 3. 合并取消信号
  // 优先使用浏览器原生的 AbortSignal.any（如果支持）
  let signal: AbortSignal
  const signals: AbortSignal[] = [timeoutController.signal]

  if (externalSignal) {
    signals.push(externalSignal)
  }

  // 处理旧版 cancelToken（兼容性）
  const cancelTokenController = new AbortController()
  if ((config as any).cancelToken?.promise) {
    (config as any).cancelToken.promise.then(() => {
      cancelTokenController.abort(new DOMException('Request cancelled', 'AbortError'))
    })
    signals.push(cancelTokenController.signal)
  }

  // 合并信号
  if (signals.length === 1) {
    signal = signals[0]
  } else if ('any' in AbortSignal && typeof (AbortSignal as any).any === 'function') {
    // 现代浏览器支持 AbortSignal.any()
    signal = (AbortSignal as any).any(signals)
  } else {
    // 降级方案：创建新的控制器并监听所有信号
    const combinedController = new AbortController()
    for (const sig of signals) {
      if (sig.aborted) {
        combinedController.abort(sig.reason)
        break
      }
      sig.addEventListener('abort', () => {
        combinedController.abort(sig.reason)
      }, { once: true })
    }
    signal = combinedController.signal
  }

  // 4. 准备请求头和请求体
  const headers: Record<string, string> = { ...configHeaders }
  const body = serializeRequestBody(data, headers)

  // 5. 构建请求选项
  const fetchOptions: RequestInit = {
    method: method.toUpperCase(),
    headers,
    signal,
    credentials: withCredentials ? 'include' : 'same-origin',
    // 性能优化：对于简单请求禁用缓存可以减少预检请求
    cache: config.cache === false ? 'no-store' : undefined,
  }

  // 只有非 GET/HEAD 请求才添加 body
  if (body !== undefined && !['GET', 'HEAD'].includes(method.toUpperCase())) {
    fetchOptions.body = body
  }

  // 6. 构建完整 URL
  const fullUrl = buildFullUrl(config)

  try {
    // 7. 发送请求
    const response = await fetch(fullUrl, fetchOptions)

    // 清除超时定时器
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }

    // 8. 解析响应数据
    const responseData = await parseResponseData(response, config)

    // 9. 构建响应对象
    const result: ResponseData = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: headersToObject(response.headers),
      config,
      raw: response,
    }

    // 10. 检查 HTTP 状态码
    if (!response.ok) {
      throw createHttpStatusError(response, config, result)
    }

    return result
  } catch (error: unknown) {
    // 清除超时定时器
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }

    // 已经是 HttpError，直接抛出
    if (error instanceof HttpError) {
      throw error
    }

    // 处理 DOMException（取消/超时）
    if (error instanceof DOMException) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        throw new HttpError('Request timeout', {
          code: ErrorCodes.TIMEOUT,
          config,
          isTimeoutError: true,
        })
      }
      if (error.name === 'AbortError') {
        throw new HttpError('Request cancelled', {
          code: ErrorCodes.CANCELLED,
          config,
          isCancelError: true,
        })
      }
    }

    // 处理 TypeError（网络错误）
    if (error instanceof TypeError) {
      throw new HttpError(`Network error: ${error.message}`, {
        code: ErrorCodes.NETWORK,
        config,
        isNetworkError: true,
        cause: error,
      })
    }

    // 处理普通 Error
    if (error instanceof Error) {
      throw new HttpError(error.message || 'Request failed', {
        code: ErrorCodes.UNKNOWN,
        config,
        cause: error,
      })
    }

    // 未知错误类型
    throw new HttpError('Unknown error occurred', {
      code: ErrorCodes.UNKNOWN,
      config,
    })
  }
}

/**
 * FetchAdapter 实例（兼容性导出）
 * @description 提供一个预创建的适配器实例，方便直接使用
 */
export const FetchAdapter = new FetchAdapterClass()
