/**
 * @ldesign/http - 功能强大的HTTP请求库
 * 支持多种适配器：原生fetch、axios、alova
 * 支持Vue3集成，可扩展到其他框架
 */

// 核心类型
export type {
  HttpMethod,
  RequestConfig,
  ExtendedRequestConfig,
  HttpResponse,
  HttpError,
  RequestInterceptor,
  ResponseInterceptor,
  CacheConfig,
  CacheStorage,
  RetryConfig,
  HttpClientConfig,
  HttpAdapter,
  CancelToken,
  UploadProgress,
  DownloadProgress,
  ProgressCallback,
  HttpClientInstance,
  AdapterFactory,
  HttpPlugin,
  Middleware,
  EventType,
  EventListener,
  EventEmitter
} from './types'

// 核心类和函数
export { BaseHttpClient } from './core/HttpClient'
export {
  HttpClient,
  createHttpClient,
  createFetchHttpClient,
  createAxiosHttpClient,
  createAlovaHttpClient
} from './core/HttpClientImpl'

// 适配器
export {
  FetchAdapter,
  createFetchAdapter,
  isFetchSupported
} from './adapters/FetchAdapter'

export {
  AxiosAdapter,
  createAxiosAdapter,
  isAxiosSupported
} from './adapters/AxiosAdapter'

export {
  AlovaAdapter,
  createAlovaAdapter,
  isAlovaSupported
} from './adapters/AlovaAdapter'

// 缓存插件
export {
  MemoryCacheStorage,
  LocalStorageCacheStorage,
  SessionStorageCacheStorage,
  CacheManager,
  createCachePlugin,
  createMemoryCache,
  createLocalStorageCache,
  createSessionStorageCache
} from './plugins/cache'

// 重试插件
export {
  RetryStrategy,
  RetryManager,
  createRetryPlugin,
  createFixedRetryConfig,
  createExponentialRetryConfig,
  createLinearRetryConfig,
  createCustomRetryConfig
} from './plugins/retry'
export type { ExtendedRetryConfig } from './plugins/retry'

// 拦截器插件
export {
  createAuthInterceptor,
  createTokenRefreshInterceptor,
  createLogInterceptor,
  createBaseURLInterceptor,
  createTimeoutInterceptor,
  createContentTypeInterceptor,
  createErrorHandlerInterceptor,
  createResponseTransformInterceptor,
  createRequestIdInterceptor,
  createInterceptorsPlugin
} from './plugins/interceptors'
export type {
  AuthInterceptorConfig,
  LogInterceptorConfig
} from './plugins/interceptors'

// Vue3集成
export {
  HTTP_CLIENT_KEY,
  createHttpPlugin,
  useHttp,
  useRequest,
  useGet,
  usePost,
  usePut,
  useDelete
} from './vue'
export type {
  RequestState,
  UseRequestOptions,
  UseRequestResult,
  HttpPlugin as VueHttpPlugin
} from './vue'

// 默认实例
const defaultClient = createHttpClient()

/**
 * 默认HTTP客户端实例的便捷方法
 */
export const http = {
  // HTTP方法
  get: defaultClient.get.bind(defaultClient),
  post: defaultClient.post.bind(defaultClient),
  put: defaultClient.put.bind(defaultClient),
  delete: defaultClient.delete.bind(defaultClient),
  patch: defaultClient.patch.bind(defaultClient),
  head: defaultClient.head.bind(defaultClient),
  options: defaultClient.options.bind(defaultClient),
  request: defaultClient.request.bind(defaultClient),

  // 拦截器
  addRequestInterceptor: defaultClient.addRequestInterceptor.bind(defaultClient),
  addResponseInterceptor: defaultClient.addResponseInterceptor.bind(defaultClient),
  removeInterceptor: defaultClient.removeInterceptor.bind(defaultClient),

  // 配置
  getDefaults: defaultClient.getDefaults.bind(defaultClient),
  setDefaults: defaultClient.setDefaults.bind(defaultClient),

  // 取消令牌
  createCancelToken: defaultClient.createCancelToken.bind(defaultClient),

  // 事件
  on: defaultClient.on.bind(defaultClient),
  off: defaultClient.off.bind(defaultClient),
  emit: defaultClient.emit.bind(defaultClient),
  once: defaultClient.once.bind(defaultClient),

  // 获取客户端实例
  getInstance: () => defaultClient
}

/**
 * 创建新的HTTP客户端实例
 */
export function create(config?: HttpClientConfig) {
  return createHttpClient(config)
}

/**
 * 快速创建带有常用配置的HTTP客户端
 */
export function createQuickClient(options: {
  baseURL?: string
  timeout?: number
  adapter?: 'fetch' | 'axios' | 'alova'
  enableCache?: boolean
  enableRetry?: boolean
  enableLog?: boolean
  authToken?: string | (() => string | Promise<string>)
}) {
  const {
    baseURL,
    timeout = 10000,
    adapter = 'fetch',
    enableCache = false,
    enableRetry = false,
    enableLog = false,
    authToken
  } = options

  const config: HttpClientConfig = {
    baseURL,
    timeout,
    adapter
  }

  const client = createHttpClient(config)

  // 启用缓存
  if (enableCache) {
    const cachePlugin = createCachePlugin({
      enabled: true,
      ttl: 5 * 60 * 1000 // 5分钟
    })
    cachePlugin.install(client)
  }

  // 启用重试
  if (enableRetry) {
    const retryPlugin = createRetryPlugin({
      retries: 3,
      retryDelay: 1000,
      strategy: RetryStrategy.EXPONENTIAL
    })
    retryPlugin.install(client)
  }

  // 启用日志
  if (enableLog) {
    const logInterceptors = createLogInterceptor({
      logRequests: true,
      logResponses: true,
      logErrors: true
    })
    client.addRequestInterceptor(logInterceptors.request)
    client.addResponseInterceptor(logInterceptors.response)
  }

  // 添加认证
  if (authToken) {
    const authInterceptor = createAuthInterceptor({
      getToken: typeof authToken === 'string' ? () => authToken : authToken
    })
    client.addRequestInterceptor(authInterceptor)
  }

  return client
}

// 默认导出
export default http
