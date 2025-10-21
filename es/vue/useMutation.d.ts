import type { HttpClient, RequestConfig, ResponseData } from '../types';
import type { UseMutationOptions, UseMutationReturn } from '../types/vue';
/**
 * useMutation Hook
 * 用于处理变更操作（POST、PUT、DELETE 等）
 */
export declare function useMutation<T = any, V = any>(_client: HttpClient, mutationFn: (variables: V, config?: RequestConfig) => Promise<ResponseData<T>>, options?: UseMutationOptions<T, V>): UseMutationReturn<T, V>;
/**
 * 简化的变更 Hook，用于特定的 HTTP 方法
 */
export declare function usePost<T = any, D = any>(client: HttpClient, url: string, options?: UseMutationOptions<T, D>): UseMutationReturn<T, D>;
export declare function usePut<T = any, D = any>(client: HttpClient, url: string, options?: UseMutationOptions<T, D>): UseMutationReturn<T, D>;
export declare function usePatch<T = any, D = any>(client: HttpClient, url: string, options?: UseMutationOptions<T, D>): UseMutationReturn<T, D>;
export declare function useDelete<T = any>(client: HttpClient, url: string, options?: UseMutationOptions<T, void>): UseMutationReturn<T, void>;
