import type { RequestConfig, ResponseData } from '../types'
import { isArrayBuffer, isBlob, isFormData, isURLSearchParams } from '../utils'
import { BaseAdapter } from './base'

/**
 * Fetch API 适配器
 *
 * 这是基于浏览器原生 Fetch API 的 HTTP 适配器实现。
 * Fetch API 是现代浏览器提供的标准 HTTP 请求接口，具有以下特点：
 *
 * 优点：
 * - ✅ **原生支持**：所有现代浏览器原生支持，无需额外依赖
 * - ✅ **标准化**：基于 Web 标准，API 设计更现代
 * - ✅ **Promise 原生**：天然支持 Promise，代码更简洁
 * - ✅ **流式处理**：支持 ReadableStream，可处理大文件
 * - ✅ **包体积小**：无需引入第三方库
 *
 * 适用场景：
 * - 🌐 现代浏览器环境（推荐）
 * - 📱 移动 Web 应用
 * - ⚡ 对包体积敏感的项目
 * - 🎯 不需要复杂功能的简单场景
 *
 * 浏览器兼容性：
 * - Chrome 42+
 * - Firefox 39+
 * - Safari 10.1+
 * - Edge 14+
 *
 * 注意事项：
 * - ⚠️ 不支持 IE（需要 polyfill）
 * - ⚠️ 不支持上传/下载进度监控（原生限制）
 * - ⚠️ 默认不发送 Cookie（需要设置 credentials）
 * - ⚠️ 不会自动转换 JSON（需要手动调用 response.json()）
 *
 * @example 基础用法
 * ```typescript
 * const adapter = new FetchAdapter()
 *
 * // 检查是否支持
 * if (adapter.isSupported()) {
 *   const response = await adapter.request({
 *     url: 'https://api.example.com/users',
 *     method: 'GET'
 *   })
 * }
 * ```
 *
 * @example 带认证的请求
 * ```typescript
 * const response = await adapter.request({
 *   url: 'https://api.example.com/protected',
 *   method: 'GET',
 *   headers: {
 *     'Authorization': 'Bearer token'
 *   },
 *   withCredentials: true // 发送 Cookie
 * })
 * ```
 *
 * @see {@link https://developer.mozilla.org/docs/Web/API/Fetch_API} Fetch API 文档
 */
export class FetchAdapter extends BaseAdapter {
  /**
   * 适配器名称标识
   * 用于日志记录和调试
   */
  name = 'fetch'

  /**
   * 检查当前环境是否支持 Fetch API
   *
   * 此方法检查两个关键 API 的可用性：
   * 1. fetch：用于发送 HTTP 请求
   * 2. AbortController：用于取消请求和超时控制
   *
   * @returns boolean - true 表示支持，false 表示不支持
   *
   * @example
   * ```typescript
   * const adapter = new FetchAdapter()
   *
   * if (adapter.isSupported()) {
   *   console.log('可以使用 Fetch 适配器')
   * } else {
   *   console.log('不支持 Fetch API，请使用其他适配器')
   * }
   * ```
   */
  isSupported(): boolean {
    return (
      typeof fetch !== 'undefined' && typeof AbortController !== 'undefined'
    )
  }

