/**
 * 批量请求优化器
 *
 * @description
 * 功能特性：
 * 1. 智能批处理策略
 * 2. 部分失败处理
 * 3. 失败重试机制
 * 4. 批处理统计
 * 5. 动态批量大小调整
 *
 * @module http/batch
 */

import type { RequestConfig, ResponseData } from '../types'

/**
 * 批处理配置
 */
export interface BatchConfig {
  /** 批量间隔时间(ms) */
  interval?: number
  /** 最大批量大小 */
  maxSize?: number
  /** 最小批量大小（低于此值不触发批处理） */
  minSize?: number
  /** 是否启用 */
  enabled?: boolean
  /** 是否启用统计 */
  enableStats?: boolean
  /** 部分失败策略：'reject-all' | 'resolve-partial' */
  partialFailureStrategy?: 'reject-all' | 'resolve-partial'
  /** 失败重试次数 */
  retryCount?: number
  /** 重试延迟(ms) */
  retryDelay?: number
  /** 是否启用动态批量大小 */
  dynamicBatchSize?: boolean
  /** 请求超时时间(ms) */
  timeout?: number
}

/**
 * 批处理请求
 */
export interface BatchRequest<T = any> {
  config: RequestConfig
  resolve: (value: ResponseData<T>) => void
  reject: (error: any) => void
  timestamp: number
  retryCount: number
  priority?: number
}

/**
 * 批处理统计
 */
export interface BatchStats {
  /** 总批次数 */
  totalBatches: number
  /** 成功批次数 */
  successBatches: number
  /** 失败批次数 */
  failedBatches: number
  /** 总请求数 */
  totalRequests: number
  /** 成功请求数 */
  successRequests: number
  /** 失败请求数 */
  failedRequests: number
  /** 平均批量大小 */
  avgBatchSize: number
  /** 批处理成功率 */
  batchSuccessRate: number
  /** 请求成功率 */
  requestSuccessRate: number
  /** 总重试次数 */
  totalRetries: number
  /** 平均响应时间(ms) */
  avgResponseTime: number
  /** 当前队列大小 */
  queueSize: number
}

/**
 * 批处理结果
 */
interface BatchResult {
  success: boolean
  results?: ResponseData[]
  error?: any
  duration: number
}

/**
 * 批量请求优化器
 */
export class BatchOptimizer {
  private queue: BatchRequest[] = []
  private timer: NodeJS.Timeout | null = null
  private config: Required<BatchConfig>
  private stats: BatchStats = {
    totalBatches: 0,
    successBatches: 0,
    failedBatches: 0,
    totalRequests: 0,
    successRequests: 0,
    failedRequests: 0,
    avgBatchSize: 0,
    batchSuccessRate: 0,
    requestSuccessRate: 0,
    totalRetries: 0,
    avgResponseTime: 0,
    queueSize: 0,
  }
  private responseTimes: number[] = []

  constructor(
    private executor: (configs: RequestConfig[]) => Promise<ResponseData[]>,
    config: BatchConfig = {},
  ) {
    this.config = {
      interval: 50,
      maxSize: 10,
      minSize: 2,
      enabled: true,
      enableStats: true,
      partialFailureStrategy: 'resolve-partial',
      retryCount: 2,
      retryDelay: 1000,
      dynamicBatchSize: false,
      timeout: 30000,
      ...config,
    }
  }

  /**
   * 添加请求到批量队列
   */
  add<T = any>(config: RequestConfig, priority = 0): Promise<ResponseData<T>> {
    if (!this.config.enabled) {
      return this.executor([config]).then(results => results[0] as ResponseData<T>)
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        config,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0,
        priority,
      })

      if (this.config.enableStats) {
        this.stats.queueSize = this.queue.length
      }

