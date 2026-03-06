/**
 * StatusMonitor - 请求状态聚合监控器
 *
 * 框架无关的轻量级请求监控，跟踪请求计数、响应时间、错误率等指标
 */

export interface RequestMetrics {
  /** 总请求数 */
  total: number
  /** 活跃请求数 */
  active: number
  /** 已完成请求数 */
  completed: number
  /** 失败请求数 */
  failed: number
  /** 平均响应时间 (ms) */
  avgResponseTime: number
  /** 最慢响应时间 (ms) */
  maxResponseTime: number
  /** 最快响应时间 (ms) */
  minResponseTime: number
  /** 错误率 (0-1) */
  errorRate: number
  /** 每秒请求数 (近似) */
  requestsPerSecond: number
  /** 最近的错误列表 */
  recentErrors: StatusMonitorError[]
  /** 请求方法分布 */
  methodDistribution: Record<string, number>
  /** 状态码分布 */
  statusDistribution: Record<number, number>
}

export interface StatusMonitorError {
  /** 错误消息 */
  message: string
  /** HTTP 状态码 */
  status?: number
  /** 请求 URL */
  url?: string
  /** 发生时间 */
  timestamp: number
}

export interface StatusMonitorConfig {
  /** 保留的最近错误数 */
  maxRecentErrors?: number
  /** RPS 计算的窗口时间 (ms) */
  rpsWindowMs?: number
  /** 状态变化回调 */
  onChange?: (metrics: RequestMetrics) => void
}

interface RequestRecord {
  id: string
  url?: string
  method?: string
  startTime: number
  endTime?: number
  status?: number
  error?: string
}

/**
 * StatusMonitor 类
 *
 * 跟踪 HTTP 请求的整体健康状态和性能指标
 *
 * @example
 * ```ts
 * const monitor = new StatusMonitor({ maxRecentErrors: 20 })
 *
 * // 拦截器中使用
 * client.addRequestInterceptor(config => {
 *   monitor.trackStart(config.url!, config.method)
 *   return config
 * })
 *
 * // 获取指标
 * const metrics = monitor.getMetrics()
 * console.log(`Active: ${metrics.active}, Error rate: ${metrics.errorRate}`)
 * ```
 */
export class StatusMonitor {
  private config: Required<StatusMonitorConfig>
  private activeRequests = new Map<string, RequestRecord>()
  private completedCount = 0
  private failedCount = 0
  private totalResponseTime = 0
  private maxResponseTime = 0
  private minResponseTime = Infinity
  private recentErrors: StatusMonitorError[] = []
  private methodDistribution: Record<string, number> = {}
  private statusDistribution: Record<number, number> = {}
  private requestTimestamps: number[] = []
  private requestCounter = 0

  constructor(config: StatusMonitorConfig = {}) {
    this.config = {
      maxRecentErrors: config.maxRecentErrors ?? 50,
      rpsWindowMs: config.rpsWindowMs ?? 60000,
      onChange: config.onChange ?? (() => {}),
    }
  }

  /**
   * 开始跟踪一个请求
   * @returns 请求 ID，用于后续调用 trackEnd / trackError
   */
  trackStart(url?: string, method?: string): string {
    const id = `req_${++this.requestCounter}_${Date.now()}`
    const record: RequestRecord = {
      id,
      url,
      method: method?.toUpperCase() || 'GET',
      startTime: Date.now(),
    }

    this.activeRequests.set(id, record)

    // 记录方法分布
    const m = record.method!
    this.methodDistribution[m] = (this.methodDistribution[m] || 0) + 1

    // 记录 RPS 时间戳
    this.requestTimestamps.push(Date.now())
    this.cleanOldTimestamps()

    this.notifyChange()
    return id
  }

  /**
   * 标记请求成功完成
   */
  trackEnd(id: string, status?: number): void {
    const record = this.activeRequests.get(id)
    if (!record) return

    record.endTime = Date.now()
    record.status = status

    const duration = record.endTime - record.startTime
    this.completedCount++
    this.totalResponseTime += duration
    this.maxResponseTime = Math.max(this.maxResponseTime, duration)
    this.minResponseTime = Math.min(this.minResponseTime, duration)

    if (status) {
      this.statusDistribution[status] = (this.statusDistribution[status] || 0) + 1
    }

    this.activeRequests.delete(id)
    this.notifyChange()
  }

  /**
   * 标记请求失败
   */
  trackError(id: string, error: string, status?: number): void {
    const record = this.activeRequests.get(id)
    if (!record) return

    record.endTime = Date.now()
    record.status = status
    record.error = error

    const duration = record.endTime - record.startTime
    this.failedCount++
    this.totalResponseTime += duration
    this.maxResponseTime = Math.max(this.maxResponseTime, duration)
    this.minResponseTime = Math.min(this.minResponseTime, duration)

    if (status) {
      this.statusDistribution[status] = (this.statusDistribution[status] || 0) + 1
    }

    this.recentErrors.push({
      message: error,
      status,
      url: record.url,
      timestamp: Date.now(),
    })

    // 限制最近错误列表长度
    if (this.recentErrors.length > this.config.maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(-this.config.maxRecentErrors)
    }

    this.activeRequests.delete(id)
    this.notifyChange()
  }

  /**
   * 获取当前指标快照
   */
  getMetrics(): RequestMetrics {
    const totalFinished = this.completedCount + this.failedCount
    const total = totalFinished + this.activeRequests.size

    this.cleanOldTimestamps()
    const windowSeconds = this.config.rpsWindowMs / 1000
    const rps = this.requestTimestamps.length / windowSeconds

    return {
      total,
      active: this.activeRequests.size,
      completed: this.completedCount,
      failed: this.failedCount,
      avgResponseTime: totalFinished > 0
        ? Math.round(this.totalResponseTime / totalFinished)
        : 0,
      maxResponseTime: this.maxResponseTime === 0 ? 0 : this.maxResponseTime,
      minResponseTime: this.minResponseTime === Infinity ? 0 : this.minResponseTime,
      errorRate: totalFinished > 0
        ? Math.round((this.failedCount / totalFinished) * 10000) / 10000
        : 0,
      requestsPerSecond: Math.round(rps * 100) / 100,
      recentErrors: [...this.recentErrors],
      methodDistribution: { ...this.methodDistribution },
      statusDistribution: { ...this.statusDistribution },
    }
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.activeRequests.clear()
    this.completedCount = 0
    this.failedCount = 0
    this.totalResponseTime = 0
    this.maxResponseTime = 0
    this.minResponseTime = Infinity
    this.recentErrors = []
    this.methodDistribution = {}
    this.statusDistribution = {}
    this.requestTimestamps = []
    this.notifyChange()
  }

  private cleanOldTimestamps(): void {
    const cutoff = Date.now() - this.config.rpsWindowMs
    this.requestTimestamps = this.requestTimestamps.filter(t => t > cutoff)
  }

  private notifyChange(): void {
    this.config.onChange(this.getMetrics())
  }
}

/**
 * 创建 StatusMonitor 实例
 */
export function createStatusMonitor(config?: StatusMonitorConfig): StatusMonitor {
  return new StatusMonitor(config)
}
