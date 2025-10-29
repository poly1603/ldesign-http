/**
 * HTTP 客户端核心实现
 */

import type { HttpAdapter } from './types/adapter'
import type { HttpClient, HttpClientConfig } from './types/client'
import type { RequestConfig, ResponseData } from './types/base'

/**
 * HTTP 客户端实现类
 * 
 * @example
 * ```typescript
 * const client = new HttpClientImpl(config, adapter)
 * const response = await client.get('/api/users')
 * ```
 */
export class HttpClientImpl implements HttpClient {
  private config: HttpClientConfig
  private adapter: HttpAdapter
  private isDestroyed = false

  /**
   * 构造函数
   * 
   * @param config - 客户端配置
   * @param adapter - HTTP 适配器
   */
  constructor(config: HttpClientConfig, adapter: HttpAdapter) {
    this.config = {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      ...config,
    }
    this.adapter = adapter
  }

  /**
   * 发送 HTTP 请求
   * 
   * @param config - 请求配置
   * @returns 响应数据
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    this.checkDestroyed()

    const mergedConfig = this.mergeConfig(config)
    return this.adapter.request<T>(mergedConfig)
  }

  /**
   * GET 请求
   */
  get<T = unknown>(url: string, config: RequestConfig = {}): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: 'GET',
      url,
    })
  }

  /**
   * POST 请求
   */
  post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config: RequestConfig = {},
  ): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data,
    })
  }

  /**
   * PUT 请求
   */
  put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config: RequestConfig = {},
  ): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: 'PUT',
      url,
      data,
    })
  }

  /**
   * DELETE 请求
   */
  delete<T = unknown>(url: string, config: RequestConfig = {}): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: 'DELETE',
      url,
    })
  }

  /**
   * PATCH 请求
   */
  patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config: RequestConfig = {},
  ): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: 'PATCH',
      url,
      data,
    })
  }

  /**
   * HEAD 请求
   */
  head<T = unknown>(url: string, config: RequestConfig = {}): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: 'HEAD',
      url,
    })
  }

  /**
   * OPTIONS 请求
   */
  options<T = unknown>(url: string, config: RequestConfig = {}): Promise<ResponseData<T>> {
    return this.request<T>({
      ...config,
      method: 'OPTIONS',
      url,
    })
  }

  /**
   * 获取当前配置
   */
  getConfig(): HttpClientConfig {
    return { ...this.config }
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    if (this.isDestroyed) {
      return
    }
    this.isDestroyed = true
  }

  /**
   * 合并配置
   */
  private mergeConfig(config: RequestConfig): RequestConfig {
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
   * 检查客户端是否已销毁
   */
  private checkDestroyed(): void {
    if (this.isDestroyed) {
      throw new Error('HttpClient has been destroyed')
    }
  }
}


