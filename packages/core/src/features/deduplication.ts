/**
 * 请求去重管理器
 *
 * @description
 * 功能特性：
 * 1. 请求统计和监控
 * 2. 超时控制
 * 3. 优先级队列
 * 4. 内存管理
 * 5. 性能指标
 *
 * @module http/deduplication
 */

import type { RequestConfig, ResponseData } from '../types'
import { generateRequestKey } from '../utils/serializer'

/**
 * 去重配置
 */
export interface DeduplicationConfig {
  /** 请求超时时间（ms），超时后自动清除 */
  timeout?: number
  /** 是否启用统计 */
  enableStats?: boolean
  /** 最大缓存请求数 */
  maxPending?: number
  /** 是否启用优先级 */
  enablePriority?: boolean
}

/**
 * 待处理请求信息
 */
interface PendingRequest {
  promise: Promise<ResponseData>
  timestamp: number
  priority: number
  timeout?: NodeJS.Timeout
  subscribers: number
}

/**
 * 去重统计信息
 */
export interface DeduplicationStats {
  /** 总请求数 */
  totalRequests: number
  /** 去重命中数 */
  deduplicatedHits: number
  /** 当前待处理请求数 */
  pendingCount: number
  /** 去重率 */
  deduplicationRate: number
  /** 节省的请求数 */
  savedRequests: number
  /** 平均订阅者数 */
  avgSubscribers: number
  /** 超时清理次数 */
  timeoutCleanups: number
}

/**
 * 请求去重管理器
 */
export class RequestDeduplication {
  private pendingRequests = new Map<string, PendingRequest>()
  private config: Required<DeduplicationConfig>
  private stats: DeduplicationStats = {
    totalRequests: 0,
    deduplicatedHits: 0,
    pendingCount: 0,
    deduplicationRate: 0,
    savedRequests: 0,
    avgSubscribers: 0,
    timeoutCleanups: 0,
  }

  constructor(config: DeduplicationConfig = {}) {
    this.config = {
      timeout: 30000, // 30秒超时
      enableStats: true,
      maxPending: 100,
      enablePriority: false,
      ...config,
    }
  }

  /**
   * 生成请求键
   */
  private generateKey(config: RequestConfig): string {
    return generateRequestKey(config)
  }

  /**
   * 检查是否有相同的待处理请求
   */
  hasPending(config: RequestConfig): boolean {
    const key = this.generateKey(config)
    return this.pendingRequests.has(key)
  }

  /**
   * 获取待处理的请求Promise
   */
  getPending<T = any>(config: RequestConfig): Promise<ResponseData<T>> | undefined {
    const key = this.generateKey(config)
    const pending = this.pendingRequests.get(key)

    if (pending) {
      // 增加订阅者计数
      pending.subscribers++

      if (this.config.enableStats) {
        this.stats.deduplicatedHits++
        this.updateStats()
      }
    }

    return pending?.promise as Promise<ResponseData<T>> | undefined
  }

  /**
   * 添加待处理请求
   */
  addPending<T = any>(
    config: RequestConfig,
    promise: Promise<ResponseData<T>>,
    priority = 0,
  ): Promise<ResponseData<T>> {
    const key = this.generateKey(config)

    // 检查是否超过最大待处理数
    if (this.pendingRequests.size >= this.config.maxPending) {
      this.cleanupOldest()
    }

    // 设置超时清理
    let timeout: NodeJS.Timeout | undefined
    if (this.config.timeout > 0) {
      timeout = setTimeout(() => {
        this.pendingRequests.delete(key)
        if (this.config.enableStats) {
          this.stats.timeoutCleanups++
          this.updateStats()
        }
      }, this.config.timeout)
    }

    // 存储请求信息
    this.pendingRequests.set(key, {
      promise: promise as Promise<ResponseData>,
      timestamp: Date.now(),
      priority,
      timeout,
      subscribers: 1,
    })

    // 请求完成后删除
    promise.finally(() => {
      const pending = this.pendingRequests.get(key)
      if (pending?.timeout) {
        clearTimeout(pending.timeout)
      }
      this.pendingRequests.delete(key)
      this.updateStats()
    })

    if (this.config.enableStats) {
      this.stats.totalRequests++
      this.updateStats()
    }

    return promise
  }

  /**
   * 执行请求（带去重）
   */
  async execute<T = any>(
    config: RequestConfig,
    executor: () => Promise<ResponseData<T>>,
    priority = 0,
  ): Promise<ResponseData<T>> {
    // 检查是否有相同的待处理请求
    const pending = this.getPending<T>(config)
    if (pending) {
      return pending
    }

    // 创建新请求
    const promise = executor()
    return this.addPending(config, promise, priority)
  }

