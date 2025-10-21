/**
 * 请求批处理优化器
 *
 * 功能：
 * 1. 自动合并相同端点的请求
 * 2. 智能分组批处理
 * 3. 请求去重和合并
 * 4. 动态批次大小调整
 */
import type { RequestConfig, ResponseData } from '../types';
/**
 * 批处理配置
 */
export interface BatchOptimizerConfig {
    /** 是否启用批处理 */
    enabled?: boolean;
    /** 最大批次大小 */
    maxBatchSize?: number;
    /** 批处理等待时间（ms） */
    batchWindow?: number;
    /** 是否自动合并相同请求 */
    mergeDuplicates?: boolean;
    /** 是否启用智能分组 */
    smartGrouping?: boolean;
    /** 动态调整批次大小 */
    dynamicBatching?: boolean;
}
/**
 * 批处理统计
 */
export interface BatchStats {
    totalBatches: number;
    totalRequests: number;
    mergedRequests: number;
    averageBatchSize: number;
    totalSavedRequests: number;
    compressionRatio: number;
}
/**
 * 请求批处理优化器
 *
 * 优化策略：
 * 1. 使用时间窗口收集请求
 * 2. 智能分组相似请求
 * 3. 合并重复请求
 * 4. 动态调整批次大小
 */
export declare class BatchOptimizer {
    private config;
    private groups;
    private stats;
    private currentBatchSize;
    private successRate;
    private latencyHistory;
    private signatureCache;
    private readonly MAX_CACHE_SIZE;
    constructor(config?: BatchOptimizerConfig);
    /**
     * 添加请求到批处理队列
     */
    addRequest<T = any>(config: RequestConfig, executor: (config: RequestConfig) => Promise<ResponseData<T>>): Promise<ResponseData<T>>;
    /**
     * 创建批处理组
     */
    private createGroup;
    /**
     * 获取组键
     */
    private getGroupKey;
    /**
     * 查找重复请求
     */
    private findDuplicate;
    /**
     * 获取请求签名（使用缓存优化）
     */
    private getRequestSignature;
    /**
     * 计算请求签名
     */
    private computeSignature;
    /**
     * 共享重复请求结果
     */
    private shareDuplicateResult;
    /**
     * 判断是否应该立即执行
     */
    private shouldExecuteNow;
    /**
     * 调度批处理执行
     */
    private scheduleExecution;
    /**
     * 执行批处理
     */
    private executeBatch;
    /**
     * 更新性能指标
     */
    private updateMetrics;
    /**
     * 动态调整批次大小
     */
    private adjustBatchSize;
    /**
     * 获取统计信息
     */
    getStats(): BatchStats;
    /**
     * 重置统计
     */
    resetStats(): void;
    /**
     * 获取当前批次大小
     */
    getCurrentBatchSize(): number;
    /**
     * 清理资源
     */
    destroy(): void;
    /**
     * 生成唯一 ID
     */
    private generateId;
}
/**
 * 创建批处理优化器
 */
export declare function createBatchOptimizer(config?: BatchOptimizerConfig): BatchOptimizer;
