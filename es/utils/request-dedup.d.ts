/**
 * 请求去重键生成器模块
 */
import type { RequestConfig } from '../types';
/**
 * 去重键生成器配置
 */
export interface DeduplicationKeyConfig {
    /** 是否包含请求方法 */
    includeMethod?: boolean;
    /** 是否包含URL */
    includeUrl?: boolean;
    /** 是否包含查询参数 */
    includeParams?: boolean;
    /** 是否包含请求体 */
    includeData?: boolean;
    /** 是否包含请求头 */
    includeHeaders?: boolean;
    /** 要包含的特定请求头 */
    specificHeaders?: string[];
    /** 自定义键生成函数 */
    customGenerator?: (config: RequestConfig) => string;
}
/**
 * 智能去重键生成器（优化版）
 *
 * 优化点：
 * 1. 添加键缓存，避免重复计算
 * 2. 使用 WeakMap 自动管理缓存生命周期
 * 3. 优化序列化性能
 */
export declare class DeduplicationKeyGenerator {
    private config;
    private keyCache;
    private stringKeyCache;
    private maxCacheSize;
    constructor(config?: DeduplicationKeyConfig);
    /**
     * 生成去重键（优化版 - 带缓存）
     */
    generate(requestConfig: RequestConfig): string;
    /**
     * 实际生成键的逻辑
     */
    private generateKey;
    /**
     * 缓存字符串键（LRU优化版）
     */
    private cacheStringKey;
    /**
     * 清除缓存
     */
    clearCache(): void;
    /**
     * 序列化参数（极致优化版 - 使用数组预分配）
     */
    private serializeParams;
    /**
     * 序列化数据（优化版）
     */
    private serializeData;
    /**
     * 序列化请求头（优化版）
     */
    private serializeHeaders;
    /**
     * 序列化特定请求头（优化版）
     */
    private serializeSpecificHeaders;
}
/**
 * 创建去重键生成器
 */
export declare function createDeduplicationKeyGenerator(config?: DeduplicationKeyConfig): DeduplicationKeyGenerator;
export declare const defaultKeyGenerator: DeduplicationKeyGenerator;
/**
 * 生成请求唯一键（简化版本，向后兼容）
 */
export declare function generateRequestKey(config: RequestConfig): string;
