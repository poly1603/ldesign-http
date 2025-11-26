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
} from './composables'

export {
  // 注入键
  HTTP_CLIENT_KEY,
  HTTP_CONFIG_KEY,
} from './lib/symbols'

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
  createHttpEnginePlugin,
  createDefaultHttpEnginePlugin,
  httpPlugin,
} from './plugin/plugin'

export type {
  HttpPluginOptions,
  HttpEnginePluginOptions,
} from './plugin/plugin'

// ==================== 类型定义 ====================

export type {
  HttpClient,
  RequestConfig,
  ResponseData,
} from './types'

// ==================== Vue 组件 ====================

export {
  // 全局配置提供者
  HttpProvider,
  // 声明式数据加载器
  HttpLoader,
  // 智能错误展示
  HttpError,
  // 可视化重试控制器
  HttpRetry,
  // 上传下载进度条
  HttpProgress,
} from './components'

export type {
  // HttpProvider 类型
  HttpProviderProps,
  HttpProviderContext,
  // HttpLoader 类型
  HttpLoaderProps,
  // HttpError 类型
  HttpErrorProps,
  // HttpRetry 类型
  HttpRetryProps,
  RetryEmits,
  RetryStatus,
  RetryHistoryItem,
  // HttpProgress 类型
  HttpProgressProps,
  HttpProgressEmits,
} from './components'

// ==================== Vue 指令 ====================
// TODO: 添加 Vue 指令

// ==================== 版本信息 ====================

export { version } from './constants/version'

// ==================== 默认导出 ====================

export { useHttp as default } from './composables/useHttp'