  /**
   * 发送 HTTP 请求
   *
   * 这是适配器的核心方法，完整的请求流程如下：
   *
   * 执行流程：
   * 1. 处理和标准化请求配置
   * 2. 创建超时控制器
   * 3. 合并多个 AbortSignal（用户取消 + 超时）
   * 4. 构建请求头和请求体
   * 5. 调用原生 fetch API
   * 6. 解析响应数据
   * 7. 处理错误情况
   *
   * 特殊处理：
   * - 自动设置 Content-Type
   * - 自动序列化 JSON 数据
   * - 支持多种响应类型（json、text、blob等）
   * - 智能解析响应（根据 Content-Type）
   *
   * @template T - 响应数据的类型
   * @param config - 请求配置对象
   * @returns Promise<ResponseData<T>> - 标准化的响应数据
   *
   * @throws {HttpError} 网络错误、超时错误或 HTTP 错误
   *
   * @example GET 请求
   * ```typescript
   * const response = await adapter.request<User[]>({
   *   url: 'https://api.example.com/users',
   *   method: 'GET'
   * })
   * console.log(response.data) // User[]
   * ```
   *
   * @example POST 请求
   * ```typescript
   * const response = await adapter.request<User>({
   *   url: 'https://api.example.com/users',
   *   method: 'POST',
   *   data: {
   *     name: 'John',
   *     email: 'john@example.com'
   *   }
   * })
   * ```
   *
   * @example 带超时的请求
   * ```typescript
   * const response = await adapter.request({
   *   url: 'https://api.example.com/slow',
   *   timeout: 5000 // 5秒超时
   * })
   * ```
   *
   * @example 可取消的请求
   * ```typescript
   * const controller = new AbortController()
   *
   * const requestPromise = adapter.request({
   *   url: 'https://api.example.com/data',
   *   signal: controller.signal
   * })
   *
   * // 取消请求
   * controller.abort()
   * ```
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    const processedConfig = this.processConfig(config)

    try {
      // 创建超时控制器
      const timeoutController = this.createTimeoutController(
        processedConfig.timeout,
      )

      // 合并 AbortSignal
      const signal = this.mergeAbortSignals([
        processedConfig.signal,
        timeoutController.signal,
      ])

      // 构建 fetch 选项
      const fetchOptions: RequestInit = {
        method: processedConfig.method,
        headers: this.buildHeaders(processedConfig),
        signal,
        credentials: processedConfig.withCredentials
          ? 'include'
          : 'same-origin',
      }

      // 处理请求体
      if (
        processedConfig.data
        && processedConfig.method !== 'GET'
        && processedConfig.method !== 'HEAD'
      ) {
        fetchOptions.body = this.buildBody(
          processedConfig.data,
          processedConfig.headers,
        )
      }

      // 发送请求
      const response = await fetch(processedConfig.url!, fetchOptions)

      // 清理超时定时器
      timeoutController.cleanup()

      // 处理响应
      return await this.handleResponse<T>(response, processedConfig)
    }
    catch (error) {
      throw this.processError(error, processedConfig)
    }
  }

  /**
   * 构建请求头
   *
   * 智能构建 HTTP 请求头，包括自动设置 Content-Type。
   *
   * 自动 Content-Type 设置规则：
   * - string 类型 → text/plain
   * - FormData → 不设置（浏览器自动设置，包含 boundary）
   * - URLSearchParams → application/x-www-form-urlencoded
   * - object 类型 → application/json
   *
   * 注意：如果用户已经设置了 Content-Type，则不会覆盖。
   *
   * @param config - 请求配置对象
   * @returns HeadersInit - Fetch API 兼容的请求头对象
   *
   * @private
   *
   * @example
   * ```typescript
   * // JSON 数据会自动添加 Content-Type
   * const headers = this.buildHeaders({
   *   data: { name: 'John' }
   * })
   * // 结果: { 'Content-Type': 'application/json' }
   *
   * // FormData 不会设置 Content-Type（让浏览器自动处理）
   * const formHeaders = this.buildHeaders({
   *   data: new FormData()
   * })
   * // 结果: {}（浏览器会自动添加 multipart/form-data 和 boundary）
   * ```
   */
  private buildHeaders(config: RequestConfig): HeadersInit {
    const headers: Record<string, string> = { ...config.headers }

    // 智能设置 Content-Type：仅在未设置且有数据时自动添加
    if (config.data && !headers['content-type'] && !headers['Content-Type']) {
      if (typeof config.data === 'string') {
        // 字符串数据 → 纯文本
        headers['Content-Type'] = 'text/plain'
      }
      else if (isFormData(config.data)) {
        // FormData 会自动设置 Content-Type，包括 boundary
        // 删除可能存在的 Content-Type，让浏览器自动处理
        delete headers['Content-Type']
      }
      else if (isURLSearchParams(config.data)) {
        // URL 参数 → 表单编码
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
      }
      else if (typeof config.data === 'object') {
        // 对象数据 → JSON
        headers['Content-Type'] = 'application/json'
      }
    }

    return headers
  }

  /**
   * 构建请求体
   *
   * 将各种类型的数据转换为 Fetch API 可接受的请求体格式。
   *
   * 支持的数据类型：
   * - string：直接使用
   * - FormData：直接使用（文件上传）
   * - Blob：直接使用（二进制数据）
   * - ArrayBuffer：直接使用（二进制数据）
   * - URLSearchParams：直接使用（表单数据）
   * - ReadableStream：直接使用（流式数据）
   * - object：根据 Content-Type 处理
   *   - application/x-www-form-urlencoded → URLSearchParams
   *   - 其他 → JSON.stringify()
   *
   * @param data - 要发送的数据
   * @param headers - 请求头（用于判断 Content-Type）
   * @returns BodyInit - Fetch API 兼容的请求体
   *
   * @private
   *
   * @example JSON 数据
   * ```typescript
   * const body = this.buildBody(
   *   { name: 'John', age: 30 },
   *   { 'Content-Type': 'application/json' }
   * )
   * // 结果: '{"name":"John","age":30}'
   * ```
   *
   * @example 表单数据
   * ```typescript
   * const body = this.buildBody(
   *   { username: 'john', password: '123' },
   *   { 'Content-Type': 'application/x-www-form-urlencoded' }
   * )
   * // 结果: URLSearchParams { username: 'john', password: '123' }
   * ```
   *
   * @example 文件上传
   * ```typescript
   * const formData = new FormData()
   * formData.append('file', file)
   * const body = this.buildBody(formData)
   * // 结果: FormData（直接使用）
   * ```
   */
  private buildBody(data: any, headers?: Record<string, string>): BodyInit {
    if (data === null || data === undefined) {
      return undefined as any
    }

    // 直接支持的类型
    if (
      typeof data === 'string'
      || isFormData(data)
      || isBlob(data)
      || isArrayBuffer(data)
      || isURLSearchParams(data)
      || data instanceof ReadableStream
    ) {
      return data
    }

    // 对象类型，根据 Content-Type 处理
    const contentType
      = headers?.['content-type'] || headers?.['Content-Type'] || ''

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams()
      Object.keys(data).forEach((key) => {
        const value = data[key]
        if (value !== null && value !== undefined) {
          params.append(key, String(value))
        }
      })
      return params
    }

