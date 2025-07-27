/**
 * HTTP客户端抽象基类
 * 提供统一的接口和通用功能实现
 */

import type {
  CancelToken,
  EventListener,
  EventType,
  ExtendedRequestConfig,
  HttpAdapter,
  HttpClientConfig,
  HttpClientInstance,
  HttpError,
  HttpResponse,
  Middleware,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from '../types'
import { HttpMethod } from '../types'

export abstract class BaseHttpClient implements HttpClientInstance {
  protected config: HttpClientConfig
  protected adapter: HttpAdapter
  protected requestInterceptors: Map<number, RequestInterceptor> = new Map()
  protected responseInterceptors: Map<number, ResponseInterceptor> = new Map()
  protected middlewares: Middleware[] = []
  protected eventListeners: Map<EventType, EventListener[]> = new Map()
  private interceptorId = 0

  constructor(config: HttpClientConfig = {}) {
    this.config = this.mergeConfig(this.getDefaultConfig(), config)
    this.adapter = this.createAdapter()
    this.initializeEventListeners()
  }

  /**
   * 获取默认配置
   */
  protected getDefaultConfig(): HttpClientConfig {
    return {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'json',
      withCredentials: false,
      adapter: 'fetch',
      interceptors: {
        request: [],
        response: [],
      },
      cache: {
        enabled: false,
        ttl: 5 * 60 * 1000, // 5分钟
      },
      retry: {
        retries: 0,
        retryDelay: 1000,
        retryCondition: (error: HttpError) => {
          return !error.response || (error.response.status >= 500 && error.response.status < 600)
        },
      },
    }
  }

  /**
   * 创建适配器实例
   */
  protected abstract createAdapter(): HttpAdapter

  /**
   * 初始化事件监听器
   */
  protected initializeEventListeners(): void {
    const eventTypes: EventType[] = ['request', 'response', 'error', 'retry', 'cache-hit', 'cache-miss']
    eventTypes.forEach((type) => {
      this.eventListeners.set(type, [])
    })
  }

  /**
   * 合并配置
   */
  protected mergeConfig(defaultConfig: HttpClientConfig, userConfig: HttpClientConfig): HttpClientConfig {
    return {
      ...defaultConfig,
      ...userConfig,
      headers: {
        ...defaultConfig.headers,
        ...userConfig.headers,
      },
      interceptors: {
        request: [
          ...(defaultConfig.interceptors?.request || []),
          ...(userConfig.interceptors?.request || []),
        ],
        response: [
          ...(defaultConfig.interceptors?.response || []),
          ...(userConfig.interceptors?.response || []),
        ],
      },
      cache: {
        ...defaultConfig.cache,
        ...userConfig.cache,
      },
      retry: {
        ...defaultConfig.retry,
        ...userConfig.retry,
      },
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.GET,
    })
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.POST,
      data,
    })
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.PUT,
      data,
    })
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.DELETE,
    })
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.PATCH,
      data,
    })
  }

  /**
   * HEAD请求
   */
  async head<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.HEAD,
    })
  }

  /**
   * OPTIONS请求
   */
  async options<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: HttpMethod.OPTIONS,
    })
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(config: ExtendedRequestConfig): Promise<HttpResponse<T>> {
    try {
      // 合并配置
      const mergedConfig = this.mergeRequestConfig(config)

      // 触发请求事件
      this.emit('request', { config: mergedConfig })

      // 执行请求拦截器
      const processedConfig = await this.executeRequestInterceptors(mergedConfig)

      // 检查缓存
      const cachedResponse = await this.checkCache<T>(processedConfig)
      if (cachedResponse) {
        this.emit('cache-hit', { config: processedConfig, response: cachedResponse })
        return cachedResponse
      }

      this.emit('cache-miss', { config: processedConfig })

      // 发送请求（带重试机制）
      const response = await this.requestWithRetry<T>(processedConfig)

      // 执行响应拦截器
      const processedResponse = await this.executeResponseInterceptors(response)

      // 缓存响应
      await this.cacheResponse(processedConfig, processedResponse)

      // 触发响应事件
      this.emit('response', { config: processedConfig, response: processedResponse })

      return processedResponse
    }
 catch (error) {
      const httpError = this.createHttpError(error, config)
      this.emit('error', { config, error: httpError })
      throw httpError
    }
  }

  /**
   * 合并请求配置
   */
  protected mergeRequestConfig(config: ExtendedRequestConfig): ExtendedRequestConfig {
    return {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    }
  }

  /**
   * 执行请求拦截器
   */
  protected async executeRequestInterceptors(config: ExtendedRequestConfig): Promise<ExtendedRequestConfig> {
    let processedConfig = config

    for (const interceptor of this.requestInterceptors.values()) {
      if (interceptor.onFulfilled) {
        try {
          processedConfig = await interceptor.onFulfilled(processedConfig)
        }
 catch (error) {
          if (interceptor.onRejected) {
            processedConfig = await interceptor.onRejected(error)
          }
 else {
            throw error
          }
        }
      }
    }

    return processedConfig
  }

  /**
   * 执行响应拦截器
   */
  protected async executeResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let processedResponse = response

    for (const interceptor of this.responseInterceptors.values()) {
      if (interceptor.onFulfilled) {
        try {
          processedResponse = await interceptor.onFulfilled(processedResponse)
        }
 catch (error) {
          if (interceptor.onRejected) {
            throw await interceptor.onRejected(error)
          }
 else {
            throw error
          }
        }
      }
    }

    return processedResponse
  }

  /**
   * 带重试机制的请求
   */
  protected async requestWithRetry<T>(config: ExtendedRequestConfig, retryCount = 0): Promise<HttpResponse<T>> {
    try {
      return await this.adapter.request<T>(config)
    }
 catch (error) {
      const httpError = this.createHttpError(error, config)
      const retryConfig = this.config.retry!

      if (
        retryCount < retryConfig.retries!
        && retryConfig.retryCondition!(httpError)
      ) {
        this.emit('retry', { config, error: httpError, retryCount: retryCount + 1 })

        const delay = retryConfig.retryDelayCalculator
          ? retryConfig.retryDelayCalculator(retryCount + 1, httpError)
          : retryConfig.retryDelay! * 2 ** retryCount

        await this.delay(delay)
        return this.requestWithRetry<T>(config, retryCount + 1)
      }

      throw httpError
    }
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 检查缓存
   */
  protected async checkCache<T>(config: ExtendedRequestConfig): Promise<HttpResponse<T> | null> {
    if (!this.config.cache?.enabled || config.method !== HttpMethod.GET) {
      return null
    }

    // 这里应该实现具体的缓存逻辑
    // 暂时返回null，后续在缓存模块中实现
    return null
  }

  /**
   * 缓存响应
   */
  protected async cacheResponse<T>(config: ExtendedRequestConfig, response: HttpResponse<T>): Promise<void> {
    if (!this.config.cache?.enabled || config.method !== HttpMethod.GET) {

    }

    // 这里应该实现具体的缓存逻辑
    // 后续在缓存模块中实现
  }

  /**
   * 创建HTTP错误对象
   */
  protected createHttpError(error: any, config?: ExtendedRequestConfig): HttpError {
    const httpError = new Error(error.message || 'Request failed') as HttpError
    httpError.config = config
    httpError.code = error.code
    httpError.response = error.response
    httpError.isNetworkError = !error.response
    httpError.isTimeoutError = error.code === 'TIMEOUT'
    httpError.isCancelError = error.code === 'CANCELLED'
    return httpError
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: RequestInterceptor): number {
    const id = ++this.interceptorId
    this.requestInterceptors.set(id, interceptor)
    return id
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): number {
    const id = ++this.interceptorId
    this.responseInterceptors.set(id, interceptor)
    return id
  }

  /**
   * 移除拦截器
   */
  removeInterceptor(type: 'request' | 'response', id: number): void {
    if (type === 'request') {
      this.requestInterceptors.delete(id)
    }
 else {
      this.responseInterceptors.delete(id)
    }
  }

  /**
   * 创建取消令牌
   */
  createCancelToken(): CancelToken {
    let cancel: (reason?: string) => void
    let isCancelled = false
    let reason: string | undefined

    const promise = new Promise<string>((_, reject) => {
      cancel = (cancelReason?: string) => {
        if (!isCancelled) {
          isCancelled = true
          reason = cancelReason || 'Request cancelled'
          reject(new Error(reason))
        }
      }
    })

    return {
      reason,
      isCancelled,
      cancel: cancel!,
      promise,
    }
  }

  /**
   * 获取默认配置
   */
  getDefaults(): HttpClientConfig {
    return { ...this.config }
  }

  /**
   * 设置默认配置
   */
  setDefaults(config: Partial<HttpClientConfig>): void {
    this.config = this.mergeConfig(this.config, config as HttpClientConfig)
  }

  /**
   * 添加事件监听器
   */
  on(event: EventType, listener: EventListener): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件监听器
   */
  off(event: EventType, listener: EventListener): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 触发事件
   */
  emit(event: EventType, data: any): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((listener) => {
      try {
        listener(data)
      }
 catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }

  /**
   * 添加一次性事件监听器
   */
  once(event: EventType, listener: EventListener): void {
    const onceListener = (data: any) => {
      listener(data)
      this.off(event, onceListener)
    }
    this.on(event, onceListener)
  }
}
