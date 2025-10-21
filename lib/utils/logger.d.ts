/**
 * 统一日志管理器
 *
 * 替换所有console.log,提供更好的日志控制
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}
export interface LoggerConfig {
    /** 日志级别 */
    level?: LogLevel;
    /** 是否在生产环境启用 */
    enableInProduction?: boolean;
    /** 自定义日志处理器 */
    customHandler?: (level: LogLevel, message: string, data?: any) => void;
    /** 是否显示时间戳 */
    showTimestamp?: boolean;
    /** 日志前缀 */
    prefix?: string;
}
/**
 * 日志管理器
 *
 * @example
 * ```typescript
 * // 配置日志级别
 * logger.setLevel(LogLevel.WARN) // 只显示警告和错误
 *
 * // 使用日志
 * logger.debug('调试信息', { data: 123 })
 * logger.info('请求已发送')
 * logger.warn('请求耗时较长')
 * logger.error('请求失败', error)
 *
 * // 分组日志
 * logger.group('请求详情')
 * logger.info('URL:', url)
 * logger.info('Method:', method)
 * logger.groupEnd()
 * ```
 */
export declare class Logger {
    private config;
    private isProduction;
    constructor(config?: LoggerConfig);
    /**
     * 设置日志级别
     */
    setLevel(level: LogLevel): void;
    /**
     * 获取当前日志级别
     */
    getLevel(): LogLevel;
    /**
     * 调试日志
     */
    debug(message: string, ...args: any[]): void;
    /**
     * 信息日志
     */
    info(message: string, ...args: any[]): void;
    /**
     * 警告日志
     */
    warn(message: string, ...args: any[]): void;
    /**
     * 错误日志
     */
    error(message: string, ...args: any[]): void;
    /**
     * 分组开始
     */
    group(label: string): void;
    /**
     * 折叠分组开始
     */
    groupCollapsed(label: string): void;
    /**
     * 分组结束
     */
    groupEnd(): void;
    /**
     * 表格输出
     */
    table(data: any): void;
    /**
     * 计时开始
     */
    time(label: string): void;
    /**
     * 计时结束
     */
    timeEnd(label: string): void;
    /**
     * 核心日志方法
     */
    private log;
    /**
     * 判断是否应该输出日志
     */
    private shouldLog;
    /**
     * 格式化消息
     */
    private formatMessage;
    /**
     * 创建子日志器
     */
    createChild(prefix: string): Logger;
}
/**
 * 全局日志器实例
 */
export declare const logger: Logger;
/**
 * 创建日志器
 */
export declare function createLogger(config?: LoggerConfig): Logger;
/**
 * 开发环境专用日志器
 */
export declare const devLogger: Logger;
