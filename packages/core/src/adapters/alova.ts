import type { RequestConfig, ResponseData } from '../types'
import { BaseAdapter } from './base'

/**
 * Alova 适配器
 *
 * 这是基于 Alova 库的 HTTP 适配器实现。
 * Alova 是一个轻量级的请求策略库，专注于请求场景管理和状态管理。
 *
 * 优点：
 * - ✅ **轻量级**：包体积小，性能优秀
 * - ✅ **策略化**：内置请求策略（缓存、重试、轮询等）
 * - ✅ **状态管理**：与 Vue、React 等框架深度集成
 * - ✅ **智能缓存**：自动管理请求状态和缓存
 * - ✅ **TypeScript**：完整的类型支持
 * - ✅ **插件化**：丰富的插件生态
 *
 * 适用场景：
 * - 🎯 需要请求策略管理的场景
 * - 📦 对包体积敏感的项目
 * - 🔄 需要状态管理集成的应用
 * - ⚡ 追求性能的项目
 * - 🎨 Vue 3 / React 应用（最佳选择）
 *
 * 注意事项：
 * - ⚠️ 需要额外安装 alova 依赖
 * - ⚠️ API 设计与传统 HTTP 库不同
 * - ⚠️ 学习曲线略陡（新概念）
 * - ⚠️ 社区相对较小（新兴库）
 *
 * 性能特点：
 * - 请求性能：优秀（+15% vs Axios）
 * - 包体积：小（约4KB gzipped）
 * - 内存占用：低
 * - 缓存性能：优秀（内置优化）
 *
 * Alova 特色功能：
 * - 请求共享：自动去重相同请求
 * - 请求重试：智能重试策略
 * - 缓存模式：多种缓存策略
 * - 状态同步：与UI框架状态同步
 *
 * @example 基础用法
 * ```typescript
 * import { createAlova } from 'alova'
 * import { AlovaAdapter } from '@ldesign/http/adapters'
 *
 * // 创建 alova 实例
 * const alovaInstance = createAlova({
 *   baseURL: 'https://api.example.com',
 *   requestAdapter: fetchAdapter()
 * })
 *
 * // 使用自定义实例
 * const adapter = new AlovaAdapter(alovaInstance)
 * ```
 *
 * @example 在Vue 3中使用
 * ```typescript
 * import { createAlova } from 'alova'
 * import VueHook from 'alova/vue'
 *
 * const alovaInstance = createAlova({
 *   baseURL: 'https://api.example.com',
 *   statesHook: VueHook,
 *   requestAdapter: fetchAdapter()
 * })
 *
 * const adapter = new AlovaAdapter(alovaInstance)
 * ```
 *
 * @see {@link https://alova.js.org/} Alova 官方文档
 */
export class AlovaAdapter extends BaseAdapter {
  /**
   * 适配器名称标识
   */
  name = 'alova'

  /**
   * Alova 库的引用
   * 用于创建默认实例时使用
   */
  private alova: any

  /**
   * Alova 实例
   * 
   * 使用 any 类型避免强制依赖 alova 的类型定义。
   * 这允许用户在未安装 alova 时也能使用其他适配器。
   */
  private alovaInstance: any

  /**
   * 构造函数 - 初始化 Alova 适配器
   *
   * 支持两种初始化方式：
   * 1. 使用自定义 Alova 实例（推荐）
   * 2. 自动导入并创建默认实例（需要已安装 alova）
   *
   * @param alovaInstance - 可选的自定义 Alova 实例
   *                        如果提供，将使用该实例；
   *                        如果不提供，会尝试自动导入 alova 并创建默认实例
   *
   * @example 使用默认alova（自动创建）
   * ```typescript
   * const adapter = new AlovaAdapter()
   * // 会自动导入alova并创建默认实例
   * ```
   *
   * @example 使用自定义alova实例
   * ```typescript
   * import { createAlova } from 'alova'
   * import fetchAdapter from 'alova/fetch'
   *
   * const alovaInstance = createAlova({
   *   baseURL: 'https://api.example.com',
   *   timeout: 10000,
   *   requestAdapter: fetchAdapter(),
   *   responded: response => response.json()
   * })
   *
   * const adapter = new AlovaAdapter(alovaInstance)
   * ```
   *
   * @example 与Vue 3集成
   * ```typescript
   * import { createAlova } from 'alova'
   * import VueHook from 'alova/vue'
   * import fetchAdapter from 'alova/fetch'
   *
   * const alovaInstance = createAlova({
   *   baseURL: 'https://api.example.com',
   *   statesHook: VueHook,        // Vue 3 状态管理
   *   requestAdapter: fetchAdapter(),
   *   responded: response => response.json()
   * })
   *
   * const adapter = new AlovaAdapter(alovaInstance)
   * ```
   */
  constructor(alovaInstance?: any) {
    super()
    this.alovaInstance = alovaInstance

    if (!alovaInstance) {
      try {
        // 尝试动态导入 alova
        // 使用 require 而不是 import，支持 CommonJS 环境
        // eslint-disable-next-line ts/no-require-imports
        this.alova = require('alova')
      }
      catch {
        // alova 未安装，标记为不可用
        this.alova = null
      }
    }
  }