      // 按优先级排序（如果启用）
      if (priority > 0) {
        this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0))
      }

      // 达到最大批量大小，立即执行
      if (this.queue.length >= this.config.maxSize) {
        this.flush()
      }
      // 否则设置定时器
      else if (!this.timer) {
        this.timer = setTimeout(() => {
          this.flush()
        }, this.config.interval)
      }
    })
  }

  /**
   * 执行批量请求
   */
  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.queue.length === 0) return

    // 检查是否满足最小批量大小
    if (this.queue.length < this.config.minSize) {
      // 如果队列中有请求超过超时时间，强制执行
      const now = Date.now()
      const hasTimeout = this.queue.some(
        item => now - item.timestamp > this.config.timeout,
      )

      if (!hasTimeout) {
        // 重新设置定时器
        this.timer = setTimeout(() => {
          this.flush()
        }, this.config.interval)
        return
      }
    }

    // 动态调整批量大小
    const batchSize = this.config.dynamicBatchSize
      ? this.calculateOptimalBatchSize()
      : this.config.maxSize

    const batch = this.queue.splice(0, batchSize)

    if (this.config.enableStats) {
      this.stats.queueSize = this.queue.length
    }

    // 执行批处理
    await this.executeBatch(batch)

    // 如果队列中还有请求，继续处理
    if (this.queue.length > 0) {
      this.timer = setTimeout(() => {
        this.flush()
      }, this.config.interval)
    }
  }

  /**
   * 执行单个批次
   */
  private async executeBatch(
    batch: BatchRequest[],
    isRetry = false,
  ): Promise<void> {
    const configs = batch.map(item => item.config)
    const startTime = Date.now()

    if (this.config.enableStats && !isRetry) {
      this.stats.totalBatches++
      this.stats.totalRequests += batch.length
    }

    try {
      const results = await this.executor(configs)
      const duration = Date.now() - startTime

      if (this.config.enableStats) {
        this.responseTimes.push(duration)
        if (this.responseTimes.length > 100) {
          this.responseTimes.shift()
        }
        this.updateStats()
      }

      // 处理成功的批次
      this.handleBatchSuccess(batch, results)

      if (this.config.enableStats) {
        this.stats.successBatches++
      }
    } catch (error) {
      const duration = Date.now() - startTime

      if (this.config.enableStats) {
        this.responseTimes.push(duration)
        if (this.responseTimes.length > 100) {
          this.responseTimes.shift()
        }
      }

      // 处理失败的批次
      await this.handleBatchFailure(batch, error)

      if (this.config.enableStats) {
        this.stats.failedBatches++
      }
    }
  }

  /**
   * 处理批次成功
   */
  private handleBatchSuccess(
    batch: BatchRequest[],
    results: ResponseData[],
  ): void {
    batch.forEach((item, index) => {
      if (results[index]) {
        item.resolve(results[index])
        if (this.config.enableStats) {
          this.stats.successRequests++
        }
      } else {
        // 部分请求没有结果
        if (this.config.partialFailureStrategy === 'reject-all') {
          item.reject(new Error('No result for request'))
        } else {
          item.resolve(results[index] || { data: null, status: 204 } as any)
        }

        if (this.config.enableStats) {
          this.stats.failedRequests++
        }
      }
    })

    this.updateStats()
  }

  /**
   * 处理批次失败
   */
  private async handleBatchFailure(
    batch: BatchRequest[],
    error: any,
  ): Promise<void> {
    // 检查是否可以重试
    const canRetry = batch.every(
      item => item.retryCount < this.config.retryCount,
    )

    if (canRetry && this.config.retryCount > 0) {
      // 增加重试计数
      batch.forEach(item => item.retryCount++)

      if (this.config.enableStats) {
        this.stats.totalRetries += batch.length
      }

      // 延迟后重试
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
      await this.executeBatch(batch, true)
    } else {
      // 无法重试，拒绝所有请求
      batch.forEach(item => {
        item.reject(error)
        if (this.config.enableStats) {
          this.stats.failedRequests++
        }
      })

      this.updateStats()
    }
  }

  /**
   * 计算最优批量大小
   */
  private calculateOptimalBatchSize(): number {
    // 基于平均响应时间动态调整
    if (this.responseTimes.length < 5) {
      return this.config.maxSize
    }

    const avgTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length

    // 如果平均响应时间较长，减小批量大小
    if (avgTime > 5000) {
      return Math.max(this.config.minSize, Math.floor(this.config.maxSize * 0.5))
    } else if (avgTime > 2000) {
      return Math.max(this.config.minSize, Math.floor(this.config.maxSize * 0.75))
    }

    return this.config.maxSize
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    if (!this.config.enableStats) return

    if (this.stats.totalBatches > 0) {
      this.stats.avgBatchSize = this.stats.totalRequests / this.stats.totalBatches
      this.stats.batchSuccessRate =
        (this.stats.successBatches / this.stats.totalBatches) * 100
    }

    if (this.stats.totalRequests > 0) {
      this.stats.requestSuccessRate =
        (this.stats.successRequests / this.stats.totalRequests) * 100
    }

    if (this.responseTimes.length > 0) {
      this.stats.avgResponseTime =
        this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
    }

    this.stats.queueSize = this.queue.length
  }

  /**
   * 获取统计信息
   */
  getStats(): BatchStats {
    this.updateStats()
    return { ...this.stats }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalBatches: 0,
      successBatches: 0,
      failedBatches: 0,
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      avgBatchSize: 0,
      batchSuccessRate: 0,
      requestSuccessRate: 0,
      totalRetries: 0,
      avgResponseTime: 0,
      queueSize: this.queue.length,
    }
    this.responseTimes = []
  }

  /**
   * 清空队列
   */
  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.queue.forEach(item =>
      item.reject(new Error('Batch cleared')),
    )
    this.queue = []
    this.updateStats()
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      pending: this.queue.length,
      enabled: this.config.enabled,
      optimalBatchSize: this.calculateOptimalBatchSize(),
    }
  }

  /**
   * 生成批处理报告
   */
  generateReport(): string {
    const stats = this.getStats()
    const lines: string[] = []

    lines.push('='.repeat(60))
    lines.push('HTTP 批处理优化报告')
    lines.push('='.repeat(60))
    lines.push('')

    lines.push('📊 批处理统计:')
    lines.push(`  总批次数:       ${stats.totalBatches}`)
    lines.push(`  成功批次:       ${stats.successBatches}`)
    lines.push(`  失败批次:       ${stats.failedBatches}`)
    lines.push(`  批次成功率:     ${stats.batchSuccessRate.toFixed(2)}%`)
    lines.push(`  平均批量大小:   ${stats.avgBatchSize.toFixed(2)}`)
    lines.push('')

    lines.push('📈 请求统计:')
    lines.push(`  总请求数:       ${stats.totalRequests}`)
    lines.push(`  成功请求:       ${stats.successRequests}`)
    lines.push(`  失败请求:       ${stats.failedRequests}`)
    lines.push(`  请求成功率:     ${stats.requestSuccessRate.toFixed(2)}%`)
    lines.push('')

    lines.push('🔄 性能指标:')
    lines.push(`  总重试次数:     ${stats.totalRetries}`)
    lines.push(`  平均响应时间:   ${stats.avgResponseTime.toFixed(2)}ms`)
    lines.push(`  当前队列大小:   ${stats.queueSize}`)
    lines.push('')

    lines.push('💡 优化效果:')
    const savedRequests = stats.totalRequests - stats.totalBatches
    const optimizationRate = stats.totalRequests > 0
      ? ((savedRequests / stats.totalRequests) * 100).toFixed(2)
      : '0.00'
    lines.push(`  减少请求数:     ${savedRequests}`)
    lines.push(`  优化率:         ${optimizationRate}%`)
    lines.push('')

    lines.push('='.repeat(60))

    return lines.join('\n')
  }

  /**
   * 销毁优化器
   */
  destroy(): void {
    this.clear()
    this.resetStats()
  }
}

/**
 * 创建批量优化器
 */
export function createBatchOptimizer(
  executor: (configs: RequestConfig[]) => Promise<ResponseData[]>,
  config?: BatchConfig,
): BatchOptimizer {
  return new BatchOptimizer(executor, config)
}