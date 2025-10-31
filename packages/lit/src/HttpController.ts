import type { ReactiveController, ReactiveControllerHost } from 'lit'
import type { RequestConfig, ResponseData } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'

export interface HttpControllerOptions extends RequestConfig {
  /** 是否立即执行 */
  immediate?: boolean
}

/**
 * Lit HTTP Reactive Controller
 */
export class HttpController<T = any> implements ReactiveController {
  private client = createHttpClient()

  data: T | null = null
  loading = false
  error: Error | null = null

  constructor(
    private host: ReactiveControllerHost,
    private url?: string,
    private options: HttpControllerOptions = {},
  ) {
    this.host.addController(this)
  }

  hostConnected() {
    if (this.options.immediate && this.url) {
      this.execute()
    }
  }

  /**
   * 执行请求
   */
  async execute(config?: RequestConfig): Promise<ResponseData<T>> {
    this.loading = true
    this.error = null
    this.host.requestUpdate()

    try {
      const mergedConfig: RequestConfig = {
        ...this.options,
        ...config,
        url: config?.url || this.url,
      }

      const response = await this.client.request<T>(mergedConfig)
      this.data = response.data
      this.loading = false
      this.host.requestUpdate()
      return response
    }
    catch (err: any) {
      this.error = err
      this.loading = false
      this.host.requestUpdate()
      throw err
    }
  }

  /**
   * 重置状态
   */
  reset() {
    this.data = null
    this.loading = false
    this.error = null
    this.host.requestUpdate()
  }
}

/**
 * 创建GET Controller
 */
export function createGetController<T = any>(
  host: ReactiveControllerHost,
  url: string,
  options: HttpControllerOptions = {},
) {
  return new HttpController<T>(host, url, { ...options, method: 'GET' })
}

/**
 * 创建POST Controller
 */
export function createPostController<T = any>(
  host: ReactiveControllerHost,
  url: string,
  options: HttpControllerOptions = {},
) {
  return new HttpController<T>(host, url, { ...options, method: 'POST' })
}
