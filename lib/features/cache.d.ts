/**
 * HTTP请求缓存功能 - 中间件层
 *
 * 注意：此文件提供缓存中间件功能，与 utils/cache.ts 的职责不同：
 * - features/cache.ts: 提供 HTTP 缓存中间件（用于拦截器）
 * - utils/cache.ts: 提供缓存管理器（用于 HTTP 客户端内部）
 *
 * 两者的接口定义略有不同，这是设计上的考虑。
 */
export interface CacheConfig {
    /** 默认TTL(秒) */
    defaultTTL: number;
    /** 最大缓存条目数 */
    maxSize: number;
    /** 缓存键生成函数 */
    keyGenerator?: (url: string, options: any) => string;
    /** 缓存存储适配器 */
    storage?: CacheStorage;
    /** 是否启用压缩 */
    enableCompression: boolean;
    /** 缓存策略 */
    strategy: CacheStrategy;
}
export type CacheStrategy = 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
export interface CacheItem {
    data: any;
    timestamp: number;
    ttl: number;
    headers?: Record<string, string>;
    etag?: string;
    lastModified?: string;
    size: number;
}
export interface CacheStorage {
    get: (key: string) => Promise<CacheItem | null>;
    set: (key: string, item: CacheItem) => Promise<void>;
    delete: (key: string) => Promise<boolean>;
    clear: () => Promise<void>;
    keys: () => Promise<string[]>;
    size: () => Promise<number>;
}
export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}
/**
 * 内存缓存存储
 */
export declare class MemoryCacheStorage implements CacheStorage {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    get(key: string): Promise<CacheItem | null>;
    set(key: string, item: CacheItem): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
}
/**
 * LocalStorage 缓存存储
 */
export declare class LocalStorageCacheStorage implements CacheStorage {
    private prefix;
    constructor(prefix?: string);
    get(key: string): Promise<CacheItem | null>;
    set(key: string, item: CacheItem): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
    private cleanup;
}
/**
 * HTTP缓存管理器
 */
export declare class HttpCacheManager {
    private config;
    private storage;
    private stats;
    constructor(config?: Partial<CacheConfig>);
    private createStorage;
    /**
     * 生成缓存键
     */
    private generateKey;
    /**
     * 获取缓存
     */
    get(url: string, options?: any): Promise<any | null>;
    /**
     * 设置缓存
     */
    set(url: string, options: any, data: any, ttl?: number, headers?: Record<string, string>): Promise<void>;
    /**
     * 删除缓存
     */
    delete(url: string, options?: any): Promise<boolean>;
    /**
     * 清空缓存
     */
    clear(): Promise<void>;
    /**
     * 获取缓存统计
     */
    getStats(): CacheStats;
    /**
     * 更新统计信息
     */
    private updateStats;
    /**
     * 计算数据大小
     */
    private calculateSize;
    /**
     * 检查响应是否可缓存
     */
    static isCacheable(method: string, status: number, headers?: Record<string, string>): boolean;
}
/**
 * 创建HTTP缓存管理器
 */
export declare function createHttpCacheManager(config?: Partial<CacheConfig>): HttpCacheManager;
/**
 * 缓存中间件配置
 */
export interface CacheMiddlewareConfig {
    enabled?: boolean;
    ttl?: number;
    methods?: string[];
    keyGenerator?: (config: any) => string;
    storage?: CacheStorage;
}
/**
 * 创建缓存中间件
 */
export declare function withCache(config?: CacheMiddlewareConfig): (requestConfig: any, next: () => Promise<any>) => Promise<any>;
/**
 * 全局HTTP缓存管理器实例
 */
export declare const globalHttpCacheManager: HttpCacheManager;
