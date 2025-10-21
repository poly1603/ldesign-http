/**
 * 拦截器处理器模块
 *
 * 负责处理请求、响应和错误拦截器链
 */
import type { ErrorInterceptor, HttpError, InterceptorManager, RequestConfig, RequestInterceptor, ResponseData, ResponseInterceptor } from '../types';
/**
 * 拦截器处理器配置
 */
export interface InterceptorProcessorConfig {
    /** 请求拦截器管理器 */
    requestInterceptors: InterceptorManager<RequestInterceptor>;
    /** 响应拦截器管理器 */
    responseInterceptors: InterceptorManager<ResponseInterceptor>;
    /** 错误拦截器管理器 */
    errorInterceptors: InterceptorManager<ErrorInterceptor>;
}
/**
 * 拦截器处理器
 *
 * 管理和执行拦截器链
 */
export declare class InterceptorProcessor {
    private requestInterceptors;
    private responseInterceptors;
    private errorInterceptors;
    constructor(config?: InterceptorProcessorConfig);
    /**
     * 处理请求拦截器
     */
    processRequest(config: RequestConfig): Promise<RequestConfig>;
    /**
     * 处理响应拦截器
     */
    processResponse<T>(response: ResponseData<T>): Promise<ResponseData<T>>;
    /**
     * 处理错误拦截器
     */
    processError(error: HttpError): Promise<HttpError>;
    /**
     * 添加请求拦截器
     */
    addRequestInterceptor(fulfilled: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>, rejected?: (error: HttpError) => HttpError | Promise<HttpError>): number;
    /**
     * 添加响应拦截器
     */
    addResponseInterceptor<T = any>(fulfilled: (response: ResponseData<T>) => ResponseData<T> | Promise<ResponseData<T>>, rejected?: (error: HttpError) => HttpError | Promise<HttpError>): number;
    /**
     * 添加错误拦截器
     */
    addErrorInterceptor(fulfilled: (error: HttpError) => HttpError | Promise<HttpError>, rejected?: (error: HttpError) => HttpError | Promise<HttpError>): number;
    /**
     * 移除请求拦截器
     */
    removeRequestInterceptor(id: number): void;
    /**
     * 移除响应拦截器
     */
    removeResponseInterceptor(id: number): void;
    /**
     * 移除错误拦截器
     */
    removeErrorInterceptor(id: number): void;
    /**
     * 清空所有请求拦截器
     */
    clearRequestInterceptors(): void;
    /**
     * 清空所有响应拦截器
     */
    clearResponseInterceptors(): void;
    /**
     * 清空所有错误拦截器
     */
    clearErrorInterceptors(): void;
    /**
     * 清空所有拦截器
     */
    clearAll(): void;
    /**
     * 获取拦截器管理器
     */
    getInterceptors(): {
        request: InterceptorManager<RequestInterceptor>;
        response: InterceptorManager<ResponseInterceptor<unknown>>;
        error: InterceptorManager<ErrorInterceptor>;
    };
    /**
     * 获取拦截器统计
     */
    getStats(): {
        request: number;
        response: number;
        error: number;
    };
    /**
     * 创建拦截器链
     */
    createChain<T>(request: RequestConfig, adapter: (config: RequestConfig) => Promise<ResponseData<T>>): Promise<ResponseData<T>>;
    /**
     * 克隆拦截器处理器
     */
    clone(): InterceptorProcessor;
}
/**
 * 创建拦截器处理器
 */
export declare function createInterceptorProcessor(config?: InterceptorProcessorConfig): InterceptorProcessor;
/**
 * 创建组合拦截器
 *
 * 将多个拦截器组合成一个
 */
export declare function composeInterceptors<T>(...interceptors: Array<(value: T) => T | Promise<T>>): (value: T) => Promise<T>;
/**
 * 创建条件拦截器
 *
 * 根据条件决定是否执行拦截器
 */
export declare function conditionalInterceptor<T>(condition: (value: T) => boolean | Promise<boolean>, interceptor: (value: T) => T | Promise<T>): (value: T) => Promise<T>;
/**
 * 创建缓存拦截器
 */
export declare function createCacheInterceptor(cache: Map<string, any>, keyGenerator: (config: RequestConfig) => string): {
    request: (config: RequestConfig) => RequestConfig;
    response: <T>(response: ResponseData<T>) => ResponseData<T>;
};
/**
 * 创建重试拦截器
 */
export declare function createRetryInterceptor(maxRetries?: number, retryDelay?: number, shouldRetry?: (error: HttpError) => boolean): (error: HttpError) => Promise<never>;
/**
 * 创建日志拦截器
 */
export declare function createLoggingInterceptor(logger?: {
    log: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
}): {
    request: (config: RequestConfig) => RequestConfig;
    response: <T>(response: ResponseData<T>) => ResponseData<T>;
    error: (error: HttpError) => Promise<never>;
};
