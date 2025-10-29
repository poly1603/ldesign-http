import type { RequestConfig, ResponseData } from '../types'
import { BaseAdapter } from './base'

/**
 * Axios 适配器
 *
 * 这是基于流行的 Axios 库的 HTTP 适配器实现。
 * Axios 是一个功能强大的 HTTP 客户端库，被广泛应用于各种项目中。
 *
 * 优点：
 * - ✅ **功能完整**：支持拦截器、转换器、进度监控等高级功能
 * - ✅ **兼容性好**：支持浏览器和 Node.js 环境
 * - ✅ **社区活跃**：大量插件和扩展，文档完善
 * - ✅ **自动转换**：自动转换 JSON 数据
 * - ✅ **进度支持**：原生支持上传/下载进度监控
 * - ✅ **请求取消**：完善的请求取消机制
 *
 * 适用场景：
 * - 🖥️ Node.js 服务端应用（强烈推荐）
 * - 🌐 需要高级功能的浏览器应用
 * - 📊 需要进度监控的文件传输
 * - 🔧 需要复杂拦截器的场景
 * - 🔄 需要请求/响应转换的场景
 *
 * 注意事项：
 * - ⚠️ 包体积较大（约13KB gzipped）
 * - ⚠️ 需要额外安装 axios 依赖
 * - ⚠️ 某些高级功能在浏览器中受限
 *
 * 性能特点：
 * - 请求性能：与Fetch相当
 * - 包体积：较大（+13KB）
 * - 内存占用：略高（因功能更多）
 *
 * @example 基础用法
 * ```typescript
 * import axios from 'axios'
 * import { AxiosAdapter } from '@ldesign/http/adapters'
 *
 * // 使用默认axios实例
 * const adapter = new AxiosAdapter()
 *
 * // 或使用自定义axios实例
 * const customAxios = axios.create({
 *   baseURL: 'https://api.example.com'
 * })
 * const adapter = new AxiosAdapter(customAxios)
 * ```
 *
 * @example 在Node.js中使用
 * ```typescript
 * // Node.js环境推荐使用Axios
 * const client = await createHttpClient({
 *   adapter: 'axios',
 *   baseURL: 'https://api.example.com'
 * })
 * ```
 *
 * @see {@link https://axios-http.com/docs/intro} Axios 官方文档
 */
export class AxiosAdapter extends BaseAdapter {
  /**
   * 适配器名称标识
   */
  name = 'axios'

  /**
   * Axios 实例
   * 
   * 使用 any 类型避免强制依赖 axios 的类型定义。
   * 这允许用户在未安装 @types/axios 时也能使用。
   */
  private axios: any

  /**
   * 构造函数 - 初始化 Axios 适配器
   *
   * 支持两种初始化方式：
   * 1. 使用自定义 axios 实例（推荐）
   * 2. 自动导入默认 axios（需要已安装）
   *
   * @param axiosInstance - 可选的自定义 axios 实例
   *                        如果提供，将使用该实例；
   *                        如果不提供，会尝试自动导入 axios
   *
   * @example 使用默认axios
   * ```typescript
   * const adapter = new AxiosAdapter()
   * ```
   *
   * @example 使用自定义axios实例
   * ```typescript
   * import axios from 'axios'
   *
   * const customAxios = axios.create({
   *   baseURL: 'https://api.example.com',
   *   timeout: 10000,
   *   headers: {
   *     'X-Custom-Header': 'value'
   *   }
   * })
   *
   * const adapter = new AxiosAdapter(customAxios)
   * ```
   *
   * @example 带拦截器的axios实例
   * ```typescript
   * import axios from 'axios'
   *
   * const axiosInstance = axios.create()
   *
   * // 添加请求拦截器
   * axiosInstance.interceptors.request.use(config => {
   *   config.headers.Authorization = `Bearer ${token}`
   *   return config
   * })
   *
   * const adapter = new AxiosAdapter(axiosInstance)
   * ```
   */
  constructor(axiosInstance?: any) {
    super()

    if (axiosInstance) {
      // 使用提供的 axios 实例
      this.axios = axiosInstance
    }
    else {
      try {
        // 尝试动态导入 axios
        // 使用 require 而不是 import，支持 CommonJS 环境
        // eslint-disable-next-line ts/no-require-imports
        this.axios = require('axios')
      }
      catch {
        // axios 未安装，标记为不可用
        this.axios = null
      }
    }
  }