  /**
   * 清理最旧的请求
   */
  private cleanupOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    let lowestPriority = Infinity

    // 找到最旧且优先级最低的请求
    for (const [key, pending] of this.pendingRequests) {
      if (this.config.enablePriority) {
        if (pending.priority < lowestPriority ||
          (pending.priority === lowestPriority && pending.timestamp < oldestTime)) {
          oldestKey = key
          oldestTime = pending.timestamp
          lowestPriority = pending.priority
        }
      } else {
        if (pending.timestamp < oldestTime) {
          oldestKey = key
          oldestTime = pending.timestamp
        }
      }
    }

    if (oldestKey) {
      const pending = this.pendingRequests.get(oldestKey)
      if (pending?.timeout) {
        clearTimeout(pending.timeout)
      }
      this.pendingRequests.delete(oldestKey)
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    if (!this.config.enableStats) return

    this.stats.pendingCount = this.pendingRequests.size
    this.stats.savedRequests = this.stats.deduplicatedHits

    if (this.stats.totalRequests > 0) {
      this.stats.deduplicationRate =
        (this.stats.deduplicatedHits / this.stats.totalRequests) * 100
    }

    // 计算平均订阅者数
    let totalSubscribers = 0
    for (const pending of this.pendingRequests.values()) {
      totalSubscribers += pending.subscribers
    }
    this.stats.avgSubscribers = this.pendingRequests.size > 0
      ? totalSubscribers / this.pendingRequests.size
      : 0
  }

  /**
   * 获取统计信息
   */
  getStats(): DeduplicationStats {
    this.updateStats()
    return { ...this.stats }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      deduplicatedHits: 0,
      pendingCount: this.pendingRequests.size,
      deduplicationRate: 0,
      savedRequests: 0,
      avgSubscribers: 0,
      timeoutCleanups: 0,
    }
  }

  /**
   * 清空所有待处理请求
   */
  clear(): void {
    // 清理所有超时定时器
    for (const pending of this.pendingRequests.values()) {
      if (pending.timeout) {
        clearTimeout(pending.timeout)
      }
    }
    this.pendingRequests.clear()
    this.updateStats()
  }

  /**
   * 获取待处理请求数量
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }

  /**
   * 获取所有待处理请求的详细信息
   */
  getPendingDetails(): Array<{
    key: string
    timestamp: number
    priority: number
    subscribers: number
    age: number
  }> {
    const now = Date.now()
    const details: Array<{
      key: string
      timestamp: number
      priority: number
      subscribers: number
      age: number
    }> = []

    for (const [key, pending] of this.pendingRequests) {
      details.push({
        key,
        timestamp: pending.timestamp,
        priority: pending.priority,
        subscribers: pending.subscribers,
        age: now - pending.timestamp,
      })
    }

    return details
  }

  /**
   * 生成去重报告
   */
  generateReport(): string {
    const stats = this.getStats()
    const lines: string[] = []

    lines.push('='.repeat(60))
    lines.push('HTTP 请求去重报告')
    lines.push('='.repeat(60))
    lines.push('')

    lines.push('📊 统计信息:')
    lines.push(`  总请求数:       ${stats.totalRequests}`)
    lines.push(`  去重命中数:     ${stats.deduplicatedHits}`)
    lines.push(`  节省请求数:     ${stats.savedRequests}`)
    lines.push(`  去重率:         ${stats.deduplicationRate.toFixed(2)}%`)
    lines.push('')

    lines.push('🔄 当前状态:')
    lines.push(`  待处理请求:     ${stats.pendingCount}`)
    lines.push(`  平均订阅者:     ${stats.avgSubscribers.toFixed(2)}`)
    lines.push(`  超时清理次数:   ${stats.timeoutCleanups}`)
    lines.push('')

    lines.push('💡 性能指标:')
    const savedBandwidth = stats.savedRequests * 5 // 假设每个请求平均 5KB
    lines.push(`  节省带宽:       约 ${savedBandwidth}KB`)
    lines.push(`  节省时间:       约 ${(stats.savedRequests * 100).toFixed(0)}ms`)
    lines.push('')

    lines.push('='.repeat(60))

    return lines.join('\n')
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.clear()
    this.resetStats()
  }
}

/**
 * 创建请求去重管理器
 */
export function createDeduplication(
  config?: DeduplicationConfig,
): RequestDeduplication {
  return new RequestDeduplication(config)
}