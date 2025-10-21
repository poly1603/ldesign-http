import type { HttpError, RequestConfig, ResponseData, RetryConfig } from '../types';
/**
 * 错误类型枚举
 */
export declare enum ErrorType {
    NETWORK = "NETWORK_ERROR",
    TIMEOUT = "TIMEOUT_ERROR",
    CANCEL = "CANCEL_ERROR",
    HTTP = "HTTP_ERROR",
    PARSE = "PARSE_ERROR",
    UNKNOWN = "UNKNOWN_ERROR"
}
/**
 * 错误恢复策略
 */
export interface ErrorRecoveryStrategy {
    /** 策略名称 */
    name: string;
    /** 是否可以处理该错误 */
    canHandle: (error: HttpError) => boolean;
    /** 执行恢复策略 */
    recover: (error: HttpError) => Promise<boolean>;
    /** 策略优先级（数字越大优先级越高） */
    priority?: number;
}
/**
 * 错误统计信息
 */
export interface ErrorStats {
    /** 总错误数 */
    total: number;
    /** 按类型分组的错误数 */
    byType: Record<ErrorType, number>;
    /** 按状态码分组的错误数 */
    byStatus: Record<number, number>;
    /** 最近的错误 */
    recent: HttpError[];
    /** 错误率（最近1小时） */
    errorRate: number;
    /** 最常见的错误 */
    mostCommon: {
        type: ErrorType;
        count: number;
    } | null;
}
/**
 * 错误处理器类（增强版）
 */
export declare class ErrorHandler {
    private static readonly ERROR_TEMPLATES;
    private static errorStats;
    private static recoveryStrategies;
    private static errorHistory;
    /**
     * 创建网络错误（优化版）
     */
    static createNetworkError(config: RequestConfig, originalError?: any): HttpError;
    /**
     * 创建超时错误（优化版）
     */
    static createTimeoutError(config: RequestConfig, timeout: number): HttpError;
    /**
     * 创建取消错误（优化版）
     */
    static createCancelError(config: RequestConfig): HttpError;
    /**
     * 创建 HTTP 错误
     */
    static createHttpError(status: number, statusText: string, config: RequestConfig, response?: ResponseData): HttpError;
    /**
     * 创建解析错误
     */
    static createParseError(config: RequestConfig, originalError?: any): HttpError;
    /**
     * 判断错误是否可重试
     */
    static isRetryableError(error: HttpError): boolean;
    /**
     * 获取错误的用户友好消息
     */
    static getUserFriendlyMessage(error: HttpError): string;
    /**
     * 记录错误统计
     */
    static recordError(error: HttpError): void;
    /**
     * 尝试错误恢复
     */
    static tryRecover(error: HttpError): Promise<boolean>;
    /**
     * 添加恢复策略
     */
    static addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void;
    /**
     * 移除恢复策略
     */
    static removeRecoveryStrategy(strategyName: string): boolean;
    /**
     * 获取所有恢复策略
     */
    static getRecoveryStrategies(): ErrorRecoveryStrategy[];
    /**
     * 获取错误类型
     */
    private static getErrorType;
    /**
     * 更新错误率
     */
    private static updateErrorRate;
    /**
     * 更新最常见错误
     */
    private static updateMostCommonError;
    /**
     * 获取错误统计信息
     */
    static getStats(): ErrorStats;
    /**
     * 获取错误历史
     */
    static getErrorHistory(): Array<{
        error: HttpError;
        timestamp: number;
        recovered: boolean;
    }>;
    /**
     * 重置错误统计
     */
    static resetStats(): void;
    /**
     * 清理过期的错误历史
     */
    static cleanupOldErrors(maxAge?: number): number;
}
/**
 * 重试管理器
 */
export declare class RetryManager {
    private config;
    constructor(config?: RetryConfig);
    /**
     * 执行带重试的请求
     */
    executeWithRetry<T>(requestFn: () => Promise<T>, _requestConfig?: RequestConfig): Promise<T>;
    /**
     * 默认重试延迟函数（指数退避）
     */
    private defaultRetryDelayFunction;
    /**
     * 更新重试配置
     */
    updateConfig(config: Partial<RetryConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): Required<RetryConfig>;
}
/**
 * 超时管理器
 */
export declare class TimeoutManager {
    private timeouts;
    /**
     * 创建超时控制器
     */
    createTimeoutController(timeout: number, requestId?: string): {
        signal: AbortSignal;
        cleanup: () => void;
    };
    /**
     * 清理所有超时
     */
    clearAll(): void;
    /**
     * 生成唯一 ID
     */
    private generateId;
}
/**
 * 内置错误恢复策略
 */
export declare const builtinRecoveryStrategies: {
    /**
     * 网络重连策略
     */
    networkReconnect: ErrorRecoveryStrategy;
    /**
     * 认证刷新策略
     */
    authRefresh: ErrorRecoveryStrategy;
    /**
     * 服务降级策略
     */
    serviceFallback: ErrorRecoveryStrategy;
    /**
     * 缓存回退策略
     */
    cacheFailback: ErrorRecoveryStrategy;
};
/**
 * 错误分析器
 */
export declare class ErrorAnalyzer {
    /**
     * 分析错误模式
     */
    static analyzeErrorPatterns(errors: HttpError[]): {
        patterns: Array<{
            type: string;
            count: number;
            percentage: number;
            description: string;
        }>;
        recommendations: string[];
    };
    /**
     * 获取模式描述
     */
    private static getPatternDescription;
    /**
     * 生成建议
     */
    private static generateRecommendations;
}
