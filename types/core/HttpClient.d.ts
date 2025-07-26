import { HttpClientInstance, HttpClientConfig, HttpAdapter, RequestInterceptor, ResponseInterceptor, Middleware, EventType, EventListener, RequestConfig, HttpResponse, ExtendedRequestConfig, HttpError, CancelToken } from '../types/index.js';

/**
 * HTTP客户端抽象基类
 * 提供统一的接口和通用功能实现
 */

declare abstract class BaseHttpClient implements HttpClientInstance {
    protected config: HttpClientConfig;
    protected adapter: HttpAdapter;
    protected requestInterceptors: Map<number, RequestInterceptor>;
    protected responseInterceptors: Map<number, ResponseInterceptor>;
    protected middlewares: Middleware[];
    protected eventListeners: Map<EventType, EventListener[]>;
    private interceptorId;
    constructor(config?: HttpClientConfig);
    /**
     * 获取默认配置
     */
    protected getDefaultConfig(): HttpClientConfig;
    /**
     * 创建适配器实例
     */
    protected abstract createAdapter(): HttpAdapter;
    /**
     * 初始化事件监听器
     */
    protected initializeEventListeners(): void;
    /**
     * 合并配置
     */
    protected mergeConfig(defaultConfig: HttpClientConfig, userConfig: HttpClientConfig): HttpClientConfig;
    /**
     * GET请求
     */
    get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
    /**
     * POST请求
     */
    post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
    /**
     * PUT请求
     */
    put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
    /**
     * DELETE请求
     */
    delete<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
    /**
     * PATCH请求
     */
    patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
    /**
     * HEAD请求
     */
    head<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
    /**
     * OPTIONS请求
     */
    options<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
    /**
     * 通用请求方法
     */
    request<T = any>(config: ExtendedRequestConfig): Promise<HttpResponse<T>>;
    /**
     * 合并请求配置
     */
    protected mergeRequestConfig(config: ExtendedRequestConfig): ExtendedRequestConfig;
    /**
     * 执行请求拦截器
     */
    protected executeRequestInterceptors(config: ExtendedRequestConfig): Promise<ExtendedRequestConfig>;
    /**
     * 执行响应拦截器
     */
    protected executeResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>>;
    /**
     * 带重试机制的请求
     */
    protected requestWithRetry<T>(config: ExtendedRequestConfig, retryCount?: number): Promise<HttpResponse<T>>;
    /**
     * 延迟函数
     */
    protected delay(ms: number): Promise<void>;
    /**
     * 检查缓存
     */
    protected checkCache<T>(config: ExtendedRequestConfig): Promise<HttpResponse<T> | null>;
    /**
     * 缓存响应
     */
    protected cacheResponse<T>(config: ExtendedRequestConfig, response: HttpResponse<T>): Promise<void>;
    /**
     * 创建HTTP错误对象
     */
    protected createHttpError(error: any, config?: ExtendedRequestConfig): HttpError;
    /**
     * 添加请求拦截器
     */
    addRequestInterceptor(interceptor: RequestInterceptor): number;
    /**
     * 添加响应拦截器
     */
    addResponseInterceptor(interceptor: ResponseInterceptor): number;
    /**
     * 移除拦截器
     */
    removeInterceptor(type: 'request' | 'response', id: number): void;
    /**
     * 创建取消令牌
     */
    createCancelToken(): CancelToken;
    /**
     * 获取默认配置
     */
    getDefaults(): HttpClientConfig;
    /**
     * 设置默认配置
     */
    setDefaults(config: Partial<HttpClientConfig>): void;
    /**
     * 添加事件监听器
     */
    on(event: EventType, listener: EventListener): void;
    /**
     * 移除事件监听器
     */
    off(event: EventType, listener: EventListener): void;
    /**
     * 触发事件
     */
    emit(event: EventType, data: any): void;
    /**
     * 添加一次性事件监听器
     */
    once(event: EventType, listener: EventListener): void;
}

export { BaseHttpClient };
