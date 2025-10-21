/**
 * 网络状态感知
 *
 * 监听网络状态变化，自动处理离线/在线场景
 */
/**
 * 网络状态
 */
export declare enum NetworkStatus {
    /** 在线 */
    ONLINE = "online",
    /** 离线 */
    OFFLINE = "offline",
    /** 未知 */
    UNKNOWN = "unknown"
}
/**
 * 连接类型
 */
export declare enum ConnectionType {
    /** WiFi */
    WIFI = "wifi",
    /** 4G */
    CELLULAR_4G = "4g",
    /** 3G */
    CELLULAR_3G = "3g",
    /** 2G */
    CELLULAR_2G = "2g",
    /** 未知 */
    UNKNOWN = "unknown"
}
/**
 * 网络状态信息
 */
export interface NetworkInfo {
    /** 是否在线 */
    online: boolean;
    /** 连接类型 */
    connectionType: ConnectionType;
    /** 是否按流量计费 */
    metered: boolean;
    /** 下行速度(Mbps) */
    downlink?: number;
    /** 往返时间(ms) */
    rtt?: number;
    /** 有效类型 */
    effectiveType?: string;
}
/**
 * 网络状态监听器配置
 */
export interface NetworkMonitorConfig {
    /** 是否启用 */
    enabled?: boolean;
    /** 离线时是否暂停请求 */
    pauseOnOffline?: boolean;
    /** 在线时是否自动重试失败的请求 */
    retryOnOnline?: boolean;
    /** 状态变化回调 */
    onStatusChange?: (status: NetworkStatus, info: NetworkInfo) => void;
    /** 离线回调 */
    onOffline?: () => void;
    /** 在线回调 */
    onOnline?: () => void;
}
/**
 * 网络状态监听器
 *
 * @example
 * ```typescript
 * const monitor = new NetworkMonitor({
 *  enabled: true,
 *  onStatusChange: (status, info) => {
 *
 *  },
 *  onOffline: () => {
 *
 *  },
 *  onOnline: () => {
 *
 *  },
 * })
 *
 * monitor.start()
 *
 * // 获取当前状态
 * const info = monitor.getNetworkInfo()
 *
 * ```
 */
export declare class NetworkMonitor {
    config: Required<Omit<NetworkMonitorConfig, 'onStatusChange' | 'onOffline' | 'onOnline'>> & Pick<NetworkMonitorConfig, 'onStatusChange' | 'onOffline' | 'onOnline'>;
    private currentStatus;
    private listeners;
    private isMonitoring;
    constructor(config?: NetworkMonitorConfig);
    /**
     * 开始监听
     */
    start(): void;
    /**
     * 停止监听
     */
    stop(): void;
    /**
     * 获取当前网络状态
     */
    getStatus(): NetworkStatus;
    /**
     * 是否在线
     */
    isOnline(): boolean;
    /**
     * 是否离线
     */
    isOffline(): boolean;
    /**
     * 获取网络信息
     */
    getNetworkInfo(): NetworkInfo;
    /**
     * 处理状态变化
     */
    private handleStatusChange;
    /**
     * 更新状态
     */
    private updateStatus;
    /**
     * 解析连接类型
     */
    private parseConnectionType;
    /**
     * 判断当前网络是否适合大文件传输
     */
    isSuitableForLargeTransfer(): boolean;
    /**
     * 销毁监听器
     */
    destroy(): void;
}
/**
 * 创建网络状态监听器
 */
export declare function createNetworkMonitor(config?: NetworkMonitorConfig): NetworkMonitor;
/**
 * 全局网络状态监听器
 */
export declare const globalNetworkMonitor: NetworkMonitor;
/**
 * 网络状态拦截器
 *
 * 在离线时阻止请求，在线时自动重试
 */
export declare function createNetworkInterceptor(config?: NetworkMonitorConfig): {
    request: {
        onFulfilled: (requestConfig: any) => Promise<any>;
    };
    destroy: () => void;
};
/**
 * 便捷函数: 等待网络恢复
 */
export declare function waitForOnline(timeout?: number): Promise<void>;
