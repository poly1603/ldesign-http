/**
 * SSE 事件类型
 */
export interface SSEEvent {
    /** 事件类型 */
    type: string;
    /** 事件数据 */
    data: string;
    /** 事件 ID */
    id?: string;
    /** 重连延迟 */
    retry?: number;
}
/**
 * SSE 客户端配置
 */
export interface SSEClientConfig {
    /** SSE 端点 URL */
    url: string;
    /** 请求配置 */
    withCredentials?: boolean;
    /** 自定义请求头 */
    headers?: Record<string, string>;
    /** 自动重连 */
    autoReconnect?: boolean;
    /** 重连延迟（毫秒） */
    reconnectDelay?: number;
    /** 最大重连次数 */
    maxReconnectAttempts?: number;
    /** 心跳超时（毫秒） */
    heartbeatTimeout?: number;
    /** 调试模式 */
    debug?: boolean;
}
/**
 * SSE 连接状态
 */
export declare enum SSEStatus {
    CONNECTING = "connecting",
    CONNECTED = "connected",
    DISCONNECTING = "disconnecting",
    DISCONNECTED = "disconnected",
    ERROR = "error"
}
/**
 * SSE 事件监听器
 */
export type SSEEventListener<T = any> = (event: T) => void;
/**
 * SSE 客户端
 *
 * 提供 Server-Sent Events (SSE) 连接管理，支持自动重连、心跳检测等功能
 *
 * @example
 * ```typescript
 * const sseClient = new SSEClient({
 *   url: 'http://localhost:3000/events',
 *   autoReconnect: true,
 * })
 *
 * // 监听消息
 * sseClient.on('message', (event) => {
 *
 * })
 *
 * // 监听自定义事件
 * sseClient.addEventListener('notification', (event) => {
 *
 * })
 *
 * // 连接
 * await sseClient.connect()
 *
 * // 断开连接
 * sseClient.disconnect()
 * ```
 */
export declare class SSEClient {
    private config;
    private eventSource;
    private status;
    private eventListeners;
    private reconnectAttempts;
    private reconnectTimer;
    private heartbeatTimer;
    private lastEventId;
    constructor(config: SSEClientConfig);
    /**
     * 连接 SSE
     */
    connect(): Promise<void>;
    /**
     * 断开连接
     */
    disconnect(): void;
    /**
     * 监听默认消息事件
     */
    on(event: 'message' | 'open' | 'close' | 'error' | 'reconnect' | 'reconnecting' | 'reconnect_failed', listener: SSEEventListener): () => void;
    /**
     * 监听自定义事件
     */
    addEventListener(event: string, listener: SSEEventListener): () => void;
    /**
     * 取消监听
     */
    removeEventListener(event: string, listener: SSEEventListener): void;
    /**
     * 监听一次事件
     */
    once(event: string, listener: SSEEventListener): void;
    /**
     * 获取连接状态
     */
    getStatus(): SSEStatus;
    /**
     * 是否已连接
     */
    isConnected(): boolean;
    /**
     * 获取重连次数
     */
    getReconnectAttempts(): number;
    /**
     * 获取最后的事件 ID
     */
    getLastEventId(): string | null;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<SSEClientConfig>): void;
    /**
     * 获取原生 EventSource 实例
     */
    getEventSource(): EventSource | null;
    /**
     * 获取就绪状态
     */
    getReadyState(): number;
    /**
     * 触发事件
     */
    private emit;
    /**
     * 处理消息
     */
    private handleMessage;
    /**
     * 处理断开连接
     */
    private handleDisconnection;
    /**
     * 重连
     */
    private reconnect;
    /**
     * 启动心跳检测
     */
    private startHeartbeat;
    /**
     * 停止心跳检测
     */
    private stopHeartbeat;
    /**
     * 重置心跳定时器
     */
    private resetHeartbeat;
    /**
     * 日志输出
     */
    private log;
}
/**
 * 创建 SSE 客户端
 */
export declare function createSSEClient(config: SSEClientConfig): SSEClient;
/**
 * 基础 SSE 客户端包装器
 */
export declare class BasicSSEClient {
    private client;
    private handlers;
    constructor(url: string, options?: Partial<SSEClientConfig>);
    /**
     * 订阅事件流
     */
    subscribe(eventType: string, handler: SSEEventListener): Promise<() => void>;
    /**
     * 取消订阅
     */
    unsubscribe(eventType?: string): void;
    /**
     * 断开连接
     */
    disconnect(): void;
    /**
     * 获取底层客户端
     */
    getClient(): SSEClient;
}
/**
 * 创建基础 SSE 客户端
 */
export declare function createBasicSSEClient(url: string, options?: Partial<SSEClientConfig>): BasicSSEClient;
