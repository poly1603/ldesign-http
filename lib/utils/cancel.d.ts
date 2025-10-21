import type { RequestConfig } from '../types';
/**
 * 取消令牌接口
 */
export interface CancelToken {
    /** 取消原因 */
    reason?: string;
    /** 是否已取消 */
    isCancelled: boolean;
    /** 取消回调 */
    promise: Promise<string>;
    /** 抛出取消错误 */
    throwIfRequested: () => void;
}
/**
 * 取消令牌实现
 */
export declare class CancelTokenImpl implements CancelToken {
    isCancelled: boolean;
    reason?: string;
    promise: Promise<string>;
    private resolvePromise;
    constructor();
    /**
     * 取消请求
     */
    cancel(reason?: string): void;
    /**
     * 如果已取消则抛出错误
     */
    throwIfRequested(): void;
}
/**
 * 取消令牌源
 */
export declare class CancelTokenSource {
    token: CancelToken;
    constructor();
    /**
     * 取消请求
     */
    cancel(reason?: string): void;
}
/**
 * 请求取消管理器
 */
export declare class CancelManager {
    private requests;
    private cancelTokens;
    /**
     * 创建取消令牌源
     */
    static source(): CancelTokenSource;
    /**
     * 注册请求
     */
    register(requestId: string, controller: AbortController, token?: CancelToken): void;
    /**
     * 取消指定请求
     */
    cancel(requestId: string, reason?: string): void;
    /**
     * 取消所有请求
     */
    cancelAll(reason?: string): void;
    /**
     * 清理已完成的请求
     */
    cleanup(requestId: string): void;
    /**
     * 获取活跃请求数量
     */
    getActiveRequestCount(): number;
    /**
     * 检查请求是否已取消
     */
    isCancelled(requestId: string): boolean;
    /**
     * 创建合并的 AbortSignal
     */
    createMergedSignal(signals: (AbortSignal | undefined)[]): AbortSignal;
}
/**
 * 请求元数据
 */
interface RequestMetadata {
    source: CancelTokenSource;
    tags: Set<string>;
    createdAt: number;
    config?: RequestConfig;
}
/**
 * 增强的取消管理器配置
 */
export interface EnhancedCancelConfig {
    /** 默认超时时间（毫秒） */
    defaultTimeout?: number;
    /** 是否自动清理已完成的请求 */
    autoCleanup?: boolean;
    /** 清理间隔（毫秒） */
    cleanupInterval?: number;
}
/**
 * 增强的取消管理器
 *
 * 在基础取消管理器之上添加了标签管理、批量操作、统计等功能
 */
export declare class EnhancedCancelManager extends CancelManager {
    private metadata;
    private config;
    private cleanupTimer?;
    constructor(config?: EnhancedCancelConfig);
    /**
     * 创建并注册带标签的取消令牌
     */
    createWithTags(requestId: string, tags?: string[], config?: RequestConfig): CancelTokenSource;
    /**
     * 批量取消请求
     */
    cancelBatch(requestIds: string[], reason?: string): number;
    /**
     * 按标签取消请求
     */
    cancelByTag(tag: string, reason?: string): number;
    /**
     * 按多个标签取消请求（满足任一标签）
     */
    cancelByTags(tags: string[], reason?: string): number;
    /**
     * 取消超时的请求
     */
    cancelTimeout(timeout: number, reason?: string): number;
    /**
     * 取消匹配条件的请求
     */
    cancelWhere(predicate: (metadata: RequestMetadata, requestId: string) => boolean, reason?: string): number;
    /**
     * 获取指定标签的所有请求ID
     */
    getRequestIdsByTag(tag: string): string[];
    /**
     * 获取按标签分组的请求数量
     */
    getRequestCountByTag(): Map<string, number>;
    /**
     * 获取所有活跃请求的详细信息
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
        oldestRequest: {
            id: string;
            age: number;
            url?: string;
        } | null;
    };
    /**
     * 获取最老的请求信息
     */
    getOldestRequest(): {
        id: string;
        age: number;
        url?: string;
    } | null;
    /**
     * 检查请求是否存在
     */
    has(requestId: string): boolean;
    /**
     * 获取请求的标签
     */
    getTags(requestId: string): string[];
    /**
     * 为请求添加标签
     */
    addTags(requestId: string, ...tags: string[]): boolean;
    /**
     * 移除请求的标签
     */
    removeTags(requestId: string, ...tags: string[]): boolean;
    /**
     * 清理指定请求
     */
    cleanup(requestId: string): void;
    /**
     * 清理所有已完成的请求
     */
    cleanupAll(): void;
    /**
     * 启动自动清理
     */
    private startAutoCleanup;
    /**
     * 停止自动清理
     */
    stopAutoCleanup(): void;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<EnhancedCancelConfig>): void;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
/**
 * 全局取消管理器实例（使用增强版）
 */
export declare const globalCancelManager: EnhancedCancelManager;
/**
 * 创建取消令牌源
 */
export declare function createCancelTokenSource(): CancelTokenSource;
/**
 * 创建增强的取消管理器
 */
export declare function createEnhancedCancelManager(config?: EnhancedCancelConfig): EnhancedCancelManager;
/**
 * 检查是否为取消错误
 */
export declare function isCancelError(error: any): boolean;
/**
 * 超时取消令牌
 */
export declare function createTimeoutCancelToken(timeout: number): CancelTokenSource;
export {};