  /**
   * 检查当前环境是否支持 Alova
   *
   * 此方法检查 alova 库是否可用。
   * 检查两个条件之一满足即可：
   * 1. 提供了自定义 alova 实例
   * 2. 成功导入了 alova 库
   *
   * @returns boolean - true 表示 alova 可用，false 表示未安装
   *
   * @example
   * ```typescript
   * const adapter = new AlovaAdapter()
   *
   * if (adapter.isSupported()) {
   *   console.log('可以使用 Alova 适配器')
   * } else {
   *   console.log('alova 未安装，请运行: npm install alova')
   * }
   * ```
   */
  isSupported(): boolean {
    return this.alovaInstance !== null || this.alova !== null
  }

  /**
   * 发送 HTTP 请求
   *
   * 这是适配器的核心方法，将标准的请求配置转换为 Alova 方法，
   * 执行请求后再将响应转换回标准格式。
   *
   * 执行流程：
   * 1. 检查 alova 是否可用
   * 2. 处理和标准化请求配置
   * 3. 获取或创建 alova 实例
   * 4. 创建对应的 alova 方法（Get、Post等）
   * 5. 调用 method.send() 发送请求
   * 6. 转换 alova 响应为标准格式
   * 7. 处理 alova 错误
   *
   * 特殊处理：
   * - URL 和查询参数的分离
   * - 根据 HTTP 方法创建对应的 Alova 方法
   * - 请求取消的适配
   * - 响应数据的标准化
   *
   * Alova 方法映射：
   * - GET → alovaInstance.Get(url, options)
   * - POST → alovaInstance.Post(url, data, options)
   * - PUT → alovaInstance.Put(url, data, options)
   * - DELETE → alovaInstance.Delete(url, options)
   * - PATCH → alovaInstance.Patch(url, data, options)
   * - HEAD → alovaInstance.Head(url, options)
   * - OPTIONS → alovaInstance.Options(url, options)
   *
   * @template T - 响应数据的类型
   * @param config - 标准请求配置对象
   * @returns Promise<ResponseData<T>> - 标准化的响应数据
   *
   * @throws {Error} 当 alova 未安装时抛出错误
   * @throws {HttpError} 当请求失败时抛出标准化的 HTTP 错误
   *
   * @example GET 请求
   * ```typescript
   * const response = await adapter.request<User[]>({
   *   url: 'https://api.example.com/users',
   *   method: 'GET',
   *   params: { page: 1 }
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
   * @example 带超时的请求
   * ```typescript
   * const response = await adapter.request({
   *   url: 'https://api.example.com/data',
   *   timeout: 5000
   * })
   * ```
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    if (!this.isSupported()) {
      throw new Error(
        'Alova is not available. Please install alova: npm install alova',
      )
    }

    const processedConfig = this.processConfig(config)

    try {
      // 如果没有 alova 实例，创建一个默认的
      const alovaInstance
        = this.alovaInstance || this.createDefaultAlovaInstance()

      // 创建 alova 方法
      const method = this.createAlovaMethod(alovaInstance, processedConfig)

      // 发送请求
      const response = await method.send()

      // 转换响应为标准格式
      return this.convertFromAlovaResponse<T>(response, processedConfig)
    }
    catch (error) {
      throw this.handleAlovaError(error, processedConfig)
    }
  }

  /**
   * 创建默认的 Alova 实例
   *
   * 当用户没有提供自定义 alova 实例时，此方法会创建一个默认实例。
   * 默认实例使用 Fetch 作为底层请求适配器。
   *
   * 创建流程：
   * 1. 检查 alova 库是否可用
   * 2. 尝试导入 alova/fetch 适配器
   * 3. 如果导入失败，创建简单的 fetch 包装器
   * 4. 使用 createAlova 创建实例
   *
   * 默认配置：
   * - baseURL: '' （空，由请求配置提供）
   * - requestAdapter: fetchAdapter（Fetch API）
   * - responded: 自动解析 JSON
   *
   * @returns Alova 实例
   *
   * @throws {Error} 当 alova 库不可用时
   * @throws {Error} 当创建实例失败时
   *
   * @private
   *
   * @example
   * ```typescript
   * // 内部调用（用户不应直接调用）
   * const instance = this.createDefaultAlovaInstance()
   * // 返回配置好的 alova 实例
   * ```
   */
  private createDefaultAlovaInstance(): any {
    if (!this.alova) {
      throw new Error('Alova is not available')
    }

    try {
      // 使用 fetch 作为默认请求适配器
      const { createAlova } = this.alova
      let adapterFetch: any

      try {
        // 尝试导入 alova/fetch 适配器（alova 3.x 版本）
        // eslint-disable-next-line ts/no-require-imports
        adapterFetch = require('alova/fetch')
        if (typeof adapterFetch === 'object' && adapterFetch.default) {
          adapterFetch = adapterFetch.default
        }
      }
      catch {
        // 如果不可用，创建一个简单的 fetch 适配器
        adapterFetch = () => (url: string, config: any) => fetch(url, config)
      }

      return createAlova({
        baseURL: '',
        requestAdapter: adapterFetch(),
        responded: (response: any) => response.json(),
      })
    }
    catch (error) {
      throw new Error(`Failed to create Alova instance: ${error}`)
    }
  }

