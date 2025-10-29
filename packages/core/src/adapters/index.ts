/**
 * 适配器导出模块
 * 
 * 为了优化包体积，适配器类不再直接导入，而是通过工厂动态加载
 * 如果需要直接使用适配器类，请使用动态导入：
 * 
 * @example
 * ```typescript
 * // 推荐：使用工厂（自动优化）
 * import { createAdapter } from '@ldesign/http/adapters'
 * const adapter = await createAdapter('fetch')
 * 
 * // 或者：直接导入（会增加包体积）
 * import { FetchAdapter } from '@ldesign/http/adapters/fetch'
 * const adapter = new FetchAdapter()
 * ```
 */

import type { HttpAdapter } from '../types'

// 导出基类和类型
export { BaseAdapter } from './base'
export type { HttpAdapter } from '../types'

// 导出工厂函数（推荐使用，支持动态导入）
export {
  AdapterFactory,
  createAdapter,
  createAdapterSync,
  isAdapterAvailable,
  preloadAdapters,
} from './factory'

// 为了向后兼容，保留直接导出（但会增加包体积）
// 使用者可以选择性导入
export { AlovaAdapter } from './alova'
export { AxiosAdapter } from './axios'
export { FetchAdapter } from './fetch'
