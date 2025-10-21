/**
 * HTTP请求重试功能
 * 提供智能重试机制，支持指数退避、条件重试等
 */
export interface RetryConfig {
    /** 最大重试次数 */
    maxRetries: number;
    /** 初始延迟时间(ms) */
    initialDelay: number;
    /** 最大延迟时间(ms) */
    maxDelay: number;
    /** 退避倍数 */
    backoffMultiplier: number;
    /** 是否启用抖动 */
    enableJitter: boolean;
    /** 重试条件函数 */
    shouldRetry?: (error: any, attempt: number) => boolean;
    /** 延迟计算函数 */
    delayCalculator?: (attempt: number, config: RetryConfig) => number;
}
export interface RetryState {
    attempt: number;
    totalDelay: number;
    errors: any[];
    startTime: number;
}
export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: any;
    retryState: RetryState;
}
/**
 * 默认重试配置
 */
export declare const DEFAULT_RETRY_CONFIG: RetryConfig;
/**
 * 计算重试延迟时间
 */
export declare function calculateDelay(attempt: number, config: RetryConfig): number;
/**
 * 等待指定时间
 */
export declare function delay(ms: number): Promise<void>;
/**
 * 重试执行器
 */
export declare class RetryExecutor {
    private config;
    constructor(config?: Partial<RetryConfig>);
    /**
     * 执行带重试的异步操作
     */
    execute<T>(operation: () => Promise<T>): Promise<RetryResult<T>>;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<RetryConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): RetryConfig;
}
/**
 * 创建重试执行器
 */
export declare function createRetryExecutor(config?: Partial<RetryConfig>): RetryExecutor;
/**
 * 重试装饰器
 */
export declare function retry(config?: Partial<RetryConfig>): (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * 全局重试执行器实例
 */
export declare const globalRetryExecutor: RetryExecutor;
/**
 * 便捷的重试函数
 */
export declare function retryOperation<T>(operation: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
/**
 * 重试中间件配置
 */
export interface RetryMiddlewareConfig {
    enabled?: boolean;
    maxAttempts?: number;
    delay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: any, attempt: number) => boolean;
    condition?: (error: any) => boolean;
    delayFn?: (attempt: number) => number;
}
/**
 * 创建重试中间件
 */
export declare function withRetry(config?: RetryMiddlewareConfig): (requestConfig: any, next: () => Promise<any>) => Promise<any>;
