import { InjectionKey, App, Ref } from 'vue';
import { HttpClientInstance, HttpClientConfig, ExtendedRequestConfig, HttpResponse, HttpError } from '../types/index.js';
export { RequestConfig } from '../types/index.js';

/**
 * Vue3集成
 * 提供Vue3的组合式函数和插件
 */

declare const HTTP_CLIENT_KEY: InjectionKey<HttpClientInstance>;
/**
 * 请求状态接口
 */
interface RequestState<T = any> {
    /** 响应数据 */
    data: Ref<T | null>;
    /** 加载状态 */
    loading: Ref<boolean>;
    /** 错误信息 */
    error: Ref<HttpError | null>;
    /** 是否已完成（成功或失败） */
    finished: Ref<boolean>;
    /** 是否被取消 */
    cancelled: Ref<boolean>;
}
/**
 * 请求选项
 */
interface UseRequestOptions<T = any> extends ExtendedRequestConfig {
    /** 是否立即执行请求 */
    immediate?: boolean;
    /** 初始数据 */
    initialData?: T;
    /** 成功回调 */
    onSuccess?: (data: T, response: HttpResponse<T>) => void;
    /** 错误回调 */
    onError?: (error: HttpError) => void;
    /** 完成回调（无论成功或失败） */
    onFinally?: () => void;
    /** 重置状态时是否保留数据 */
    resetOnExecute?: boolean;
}
/**
 * 请求结果接口
 */
interface UseRequestResult<T = any> extends RequestState<T> {
    /** 执行请求 */
    execute: (config?: Partial<ExtendedRequestConfig>) => Promise<HttpResponse<T>>;
    /** 取消请求 */
    cancel: () => void;
    /** 重置状态 */
    reset: () => void;
    /** 刷新（重新执行上次请求） */
    refresh: () => Promise<HttpResponse<T>>;
}
/**
 * Vue3 HTTP插件
 */
interface HttpPlugin {
    install(app: App, options?: HttpClientConfig): void;
}
/**
 * 创建HTTP插件
 */
declare function createHttpPlugin(config?: HttpClientConfig): HttpPlugin;
/**
 * 使用HTTP客户端
 */
declare function useHttp(): HttpClientInstance;
/**
 * 使用请求
 */
declare function useRequest<T = any>(url: string | (() => string), options?: UseRequestOptions<T>): UseRequestResult<T>;
/**
 * 使用GET请求
 */
declare function useGet<T = any>(url: string | (() => string), options?: Omit<UseRequestOptions<T>, 'method'>): UseRequestResult<T>;
/**
 * 使用POST请求
 */
declare function usePost<T = any>(url: string | (() => string), options?: Omit<UseRequestOptions<T>, 'method'>): UseRequestResult<T>;
/**
 * 使用PUT请求
 */
declare function usePut<T = any>(url: string | (() => string), options?: Omit<UseRequestOptions<T>, 'method'>): UseRequestResult<T>;
/**
 * 使用DELETE请求
 */
declare function useDelete<T = any>(url: string | (() => string), options?: Omit<UseRequestOptions<T>, 'method'>): UseRequestResult<T>;

export { ExtendedRequestConfig, HTTP_CLIENT_KEY, HttpClientConfig, HttpClientInstance, HttpError, HttpResponse, createHttpPlugin, useDelete, useGet, useHttp, usePost, usePut, useRequest };
export type { HttpPlugin, RequestState, UseRequestOptions, UseRequestResult };
