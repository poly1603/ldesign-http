import type { InjectionKey, Ref } from 'vue';
import type { HttpClient, RequestConfig } from '../types';
/**
 * HTTP 客户端注入键
 */
export declare const HTTP_CLIENT_KEY: InjectionKey<HttpClient>;
/**
 * 全局配置注入键
 */
export declare const HTTP_CONFIG_KEY: InjectionKey<Ref<RequestConfig>>;
/**
 * 提供 HTTP 客户端
 */
export declare function provideHttpClient(client: HttpClient, globalConfig?: RequestConfig): void;
/**
 * 注入 HTTP 客户端
 */
export declare function injectHttpClient(): HttpClient;
/**
 * 注入全局配置
 */
export declare function injectHttpConfig(): Ref<RequestConfig>;
/**
 * 主要的 HTTP Hook
 * 自动注入客户端和全局配置
 */
export declare function useHttp(): {
    client: HttpClient;
    globalConfig: Ref<RequestConfig, RequestConfig>;
    request: <T = any>(config: RequestConfig) => Promise<import("../types").ResponseData<T>>;
    get: <T = any>(url: string, config?: RequestConfig) => Promise<import("../types").ResponseData<T>>;
    post: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<import("../types").ResponseData<T>>;
    put: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<import("../types").ResponseData<T>>;
    delete: <T = any>(url: string, config?: RequestConfig) => Promise<import("../types").ResponseData<T>>;
    patch: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<import("../types").ResponseData<T>>;
    head: <T = any>(url: string, config?: RequestConfig) => Promise<import("../types").ResponseData<T>>;
    options: <T = any>(url: string, config?: RequestConfig) => Promise<import("../types").ResponseData<T>>;
    useRequest: <T = any>(config: RequestConfig, options?: any) => import(".").UseRequestReturn<T>;
    useQuery: <T = any>(queryKey: any, config: RequestConfig, options?: any) => import(".").UseQueryReturn<T>;
    useMutation: <T = any, V = any>(mutationFn: any, options?: any) => import(".").UseMutationReturn<T, V>;
    usePost: <T = any, D = any>(url: string, options?: any) => import(".").UseMutationReturn<T, D>;
    usePut: <T = any, D = any>(url: string, options?: any) => import(".").UseMutationReturn<T, D>;
    usePatch: <T = any, D = any>(url: string, options?: any) => import(".").UseMutationReturn<T, D>;
    useDelete: <T = any>(url: string, options?: any) => import(".").UseMutationReturn<T, void>;
    cancelAll: (reason?: string) => void;
    clearCache: () => Promise<void>;
    getActiveRequestCount: () => number;
    getConcurrencyStatus: () => {
        activeCount: number;
        queuedCount: number;
        maxConcurrent: number;
        maxQueueSize: number;
    };
};
/**
 * 创建资源 Hook
 * 用于 RESTful API 操作
 *
 * 注意: 这是一个轻量级的资源hook,用于依赖注入场景
 * 如需更完整的功能(loading状态、error处理等),请使用 useResource from './useResource'
 */
export declare function useResource<T = any>(baseUrl: string): {
    useList: (params?: Record<string, any>, options?: any) => import(".").UseQueryReturn<any>;
    useDetail: (id: string | number, options?: any) => import(".").UseQueryReturn<any>;
    useCreate: (options?: any) => import(".").UseMutationReturn<any, any>;
    useUpdate: (options?: any) => import(".").UseMutationReturn<any, any>;
    usePatch: (options?: any) => import(".").UseMutationReturn<any, any>;
    useDelete: (options?: any) => import(".").UseMutationReturn<any, any>;
    list: (params?: Record<string, any>) => Promise<import("../types").ResponseData<T[]>>;
    detail: (id: string | number) => Promise<import("../types").ResponseData<T>>;
    create: (data: T) => Promise<import("../types").ResponseData<T>>;
    update: (id: string | number, data: Partial<T>) => Promise<import("../types").ResponseData<T>>;
    patch: (id: string | number, data: Partial<T>) => Promise<import("../types").ResponseData<T>>;
    remove: (id: string | number) => Promise<import("../types").ResponseData<any>>;
};
/**
 * 分页查询 Hook
 */
export declare function usePagination<T = any>(baseUrl: string, initialPage?: number, initialPageSize?: number): {
    page: Ref<number, number>;
    pageSize: Ref<number, number>;
    total: Ref<number, number>;
    totalPages: import("vue").ComputedRef<number>;
    hasNextPage: import("vue").ComputedRef<boolean>;
    hasPrevPage: import("vue").ComputedRef<boolean>;
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (targetPage: number) => void;
    setPageSize: (newPageSize: number) => void;
    isStale: Ref<boolean>;
    isFetching: Ref<boolean>;
    dataUpdatedAt: Ref<number>;
    failureCount: Ref<number>;
    invalidate: () => void;
    execute: (config?: RequestConfig) => Promise<import("../types").ResponseData<{
        data: T[];
        total: number;
        page: number;
        pageSize: number;
    }>>;
    refresh: () => Promise<import("../types").ResponseData<{
        data: T[];
        total: number;
        page: number;
        pageSize: number;
    }>>;
    cancel: () => void;
    reset: () => void;
    canCancel: import("vue").ComputedRef<boolean>;
    data: Ref<{
        data: T[];
        total: number;
        page: number;
        pageSize: number;
    } | null, {
        data: T[];
        total: number;
        page: number;
        pageSize: number;
    } | null>;
    loading: Ref<boolean>;
    error: Ref<import("../types").HttpError | null>;
    finished: Ref<boolean>;
};
