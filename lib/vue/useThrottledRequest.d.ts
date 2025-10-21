import type { MaybeRef, Ref } from 'vue';
import type { HttpClient, RequestConfig } from '../types';
/**
 * 防抖/节流请求选项
 */
export interface ThrottleOptions {
    /** 延迟时间（毫秒） */
    delay?: number;
    /** 是否使用防抖（false为节流） */
    debounce?: boolean;
    /** 是否在前沿触发 */
    leading?: boolean;
    /** 是否在后沿触发 */
    trailing?: boolean;
}
/**
 * 防抖请求 Hook
 *
 * 防止用户快速点击导致的重复请求
 *
 * @example
 * ```typescript
 * const { execute, loading, data } = useDebouncedRequest(
 *   client,
 *   { url: '/api/search' },
 *   { delay: 300 }
 * )
 *
 * // 用户输入时调用,300ms内只发送最后一次请求
 * watch(searchQuery, (query) => {
 *   execute({ params: { q: query } })
 * })
 * ```
 */
export declare function useDebouncedRequest<T = any>(client: HttpClient, baseConfig: MaybeRef<RequestConfig>, options?: ThrottleOptions): {
    execute: (config?: RequestConfig) => Promise<T | null>;
    cancel: () => void;
    loading: Ref<boolean, boolean>;
    data: Ref<T | null>;
    error: Ref<Error | null, Error | null>;
};
/**
 * 节流请求 Hook
 *
 * 限制请求频率,在指定时间内最多执行一次
 *
 * @example
 * ```typescript
 * const { execute, loading } = useThrottledRequest(
 *   client,
 *   { url: '/api/save' },
 *   { delay: 1000 }
 * )
 *
 * // 1秒内多次调用只执行第一次
 * button.addEventListener('click', () => execute())
 * ```
 */
export declare function useThrottledRequest<T = any>(client: HttpClient, baseConfig: MaybeRef<RequestConfig>, options?: ThrottleOptions): {
    execute: (config?: RequestConfig) => Promise<T | null>;
    loading: Ref<boolean, boolean>;
    data: Ref<T | null>;
    error: Ref<Error | null, Error | null>;
};
