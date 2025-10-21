import type { ConcurrencyConfig, RequestConfig, ResponseData } from '../types';
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
    execute<T = any>(requestFn: () => Promise<ResponseData<T>>, config: RequestConfig): Promise<ResponseData<T>>;
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
    waitForDeduplicatedRequest<T = any>(config: RequestConfig): Promise<ResponseData<T> | null>;
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
 * 请求去重管理器
 */
export declare class DeduplicationManager {
    private pendingRequests;
    private stats;
    /**
     * 执行请求（带去重）
     */
    execute<T = any>(key: string, requestFn: () => Promise<ResponseData<T>>): Promise<ResponseData<T>>;
    /**
     * 取消指定请求
     */
    cancel(key: string): void;
    /**
     * 取消所有请求
     */
    cancelAll(): void;
    /**
     * 获取待处理请求数量
     */
    getPendingCount(): number;
    /**
     * 获取所有待处理请求的键
     */
    getPendingKeys(): string[];
    /**
     * 检查请求是否正在进行
     */
    isRunning(key: string): boolean;
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
     * 等待指定请求完成
     */
    waitFor<T = any>(key: string): Promise<ResponseData<T> | null>;
    /**
     * 等待所有请求完成
     */
    waitForAll(): Promise<void>;
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
     * 清理超时的请求
     */
    cleanupTimeoutTasks(timeoutMs: number): number;
}
/**
 * 速率限制管理器
 */
export declare class RateLimitManager {
    private requests;
    private maxRequests;
    private timeWindow;
    constructor(maxRequests?: number, timeWindow?: number);
    /**
     * 检查是否可以发送请求
     */
    canMakeRequest(): boolean;
    /**
     * 记录请求
     */
    recordRequest(): void;
    /**
     * 获取下次可以请求的时间
     */
    getNextAvailableTime(): number;
    /**
     * 等待直到可以发送请求
     */
    waitForAvailability(): Promise<void>;
    /**
     * 重置计数器
     */
    reset(): void;
    /**
     * 获取当前状态
     */
    getStatus(): {
        currentRequests: number;
        maxRequests: number;
        timeWindow: number;
        nextAvailableTime: number;
    };
}
/**
 * 创建并发管理器
 */
export declare function createConcurrencyManager(config?: ConcurrencyConfig): ConcurrencyManager;
/**
 * 去重键生成器配置
 */
export interface DeduplicationKeyConfig {
    /** 是否包含请求方法 */
    includeMethod?: boolean;
    /** 是否包含URL */
    includeUrl?: boolean;
    /** 是否包含查询参数 */
    includeParams?: boolean;
    /** 是否包含请求体 */
    includeData?: boolean;
    /** 是否包含请求头 */
    includeHeaders?: boolean;
    /** 要包含的特定请求头 */
    specificHeaders?: string[];
    /** 自定义键生成函数 */
    customGenerator?: (config: RequestConfig) => string;
}
/**
 * 智能去重键生成器
 */
export declare class DeduplicationKeyGenerator {
    private config;
    constructor(config?: DeduplicationKeyConfig);
    /**
     * 生成去重键
     */
    generate(requestConfig: RequestConfig): string;
    /**
     * 序列化参数
     */
    private serializeParams;
    /**
     * 序列化数据
     */
    private serializeData;
    /**
     * 序列化请求头
     */
    private serializeHeaders;
    /**
     * 序列化特定请求头
     */
    private serializeSpecificHeaders;
}
/**
 * 创建去重管理器
 */
export declare function createDeduplicationManager(): DeduplicationManager;
/**
 * 创建去重键生成器
 */
export declare function createDeduplicationKeyGenerator(config?: DeduplicationKeyConfig): DeduplicationKeyGenerator;
/**
 * 创建速率限制管理器
 */
export declare function createRateLimitManager(maxRequests?: number, timeWindow?: number): RateLimitManager;
