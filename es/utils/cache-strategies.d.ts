/**
 * 缓存策略模块
 *
 * 提供各种缓存策略和统计功能
 */
import type { RequestConfig, ResponseData } from '../types';
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
 * 缓存策略接口
 */
export interface CacheStrategy {
    /** 策略名称 */
    name: string;
    /** 是否应该缓存该响应 */
    shouldCache: (config: RequestConfig, response: ResponseData) => boolean;
    /** 获取缓存TTL */
    getTTL: (config: RequestConfig, response: ResponseData) => number;
    /** 生成缓存键 */
    generateKey: (config: RequestConfig) => string;
}
/**
 * LRU缓存策略
 */
export declare class LRUCacheStrategy implements CacheStrategy {
    name: string;
    private maxSize;
    private accessOrder;
    private counter;
    constructor(maxSize?: number);
    shouldCache(config: RequestConfig, response: ResponseData): boolean;
    getTTL(_config: RequestConfig, response: ResponseData): number;
    generateKey(config: RequestConfig): string;
    /**
     * 记录访问顺序
     */
    recordAccess(key: string): void;
    /**
     * 获取最近最少使用的键
     */
    getLRUKey(): string | null;
    /**
     * 淘汰LRU项
     */
    evict(): string | null;
    private parseMaxAge;
}
/**
 * LFU缓存策略
 */
export declare class LFUCacheStrategy implements CacheStrategy {
    name: string;
    private frequency;
    private maxSize;
    constructor(maxSize?: number);
    shouldCache(config: RequestConfig, response: ResponseData): boolean;
    getTTL(_config: RequestConfig, _response: ResponseData): number;
    generateKey(config: RequestConfig): string;
    /**
     * 记录访问频率
     */
    recordAccess(key: string): void;
    /**
     * 获取最少使用的键
     */
    getLFUKey(): string | null;
    /**
     * 淘汰LFU项
     */
    evict(): string | null;
}
/**
 * TTL缓存策略
 */
export declare class TTLCacheStrategy implements CacheStrategy {
    name: string;
    private defaultTTL;
    constructor(defaultTTL?: number);
    shouldCache(_config: RequestConfig, response: ResponseData): boolean;
    getTTL(config: RequestConfig, response: ResponseData): number;
    generateKey(config: RequestConfig): string;
    private parseMaxAge;
}
/**
 * 智能缓存策略（基于机器学习预测）
 */
export declare class SmartCacheStrategy implements CacheStrategy {
    name: string;
    private accessHistory;
    private hitRates;
    shouldCache(config: RequestConfig, response: ResponseData): boolean;
    getTTL(config: RequestConfig, _response: ResponseData): number;
    generateKey(config: RequestConfig): string;
    /**
     * 记录访问历史
     */
    recordAccess(key: string, hit: boolean): void;
}
/**
 * 缓存统计收集器
 */
export declare class CacheStatsCollector {
    private stats;
    private accessLog;
    private maxRecentKeys;
    private maxHotKeys;
    /**
     * 记录缓存命中
     */
    recordHit(key: string): void;
    /**
     * 记录缓存未命中
     */
    recordMiss(key: string): void;
    /**
     * 记录缓存访问
     */
    private recordAccess;
    /**
     * 更新命中率
     */
    private updateHitRate;
    /**
     * 更新最近访问的键
     */
    private updateRecentKeys;
    /**
     * 更新热门键
     */
    private updateHotKeys;
    /**
     * 更新缓存大小
     */
    updateSize(size: number): void;
    /**
     * 更新内存使用量
     */
    updateMemoryUsage(bytes: number): void;
    /**
     * 获取统计信息
     */
    getStats(): CacheStats;
    /**
     * 重置统计
     */
    reset(): void;
}
/**
 * 创建缓存策略
 */
export declare function createCacheStrategy(type?: 'lru' | 'lfu' | 'ttl' | 'smart', options?: any): CacheStrategy;
