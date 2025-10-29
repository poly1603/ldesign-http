/**
 * 请求重放（Request Replay）功能
 *
 * 自动记录失败的请求，在网络恢复或条件满足时自动重放。
 * 特别适用于离线场景、网络不稳定场景。
 *
 * 核心价值：
 * - 🔄 **自动恢复**：网络恢复后自动重放失败的请求
 * - 💪 **提升成功率**：不丢失任何请求
 * - 🎯 **用户体验**：无需用户手动重试
 * - 📊 **智能调度**：按优先级和时间顺序重放
 *
 * 应用场景：
 * - 离线应用（PWA）
 * - 网络不稳定环境
 * - 移动应用
 * - 关键业务操作（支付、订单等）
 *
 * @example 基础用法
 * ```typescript
 * const replayer = new RequestReplayer(client)
 *
 * // 网络断开时，请求会自动入队
 * try {
 *   await client.post('/api/order', orderData)
 * } catch (error) {
 *   if (error.isNetworkError) {
 *     // 添加到重放队列
 *     await replayer.enqueue({
 *       url: '/api/order',
 *       method: 'POST',
 *       data: orderData
 *     })
 *   }
 * }
 *
 * // 网络恢复后，自动重放所有失败的请求
 * window.addEventListener('online', () => {
 *   replayer.replayAll()
 * })
 * ```
 */

import type { HttpClient, HttpError, RequestConfig, ResponseData } from '../types'

/**
 * 请求重放配置
 */
export interface ReplayConfig {
  /** 是否启用重放 */
  enabled?: boolean
  /** 最大重放次数 */
  maxAttempts?: number
  /** 重放延迟（毫秒） */
  delay?: number
  /** 重放间隔（毫秒） */
  interval?: number
  /** 最大队列大小 */
  maxQueueSize?: number
  /** 重放条件 */
  shouldReplay?: (error: HttpError) => boolean
  /** 重放回调 */
  onReplay?: (attempt: number, config: RequestConfig) => void
  /** 重放成功回调 */
  onReplaySuccess?: (config: RequestConfig, response: ResponseData) => void
  /** 重放失败回调 */
  onReplayFailure?: (config: RequestConfig, error: HttpError) => void
}

/**
 * 队列中的请求项
 */
interface QueuedRequest {
  /** 请求配置 */
  config: RequestConfig
  /** Promise resolve 函数 */
  resolve: (value: ResponseData) => void
  /** Promise reject 函数 */
  reject: (error: HttpError) => void
  /** 已尝试次数 */
  attempts: number
  /** 入队时间 */
  queuedAt: number
  /** 优先级 */
  priority: number
}

/**
 * 重放统计信息
 */
export interface ReplayStats {
  /** 队列中的请求数 */
  queueSize: number
  /** 已重放成功的请求数 */
  replayedSuccess: number
  /** 重放失败的请求数 */
  replayedFailure: number
  /** 总计重放次数 */
  totalReplays: number
}

/**
 * 请求重放器
 *
 * 管理失败请求的队列，并在适当时机自动重放。
 *
 * @example 创建重放器
 * ```typescript
 * const replayer = new RequestReplayer(client, {
 *   maxAttempts: 3,
 *   delay: 1000,
 *   onReplay: (attempt, config) => {
 *     console.log(`重放请求（第${attempt}次）:`, config.url)
 *   }
 * })
 * ```
 */
export class RequestReplayer {
  /** HTTP客户端 */
  private client: HttpClient

  /** 重放队列 */
  private queue: QueuedRequest[] = []

  /** 配置 */
  private config: Required<ReplayConfig>

  /** 统计信息 */
  private stats = {
    replayedSuccess: 0,
    replayedFailure: 0,
    totalReplays: 0,
  }

  /** 是否正在重放 */
  private isReplaying = false

  /**
   * 构造函数
   *
   * @param client - HTTP客户端实例
   * @param config - 重放配置
   *
   * @example
   * ```typescript
   * const replayer = new RequestReplayer(client, {
   *   maxAttempts: 3,
   *   delay: 1000
   * })
   * ```
   */
  constructor(client: HttpClient, config: ReplayConfig = {}) {
    this.client = client
    this.config = {
      enabled: config.enabled ?? true,
      maxAttempts: config.maxAttempts ?? 3,
      delay: config.delay ?? 1000,
      interval: config.interval ?? 5000,
      maxQueueSize: config.maxQueueSize ?? 100,
      shouldReplay: config.shouldReplay ?? ((error: HttpError) => {
        // 默认：只重放网络错误
        return Boolean(error.isNetworkError)
      }),
      onReplay: config.onReplay ?? (() => { }),
      onReplaySuccess: config.onReplaySuccess ?? (() => { }),
      onReplayFailure: config.onReplayFailure ?? (() => { }),
    }
  }

