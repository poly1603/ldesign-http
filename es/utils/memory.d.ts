/**
 * 内存监控配置
 */
export interface MemoryMonitorConfig {
    /** 是否启用监控 */
    enabled?: boolean;
    /** 监控间隔（毫秒） */
    interval?: number;
    /** 内存警告阈值（MB） */
    warningThreshold?: number;
    /** 内存危险阈值（MB） */
    dangerThreshold?: number;
    /** 自动清理 */
    autoCleanup?: boolean;
    /** 清理回调 */
    onCleanup?: () => void;
    /** 警告回调 */
    onWarning?: (usage: MemoryUsage) => void;
    /** 危险回调 */
    onDanger?: (usage: MemoryUsage) => void;
}
/**
 * 内存使用情况
 */
export interface MemoryUsage {
    /** 已使用内存（MB） */
    used: number;
    /** 总内存（MB） */
    total: number;
    /** 使用率 */
    percentage: number;
    /** 时间戳 */
    timestamp: number;
}
/**
 * 内存统计
 */
export interface MemoryStats {
    /** 当前内存使用 */
    current: MemoryUsage;
    /** 峰值内存使用 */
    peak: MemoryUsage;
    /** 平均内存使用 */
    average: number;
    /** 警告次数 */
    warningCount: number;
    /** 危险次数 */
    dangerCount: number;
    /** 清理次数 */
    cleanupCount: number;
}
/**
 * 内存监控管理器
 *
 * 功能：
 * 1. 实时监控内存使用
 * 2. 内存使用预警
 * 3. 自动清理机制
 * 4. 内存使用统计
 */
export declare class MemoryMonitor {
    private config;
    private monitorTimer?;
    private usageHistory;
    private stats;
    constructor(config?: MemoryMonitorConfig);
    /**
     * 启动监控
     */
    start(): void;
    /**
     * 停止监控
     */
    stop(): void;
    /**
     * 检查内存使用
     */
    private check;
    /**
     * 获取内存使用情况
     */
    private getMemoryUsage;
    /**
     * 执行清理
     */
    private cleanup;
    /**
     * 获取统计信息
     */
    getStats(): MemoryStats;
    /**
     * 获取使用历史
     */
    getHistory(): MemoryUsage[];
    /**
     * 重置统计
     */
    resetStats(): void;
    /**
     * 销毁监控器
     */
    destroy(): void;
}
/**
 * 创建内存监控器
 */
export declare function createMemoryMonitor(config?: MemoryMonitorConfig): MemoryMonitor;
/**
 * 全局内存监控器实例
 */
export declare const globalMemoryMonitor: MemoryMonitor;
/**
 * 内存清理工具
 */
export declare class MemoryCleaner {
    private cleanupHandlers;
    /**
     * 注册清理处理器
     */
    register(handler: () => void): () => void;
    /**
     * 执行所有清理处理器
     */
    cleanup(): void;
    /**
     * 清空所有处理器
     */
    clear(): void;
}
/**
 * 全局内存清理器实例
 */
export declare const globalMemoryCleaner: MemoryCleaner;
