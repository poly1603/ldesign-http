import type { ApiEndpoint, HttpClient, HttpMethod, RequestConfig, ResponseData, TypedHttpClient, TypedRequestConfig, TypedResponseData } from './types';
/**
 * 类型安全的 HTTP 客户端包装器
 */
export declare class TypedHttpClientWrapper<TBaseResponse = any> implements TypedHttpClient<TBaseResponse> {
    private client;
    constructor(client: HttpClient);
    get interceptors(): {
        request: import("./types").InterceptorManager<import("./types").RequestInterceptor>;
        response: import("./types").InterceptorManager<import("./types").ResponseInterceptor>;
        error: import("./types").InterceptorManager<import("./types").ErrorInterceptor>;
    };
    request<T = TBaseResponse>(config: RequestConfig): Promise<ResponseData<T>>;
    get<T = TBaseResponse>(url: string, config?: RequestConfig): Promise<ResponseData<T>>;
    post<T = TBaseResponse, D = any>(url: string, data?: D, config?: RequestConfig): Promise<ResponseData<T>>;
    put<T = TBaseResponse, D = any>(url: string, data?: D, config?: RequestConfig): Promise<ResponseData<T>>;
    delete<T = TBaseResponse>(url: string, config?: RequestConfig): Promise<ResponseData<T>>;
    patch<T = TBaseResponse, D = any>(url: string, data?: D, config?: RequestConfig): Promise<ResponseData<T>>;
    head<T = TBaseResponse>(url: string, config?: RequestConfig): Promise<ResponseData<T>>;
    options<T = TBaseResponse>(url: string, config?: RequestConfig): Promise<ResponseData<T>>;
    cancelAll(reason?: string): void;
    getActiveRequestCount(): number;
    updateRetryConfig(config: any): void;
    getConfig(): any;
    clearCache(): Promise<void>;
    getConcurrencyStatus(): {
        activeCount: number;
        queuedCount: number;
        maxConcurrent: number;
        maxQueueSize: number;
    };
    cancelQueue(reason?: string): void;
    /**
     * 类型安全的端点调用
     */
    callEndpoint<TResponse = TBaseResponse, TRequest = any>(endpoint: ApiEndpoint<TResponse, TRequest>, data?: TRequest, config?: TypedRequestConfig<TRequest>): Promise<TypedResponseData<TResponse>>;
    /**
     * 批量请求
     */
    batch<T extends Record<string, any>>(requests: {
        [K in keyof T]: () => Promise<ResponseData<T[K]>>;
    }): Promise<{
        [K in keyof T]: ResponseData<T[K]>;
    }>;
    /**
     * 条件请求
     */
    conditionalRequest<T = TBaseResponse>(condition: boolean | (() => boolean), config: RequestConfig): Promise<ResponseData<T> | null>;
    /**
     * 重试请求直到成功
     */
    retryUntilSuccess<T = TBaseResponse>(config: RequestConfig, maxAttempts?: number, delay?: number): Promise<ResponseData<T>>;
    /**
     * 轮询请求
     */
    poll<T = TBaseResponse>(config: RequestConfig, options: {
        interval: number;
        maxAttempts?: number;
        condition?: (response: ResponseData<T>) => boolean;
    }): Promise<ResponseData<T>>;
    /**
     * 上传文件
     */
    upload(url: string, file: File | File[], config?: any): Promise<any>;
    /**
     * 下载文件
     */
    download(url: string, config?: any): Promise<any>;
}
/**
 * 创建类型安全的 HTTP 客户端
 */
export declare function createTypedHttpClient<TBaseResponse = any>(client: HttpClient): TypedHttpClient<TBaseResponse>;
/**
 * API 端点构建器
 */
export declare class ApiEndpointBuilder<TResponse = any, TRequest = any> {
    private endpoint;
    url(url: string): this;
    method(method: HttpMethod): this;
    transform(transform: (data: any) => TResponse): this;
    validate(validate: (data: TRequest) => boolean): this;
    build(): ApiEndpoint<TResponse, TRequest>;
}
/**
 * 创建 API 端点构建器
 */
export declare function createEndpoint<TResponse = any, TRequest = any>(): ApiEndpointBuilder<TResponse, TRequest>;
