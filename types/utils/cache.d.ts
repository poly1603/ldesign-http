import type { CacheConfig, CacheStorage, RequestConfig, ResponseData } from '../types';
/**
 * 缓存项接口
 */
interface CacheItem<T = any> {
    data: ResponseData<T>;
    timestamp: number;
    ttl: number;
}
/**
 * 内存缓存存储实现
 */
export declare class MemoryCacheStorage implements CacheStorage {
    private cache;
    private timers;
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    /**
     * 获取缓存大小
     */
    size(): number;
    /**
     * 获取所有缓存键
     */
    keys(): string[];
}
/**
 * LocalStorage 缓存存储实现
 */
export declare class LocalStorageCacheStorage implements CacheStorage {
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
export declare class CacheManager {
    private config;
    protected storage: CacheStorage;
    private keyCache;
    constructor(config?: CacheConfig);
    /**
     * 获取缓存
     */
    get<T = any>(config: RequestConfig): Promise<ResponseData<T> | null>;
    /**
     * 设置缓存
     */
    set<T = any>(config: RequestConfig, response: ResponseData<T>): Promise<void>;
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
     * 获取缓存的键（带缓存优化）
     */
    protected getCachedKey(config: RequestConfig): string;
    /**
     * 默认缓存键生成器
     */
    private defaultKeyGenerator;
}
/**
 * 高级缓存配置
 */
export interface AdvancedCacheConfig extends CacheConfig {
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
export declare class AdvancedCacheManager extends CacheManager {
    private stats;
    private advancedConfig;
    private accessLog;
    private tagIndex;
    private dependencyGraph;
    constructor(config?: AdvancedCacheConfig);
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
     * 基于标签失效缓存
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
     * 更新命中率
     */
    private updateHitRate;
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
 * 创建高级缓存管理器
 */
export declare function createAdvancedCacheManager(config?: AdvancedCacheConfig): AdvancedCacheManager;
/**
 * 创建内存缓存存储
 */
export declare function createMemoryStorage(): MemoryCacheStorage;
/**
 * 创建 LocalStorage 缓存存储
 */
export declare function createLocalStorage(prefix?: string): LocalStorageCacheStorage;
export {};
