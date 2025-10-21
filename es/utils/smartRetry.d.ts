/**
 * 智能重试策略
 *
 * 根据错误类型、HTTP状态码、网络状况等智能决定是否重试
 */
import type { HttpError } from '../types';
/**
 * 重试策略类型
 */
export declare enum RetryStrategy {
    /** 立即重试 */
    IMMEDIATE = "immediate",
    /** 指数退避 */
    EXPONENTIAL = "exponential",
    /** 线性退避 */
    LINEAR = "linear",
    /** 固定延迟 */
    FIXED = "fixed",
    /** 不重试 */
    NONE = "none"
}
/**
 * 重试决策结果
 */
export interface RetryDecision {
    /** 是否应该重试 */
    shouldRetry: boolean;
    /** 重试延迟(ms) */
    delay: number;
    /** 建议的策略 */
    strategy: RetryStrategy;
    /** 决策原因 */
    reason: string;
}
/**
 * 智能重试配置
 */
export interface SmartRetryConfig {
    /** 最大重试次数 */
    maxRetries?: number;
    /** 基础延迟(ms) */
    baseDelay?: number;
    /** 最大延迟(ms) */
    maxDelay?: number;
    /** 是否启用网络状态检测 */
    checkNetworkStatus?: boolean;
    /** 可重试的HTTP状态码 */
    retryableStatusCodes?: number[];
    /** 不可重试的HTTP状态码 */
    nonRetryableStatusCodes?: number[];
    /** 自定义重试决策函数 */
    customDecision?: (error: HttpError, attempt: number) => RetryDecision | null;
}
/**
 * 智能重试管理器
 *
 * @example
 * ```typescript
 * const retryManager = new SmartRetryManager({
 *  maxRetries: 3,
 *  checkNetworkStatus: true,
 * })
 *
 * const decision = retryManager.shouldRetry(error, 1)
 * if (decision.shouldRetry) {
 *  await delay(decision.delay)
 *  // 重试请求
 * }
 * ```
 */
export declare class SmartRetryManager {
    private config;
    private static readonly DEFAULT_RETRYABLE_STATUS_CODES;
    private static readonly DEFAULT_NON_RETRYABLE_STATUS_CODES;
    constructor(config?: SmartRetryConfig);
    /**
     * 判断是否应该重试
     */
    shouldRetry(error: HttpError, attempt: number): RetryDecision;
    /**
     * 创建重试决策
     */
    private createRetryDecision;
    /**
     * 根据状态码获取建议的重试策略
     */
    private getStrategyForStatusCode;
    /**
     * 计算重试延迟
     */
    private calculateDelay;
    /**
     * 添加随机抖动（±25%）
     */
    private addJitter;
    /**
     * 检查是否离线
     */
    private isOffline;
    /**
     * 获取重试建议
     */
    getRetryAdvice(error: HttpError): string;
}
/**
 * 创建智能重试管理器
 */
export declare function createSmartRetryManager(config?: SmartRetryConfig): SmartRetryManager;
/**
 * 全局智能重试管理器
 */
export declare const globalSmartRetryManager: SmartRetryManager;
/**
 * 智能重试拦截器
 *
 * 自动为失败的请求应用智能重试策略
 */
export declare function createSmartRetryInterceptor(config?: SmartRetryConfig): {
    onRejected: (error: HttpError) => Promise<any>;
};
