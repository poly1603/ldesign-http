import { Injectable, Optional } from '@angular/core'
import type { HttpClient, HttpClientConfig, RequestConfig, ResponseData } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { Observable, from } from 'rxjs'

/**
 * Angular HTTP Service配置
 */
@Injectable()
export class HttpServiceConfig implements HttpClientConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
}

/**
 * Angular HTTP Service
 */
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private client: HttpClient

  constructor(@Optional() config?: HttpServiceConfig) {
    this.client = createHttpClient(config || {})
  }

  /**
   * 获取底层HTTP客户端
   */
  getClient(): HttpClient {
    return this.client
  }

  /**
   * 发起请求 (返回Promise)
   */
  request<T = any>(config: RequestConfig): Promise<ResponseData<T>> {
    return this.client.request<T>(config)
  }

  /**
   * 发起请求 (返回Observable)
   */
  request$<T = any>(config: RequestConfig): Observable<ResponseData<T>> {
    return from(this.client.request<T>(config))
  }

  /**
   * GET请求
   */
  get<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.client.get<T>(url, config)
  }

  /**
   * GET请求 (Observable)
   */
  get$<T = any>(url: string, config?: RequestConfig): Observable<ResponseData<T>> {
    return from(this.client.get<T>(url, config))
  }

  /**
   * POST请求
   */
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.client.post<T>(url, data, config)
  }

  /**
   * POST请求 (Observable)
   */
  post$<T = any>(url: string, data?: any, config?: RequestConfig): Observable<ResponseData<T>> {
    return from(this.client.post<T>(url, data, config))
  }

  /**
   * PUT请求
   */
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.client.put<T>(url, data, config)
  }

  /**
   * PUT请求 (Observable)
   */
  put$<T = any>(url: string, data?: any, config?: RequestConfig): Observable<ResponseData<T>> {
    return from(this.client.put<T>(url, data, config))
  }

  /**
   * DELETE请求
   */
  delete<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.client.delete<T>(url, config)
  }

  /**
   * DELETE请求 (Observable)
   */
  delete$<T = any>(url: string, config?: RequestConfig): Observable<ResponseData<T>> {
    return from(this.client.delete<T>(url, config))
  }

  /**
   * PATCH请求
   */
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.client.patch<T>(url, data, config)
  }

  /**
   * PATCH请求 (Observable)
   */
  patch$<T = any>(url: string, data?: any, config?: RequestConfig): Observable<ResponseData<T>> {
    return from(this.client.patch<T>(url, data, config))
  }

  /**
   * HEAD请求
   */
  head<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.client.head<T>(url, config)
  }

  /**
   * HEAD请求 (Observable)
   */
  head$<T = any>(url: string, config?: RequestConfig): Observable<ResponseData<T>> {
    return from(this.client.head<T>(url, config))
  }

  /**
   * OPTIONS请求
   */
  options<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.client.options<T>(url, config)
  }

  /**
   * OPTIONS请求 (Observable)
   */
  options$<T = any>(url: string, config?: RequestConfig): Observable<ResponseData<T>> {
    return from(this.client.options<T>(url, config))
  }
}
