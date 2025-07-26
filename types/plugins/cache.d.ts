import { CacheStorage, CacheConfig, RequestConfig, HttpResponse, HttpPlugin } from '../types/index.js';

/**
 * 缓存插件
 * 提供请求缓存功能
 */

/**
 * 内存缓存存储
 */
declare class MemoryCacheStorage implements CacheStorage {
    private cache;
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    /**
     * 获取缓存大小
     */
    size(): number;
    /**
     * 清理过期缓存
     */
    cleanup(): void;
}
/**
 * LocalStorage缓存存储
 */
declare class LocalStorageCacheStorage implements CacheStorage {
    private prefix;
    constructor(prefix?: string);
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
/**
 * SessionStorage缓存存储
 */
declare class SessionStorageCacheStorage implements CacheStorage {
    private prefix;
    constructor(prefix?: string);
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
/**
 * 缓存管理器
 */
declare class CacheManager {
    private storage;
    private config;
    constructor(config?: CacheConfig);
    /**
     * 默认缓存键生成器
     */
    private defaultKeyGenerator;
    /**
     * 简单哈希函数
     */
    private hashCode;
    /**
     * 获取缓存
     */
    get<T>(config: RequestConfig): Promise<HttpResponse<T> | null>;
    /**
     * 设置缓存
     */
    set<T>(config: RequestConfig, response: HttpResponse<T>): Promise<void>;
    /**
     * 删除缓存
     */
    delete(config: RequestConfig): Promise<void>;
    /**
     * 清空所有缓存
     */
    clear(): Promise<void>;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<CacheConfig>): void;
    /**
     * 获取配置
     */
    getConfig(): Required<CacheConfig>;
}
/**
 * 缓存插件
 */
declare function createCachePlugin(config?: CacheConfig): HttpPlugin;
/**
 * 创建内存缓存存储
 */
declare function createMemoryCache(): MemoryCacheStorage;
/**
 * 创建LocalStorage缓存存储
 */
declare function createLocalStorageCache(prefix?: string): LocalStorageCacheStorage;
/**
 * 创建SessionStorage缓存存储
 */
declare function createSessionStorageCache(prefix?: string): SessionStorageCacheStorage;

export { CacheManager, LocalStorageCacheStorage, MemoryCacheStorage, SessionStorageCacheStorage, createCachePlugin, createLocalStorageCache, createMemoryCache, createSessionStorageCache };
