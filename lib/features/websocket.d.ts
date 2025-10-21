/**
 * WebSocket 连接状态
 */
export declare enum WebSocketStatus {
    CONNECTING = "connecting",
    CONNECTED = "connected",
    DISCONNECTING = "disconnecting",
    DISCONNECTED = "disconnected",
    ERROR = "error"
}
/**
 * WebSocket 消息类型
 */
export interface WebSocketMessage<T = any> {
    type: string;
    data: T;
    timestamp?: number;
    id?: string;
}
/**
 * WebSocket 客户端配置
 */
export interface WebSocketClientConfig {
    /** WebSocket URL */
    url: string;
    /** 子协议 */
    protocols?: string | string[];
    /** 自动重连 */
    autoReconnect?: boolean;
    /** 重连延迟（毫秒） */
    reconnectDelay?: number;
    /** 最大重连次数 */
    maxReconnectAttempts?: number;
    /** 心跳间隔（毫秒） */
    heartbeatInterval?: number;
    /** 心跳消息 */
    heartbeatMessage?: any;
    /** 连接超时（毫秒） */
    connectionTimeout?: number;
    /** 调试模式 */
    debug?: boolean;
    /** 自定义请求头（仅 Node.js 环境） */
    headers?: Record<string, string>;
}
/**
 * WebSocket 事件���型
 */
export type WebSocketEventType = 'open' | 'close' | 'error' | 'message' | 'reconnect' | 'reconnecting' | 'reconnect_failed';
/**
 * WebSocket 事件监听器
 */
export type WebSocketEventListener<T = any> = (data?: T) => void;
/**
 * WebSocket 客户端
 *
 * 提供 WebSocket 连接管理，支持自动重连、心跳检测、消息队列等功能
 *
 * @example
 * ```typescript
 * const wsClient = new WebSocketClient({
 *   url: 'ws://localhost:3000',
 *   autoReconnect: true,
 *   heartbeatInterval: 30000,
 * })
 *
 * // 监听消息
 * wsClient.on('message', (message) => {
 *
 * })
 *
 * // 连接
 * await wsClient.connect()
 *
 * // 发送消息
 * wsClient.send({ type: 'chat', data: 'Hello' })
 *
 * // 断开连接
 * wsClient.disconnect()
 * ```
 */
export declare class WebSocketClient {
    private config;
    private ws;
    private status;
    private eventListeners;
    private messageQueue;
    private reconnectAttempts;
    private reconnectTimer;
    private heartbeatTimer;
    private connectionTimer;
    constructor(config: WebSocketClientConfig);
    /**
     * 连接 WebSocket
     */
    connect(): Promise<void>;
    /**
     * 断开连接
     */
    disconnect(code?: number, reason?: string): void;
    /**
     * 发送消息
     */
    send(data: any): boolean;
    /**
     * 监听事件
     */
    on<T = any>(event: WebSocketEventType, listener: WebSocketEventListener<T>): () => void;
    /**
     * 取消监听
     */
    off(event: WebSocketEventType, listener: WebSocketEventListener): void;
    /**
     * 监听一次事件
     */
    once<T = any>(event: WebSocketEventType, listener: WebSocketEventListener<T>): void;
    /**
     * 获取连接状态
     */
    getStatus(): WebSocketStatus;
    /**
     * 是否已连接
     */
    isConnected(): boolean;
    /**
     * 获取队列大小
     */
    getQueueSize(): number;
    /**
     * 清空消息队列
     */
    clearQueue(): void;
    /**
     * 获取重连次数
     */
    getReconnectAttempts(): number;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<WebSocketClientConfig>): void;
    /**
     * 获取原生 WebSocket 实例
     */
    getWebSocket(): WebSocket | null;
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
     * 启动心跳
     */
    private startHeartbeat;
    /**
     * 停止心跳
     */
    private stopHeartbeat;
    /**
     * 刷新消息队列
     */
    private flushMessageQueue;
    /**
     * 日志输出
     */
    private log;
}
/**
 * 创建 WebSocket 客户端
 */
export declare function createWebSocketClient(config: WebSocketClientConfig): WebSocketClient;
