/**
 * Axios适配器
 * 基于Axios库实现HTTP请求
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type CancelTokenSource,
} from 'axios'
import type {
  HttpAdapter,
  HttpError,
  HttpMethod,
  HttpResponse,
  RequestConfig,
} from '../types'

export class AxiosAdapter implements HttpAdapter {
  private axiosInstance: AxiosInstance
  private cancelTokenSources: Map<string, CancelTokenSource> = new Map()

  constructor(axiosConfig?: AxiosRequestConfig) {
    this.axiosInstance = axios.create(axiosConfig)
  }

  /**
   * 发送请求
   */
  async request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    try {
      const axiosConfig = this.transformRequestConfig(config)
      const response = await this.axiosInstance.request<T>(axiosConfig)
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
      const source = this.cancelTokenSources.get(requestId)
      if (source) {
        source.cancel('Request cancelled')
        this.cancelTokenSources.delete(requestId)
      }
    }
 else {
      // 取消所有请求
      this.cancelTokenSources.forEach(source => source.cancel('Request cancelled'))
      this.cancelTokenSources.clear()
    }
  }

  /**
   * 获取适配器名称
   */
  getName(): string {
    return 'axios'
  }

  /**
   * 获取Axios实例
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance
  }

  /**
   * 转换请求配置
   */
  private transformRequestConfig(config: RequestConfig): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: (config.method || HttpMethod.GET).toLowerCase() as any,
      headers: config.headers,
      params: config.params,
      data: config.data,
      timeout: config.timeout,
      baseURL: config.baseURL,
      responseType: this.transformResponseType(config.responseType),
      withCredentials: config.withCredentials,
    }

    // 创建取消令牌
    const requestId = this.generateRequestId()
    const cancelTokenSource = axios.CancelToken.source()
    this.cancelTokenSources.set(requestId, cancelTokenSource)
    axiosConfig.cancelToken = cancelTokenSource.token

    // 处理上传进度
    if (config.onUploadProgress) {
      axiosConfig.onUploadProgress = (progressEvent) => {
        const progress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total || 0,
          percentage: progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0,
        }
        config.onUploadProgress!(progress)
      }
    }

    // 处理下载进度
    if (config.onDownloadProgress) {
      axiosConfig.onDownloadProgress = (progressEvent) => {
        const progress = {
          loaded: progressEvent.loaded,
          total: progressEvent.total || 0,
          percentage: progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0,
        }
        config.onDownloadProgress!(progress)
      }
    }

    // 复制其他自定义配置
    Object.keys(config).forEach((key) => {
      if (!axiosConfig.hasOwnProperty(key)
        && key !== 'onUploadProgress'
        && key !== 'onDownloadProgress') {
        (axiosConfig as any)[key] = (config as any)[key]
      }
    })

    return axiosConfig
  }

  /**
   * 转换响应类型
   */
  private transformResponseType(responseType?: string): any {
    switch (responseType) {
      case 'json':
        return 'json'
      case 'text':
        return 'text'
      case 'blob':
        return 'blob'
      case 'arrayBuffer':
        return 'arraybuffer'
      case 'stream':
        return 'stream'
      default:
        return 'json'
    }
  }

  /**
   * 转换响应
   */
  private transformResponse<T>(response: AxiosResponse<T>, config: RequestConfig): HttpResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: this.transformResponseHeaders(response.headers),
      config,
      raw: response,
    }
  }

  /**
   * 转换响应头
   */
  private transformResponseHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {}

    if (headers) {
      Object.keys(headers).forEach((key) => {
        result[key.toLowerCase()] = String(headers[key])
      })
    }

    return result
  }

  /**
   * 转换错误
   */
  private transformError(error: AxiosError, config: RequestConfig): HttpError {
    const httpError = new Error(error.message || 'Request failed') as HttpError
    httpError.config = config
    httpError.code = error.code

    if (axios.isCancel(error)) {
      httpError.isCancelError = true
      httpError.code = 'CANCELLED'
      httpError.message = 'Request was cancelled'
    }
 else if (error.response) {
      // 服务器响应了错误状态码
      httpError.response = this.transformResponse(error.response, config)
      httpError.code = `HTTP_${error.response.status}`
    }
 else if (error.request) {
      // 请求已发出但没有收到响应
      httpError.isNetworkError = true
      httpError.code = 'NETWORK_ERROR'
      httpError.message = 'Network error occurred'
    }
 else {
      // 其他错误
      httpError.isNetworkError = true
    }

    // 检查是否为超时错误
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      httpError.isTimeoutError = true
      httpError.code = 'TIMEOUT'
      httpError.message = 'Request timeout'
    }

    return httpError
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `axios_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 创建Axios适配器实例
 */
export function createAxiosAdapter(config?: AxiosRequestConfig): AxiosAdapter {
  return new AxiosAdapter(config)
}

/**
 * 检查是否支持Axios
 */
export function isAxiosSupported(): boolean {
  try {
    return typeof axios !== 'undefined'
  }
 catch {
    return false
  }
}
