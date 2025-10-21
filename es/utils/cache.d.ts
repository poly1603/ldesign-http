import type { CacheConfig, CacheStorage, RequestConfig, ResponseData } from '../types';
/**
 * 缓存项接口
 *
 * 定义缓存中存储的数据项结构
 */
interface CacheItem<T = unknown> {
    /** 缓存的响应数据 */
    data: ResponseData<T>;
    /** 缓存创建时间戳 */
    timestamp: number;
    /** 生存时间（毫秒） */
    ttl: number;
}
/**
 * 内存缓存存储实现（优化版）
 *
 * 优化点：
 * 1. 使用单个定时器替代多个定时器，减少内存占用
 * 2. 延迟过期检查，只在访问时检查
 * 3. 批量清理过期项
 * 4. 添加 LRU 淘汰策略
 * 5. 使用 WeakRef 减少内存占用
 *
 * @example
 * ```typescript
 * const storage = new MemoryCacheStorage()
 *
 * // 存储数据，5分钟后过期
 * await storage.set('user:123', userData, 5 * 60 * 1000)
 *
 * // 获取数据
 * const cached = await storage.get('user:123')
 *
 * // 删除数据
 * await storage.delete('user:123')
 * ```
 */
export declare class MemoryCacheStorage implements CacheStorage {
    private cache;
    private accessOrder;
    private maxSize;
    private cleanupTimer?;
    private cleanupInterval;
    private isDestroyed;
    constructor(maxSize?: number);
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    /**
     * 启动定期清理（优化：单个定时器）
     */
    private startCleanup;
    /**
     * 批量清理过期项
     */
    private cleanupExpired;
    /**
     * LRU 淘汰策略
     */
    private evictLRU;
    /**
     * 获取缓存大小
     */
    size(): number;
    /**
     * 获取所有缓存键
     */
    keys(): string[];
    /**
     * 销毁缓存
     */
    destroy(): void;
}
/**
 * LocalStorage 缓存存储实现
 */
export declare class LocalStorageCacheStorage implements CacheStorage {
    private prefix;
    constructor(prefix?: string);
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
/**
 * 缓存管理器
 */
export declare class CacheManager {
    protected config: Required<CacheConfig>;
    protected storage: CacheStorage;
    private keyCache;
    protected stats: CacheStats;
    constructor(config?: CacheConfig);
    /**
     * 获取缓存
     */
    get<T = unknown>(config: RequestConfig): Promise<ResponseData<T> | null>;
    /**
     * 设置缓存
     */
    set<T = unknown>(config: RequestConfig, response: ResponseData<T>): Promise<void>;
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
     * 获取当前配置
     */
    getConfig(): Required<CacheConfig>;
    /**
     * 获取缓存统计
     */
    getStats(): CacheStats;
    /**
     * 获取缓存的键（性能优化版本）
     */
    protected getCachedKey(config: RequestConfig): string;
    /**
     * 快速字符串化对象（优化版：小对象直接用JSON.stringify）
     */
    private fastStringify;
    /**
     * 默认缓存键生成器
     */
    private defaultKeyGenerator;
}
/**
 * 增强缓存配置
 */
export interface EnhancedCacheConfig extends CacheConfig {
    /** 缓存策略 */
    strategy?: 'lru' | 'lfu' | 'fifo' | 'ttl';
    /** 最大缓存大小（字节） */
    maxSize?: number;
    /** 是否启用压缩 */
    compression?: boolean;
    /** 缓存预热配置 */
    preload?: {
        enabled: boolean;
        urls: string[];
    };
    /** 缓存失效策略 */
    invalidation?: {
        /** 基于标签的失效 */
        tags?: boolean;
        /** 基于依赖的失效 */
        dependencies?: boolean;
    };
    /** 缓存统计 */
    stats?: boolean;
}
/**
 * 缓存统计信息
 */
export interface CacheStats {
    /** 命中次数 */
    hits: number;
    /** 未命中次数 */
    misses: number;
    /** 命中率 */
    hitRate: number;
    /** 缓存大小 */
    size: number;
    /** 总内存使用量（字节） */
    memoryUsage: number;
    /** 最近访问的键 */
    recentKeys: string[];
    /** 最热门的键 */
    hotKeys: Array<{
        key: string;
        accessCount: number;
    }>;
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
    /** 是否压缩 */
    compressed?: boolean;
}
/**
 * 增强的缓存项
 */
export interface EnhancedCacheItem extends CacheItem {
    /** 元数据 */
    metadata: CacheItemMetadata;
}
/**
 * 增强的缓存管理器
 */
export declare class EnhancedCacheManager extends CacheManager {
    private enhancedConfig;
    private accessLog;
    private tagIndex;
    private dependencyGraph;
    constructor(config?: EnhancedCacheConfig);
    /**
     * 增强的获取方法
     */
    get<T = any>(config: RequestConfig): Promise<ResponseData<T> | null>;
    /**
     * 增强的设置方法
     */
    set<T = any>(config: RequestConfig, response: ResponseData<T>, options?: {
        tags?: string[];
        dependencies?: string[];
        compress?: boolean;
    }): Promise<void>;
    /**
     * 基于标签失效缓存（批量优化）
     */
    invalidateByTag(tag: string): Promise<number>;
    /**
     * 基于依赖失效缓存
     */
    invalidateByDependency(dependency: string): Promise<number>;
    /**
     * 缓存预热
     */
    preload(urls: string[]): Promise<void>;
    /**
     * 获取缓存统计
     */
    getStats(): CacheStats;
    /**
     * 重置统计
     */
    resetStats(): void;
    /**
     * 获取热门键
     */
    getHotKeys(limit?: number): Array<{
        key: string;
        accessCount: number;
    }>;
    /**
     * 清理过期缓存
     */
    cleanup(): Promise<number>;
    /**
     * 更新访问日志
     */
    private updateAccessLog;
    /**
     * 更新最近访问的键
     */
    private updateRecentKeys;
    /**
     * 更新标签索引
     */
    private updateTagIndex;
    /**
     * 更新依赖图
     */
    private updateDependencyGraph;
    /**
     * 更新统计信息
     */
    private updateStats;
}
/**
 * 创建缓存管理器
 */
export declare function createCacheManager(config?: CacheConfig): CacheManager;
/**
 * 创建增强缓存管理器
 */
export declare function createEnhancedCacheManager(config?: EnhancedCacheConfig): EnhancedCacheManager;
/**
 * 创建内存缓存存储
 */
export declare function createMemoryStorage(): MemoryCacheStorage;
/**
 * 创建 LocalStorage 缓存存储
 */
export declare function createLocalStorage(prefix?: string): LocalStorageCacheStorage;
export {};
