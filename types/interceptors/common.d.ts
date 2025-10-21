import type { ErrorInterceptor, HttpError, RequestInterceptor, ResponseInterceptor } from '../types';
/**
 * 请求日志拦截器
 */
export declare const requestLoggerInterceptor: RequestInterceptor;
/**
 * 响应日志拦截器
 */
export declare const responseLoggerInterceptor: ResponseInterceptor;
/**
 * 错误日志拦截器
 */
export declare const errorLoggerInterceptor: ErrorInterceptor;
/**
 * 认证拦截器工厂
 */
export declare function createAuthInterceptor(getToken: () => string | null): RequestInterceptor;
/**
 * 基础 URL 拦截器工厂
 */
export declare function createBaseURLInterceptor(baseURL: string): RequestInterceptor;
/**
 * 请求 ID 拦截器
 */
export declare const requestIdInterceptor: RequestInterceptor;
/**
 * 时间戳拦截器
 */
export declare const timestampInterceptor: RequestInterceptor;
/**
 * 内容类型拦截器
 */
export declare const contentTypeInterceptor: RequestInterceptor;
/**
 * 响应时间拦截器
 */
export declare function createResponseTimeInterceptor(): {
    request: RequestInterceptor;
    response: ResponseInterceptor;
};
/**
 * 状态码处理拦截器
 */
export declare const statusCodeInterceptor: ResponseInterceptor;
/**
 * 数据转换拦截器工厂
 */
export declare function createDataTransformInterceptor<T, R>(transform: (data: T) => R): ResponseInterceptor<R>;
/**
 * 重试拦截器工厂
 */
export declare function createRetryInterceptor(maxRetries?: number, retryDelay?: number, retryCondition?: (error: HttpError) => boolean): ErrorInterceptor;
