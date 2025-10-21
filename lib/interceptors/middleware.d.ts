/**
 * 拦截器中间件系统
 *
 * 提供可组合、可复用的拦截器中间件模式
 */
import type { ErrorInterceptor, HttpError, RequestConfig, RequestInterceptor, ResponseData, ResponseInterceptor } from '../types';
/**
 * 中间件函数类型
 */
export type Middleware<TContext = any> = (context: TContext, next: () => Promise<TContext>) => Promise<TContext>;
/**
 * 请求中间件类型
 */
export type RequestMiddleware = Middleware<RequestConfig>;
/**
 * 响应中间件类型
 */
export type ResponseMiddleware<T = any> = Middleware<ResponseData<T>>;
/**
 * 错误中间件类型
 */
export type ErrorMiddleware = (error: HttpError, next: (error: HttpError) => Promise<HttpError>) => Promise<HttpError>;
/**
 * 组合多个请求中间件为一个拦截器
 *
 * @param middlewares - 中间件数组
 * @returns 组合后的请求拦截器
 *
 * @example
 * ```typescript
 * const logRequest: RequestMiddleware = async (config, next) => {
 *
 *   return next()
 * }
 *
 * const addTimestamp: RequestMiddleware = async (config, next) => {
 *   config.params = { ...config.params, _t: Date.now() }
 *   return next()
 * }
 *
 * const interceptor = composeRequestMiddleware([logRequest, addTimestamp])
 * client.interceptors.request.use(interceptor)
 * ```
 */
export declare function composeRequestMiddleware(middlewares: RequestMiddleware[]): RequestInterceptor;
/**
 * 组合多个响应中间件为一个拦截器
 *
 * @param middlewares - 中间件数组
 * @returns 组合后的响应拦截器
 *
 * @example
 * ```typescript
 * const logResponse: ResponseMiddleware = async (response, next) => {
 *
 *   return next()
 * }
 *
 * const extractData: ResponseMiddleware = async (response, next) => {
 *   // 提取嵌套的数据字段
 *   if (response.data?.result) {
 *     response.data = response.data.result
 *   }
 *   return next()
 * }
 *
 * const interceptor = composeResponseMiddleware([logResponse, extractData])
 * client.interceptors.response.use(interceptor)
 * ```
 */
export declare function composeResponseMiddleware<T = any>(middlewares: ResponseMiddleware<T>[]): ResponseInterceptor<T>;
/**
 * 组合多个错误中间件为一个拦截器
 *
 * @param middlewares - 中间件数组
 * @returns 组合后的错误拦截器
 *
 * @example
 * ```typescript
 * const logError: ErrorMiddleware = async (error, next) => {
 *   console.error('Error:', error.message)
 *   return next(error)
 * }
 *
 * const retryOn5xx: ErrorMiddleware = async (error, next) => {
 *   if (error.response?.status >= 500) {
 *     // 自定义重试逻辑
 *   }
 *   return next(error)
 * }
 *
 * const interceptor = composeErrorMiddleware([logError, retryOn5xx])
 * client.interceptors.error.use(interceptor)
 * ```
 */
export declare function composeErrorMiddleware(middlewares: ErrorMiddleware[]): ErrorInterceptor;
/**
 * 创建条件中间件
 *
 * 只在满足条件时执行中间件
 *
 * @param condition - 条件函数
 * @param middleware - 要执行的中间件
 * @returns 条件中间件
 *
 * @example
 * ```typescript
 * const addAuthToken: RequestMiddleware = async (config, next) => {
 *   config.headers = { ...config.headers, Authorization: 'Bearer token' }
 *   return next()
 * }
 *
 * // 只对 /api 路径的请求添加认证
 * const conditionalAuth = createConditionalMiddleware(
 *   (config) => config.url?.startsWith('/api'),
 *   addAuthToken
 * )
 * ```
 */
export declare function createConditionalMiddleware<TContext>(condition: (context: TContext) => boolean | Promise<boolean>, middleware: Middleware<TContext>): Middleware<TContext>;
/**
 * 创建请求路径匹配中间件
 *
 * @param pattern - URL 匹配模式（正则或字符串）
 * @param middleware - 要执行的中间件
 * @returns 路径匹配中间件
 *
 * @example
 * ```typescript
 * const logApiRequests: RequestMiddleware = async (config, next) => {
 *
 *   return next()
 * }
 *
 * // 只记录 API 请求
 * const apiLogger = createPathMatchMiddleware(/^\/api\//, logApiRequests)
 * ```
 */