  /**
   * 检查当前环境是否支持 Axios
   *
   * 此方法检查 axios 库是否可用。
   * Axios 在所有环境都可用（浏览器和 Node.js），
   * 但前提是已经安装了 axios 依赖。
   *
   * @returns boolean - true 表示 axios 可用，false 表示未安装
   *
   * @example
   * ```typescript
   * const adapter = new AxiosAdapter()
   *
   * if (adapter.isSupported()) {
   *   console.log('可以使用 Axios 适配器')
   * } else {
   *   console.log('axios 未安装，请运行: npm install axios')
   * }
   * ```
   */
  isSupported(): boolean {
    return this.axios !== null
  }

  /**
   * 发送 HTTP 请求
   *
   * 这是适配器的核心方法，将标准的请求配置转换为 Axios 格式，
   * 发送请求后再将 Axios 响应转换回标准格式。
   *
   * 执行流程：
   * 1. 检查 axios 是否可用
   * 2. 处理和标准化请求配置
   * 3. 转换配置为 Axios 格式
   * 4. 调用 axios.request() 发送请求
   * 5. 转换 Axios 响应为标准格式
   * 6. 处理 Axios 错误
   *
   * 特殊处理：
   * - URL 和查询参数的分离和重组
   * - baseURL 的正确处理
   * - 响应类型的格式转换
   * - 错误类型的标准化
   *
   * 配置转换说明：
   * - `responseType: 'arrayBuffer'` → `responseType: 'arraybuffer'` (Axios格式)
   * - 已合并到URL的参数会被提取出来
   * - baseURL 会被正确分离和处理
   *
   * @template T - 响应数据的类型
   * @param config - 标准请求配置对象
   * @returns Promise<ResponseData<T>> - 标准化的响应数据
   *
   * @throws {Error} 当 axios 未安装时抛出错误
   * @throws {HttpError} 当请求失败时抛出标准化的 HTTP 错误
   *
   * @example GET 请求
   * ```typescript
   * const response = await adapter.request<User[]>({
   *   url: 'https://api.example.com/users',
   *   method: 'GET',
   *   params: { page: 1, size: 10 }
   * })
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
   * @example 文件上传（利用Axios的进度监控）
   * ```typescript
   * const response = await adapter.request({
   *   url: 'https://api.example.com/upload',
   *   method: 'POST',
   *   data: formData,
   *   onUploadProgress: (progressEvent) => {
   *     const percent = (progressEvent.loaded / progressEvent.total) * 100
   *     console.log(`上传进度: ${percent}%`)
   *   }
   * })
   * ```
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    if (!this.isSupported()) {
      throw new Error(
        'Axios is not available. Please install axios: npm install axios',
      )
    }

    const processedConfig = this.processConfig(config)

    try {
      // 转换配置为 axios 格式
      const axiosConfig = this.convertToAxiosConfig(processedConfig)

      // 发送请求
      const response = await this.axios.request(axiosConfig)

      // 转换响应为标准格式
      return this.convertFromAxiosResponse<T>(response, processedConfig)
    }
    catch (error) {
      throw this.handleAxiosError(error, processedConfig)
    }
  }

  /**
   * 转换标准请求配置为 Axios 格式
   *
   * 这是一个复杂的转换过程，需要处理多种边界情况：
   *
   * 主要处理：
   * 1. **URL和查询参数分离**：
   *    - BaseAdapter 已将 params 合并到 URL 中
   *    - 需要从 URL 中提取查询参数，分离给 Axios
   *    - 避免参数重复
   *
   * 2. **baseURL处理**：
   *    - 如果URL已包含baseURL，需要分离
   *    - 确保相对路径以 / 开头
   *
   * 3. **响应类型转换**：
   *    - 标准格式：'arrayBuffer'
   *    - Axios格式：'arraybuffer'
   *
   * 4. **清理undefined值**：
   *    - 移除所有undefined字段
   *    - 避免发送到Axios导致问题
   *
   * @param config - 标准请求配置对象
   * @returns Axios兼容的配置对象
   *
   * @private
   *
   * @example
   * ```typescript
   * // 输入：标准配置
   * const standardConfig = {
   *   url: 'https://api.example.com/users?page=1',
   *   method: 'GET',
   *   baseURL: 'https://api.example.com'
   * }
   *
   * // 输出：Axios配置
   * const axiosConfig = this.convertToAxiosConfig(standardConfig)
   * // 结果：{
   * //   url: '/users',
   * //   method: 'GET',
   * //   baseURL: 'https://api.example.com',
   * //   params: { page: 1 }
   * // }
   * ```
   */
  private convertToAxiosConfig(config: RequestConfig): any {
    // 分离URL和查询参数（因为BaseAdapter已经将params合并到URL中）
    let cleanUrl = config.url || ''
    const extractedParams = config.params || {}
    const baseURL = config.baseURL

    // 如果URL包含查询参数，提取它们
    const urlParts = cleanUrl.split('?')
    if (urlParts.length > 1) {
      cleanUrl = urlParts[0]
      const queryString = urlParts[1]
      const urlParams = new URLSearchParams(queryString)

      // 将URL中的参数合并到extractedParams中
      urlParams.forEach((value, key) => {
        // 尝试转换数字字符串回数字
        const numValue = Number(value)
        extractedParams[key] = !Number.isNaN(numValue) && value !== '' ? numValue : value
      })
    }

    // 如果URL已经包含了baseURL，需要分离它们
    if (baseURL && cleanUrl.startsWith(baseURL)) {
      cleanUrl = cleanUrl.substring(baseURL.length)
      // 确保URL以/开头
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = `/${cleanUrl}`
      }
    }

