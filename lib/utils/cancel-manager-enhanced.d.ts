/**
 * 增强取消管理器模块
 *
 * 提供高级请求取消管理功能
 */
import type { RequestConfig } from '../types';
import type { CancelToken } from './cancel-token';
/**
 * 请求元数据
 */
export interface RequestMetadata {
    /** 创建时间 */
    createdAt: number;
    /** 标签集合 */
    tags: Set<string>;
    /** 请求配置 */
    config?: RequestConfig;
    /** 关联的控制器 */
    controller: AbortController;
    /** 关联的令牌 */
    token?: CancelToken;
}
/**
 * 取消策略
 */
export interface CancelStrategy {
    /** 策略名称 */
    name: string;
    /** 评估是否应该取消 */
    shouldCancel: (metadata: RequestMetadata, requestId: string) => boolean;
    /** 获取取消原因 */
    getReason?: (metadata: RequestMetadata) => string;
}
/**
 * 增强取消管理器
 */
export declare class EnhancedCancelManager {
    private metadata;
    private strategies;
    private readonly builtInStrategies;
    constructor();
    /**
     * 注册请求
     */
    register(requestId: string, controller: AbortController, options?: {
        token?: CancelToken;
        tags?: string[];
        config?: RequestConfig;
    }): void;
    /**
     * 取消请求
     */
    cancel(requestId: string, reason?: string): boolean;
    /**
     * 批量取消
     */
    cancelBatch(requestIds: string[], reason?: string): number;
    /**
     * 按标签取消
     */
    cancelByTags(tags: string[], reason?: string): number;
    /**
     * 按策略取消
     */
    cancelByStrategy(strategyName: string, reason?: string): number;
    /**
     * 取消超时请求
     */
    cancelTimeout(timeout: number, reason?: string): number;
    /**
     * 条件取消
     */
    cancelWhere(predicate: (metadata: RequestMetadata, requestId: string) => boolean, reason?: string): number;
    /**
     * 取消所有请求
     */
    cancelAll(reason?: string): number;
    /**
     * 清理已完成的请求
     */
    cleanup(requestId: string): void;
    /**
     * 自动清理老旧请求
     */
    autoCleanup(maxAge?: number): number;
    /**
     * 添加策略
     */
    addStrategy(strategy: CancelStrategy): void;
    /**
     * 移除策略
     */
    removeStrategy(name: string): boolean;
    /**
     * 获取策略
     */
    getStrategy(name: string): CancelStrategy | undefined;
    /**
     * 获取所有策略名称
     */
    getStrategyNames(): string[];
    /**
     * 应用所有策略
     */
    applyStrategies(): number;
    /**
     * 获取指定标签的所有请求ID
     */
    getRequestIdsByTag(tag: string): string[];
    /**
     * 获取请求数量统计
     */
    getRequestCountByTag(): Map<string, number>;
    /**
     * 获取活跃请求
     */
    getActiveRequests(): Array<{
        id: string;
        tags: string[];
        age: number;
        url?: string;
    }>;
    /**
     * 获取统计信息
     */
    getStats(): {
        active: number;
        byTag: {
            [k: string]: number;
        };
        averageAge: number;
        oldestAge: number;
        strategies: string[];
    };
    /**
     * 为请求添加标签
     */
    addTags(requestId: string, ...tags: string[]): boolean;
    /**
     * 移除请求标签
     */
    removeTags(requestId: string, ...tags: string[]): boolean;
    /**
     * 获取请求标签
     */
    getTags(requestId: string): string[];
    /**
     * 检查请求是否存在
     */
    has(requestId: string): boolean;
    /**
     * 获取请求元数据
     */
    getMetadata(requestId: string): RequestMetadata | undefined;
    /**
     * 获取活跃请求数量
     */
    getActiveRequestCount(): number;
    /**
     * 创建合并的 AbortSignal
     */
    static createMergedSignal(signals: (AbortSignal | undefined)[]): AbortSignal;
}
/**
 * 创建增强取消管理器
 */
export declare function createEnhancedCancelManager(): EnhancedCancelManager;
