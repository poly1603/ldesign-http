/**
 * 函数工具模块
 *
 * 提供内存化、重试、一次性函数等功能
 */
/**
 * 创建一次性函数
 *
 * 确保函数只被执行一次，后续调用返回第一次的结果
 *
 * @param fn - 要执行的函数
 * @returns 只执行一次的函数
 *
 * @example
 * ```typescript
 * const initialize = once(() => {
 *   console.log('Initializing...')
 *   return { initialized: true }
 * })
 *
 * initialize() // 输出: "Initializing..."
 * initialize() // 不输出，返回缓存的结果
 * ```
 */
export declare function once<T extends (...args: any[]) => any>(fn: T): T & {
    called: boolean;
    clear: () => void;
};
/**
 * 内存化配置
 */
export interface MemoizeOptions {
    /** 最大缓存数量 */
    maxSize?: number;
    /** 缓存过期时间（毫秒） */
    ttl?: number;
    /** 是否使用WeakMap（仅对象类型参数） */
    weak?: boolean;
    /** 自定义键生成函数 */
    keyFn?: (...args: any[]) => string;
    /** 自定义相等比较函数 */
    equalFn?: (a: any, b: any) => boolean;
}
/**
 * 内存化函数
 *
 * 缓存函数的执行结果，相同输入返回缓存值
 *
 * @param fn - 要内存化的函数
 * @param options - 内存化选项
 * @returns 内存化后的函数
 *
 * @example
 * ```typescript
 * const expensiveCalculation = memoize((a: number, b: number) => {
 *   console.log('Calculating...')
 *   return a * b
 * })
 *
 * expensiveCalculation(2, 3) // 输出: "Calculating..." 返回: 6
 * expensiveCalculation(2, 3) // 不输出，直接返回: 6
 * ```
 */
export declare function memoize<T extends (...args: any[]) => any>(fn: T, options?: MemoizeOptions): T & {
    cache: Map<string, any>;
    clear: () => void;
    delete: (key: string) => boolean;
    has: (key: string) => boolean;
};
/**
 * 重试配置
 */
export interface RetryOptions {
    /** 最大重试次数 */
    maxAttempts?: number;
    /** 初始延迟（毫秒） */
    delay?: number;
    /** 延迟增长因子 */
    factor?: number;
    /** 最大延迟（毫秒） */
    maxDelay?: number;
    /** 抖动 */
    jitter?: boolean;
    /** 重试条件 */
    retryCondition?: (error: any) => boolean;
    /** 重试回调 */
    onRetry?: (attempt: number, error: any) => void;
}
/**
 * 重试函数
 *
 * 在失败时自动重试函数执行
 *
 * @param fn - 要执行的函数
 * @param options - 重试选项
 * @returns Promise
 *
 * @example
 * ```typescript
 * const result = await retry(
 *   () => fetch('/api/data'),
 *   { maxAttempts: 3, delay: 1000 }
 * )
 * ```
 */
export declare function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * 创建可重试函数
 */
export declare function createRetryableFunction<T extends (...args: any[]) => Promise<any>>(fn: T, options?: RetryOptions): T;
/**
 * 延迟执行
 *
 * @param ms - 延迟时间（毫秒）
 * @returns Promise
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * 超时配置
 */
export interface TimeoutOptions {
    /** 超时错误信息 */
    message?: string;
    /** 超时错误 */
    error?: Error;
    /** 是否可取消 */
    cancellable?: boolean;
}
/**
 * 超时Promise包装器
 *
 * 为Promise添加超时限制
 *
 * @param promise - 原始Promise
 * @param ms - 超时时间（毫秒）
 * @param options - 超时选项
 * @returns 带超时的Promise
 *
 * @example
 * ```typescript
 * const result = await timeout(
 *   fetch('/api/data'),
 *   5000,
 *   { message: 'Request timeout' }
 * )
 * ```
 */
export declare function timeout<T>(promise: Promise<T>, ms: number, options?: TimeoutOptions): Promise<T> & {
    cancel?: () => void;
};
/**
 * 并发控制器
 */
export declare class ConcurrencyController {
    private maxConcurrency;
    private running;
    private queue;
    constructor(maxConcurrency: number);
    /**
     * 执行任务
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * 并发执行多个任务
     */
    executeAll<T>(tasks: Array<() => Promise<T>>): Promise<T[]>;
    /**
     * 获取当前运行数量
     */
    getRunning(): number;
    /**
     * 获取队列长度
     */
    getQueueLength(): number;
}
/**
 * 并发执行
 *
 * 限制并发执行的任务数量
 *
 * @param tasks - 任务列表
 * @param limit - 并发限制
 * @returns 结果数组
 *
 * @example
 * ```typescript
 * const results = await concurrent(
 *   urls.map(url => () => fetch(url)),
 *   3 // 最多3个并发请求
 * )
 * ```
 */
export declare function concurrent<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]>;
/**
 * 创建串行执行器
 *
 * 确保异步函数按顺序执行
 */
export declare function createSerialExecutor<T extends (...args: any[]) => Promise<any>>(): (fn: T, ...args: Parameters<T>) => ReturnType<T>;
/**
 * 创建并行执行器
 *
 * 批量并行执行函数
 */
export declare function createParallelExecutor(maxConcurrency?: number): <T>(tasks: Array<() => Promise<T>>) => Promise<T[]>;
/**
 * 创建延迟执行器
 */
export declare function defer<T extends (...args: any[]) => any>(fn: T, delay?: number): (...args: Parameters<T>) => Promise<ReturnType<T>>;
/**
 * 创建条件执行器
 */
export declare function conditional<T extends (...args: any[]) => any>(condition: (...args: Parameters<T>) => boolean, trueFn: T, falseFn?: T): T;
