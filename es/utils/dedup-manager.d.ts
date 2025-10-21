/**
 * 请求去重管理器
 *
 * 防止相同请求重复发送，自动合并处理
 */
import type { ResponseData } from '../types';
/**
 * 去重统计信息
 */
export interface DeduplicationStats {
    /** 执行的请求数 */
    executions: number;
    /** 去重的请求数 */
    duplications: number;
    /** 节省的请求数 */
    savedRequests: number;
    /** 去重率 */
    deduplicationRate: number;
    /** 当前待处理请求数 */
    pendingCount: number;
}
/**
 * 去重管理器配置
 */
export interface DeduplicationManagerConfig {
    /** 最大待处理请求数 */
    maxPendingRequests?: number;
    /** 清理间隔（毫秒） */
    cleanupInterval?: number;
    /** 请求超时时间（毫秒） */
    requestTimeout?: number;
    /** 是否启用自动清理 */
    autoCleanup?: boolean;
}
/**
 * 请求去重管理器
 *
 * 特性：
 * - 自动合并相同请求
 * - LRU 缓存策略
 * - 自动清理过期请求
 * - 统计信息跟踪
 */
export declare class DeduplicationManager {
    private pendingRequests;
    private stats;
    private config;
    private cleanupTimer?;
    constructor(config?: DeduplicationManagerConfig);
    /**
     * 执行请求（带去重，性能优化）
     */
    execute<T = unknown>(key: string, requestFn: () => Promise<ResponseData<T>>): Promise<ResponseData<T>>;
    /**
     * 启动自动清理
     */
    private startAutoCleanup;
    /**
     * 停止自动清理
     */
    stopAutoCleanup(): void;
    /**
     * 清理最旧的请求（LRU）
     */
    private cleanupOldestRequest;
    /**
     * 清理超时的请求
     */
    cleanupTimeoutTasks(timeoutMs: number): number;
    /**
     * 取消指定请求
     */
    cancel(key: string): boolean;
    /**
     * 取消所有请求
     */
    cancelAll(): void;
    /**
     * 检查请求是否正在进行
     */
    isRunning(key: string): boolean;
    /**
     * 等待指定请求完成
     */
    waitFor<T = unknown>(key: string): Promise<ResponseData<T> | null>;
    /**
     * 等待所有请求完成
     */
    waitForAll(): Promise<void>;
    /**
     * 获取任务信息
     */
    getTaskInfo(key: string): {
        key: string;
        createdAt: number;
        refCount: number;
        duration: number;
    } | null;
    /**
     * 获取所有任务信息
     */
    getAllTaskInfo(): Array<{
        key: string;
        createdAt: number;
        refCount: number;
        duration: number;
    }>;
    /**
     * 获取统计信息
     */
    getStats(): DeduplicationStats;
    /**
     * 重置统计信息
     */
    resetStats(): void;
    /**
     * 获取待处理请求数量
     */
    getPendingCount(): number;
    /**
     * 获取所有待处理请求的键
     */
    getPendingKeys(): string[];
    /**
     * 获取引用计数最高的请求
     */
    getMostReferencedTask(): {
        key: string;
        refCount: number;
    } | null;
    /**
     * 获取运行时间最长的请求
     */
    getLongestRunningTask(): {
        key: string;
        duration: number;
    } | null;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<DeduplicationManagerConfig>): void;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
/**
 * 创建去重管理器
 */
export declare function createDeduplicationManager(config?: DeduplicationManagerConfig): DeduplicationManager;
/**
 * 全局去重管理器实例
 */
export declare const globalDeduplicationManager: DeduplicationManager;
