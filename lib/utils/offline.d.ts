/**
 * 离线请求队列功能
 * 在网络离线时缓存请求，网络恢复后自动重试
 */
import type { RequestConfig, ResponseData } from '../types';
/**
 * 离线队列配置
 */
export interface OfflineQueueConfig {
    /** 是否启用离线队列 */
    enabled?: boolean;
    /** 最大队列大小 */
    maxQueueSize?: number;
    /** 持久化存储键 */
    storageKey?: string;
    /** 是否使用持久化存储 */
    persistent?: boolean;
    /** 自动重试间隔（毫秒） */
    retryInterval?: number;
    /** 最大重试次数 */
    maxRetries?: number;
}
/**
 * 离线队列统计
 */
export interface OfflineQueueStats {
    /** 队列中的请求数 */
    queuedCount: number;
    /** 已处理的请求数 */
    processedCount: number;
    /** 失败的请求数 */
    failedCount: number;
    /** 成功率 */
    successRate: number;
}
/**
 * 离线请求队列管理器
 *
 * 功能：
 * 1. 自动检测网络状态
 * 2. 离线时缓存请求
 * 3. 网络恢复后自动重试
 * 4. 支持持久化存储
 * 5. 智能重试策略
 */
export declare class OfflineQueueManager {
    private config;
    private queue;
    private isOnline;
    private retryTimer?;
    private stats;
    constructor(config?: OfflineQueueConfig);
    /**
     * 添加请求到离线队列
     */
    enqueue<T = any>(config: RequestConfig): Promise<ResponseData<T>>;
    /**
     * 处理队列中的请求
     */
    private processQueue;
    /**
     * 执行请求（需要注入实际的 HTTP 客户端）
     */
    private executeRequest;
    /**
     * 调度重试
     */
    private scheduleRetry;
    /**
     * 处理网络上线事件
     */
    private handleOnline;
    /**
     * 处理网络离线事件
     */
    private handleOffline;
    /**
     * 保存队列到持久化存储
     */
    private saveQueue;
    /**
     * 从持久化存储加载队列
     */
    private loadQueue;
    /**
     * 生成唯一 ID
     */
    private generateId;
    /**
     * 更新统计信息
     */
    private updateStats;
    /**
     * 获取统计信息
     */
    getStats(): OfflineQueueStats;
    /**
     * 清空队列
     */
    clear(): void;
    /**
     * 获取网络状态
     */
    isNetworkOnline(): boolean;
    /**
     * 销毁离线队列管理器
     */
    destroy(): void;
}
/**
 * 创建离线队列管理器
 */
export declare function createOfflineQueueManager(config?: OfflineQueueConfig): OfflineQueueManager;
