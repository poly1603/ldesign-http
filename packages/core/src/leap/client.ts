/**
 * LEAP RPC 客户端实现
 *
 * 兼容老系统 LEAP.request / leapclient.request 的请求方式
 */

import type { HttpClient, RequestConfig } from '../types'
import type {
  LeapCallback,
  LeapClient,
  LeapClientConfig,
  LeapError,
  LeapRequestConfig,
  LeapResponse,
} from './types'
import { createLeapError } from './types'

/**
 * LEAP 客户端实现类
 *
 * @example
 * ```typescript
 * import { createHttpClient } from '@ldesign/http'
 * import { LeapClientImpl } from '@ldesign/http/leap'
 *
 * const httpClient = await createHttpClient()
 * const leapClient = new LeapClientImpl({
 *   serverUrl: 'https://api.example.com',
 *   getSid: () => sessionStorage.getItem('sid') || ''
 * }, httpClient)
 *
 * const result = await leapClient.request('app_getUserInfo', { userId: '123' })
 * ```
 */
export class LeapClientImpl implements LeapClient {
  private config: Required<LeapClientConfig>
  private httpClient: HttpClient
  private sid: string = ''
  private isDestroyed = false
  private loadedScripts: Set<string> = new Set()
  private loadedStyles: Set<string> = new Set()

  constructor(config: LeapClientConfig, httpClient: HttpClient) {
    this.config = {
      serverUrl: config.serverUrl.replace(/\/$/, ''),
      rpcPath: config.rpcPath || '/LEAP/Service/RPC/RPC.DO',
      defaultService: config.defaultService || 'leap',
      defaultCallService: config.defaultCallService || 'leap',
      getSid: config.getSid || (() => this.sid),
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      withCredentials: config.withCredentials !== false,
      onRequest: config.onRequest || ((c) => c),
      onResponse: config.onResponse || ((r) => r.data),
      onError: config.onError || (() => { }),
    }

    this.httpClient = httpClient
  }

  async request<T = unknown>(
    name: string,
    par?: Record<string, unknown>,
    options?: Partial<LeapRequestConfig>
  ): Promise<T> {
    return this.request2<T>({ name, par, ...options })
  }

