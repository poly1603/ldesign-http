/**
 * HTTP 客户端监控模块
 *
 * 提供性能监控、指标统计和分析功能
 */
import type { CacheManager } from './utils/cache';
import type { ConcurrencyManager } from './utils/concurrency';
import type { RequestMonitor } from './utils/monitor';
import type { RequestPool } from './utils/pool';
import type { PriorityQueue } from './utils/priority';
/**
 * 监控指标接口
 */
export interface MonitoringMetrics {
    /** 性能统计 */
    performance: any;
    /** 优先级队列统计 */
    priorityQueue?: any;
    /** 连接池统计 */
    connectionPool?: any;
    /** 并发控制统计 */
    concurrency?: any;
    /** 缓存统计 */
    cache?: any;
}
/**
 * 监控功能接口
 */
export interface MonitoringOperations {
    /**
     * 获取性能监控统计
     */
    getPerformanceStats: () => any;
    /**
     * 获取最近的请求指标
     */
    getRecentMetrics: (count?: number) => any;
    /**
     * 获取慢请求列表
     */
    getSlowRequests: () => any;
    /**
     * 获取失败请求列表
     */
    getFailedRequests: () => any;
    /**
     * 启用性能监控
     */
    enableMonitoring: () => void;
    /**
     * 禁用性能监控
     */
    disableMonitoring: () => void;
    /**
     * 获取优先级队列统计
     */
    getPriorityQueueStats: () => any;
    /**
     * 获取连接池统计
     */
    getConnectionPoolStats: () => any;
    /**
     * 获取连接池详情
     */
    getConnectionDetails: () => any;
    /**
     * 导出性能指标
     */
    exportMetrics: () => MonitoringMetrics;
}
/**
 * 监控处理器
 */
export declare class MonitoringHandler implements MonitoringOperations {
    private monitor;
    private priorityQueue?;
    private requestPool?;
    private concurrencyManager?;
    private cacheManager?;
    constructor(monitor: RequestMonitor, priorityQueue?: PriorityQueue | undefined, requestPool?: RequestPool | undefined, concurrencyManager?: ConcurrencyManager | undefined, cacheManager?: CacheManager | undefined);
    /**
     * 获取性能监控统计
     */
    getPerformanceStats(): import("./utils/monitor").PerformanceStats;
    /**
     * 获取最近的请求指标
     */
    getRecentMetrics(count?: number): import("./utils/monitor").PerformanceMetrics[];
    /**
     * 获取慢请求列表
     */
    getSlowRequests(): import("./utils/monitor").PerformanceMetrics[];
    /**
     * 获取失败请求列表
     */
    getFailedRequests(): import("./utils/monitor").PerformanceMetrics[];
    /**
     * 启用性能监控
     */
    enableMonitoring(): void;
    /**
     * 禁用性能监控
     */
    disableMonitoring(): void;
    /**
     * 获取优先级队列统计
     */
    getPriorityQueueStats(): import("./utils/priority").PriorityQueueStats | undefined;
    /**
     * 获取连接池统计
     */
    getConnectionPoolStats(): import("./utils/pool").PoolStats | undefined;
    /**
     * 获取连接池详情
     */
    getConnectionDetails(): Map<string, import("./utils/pool").ConnectionInfo[]> | undefined;
    /**
     * 导出性能指标
     */
    exportMetrics(): MonitoringMetrics;
    /**
     * 清理监控数据
     */
    clearMetrics(): void;
    /**
     * 设置监控阈值
     */
    setThresholds(thresholds: {
        slowRequestThreshold?: number;
        errorRateThreshold?: number;
    }): void;
    /**
     * 获取实时性能指标
     */
    getRealtimeMetrics(): {
        requestsPerSecond: number;
        averageResponseTime: number;
        errorRate: number;
        activeRequests: number;
    };
    /**
     * 计算每秒请求数
     */
    private calculateRequestsPerSecond;
    /**
     * 生成性能报告
     */
    generateReport(): {
        summary: any;
        details: any;
        recommendations: string[];
    };
}
/**
 * 创建监控处理器
 */
export declare function createMonitoringHandler(monitor: RequestMonitor, priorityQueue?: PriorityQueue, requestPool?: RequestPool, concurrencyManager?: ConcurrencyManager, cacheManager?: CacheManager): MonitoringHandler;
