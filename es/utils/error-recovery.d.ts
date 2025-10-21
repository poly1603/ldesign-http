/**
 * 错误恢复策略模块
 *
 * 提供各种错误恢复策略的实现
 */
import type { HttpError } from '../types';
/**
 * 错误恢复策略接口
 */
export interface ErrorRecoveryStrategy {
    /** 策略名称 */
    name: string;
    /** 是否可以处理该错误 */
    canHandle: (error: HttpError) => boolean;
    /** 执行恢复策略 */
    recover: (error: HttpError) => Promise<boolean>;
    /** 策略优先级（数字越大优先级越高） */
    priority?: number;
}
/**
 * 内置恢复策略
 */
export declare const builtInStrategies: {
    /**
     * 网络重连策略
     */
    networkReconnect: ErrorRecoveryStrategy;
    /**
     * 认证刷新策略
     */
    authRefresh: ErrorRecoveryStrategy;
    /**
     * 服务降级策略
     */
    serviceFallback: ErrorRecoveryStrategy;
    /**
     * 缓存回退策略
     */
    cacheFailback: ErrorRecoveryStrategy;
};
/**
 * 错误恢复管理器
 */
export declare class ErrorRecoveryManager {
    private strategies;
    constructor();
    /**
     * 添加恢复策略
     */
    addStrategy(strategy: ErrorRecoveryStrategy): void;
    /**
     * 移除恢复策略
     */
    removeStrategy(name: string): void;
    /**
     * 尝试恢复错误
     */
    attemptRecovery(error: HttpError): Promise<{
        recovered: boolean;
        strategy?: string;
    }>;
    /**
     * 获取所有策略
     */
    getStrategies(): ErrorRecoveryStrategy[];
    /**
     * 清除所有策略
     */
    clearStrategies(): void;
    /**
     * 批量尝试恢复
     */
    attemptBatchRecovery(errors: HttpError[]): Promise<Map<HttpError, {
        recovered: boolean;
        strategy?: string;
    }>>;
}