  /**
   * 将失败的请求添加到重放队列
   *
   * @param config - 请求配置
   * @param error - 失败错误
   * @returns Promise<ResponseData> - 重放成功后的响应
   *
   * @example
   * ```typescript
   * try {
   *   await client.post('/api/data', data)
   * } catch (error) {
   *   if (error.isNetworkError) {
   *     // 入队等待重放
   *     const response = await replayer.enqueue(config, error)
   *   }
   * }
   * ```
   */
  async enqueue(
    config: RequestConfig,
    error: HttpError,
  ): Promise<ResponseData> {
    if (!this.config.enabled) {
      return Promise.reject(error)
    }

    if (!this.config.shouldReplay(error)) {
      return Promise.reject(error)
    }

    // 检查队列大小
    if (this.queue.length >= this.config.maxQueueSize) {
      console.warn('Replay queue is full, dropping request')
      return Promise.reject(new Error('Replay queue is full'))
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        config,
        resolve,
        reject,
        attempts: 0,
        queuedAt: Date.now(),
        priority: (config.priority as number) ?? 0,
      })

      // 按优先级和时间排序
      this.queue.sort((a, b) => {
        // 优先级高的在前
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        // 优先级相同，早入队的在前
        return a.queuedAt - b.queuedAt
      })
    })
  }

  /**
   * 重放所有队列中的请求
   *
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * // 网络恢复时触发
   * window.addEventListener('online', () => {
   *   replayer.replayAll()
   * })
   * ```
   */
  async replayAll(): Promise<void> {
    if (this.isReplaying) {
      console.warn('Already replaying requests')
      return
    }

    if (this.queue.length === 0) {
      return
    }

    this.isReplaying = true

    console.log(`开始重放 ${this.queue.length} 个请求`)

    // 复制队列并清空原队列
    const requests = [...this.queue]
    this.queue = []

    // 逐个重放
    for (const req of requests) {
      try {
        // 延迟
        if (this.config.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.delay))
        }

        // 回调
        req.attempts++
        this.config.onReplay(req.attempts, req.config)

        // 执行请求
        const response = await this.client.request(req.config)

        // 成功
        this.stats.replayedSuccess++
        this.stats.totalReplays++
        this.config.onReplaySuccess(req.config, response)
        req.resolve(response)
      }
      catch (error) {
        // 失败
        const httpError = error as HttpError

        if (req.attempts < this.config.maxAttempts) {
          // 重新入队
          this.queue.push(req)
        }
        else {
          // 达到最大尝试次数，放弃
          this.stats.replayedFailure++
          this.stats.totalReplays++
          this.config.onReplayFailure(req.config, httpError)
          req.reject(httpError)
        }
      }
    }

    this.isReplaying = false

    // 如果还有请求在队列中，继续重放
    if (this.queue.length > 0) {
      setTimeout(() => {
        this.replayAll()
      }, this.config.interval)
    }
  }

  /**
   * 获取队列大小
   *
   * @returns number - 队列中的请求数
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * 获取统计信息
   *
   * @returns ReplayStats - 统计信息
   *
   * @example
   * ```typescript
   * const stats = replayer.getStats()
   * console.log(`队列大小: ${stats.queueSize}`)
   * console.log(`成功重放: ${stats.replayedSuccess}`)
   * ```
   */
  getStats(): ReplayStats {
    return {
      queueSize: this.queue.length,
      replayedSuccess: this.stats.replayedSuccess,
      replayedFailure: this.stats.replayedFailure,
      totalReplays: this.stats.totalReplays,
    }
  }

  /**
   * 清空队列
   *
   * @param rejectAll - 是否拒绝所有等待的Promise
   *
   * @example
   * ```typescript
   * // 清空队列并拒绝所有请求
   * replayer.clearQueue(true)
   * ```
   */
  clearQueue(rejectAll: boolean = false): void {
    if (rejectAll) {
      const error = new Error('Replay queue cleared') as HttpError
      this.queue.forEach(req => req.reject(error))
    }

    this.queue = []
  }

  /**
   * 启用重放
   */
  enable(): void {
    this.config.enabled = true
  }

  /**
   * 禁用重放
   */
  disable(): void {
    this.config.enabled = false
  }

  /**
   * 检查是否启用
   *
   * @returns boolean - 是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled
  }
}

/**
 * 创建请求重放器
 *
 * @param client - HTTP客户端
 * @param config - 重放配置
 * @returns RequestReplayer - 重放器实例
 *
 * @example
 * ```typescript
 * const replayer = createRequestReplayer(client, {
 *   maxAttempts: 3,
 *   delay: 1000
 * })
 *
 * // 监听网络状态
 * window.addEventListener('online', () => {
 *   replayer.replayAll()
 * })
 * ```
 */
export function createRequestReplayer(
  client: HttpClient,
  config?: ReplayConfig,
): RequestReplayer {
  return new RequestReplayer(client, config)
}


