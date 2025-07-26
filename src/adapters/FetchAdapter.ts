/**
 * 原生Fetch适配器
 * 基于浏览器原生fetch API实现HTTP请求
 */

import type {
  HttpAdapter,
  RequestConfig,
  HttpResponse,
  HttpError,
  HttpMethod
} from '../types'

export class FetchAdapter implements HttpAdapter {
  private abortControllers: Map<string, AbortController> = new Map()

  /**
   * 发送请求
   */
  async request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    try {
      const url = this.buildURL(config)
      const fetchOptions = this.buildFetchOptions(config)
      
      // 创建AbortController用于取消请求
      const abortController = new AbortController()
      const requestId = this.generateRequestId()
      this.abortControllers.set(requestId, abortController)
      
      fetchOptions.signal = abortController.signal
      
      // 设置超时
      if (config.timeout) {
        setTimeout(() => {
          abortController.abort()
        }, config.timeout)
      }
      
      const response = await fetch(url, fetchOptions)
      
      // 清理AbortController
      this.abortControllers.delete(requestId)
      
      return await this.transformResponse<T>(response, config)
    } catch (error: any) {
      throw this.transformError(error, config)
    }
  }

  /**
   * 取消请求
   */
  cancel(requestId?: string): void {
    if (requestId) {
      const controller = this.abortControllers.get(requestId)
      if (controller) {
        controller.abort()
        this.abortControllers.delete(requestId)
      }
    } else {
      // 取消所有请求
      this.abortControllers.forEach(controller => controller.abort())
      this.abortControllers.clear()
    }
  }

  /**
   * 获取适配器名称
   */
  getName(): string {
    return 'fetch'
  }

  /**
   * 构建完整URL
   */
  private buildURL(config: RequestConfig): string {
    let url = config.url
    
    // 添加baseURL
    if (config.baseURL && !this.isAbsoluteURL(url)) {
      url = this.combineURLs(config.baseURL, url)
    }
    
    // 添加查询参数
    if (config.params && Object.keys(config.params).length > 0) {
      const separator = url.includes('?') ? '&' : '?'
      const queryString = this.buildQueryString(config.params)
      url = `${url}${separator}${queryString}`
    }
    
    return url
  }

  /**
   * 构建fetch选项
   */
  private buildFetchOptions(config: RequestConfig): RequestInit {
    const options: RequestInit = {
      method: config.method || HttpMethod.GET,
      headers: this.buildHeaders(config),
      credentials: config.withCredentials ? 'include' : 'same-origin'
    }
    
    // 添加请求体
    if (config.data && this.shouldHaveBody(config.method)) {
      options.body = this.transformRequestData(config.data, config.headers)
    }
    
    return options
  }

  /**
   * 构建请求头
   */
  private buildHeaders(config: RequestConfig): Headers {
    const headers = new Headers()
    
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          headers.set(key, String(value))
        }
      })
    }
    
    return headers
  }

  /**
   * 转换请求数据
   */
  private transformRequestData(data: any, headers?: Record<string, string>): BodyInit {
    if (data === null || data === undefined) {
      return ''
    }
    
    // 如果是FormData、Blob、ArrayBuffer等，直接返回
    if (
      data instanceof FormData ||
      data instanceof Blob ||
      data instanceof ArrayBuffer ||
      data instanceof URLSearchParams ||
      typeof data === 'string'
    ) {
      return data
    }
    
    // 如果是对象，转换为JSON
    if (typeof data === 'object') {
      // 自动设置Content-Type
      if (headers && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json'
      }
      return JSON.stringify(data)
    }
    
    return String(data)
  }

  /**
   * 转换响应
   */
  private async transformResponse<T>(response: Response, config: RequestConfig): Promise<HttpResponse<T>> {
    const headers = this.transformResponseHeaders(response.headers)
    
    let data: T
    try {
      data = await this.parseResponseData<T>(response, config.responseType)
    } catch (error) {
      throw new Error(`Failed to parse response data: ${error}`)
    }
    
    const httpResponse: HttpResponse<T> = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers,
      config,
      raw: response
    }
    
    // 检查响应状态
    if (!response.ok) {
      throw this.createResponseError(httpResponse)
    }
    
    return httpResponse
  }

  /**
   * 解析响应数据
   */
  private async parseResponseData<T>(response: Response, responseType?: string): Promise<T> {
    const clonedResponse = response.clone()
    
    switch (responseType) {
      case 'text':
        return (await clonedResponse.text()) as T
      case 'blob':
        return (await clonedResponse.blob()) as T
      case 'arrayBuffer':
        return (await clonedResponse.arrayBuffer()) as T
      case 'stream':
        return (clonedResponse.body) as T
      case 'json':
      default:
        try {
          return await clonedResponse.json()
        } catch {
          // 如果JSON解析失败，尝试返回文本
          return (await response.text()) as T
        }
    }
  }

  /**
   * 转换响应头
   */
  private transformResponseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value
    })
    return result
  }

  /**
   * 转换错误
   */
  private transformError(error: any, config: RequestConfig): HttpError {
    const httpError = new Error(error.message || 'Request failed') as HttpError
    httpError.config = config
    
    if (error.name === 'AbortError') {
      httpError.code = 'CANCELLED'
      httpError.isCancelError = true
      httpError.message = 'Request was cancelled'
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      httpError.code = 'NETWORK_ERROR'
      httpError.isNetworkError = true
      httpError.message = 'Network error occurred'
    } else if (error.name === 'TimeoutError') {
      httpError.code = 'TIMEOUT'
      httpError.isTimeoutError = true
      httpError.message = 'Request timeout'
    }
    
    return httpError
  }

  /**
   * 创建响应错误
   */
  private createResponseError<T>(response: HttpResponse<T>): HttpError {
    const error = new Error(`Request failed with status ${response.status}`) as HttpError
    error.config = response.config
    error.response = response
    error.code = `HTTP_${response.status}`
    return error
  }

  /**
   * 构建查询字符串
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })
    
    return searchParams.toString()
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
      ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
      : baseURL
  }

  /**
   * 检查请求方法是否应该有请求体
   */
  private shouldHaveBody(method?: HttpMethod): boolean {
    return method !== HttpMethod.GET && 
           method !== HttpMethod.HEAD && 
           method !== HttpMethod.OPTIONS
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 创建Fetch适配器实例
 */
export function createFetchAdapter(): FetchAdapter {
  return new FetchAdapter()
}

/**
 * 检查是否支持Fetch API
 */
export function isFetchSupported(): boolean {
  return typeof fetch !== 'undefined' && 
         typeof AbortController !== 'undefined' && 
         typeof Headers !== 'undefined'
}
