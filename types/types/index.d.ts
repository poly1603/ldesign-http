/**
 * HTTP请求系统核心类型定义
 * 支持多种适配器：原生fetch、axios、alova
 */
declare enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS"
}
interface RequestConfig {
    /** 请求URL */
    url: string;
    /** HTTP方法 */
    method?: HttpMethod;
    /** 请求头 */
    headers?: Record<string, string>;
    /** 请求参数（GET请求的query参数） */
    params?: Record<string, any>;
    /** 请求体数据 */
    data?: any;
    /** 超时时间（毫秒） */
    timeout?: number;
    /** 基础URL */
    baseURL?: string;
    /** 响应类型 */
    responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream';
    /** 是否携带凭证 */
    withCredentials?: boolean;
    /** 自定义配置 */
    [key: string]: any;
}
interface HttpResponse<T = any> {
    /** 响应数据 */
    data: T;
    /** 状态码 */
    status: number;
    /** 状态文本 */
    statusText: string;
    /** 响应头 */
    headers: Record<string, string>;
    /** 原始请求配置 */
    config: RequestConfig;
    /** 原始响应对象 */
    raw?: any;
}
interface HttpError extends Error {
    /** 错误码 */
    code?: string;
    /** 请求配置 */
    config?: RequestConfig;
    /** 响应对象（如果有） */
    response?: HttpResponse;
    /** 是否为网络错误 */
    isNetworkError?: boolean;
    /** 是否为超时错误 */
    isTimeoutError?: boolean;
    /** 是否为取消错误 */
    isCancelError?: boolean;
}
interface RequestInterceptor {
    /** 请求拦截器 */
    onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    /** 请求错误拦截器 */
    onRejected?: (error: any) => any;
}
interface ResponseInterceptor {
    /** 响应拦截器 */
    onFulfilled?: <T = any>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
    /** 响应错误拦截器 */
    onRejected?: (error: HttpError) => any;
}
interface CacheConfig {
    /** 是否启用缓存 */
    enabled?: boolean;
    /** 缓存时间（毫秒） */
    ttl?: number;
    /** 缓存键生成函数 */
    keyGenerator?: (config: RequestConfig) => string;
    /** 缓存存储适配器 */
    storage?: CacheStorage;
}
interface CacheStorage {
    get: (key: string) => Promise<any> | any;
    set: (key: string, value: any, ttl?: number) => Promise<void> | void;
    delete: (key: string) => Promise<void> | void;
    clear: () => Promise<void> | void;
}
interface RetryConfig {
    /** 重试次数 */
    retries?: number;
    /** 重试延迟（毫秒） */
    retryDelay?: number;
    /** 重试条件判断函数 */
    retryCondition?: (error: HttpError) => boolean;
    /** 重试延迟计算函数 */
    retryDelayCalculator?: (retryCount: number, error: HttpError) => number;
}
interface HttpClientConfig extends RequestConfig {
    /** 拦截器配置 */
    interceptors?: {
        request?: RequestInterceptor[];
        response?: ResponseInterceptor[];
    };
    /** 缓存配置 */
    cache?: CacheConfig;
    /** 重试配置 */
    retry?: RetryConfig;
    /** 适配器类型 */
    adapter?: 'fetch' | 'axios' | 'alova';
    /** 自定义适配器 */
    customAdapter?: HttpAdapter;
}
interface HttpAdapter {
    /** 发送请求 */
    request: <T = any>(config: RequestConfig) => Promise<HttpResponse<T>>;
    /** 取消请求 */
    cancel?: (requestId?: string) => void;
    /** 获取适配器名称 */
    getName: () => string;
}
interface CancelToken {
    /** 取消原因 */
    reason?: string;
    /** 是否已取消 */
    isCancelled: boolean;
    /** 取消方法 */
    cancel: (reason?: string) => void;
    /** 取消Promise */
    promise: Promise<string>;
}
interface UploadProgress {
    /** 已上传字节数 */
    loaded: number;
    /** 总字节数 */
    total: number;
    /** 上传进度百分比 */
    percentage: number;
}
interface DownloadProgress {
    /** 已下载字节数 */
    loaded: number;
    /** 总字节数 */
    total: number;
    /** 下载进度百分比 */
    percentage: number;
}
type ProgressCallback = (progress: UploadProgress | DownloadProgress) => void;
interface ExtendedRequestConfig extends RequestConfig {
    /** 上传进度回调 */
    onUploadProgress?: ProgressCallback;
    /** 下载进度回调 */
    onDownloadProgress?: ProgressCallback;
    /** 取消令牌 */
    cancelToken?: CancelToken;
}
interface HttpClientInstance {
    /** 发送GET请求 */
    get: <T = any>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>;
    /** 发送POST请求 */
    post: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<HttpResponse<T>>;
    /** 发送PUT请求 */
    put: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<HttpResponse<T>>;
    /** 发送DELETE请求 */
    delete: <T = any>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>;
    /** 发送PATCH请求 */
    patch: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<HttpResponse<T>>;
    /** 发送HEAD请求 */
    head: <T = any>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>;
    /** 发送OPTIONS请求 */
    options: <T = any>(url: string, config?: RequestConfig) => Promise<HttpResponse<T>>;
    /** 通用请求方法 */
    request: <T = any>(config: ExtendedRequestConfig) => Promise<HttpResponse<T>>;
    /** 添加请求拦截器 */
    addRequestInterceptor: (interceptor: RequestInterceptor) => number;
    /** 添加响应拦截器 */
    addResponseInterceptor: (interceptor: ResponseInterceptor) => number;
    /** 移除拦截器 */
    removeInterceptor: (type: 'request' | 'response', id: number) => void;
    /** 创建取消令牌 */
    createCancelToken: () => CancelToken;
    /** 获取默认配置 */
    getDefaults: () => HttpClientConfig;
    /** 设置默认配置 */
    setDefaults: (config: Partial<HttpClientConfig>) => void;
}
interface AdapterFactory {
    /** 创建适配器实例 */
    create: (config: HttpClientConfig) => HttpAdapter;
    /** 获取适配器名称 */
    getName: () => string;
    /** 检查是否支持当前环境 */
    isSupported: () => boolean;
}
interface HttpPlugin {
    /** 插件名称 */
    name: string;
    /** 插件安装方法 */
    install: (client: HttpClientInstance, options?: any) => void;
    /** 插件卸载方法 */
    uninstall?: (client: HttpClientInstance) => void;
}
interface Middleware {
    /** 中间件名称 */
    name: string;
    /** 请求处理 */
    request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
    /** 响应处理 */
    response?: <T = any>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
    /** 错误处理 */
    error?: (error: HttpError) => HttpError | Promise<HttpError>;
}
type EventType = 'request' | 'response' | 'error' | 'retry' | 'cache-hit' | 'cache-miss';
interface EventListener {
    (event: any): void;
}
interface EventEmitter {
    /** 添加事件监听器 */
    on: (event: EventType, listener: EventListener) => void;
    /** 移除事件监听器 */
    off: (event: EventType, listener: EventListener) => void;
    /** 触发事件 */
    emit: (event: EventType, data: any) => void;
    /** 添加一次性事件监听器 */
    once: (event: EventType, listener: EventListener) => void;
}

export { HttpMethod };
export type { AdapterFactory, CacheConfig, CacheStorage, CancelToken, DownloadProgress, EventEmitter, EventListener, EventType, ExtendedRequestConfig, HttpAdapter, HttpClientConfig, HttpClientInstance, HttpError, HttpPlugin, HttpResponse, Middleware, ProgressCallback, RequestConfig, RequestInterceptor, ResponseInterceptor, RetryConfig, UploadProgress };
