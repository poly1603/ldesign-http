/**
 * ===================
 * 核心类型导出
 * ===================
 */
export type { HttpPluginOptions, RequestState, UseMutationOptions, UseMutationReturn, UseQueryOptions, UseQueryReturn, UseRequestOptions, UseRequestReturn, } from '../types/vue';
/**
 * ===================
 * 基础 HTTP Composables
 * ===================
 */
export { HttpPlugin, install } from './plugin';
export { useDelete, useGet, usePatch, usePost, usePut, } from './useBasicHttp';
export { useForm } from './useForm';
/**
 * ===================
 * REST API Composables
 * ===================
 */
export { HTTP_CLIENT_KEY, HTTP_CONFIG_KEY, injectHttpClient, injectHttpConfig, provideHttpClient, useHttp as useInjectedHttp, } from './useHttp';
export { usePagination } from './useHttp';
export { useHttp } from './useHttpStandalone';
export { useMutation, } from './useMutation';
/**
 * ===================
 * 资源管理
 * ===================
 */
export { useNetworkStatus, } from './useNetworkStatus';
export type { UseNetworkStatusReturn, } from './useNetworkStatus';
export { useOptimisticList, useOptimisticUpdate, } from './useOptimisticUpdate';
/**
 * ===================
 * 高级功能
 * ===================
 */
export type { OptimisticUpdateOptions, } from './useOptimisticUpdate';
export { usePolling, usePollingTimes, usePollingUntil, } from './usePolling';
export type { PollingConfig, UsePollingReturn, } from './usePolling';
export { useQuery } from './useQuery';
export { useAsyncRequest, useRequest } from './useRequest';
export { useRequestQueue, } from './useRequestQueue';
/**
 * ===================
 * 新增便捷功能
 * ===================
 */
export type { RequestQueueConfig, } from './useRequestQueue';
export { useResource } from './useResource';
export { useDebouncedRequest, useThrottledRequest, } from './useThrottledRequest';
export type { ThrottleOptions, } from './useThrottledRequest';
