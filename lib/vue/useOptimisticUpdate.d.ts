import type { Ref } from 'vue';
import type { HttpClient, RequestConfig } from '../types';
/**
 * 乐观更新配置
 */
export interface OptimisticUpdateOptions<T> {
    /** 乐观更新函数 */
    optimisticUpdate: (currentData: T, input: any) => T;
    /** 失败回滚函数 */
    onRollback?: (error: Error, previousData: T) => void;
    /** 成功回调 */
    onSuccess?: (data: T) => void;
}
/**
 * 乐观更新 Hook
 *
 * 先立即更新 UI,再发送请求,失败时自动回滚
 *
 * @example
 * ```typescript
 * const todos = ref([...])
 *
 * const { execute, loading, rollback } = useOptimisticUpdate(
 *   client,
 *   todos,
 *   {
 *     optimisticUpdate: (current, newTodo) => [...current, newTodo],
 *     onRollback: (error, previous) => {
 *       console.error('创建失败:', error)
 *       todos.value = previous
 *     }
 *   }
 * )
 *
 * // 点击添加按钮
 * await execute(
 *   { url: '/api/todos', method: 'POST', data: newTodo },
 *   newTodo
 * )
 * // UI立即显示新todo,如果请求失败会自动回滚
 * ```
 */
export declare function useOptimisticUpdate<T = any, Input = any>(client: HttpClient, dataRef: Ref<T>, options: OptimisticUpdateOptions<T>): {
    execute: (config: RequestConfig, input: Input) => Promise<T | null>;
    rollback: () => void;
    loading: Ref<boolean, boolean>;
    error: Ref<Error | null, Error | null>;
    isOptimistic: Ref<boolean, boolean>;
};
/**
 * 列表乐观更新 Hook
 *
 * 专门用于列表的增删改操作
 *
 * @example
 * ```typescript
 * const { add, update, remove } = useOptimisticList(client, todos)
 *
 * // 添加
 * await add(
 *   { url: '/api/todos', method: 'POST', data: newTodo },
 *   newTodo
 * )
 *
 * // 更新
 * await update(
 *   { url: `/api/todos/${id}`, method: 'PUT', data: updated },
 *   id,
 *   updated
 * )
 *
 * // 删除
 * await remove(
 *   { url: `/api/todos/${id}`, method: 'DELETE' },
 *   id
 * )
 * ```
 */
export declare function useOptimisticList<T extends {
    id: any;
}>(client: HttpClient, listRef: Ref<T[]>, options?: {
    idKey?: keyof T;
}): {
    add: (config: RequestConfig, item: T) => Promise<T | null>;
    update: (config: RequestConfig, id: any, updates: Partial<T>) => Promise<T | null>;
    remove: (config: RequestConfig, id: any) => Promise<boolean>;
    loading: Ref<boolean, boolean>;
    error: Ref<Error | null, Error | null>;
};
