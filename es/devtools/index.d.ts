/**
 * HTTP开发工具
 *
 * 提供请求监控、性能分析、调试等开发工具
 */
import type { HttpClient, HttpError, RequestConfig, ResponseData } from '../types';
/**
 * 请求记录
 */
export interface RequestRecord {
    id: string;
    timestamp: number;
    config: RequestConfig;
    duration?: number;
    response?: ResponseData<any>;
    error?: HttpError;
    status: 'pending' | 'success' | 'error' | 'cancelled';
}
/**
 * 开发工具配置
 */
export interface DevToolsConfig {
    /** 是否启用 */
    enabled?: boolean;
    /** 最大记录数 */
    maxRecords?: number;
    /** 是否显示console */
    showConsole?: boolean;
    /** 是否在浏览器console显示 */
    logToConsole?: boolean;
    /** 性能阈值(ms) */
    performanceThreshold?: number;
}
/**
 * HTTP开发工具
 *
 * @example
 * ```typescript
 * // 创建开发工具
 * const devtools = new HttpDevTools({
 *   enabled: process.env.NODE_ENV === 'development',
 *   maxRecords: 100
 * })
 *
 * // 附加到客户端
 * devtools.attach(client)
 *
 * // 查看请求记录
 * )
 *
 * // 查看统计
 * )
 *
 * // 导出数据
 * devtools.export()
 * ```
 */
export declare class HttpDevTools {
    private config;
    private records;
    private client;
    private interceptorIds;
    constructor(config?: DevToolsConfig);
    /**
     * 附加到HTTP客户端
     */
    attach(client: HttpClient): void;
    /**
     * 分离
     */
    detach(): void;
    /**
     * 请求开始
     */
    private onRequestStart;
    /**
     * 请求成功
     */
    private onRequestSuccess;
    /**
     * 请求失败
     */
    private onRequestError;
    /**
     * 添加记录
     */
    private addRecord;
    /**
     * 查找记录
     */
    private findRecord;
    /**
     * 生成ID
     */
    private generateId;
    /**
     * 获取所有记录
     */
    getRecords(): RequestRecord[];
    /**
     * 获取失败的请求
     */
    getFailedRequests(): RequestRecord[];
    /**
     * 获取慢请求
     */
    getSlowRequests(): RequestRecord[];
    /**
     * 获取统计信息
     */
    getStats(): {
        total: number;
        pending: number;
        success: number;
        error: number;
        cancelled: number;
        averageDuration: number;
        slowRequests: number;
    };
    /**
     * 清除所有记录
     */
    clear(): void;
    /**
     * 导出数据为JSON
     */
    export(): string;
    /**
     * 下载导出文件
     */
    download(): void;
    /**
     * 在浏览器console打印统计
     */
    printStats(): void;
}
/**
 * 创建开发工具
 */
export declare function createDevTools(config?: DevToolsConfig): HttpDevTools;
/**
 * 全局开发工具实例
 */
export declare const globalDevTools: HttpDevTools;