    const axiosConfig: any = {
      url: cleanUrl,
      method: config.method,
    }

    // 只在有值时添加字段
    if (config.headers && Object.keys(config.headers).length > 0) {
      axiosConfig.headers = config.headers
    }
    if (config.data !== undefined) {
      axiosConfig.data = config.data
    }
    if (config.timeout !== undefined) {
      axiosConfig.timeout = config.timeout
    }
    if (baseURL) {
      axiosConfig.baseURL = baseURL
    }
    if (config.withCredentials !== undefined) {
      axiosConfig.withCredentials = config.withCredentials
    }
    if (config.signal) {
      axiosConfig.signal = config.signal
    }

    // 处理查询参数
    if (extractedParams && Object.keys(extractedParams).length > 0) {
      axiosConfig.params = extractedParams
    }

    // 处理响应类型
    if (config.responseType) {
      switch (config.responseType) {
        case 'json':
          axiosConfig.responseType = 'json'
          break
        case 'text':
          axiosConfig.responseType = 'text'
          break
        case 'blob':
          axiosConfig.responseType = 'blob'
          break
        case 'arrayBuffer':
          axiosConfig.responseType = 'arraybuffer'
          break
        case 'stream':
          axiosConfig.responseType = 'stream'
          break
        default:
          axiosConfig.responseType = 'json'
      }
    }

    // 移除 undefined 值
    Object.keys(axiosConfig).forEach((key) => {
      if (axiosConfig[key] === undefined) {
        delete axiosConfig[key]
      }
    })

