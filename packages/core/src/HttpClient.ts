import type {
  CancelToken,
  CancelTokenSource,
  HttpClientConfig,
  RequestConfig,
  RequestInterceptor,
  ResponseData,
  ResponseInterceptor,
} from './types'
import { HttpError } from './types'
import { AxiosAdapter } from './adapters/AxiosAdapter'
import { CacheManager } from './cache/CacheManager'
import { RetryManager } from './retry/RetryManager'

/**
 * HTTP客户端
 */
export class HttpClient {
  private config: HttpClientConfig
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private cacheManager: CacheManager
  private retryManager: RetryManager

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: 30000,
      responseType: 'json',
      ...config,
    }

    // 初始化拦截器
    if (config.requestInterceptors) {
      this.requestInterceptors = config.requestInterceptors
    }
    if (config.responseInterceptors) {
      this.responseInterceptors = config.responseInterceptors
    }

    // 初始化缓存管理器
    this.cacheManager = new CacheManager(config.cache)

    // 初始化重试管理器
    this.retryManager = new RetryManager(config.retry)
  }

  /**
   * 添加请求拦截器
   */
  useRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor)
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor)
      if (index > -1) {
        this.requestInterceptors.splice(index, 1)
      }
    }
  }

  /**
   * 添加响应拦截器
   */
  useResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor)
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor)
      if (index > -1) {
        this.responseInterceptors.splice(index, 1)
      }
    }
  }

  /**
   * 发起请求
   */
  async request<T = any>(config: RequestConfig): Promise<ResponseData<T>> {
    // 合并配置
    const mergedConfig: RequestConfig = {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    }

    // 执行请求拦截器
    let processedConfig = mergedConfig
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onFulfilled) {
        try {
          processedConfig = await interceptor.onFulfilled(processedConfig)
        }
        catch (error) {
          if (interceptor.onRejected) {
            await interceptor.onRejected(error)
          }
          throw error
        }
      }
    }

    // 检查缓存
    if (processedConfig.cache?.enabled) {
      const cached = await this.cacheManager.get<T>(processedConfig)
      if (cached) {
        return cached
      }
    }

    // 使用适配器发送请求
    const adapter = processedConfig.adapter || AxiosAdapter
    let response: ResponseData<T>

    try {
      // 使用重试管理器执行请求
      response = await this.retryManager.execute(
        () => adapter(processedConfig),
        processedConfig.retry,
      )
    }
    catch (error: any) {
      // 执行响应拦截器的错误处理
      let processedError = error
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onRejected) {
          processedError = await interceptor.onRejected(processedError)
        }
      }
      throw processedError
    }

    // 执行响应拦截器
    let processedResponse = response
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onFulfilled) {
        try {
          processedResponse = await interceptor.onFulfilled(processedResponse)
        }
        catch (error) {
          if (interceptor.onRejected) {
            await interceptor.onRejected(error)
          }
          throw error
        }
      }
    }

    // 缓存响应
    if (processedConfig.cache?.enabled) {
      await this.cacheManager.set(processedConfig, processedResponse)
    }

    return processedResponse
  }

  /**
   * GET请求
   */
  get<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'GET' })
  }

  /**
   * POST请求
   */
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data })
  }

  /**
   * PUT请求
   */
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', data })
  }

  /**
   * DELETE请求
   */
  delete<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' })
  }

  /**
   * PATCH请求
   */
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', data })
  }

  /**
   * HEAD请求
   */
  head<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'HEAD' })
  }

  /**
   * OPTIONS请求
   */
  options<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'OPTIONS' })
  }

  /**
   * 创建取消令牌
   */
  static createCancelToken(): CancelTokenSource {
    let cancel: (message?: string) => void
    const promise = new Promise<{ message: string }>((resolve) => {
      cancel = (message = 'Request canceled') => {
        resolve({ message })
      }
    })

    const token: CancelToken = {
      promise,
      reason: undefined,
      throwIfRequested() {
        if (this.reason) {
          throw this.reason
        }
      },
    }

    return {
      token,
      cancel: (message?: string) => {
        token.reason = { message: message || 'Request canceled' }
        cancel!(message)
      },
    }
  }
}

/**
 * 创建HTTP客户端实例
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config)
}
