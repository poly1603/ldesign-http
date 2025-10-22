/**
 * @ldesign/http - 完整功能导出
 * 
 * 此文件导出所有功能，适用于需要完整功能的场景
 * 
 * 如果您只需要基础功能，建议使用：
 * ```typescript
 * import { createHttpClient } from '@ldesign/http/core'
 * ```
 * 
 * 高级功能可以按需导入：
 * ```typescript
 * import { withCache } from '@ldesign/http/features/cache'
 * import { withRetry } from '@ldesign/http/features/retry'
 * import { useHttp } from '@ldesign/http/vue'
 * ```
 */

// ============ 核心功能 ============
// 导出核心模块的所有内容
export * from './index.core'

// ============ 适配器 ============
// 完整导出（包括具体适配器类，会增加包体积）
export {
  FetchAdapter,
  AxiosAdapter,
  AlovaAdapter,
  AdapterFactory,
} from './adapters'

// ============ 功能中间件 ============
export {
  withCache,
} from './features/cache'

export {
  withRetry,
} from './features/retry'

// GraphQL
export {
  createGraphQLClient,
  GraphQLClient,
  GraphQLClientError,
  isGraphQLError,
} from './features/graphql'

export type {
  GraphQLClientConfig,
  GraphQLError,
  GraphQLRequestConfig,
  GraphQLResponse,
  GraphQLVariables,
} from './features/graphql'

// Mock
export {
  createMockAdapter,
  createMockInterceptor,
  MockAdapter,
} from './features/mock'

export type {
  MockMatcher,
  MockResponse,
  MockRule,
  MockStats,
} from './features/mock'

// SSE
export {
  BasicSSEClient,
  createBasicSSEClient,
  createSSEClient,
  SSEClient,
  SSEStatus,
} from './features/sse'

export type {
  SSEClientConfig,
  SSEEvent,
  SSEEventListener,
} from './features/sse'

// WebSocket
export {
  createWebSocketClient,
  WebSocketClient,
  WebSocketStatus,
} from './features/websocket'

export type {
  WebSocketClientConfig,
  WebSocketEventListener,
  WebSocketEventType,
  WebSocketMessage,
} from './features/websocket'

// 请求录制器 (新增)
export {
  createRequestRecorder,
  createRecorderInterceptor,
  RequestRecorder,
} from './features/recorder'

export type {
  RecordingItem,
  RecorderConfig,
  RecorderStats,
} from './features/recorder'

// ============ 拦截器 ============
export {
  authInterceptor,
  cacheInterceptor,
  contentTypeInterceptor,
  createAuthInterceptor,
  createBaseURLInterceptor,
  createResponseTimeInterceptor,
  createRetryInterceptor,
  errorHandlingInterceptor,
  errorLoggerInterceptor,
  InterceptorManagerImpl as InterceptorManager,
  loggingInterceptor,
  requestIdInterceptor,
  requestLoggerInterceptor,
  responseLoggerInterceptor,
  retryInterceptor,
  statusCodeInterceptor,
  timeoutInterceptor,
  timestampInterceptor,
} from './interceptors'

// ============ 开发工具 ============
export {
  createDevTools,
  globalDevTools,
  HttpDevTools,
} from './devtools'

export type {
  DevToolsConfig,
  RequestRecord,
} from './devtools'

// ============ Engine 插件 ============
export {
  createHttpEnginePlugin,
  createHttpPlugin,
  defaultHttpEnginePlugin,
  httpPlugin,
} from './engine'

export type { HttpEnginePluginOptions } from './engine'

// ============ 工具函数 ============
// 批处理
export {
  BatchManager,
  createBatchManager,
} from './utils/batch'

export type {
  BatchConfig,
  BatchStats,
} from './utils/batch'

// 缓存
export {
  CacheManager,
  createCacheManager,
  createEnhancedCacheManager,
  createLocalStorage,
  createMemoryStorage,
  EnhancedCacheManager,
  LocalStorageCacheStorage,
  MemoryCacheStorage,
  createOptimizedMemoryStorage,
  OptimizedMemoryStorage,
} from './utils/cache'

export type {
  CacheItemMetadata,
  CacheStats,
  EnhancedCacheConfig,
  EnhancedCacheItem,
  OptimizedCacheConfig,
} from './utils/cache'

