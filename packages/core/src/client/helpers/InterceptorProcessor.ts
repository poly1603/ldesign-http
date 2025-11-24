import type {
  ErrorInterceptor,
  HttpError,
  InterceptorManager,
  RequestConfig,
  RequestInterceptor,
  ResponseData,
  ResponseInterceptor,
} from '../../types'
import type { InterceptorManagerImpl } from '../../interceptors/manager'

/**
 * 拦截器处理器
 *
 * 负责执行请求、响应和错误拦截器链。
 *
 * 性能优化：
 * - 区分同步和异步拦截器，减少不必要的 await
 * - 同步拦截器先执行，性能更好
 *
 * @example
 * ```typescript
 * const processor = new InterceptorProcessor(interceptors)
 * const config = await processor.processRequest(requestConfig)
 * ```
 */
export class InterceptorProcessor {
  /**
   * @param interceptors - 拦截器管理器集合
   */
  constructor(
    private interceptors: {
      request: InterceptorManager<RequestInterceptor>
      response: InterceptorManager<ResponseInterceptor>
      error: InterceptorManager<ErrorInterceptor>
    },
  ) { }

  /**
   * 检查是否有任何拦截器
   *
   * @returns 如果有任何拦截器返回 true
   */
  hasInterceptors(): boolean {
    // 获取各类型拦截器的数组
    const requestInterceptors = (
      this.interceptors.request as InterceptorManagerImpl<RequestInterceptor>
    ).getInterceptors()
    const responseInterceptors = (
      this.interceptors.response as InterceptorManagerImpl<ResponseInterceptor>
    ).getInterceptors()
    const errorInterceptors = (
      this.interceptors.error as InterceptorManagerImpl<ErrorInterceptor>
    ).getInterceptors()

    // 只要有任何一种拦截器，就返回 true
    return (
      requestInterceptors.length > 0
      || responseInterceptors.length > 0
      || errorInterceptors.length > 0
    )
  }

  /**
   * 处理请求拦截器（优化版 - 区分同步/异步）
   *
   * 性能优化：
   * 1. 先执行同步拦截器（无需 await）
   * 2. 再执行异步拦截器
   * 3. 减少不必要的 Promise 开销
   *
   * @param config - 请求配置
   * @returns 处理后的请求配置
   */
  async processRequest(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config

    const manager = this.interceptors.request as InterceptorManagerImpl<RequestInterceptor>

    // 先执行同步拦截器（无需 await，更快）
    const syncInterceptors = manager.getSyncInterceptors()
    for (const interceptor of syncInterceptors) {
      try {
        // 同步执行，不使用 await
        processedConfig = interceptor.fulfilled(processedConfig) as RequestConfig
      }
      catch (error) {
        if (interceptor.rejected) {
          throw await interceptor.rejected(error as HttpError)
        }
        throw error
      }
    }

    // 再执行异步拦截器
    const asyncInterceptors = manager.getAsyncInterceptors()
    for (const interceptor of asyncInterceptors) {
      try {
        processedConfig = await interceptor.fulfilled(processedConfig)
      }
      catch (error) {
        if (interceptor.rejected) {
          throw await interceptor.rejected(error as HttpError)
        }
        throw error
      }
    }

    return processedConfig
  }

  /**
   * 处理响应拦截器（优化版 - 区分同步/异步）
   *
   * @param response - 响应数据
   * @returns 处理后的响应数据
   */
  async processResponse<T>(response: ResponseData<T>): Promise<ResponseData<T>> {
    let processedResponse = response as ResponseData<unknown>

    const manager = this.interceptors.response as InterceptorManagerImpl<ResponseInterceptor>

    // 先执行同步拦截器
    const syncInterceptors = manager.getSyncInterceptors()
    for (const interceptor of syncInterceptors) {
      try {
        processedResponse = interceptor.fulfilled(processedResponse) as ResponseData<unknown>
      }
      catch (error) {
        if (interceptor.rejected) {
          throw await interceptor.rejected(error as HttpError)
        }
        throw error
      }
    }

    // 再执行异步拦截器
    const asyncInterceptors = manager.getAsyncInterceptors()
    for (const interceptor of asyncInterceptors) {
      try {
        processedResponse = await interceptor.fulfilled(processedResponse)
      }
      catch (error) {
        if (interceptor.rejected) {
          throw await interceptor.rejected(error as HttpError)
        }
        throw error
      }
    }

    return processedResponse as ResponseData<T>
  }

  /**
   * 处理错误拦截器（优化版 - 区分同步/异步）
   *
   * @param error - HTTP 错误
   * @returns 处理后的错误
   */
  async processError(error: HttpError): Promise<HttpError> {
    let processedError = error

    const manager = this.interceptors.error as InterceptorManagerImpl<ErrorInterceptor>

    // 先执行同步拦截器
    const syncInterceptors = manager.getSyncInterceptors()
    for (const interceptor of syncInterceptors) {
      try {
        processedError = interceptor.fulfilled(processedError) as HttpError
      }
      catch (err) {
        processedError = err as HttpError
      }
    }

    // 再执行异步拦截器
    const asyncInterceptors = manager.getAsyncInterceptors()
    for (const interceptor of asyncInterceptors) {
      try {
        processedError = await interceptor.fulfilled(processedError)
      }
      catch (err) {
        processedError = err as HttpError
      }
    }

    return processedError
  }
}
