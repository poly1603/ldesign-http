/**
 * LEAP 客户端工厂函数
 */

import type { HttpClient } from '../types'
import { createHttpClient, createHttpClientSync } from '../client/factory'
import type { LeapClient, LeapClientConfig, LeapRequestConfig } from './types'
import { LeapClientImpl } from './client'

/**
 * 创建 LEAP 客户端（异步）
 *
 * @example
 * ```typescript
 * const leapClient = await createLeapClient({
 *   serverUrl: 'https://api.example.com',
 *   getSid: () => sessionStorage.getItem('sid') || ''
 * })
 *
 * const result = await leapClient.request('app_getUserInfo', { userId: '123' })
 * ```
 */
export async function createLeapClient(
  config: LeapClientConfig,
  httpClient?: HttpClient
): Promise<LeapClient> {
  const client = httpClient || await createHttpClient({
    baseURL: config.serverUrl,
    timeout: config.timeout || 30000,
    headers: config.headers,
    withCredentials: config.withCredentials,
  })

  return new LeapClientImpl(config, client)
}

/**
 * 创建 LEAP 客户端（同步）
 */
export function createLeapClientSync(
  config: LeapClientConfig,
  httpClient: HttpClient
): LeapClient {
  return new LeapClientImpl(config, httpClient)
}

/**
 * 创建全局 LEAP 客户端
 *
 * 可挂载到 window.leapclient 以兼容老代码
 *
 * @example
 * ```typescript
 * const leapclient = await createGlobalLeapClient({
 *   serverUrl: 'https://api.example.com'
 * })
 *
 * // 挂载到 window
 * if (typeof window !== 'undefined') {
 *   (window as any).leapclient = leapclient
 * }
 * ```
 */
export async function createGlobalLeapClient(
  config: LeapClientConfig,
  httpClient?: HttpClient
): Promise<LeapClient> {
  const client = await createLeapClient(config, httpClient)

  // 创建兼容老系统的全局对象
  return {
    ...client,
    request: client.request.bind(client),
    request2: client.request2.bind(client),
    asynrequest: client.asynRequest.bind(client),
    getsid: client.getSid.bind(client),
    setsid: client.setSid.bind(client),
    getServerURL: client.getServerUrl.bind(client),
    getRPCURL: client.getRpcUrl.bind(client),
    load: client.load.bind(client),
    loadjs: client.loadJs.bind(client),
    loadcss: client.loadCss.bind(client),
  } as LeapClient
}

/**
 * 创建 LEAP 兼容对象
 *
 * 提供与 LEAP.request / LEAP.request2 完全兼容的 API
 *
 * @example
 * ```typescript
 * const LEAP = createLeap(leapClient)
 *
 * // 使用老系统风格的 API
 * const result = await LEAP.request('app_getUserInfo', { userId: '123' })
 * ```
 */
export function createLeap(client: LeapClient) {
  return {
    /**
     * 发送请求（兼容 LEAP.request）
     */
    request: <T = unknown>(
      name: string,
      par?: Record<string, unknown>,
      extend?: string,
      callback?: (result: T, arg?: unknown) => void,
      service?: string,
      callService?: string,
      requestType?: number,
      isreturnjson?: boolean,
      useGet?: boolean,
      domain?: unknown,
      arg?: unknown,
      isworker?: boolean,
      router?: string
    ): Promise<T> => {
      return client.request2<T>({
        name,
        par,
        extend,
        callback: callback as (result: unknown, arg?: unknown) => void,
        service,
        callService,
        requestType,
        isreturnjson,
        useGet,
        domain,
        arg,
        isworker,
        router,
      })
    },

    /**
     * 发送请求（兼容 LEAP.request2）
     */
    request2: <T = unknown>(config: LeapRequestConfig): Promise<T> => {
      return client.request2<T>(config)
    },

    /**
     * 异步请求（兼容 LEAP.asynrequest）
     */
    asynrequest: <T = unknown>(
      name: string,
      par?: Record<string, unknown>,
      extend?: string,
      callback?: (result: T, arg?: unknown) => void,
      domain?: unknown,
      arg?: unknown
    ): void => {
      client.asynRequest<T>(
        name,
        par,
        callback as (result: unknown, arg?: unknown) => void,
        domain,
        arg
      )
    },
  }
}