// 压缩工具
export {
  createCompressor,
  defaultCompressor,
  SimpleLZCompressor,
  NoCompressor,
} from './utils/compressor'

export type {
  Compressor,
} from './utils/compressor'

// 取消
export {
  CancelManager,
  CancelTokenSource,
  createCancelTokenSource,
  createTimeoutCancelToken,
} from './utils/cancel'

// 并发控制
export {
  ConcurrencyManager,
  createConcurrencyManager,
  createDeduplicationKeyGenerator,
  createDeduplicationManager,
  createRateLimitManager,
  DeduplicationKeyGenerator,
  DeduplicationManager,
  RateLimitManager,
  DeduplicationManager as RequestDeduplicator,
} from './utils/concurrency'

export type {
  DeduplicationStats,
  DeduplicationKeyConfig,
} from './utils/concurrency'

// 调试工具
export {
  createDebugInterceptor,
  createHttpDebugger,
  DebugLevel,
  HttpDebugger,
} from './utils/debugger'

export type {
  DebugEvent,
  DebuggerConfig,
  PerformanceMetrics as DebugPerformanceMetrics,
  RequestLog,
  ResponseLog,
} from './utils/debugger'

// 下载
export {
  createDownloadChunks,
  createRangeHeader,
  DownloadProgressCalculator,
  formatDownloadSpeed,
  formatTimeRemaining,
  getFilenameFromResponse,
  getFilenameFromURL,
  getMimeTypeFromFilename,
  isPreviewableFile,
  mergeDownloadChunks,
  parseContentRange,
  saveFileToLocal,
  supportsRangeRequests,
} from './utils/download'

// 错误处理
export {
  builtinRecoveryStrategies,
  ErrorAnalyzer,
  ErrorHandler,
  ErrorType,
  RetryManager,
  TimeoutManager,
} from './utils/error'

export type {
  ErrorRecoveryStrategy,
  ErrorStats,
} from './utils/error'

// 日志
export {
  createLogger,
  devLogger,
  logger,
  Logger,
  LogLevel,
} from './utils/logger'

export type {
  LoggerConfig,
} from './utils/logger'

// 内存监控
export {
  createMemoryMonitor,
  globalMemoryCleaner,
  globalMemoryMonitor,
  MemoryCleaner,
  MemoryMonitor,
} from './utils/memory'

export type {
  MemoryMonitorConfig,
  MemoryStats,
  MemoryUsage,
} from './utils/memory'

// 性能监控
export {
  createRequestMonitor,
  defaultMonitor,
  RequestMonitor,
  CompactRequestMonitor,
  createCompactMonitor,
} from './utils/monitor'

export type {
  MonitorConfig,
  PerformanceMetrics,
  PerformanceStats,
} from './utils/monitor'

// 网络状态
export {
  ConnectionType,
  createNetworkInterceptor,
  createNetworkMonitor,
  globalNetworkMonitor,
  NetworkMonitor,
  NetworkStatus,
  waitForOnline,
} from './utils/network'

export type {
  NetworkInfo,
  NetworkMonitorConfig,
} from './utils/network'

// 离线队列
export {
  createOfflineQueueManager,
  OfflineQueueManager,
} from './utils/offline'

export type {
  OfflineQueueConfig,
  OfflineQueueStats,
} from './utils/offline'

// 连接池
export {
  createRequestPool,
  defaultPool,
  RequestPool,
} from './utils/pool'

export type {
  ConnectionInfo,
  PoolConfig,
  PoolStats,
} from './utils/pool'

// 优先级队列
export {
  createPriorityQueue,
  determinePriority,
  Priority,
  PriorityQueue,
} from './utils/priority'

export type {
  PriorityItem,
  PriorityQueueConfig,
  PriorityQueueStats,
} from './utils/priority'

// 请求去重
export {
  defaultKeyGenerator,
  generateRequestKey,
  DeduplicationKeyGenerator as RequestDeduplicationKeyGenerator,
} from './utils/request-dedup'

export type {
  DeduplicationKeyConfig as RequestDeduplicationKeyConfig,
} from './utils/request-dedup'

