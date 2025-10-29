/**
 * Axios 适配器
 */

import type { HttpAdapter, RequestConfig, ResponseData } from '@ldesign/http-core'

/**
 * Axios 适配器实现
 * 
 * 基于 Axios 库的 HTTP 适配器
 * 
 * @example
 * ```typescript
 * const adapter = new AxiosAdapter()
 * const client = createHttpClient(config, adapter)
 * ```
 */
export class AxiosAdapter implements HttpAdapter {
  name = 'axios'
  private axios: any

  constructor() {
    // 延迟加载 axios
    this.loadAxios()
  }

  /**
   * 加载 Axios 库
   */
  private async loadAxios() {
    try {
      const axiosModule = await import('axios')
      this.axios = axiosModule.default
    }
    catch (error) {
      console.warn('Axios not found, please install it: pnpm add axios')
    }
  }

  /**
   * 检查是否支持 Axios
   */
  isSupported(): boolean {
    return this.axios !== undefined
  }

  /**
   * 发送 HTTP 请求
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    if (!this.axios) {
      await this.loadAxios()
    }

    if (!this.axios) {
      throw new Error('Axios is not available')
    }

    try {
      const response = await this.axios.request({
        ...config,
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        headers: config.headers,
        params: config.params,
        data: config.data,
        timeout: config.timeout,
        withCredentials: config.withCredentials,
        responseType: config.responseType,
        signal: config.signal,
      })

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
        raw: response,
      }
    }
    catch (error: any) {
      // 转换 Axios 错误为标准格式
      throw {
        name: 'HttpError',
        message: error.message,
        code: error.code,
        status: error.response?.status,
        config,
        response: error.response
          ? {
            data: error.response.data,
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            config,
          }
          : undefined,
        cause: error,
      }
    }
  }
}


