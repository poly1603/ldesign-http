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
}
/**
 * 请求取消管理器
 */
export declare class CancelManager {
    private requests;
    private cancelTokens;
    /**
     * 创建取消令牌源
     */
    static source(): CancelTokenSource;
    /**
     * 注册请求
     */
    register(requestId: string, controller: AbortController, token?: CancelToken): void;
    /**
     * 取消指定请求
     */
    cancel(requestId: string, reason?: string): void;
    /**
     * 取消所有请求
     */
    cancelAll(reason?: string): void;
    /**
     * 清理已完成的请求
     */
    cleanup(requestId: string): void;
    /**
     * 获取活跃请求数量
     */
    getActiveRequestCount(): number;
    /**
     * 检查请求是否已取消
     */
    isCancelled(requestId: string): boolean;
    /**
     * 创建合并的 AbortSignal
     */
    createMergedSignal(signals: (AbortSignal | undefined)[]): AbortSignal;
}
/**
 * 全局取消管理器实例
 */
export declare const globalCancelManager: CancelManager;
/**
 * 创建取消令牌源
 */
export declare function createCancelTokenSource(): CancelTokenSource;
/**
 * 检查是否为取消错误
 */
export declare function isCancelError(error: any): boolean;
/**
 * 超时取消令牌
 */
export declare function createTimeoutCancelToken(timeout: number): CancelTokenSource;
