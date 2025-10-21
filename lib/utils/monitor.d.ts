/**
 * 请求监控模块
 * 提供请求性能监控、指标收集和分析功能
 */
import type { RequestConfig, ResponseData } from '../types';
/**
 * 性能指标
 */
export interface PerformanceMetrics {
    requestId: string;
    url: string;
    method: string;
    startTime: number;
    endTime: number;
    duration: number;
    status?: number;
    size?: number;
    cached: boolean;
    retries: number;
    error?: Error;
    timestamp?: number;
}
/**
 * 监控配置
 */
export interface MonitorConfig {
    enabled?: boolean;
    maxMetrics?: number;
    slowRequestThreshold?: number;
    samplingRate?: number;
    enableSampling?: boolean;
    onSlowRequest?: (metrics: PerformanceMetrics) => void;
    onError?: (metrics: PerformanceMetrics) => void;
    onMetricsUpdate?: (metrics: PerformanceMetrics[]) => void;
}
/**
 * 性能统计信息
 */
export interface PerformanceStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    cachedRequests: number;
    averageDuration: number;
    averageResponseTime?: number;
    medianDuration: number;
    p95Duration: number;
    p99Duration: number;
    slowRequests: number;
    totalDataTransferred: number;
    requestsByMethod: Record<string, number>;
    requestsByStatus: Record<number, number>;
    errorRate: number;
    cacheHitRate: number;
}
/**
 * 请求监控器（优化版）
 *
 * 优化点：
 * 1. 添加采样机制，高负载时降低采样率
 * 2. 缓存统计结果，避免重复计算
 * 3. 使用更紧凑的数据结构
 */
export declare class RequestMonitor {
    private metrics;
    private metricsIndex;
    private config;
    private requestMap;
    private statsCache?;
    private statsCacheTime;
    private statsCacheTTL;
    private sampleCounter;
    constructor(config?: MonitorConfig);
    /**
     * 检查是否应该采样
     */
    private shouldSample;
    /**
     * 开始监控请求（优化版 - 带采样）
     */
    startRequest(requestId: string, _config: RequestConfig): void;
    /**
     * 结束监控请求（优化版）
     */
    endRequest<T>(requestId: string, config: RequestConfig, response?: ResponseData<T>, error?: Error): void;
    /**
     * 记录重试
     */
    recordRetry(requestId: string): void;
    /**
     * 标记缓存命中
     */
    markCached(requestId: string): void;
    /**
     * 添加指标（使用循环缓冲区优化性能）
     */
    private addMetrics;
    /**
     * 获取响应大小
     */
    private getResponseSize;
    /**
     * 获取性能统计（优化版 - 带缓存）
     */
    getStats(): PerformanceStats;
    /**
     * 计算统计信息（优化版）
     */
    private calculateStats;
    /**
     * 插入排序（对小数组更快）
     */
    private insertionSort;
    /**
     * 清除统计缓存
     */
    private invalidateStatsCache;
    /**
     * 获取百分位数
     */
    private getPercentile;
    /**
     * 获取最近的指标
     */
    getRecentMetrics(count?: number): PerformanceMetrics[];
    /**
     * 获取慢请求
     */
    getSlowRequests(): PerformanceMetrics[];
    /**
     * 获取失败请求
     */
    getFailedRequests(): PerformanceMetrics[];
    /**
     * 清空指标
     */
    clear(): void;
    /**
     * 导出指标
     */
    exportMetrics(): PerformanceMetrics[];
    /**
     * 启用监控
     */
    enable(): void;
    /**
     * 禁用监控
     */
    disable(): void;
    /**
     * 设置慢请求阈值
     */
    setSlowRequestThreshold(threshold: number): void;
    /**
     * 获取指标
     */
    getMetrics(): PerformanceMetrics[];
    /**
     * 是否启用
     */
    isEnabled(): boolean;
}
/**
 * 创建请求监控器
 */
export declare function createRequestMonitor(config?: MonitorConfig): RequestMonitor;
/**
 * 默认监控器实例
 */
export declare const defaultMonitor: RequestMonitor;