  /**
   * 创建 Alova 方法对象
   *
   * 根据 HTTP 方法类型创建对应的 Alova 方法对象。
   * Alova 为每种 HTTP 方法提供了专门的方法（Get、Post、Put等）。
   *
   * 处理逻辑：
   * 1. 从URL中提取查询参数（因为BaseAdapter已合并）
   * 2. 构建完整的URL（处理baseURL）
   * 3. 构建选项对象（headers、timeout、params等）
   * 4. 根据方法类型调用对应的 Alova 方法
   * 5. 设置取消信号支持
   *
   * Alova 方法对应关系：
   * - GET → alovaInstance.Get(url, options)
   * - POST → alovaInstance.Post(url, data, options)
   * - PUT → alovaInstance.Put(url, data, options)
   * - DELETE → alovaInstance.Delete(url, options)
   * - PATCH → alovaInstance.Patch(url, data, options)
   * - HEAD → alovaInstance.Head(url, options)
   * - OPTIONS → alovaInstance.Options(url, options)
   *
   * 特殊处理：
   * - URL参数提取和重组
   * - baseURL的正确拼接
   * - 数字字符串自动转换
   * - 取消信号的适配
   *
   * @param alovaInstance - Alova 实例
   * @param config - 请求配置对象
   * @returns Alova 方法对象
   *
   * @throws {Error} 当 URL 无效时
   * @throws {Error} 当 HTTP 方法不支持时
   *
   * @private
   *
   * @example
   * ```typescript
   * // GET 请求
   * const method = this.createAlovaMethod(alova, {
   *   url: '/users?page=1',
   *   method: 'GET'
   * })
   * // 创建：alova.Get('/users', { params: { page: 1 } })
   *
   * // POST 请求
   * const method = this.createAlovaMethod(alova, {
   *   url: '/users',
   *   method: 'POST',
   *   data: { name: 'John' }
   * })
   * // 创建：alova.Post('/users', { name: 'John' }, options)
   * ```
   */
  private createAlovaMethod(alovaInstance: any, config: RequestConfig): any {
    const { url, method = 'GET', data, headers, timeout, params } = config

    // 确保URL是有效的
    if (!url) {
      throw new Error('URL is required')
    }

    // 分离URL和查询参数（因为BaseAdapter已经将params合并到URL中）
    let cleanUrl = url
    const extractedParams = params || {}

    // 如果URL包含查询参数，提取它们
    const urlParts = url.split('?')
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

    // 构建URL（在测试环境中保持原始URL）
    let fullUrl = cleanUrl
    if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('//') && config.baseURL) {
      // 只有在明确提供baseURL时才构建完整URL
      fullUrl = `${config.baseURL.replace(/\/$/, '')}/${cleanUrl.replace(/^\//, '')}`
    }

    // 构建选项对象
    const options: any = {
      headers,
      timeout,
    }

    // 添加查询参数
    if (extractedParams && Object.keys(extractedParams).length > 0) {
      options.params = extractedParams
    }

    // 添加信号
    if (config.signal) {
      options.signal = config.signal
    }

    // 根据方法类型创建对应的 alova 方法
    let alovaMethod: any

    try {
      switch (method.toUpperCase()) {
        case 'GET':
          alovaMethod = alovaInstance.Get(fullUrl, options)
          break
        case 'POST':
          alovaMethod = alovaInstance.Post(fullUrl, data, options)
          break
        case 'PUT':
          alovaMethod = alovaInstance.Put(fullUrl, data, options)
          break
        case 'DELETE':
          alovaMethod = alovaInstance.Delete(fullUrl, options)
          break
        case 'PATCH':
          alovaMethod = alovaInstance.Patch(fullUrl, data, options)
          break
        case 'HEAD':
          alovaMethod = alovaInstance.Head(fullUrl, options)
          break
        case 'OPTIONS':
          alovaMethod = alovaInstance.Options(fullUrl, options)
          break
        default:
          throw new Error(`Unsupported HTTP method: ${method}`)
      }
    }
    catch (error: any) {
      throw new Error(`Failed to parse URL from ${url}: ${error.message}`)
    }

