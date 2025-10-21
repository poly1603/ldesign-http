import type { ErrorInterceptor, HttpAdapter, HttpClient, HttpClientConfig, HttpError, InterceptorManager, RequestConfig, RequestInterceptor, ResponseData, ResponseInterceptor, RetryConfig } from './types';
import type { DownloadConfig, DownloadResult } from './utils/download';
import type { Priority } from './utils/priority';
import type { UploadConfig, UploadResult } from './utils/upload';
/**
 * HTTP 客户端实现
 *
 * 提供完整的 HTTP 请求功能，包括：
 * - 多适配器支持（Fetch、Axios、Alova）
 * - 智能缓存系统
 * - 自动重试机制
 * - 并发控制和请求去重
 * - 拦截器链
 * - 上传/下载功能
 * - 错误处理和恢复
 * - 性能监控
 *
 * @example
 * ```typescript
 * const client = new HttpClientImpl({
 *   baseURL: 'https://api.example.com',
 *   timeout: 10000,
 *   cache: { enabled: true },
 *   retry: { enabled: true, maxAttempts: 3 }
 * }, adapter)
 *
 * // 发送 GET 请求
 * const response = await client.get<User[]>('/users')
 *
 * // 发送 POST 请求
 * const newUser = await client.post<User>('/users', { name: 'John' })
 * ```
 */
export declare class HttpClientImpl implements HttpClient {
    private config;
    private adapter;
    private retryManager;
    private cancelManager;
    private cacheManager;
    private concurrencyManager;
    private monitor;
    private priorityQueue;
    private requestPool;
    private isDestroyed;
    interceptors: {
        request: InterceptorManager<RequestInterceptor>;
        response: InterceptorManager<ResponseInterceptor>;
        error: InterceptorManager<ErrorInterceptor>;
    };
    constructor(config?: HttpClientConfig, adapter?: HttpAdapter);
    /**
     * 发送请求（优化版）
     */
    request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>>;
    /**
     * 执行带重试的请求
     */
    private executeRequestWithRetry;
    /**
     * 执行单次请求
     */
    private executeRequest;
    /**
     * 执行实际的请求
     */
    private performRequest;
    /**
     * GET 请求
     */
    get<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>>;
    /**
     * POST 请求
     */
    post<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<ResponseData<T>>;
    /**
     * PUT 请求
     */
    put<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<ResponseData<T>>;
    /**
     * DELETE 请求
     */
    delete<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>>;
    /**
     * PATCH 请求
     */
    patch<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<ResponseData<T>>;
    /**
     * HEAD 请求
     */
    head<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>>;
    /**
     * OPTIONS 请求
     */
    options<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>>;
    /**
     * 取消所有请求
     */
    cancelAll(reason?: string): void;
    /**
     * 获取活跃请求数量
     */
    getActiveRequestCount(): number;
    /**
     * 更新重试配置
     */
    updateRetryConfig(config: Partial<RetryConfig>): void;
    /**
     * 设置配置
     */
    setConfig(config: Partial<HttpClientConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): HttpClientConfig;
    /**
     * 添加请求拦截器
     */
    addRequestInterceptor(fulfilled: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>, rejected?: (error: HttpError) => HttpError | Promise<HttpError>): number;
    /**
     * 添加响应拦截器
     */
    addResponseInterceptor<T = unknown>(fulfilled: (response: ResponseData<T>) => ResponseData<T> | Promise<ResponseData<T>>, rejected?: (error: HttpError) => HttpError | Promise<HttpError>): number;
    /**
     * 移除请求拦截器
     */
    removeRequestInterceptor(id: number): void;
    /**
     * 移除响应拦截器
     */
    removeResponseInterceptor(id: number): void;
    /**
     * 清空缓存
     */
    clearCache(): Promise<void>;
    /**
     * 获取并发状态
     */
    getConcurrencyStatus(): {
        activeCount: number;
        queuedCount: number;
        maxConcurrent: number;
        maxQueueSize: number;
        deduplication: import("./utils/dedup-manager").DeduplicationStats;
    };
    /**
     * 取消队列中的所有请求
     */
    cancelQueue(reason?: string): void;
    /**
     * 处理请求拦截器
     */
    private processRequestInterceptors;
    /**
     * 处理响应拦截器
     */
    private processResponseInterceptors;
    /**
     * 处理错误拦截器
     */
    private processErrorInterceptors;
    /**
     * 优化的配置合并（简化版，去除对象池开销）
     */
    private optimizedMergeConfig;
    /**
     * 上传文件
     */
    upload<T = unknown>(url: string, file: File | File[], config?: UploadConfig): Promise<UploadResult<T>>;
    /**
     * 上传单个文件
     */
    private uploadSingleFile;
    /**
     * 上传多个文件
     */
    private uploadMultipleFiles;
    /**
     * 下载文件
     */
    download(url: string, config?: DownloadConfig): Promise<DownloadResult>;
    /**
     * 获取性能监控统计
     */
    getPerformanceStats(): import("./utils/monitor").PerformanceStats;
    /**
     * 获取最近的请求指标
     */
    getRecentMetrics(count?: number): import("./utils/monitor").PerformanceMetrics[];
    /**
     * 获取慢请求列表
     */
    getSlowRequests(): import("./utils/monitor").PerformanceMetrics[];
    /**
     * 获取失败请求列表
     */
    getFailedRequests(): import("./utils/monitor").PerformanceMetrics[];
    /**
     * 启用性能监控
     */
    enableMonitoring(): void;
    /**
     * 禁用性能监控
     */
    disableMonitoring(): void;
    /**
     * 获取优先级队列统计
     */
    getPriorityQueueStats(): import("./utils/priority").PriorityQueueStats;
    /**
     * 获取连接池统计
     */
    getConnectionPoolStats(): import("./utils/pool").PoolStats;
    /**
     * 获取连接池详情
     */
    getConnectionDetails(): Map<string, import("./utils/pool").ConnectionInfo[]>;
    /**
     * 导出性能指标
     */
    exportMetrics(): {
        performance: import("./utils/monitor").PerformanceMetrics[];
        priorityQueue: import("./utils/priority").PriorityQueueStats;
        connectionPool: import("./utils/pool").PoolStats;
        concurrency: {
            activeCount: number;
            queuedCount: number;
            maxConcurrent: number;
            maxQueueSize: number;
            deduplication: import("./utils/dedup-manager").DeduplicationStats;
        };
        cache: import("./utils/cache").CacheStats | null;
    };
    /**
     * 设置请求优先级
     */
    setPriority(config: RequestConfig, priority: Priority): RequestConfig;
    /**
     * 销毁客户端，清理资源
     */
    destroy(): void;
    /**
     * 检查客户端是否已销毁
     */
    private checkDestroyed;
}
