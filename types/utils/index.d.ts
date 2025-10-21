import type { HttpError, RequestConfig } from '../types';
/**
 * 合并配置对象
 */
export declare function mergeConfig(defaultConfig: RequestConfig, customConfig?: RequestConfig): RequestConfig;
/**
 * 构建查询字符串
 */
export declare function buildQueryString(params: Record<string, any>): string;
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
 * 深拷贝对象
 */
export declare function deepClone<T>(obj: T): T;
/**
 * 判断是否为 FormData
 */
export declare function isFormData(data: any): data is FormData;
/**
 * 判断是否为 Blob
 */
export declare function isBlob(data: any): data is Blob;
/**
 * 判断是否为 ArrayBuffer
 */
export declare function isArrayBuffer(data: any): data is ArrayBuffer;
/**
 * 判断是否为 URLSearchParams
 */
export declare function isURLSearchParams(data: any): data is URLSearchParams;
