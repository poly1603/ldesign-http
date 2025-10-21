/**
 * 请求批处理功能
 * 将多个请求合并为一个批量请求，减少网络开销
 */
import type { RequestConfig, ResponseData } from '../types';
/**
 * 批处理配置
 */
export interface BatchConfig {
    /** 批处理窗口时间（毫秒） */
    windowMs?: number;
    /** 最大批处理大小 */
    maxBatchSize?: number;
    /** 是否启用批处理 */
    enabled?: boolean;
    /** 批处理端点 */
    endpoint?: string;
    /** 自定义批处理请求构建器 */
    requestBuilder?: (requests: RequestConfig[]) => RequestConfig;
    /** 自定义批处理响应解析器 */
    responseParser?: (response: ResponseData) => ResponseData[];
}
/**
 * 批处理统计
 */
export interface BatchStats {
    /** 总请求数 */
    totalRequests: number;
    /** 批处理次数 */
    batchCount: number;
    /** 节省的请求数 */
    savedRequests: number;
    /** 平均批处理大小 */
    averageBatchSize: number;
    /** 批处理效率（节省比例） */
    efficiency: number;
}
/**
 * 请求批处理管理器
 *
 * 优化点：
 * 1. 智能批处理窗口，自动调整批处理时机
 * 2. 支持优先级，高优先级请求可以立即发送
 * 3. 自动错误处理和重试
 * 4. 详细的批处理统计
 */
export declare class BatchManager {
    private config;
    private pendingBatch;
    private batchTimer?;
    private stats;
    constructor(config?: BatchConfig);
    /**
     * 添加请求到批处理队列
     */
    add<T = any>(config: RequestConfig): Promise<ResponseData<T>>;
    /**
     * 调度批处理
     */
    private scheduleBatch;
    /**
     * 立即执行批处理
     */
    flush(): Promise<void>;
    /**
     * 执行批处理请求（需要注入实际的 HTTP 客户端）
     */
    private executeBatchRequest;
    /**
     * 默认批处理请求构建器
     */
    private defaultRequestBuilder;
    /**
     * 默认批处理响应解析器
     */
    private defaultResponseParser;
    /**
     * 更新统计信息
     */
    private updateStats;
    /**
     * 获取统计信息
     */
    getStats(): BatchStats;
    /**
     * 重置统计信息
     */
    resetStats(): void;
    /**
     * 获取待处理请求数量
     */
    getPendingCount(): number;
    /**
     * 清空待处理请求
     */
    clear(): void;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<BatchConfig>): void;
    /**
     * 销毁批处理管理器
     */
    destroy(): void;
}
/**
 * 创建批处理管理器
 */
export declare function createBatchManager(config?: BatchConfig): BatchManager;
