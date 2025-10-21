/**
 * Vue 智能轮询 Composable
 *
 * 自动轮询请求，支持条件停止、错误处理、网络感知等
 */
import type { Ref } from 'vue';
import type { HttpClient, RequestConfig } from '../types';
/**
 * 轮询配置
 */
export interface PollingConfig {
    /** 轮询间隔(ms) */
    interval: number;
    /** 是否立即执行第一次请求 */
    immediate?: boolean;
    /** 是否在页面不可见时暂停 */
    pauseWhenHidden?: boolean;
    /** 是否在离线时暂停 */
    pauseWhenOffline?: boolean;
    /** 最大轮询次数 */
    maxPolls?: number;
    /** 停止条件 */
    stopWhen?: (data: any) => boolean;
    /** 错误时是否停止 */
    stopOnError?: boolean;
    /** 成功回调 */
    onSuccess?: (data: any) => void;
    /** 错误回调 */
    onError?: (error: Error) => void;
    /** 使用自定义客户端 */
    client?: HttpClient;
}
/**
 * 轮询返回值
 */
export interface UsePollingReturn<T> {
    /** 数据 */
    data: Ref<T | null>;
    /** 加载状态 */
    loading: Ref<boolean>;
    /** 错误 */
    error: Ref<Error | null>;
    /** 是否正在轮询 */
    isPolling: Ref<boolean>;
    /** 已轮询次数 */
    pollCount: Ref<number>;
    /** 开始轮询 */
    start: () => void;
    /** 停止轮询 */
    stop: () => void;
    /** 重启轮询 */
    restart: () => void;
    /** 手动执行一次 */
    execute: () => Promise<T | null>;
}
/**
 * 智能轮询 Hook
 *
 * 自动轮询请求，支持丰富的配置选项
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePolling } from '@ldesign/http'
 *
 * // 每5秒轮询任务状态，直到任务完成
 * const { data: task, isPolling, stop } = usePolling(
 *  { url: '/api/tasks/123' },
 *  {
 *   interval: 5000,
 *   stopWhen: (task) => task.status === 'completed',
 *   onSuccess: (task) => {
 *    if (task.status === 'completed') {
 *
 *    }
 *   },
 *  }
 * )
 * </script>
 *
 * <template>
 *  <div>
 *   <div v-if="task">状态: {{ task.status }}</div>
 *   <button v-if="isPolling" @click="stop">停止轮询</button>
 *  </div>
 * </template>
 * ```
 */
export declare function usePolling<T = any>(requestConfig: RequestConfig, config: PollingConfig): UsePollingReturn<T>;
/**
 * 轮询直到条件满足
 *
 * 简化版本，只需要提供停止条件
 */
export declare function usePollingUntil<T = any>(requestConfig: RequestConfig, stopWhen: (data: T) => boolean, interval?: number): UsePollingReturn<T>;
/**
 * 轮询N次
 *
 * 简化版本，轮询固定次数后自动停止
 */
export declare function usePollingTimes<T = any>(requestConfig: RequestConfig, maxPolls: number, interval?: number): UsePollingReturn<T>;
