import type {
  HttpAdapter,
  HttpError,
  RequestConfig,
  ResponseData,
} from '../types'
import { buildURL, createHttpError } from '../utils'

/**
 * HTTP 适配器基类
 *
 * 这是所有 HTTP 适配器的抽象基类，定义了适配器的标准接口和通用功能。
 * 具体的适配器（Fetch、Axios、Alova）需要继承此类并实现抽象方法。
 *
 * 设计目的：
 * - 🎯 **统一接口**：为不同的 HTTP 库提供统一的调用接口
 * - 🔧 **通用功能**：提取公共逻辑，避免在各个适配器中重复实现
 * - 🛡️ **错误处理**：标准化的错误处理和类型转换
 * - ⚡ **性能优化**：共享的优化逻辑，如 URL 构建、头部处理等
 *
 * 职责：
 * 1. 定义适配器的标准接口（request、isSupported）
 * 2. 提供通用的辅助方法（配置处理、响应处理、错误处理）
 * 3. 处理跨适配器的共同逻辑
 * 4. 提供扩展点供子类自定义
 *
 * 继承关系：
 * ```
 * BaseAdapter (抽象基类)
 *     ├─ FetchAdapter  (Fetch API 实现)
 *     ├─ AxiosAdapter  (Axios 实现)
 *     └─ AlovaAdapter  (Alova 实现)
 * ```
 *
 * @abstract
 *
 * @example 实现自定义适配器
 * ```typescript
 * class CustomAdapter extends BaseAdapter {
 *   name = 'custom'
 *
 *   isSupported(): boolean {
 *     return typeof window !== 'undefined'
 *   }
 *
 *   async request<T>(config: RequestConfig): Promise<ResponseData<T>> {
 *     // 1. 处理配置
 *     const processedConfig = this.processConfig(config)
 *
 *     try {
 *       // 2. 发送请求
 *       const response = await customHttpLib.request(processedConfig)
 *
 *       // 3. 处理响应
 *       return this.processResponse(
 *         response.data,
 *         response.status,
 *         response.statusText,
 *         response.headers,
 *         processedConfig
 *       )
 *     } catch (error) {
 *       // 4. 处理错误
 *       throw this.processError(error, processedConfig)
 *     }
 *   }
 * }
 * ```
 *
 * @see {@link FetchAdapter} Fetch API 适配器
 * @see {@link AxiosAdapter} Axios 适配器
 * @see {@link AlovaAdapter} Alova 适配器
 */
export abstract class BaseAdapter implements HttpAdapter {
  /**
   * 适配器名称
   *
   * 用于标识不同的适配器实现，也用于日志和调试。
   * 子类必须提供具体的名称。
   *
   * @abstract
   *
   * @example
   * ```typescript
   * class FetchAdapter extends BaseAdapter {
   *   name = 'fetch'  // 标识这是 Fetch 适配器
   * }
   * ```
   */
  abstract name: string

  /**
   * 发送 HTTP 请求（抽象方法）
   *
   * 这是适配器的核心方法，子类必须实现此方法来完成实际的 HTTP 请求。
   * 此方法应该：
   * 1. 调用 processConfig() 处理请求配置
   * 2. 使用底层 HTTP 库发送请求
   * 3. 调用 processResponse() 处理响应
   * 4. 调用 processError() 处理错误
   *
   * @template T - 响应数据的类型
   * @param config - 请求配置对象
   * @returns Promise<ResponseData<T>> - 标准化的响应数据
   *
   * @throws {HttpError} 当请求失败时抛出标准化的 HTTP 错误
   *
   * @abstract
   *
   * @example 实现示例
   * ```typescript
   * async request<T>(config: RequestConfig): Promise<ResponseData<T>> {
   *   // 1. 处理配置
   *   const processedConfig = this.processConfig(config)
   *
   *   try {
   *     // 2. 发送请求（使用底层库）
   *     const response = await fetch(processedConfig.url, {
   *       method: processedConfig.method,
   *       headers: processedConfig.headers,
   *       body: processedConfig.data
   *     })
   *
   *     // 3. 处理响应
   *     return this.processResponse(
   *       await response.json(),
   *       response.status,
   *       response.statusText,
   *       Object.fromEntries(response.headers),
   *       processedConfig
   *     )
   *   } catch (error) {
   *     // 4. 处理错误
   *     throw this.processError(error, processedConfig)
   *   }
   * }
   * ```
   */
  abstract request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>>

