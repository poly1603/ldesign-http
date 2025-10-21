/**
 * 并发控制管理器
 *
 * 管理HTTP请求的并发数量和队列处理
 */
import type { ConcurrencyConfig, RequestConfig, ResponseData } from '../types';
import type { DeduplicationStats } from './dedup-manager';
import type { DeduplicationKeyConfig } from './request-dedup';
/**
 * 并发控制管理器
 */
export declare class ConcurrencyManager {
    private config;
    private activeRequests;
    private requestQueue;
    private requestCounter;
    private processingQueue;
    private deduplicationManager;
    private keyGenerator;
    constructor(config?: ConcurrencyConfig);
    /**
     * 执行请求（带并发控制和去重）
     */
    execute<T = unknown>(requestFn: () => Promise<ResponseData<T>>, config: RequestConfig): Promise<ResponseData<T>>;
    /**
     * 带并发控制的请求执行
     */
    private executeWithConcurrencyControl;
    /**
     * 执行任务
     */
    private executeTask;
    /**
     * 处理队列中的下一个任务（优化版）
     */
    private processQueue;
    /**
     * 取消所有排队的请求
     */
    cancelQueue(reason?: string): void;
    /**
     * 获取状态信息
     */
    getStatus(): {
        activeCount: number;
        queuedCount: number;
        maxConcurrent: number;
        maxQueueSize: number;
        deduplication: DeduplicationStats;
    };
    /**
     * 更新配置
     */
    updateConfig(config: Partial<ConcurrencyConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): Required<ConcurrencyConfig>;
    /**
     * 获取去重统计信息
     */
    getDeduplicationStats(): DeduplicationStats;
    /**
     * 重置去重统计信息
     */
    resetDeduplicationStats(): void;
    /**
     * 检查请求是否正在去重处理中
     */
    isRequestDeduplicating(config: RequestConfig): boolean;
    /**
     * 取消特定的去重请求
     */
    cancelDeduplicatedRequest(config: RequestConfig): void;
    /**
     * 等待特定去重请求完成
     */
    waitForDeduplicatedRequest<T = unknown>(config: RequestConfig): Promise<ResponseData<T> | null>;
    /**
     * 获取所有去重任务信息
     */
    getDeduplicationTasksInfo(): Array<{
        key: string;
        createdAt: number;
        refCount: number;
        duration: number;
    }>;
    /**
     * 清理超时的去重任务
     */
    cleanupTimeoutDeduplicationTasks(timeoutMs?: number): number;
    /**
     * 配置去重键生成器
     */
    configureDeduplicationKeyGenerator(config: DeduplicationKeyConfig): void;
    /**
     * 生成任务 ID
     */
    private generateTaskId;
}
/**
 * 创建并发管理器
 */
export declare function createConcurrencyManager(config?: ConcurrencyConfig): ConcurrencyManager;
export { createDeduplicationManager, DeduplicationManager } from './dedup-manager';
export type { DeduplicationStats } from './dedup-manager';
export { createRateLimitManager, RateLimitManager } from './rate-limit';
export { createDeduplicationKeyGenerator, DeduplicationKeyGenerator } from './request-dedup';
export type { DeduplicationKeyConfig } from './request-dedup';
