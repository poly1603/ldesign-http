/**
 * 请求池化模块
 * 提供连接池管理和请求复用功能
 */
import type { RequestConfig } from '../types';
/**
 * 连接信息
 */
export interface ConnectionInfo {
    id: string;
    host: string;
    port: number;
    protocol: string;
    createdAt: number;
    lastUsedAt: number;
    useCount: number;
    state: 'idle' | 'active' | 'closed';
}
/**
 * 连接池配置
 */
export interface PoolConfig {
    maxConnections?: number;
    maxIdleConnections?: number;
    maxConnectionAge?: number;
    idleTimeout?: number;
    connectionTimeout?: number;
    keepAlive?: boolean;
    keepAliveTimeout?: number;
    pipelining?: boolean;
    maxPipelineLength?: number;
}
/**
 * 连接池统计
 */
export interface PoolStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    totalRequests: number;
    connectionReuse: number;
    averageRequestsPerConnection: number;
    connectionErrors: number;
}
/**
 * 请求连接池（优化版）
 *
 * 优化点：
 * 1. 事件驱动替代轮询，减少 CPU 占用
 * 2. 优化连接验证，缓存验证结果
 * 3. 合并定时器，减少定时器数量
 */
export declare class RequestPool {
    private connections;
    private config;
    private stats;
    private cleanupTimer?;
    private waitingQueues;
    constructor(config?: PoolConfig);
    /**
     * 获取或创建连接（优化版）
     */
    getConnection(config: RequestConfig): Promise<ConnectionInfo>;
    /**
     * 释放连接
     */
    releaseConnection(connection: ConnectionInfo): void;
    /**
     * 创建新连接
     */
    private createConnection;
    /**
     * 等待可用连接（优化版 - 事件驱动）
     */
    private waitForConnection;
    /**
     * 标记连接为活跃
     */
    private markConnectionActive;
    /**
     * 检查连接是否有效
     */
    private isConnectionValid;
    /**
     * 关闭连接
     */
    private closeConnection;
    /**
     * 修剪空闲连接
     */
    private trimIdleConnections;
    /**
     * 通知等待者（优化版 - 事件驱动）
     */
    private notifyWaiters;
    /**
     * 获取连接键值
     */
    private getConnectionKey;
    /**
     * 启动定期清理
     */
    private startCleanup;
    /**
     * 获取统计信息
     */
    getStats(): PoolStats;
    /**
     * 获取连接详情
     */
    getConnectionDetails(): Map<string, ConnectionInfo[]>;
    /**
     * 关闭所有连接
     */
    closeAll(): void;
    /**
     * 生成唯一ID
     */
    private generateId;
    /**
     * 销毁连接池
     */
    destroy(): void;
}
/**
 * 创建请求池
 */
export declare function createRequestPool(config?: PoolConfig): RequestPool;
/**
 * 默认连接池实例
 */
export declare const defaultPool: RequestPool;