    // 默认 JSON 序列化
    return JSON.stringify(data)
  }

  /**
   * 处理 HTTP 响应
   *
   * 完整处理 Fetch API 返回的 Response 对象，包括：
   * 1. 解析响应头
   * 2. 解析响应体数据
   * 3. 检查 HTTP 状态码
   * 4. 构造标准化的响应对象或错误对象
   *
   * 状态码处理：
   * - 2xx：成功，返回标准响应对象
   * - 4xx/5xx：失败，抛出 HttpError
   *
   * @template T - 响应数据的类型
   * @param response - Fetch API 的 Response 对象
   * @param config - 原始请求配置
   * @returns Promise<ResponseData<T>> - 标准化的响应数据
   *
   * @throws {HttpError} 当 HTTP 状态码表示失败时（!response.ok）
   *
   * @private
   *
   * @example
   * ```typescript
   * const fetchResponse = await fetch(url, options)
   * const standardResponse = await this.handleResponse(fetchResponse, config)
   * // 结果: {
   * //   data: T,
   * //   status: 200,
   * //   statusText: 'OK',
   * //   headers: {...},
   * //   config: {...}
   * // }
   * ```
   */
  private async handleResponse<T>(
    response: Response,
    config: RequestConfig,
  ): Promise<ResponseData<T>> {
    // 1. 解析响应头（标准化为对象格式）
    const headers = this.parseHeaders(response.headers)

    // 2. 解析响应体数据（根据 responseType 和 Content-Type）
    const data = await this.parseResponseData<T>(response, config.responseType)

    // 3. 检查 HTTP 状态码
    if (!response.ok) {
      // 状态码表示失败（4xx、5xx），构造并抛出错误
      const error = this.processError(
        new Error(`Request failed with status ${response.status}`),
        config,
        this.processResponse(
          data,
          response.status,
          response.statusText,
          headers,
          config,
          response,
        ),
      )
      throw error
    }

    // 4. 构造标准化的成功响应
    return this.processResponse(
      data,
      response.status,
      response.statusText,
      headers,
      config,
      response,
    )
  }

  /**
   * 解析响应数据
   *
   * 根据指定的响应类型或 Content-Type 智能解析响应体。
   *
   * 解析策略：
   * 1. **优先使用 responseType**：如果配置中指定了 responseType，则按指定类型解析
   * 2. **自动检测 Content-Type**：如果未指定，根据响应头的 Content-Type 自动判断
   * 3. **容错处理**：解析失败时返回 null，不抛出错误
   *
   * 支持的响应类型：
   * - `text`：解析为字符串
   * - `blob`：解析为 Blob（适用于文件、图片等）
   * - `arrayBuffer`：解析为 ArrayBuffer（适用于二进制数据）
   * - `stream`：返回 ReadableStream（适用于流式处理）
   * - `json`（默认）：解析为 JSON 对象
   *
   * 自动检测逻辑（当 responseType 为 'json' 或未指定时）：
   * - Content-Type 包含 'application/json' → JSON 解析
   * - Content-Type 包含 'text/' → 文本解析
   * - 其他：尝试 JSON 解析，失败则返回文本
   *
   * @template T - 响应数据的类型
   * @param response - Fetch API 的 Response 对象
   * @param responseType - 期望的响应类型
   * @returns Promise<T> - 解析后的数据
   *
   * @private
   *
   * @example JSON 解析
   * ```typescript
   * const data = await this.parseResponseData(response, 'json')
   * // 自动调用 response.json()
   * ```
   *
   * @example 文件下载
   * ```typescript
   * const blob = await this.parseResponseData(response, 'blob')
   * // 可用于创建下载链接
   * const url = URL.createObjectURL(blob)
   * ```
   *
   * @example 自动检测
   * ```typescript
   * // Content-Type: application/json
   * const data = await this.parseResponseData(response)
   * // 自动解析为 JSON
   * ```
   */
  private async parseResponseData<T>(
    response: Response,
    responseType?: string,
  ): Promise<T> {
    if (!response.body) {
      return null as T
    }

    try {
      switch (responseType) {
        case 'text':
          return (await response.text()) as T
        case 'blob':
          return (await response.blob()) as T
        case 'arrayBuffer':
          return (await response.arrayBuffer()) as T
        case 'stream':
          return response.body as T
        case 'json':
        default: {
          // 检查 Content-Type
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            return await response.json()
          }
          else if (contentType.includes('text/')) {
            return (await response.text()) as T
          }
          else {
            // 尝试解析为 JSON，失败则返回文本
            const text = await response.text()
            try {
              return JSON.parse(text)
            }
            catch {
              return text as T
            }
          }
        }
      }
    }
    catch {
      // 解析失败，返回空值
      return null as T
    }
  }
}
