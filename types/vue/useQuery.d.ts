import type { MaybeRef } from 'vue';
import type { HttpClient, RequestConfig } from '../types';
import type { UseQueryOptions, UseQueryReturn } from '../types/vue';
/**
 * useQuery Hook
 * 用于处理带缓存的查询请求
 */
export declare function useQuery<T = any>(client: HttpClient, queryKey: MaybeRef<string | (() => string)>, config: MaybeRef<RequestConfig>, options?: UseQueryOptions<T>): UseQueryReturn<T>;
