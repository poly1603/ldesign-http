/**
 * 防抖节流工具模块
 *
 * 提供防抖、节流等控制函数执行频率的工具
 */
/**
 * 防抖配置
 */
export interface DebounceOptions {
    /** 是否在延迟开始前调用 */
    leading?: boolean;
    /** 是否在延迟结束后调用 */
    trailing?: boolean;
    /** 最大等待时间 */
    maxWait?: number;
}
/**
 * 防抖函数
 *
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 *
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @param options - 防抖选项
 * @returns 防抖后的函数
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching:', query)
 * }, 300)
 *
 * // 只有最后一次调用会执行
 * debouncedSearch('a')
 * debouncedSearch('ab')
 * debouncedSearch('abc') // 300ms后执行
 * ```
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number, options?: DebounceOptions): T & {
    cancel: () => void;
    flush: () => ReturnType<T> | undefined;
    pending: () => boolean;
};
/**
 * 节流配置
 */
export interface ThrottleOptions {
    /** 是否在延迟开始前调用 */
    leading?: boolean;
    /** 是否在延迟结束后调用 */
    trailing?: boolean;
}
/**
 * 节流函数
 *
 * 规定时间内只触发一次函数，适用于高频事件
 *
 * @param fn - 要节流的函数
 * @param limit - 时间间隔（毫秒）
 * @param options - 节流选项
 * @returns 节流后的函数
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   console.log('Scrolling...')
 * }, 100)
 *
 * window.addEventListener('scroll', throttledScroll)
 * ```
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, limit: number, options?: ThrottleOptions): T & {
    cancel: () => void;
    flush: () => ReturnType<T> | undefined;
    pending: () => boolean;
};
/**
 * 创建自适应防抖
 *
 * 根据调用频率自动调整防抖延迟
 */
export declare function createAdaptiveDebounce<T extends (...args: any[]) => any>(fn: T, options?: {
    minDelay?: number;
    maxDelay?: number;
    factor?: number;
}): T & {
    cancel: () => void;
    reset: () => void;
};
/**
 * 创建频率限制器
 *
 * 限制函数在指定时间窗口内的调用次数
 */
export declare class RateLimiter {
    private maxCalls;
    private timeWindow;
    private calls;
    constructor(maxCalls: number, timeWindow: number);
    /**
     * 检查是否可以执行
     */
    canExecute(): boolean;
    /**
     * 记录一次执行
     */
    recordExecution(): void;
    /**
     * 执行函数（如果未超限）
     */
    execute<T>(fn: () => T): T | undefined;
    /**
     * 获取下次可执行时间
     */
    getNextAvailableTime(): number | null;
    /**
     * 清理过期的调用记录
     */
    private cleanup;
    /**
     * 重置限制器
     */
    reset(): void;
    /**
     * 获取当前调用次数
     */
    getCurrentCalls(): number;
    /**
     * 获取剩余可调用次数
     */
    getRemainingCalls(): number;
}
/**
 * 创建带频率限制的函数
 */
export declare function createRateLimitedFunction<T extends (...args: any[]) => any>(fn: T, maxCalls: number, timeWindow: number, options?: {
    onLimit?: () => void;
    queueOverflow?: 'drop' | 'replace';
}): T & {
    limiter: RateLimiter;
    queue: Array<() => void>;
};
