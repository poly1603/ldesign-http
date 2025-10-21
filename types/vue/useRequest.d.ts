import type { MaybeRef } from 'vue';
import type { HttpClient, RequestConfig, ResponseData } from '../types';
import type { UseRequestOptions, UseRequestReturn } from '../types/vue';
/**
 * useRequest Hook
 * 用于处理 HTTP 请求的 Vue 3 Composition API Hook
 */
export declare function useRequest<T = any>(client: HttpClient, config: MaybeRef<RequestConfig>, options?: UseRequestOptions<T>): UseRequestReturn<T>;
/**
 * 简化的 useRequest Hook，用于单次请求
 */
export declare function useAsyncRequest<T = any>(_client: HttpClient, requestFn: () => Promise<ResponseData<T>>, options?: Omit<UseRequestOptions<T>, 'immediate'>): UseRequestReturn<T>;
