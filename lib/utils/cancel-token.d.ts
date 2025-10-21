/**
 * 取消令牌模块
 *
 * 提供请求取消令牌的实现
 */
/**
 * 取消令牌接口
 */
export interface CancelToken {
    /** 取消原因 */
    reason?: string;
    /** 是否已取消 */
    isCancelled: boolean;
    /** 取消回调 */
    promise: Promise<string>;
    /** 抛出取消错误 */
    throwIfRequested: () => void;
}
/**
 * 取消令牌实现
 */
export declare class CancelTokenImpl implements CancelToken {
    isCancelled: boolean;
    reason?: string;
    promise: Promise<string>;
    private resolvePromise;
    constructor();
    /**
     * 取消请求
     */
    cancel(reason?: string): void;
    /**
     * 如果已取消则抛出错误
     */
    throwIfRequested(): void;
}
/**
 * 取消令牌源
 */
export declare class CancelTokenSource {
    token: CancelToken;
    constructor();
    /**
     * 取消请求
     */
    cancel(reason?: string): void;
    /**
     * 创建新的取消令牌源
     */
    static create(): CancelTokenSource;
}
/**
 * 超时取消令牌
 */
export declare class TimeoutCancelToken extends CancelTokenImpl {
    private timeoutId?;
    constructor(timeout: number, reason?: string);
    /**
     * 取消请求
     */
    cancel(reason?: string): void;
    /**
     * 重置超时
     */
    reset(timeout: number): void;
}
/**
 * 组合取消令牌
 */
export declare class CombinedCancelToken implements CancelToken {
    isCancelled: boolean;
    reason?: string;
    promise: Promise<string>;
    private resolvePromise;
    private tokens;
    constructor(...tokens: CancelToken[]);
    private setupListeners;
    private handleTokenCancel;
    throwIfRequested(): void;
}
/**
 * 取消令牌工厂
 */
export declare class CancelTokenFactory {
    /**
     * 创建基础取消令牌
     */
    static create(): CancelTokenSource;
    /**
     * 创建超时取消令牌
     */
    static createWithTimeout(timeout: number, reason?: string): TimeoutCancelToken;
    /**
     * 组合多个取消令牌
     */
    static combine(...tokens: CancelToken[]): CombinedCancelToken;
    /**
     * 从 AbortSignal 创建取消令牌
     */
    static fromAbortSignal(signal: AbortSignal): CancelToken;
    /**
     * 创建永不取消的令牌
     */
    static never(): CancelToken;
}
/**
 * 创建取消令牌源
 */
export declare function createCancelTokenSource(): CancelTokenSource;
/**
 * 创建超时取消令牌
 */
export declare function createTimeoutToken(timeout: number, reason?: string): TimeoutCancelToken;
/**
 * 组合多个取消令牌
 */
export declare function combineCancelTokens(...tokens: CancelToken[]): CombinedCancelToken;
