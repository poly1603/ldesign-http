/**
 * 请求执行器模块
 *
 * 负责实际的请求执行逻辑，包括缓存、并发控制、重试等
 */
import type { HttpAdapter, RequestConfig, ResponseData } from '../types';
import type { CacheManager } from '../utils/cache';
import type { ConcurrencyManager } from '../utils/concurrency';
import type { RetryManager } from '../utils/error';
import type { RequestMonitor } from '../utils/monitor';
import type { PriorityQueue } from '../utils/priority';
/**
 * 请求执行器配置
 */
export interface RequestExecutorConfig {
    /** HTTP适配器 */
    adapter: HttpAdapter;
    /** 缓存管理器 */
    cacheManager: CacheManager;
    /** 并发管理器 */
    concurrencyManager: ConcurrencyManager;
    /** 重试管理器 */
    retryManager: RetryManager;
    /** 监控器 */
    monitor: RequestMonitor;
    /** 优先级队列 */
    priorityQueue?: PriorityQueue;
}
/**
 * 请求执行器
 *
 * 封装请求执行的核心逻辑
 */
export declare class RequestExecutor {
    private config;
    constructor(config: RequestExecutorConfig);
    /**
     * 执行请求
     */
    execute<T = unknown>(requestConfig: RequestConfig, options?: {
        skipCache?: boolean;
        skipRetry?: boolean;
        requestId?: string;
    }): Promise<ResponseData<T>>;
    /**
     * 使用优先级队列执行
     */
    private executeWithPriority;
    /**
     * 执行带重试的请求
     */
    private executeWithRetry;
    /**
     * 执行单次请求
     */
    private executeSingle;
    /**
     * 执行实际的请求
     */
    private performRequest;
    /**
     * 批量执行请求
     */
    executeBatch<T = unknown>(configs: RequestConfig[], options?: {
        parallel?: boolean;
        maxConcurrency?: number;
        continueOnError?: boolean;
    }): Promise<Array<{
        success: boolean;
        data?: ResponseData<T>;
        error?: Error;
    }>>;
    /**
     * 带超时的请求执行
     */
    executeWithTimeout<T>(config: RequestConfig, timeout: number): Promise<ResponseData<T>>;
    /**
     * 带取消令牌的请求执行
     */
    executeWithCancellation<T>(config: RequestConfig, signal: AbortSignal): Promise<ResponseData<T>>;
    /**
     * 获取执行器状态
     */
    getStatus(): {
        concurrency: {
            activeCount: number;
            queuedCount: number;
            maxConcurrent: number;
            maxQueueSize: number;
            deduplication: import("../utils/dedup-manager").DeduplicationStats;
        };
        cache: {
            size: any;
            hits: number;
            misses: number;
        };
        monitor: import("../utils/monitor").PerformanceMetrics[];
    };
    /**
     * 清理资源
     */
    cleanup(): void;
}
/**
 * 创建请求执行器
 */
export declare function createRequestExecutor(config: RequestExecutorConfig): RequestExecutor;
