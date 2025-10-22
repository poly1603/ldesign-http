/**
 * @ldesign/http - 核心模块
 * 
 * 这是精简的核心导出，只包含最常用的功能
 * 适用于对包体积敏感的场景
 * 
 * @example
 * ```typescript
 * import { createHttpClient } from '@ldesign/http/core'
 * 
 * const client = await createHttpClient({
 *   baseURL: 'https://api.example.com'
 * })
 * 
 * const response = await client.get('/users')
 * ```
 */

// 核心工厂函数
export {
  createHttpClient,
  createHttpClientSync,
  preloadAdapters,
} from './factory'

// 核心类型
export { HttpClientImpl as HttpClient } from './client'

// 基础类型
export type {
  HttpMethod,
  RequestConfig,
  ResponseData,
  HttpError,
  HttpClient as IHttpClient,
  HttpAdapter,
  InterceptorManager,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RetryConfig,
  CacheConfig,
  ConcurrencyConfig,
  HttpClientConfig,
} from './types'

// 类型守卫
export {
  isHttpError,
  isNetworkError,
  isTimeoutError,
  isCancelError,
  isSuccessStatus,
  isClientError,
  isServerError,
} from './types'

// 基础适配器
export {
  BaseAdapter,
  createAdapter,
  createAdapterSync,
  isAdapterAvailable,
} from './adapters'

// 基础工具函数
export {
  buildURL,
  buildQueryString,
  combineURLs,
  createHttpError,
  delay,
  generateId,
  HttpStatus,
  isAbsoluteURL,
  mergeConfig,
} from './utils'

// 取消功能
export {
  globalCancelManager,
  isCancelError as isCanceled,
} from './utils/cancel'

export type { CancelManager } from './utils/cancel'

// 预设配置
export {
  presets,
  getPreset,
  mergePreset,
  autoPreset,
} from './presets'

export type { PresetName } from './presets'