// 签名
export {
  createSignatureInterceptor,
  createSignatureManager,
  SignatureManager,
} from './utils/signature'

export type {
  SignatureConfig,
  SignatureResult,
} from './utils/signature'

// 智能重试
export {
  createSmartRetryInterceptor,
  createSmartRetryManager,
  globalSmartRetryManager,
  RetryStrategy,
  SmartRetryManager,
} from './utils/smartRetry'

export type {
  RetryDecision,
  SmartRetryConfig,
} from './utils/smartRetry'

// 请求追踪
export {
  consoleExporter,
  createRequestTracer,
  createTraceInterceptor,
  globalTracer,
  RequestTracer,
  Span,
  SpanStatus,
  SpanType,
  Trace,
} from './utils/trace'

export type {
  TraceConfig,
  TraceContext,
  TraceSpan,
  TraceTag,
} from './utils/trace'

// 数据转换
export {
  createDataTransformer,
  createDataTransformInterceptor,
  DataTransformer,
  globalDataTransformer,
  nullToUndefined,
  transformBigInts,
  transformDates,
} from './utils/transformer'

export type {
  TransformerConfig,
} from './utils/transformer'

// 文件上传下载
export {
  createFileChunks,
  createFilePreviewURL,
  createUploadFormData,
  FileValidationError,
  formatFileSize,
  generateFileHash,
  getFileExtension,
  isAudioFile,
  isDocumentFile,
  isImageFile,
  isVideoFile,
  ProgressCalculator,
  revokeFilePreviewURL,
  validateFile,
} from './utils/upload'

// 类型工具
export {
  assertType,
  createEnum,
  createTypedError,
  deepClone,
  isArray,
  isFunction,
  isNonNull,
  isNumber,
  isObject,
  isString,
  safeGet,
  safeGetNested,
  safeJsonParse,
  typedEntries,
  typedFilter,
  typedKeys,
  typedMerge,
  typedValues,
  wrapPromise,
} from './types/utils'

// 数据类型检查工具
export {
  isArrayBuffer,
  isBlob,
  isFormData,
  isURLSearchParams,
} from './utils/index'

export type {
  AllowsRequestBody,
  AllStatusCode,
  ArrayToUnion,
  BuildUrlWithParams,
  ClientErrorStatusCode,
  DeepMerge,
  DistributiveOmit,
  ExtractPathParams,
  FunctionKeys,
  FunctionsOnly,
  IsPromise,
  NonFunctionKeys,
  PropertiesOnly,
  ReadonlyTuple,
  RequestBodyType,
  ServerErrorStatusCode,
  StatusCodeMessages,
  StrictEnum,
  SuccessStatusCode,
  UnionToIntersection,
  UnwrapPromise,
} from './types/utils'

// 品牌类型和安全类型
export type * from './types/brand'
export type * from './types/safe'

export {
  brand,
  unbrand,
  createUrl,
  createRequestId,
  createCacheKey,
  createStatusCode,
  createTimeout,
  createTTL,
  createToken,
  createApiKey,
} from './types/brand'

// ============ Vue 集成 ============
export * from './vue'

// ============ 预设配置 ============
export {
  presets,
  getPreset,
  mergePreset,
  autoPreset,
  restful,
  graphql,
  realtime,
  lowPower,
  batch,
  development,
  production,
  offlineFirst,
} from './presets'

export type { PresetName } from './presets'

// ============ 默认实例 ============
/**
 * 默认 HTTP 客户端实例（延迟初始化）
 * 
 * 注意：由于使用了动态导入，首次访问时需要 await
 * 
 * @example
 * ```typescript
 * import { http } from '@ldesign/http'
 * 
 * // 首次使用需要等待加载
 * const client = await http()
 * const response = await client.get('/users')
 * ```
 */
let defaultInstance: Promise<HttpClientImpl> | null = null

export async function http() {
  if (!defaultInstance) {
    const { createHttpClient } = await import('./factory')
    defaultInstance = createHttpClient()
  }
  return defaultInstance
}

// 为了向后兼容，提供同步访问方式（需要预加载）
import { HttpClientImpl } from './client'

export { HttpClientImpl }

// 默认导出工厂函数
export { createHttpClient as default } from './factory'
