/**
 * Fetch 适配器
 */

import type { HttpAdapter, RequestConfig, ResponseData } from '@ldesign/http-core'

/**
 * Fetch 适配器实现
 * 
 * 基于原生 Fetch API 的 HTTP 适配器
 * 
 * @example
 * ```typescript
 * const adapter = new FetchAdapter()
 * const client = createHttpClient(config, adapter)
 * ```
 */
export class FetchAdapter implements HttpAdapter {
  name = 'fetch'

  /**
   * 检查是否支持 Fetch API
   */
  isSupported(): boolean {
    return typeof fetch !== 'undefined'
  }

  /**
   * 发送 HTTP 请求
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    const url = this.buildURL(config)
    const options = this.buildOptions(config)

    const response = await fetch(url, options)

    const data = await this.parseResponse<T>(response, config.responseType)

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: this.parseHeaders(response.headers),
      config,
      raw: response,
    }
  }

  /**
   * 构建完整 URL
   */
  private buildURL(config: RequestConfig): string {
    let url = config.url || ''

    // 添加 baseURL
    if (config.baseURL) {
      url = `${config.baseURL}${url}`
    }

    // 添加查询参数
    if (config.params) {
      const searchParams = new URLSearchParams(
        Object.entries(config.params).map(([key, value]) => [key, String(value)]),
      )
      url += `?${searchParams.toString()}`
    }

    return url
  }

  /**
   * 构建请求选项
   */
  private buildOptions(config: RequestConfig): RequestInit {
    const options: RequestInit = {
      method: config.method || 'GET',
      headers: config.headers,
      signal: config.signal,
    }

    // 添加请求体
    if (config.data) {
      if (typeof config.data === 'string') {
        options.body = config.data
      }
      else if (config.data instanceof FormData) {
        options.body = config.data
      }
      else {
        options.body = JSON.stringify(config.data)
      }
    }

    // 添加凭证
    if (config.withCredentials) {
      options.credentials = 'include'
    }

    return options
  }

  /**
   * 解析响应数据
   */
  private async parseResponse<T>(response: Response, responseType?: string): Promise<T> {
    switch (responseType) {
      case 'text':
        return await response.text() as T
      case 'blob':
        return await response.blob() as T
      case 'arrayBuffer':
        return await response.arrayBuffer() as T
      case 'formData':
        return await response.formData() as T
      case 'json':
      default:
        return await response.json() as T
    }
  }

  /**
   * 解析响应头
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
}


