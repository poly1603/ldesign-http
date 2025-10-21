import type { MaybeRef, Ref } from 'vue';
import type { RequestConfig } from '../types';
/**
 * 基础HTTP请求选项
 */
export interface BasicHttpOptions<T = unknown> {
    /** 是否立即执行请求 */
    immediate?: boolean;
    /** 是否在组件卸载时取消请求 */
    cancelOnUnmount?: boolean;
    /** 请求成功回调 */
    onSuccess?: (data: T) => void;
    /** 请求失败回调 */
    onError?: (error: Error) => void;
    /** 请求完成回调 */
    onFinally?: () => void;
}
/**
 * 基础HTTP请求返回值
 */
export interface BasicHttpReturn<T, D = unknown> {
    /** 响应数据 */
    data: Ref<T | null>;
    /** 加载状态 */
    loading: Ref<boolean>;
    /** 错误信息 */
    error: Ref<Error | null>;
    /** 是否完成 */
    finished: Ref<boolean>;
    /** 是否有错误 */
    hasError: Ref<boolean>;
    /** 执行请求 */
    execute: (data?: D) => Promise<T | null>;
    /** 重置状态 */
    reset: () => void;
    /** 清除错误 */
    clearError: () => void;
}
/**
 * 基础HTTP GET请求hook
 *
 * @example
 * ```ts
 * const { data, loading, error, execute } = useGet('/api/users')
 * ```
 */
export declare function useGet<T = any>(url: MaybeRef<string>, config?: MaybeRef<RequestConfig>, options?: BasicHttpOptions): BasicHttpReturn<T>;
/**
 * 基础HTTP POST请求hook
 *
 * @example
 * ```ts
 * const { data, loading, error, execute } = usePost('/api/users')
 * await execute({ name: 'John' })
 * ```
 */
export declare function usePost<T = unknown, D = unknown>(url: MaybeRef<string>, config?: MaybeRef<RequestConfig>, options?: BasicHttpOptions<T>): BasicHttpReturn<T, D>;
/**
 * 基础HTTP PUT请求hook
 */
export declare function usePut<T = unknown, D = unknown>(url: MaybeRef<string>, config?: MaybeRef<RequestConfig>, options?: BasicHttpOptions<T>): BasicHttpReturn<T, D>;
/**
 * 基础HTTP DELETE请求hook
 */
export declare function useDelete<T = unknown>(url: MaybeRef<string>, config?: MaybeRef<RequestConfig>, options?: BasicHttpOptions<T>): BasicHttpReturn<T>;
/**
 * 基础HTTP PATCH请求hook
 */
export declare function usePatch<T = unknown, D = unknown>(url: MaybeRef<string>, config?: MaybeRef<RequestConfig>, options?: BasicHttpOptions<T>): BasicHttpReturn<T, D>;
