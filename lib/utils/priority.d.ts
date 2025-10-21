/**
 * 请求优先级管理模块
 * 提供请求优先级调度和队列管理功能
 */
import type { RequestConfig } from '../types';
/**
 * 请求优先级级别
 */
export declare enum Priority {
    CRITICAL = 0,// 关键请求（最高优先级）
    HIGH = 1,// 高优先级
    NORMAL = 2,// 正常优先级
    LOW = 3,// 低优先级
    IDLE = 4
}
/**
 * 优先级请求项
 */
export interface PriorityItem<T = any> {
    id: string;
    priority: Priority;
    config: RequestConfig;
    executor: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: any) => void;
    timestamp: number;
    retryCount?: number;
    abortController?: AbortController;
}
/**
 * 优先级队列配置
 */
export interface PriorityQueueConfig {
    maxConcurrent?: number;
    maxQueueSize?: number;
    queueTimeout?: number;
    priorityBoost?: boolean;
    boostInterval?: number;
}
/**
 * 优先级队列统计
 */
export interface PriorityQueueStats {
    totalQueued: number;
    totalProcessed: number;
    totalFailed: number;
    currentActive: number;
    queuedByPriority: Record<Priority, number>;
    averageWaitTime: number;
    averageProcessTime: number;
}
/**
 * 优先级请求队列（优化版）
 *
 * 优化点：
 * 1. 按需触发提权检查，而非定时检查
 * 2. 使用索引优化查找
 * 3. 减少不必要的遍历
 */
export declare class PriorityQueue<T = any> {
    private queue;
    private active;
    private config;
    private stats;
    private processing;
    private boostTimer?;
    private lastBoostCheck;
    private cachedQueueSize;
    private queueSizeDirty;
    constructor(config?: PriorityQueueConfig);
    /**
     * 添加请求到队列
     */
    enqueue(config: RequestConfig, executor: () => Promise<T>, priority?: Priority): Promise<T>;
    /**
     * 处理队列
     */
    private processQueue;
    /**
     * 执行请求项
     */
    private executeItem;
    /**
     * 获取下一个要处理的项
     */
    private getNextItem;
    /**
     * 移除队列项
     */
    private removeItem;
    /**
     * 启动优先级提升（优化版 - 按需检查）
     */
    private startPriorityBoost;
    /**
     * 执行优先级提升（优化版）
     */
    private performPriorityBoost;
    /**
     * 取消请求
     */
    cancel(id: string): boolean;
    /**
     * 取消所有请求
     */
    cancelAll(reason?: string): void;
    /**
     * 获取队列统计信息
     */
    getStats(): PriorityQueueStats;
    /**
     * 获取总队列大小（优化版：使用缓存）
     */
    private getTotalQueueSize;
    /**
     * 生成唯一ID
     */
    private generateId;
    /**
     * 清理资源
     */
    destroy(): void;
}
/**
 * 创建优先级队列
 */
export declare function createPriorityQueue<T = any>(config?: PriorityQueueConfig): PriorityQueue<T>;
/**
 * 判断请求优先级
 */
export declare function determinePriority(config: RequestConfig): Priority;