export declare function createPathMatchMiddleware(pattern: string | RegExp, middleware: RequestMiddleware): RequestMiddleware;
/**
 * 创建方法匹配中间件
 *
 * @param methods - HTTP 方法数组
 * @param middleware - 要执行的中间件
 * @returns 方法匹配中间件
 *
 * @example
 * ```typescript
 * const addCsrfToken: RequestMiddleware = async (config, next) => {
 *   config.headers = { ...config.headers, 'X-CSRF-Token': getCsrfToken() }
 *   return next()
 * }
 *
 * // 只对写操作添加 CSRF token
 * const csrfProtection = createMethodMatchMiddleware(
 *   ['POST', 'PUT', 'PATCH', 'DELETE'],
 *   addCsrfToken
 * )
 * ```
 */
export declare function createMethodMatchMiddleware(methods: string[], middleware: RequestMiddleware): RequestMiddleware;
/**
 * 创建计时中间件
 *
 * 自动测量请求执行时间
 *
 * @param onComplete - 完成回调
 * @returns 计时中间件
 *
 * @example
 * ```typescript
 * const timingMiddleware = createTimingMiddleware((duration, config) => {
 *
 * })
 * ```
 */
export declare function createTimingMiddleware(onComplete?: (duration: number, config: RequestConfig) => void): RequestMiddleware;
/**
 * 创建缓存中间件
 *
 * 缓存中间件执行结果
 *
 * @param options - 缓存选项
 * @param options.ttl - 缓存过期时间（毫秒），默认60000
 * @param options.keyGenerator - 缓存键生成函数
 * @param options.middleware - 要缓存的中间件
 * @returns 缓存中间件
 *
 * @example
 * ```typescript
 * const cachedMiddleware = createCacheMiddleware({
 *   ttl: 60000, // 1分钟
 *   keyGenerator: (config) => config.url,
 *   middleware: expensiveMiddleware
 * })
 * ```
 */
export declare function createCacheMiddleware<TContext>(options: {
    ttl?: number;
    keyGenerator: (context: TContext) => string;
    middleware: Middleware<TContext>;
}): Middleware<TContext>;
/**
 * 创建重试中间件
 *
 * 自动重试失败的中间件
 *
 * @param options - 重试选项
 * @param options.maxAttempts - 最大重试次数，默认3次
 * @param options.delay - 重试延迟（毫秒），默认1000
 * @param options.shouldRetry - 判断是否应该重试的函数
 * @param options.middleware - 要重试的中间件
 * @returns 重试中间件
 *
 * @example
 * ```typescript
 * const retryMiddleware = createRetryMiddleware({
 *   maxAttempts: 3,
 *   delay: 1000,
 *   shouldRetry: (error) => error.status === 503,
 *   middleware: unstableMiddleware
 * })
 * ```
 */
export declare function createRetryMiddleware<TContext>(options: {
    maxAttempts?: number;
    delay?: number;
    shouldRetry?: (error: any, attempt: number) => boolean;
    middleware: Middleware<TContext>;
}): Middleware<TContext>;
/**
 * 创建管道中间件
 *
 * 按顺序执行一系列转换函数
 *
 * @param transforms - 转换函数数组
 * @returns 管道中间件
 *
 * @example
 * ```typescript
 * const pipeline = createPipelineMiddleware([
 *   (config) => ({ ...config, headers: { ...config.headers, 'X-Custom': 'value' } }),
 *   (config) => ({ ...config, timeout: 5000 }),
 *   (config) => ({ ...config, withCredentials: true })
 * ])
 * ```
 */
export declare function createPipelineMiddleware<TContext>(transforms: Array<(context: TContext) => TContext | Promise<TContext>>): Middleware<TContext>;
/**
 * 中间件构建器
 *
 * 提供流畅的 API 来构建复杂的中间件组合
 *
 * @example
 * ```typescript
 * const middleware = new MiddlewareBuilder<RequestConfig>()
 *   .use(loggingMiddleware)
 *   .when(config => config.url?.includes('/api'), authMiddleware)
 *   .timing((duration, config) => )
 *   .build()
 * ```
 */
export declare class MiddlewareBuilder<TContext> {
    private middlewares;
    /**
     * 添加中间件
     */
    use(middleware: Middleware<TContext>): this;
    /**
     * 添加条件中间件
     */
    when(condition: (context: TContext) => boolean | Promise<boolean>, middleware: Middleware<TContext>): this;
    /**
     * 添加计时中间件（仅适用于 RequestConfig）
     */
    timing(onComplete: (duration: number, config: any) => void): this;
    /**
     * 添加管道转换
     */
    pipe(...transforms: Array<(context: TContext) => TContext | Promise<TContext>>): this;
    /**
     * 构建最终的中间件
     */
    build(): Middleware<TContext>;
    /**
     * 清空所有中间件
     */
    clear(): this;
    /**
     * 获取中间件数量
     */
    get size(): number;
}