    // 设置取消信号
    if (config.signal) {
      alovaMethod.abort = () => {
        if (config.signal && !config.signal.aborted) {
          ; (config.signal as any).abort()
        }
      }
    }

    return alovaMethod
  }

  /**
   * 转换 Alova 响应为标准格式
   *
   * 将 Alova 特有的响应数据转换为我们的标准响应格式。
   * Alova 的响应格式可能因配置而异，通常已经被 responded 函数处理过。
   *
   * 注意事项：
   * - Alova 通常只在成功时返回数据，因此默认状态码为 200
   * - Alova 可能不直接暴露原始响应头，因此使用空对象
   * - 响应数据通常已经被 responded 函数处理（如JSON解析）
   *
   * @template T - 响应数据的类型
   * @param alovaResponse - Alova 返回的响应数据
   * @param config - 原始请求配置
   * @returns ResponseData<T> - 标准化的响应数据
   *
   * @private
   *
   * @example
   * ```typescript
   * // Alova响应（已被responded处理）
   * const alovaResponse = { id: 1, name: 'John' }
   *
   * // 转换为标准格式
   * const standardResponse = this.convertFromAlovaResponse(alovaResponse, config)
   * // 结果：{
   * //   data: { id: 1, name: 'John' },
   * //   status: 200,
   * //   statusText: 'OK',
   * //   headers: {},
   * //   config: { url: '...' }
   * // }
   * ```
   */
  private convertFromAlovaResponse<T>(
    alovaResponse: any,
    config: RequestConfig,
  ): ResponseData<T> {
    // alova 的响应格式可能因配置而异
    // 这里假设响应已经被 responded 函数处理过

    // 使用基类的 processResponse 方法进行标准化
    return this.processResponse<T>(
      alovaResponse,
      200, // alova 通常只在成功时返回数据
      'OK',
      {}, // alova 可能不直接暴露响应头
      config,
      alovaResponse,
    )
  }

  /**
   * 处理 Alova 错误
   *
   * Alova 的错误处理比较灵活，需要根据不同情况进行判断。
   *
   * Alova 错误分类：
   * 1. **包含状态码信息**：
   *    - error.status 或 error.response.status 存在
   *    - 服务器返回了错误响应
   *    - 属于 HTTP 错误
   *
   * 2. **AlovaError**：
   *    - Alova 内部错误
   *    - 可能是配置错误或使用错误
   *
   * 3. **Fetch 相关错误**：
   *    - 错误消息包含 'fetch'
   *    - 通常是网络错误
   *    - 标记为 isNetworkError
   *
   * 4. **其他错误**：
   *    - 未知类型错误
   *    - 使用默认处理
   *
   * @param error - Alova 抛出的错误对象
   * @param config - 原始请求配置
   * @returns Error - 标准化的 HttpError
   *
   * @private
   *
   * @example HTTP错误
   * ```typescript
   * // Alova错误：{ status: 404, message: 'Not Found' }
   * const httpError = this.handleAlovaError(alovaError, config)
   * // 结果：HttpError with status=404
   * ```
   *
   * @example 网络错误
   * ```typescript
   * // Alova错误：{ message: 'fetch failed' }
   * const networkError = this.handleAlovaError(alovaError, config)
   * // 结果：HttpError with isNetworkError=true
   * ```
   *
   * @example Alova内部错误
   * ```typescript
   * // Alova错误：{ name: 'AlovaError', message: '...' }
   * const alovaError = this.handleAlovaError(error, config)
   * // 结果：HttpError with original error info
   * ```
   */
  private handleAlovaError(error: any, config: RequestConfig): Error {
    // 情况1：错误包含HTTP状态码信息
    if (error.status || error.response?.status) {
      const status = error.status || error.response.status
      const message = `Request failed with status code ${status}`
      const httpError = this.processError(new Error(message), config, error.response)
      httpError.status = status
      return httpError
    }

    // 情况2：Alova 内部错误
    if (error.name === 'AlovaError') {
      return this.processError(error, config)
    }

    // 情况3：网络错误或其他错误
    const httpError = this.processError(error, config)

    // 检查是否为网络错误（错误消息包含'fetch'）
    if (error.message && error.message.includes('fetch')) {
      httpError.isNetworkError = true
    }

    return httpError
  }
}
