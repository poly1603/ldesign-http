/**
 * 缓存存储实现模块
 *
 * 提供多种缓存存储后端的实现
 */
import type { CacheStorage, ResponseData } from '../types';
/**
 * 缓存项接口
 */
export interface CacheItem<T = any> {
    /** 缓存的响应数据 */
    data: ResponseData<T>;
    /** 缓存创建时间戳 */
    timestamp: number;
    /** 生存时间（毫秒） */
    ttl: number;
    /** 元数据 */
    metadata?: CacheItemMetadata;
}
/**
 * 缓存项元数据
 */
export interface CacheItemMetadata {
    /** 创建时间 */
    createdAt: number;
    /** 最后访问时间 */
    lastAccessed: number;
    /** 访问次数 */
    accessCount: number;
    /** 数据大小（字节） */
    size: number;
    /** 标签 */
    tags?: string[];
    /** 依赖 */
    dependencies?: string[];
}
/**
 * 内存缓存存储实现（优化版）
 */
export declare class MemoryCacheStorage implements CacheStorage {
    private cache;
    private cleanupTimer?;
    private cleanupInterval;
    constructor();
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    /**
     * 批量删除
     */
    deleteBatch(keys: string[]): Promise<void>;
    /**
     * 获取缓存大小
     */
    size(): number;
    /**
     * 获取所有缓存键
     */
    keys(): string[];
    /**
     * 获取缓存元数据
     */
    getMetadata(key: string): CacheItemMetadata | null;
    /**
     * 启动定期清理
     */
    private startCleanup;
    /**
     * 批量清理过期项
     */
    private cleanupExpired;
    /**
     * 计算数据大小（粗略估计）
     */
    private calculateSize;
    /**
     * 销毁缓存
     */
    destroy(): void;
}
/**
 * LocalStorage 缓存存储实现
 */
export declare class LocalStorageCacheStorage implements CacheStorage {
    protected prefix: string;
    constructor(prefix?: string);
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    /**
     * 处理存储配额超限
     */
    private handleStorageQuotaExceeded;
}
/**
 * SessionStorage 缓存存储实现
 */
export declare class SessionStorageCacheStorage extends LocalStorageCacheStorage {
    constructor(prefix?: string);
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
/**
 * IndexedDB 缓存存储实现
 */
export declare class IndexedDBCacheStorage implements CacheStorage {
    private dbName;
    private storeName;
    private db;
    constructor(dbName?: string);
    private init;
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    destroy(): void;
}
/**
 * 创建缓存存储
 */
export declare function createCacheStorage(type?: 'memory' | 'local' | 'session' | 'indexeddb'): CacheStorage;
