/**
 * @ldesign/http-core
 *
 * Framework-agnostic HTTP client with adapters, interceptors, caching, and more
 */

// ============================================================================
// 核心客户端
// ============================================================================
// 从 client 目录导出完整的 HttpClient 实现
export { HttpClientImpl } from './client/HttpClient'
export { createHttpClient, createHttpClientSync } from './client/factory'
// operations 和 helpers 中的 FileOperationHandler 重复，只导出 operations 中的
export type { FileOperations } from './client/operations'
export { FileOperationHandler, createFileOperationHandler } from './client/operations'
// 导出辅助类（除了 FileOperationHandler）
export { ConfigMerger, InterceptorProcessor } from './client/helpers'

// ============================================================================
// 适配器系统
// ============================================================================
export * from './adapters'

// ============================================================================
// 拦截器系统
// ============================================================================
export * from './interceptors'

// ============================================================================
// 缓存系统
// ============================================================================
export { CacheManager } from './cache/CacheManager'
export { MemoryCacheStorage } from './cache/MemoryCacheStorage'

// ============================================================================
// 重试机制
// ============================================================================
export { RetryManager } from './retry/RetryManager'

// ============================================================================
// 中间件
// ============================================================================
// middleware 模块尚未实现，暂时注释
// export * from './middleware'

// ============================================================================
// 高级特性
// ============================================================================
export * from './features'

// ============================================================================
// 开发工具
// ============================================================================
export * from './devtools'

// ============================================================================
// 工具函数
// ============================================================================
// 导出常用工具函数（避免与 features/types 冲突，只导出必要的函数）
export {
  // 取消令牌相关
  createCancelTokenSource,
  createTimeoutToken,
  combineCancelTokens,
  createCancelManager,
  isCancelError,
  // 网络监控相关
  createNetworkMonitor,
  ConnectionType,
  // 序列化相关
  generateRequestKey,
  generateRequestFingerprint,
  // 通用工具
  mergeConfig,
  buildQueryString,
  buildURL,
  isAbsoluteURL,
  combineURLs,
  createHttpError,
  delay,
  generateId,
  deepClone,
  isFormData,
  isBlob,
  isArrayBuffer,
  isURLSearchParams,
  HttpStatus,
  ErrorClassifier,
} from './utils'

// 导出取消令牌类型
export type {
  CancelToken,
  CancelTokenSource,
  CancelManager,
  EnhancedCancelManager,
  EnhancedCancelConfig,
} from './utils/cancel'

// 导出网络监控类型
export type {
  NetworkInfo,
  NetworkMonitorConfig,
  NetworkStatus,
} from './utils/network'

// ============================================================================
// 类型定义
// ============================================================================
// 导出常用类型（避免与 features/utils 冲突，只导出必要的类型）
export type {
  HttpMethod,
  RequestConfig,
  ResponseData,
  HttpError,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorManager,
  RetryConfig,
  CacheConfig,
  CacheStorage,
  ConcurrencyConfig,
  HttpClientConfig,
  HttpAdapter,
  HttpClient,
  TypedHttpClient,
  ApiEndpoint,
  TypedRequestConfig,
  TypedResponseData,
  HttpStatusCode,
  ExtendedRequestConfig,
  StrictRequestConfig,
  StrictResponseData,
  ApiEndpointDefinition,
  TypedHttpMethods,
  RequestDataByMethod,
  ResponseDataByType,
  RequiredKeys,
  DeepReadonly,
  DeepPartial,
} from './types/index'

export {
  ContentType,
  RequestPriority,
  isHttpError,
  isNetworkError,
  isTimeoutError,
  isSuccessStatus,
  isClientError,
  isServerError,
} from './types/index'

// ============================================================================
// 核心处理器
// ============================================================================
// TODO: 阶段6 - 重组导出，避免重复导出问题（与interceptors有冲突）
// export * from './core'

// ============================================================================
// 引擎系统
// ============================================================================
export * from './engine'

// ============================================================================
// 版本信息
// ============================================================================
export { version } from './constants/version'

// ============================================================================
// 默认导出
// ============================================================================
export { createHttpClient as default } from './client/factory'
