import { RetryConfig, HttpError, RequestConfig, HttpPlugin } from '../types/index.js';

/**
 * 重试插件
 * 提供请求重试功能
 */

/**
 * 重试策略枚举
 */
declare enum RetryStrategy {
    /** 固定延迟 */
    FIXED = "fixed",
    /** 指数退避 */
    EXPONENTIAL = "exponential",
    /** 线性增长 */
    LINEAR = "linear",
    /** 自定义 */
    CUSTOM = "custom"
}
/**
 * 扩展的重试配置
 */
interface ExtendedRetryConfig extends RetryConfig {
    /** 重试策略 */
    strategy?: RetryStrategy;
    /** 最大延迟时间（毫秒） */
    maxDelay?: number;
    /** 延迟抖动因子 (0-1) */
    jitter?: number;
    /** 重试前的回调 */
    onRetry?: (error: HttpError, retryCount: number) => void;
    /** 重试失败的回调 */
    onRetryFailed?: (error: HttpError, retryCount: number) => void;
}
/**
 * 重试管理器
 */
declare class RetryManager {
    private config;
    constructor(config?: ExtendedRetryConfig);
    /**
     * 默认重试条件
     */
    private defaultRetryCondition;
    /**
     * 创建延迟计算器
     */
    private createDelayCalculator;
    /**
     * 执行重试
     */
    executeWithRetry<T>(requestFn: () => Promise<T>, config?: RequestConfig): Promise<T>;
    /**
     * 延迟函数
     */
    private delay;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<ExtendedRetryConfig>): void;
    /**
     * 获取配置
     */
    getConfig(): Required<ExtendedRetryConfig>;
}
/**
 * 重试插件
 */
declare function createRetryPlugin(config?: ExtendedRetryConfig): HttpPlugin;
/**
 * 创建固定延迟重试配置
 */
declare function createFixedRetryConfig(retries?: number, delay?: number): ExtendedRetryConfig;
/**
 * 创建指数退避重试配置
 */
declare function createExponentialRetryConfig(retries?: number, initialDelay?: number, maxDelay?: number): ExtendedRetryConfig;
/**
 * 创建线性增长重试配置
 */
declare function createLinearRetryConfig(retries?: number, delay?: number): ExtendedRetryConfig;
/**
 * 创建自定义重试配置
 */
declare function createCustomRetryConfig(retries: number, delayCalculator: (retryCount: number, error: HttpError) => number, retryCondition?: (error: HttpError) => boolean): ExtendedRetryConfig;

export { RetryManager, RetryStrategy, createCustomRetryConfig, createExponentialRetryConfig, createFixedRetryConfig, createLinearRetryConfig, createRetryPlugin };
export type { ExtendedRetryConfig };
