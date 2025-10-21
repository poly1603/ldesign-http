import type { HttpClient, HttpError, RequestConfig, ResponseData } from '../types';
/**
 * 调试日志级别
 */
export declare enum DebugLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
    TRACE = 5
}
/**
 * 请求日志
 */
export interface RequestLog {
    /** 请求 ID */
    id: string;
    /** 请求配置 */
    config: RequestConfig;
    /** 请求时间 */
    timestamp: number;
    /** 请求方法 */
    method: string;
    /** 请求 URL */
    url: string;
    /** 请求头 */
    headers?: Record<string, string>;
    /** 请求数据 */
    data?: any;
}
/**
 * 响应日志
 */
export interface ResponseLog {
    /** 请求 ID */
    requestId: string;
    /** 响应数据 */
    response?: ResponseData;
    /** 错误信息 */
    error?: HttpError;
    /** 响应时间 */
    timestamp: number;
    /** 耗时（毫秒） */
    duration: number;
    /** 状态码 */
    status?: number;
    /** 响应大小（字节） */
    size?: number;
}
/**
 * 调试事件
 */
export interface DebugEvent {
    /** 事件类型 */
    type: 'request' | 'response' | 'error' | 'cache_hit' | 'cache_miss' | 'retry' | 'custom';
    /** 事件数据 */
    data: any;
    /** 事件时间 */
    timestamp: number;
    /** 事件级别 */
    level: DebugLevel;
}
/**
 * 调试器配置
 */
export interface DebuggerConfig {
    /** 调试级别 */
    level?: DebugLevel;
    /** 是否记录请求 */
    logRequests?: boolean;
    /** 是否记录响应 */
    logResponses?: boolean;
    /** 是否记录请求头 */
    logHeaders?: boolean;
    /** 是否记录请求体 */
    logBody?: boolean;
    /** 是否记录响应体 */
    logResponseBody?: boolean;
    /** 最大日志数量 */
    maxLogs?: number;
    /** 是否在控制台输出 */
    console?: boolean;
    /** 自定义日志处理器 */
    handler?: (event: DebugEvent) => void;
    /** 是否记录性能指标 */
    performance?: boolean;
    /** 是否记录缓存命中 */
    cacheTracking?: boolean;
}
/**
 * 性能指标
 */
export interface PerformanceMetrics {
    /** DNS 查询时间 */
    dnsTime?: number;
    /** TCP 连接时间 */
    tcpTime?: number;
    /** TLS 握手时间 */
    tlsTime?: number;
    /** 请求时间 */
    requestTime?: number;
    /** 响应时间 */
    responseTime?: number;
    /** 总时间 */
    totalTime: number;
    /** 请求大小 */
    requestSize?: number;
    /** 响应大小 */
    responseSize?: number;
}
/**
 * HTTP 调试器
 *
 * 提供详细的请求日志、性能分析和调试功能
 *
 * @example
 * ```typescript
 * const  = new HttpDebugger({
 *   level: DebugLevel.DEBUG,
 *   logRequests: true,
 *   logResponses: true,
 *   performance: true,
 * })
 *
 * // 应用到客户端
 * .apply(httpClient)
 *
 * // 获取日志
 * const logs = .getLogs()
 *
 * // 获取性能报告
 * const report = .getPerformanceReport()
 *
 * // 导出日志
 * const exported = .exportLogs()
 * ```
 */
export declare class HttpDebugger {
    private config;
    private requestLogs;
    private responseLogs;
    private events;
    private performanceData;
    private isApplied;
    constructor(config?: DebuggerConfig);
    /**
     * 应用到 HTTP 客户端
     */
    apply(client: HttpClient): void;
    /**
     * 记录请求
     */
    private logRequest;
    /**
     * 记录响应
     */
    private logResponse;
    /**
     * 记录错误
     */
    private logError;
    /**
     * 记录事件
     */
    recordEvent(event: DebugEvent): void;
    /**
     * 获取所有请求日志
     */
    getRequestLogs(): RequestLog[];
    /**
     * 获取所有响应日志
     */
    getResponseLogs(): ResponseLog[];
    /**
     * 获取所有事件
     */
    getEvents(): DebugEvent[];
    /**
     * 获取性能报告
     */
    getPerformanceReport(): {
        totalRequests: number;
        averageDuration: number;
        slowestRequest: ResponseLog | null;
        fastestRequest: ResponseLog | null;
        errorRate: number;
        totalDataTransferred: number;
    };
    /**
     * 清空日志
     */
    clearLogs(): void;
    /**
     * 导出日志
     */
    exportLogs(): string;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<DebuggerConfig>): void;
    /**
     * 获取配置
     */
    getConfig(): DebuggerConfig;
    /**
     * 生成唯一 ID
     */
    private generateId;
    /**
     * 查找请求 ID
     */
    private findRequestId;
    /**
     * 估算数据大小
     */
    private estimateSize;
    /**
     * 修剪日志
     */
    private trimLogs;
}
/**
 * 创建 HTTP 调试器
 */
export declare function createHttpDebugger(config?: DebuggerConfig): HttpDebugger;
/**
 * 创建调试拦截器
 */
export declare function createDebugInterceptor(config?: DebuggerConfig): {
    request: (config: RequestConfig) => RequestConfig;
    response: (response: ResponseData) => ResponseData<unknown>;
    error: (error: HttpError) => Promise<never>;
    debugger: HttpDebugger;
};
