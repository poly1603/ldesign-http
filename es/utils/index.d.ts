import type { HttpError, RequestConfig } from '../types';
/**
 * 合并配置对象（性能优化版本 v2）
 *
 * 将默认配置和自定义配置合并，自定义配置会覆盖默认配置。
 * 对于 headers 和 params 对象，会进行深度合并。
 *
 * 性能优化：
 * - 添加输入验证，防止无效输入
 * - 使用位标记追踪需要合并的字段，减少条件判断
 * - 缓存常用配置模式
 * - 避免不必要的对象创建
 *
 * @param defaultConfig - 默认配置对象
 * @param customConfig - 自定义配置对象，可选
 * @returns 合并后的配置对象
 * @throws {TypeError} 当配置对象不是有效对象时
 *
 * @example
 * ```typescript
 * const defaultConfig = {
 *   timeout: 5000,
 *   headers: { 'Content-Type': 'application/json' }
 * }
 *
 * const customConfig = {
 *   timeout: 10000,
 *   headers: { 'Authorization': 'Bearer token' }
 * }
 *
 * const merged = mergeConfig(defaultConfig, customConfig)
 * // 结果: {
 * //   timeout: 10000,
 * //   headers: {
 * //     'Content-Type': 'application/json',
 * //     'Authorization': 'Bearer token'
 * //   }
 * // }
 * ```
 */
export declare function mergeConfig(defaultConfig: RequestConfig, customConfig?: RequestConfig): RequestConfig;
/**
 * 构建查询字符串（性能优化版本 v2）
 *
 * 将参数对象转换为 URL 查询字符串格式。
 * 支持数组值、null/undefined 值过滤。
 *
 * 性能优化：
 * - 使用缓存减少重复编码开销
 * - 预估数组大小，减少内存重分配
 * - 提前过滤无效值
 * - 使用位运算优化数组处理
 *
 * @param params - 参数对象
 * @returns URL 查询字符串，不包含前导 '?'
 * @throws {TypeError} 当 params 不是有效对象时
 *
 * @example
 * ```typescript
 * const params = {
 *   name: 'John',
 *   age: 30,
 *   tags: ['developer', 'typescript'],
 *   active: true,
 *   deleted: null // 会被忽略
 * }
 *
 * const queryString = buildQueryString(params)
 * // 结果: "name=John&age=30&tags=developer&tags=typescript&active=true"
 * ```
 */
export declare function buildQueryString(params: Record<string, any>): string;
/**
 * 清除查询字符串编码缓存
 *
 * 用于释放内存或测试场景
 */
export declare function clearQueryStringCache(): void;
/**
 * 构建完整的 URL
 */
export declare function buildURL(url: string, baseURL?: string, params?: Record<string, any>): string;
/**
 * 判断是否为绝对 URL
 */
export declare function isAbsoluteURL(url: string): boolean;
/**
 * 合并 URL
 */
export declare function combineURLs(baseURL: string, relativeURL: string): string;
/**
 * 创建 HTTP 错误
 */
export declare function createHttpError(message: string, config?: RequestConfig, code?: string, response?: any): HttpError;
/**
 * 延迟函数
 */
export declare function delay(ms: number): Promise<void>;
/**
 * 生成唯一 ID
 */
export declare function generateId(): string;
/**
 * 深拷贝对象（优化版）
 */
export declare function deepClone<T>(obj: T): T;
/**
 * 判断是否为 FormData
 */
export declare function isFormData(data: unknown): data is FormData;
/**
 * 判断是否为 Blob
 */
export declare function isBlob(data: unknown): data is Blob;
/**
 * 判断是否为 ArrayBuffer
 */
export declare function isArrayBuffer(data: unknown): data is ArrayBuffer;
/**
 * 判断是否为 URLSearchParams
 */
export declare function isURLSearchParams(data: unknown): data is URLSearchParams;
/**
 * HTTP状态码分类工具函数
 */
export declare const HttpStatus: {
    readonly isSuccess: (status: number) => boolean;
    readonly isRedirect: (status: number) => boolean;
    readonly isClientError: (status: number) => boolean;
    readonly isServerError: (status: number) => boolean;
    readonly isAuthError: (status: number) => boolean;
    readonly isNotFound: (status: number) => boolean;
    readonly isTimeout: (status: number) => boolean;
};
/**
 * 错误分类工具函数
 */
export declare const ErrorClassifier: {
    /**
     * 判断是否为网络错误
     */
    readonly isNetworkError: (error: any) => boolean;
    /**
     * 判断是否为超时错误
     */
    readonly isTimeoutError: (error: any) => boolean;
    /**
     * 判断是否为取消错误
     */
    readonly isCancelError: (error: any) => boolean;
    /**
     * 获取错误类型
     */
    readonly getErrorType: (error: any) => string;
    /**
     * 获取用户友好的错误消息
     */
    readonly getUserFriendlyMessage: (error: any) => string;
};
export * from './batch';
export * from './helpers';
export * from './memory';
export * from './offline';
export * from './signature';
export * from './warmup';
