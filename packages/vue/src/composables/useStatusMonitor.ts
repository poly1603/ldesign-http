/**
 * Vue 请求状态监控 Composable
 *
 * 响应式包装 @ldesign/http-core 的 StatusMonitor
 */

import type { Ref } from 'vue'
import type { RequestMetrics, StatusMonitorConfig, StatusMonitorError } from '@ldesign/http-core'
import { onUnmounted, ref, shallowRef } from 'vue'
import { StatusMonitor } from '@ldesign/http-core'

/**
 * useStatusMonitor 返回值
 */
export interface UseStatusMonitorReturn {
  /** 当前指标快照 */
  metrics: Ref<RequestMetrics>
  /** 总请求数 */
  total: Ref<number>
  /** 活跃请求数 */
  active: Ref<number>
  /** 已完成请求数 */
  completed: Ref<number>
  /** 失败请求数 */
  failed: Ref<number>
  /** 平均响应时间 */
  avgResponseTime: Ref<number>
  /** 错误率 */
  errorRate: Ref<number>
  /** 最近的错误列表 */
  recentErrors: Ref<StatusMonitorError[]>
  /** 底层 StatusMonitor 实例 */
  monitor: StatusMonitor
  /** 开始跟踪请求 */
  trackStart: (url?: string, method?: string) => string
  /** 标记请求成功 */
  trackEnd: (id: string, status?: number) => void
  /** 标记请求失败 */
  trackError: (id: string, error: string, status?: number) => void
  /** 重置所有指标 */
  reset: () => void
  /** 手动刷新指标 */
  refresh: () => void
}

/**
 * 请求状态监控 Hook
 *
 * 提供响应式的请求健康状态和性能指标
 *
 * @example
 * ```vue
 * <script setup>
 * import { useStatusMonitor } from '@ldesign/http-vue'
 *
 * const {
 *   total, active, completed, failed,
 *   avgResponseTime, errorRate, recentErrors,
 *   trackStart, trackEnd, trackError, reset,
 * } = useStatusMonitor()
 *
 * // 手动跟踪请求
 * const id = trackStart('/api/users', 'GET')
 * // ... 请求完成后
 * trackEnd(id, 200)
 * </script>
 *
 * <template>
 *   <div>
 *     <p>Total: {{ total }}, Active: {{ active }}</p>
 *     <p>Avg Response: {{ avgResponseTime }}ms</p>
 *     <p>Error Rate: {{ (errorRate * 100).toFixed(1) }}%</p>
 *   </div>
 * </template>
 * ```
 */
export function useStatusMonitor(config?: StatusMonitorConfig): UseStatusMonitorReturn {
  const total = ref(0)
  const active = ref(0)
  const completed = ref(0)
  const failed = ref(0)
  const avgResponseTime = ref(0)
  const errorRate = ref(0)
  const recentErrors = shallowRef<StatusMonitorError[]>([])
  const metrics = shallowRef<RequestMetrics>({
    total: 0,
    active: 0,
    completed: 0,
    failed: 0,
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: 0,
    errorRate: 0,
    requestsPerSecond: 0,
    recentErrors: [],
    methodDistribution: {},
    statusDistribution: {},
  })

  const updateRefs = (m: RequestMetrics) => {
    metrics.value = m
    total.value = m.total
    active.value = m.active
    completed.value = m.completed
    failed.value = m.failed
    avgResponseTime.value = m.avgResponseTime
    errorRate.value = m.errorRate
    recentErrors.value = m.recentErrors
  }

  const monitor = new StatusMonitor({
    ...config,
    onChange: (m) => {
      updateRefs(m)
      config?.onChange?.(m)
    },
  })

  const trackStart = (url?: string, method?: string) => monitor.trackStart(url, method)
  const trackEnd = (id: string, status?: number) => monitor.trackEnd(id, status)
  const trackError = (id: string, error: string, status?: number) => monitor.trackError(id, error, status)
  const reset = () => monitor.reset()
  const refresh = () => updateRefs(monitor.getMetrics())

  onUnmounted(() => {
    monitor.reset()
  })

  return {
    metrics,
    total,
    active,
    completed,
    failed,
    avgResponseTime,
    errorRate,
    recentErrors,
    monitor,
    trackStart,
    trackEnd,
    trackError,
    reset,
    refresh,
  }
}
