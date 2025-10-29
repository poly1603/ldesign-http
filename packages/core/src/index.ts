/**
 * @ldesign/http-core
 * 
 * Framework-agnostic HTTP client with adapters, interceptors, caching, and more
 */

// 核心客户端
export * from './client'
export * from './factory'

// 适配器
export * from './adapters'

// 类型
export * from './types'

// 版本
export { version } from './version'

// 默认导出
export { createHttpClient } from './factory'
