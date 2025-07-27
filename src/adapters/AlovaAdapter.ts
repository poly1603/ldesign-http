/**
 * Alova适配器
 * 基于Alova库实现HTTP请求
 */

import { type Alova, type AlovaOptions, createAlova } from 'alova'
import type {
  HttpAdapter,
  HttpError,
  HttpMethod,
  HttpResponse,
  RequestConfig,
} from '../types'

export class AlovaAdapter implements HttpAdapter {
  private alovaInstance: Alova<any, any, any, any, any>
  private cancelTokens: Map<string, () => void> = new Map()

  constructor(alovaConfig?: AlovaOptions<any, any, any, any, any>) {
    this.alovaInstance = createAlova({
      baseURL: '',
      timeout: 10000,
      ...alovaConfig,
    })
  }

  /**
   * 发送请求
   */
  async request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    try {
      const methodInstance = this.createMethodInstance<T>(config)
      const response = await methodInstance.send()
      return this.transformResponse<T>(response, config)
    }
 catch (error: any) {
      throw this.transformError(error, config)
    }
  }

  /**
   * 取消请求
   */
  cancel(requestId?: string): void {
    if (requestId) {
      const cancelFn = this.cancelTokens.get(requestId)
      if (cancelFn) {
        cancelFn()
        this.cancelTokens.delete(requestId)
      }
    }
 else {
      // 取消所有请求
      this.cancelTokens.forEach(cancelFn => cancelFn())
      this.cancelTokens.clear()
    }
  }

  /**
   * 获取适配器名称
   */
  getName(): string {
    return 'alova'
  }

  /**
   * 获取Alova实例
   */
  getAlovaInstance(): Alova<any, any, any, any, any> {
    return this.alovaInstance
  }

  /**
   * 创建方法实例
   */
  private createMethodInstance<T>(config: RequestConfig) {
    const url = this.buildURL(config)
    const method = config.method || HttpMethod.GET

    let methodInstance: any

    switch (method.toUpperCase()) {
      case HttpMethod.GET:
        methodInstance = this.alovaInstance.Get<T>(url, {
          params: config.params,
          headers: config.headers,
          timeout: config.timeout,
          ...this.extractAlovaConfig(config),
        })
        break
      case HttpMethod.POST:
        methodInstance = this.alovaInstance.Post<T>(url, config.data, {
          params: config.params,
          headers: config.headers,
          timeout: config.timeout,
          ...this.extractAlovaConfig(config),
        })
        break
      case HttpMethod.PUT:
        methodInstance = this.alovaInstance.Put<T>(url, config.data, {
          params: config.params,
          headers: config.headers,
          timeout: config.timeout,
          ...this.extractAlovaConfig(config),
        })
        break
      case HttpMethod.DELETE:
        methodInstance = this.alovaInstance.Delete<T>(url, {
          params: config.params,
          headers: config.headers,
          timeout: config.timeout,
          ...this.extractAlovaConfig(config),
        })
        break
      case HttpMethod.PATCH:
        methodInstance = this.alovaInstance.Patch<T>(url, config.data, {
          params: config.params,
          headers: config.headers,
          timeout: config.timeout,
          ...this.extractAlovaConfig(config),
        })
        break
      case HttpMethod.HEAD:
        methodInstance = this.alovaInstance.Head<T>(url, {
          params: config.params,
          headers: config.headers,
          timeout: config.timeout,
          ...this.extractAlovaConfig(config),
        })
        break
      case HttpMethod.OPTIONS:
        methodInstance = this.alovaInstance.Options<T>(url, {
          params: config.params,
          headers: config.headers,
          timeout: config.timeout,
          ...this.extractAlovaConfig(config),
        })
        break
      default:
        throw new Error(`Unsupported HTTP method: ${method}`)
    }

    // 设置取消令牌
    const requestId = this.generateRequestId()
    this.cancelTokens.set(requestId, () => {
      if (methodInstance && typeof methodInstance.abort === 'function') {
        methodInstance.abort()
      }
    })

    return methodInstance
  }

  /**
   * 构建完整URL
   */
  private buildURL(config: RequestConfig): string {
    let url = config.url

    // 如果配置了baseURL且当前URL不是绝对URL，则组合URL
    if (config.baseURL && !this.isAbsoluteURL(url)) {
      url = this.combineURLs(config.baseURL, url)
    }

    return url
  }

  /**
   * 提取Alova特定配置
   */
  private extractAlovaConfig(config: RequestConfig): any {
    const alovaConfig: any = {}

    // 处理响应类型
    if (config.responseType) {
      alovaConfig.responseType = config.responseType
    }

    // 处理凭证
    if (config.withCredentials !== undefined) {
      alovaConfig.withCredentials = config.withCredentials
    }

    // 处理进度回调
    if (config.onUploadProgress) {
      alovaConfig.onUpload = (progress: any) => {
        const progressData = {
          loaded: progress.loaded,
          total: progress.total || 0,
          percentage: progress.total ? Math.round((progress.loaded * 100) / progress.total) : 0,
        }
        config.onUploadProgress!(progressData)
      }
    }

    if (config.onDownloadProgress) {
      alovaConfig.onDownload = (progress: any) => {
        const progressData = {
          loaded: progress.loaded,
          total: progress.total || 0,
          percentage: progress.total ? Math.round((progress.loaded * 100) / progress.total) : 0,
        }
        config.onDownloadProgress!(progressData)
      }
    }

    // 复制其他自定义配置
    Object.keys(config).forEach((key) => {
      if (!['url', 'method', 'headers', 'params', 'data', 'timeout', 'baseURL', 'responseType', 'withCredentials', 'onUploadProgress', 'onDownloadProgress'].includes(key)) {
        alovaConfig[key] = (config as any)[key]
      }
    })

    return alovaConfig
  }

  /**
   * 转换响应
   */
  private transformResponse<T>(response: any, config: RequestConfig): HttpResponse<T> {
    // Alova的响应格式可能因适配器而异，这里提供通用转换
    const httpResponse: HttpResponse<T> = {
      data: response.data || response,
      status: response.status || 200,
      statusText: response.statusText || 'OK',
      headers: this.transformResponseHeaders(response.headers || {}),
      config,
      raw: response,
    }

    return httpResponse
  }

  /**
   * 转换响应头
   */
  private transformResponseHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {}

    if (headers) {
      if (typeof headers.forEach === 'function') {
        // Headers对象
        headers.forEach((value: string, key: string) => {
          result[key.toLowerCase()] = value
        })
      }
 else if (typeof headers === 'object') {
        // 普通对象
        Object.keys(headers).forEach((key) => {
          result[key.toLowerCase()] = String(headers[key])
        })
      }
    }

    return result
  }

  /**
   * 转换错误
   */
  private transformError(error: any, config: RequestConfig): HttpError {
    const httpError = new Error(error.message || 'Request failed') as HttpError
    httpError.config = config
    httpError.code = error.code

    // 检查错误类型
    if (error.name === 'AbortError' || error.code === 'ABORT_ERR') {
      httpError.isCancelError = true
      httpError.code = 'CANCELLED'
      httpError.message = 'Request was cancelled'
    }
 else if (error.response) {
      // 服务器响应了错误状态码
      httpError.response = this.transformResponse(error.response, config)
      httpError.code = `HTTP_${error.response.status}`
    }
 else if (error.request || error.name === 'NetworkError') {
      // 网络错误
      httpError.isNetworkError = true
      httpError.code = 'NETWORK_ERROR'
      httpError.message = 'Network error occurred'
    }
 else if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      // 超时错误
      httpError.isTimeoutError = true
      httpError.code = 'TIMEOUT'
      httpError.message = 'Request timeout'
    }

    return httpError
  }

  /**
   * 检查是否为绝对URL
   */
  private isAbsoluteURL(url: string): boolean {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url)
  }

  /**
   * 组合URL
   */
  private combineURLs(baseURL: string, relativeURL: string): string {
    return relativeURL
      ? `${baseURL.replace(/\/+$/, '')}/${relativeURL.replace(/^\/+/, '')}`
      : baseURL
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `alova_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 创建Alova适配器实例
 */
export function createAlovaAdapter(config?: AlovaOptions<any, any, any, any, any>): AlovaAdapter {
  return new AlovaAdapter(config)
}

/**
 * 检查是否支持Alova
 */
export function isAlovaSupported(): boolean {
  try {
    return typeof createAlova !== 'undefined'
  }
 catch {
    return false
  }
}