  async request2<T = unknown>(config: LeapRequestConfig): Promise<T> {
    if (this.isDestroyed) {
      throw createLeapError('Client has been destroyed')
    }

    // 处理请求分组
    if (config.requestGroup) {
      config.requestGroup.add(config)
      return undefined as T
    }

    // 应用请求拦截器
    const processedConfig = await this.config.onRequest(config)

    // 构建请求
    const { url, body, method } = await this.buildRequest(processedConfig)

    try {
      const response = await this.httpClient.request<string>({
        url,
        method,
        data: body,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...this.config.headers,
        },
        withCredentials: this.config.withCredentials,
        responseType: 'text',
      } as RequestConfig)

      // 解析响应
      const result = this.parseResponse<T>(response.data, processedConfig)

      const leapResponse: LeapResponse<T> = {
        data: result,
        status: response.status,
        headers: response.headers,
        rawText: response.data,
      }

      // 应用响应拦截器
      const finalResult = await this.config.onResponse(leapResponse)

      // 处理回调
      if (processedConfig.callback) {
        this.executeCallback(
          processedConfig.callback,
          finalResult as T,
          processedConfig.domain,
          processedConfig.arg,
          processedConfig.isworker
        )
      }

      return finalResult as T
    } catch (error) {
      const leapError = this.wrapError(error, processedConfig)
      await this.config.onError(leapError)
      throw leapError
    }
  }

  asynRequest<T = unknown>(
    name: string,
    par?: Record<string, unknown>,
    callback?: LeapCallback<T>,
    domain?: unknown,
    arg?: unknown
  ): void {
    this.request2<T>({
      name,
      par,
      callback: callback as LeapCallback,
      domain,
      arg,
    }).catch((error) => {
      console.error('[LeapClient] Async request error:', error)
    })
  }

  getSid(): string | Promise<string> {
    return this.config.getSid()
  }

  setSid(sid: string): void {
    this.sid = sid
  }

  getServerUrl(): string {
    return this.config.serverUrl
  }

  getRpcUrl(router?: string): string {
    if (router && router !== 'leap') {
      return `${this.config.serverUrl}/LEAP/Service/RPC/${router}/RPC.DO`
    }
    return `${this.config.serverUrl}${this.config.rpcPath}`
  }

  async load(path: string): Promise<string> {
    const normalizedPath = this.normalizePath(path)
    const url = `${this.config.serverUrl}/${normalizedPath}`

    const response = await this.httpClient.get<string>(url, {
      responseType: 'text',
    } as RequestConfig)

    return response.data
  }

  async loadJs(path: string, doc: Document = document): Promise<void> {
    const normalizedPath = this.normalizePath(path)

    if (this.loadedScripts.has(normalizedPath)) {
      return
    }

    const url = `${this.config.serverUrl}/${normalizedPath}`

    return new Promise((resolve, reject) => {
      const script = doc.createElement('script')
      script.type = 'text/javascript'
      script.src = url
      script.setAttribute('path', normalizedPath)

      script.onload = () => {
        this.loadedScripts.add(normalizedPath)
        resolve()
      }

      script.onerror = () => {
        reject(createLeapError(`Failed to load script: ${url}`))
      }

      doc.head.appendChild(script)
    })
  }

  async loadCss(path: string, doc: Document = document): Promise<void> {
    const normalizedPath = this.normalizePath(path)

    if (this.loadedStyles.has(normalizedPath)) {
      return
    }

    const url = `${this.config.serverUrl}/${normalizedPath}`

    return new Promise((resolve, reject) => {
      const link = doc.createElement('link')
      link.rel = 'stylesheet'
      link.type = 'text/css'
      link.href = url
      link.setAttribute('path', normalizedPath)

      link.onload = () => {
        this.loadedStyles.add(normalizedPath)
        resolve()
      }

      link.onerror = () => {
        reject(createLeapError(`Failed to load stylesheet: ${url}`))
      }

      doc.head.appendChild(link)
    })
  }

  destroy(): void {
    this.isDestroyed = true
    this.loadedScripts.clear()
    this.loadedStyles.clear()
  }

  // ==================== 私有方法 ====================

  private async buildRequest(config: LeapRequestConfig): Promise<{
    url: string
    body: string
    method: 'GET' | 'POST'
  }> {
    const sid = await this.getSid()
    const callService = config.callService || this.config.defaultCallService
    const isReturnJson = config.isreturnjson !== false

    const urlParams: string[] = []

    if (callService !== 'leap') {
      urlParams.push(`callService=${encodeURIComponent(callService)}`)
    }

    if (!isReturnJson) {
      urlParams.push('returnJSON=0')
    }

    urlParams.push(`method=${encodeURIComponent(config.name)}`)
    urlParams.push(`sid=${encodeURIComponent(sid)}`)

    if (config.urlpar) {
      for (const [key, value] of Object.entries(config.urlpar)) {
        if (value != null) {
          urlParams.push(`u_${key}=${encodeURIComponent(value)}`)
        }
      }
    }

    if (config.extend) {
      urlParams.push(`extend=${encodeURIComponent(encodeURIComponent(escape(config.extend)))}`)
    }

    if (config.requestType && config.requestType !== 1) {
      urlParams.push(`type=${config.requestType}`)
    }

    let body = urlParams.join('&')

    if (config.par && typeof config.par === 'object') {
      const parJson = JSON.stringify(config.par)
      body += `&par=${encodeURIComponent(parJson)}`
    }

    const url = this.getRpcUrl(config.router)
    const method = config.useGet ? 'GET' : 'POST'

    return { url, body, method }
  }

  private parseResponse<T>(responseText: string, config: LeapRequestConfig): T {
    if (!responseText) {
      return null as T
    }

    const isReturnJson = config.isreturnjson !== false

    if (!isReturnJson) {
      return responseText as T
    }

    try {
      return JSON.parse(responseText) as T
    } catch {
      return responseText as T
    }
  }

  private executeCallback<T>(
    callback: LeapCallback<T>,
    result: T,
    domain?: unknown,
    arg?: unknown,
    isWorker?: boolean
  ): void {
    const executeFunc = () => {
      try {
        const context = domain || globalThis
        callback.call(context, result, arg)
      } catch (error) {
        console.error('[LeapClient] Callback error:', error)
      }
    }

    if (isWorker) {
      executeFunc()
    } else {
      setTimeout(executeFunc, 1)
    }
  }

  private wrapError(error: unknown, config: LeapRequestConfig): LeapError {
    if (error instanceof Error) {
      return createLeapError(error.message, {
        config,
        isNetworkError: (error as { isNetworkError?: boolean }).isNetworkError,
        isTimeoutError: (error as { isTimeoutError?: boolean }).isTimeoutError,
        status: (error as { status?: number }).status,
      })
    }

    return createLeapError(String(error), { config })
  }

  private normalizePath(path: string): string {
    let normalized = path
    if (normalized.startsWith('/') || normalized.startsWith('\\')) {
      normalized = normalized.substring(1)
    }
    return normalized
  }
}

/**
 * 创建请求分组（批量请求）
 */
export function createLeapRequestGroup(client: LeapClient): {
  add: (request: LeapRequestConfig) => void
  execute: () => Promise<unknown[]>
} {
  const requests: LeapRequestConfig[] = []

  return {
    add(request: LeapRequestConfig) {
      const { requestGroup: _, ...cleanRequest } = request
      requests.push(cleanRequest)
    },

    async execute() {
      return Promise.all(requests.map((req) => client.request2(req)))
    },
  }
}
