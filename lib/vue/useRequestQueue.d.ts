import type { Ref } from 'vue';
import type { HttpClient, RequestConfig } from '../types';
/**
 * 请求队列项
 */
interface QueueItem<T> {
    id: string;
    config: RequestConfig;
    priority: number;
    resolve: (value: T) => void;
    reject: (error: any) => void;
    createdAt: number;
}
/**
 * 请求队列配置
 */
export interface RequestQueueConfig {
    /** 最大并发数 */
    concurrency?: number;
    /** 是否自动开始 */
    autoStart?: boolean;
    /** 超时时间（毫秒） */
    timeout?: number;
}
/**
 * 请求队列 Hook
 *
 * 管理请求队列,控制并发,支持优先级
 *
 * @example
 * ```typescript
 * const queue = useRequestQueue(client, { concurrency: 3 })
 *
 * // 添加请求到队列
 * const result1 = await queue.enqueue({ url: '/api/data1' }, 1)
 * const result2 = await queue.enqueue({ url: '/api/data2' }, 2) // 高优先级
 *
 * // 查看队列状态
 *  // 2
 *  // 3
 * ```
 */
export declare function useRequestQueue<T = any>(client: HttpClient, config?: RequestQueueConfig): {
    enqueue: (requestConfig: RequestConfig, priority?: number) => Promise<T>;
    pause: () => void;
    resume: () => void;
    clear: () => void;
    cancelAll: () => void;
    reset: () => void;
    pending: import("vue").ComputedRef<number>;
    active: import("vue").ComputedRef<number>;
    total: import("vue").ComputedRef<number>;
    completed: Ref<number, number>;
    failed: Ref<number, number>;
    isPaused: Ref<boolean, boolean>;
    queue: Ref<QueueItem<T>[]>;
    activeRequests: Ref<Set<string> & Omit<Set<string>, keyof Set<any>>, Set<string> | (Set<string> & Omit<Set<string>, keyof Set<any>>)>;
};
export {};