    return axiosConfig
  }

  /**
   * 转换 Axios 响应为标准格式
   *
   * 将 Axios 特有的响应对象转换为我们的标准响应格式。
   * 这确保了无论使用哪个适配器，都能获得一致的响应结构。
   *
   * 转换内容：
   * - response.data → data
   * - response.status → status
   * - response.statusText → statusText
   * - response.headers → headers
   * - 原始config → config
   *
   * 注意：这里使用简化的 config 对象，只包含 url 字段，
   * 避免携带过多不必要的数据。
   *
   * @template T - 响应数据的类型
   * @param axiosResponse - Axios 的响应对象
   * @param config - 原始请求配置
   * @returns ResponseData<T> - 标准化的响应数据
   *
   * @private
   *
   * @example
   * ```typescript
   * // Axios响应
   * const axiosResponse = {
   *   data: { id: 1, name: 'John' },
   *   status: 200,
   *   statusText: 'OK',
   *   headers: { 'content-type': 'application/json' }
   * }
   *
   * // 转换为标准格式
   * const standardResponse = this.convertFromAxiosResponse(axiosResponse, config)
   * // 结果：{
   * //   data: { id: 1, name: 'John' },
   * //   status: 200,
   * //   statusText: 'OK',
   * //   headers: { 'content-type': 'application/json' },
   * //   config: { url: '...' }
   * // }
   * ```
   */
  private convertFromAxiosResponse<T>(
    axiosResponse: any,
    config: RequestConfig,
  ): ResponseData<T> {
    // 创建简化的config对象，只包含必要的字段
    // 避免携带过多数据，减少内存占用
    const simplifiedConfig = {
      url: config.url,
    }

    // 使用基类的 processResponse 方法进行标准化
    return this.processResponse<T>(
      axiosResponse.data,
      axiosResponse.status,
      axiosResponse.statusText,
      axiosResponse.headers || {},
      simplifiedConfig,
    )
  }

  /**
   * 处理 Axios 错误
   *
   * Axios 的错误对象有特殊的结构，需要根据不同情况进行处理。
   *
   * Axios 错误分类：
   * 1. **error.response 存在**：
   *    - 服务器返回了错误响应（4xx、5xx）
   *    - 包含完整的响应数据
   *    - 属于 HTTP 错误
   *
   * 2. **error.request 存在但无 response**：
   *    - 请求已发送但未收到响应
   *    - 通常是网络错误或服务器无响应
   *    - 属于网络错误
   *
   * 3. **两者都不存在**：
   *    - 请求配置错误或其他异常
   *    - 属于未知错误
   *
   * @param error - Axios 抛出的错误对象
   * @param config - 原始请求配置
   * @returns Error - 标准化的 HttpError
   *
   * @private
   *
   * @example HTTP错误（4xx、5xx）
   * ```typescript
   * // Axios错误：{ response: { status: 404, data: {...} } }
   * const httpError = this.handleAxiosError(axiosError, config)
   * // 结果：HttpError with status=404, response={...}
   * ```
   *
   * @example 网络错误
   * ```typescript
   * // Axios错误：{ request: {...}, response: undefined }
   * const networkError = this.handleAxiosError(axiosError, config)
   * // 结果：HttpError with isNetworkError=true
   * ```
   *
   * @example 配置错误
   * ```typescript
   * // Axios错误：{ message: 'Invalid URL' }
   * const configError = this.handleAxiosError(axiosError, config)
   * // 结果：HttpError with message='Invalid URL'
   * ```
   */
  private handleAxiosError(error: any, config: RequestConfig): Error {
    if (error.response) {
      // 情况1：服务器响应了错误状态码（4xx、5xx）
      // 包含完整的响应数据
      const response = this.convertFromAxiosResponse(error.response, config)
      const status = error.response.status
      const message = `Request failed with status code ${status}`
      const httpError = this.processError(new Error(message), config, response)
      httpError.status = status
      httpError.response = response
      return httpError
    }
    else if (error.request) {
      // 情况2：请求已发送但没有收到响应
      // 通常是网络错误或超时
      const httpError = this.processError(error, config)
      httpError.isNetworkError = true
      return httpError
    }
    else {
      // 情况3：请求配置错误或其他异常
      // 在请求发送之前就发生了错误
      return this.processError(error, config)
    }
  }
}
