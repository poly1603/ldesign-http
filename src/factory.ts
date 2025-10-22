import type { HttpClientConfig } from './types'
import { createAdapter, createAdapterSync, preloadAdapters } from './adapters'
import { HttpClientImpl } from './client'

/**
 * 创建 HTTP 客户端实例（异步版本 - 推荐）
 * 
 * 使用动态导入优化包体积，首次创建时会自动加载适配器
 * 
 * @example
 * ```typescript
 * const client = await createHttpClient({
 *   baseURL: 'https://api.example.com',
 *   adapter: 'fetch' // 可选，不指定则自动选择
 * })
 * ```
 */
export async function createHttpClient(
  config: HttpClientConfig = {},
): Promise<HttpClientImpl> {
  const adapter = await createAdapter(config.adapter)
  return new HttpClientImpl(config, adapter)
}

/**
 * 创建 HTTP 客户端实例（同步版本）
 * 
 * 需要提前调用 preloadAdapters() 加载适配器
 * 适用于已经预加载适配器的场景
 * 
 * @example
 * ```typescript
 * // 应用启动时预加载
 * await preloadAdapters(['fetch'])
 * 
 * // 后续可以同步创建
 * const client = createHttpClientSync({
 *   baseURL: 'https://api.example.com'
 * })
 * ```
 */
export function createHttpClientSync(
  config: HttpClientConfig = {},
): HttpClientImpl {
  const adapter = createAdapterSync(config.adapter)
  return new HttpClientImpl(config, adapter)
}

/**
 * 预加载适配器（可选，用于优化首次创建性能）
 * 
 * 建议在应用启动时调用，预加载常用的适配器
 * 
 * @example
 * ```typescript
 * // 在应用入口预加载
 * await preloadAdapters(['fetch', 'axios'])
 * ```
 */
export { preloadAdapters }
