/**
 * 实用工具函数模块
 *
 * 提供防抖、节流、请求合并等常用功能
 */
/**
 * 防抖函数
 *
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 *
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *
 * }, 300)
 *
 * // 只有最后一次调用会执行
 * debouncedSearch('a')
 * debouncedSearch('ab')
 * debouncedSearch('abc') // 300ms后执行
 * ```
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * 节流函数
 *
 * 规定时间内只触发一次函数，适用于高频事件
 *
 * @param fn - 要节流的函数
 * @param limit - 时间间隔（毫秒）
 * @returns 节流后的函数
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *
 * }, 100)
 *
 * window.addEventListener('scroll', throttledScroll)
 * ```
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void;
/**
 * 请求合并器配置
 */
export interface BatchRequestConfig<TInput = unknown, TOutput = unknown> {
    /** 最大批量大小 */
    maxBatchSize?: number;
    /** 等待时间（毫秒） */
    delay?: number;
    /** 批量请求执行器 */
    batchFn: (items: TInput[]) => Promise<TOutput[]>;
}
/**
 * 创建请求合并器
 *
 * 将多个单独的请求合并为一个批量请求，减少网络往返
 *
 * @param config - 批量请求配置
 * @returns 合并后的请求函数
 *
 * @example
 * ```typescript
 * const getUsersBatch = createBatchRequest({
 *   maxBatchSize: 100,
 *   delay: 10,
 *   batchFn: async (userIds) => {
 *     return fetch('/api/users/batch', {
 *       method: 'POST',
 *       body: JSON.stringify({ ids: userIds })
 *     }).then(r => r.json())
 *   }
 * })
 *
 * // 这些调用会被合并成一个批量请求
 * const user1 = await getUsersBatch(1)
 * const user2 = await getUsersBatch(2)
 * const user3 = await getUsersBatch(3)
 * ```
 */
export declare function createBatchRequest<TInput, TOutput>(config: BatchRequestConfig<TInput, TOutput>): (input: TInput) => Promise<TOutput>;
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
 *
 *   return { initialized: true }
 * })
 *
 * initialize() // 输出: "Initializing..."
 * initialize() // 不输出，返回缓存的结果
 * ```
 */
export declare function once<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T>;
/**
 * 内存化函数
 *
 * 缓存函数的执行结果，相同输入返回缓存值
 *
 * @param fn - 要内存化的函数
 * @param keyFn - 生成缓存键的函数，默认使用JSON.stringify
 * @returns 内存化后的函数
 *
 * @example
 * ```typescript
 * const expensiveCalculation = memoize((a: number, b: number) => {
 *
 *   return a * b
 * })
 *
 * expensiveCalculation(2, 3) // 输出: "Calculating..." 返回: 6
 * expensiveCalculation(2, 3) // 不输出，直接返回: 6
 * ```
 */
export declare function memoize<T extends (...args: any[]) => any>(fn: T, keyFn?: (...args: Parameters<T>) => string): T & {
    cache: Map<string, ReturnType<T>>;
    clear: () => void;
};
/**
 * 重试函数
 *
 * 在失败时自动重试函数执行
 *
 * @param fn - 要执行的函数
 * @param options - 重试选项
 * @param options.maxAttempts - 最大尝试次数，默认3
 * @param options.delay - 重试延迟基数（毫秒），默认1000
 * @param options.onRetry - 重试回调函数
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
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    delay?: number;
    onRetry?: (attempt: number, error: Error) => void;
}): Promise<T>;
/**
 * 链式调用构建器
 *
 * 创建支持链式调用的配置构建器
 *
 * @example
 * ```typescript
 * interface Config {
 *   url: string
 *   method: string
 *   headers: Record<string, string>
 * }
 *
 * const builder = createChainBuilder<Config>({
 *   url: '',
 *   method: 'GET',
 *   headers: {}
 * })
 *
 * const config = builder
 *   .set('url', '/api/users')
 *   .set('method', 'POST')
 *   .merge('headers', { 'Content-Type': 'application/json' })
 *   .build()
 * ```
 */
export declare function createChainBuilder<T extends Record<string, unknown>>(initial: T): {
    set<K extends keyof T>(key: K, value: T[K]): /*elided*/ any;
    merge<K extends keyof T>(key: K, value: Partial<T[K]>): /*elided*/ any;
    reset(): /*elided*/ any;
    build(): T;
    readonly current: Readonly<T>;
};
/**
 * 对象键值对安全访问
 *
 * 安全获取嵌套对象的值，避免 undefined 错误
 *
 * @param obj - 目标对象
 * @param path - 属性路径
 * @param defaultValue - 默认值
 * @returns 属性值或默认值
 *
 * @example
 * ```typescript
 * const obj = { user: { profile: { name: 'John' } } }
 *
 * get(obj, 'user.profile.name') // 'John'
 * get(obj, 'user.profile.age', 18) // 18
 * get(obj, 'user.settings.theme') // undefined
 * ```
 */
export declare function get<T = unknown>(obj: unknown, path: string, defaultValue?: T): T | undefined;
/**
 * 安全地设置嵌套对象的值
 *
 * @param obj - 目标对象
 * @param path - 属性路径
 * @param value - 要设置的值
 *
 * @example
 * ```typescript
 * const obj = {}
 * set(obj, 'user.profile.name', 'John')
 * // obj 变为: { user: { profile: { name: 'John' } } }
 * ```
 */
export declare function set(obj: Record<string, any>, path: string, value: unknown): void;
/**
 * 深度冻结对象
 *
 * 递归冻结对象及其所有嵌套对象
 *
 * @param obj - 要冻结的对象
 * @returns 冻结后的对象
 */
export declare function deepFreeze<T>(obj: T): Readonly<T>;
/**
 * 延迟执行
 *
 * @param ms - 延迟时间（毫秒）
 * @returns Promise
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * 超时Promise包装器
 *
 * 为Promise添加超时限制
 *
 * @param promise - 原始Promise
 * @param ms - 超时时间（毫秒）
 * @param timeoutError - 超时错误
 * @returns 带超时的Promise
 *
 * @example
 * ```typescript
 * const result = await timeout(
 *   fetch('/api/data'),
 *   5000,
 *   new Error('Request timeout')
 * )
 * ```
 */
export declare function timeout<T>(promise: Promise<T>, ms: number, timeoutError?: Error): Promise<T>;
/**
 * 批量并行执行Promise（带并发控制）
 *
 * @param tasks - 任务数组
 * @param limit - 并发限制
 * @returns Promise数组结果
 *
 * @example
 * ```typescript
 * const tasks = urls.map(url => () => fetch(url))
 * const results = await parallelLimit(tasks, 3) // 最多3个并发
 * ```
 */
export declare function parallelLimit<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]>;
