import type { ErrorInterceptor, InterceptorManager } from '../types';
/**
 * 拦截器项
 */
interface InterceptorItem<T> {
    fulfilled: T;
    rejected?: ErrorInterceptor;
}
/**
 * 拦截器管理器实现（优化版）
 *
 * 优化点：
 * 1. 使用紧凑数组替代稀疏数组，减少内存占用
 * 2. 使用 Map 存储 ID 映射，提高查找效率
 * 3. 删除时真正移除元素，避免内存泄漏
 * 4. 优化遍历性能，无需检查 null 值
 */
export declare class InterceptorManagerImpl<T> implements InterceptorManager<T> {
    private interceptors;
    private idMap;
    private nextId;
    /**
     * 添加拦截器
     * @param fulfilled 成功处理函数
     * @param rejected 错误处理函数
     * @returns 拦截器 ID
     */
    use(fulfilled: T, rejected?: ErrorInterceptor): number;
    /**
     * 移除拦截器（优化版）
     * @param id 拦截器 ID
     */
    eject(id: number): void;
    /**
     * 清空所有拦截器
     */
    clear(): void;
    /**
     * 遍历拦截器（高性能版 - 使用索引遍历）
     * @param fn 遍历函数
     */
    forEach(fn: (interceptor: InterceptorItem<T>) => void): void;
    /**
     * 获取所有有效的拦截器（优化版）
     */
    getInterceptors(): Array<InterceptorItem<T>>;
    /**
     * 获取拦截器数量
     */
    size(): number;
    /**
     * 检查是否有拦截器
     */
    isEmpty(): boolean;
}
export {};
