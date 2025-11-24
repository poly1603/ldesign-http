/**
 * @ldesign/http-vue
 *
 * Vue 3 集成库，基于 @ldesign/http-core
 * 提供 Vue 3 组合式函数、插件和指令
 *
 * @module @ldesign/http-vue
 * @version 0.1.0
 * @author ldesign
 * @license MIT
 */

// ==================== 核心导出 (重新导出 Core) ====================

// 重新导出所有 Core 功能
export * from '@ldesign/http-core'

// ==================== 组合式 API ====================

export {
  // 主要 Hook
  useHttp,
  useResource,
  usePagination,
  provideHttpClient,
  injectHttpClient,
  injectHttpConfig,
} from './composables/useHttp'

export {
  // 注入键
  HTTP_CLIENT_KEY,
  HTTP_CONFIG_KEY,
} from './symbols'

export {
  // 基础请求 Hook
  useRequest,
} from './composables/useRequest'

export {
  // 查询 Hook
  useQuery,
} from './composables/useQuery'

export {
  // 变更 Hook
  useMutation,
} from './composables/useMutation'

export {
  // 基础 HTTP 方法 Hook
  usePost,
  usePut,
  usePatch,
  useDelete,
  useGet,
} from './composables/useBasicHttp'

export {
  // 高级 Hook
  useForm,
} from './composables/useForm'

export {
  // 无限滚动
  useInfiniteScroll,
} from './composables/useInfiniteScroll'

export {
  // 轮询
  usePolling,
} from './composables/usePolling'

export {
  // 网络状态
  useNetworkStatus,
} from './composables/useNetworkStatus'

export {
  // 乐观更新
  useOptimisticUpdate,
} from './composables/useOptimisticUpdate'

export {
  // 请求队列
  useRequestQueue,
} from './composables/useRequestQueue'

export {
  // 节流请求
  useThrottledRequest,
} from './composables/useThrottledRequest'

// ==================== 插件系统 ====================

// Vue Plugin - 用于标准 Vue 应用
export {
  createHttpPlugin,
  HttpPlugin,
} from './plugin'

export type {
  HttpPluginOptions,
} from './plugin'

// Engine Plugin - 用于 LDesign Engine
export {
  createHttpEnginePlugin,
  createDefaultHttpEnginePlugin,
  httpPlugin,
} from './plugin'

export type {
  HttpEnginePluginOptions,
} from './plugin'

// ==================== 类型定义 ====================

export type {
  HttpClient,
  RequestConfig,
  ResponseData,
  HttpError,
  HttpAdapter,
  Interceptor,
  RequestInterceptor,
  ResponseInterceptor,
  CacheConfig,
  RetryConfig,
} from './types'

// ==================== Vue 组件 ====================
// TODO: 添加 TSX 组件（参考 @ldesign/i18n-vue 的实现方式）

// ==================== Vue 指令 ====================
// TODO: 添加 Vue 指令

// ==================== 版本信息 ====================

export { version } from './version'

// ==================== 默认导出 ====================

export { useHttp as default } from './composables/useHttp'
