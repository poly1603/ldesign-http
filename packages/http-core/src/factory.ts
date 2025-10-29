/**
 * HTTP 客户端工厂
 */

import type { HttpAdapter } from './types/adapter'
import type { HttpClient, HttpClientConfig } from './types/client'
import { HttpClientImpl } from './client'

/**
 * 创建 HTTP 客户端实例
 * 
 * @param config - 客户端配置
 * @param adapter - HTTP 适配器
 * @returns HTTP 客户端实例
 * 
 * @example
 * ```typescript
 * import { createHttpClient } from '@ldesign/http-core'
 * import { FetchAdapter } from '@ldesign/http-adapters'
 * 
 * const client = createHttpClient(
 *   { baseURL: 'https://api.example.com' },
 *   new FetchAdapter()
 * )
 * ```
 */
export function createHttpClient(
  config: HttpClientConfig,
  adapter: HttpAdapter,
): HttpClient {
  return new HttpClientImpl(config, adapter)
}


