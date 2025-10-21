import type { MaybeRef, Ref } from 'vue';
import type { HttpClientConfig, RequestConfig } from '../types';
/**
 * 资源操作选项
 */
export interface ResourceOptions<T> {
    /** 是否立即加载数据 */
    immediate?: boolean;
    /** 是否在组件卸载时取消请求 */
    cancelOnUnmount?: boolean;
    /** 数据转换函数 */
    transform?: (data: any) => T;
    /** 成功回调 */
    onSuccess?: (data: T, operation: 'list' | 'get' | 'create' | 'update' | 'delete') => void;
    /** 错误回调 */
    onError?: (error: Error, operation: 'list' | 'get' | 'create' | 'update' | 'delete') => void;
    /** HTTP客户端配置 */
    clientConfig?: HttpClientConfig;
}
/**
 * 资源操作返回值
 */
export interface ResourceReturn<T> {
    /** 数据列表 */
    items: Ref<T[]>;
    /** 当前项 */
    current: Ref<T | null>;
    /** 加载状态 */
    loading: Ref<boolean>;
    /** 错误信息 */
    error: Ref<Error | null>;
    /** 是否有错误 */
    hasError: Ref<boolean>;
    /** 获取列表 */
    list: (config?: RequestConfig) => Promise<T[]>;
    /** 获取单个项 */
    get: (id: string | number, config?: RequestConfig) => Promise<T | null>;
    /** 创建项 */
    create: (data: Partial<T>, config?: RequestConfig) => Promise<T | null>;
    /** 更新项 */
    update: (id: string | number, data: Partial<T>, config?: RequestConfig) => Promise<T | null>;
    /** 删除项 */
    remove: (id: string | number, config?: RequestConfig) => Promise<boolean>;
    /** 重置状态 */
    reset: () => void;
    /** 清除错误 */
    clearError: () => void;
    /** 刷新列表 */
    refresh: () => Promise<T[]>;
}
/**
 * 资源管理hook
 * 提供完整的CRUD操作
 *
 * @example
 * ```ts
 * const { items, current, loading, list, get, create, update, remove } = useResource<User>('/api/users')
 *
 * // 获取列表
 * await list()
 *
 * // 获取单个用户
 * await get(1)
 *
 * // 创建用户
 * await create({ name: 'John', email: 'john@example.com' })
 *
 * // 更新用户
 * await update(1, { name: 'Jane' })
 *
 * // 删除用户
 * await remove(1)
 * ```
 */
export declare function useResource<T = any>(baseUrl: MaybeRef<string>, options?: ResourceOptions<T>): ResourceReturn<T>;
