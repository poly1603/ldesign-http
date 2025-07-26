import { RequestInterceptor, ResponseInterceptor, HttpError, HttpPlugin } from '../types/index.js';

/**
 * 拦截器插件
 * 提供常用的请求和响应拦截器
 */

/**
 * 认证拦截器配置
 */
interface AuthInterceptorConfig {
    /** 获取token的函数 */
    getToken: () => string | Promise<string>;
    /** token类型 */
    tokenType?: 'Bearer' | 'Basic' | string;
    /** 自定义header名称 */
    headerName?: string;
    /** token刷新函数 */
    refreshToken?: () => Promise<string>;
    /** 需要认证的URL模式 */
    urlPatterns?: RegExp[];
}
/**
 * 日志拦截器配置
 */
interface LogInterceptorConfig {
    /** 是否启用请求日志 */
    logRequests?: boolean;
    /** 是否启用响应日志 */
    logResponses?: boolean;
    /** 是否启用错误日志 */
    logErrors?: boolean;
    /** 自定义日志函数 */
    logger?: {
        info: (message: string, data?: any) => void;
        error: (message: string, data?: any) => void;
        warn: (message: string, data?: any) => void;
    };
}
/**
 * 创建认证拦截器
 */
declare function createAuthInterceptor(config: AuthInterceptorConfig): RequestInterceptor;
/**
 * 创建token刷新拦截器
 */
declare function createTokenRefreshInterceptor(config: AuthInterceptorConfig): ResponseInterceptor;
/**
 * 创建日志拦截器
 */
declare function createLogInterceptor(config?: LogInterceptorConfig): {
    request: RequestInterceptor;
    response: ResponseInterceptor;
};
/**
 * 创建基础URL拦截器
 */
declare function createBaseURLInterceptor(baseURL: string): RequestInterceptor;
/**
 * 创建超时拦截器
 */
declare function createTimeoutInterceptor(timeout: number): RequestInterceptor;
/**
 * 创建内容类型拦截器
 */
declare function createContentTypeInterceptor(contentType?: string): RequestInterceptor;
/**
 * 创建错误处理拦截器
 */
declare function createErrorHandlerInterceptor(errorHandler: (error: HttpError) => void | Promise<void>): ResponseInterceptor;
/**
 * 创建响应转换拦截器
 */
declare function createResponseTransformInterceptor<T, R>(transformer: (data: T) => R): ResponseInterceptor;
/**
 * 创建请求ID拦截器
 */
declare function createRequestIdInterceptor(headerName?: string): RequestInterceptor;
/**
 * 拦截器插件
 */
declare function createInterceptorsPlugin(interceptors: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
}): HttpPlugin;

export { createAuthInterceptor, createBaseURLInterceptor, createContentTypeInterceptor, createErrorHandlerInterceptor, createInterceptorsPlugin, createLogInterceptor, createRequestIdInterceptor, createResponseTransformInterceptor, createTimeoutInterceptor, createTokenRefreshInterceptor };
export type { AuthInterceptorConfig, LogInterceptorConfig };
