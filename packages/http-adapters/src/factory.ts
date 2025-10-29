/**
 * 适配器工厂
 */

import type { HttpAdapter } from '@ldesign/http-core'
import { FetchAdapter } from './fetch'
import { AxiosAdapter } from './axios'
import { AlovaAdapter } from './alova'

/**
 * 适配器类型
 */
export type AdapterType = 'fetch' | 'axios' | 'alova'

/**
 * 创建适配器实例
 * 
 * @param type - 适配器类型
 * @returns 适配器实例
 * 
 * @example
 * ```typescript
 * const adapter = createAdapter('fetch')
 * const client = createHttpClient(config, adapter)
 * ```
 */
export function createAdapter(type: AdapterType): HttpAdapter {
  switch (type) {
    case 'fetch':
      return new FetchAdapter()
    case 'axios':
      return new AxiosAdapter()
    case 'alova':
      return new AlovaAdapter()
    default:
      throw new Error(`Unknown adapter type: ${type}`)
  }
}

/**
 * 自动选择适配器
 * 
 * 根据环境自动选择最佳适配器
 * 
 * @returns 适配器实例
 * 
 * @example
 * ```typescript
 * const adapter = autoSelectAdapter()
 * const client = createHttpClient(config, adapter)
 * ```
 */
export function autoSelectAdapter(): HttpAdapter {
  const adapters: HttpAdapter[] = [
    new FetchAdapter(),
    new AxiosAdapter(),
    new AlovaAdapter(),
  ]

  for (const adapter of adapters) {
    if (adapter.isSupported()) {
      return adapter
    }
  }

  throw new Error('No supported HTTP adapter found')
}