  /**
   * 检查适配器是否支持当前运行环境（抽象方法）
   *
   * 此方法用于判断适配器是否可以在当前环境中使用。
   * 例如：
   * - FetchAdapter 需要检查 fetch API 是否可用
   * - AxiosAdapter 在所有环境都可用
   * - AlovaAdapter 需要检查 Alova 是否已安装
   *
   * @returns boolean - true 表示支持当前环境，false 表示不支持
   *
   * @abstract
   *
   * @example Fetch 适配器的实现
   * ```typescript
   * isSupported(): boolean {
   *   // 检查是否在浏览器环境且支持 fetch
   *   return typeof window !== 'undefined' && 'fetch' in window
   * }
   * ```
   *
   * @example Axios 适配器的实现
   * ```typescript
   * isSupported(): boolean {
   *   // Axios 支持所有环境（浏览器和 Node.js）
   *   return true
   * }
   * ```
   *
   * @example Alova 适配器的实现
   * ```typescript
   * isSupported(): boolean {
   *   try {
   *     // 尝试导入 Alova，如果成功则支持
   *     require('alova')
   *     return true
   *   } catch {
   *     return false
   *   }
   * }
   * ```
   */
  abstract isSupported(): boolean

  /**
   * 处理请求配置
   */
  protected processConfig(config: RequestConfig): RequestConfig {
    const processedConfig = { ...config }

    // 构建完整 URL
    if (processedConfig.url) {
      processedConfig.url = buildURL(
        processedConfig.url,
        processedConfig.baseURL,
        processedConfig.params,
      )
    }

    // 设置默认方法
    if (!processedConfig.method) {
      processedConfig.method = 'GET'
    }

    // 设置默认头部
    if (!processedConfig.headers) {
      processedConfig.headers = {}
    }

    return processedConfig
  }

  /**
   * 处理响应数据
   */
  protected processResponse<T>(
    data: T,
    status: number,
    statusText: string,
    headers: Record<string, string>,
    config: RequestConfig,
    raw?: any,
  ): ResponseData<T> {
    return {
      data,
      status,
      statusText,
      headers,
      config,
      raw,
    }
  }

  /**
   * 处理错误
   */
  protected processError(
    error: any,
    config: RequestConfig,
    response?: ResponseData,
  ): HttpError {
    let message = 'Request failed'
    let code: string | undefined

    if (error instanceof Error) {
      message = error.message
      code = (error as any).code
    }
    else if (typeof error === 'string') {
      message = error
    }

    // 根据错误类型设置相应的标志
    const httpError = createHttpError(message, config, code, response)

    // 处理特定错误类型
    if (error.name === 'AbortError' || message.includes('aborted')) {
      httpError.isCancelError = true
      httpError.code = 'CANCELED'
    }
    else if (error.name === 'TimeoutError' || message.includes('timeout')) {
      httpError.isTimeoutError = true
      httpError.code = 'TIMEOUT'
    }
    else if (message.includes('Network') || message.includes('fetch')) {
      httpError.isNetworkError = true
      httpError.code = 'NETWORK_ERROR'
    }

    return httpError
  }

  /**
   * 创建超时控制器
   */
  protected createTimeoutController(timeout?: number): {
    signal: AbortSignal
    cleanup: () => void
  } {
    const controller = new AbortController()
    let timeoutId: NodeJS.Timeout | undefined

    if (timeout && timeout > 0) {
      timeoutId = setTimeout(() => {
        if (controller && typeof controller.abort === 'function') {
          controller.abort()
        }
      }, timeout)
    }

    return {
      signal: controller.signal,
      cleanup: () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      },
    }
  }

  /**
   * 合并 AbortSignal
   */
  protected mergeAbortSignals(
    signals: (AbortSignal | undefined)[],
  ): AbortSignal {
    const validSignals = signals.filter(
      (signal): signal is AbortSignal => signal !== undefined,
    )

    if (validSignals.length === 0) {
      return new AbortController().signal
    }

    if (validSignals.length === 1) {
      // 已检查数组长度，安全断言
      return validSignals[0]!
    }

    // 创建一个新的控制器来合并多个信号
    const controller = new AbortController()

    const abortHandler = () => {
      controller.abort()
    }

    validSignals.forEach((signal) => {
      if (signal.aborted) {
        controller.abort()
        return
      }
      signal.addEventListener('abort', abortHandler, { once: true })
    })

    return controller.signal
  }

  /**
   * 解析响应头
   */
  protected parseHeaders(
    headers: Headers | Record<string, string>,
  ): Record<string, string> {
    const result: Record<string, string> = {}

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key.toLowerCase()] = value
      })
    }
    else {
      Object.keys(headers).forEach((key) => {
        const value = headers[key]
        if (value !== undefined) {
          result[key.toLowerCase()] = value
        }
      })
    }

    return result
  }
}
