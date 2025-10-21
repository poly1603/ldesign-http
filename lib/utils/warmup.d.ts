/**
 * 连接预热和 Keep-Alive 管理器
 *
 * 提供连接预热、DNS预解析、TCP连接复用等功能
 * 提升首次请求性能和整体吞吐量
 */
import type { HttpClient } from '../types';
/**
 * 预热配置
 */
export interface WarmupConfig {
    /** 要预热的URL列表 */
    urls: string[];
    /** 预热方法，默认为 HEAD */
    method?: 'HEAD' | 'OPTIONS' | 'GET';
    /** 并发预热数量 */
    concurrency?: number;
    /** 预热超时时间（毫秒） */
    timeout?: number;
    /** 是否启用DNS预解析 */
    dnsPrefetch?: boolean;
    /** 是否启用预连接 */
    preconnect?: boolean;
    /** 失败时是否静默（不抛出错误） */
    silent?: boolean;
}
/**
 * 预热结果
 */
export interface WarmupResult {
    /** 成功预热的URL */
    succeeded: string[];
    /** 失败的URL */
    failed: Array<{
        url: string;
        error: Error;
    }>;
    /** 总耗时 */
    duration: number;
    /** 统计信息 */
    stats: {
        total: number;
        success: number;
        failed: number;
        averageTime: number;
    };
}
/**
 * Keep-Alive 配置
 */
export interface KeepAliveConfig {
    /** 是否启用 Keep-Alive */
    enabled?: boolean;
    /** 最大空闲时间（毫秒） */
    maxIdleTime?: number;
    /** 最大连接数 */
    maxConnections?: number;
    /** 每个主机的最大连接数 */
    maxConnectionsPerHost?: number;
}
/**
 * 连接预热管理器
 *
 * @example
 * ```typescript
 * const warmupManager = new WarmupManager(client)
 *
 * // 预热关键API端点
 * await warmupManager.warmup({
 *   urls: [
 *     'https://api.example.com/users',
 *     'https://api.example.com/posts',
 *     'https://api.example.com/comments'
 *   ],
 *   concurrency: 3
 * })
 *
 * // 预连接到多个域名
 * warmupManager.preconnect([
 *   'https://api.example.com',
 *   'https://cdn.example.com',
 *   'https://static.example.com'
 * ])
 * ```
 */
export declare class WarmupManager {
    private client;
    private preconnectedDomains;
    constructor(client: HttpClient);
    /**
     * 预热连接
     *
     * 通过发送轻量级请求（HEAD/OPTIONS）来建立连接，
     * 使后续请求可以复用连接，减少延迟
     *
     * @param config - 预热配置
     * @returns 预热结果
     */
    warmup(config: WarmupConfig): Promise<WarmupResult>;
    /**
     * DNS 预解析
     *
     * 在浏览器中添加 dns-prefetch link 标签
     *
     * @param urls - URL列表
     */
    dnsPrefetch(urls: string[]): void;
    /**
     * 预连接
     *
     * 在浏览器中添加 preconnect link 标签
     * 建立早期连接（DNS + TCP + TLS）
     *
     * @param origins - 源地址列表
     */
    preconnect(origins: string[]): void;
    /**
     * 预加载资源
     *
     * @param url - 资源URL
     * @param as - 资源类型
     */
    preload(url: string, as?: 'fetch' | 'script' | 'style' | 'image'): void;
    /**
     * 批量预热（自动重试失败的URL）
     *
     * @param config - 预热配置
     * @param maxRetries - 最大重试次数
     * @returns 预热结果
     */
    warmupWithRetry(config: WarmupConfig, maxRetries?: number): Promise<WarmupResult>;
    /**
     * 智能预热
     *
     * 根据访问频率自动预热常用端点
     *
     * @param urlPatterns - URL模式列表
     * @param threshold - 预热阈值（访问次数）
     */
    smartWarmup(urlPatterns: string[], threshold?: number): Promise<WarmupResult>;
    /**
     * 清理预热资源
     */
    cleanup(): void;
    /**
     * 创建批次
     */
    private createBatches;
    /**
     * 检查是否已存在 link 标签
     */
    private hasLinkTag;
    /**
     * 获取访问计数（模拟，实际应该从本地存储读取）
     */
    private getAccessCounts;
}
/**
 * 创建预热管理器
 *
 * @param client - HTTP 客户端实例
 * @returns 预热管理器实例
 */
export declare function createWarmupManager(client: HttpClient): WarmupManager;
/**
 * Keep-Alive 管理器
 *
 * 管理长连接，优化连接复用
 */
export declare class KeepAliveManager {
    private config;
    private connections;
    constructor(config?: KeepAliveConfig);
    /**
     * 获取或创建连接
     */
    acquire(host: string): void;
    /**
     * 释放连接
     */
    release(host: string): void;
    /**
     * 获取连接统计
     */
    getStats(): {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        connectionsByHost: Record<string, number>;
    };
    /**
     * 清理所有连接
     */
    cleanup(): void;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<KeepAliveConfig>): void;
}
/**
 * 创建 Keep-Alive 管理器
 */
export declare function createKeepAliveManager(config?: KeepAliveConfig): KeepAliveManager;
/**
 * 全局预热工具函数
 *
 * @param client - HTTP 客户端
 * @param urls - 要预热的URL列表
 * @param options - 预热选项
 */
export declare function warmupConnections(client: HttpClient, urls: string[], options?: Partial<WarmupConfig>): Promise<WarmupResult>;
