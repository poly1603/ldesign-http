/**
 * 速率限制管理器
 *
 * 控制在指定时间窗口内的请求数量
 */
/**
 * 速率限制配置
 */
export interface RateLimitConfig {
    /** 最大请求数 */
    maxRequests?: number;
    /** 时间窗口（毫秒） */
    timeWindow?: number;
    /** 是否启用突发请求 */
    allowBurst?: boolean;
    /** 突发请求数量 */
    burstSize?: number;
}
/**
 * 速率限制状态
 */
export interface RateLimitStatus {
    /** 当前请求数 */
    currentRequests: number;
    /** 最大请求数 */
    maxRequests: number;
    /** 时间窗口 */
    timeWindow: number;
    /** 下次可用时间 */
    nextAvailableTime: number;
    /** 是否已达限制 */
    isLimited: boolean;
}
/**
 * 速率限制管理器
 */
export declare class RateLimitManager {
    private requests;
    private config;
    private burstTokens;
    constructor(config?: RateLimitConfig);
    /**
     * 检查是否可以发送请求
     */
    canMakeRequest(): boolean;
    /**
     * 记录请求
     */
    recordRequest(): void;
    /**
     * 恢复突发令牌
     */
    private scheduleBurstTokenRestore;
    /**
     * 获取下次可以请求的时间
     */
    getNextAvailableTime(): number;
    /**
     * 等待直到可以发送请求
     */
    waitForAvailability(): Promise<void>;
    /**
     * 使用退避策略等待
     */
    waitWithBackoff(attempt?: number): Promise<void>;
    /**
     * 重置计数器
     */
    reset(): void;
    /**
     * 获取当前状态
     */
    getStatus(): RateLimitStatus;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<RateLimitConfig>): void;
    /**
     * 获取请求历史
     */
    getRequestHistory(): number[];
    /**
     * 计算当前速率
     */
    getCurrentRate(): number;
    /**
     * 预测何时可以发送N个请求
     */
    predictAvailabilityForBatch(batchSize: number): number;
}
/**
 * 创建速率限制管理器
 */
export declare function createRateLimitManager(config?: RateLimitConfig): RateLimitManager;
/**
 * 速率限制装饰器
 */
export declare function rateLimit(config?: RateLimitConfig): <T extends (...args: any[]) => Promise<any>>(target: T) => T;
/**
 * 全局速率限制管理器实例
 */
export declare const globalRateLimitManager: RateLimitManager;
