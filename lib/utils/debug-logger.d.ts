/**
 * 日志管理模块
 *
 * 提供请求响应日志记录、管理和导出功能
 */
import type { HttpError, RequestConfig, ResponseData } from '../types';
/**
 * 调试日志级别
 */
export declare enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
    TRACE = 5
}
/**
 * 日志条目类型
 */
export type LogEntryType = 'request' | 'response' | 'error' | 'cache_hit' | 'cache_miss' | 'retry' | 'redirect' | 'abort' | 'custom';
/**
 * 基础日志条目
 */
export interface BaseLogEntry {
    /** 日志ID */
    id: string;
    /** 日志类型 */
    type: LogEntryType;
    /** 日志级别 */
    level: LogLevel;
    /** 时间戳 */
    timestamp: number;
    /** 会话ID */
    sessionId?: string;
    /** 追踪ID */
    traceId?: string;
    /** 标签 */
    tags?: string[];
    /** 元数据 */
    metadata?: Record<string, any>;
}
/**
 * 请求日志条目
 */
export interface RequestLogEntry extends BaseLogEntry {
    type: 'request';
    /** 请求配置 */
    config: RequestConfig;
    /** 请求方法 */
    method: string;
    /** 请求URL */
    url: string;
    /** 请求头 */
    headers?: Record<string, string>;
    /** 请求体 */
    body?: any;
    /** 请求大小 */
    size?: number;
}
/**
 * 响应日志条目
 */
export interface ResponseLogEntry extends BaseLogEntry {
    type: 'response';
    /** 关联的请求ID */
    requestId: string;
    /** 响应状态 */
    status: number;
    /** 响应头 */
    headers?: Record<string, string>;
    /** 响应体 */
    body?: any;
    /** 响应大小 */
    size?: number;
    /** 持续时间 */
    duration: number;
    /** 响应数据 */
    response?: ResponseData;
}
/**
 * 错误日志条目
 */
export interface ErrorLogEntry extends BaseLogEntry {
    type: 'error';
    /** 关联的请求ID */
    requestId?: string;
    /** 错误信息 */
    message: string;
    /** 错误堆栈 */
    stack?: string;
    /** 错误代码 */
    code?: string | number;
    /** HTTP错误 */
    httpError?: HttpError;
}
/**
 * 缓存日志条目
 */
export interface CacheLogEntry extends BaseLogEntry {
    type: 'cache_hit' | 'cache_miss';
    /** 缓存键 */
    cacheKey: string;
    /** 缓存策略 */
    strategy?: string;
    /** 缓存年龄 */
    age?: number;
    /** 缓存大小 */
    size?: number;
}
/**
 * 日志条目联合类型
 */
export type LogEntry = RequestLogEntry | ResponseLogEntry | ErrorLogEntry | CacheLogEntry | BaseLogEntry;
/**
 * 日志过滤器
 */
export interface LogFilter {
    /** 日志类型 */
    types?: LogEntryType[];
    /** 日志级别 */
    minLevel?: LogLevel;
    /** 开始时间 */
    startTime?: number;
    /** 结束时间 */
    endTime?: number;
    /** URL模式 */
    urlPattern?: string | RegExp;
    /** 状态码范围 */
    statusRange?: [number, number];
    /** 标签 */
    tags?: string[];
    /** 会话ID */
    sessionId?: string;
    /** 追踪ID */
    traceId?: string;
}
/**
 * 日志存储配置
 */
export interface LogStorageConfig {
    /** 最大日志数量 */
    maxEntries?: number;
    /** 最大存储大小（字节） */
    maxSize?: number;
    /** 日志过期时间（毫秒） */
    ttl?: number;
    /** 是否持久化 */
    persist?: boolean;
    /** 持久化键名 */
    persistKey?: string;
}
/**
 * 日志存储器
 */
export declare class LogStorage {
    private entries;
    private entryOrder;
    private currentSize;
    private config;
    constructor(config?: LogStorageConfig);
    /**
     * 添加日志条目
     */
    add(entry: LogEntry): void;
    /**
     * 获取日志条目
     */
    get(id: string): LogEntry | undefined;
    /**
     * 查询日志条目
     */
    query(filter?: LogFilter): LogEntry[];
    /**
     * 删除日志条目
     */
    remove(id: string): boolean;
    /**
     * 清空所有日志
     */
    clear(): void;
    /**
     * 获取统计信息
     */
    getStats(): {
        totalEntries: number;
        totalSize: number;
        oldestEntry?: LogEntry;
        newestEntry?: LogEntry;
        typeDistribution: Record<LogEntryType, number>;
        levelDistribution: Record<string, number>;
    };
    /**
     * 导出日志
     */
    export(format?: 'json' | 'csv'): string;
    /**
     * 匹配过滤器
     */
    private matchesFilter;
    /**
     * 移除最旧的条目
     */
    private removeOldest;
    /**
     * 移除过期条目
     */
    private removeExpired;
    /**
     * 估算条目大小
     */
    private estimateSize;
    /**
     * 从存储加载
     */
    private loadFromStorage;
    /**
     * 保存到存储
     */
    private saveToStorage;
    /**
     * 从存储移除
     */
    private removeFromStorage;
}
/**
 * 创建日志存储器
 */
export declare function createLogStorage(config?: LogStorageConfig): LogStorage;
