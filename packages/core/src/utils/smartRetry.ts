/**
 * 智能重试策略
 *
 * 根据错误类型、HTTP状态码、网络状况等智能决定是否重试
 */

import type { HttpError } from '../types'

/**
 * 重试策略类型
 */
export enum RetryStrategy {
  /** 立即重试 */
  IMMEDIATE = 'immediate',
  /** 指数退避 */
  EXPONENTIAL = 'exponential',
  /** 线性退避 */
  LINEAR = 'linear',
  /** 固定延迟 */
  FIXED = 'fixed',
  /** 不重试 */
  NONE = 'none',
}

/**
 * 重试决策结果
 */
export interface RetryDecision {
  /** 是否应该重试 */
  shouldRetry: boolean
  /** 重试延迟(ms) */
  delay: number
  /** 建议的策略 */
  strategy: RetryStrategy
  /** 决策原因 */
  reason: string
}

/**
 * 智能重试配置
 */
export interface SmartRetryConfig {
  /** 最大重试次数 */
  maxRetries?: number
  /** 基础延迟(ms) */
  baseDelay?: number
  /** 最大延迟(ms) */
  maxDelay?: number
  /** 是否启用网络状态检测 */
  checkNetworkStatus?: boolean
  /** 可重试的HTTP状态码 */
  retryableStatusCodes?: number[]
  /** 不可重试的HTTP状态码 */
  nonRetryableStatusCodes?: number[]
  /** 自定义重试决策函数 */
  customDecision?: (error: HttpError, attempt: number) => RetryDecision | null
  /** 是否启用自适应重试 */
  adaptive?: boolean
  /** 是否尊重 Retry-After 响应头 */
  respectRetryAfter?: boolean
  /** 降级策略配置 */
  degradation?: DegradationConfig
}

/**
 * 降级配置
 */
export interface DegradationConfig {
  /** 是否启用降级 */
  enabled?: boolean
  /** 降级级别配置 */
  levels?: DegradationLevel[]
}

/**
 * 降级级别
 */
export interface DegradationLevel {
  /** 在第几次重试后启用 */
  after: number
  /** 配置变更 */
  changes: {
    timeout?: number
    cache?: string
    priority?: number
    [key: string]: any
  }
}

/**
 * 自适应重试历史
 */
interface AdaptiveHistory {
  url: string
  successCount: number
  failureCount: number
  avgResponseTime: number
  lastSuccess: number
  lastFailure: number
}

/**
 * 智能重试管理器
 *
 * @example
 * ```typescript
 * const retryManager = new SmartRetryManager({
 *  maxRetries: 3,
 *  checkNetworkStatus: true,
 * })
 *
 * const decision = retryManager.shouldRetry(error, 1)
 * if (decision.shouldRetry) {
 *  await delay(decision.delay)
 *  // 重试请求
 * }
 * ```
 */
export class SmartRetryManager {
  private config: Required<Omit<SmartRetryConfig, 'customDecision' | 'adaptive' | 'respectRetryAfter' | 'degradation'>> & {
    customDecision?: SmartRetryConfig['customDecision']
    adaptive?: boolean
    respectRetryAfter?: boolean
    degradation?: DegradationConfig
  }

  // 自适应重试历史记录
  private adaptiveHistory = new Map<string, AdaptiveHistory>()

  // 默认可重试的状态码（服务器错误、网关错误等）
  private static readonly DEFAULT_RETRYABLE_STATUS_CODES = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ]

  // 绝对不可重试的状态码（客户端错误）
  private static readonly DEFAULT_NON_RETRYABLE_STATUS_CODES = [
    400, // Bad Request
    401, // Unauthorized
    403, // Forbidden
    404, // Not Found
    405, // Method Not Allowed
    422, // Unprocessable Entity
  ]

  constructor(config: SmartRetryConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      checkNetworkStatus: config.checkNetworkStatus ?? true,
      retryableStatusCodes: config.retryableStatusCodes ?? SmartRetryManager.DEFAULT_RETRYABLE_STATUS_CODES,
      nonRetryableStatusCodes: config.nonRetryableStatusCodes ?? SmartRetryManager.DEFAULT_NON_RETRYABLE_STATUS_CODES,
      customDecision: config.customDecision,
      adaptive: config.adaptive ?? false,
      respectRetryAfter: config.respectRetryAfter ?? true,
      degradation: config.degradation,
    }
  }

  /**
   * 判断是否应该重试（增强版）
   */
  shouldRetry(error: HttpError, attempt: number): RetryDecision {
    // 超过最大重试次数
    if (attempt >= this.config?.maxRetries) {
      return {
        shouldRetry: false,
        delay: 0,
        strategy: RetryStrategy.NONE,
        reason: `已达到最大重试次数 ${this.config?.maxRetries}`,
      }
    }

    // 1. 使用自定义决策函数
    if (this.config?.customDecision) {
      const customDecision = this.config?.customDecision(error, attempt)
      if (customDecision) {
        return customDecision
      }
    }

    // 2. 尝试自适应重试决策
    if (this.config.adaptive) {
      const adaptiveDecision = this.adaptiveRetryDecision(error, attempt)
      if (adaptiveDecision) {
        return adaptiveDecision
      }
    }

    // 3. 检查网络状态
    if (this.config?.checkNetworkStatus && this.isOffline()) {
      return {
        shouldRetry: false,
        delay: 0,
        strategy: RetryStrategy.NONE,
        reason: '当前网络离线',
      }
    }

    // 4. 检查 Retry-After 响应头
    const retryAfterDelay = this.getRetryAfterDelay(error)
    if (retryAfterDelay !== null) {
      return {
        shouldRetry: true,
        delay: retryAfterDelay,
        strategy: RetryStrategy.FIXED,
        reason: `服务器建议在 ${retryAfterDelay}ms 后重试（Retry-After 头）`,
      }
    }

    // 根据错误类型判断
    const statusCode = error.response?.status

    // 没有状态码，可能是网络错误
    if (!statusCode) {
      return this.createRetryDecision(
        true,
        attempt,
        RetryStrategy.EXPONENTIAL,
        '网络错误，使用指数退避重试',
      )
    }

    // 检查是否在不可重试列表中
    if (this.config?.nonRetryableStatusCodes.includes(statusCode)) {
      return {
        shouldRetry: false,
        delay: 0,
        strategy: RetryStrategy.NONE,
        reason: `状态码 ${statusCode} 不可重试（客户端错误）`,
      }
    }

    // 检查是否在可重试列表中
    if (this.config?.retryableStatusCodes.includes(statusCode)) {
      return this.createRetryDecision(
        true,
        attempt,
        this.getStrategyForStatusCode(statusCode),
        `状态码 ${statusCode} 可重试`,
      )
    }

    // 5xx错误默认重试
    if (statusCode >= 500 && statusCode < 600) {
      return this.createRetryDecision(
        true,
        attempt,
        RetryStrategy.EXPONENTIAL,
        `服务器错误 ${statusCode}，使用指数退避重试`,
      )
    }

    // 其他情况不重试
    return {
      shouldRetry: false,
      delay: 0,
      strategy: RetryStrategy.NONE,
      reason: `状态码 ${statusCode} 不在重试范围内`,
    }
  }

  /**
   * 创建重试决策
   */
  private createRetryDecision(
    shouldRetry: boolean,
    attempt: number,
    strategy: RetryStrategy,
    reason: string,
  ): RetryDecision {
    return {
      shouldRetry,
      delay: this.calculateDelay(attempt, strategy),
      strategy,
      reason,
    }
  }

  /**
   * 根据状态码获取建议的重试策略
   */
  private getStrategyForStatusCode(statusCode: number): RetryStrategy {
    switch (statusCode) {
      case 429: // Too Many Requests - 使用指数退避
        return RetryStrategy.EXPONENTIAL
      case 503: // Service Unavailable - 使用线性退避
        return RetryStrategy.LINEAR
      case 504: // Gateway Timeout - 使用固定延迟
        return RetryStrategy.FIXED
      default:
        return RetryStrategy.EXPONENTIAL
    }
  }

  /**
   * 计算重试延迟
   */
  private calculateDelay(attempt: number, strategy: RetryStrategy): number {
    let delay: number

    switch (strategy) {
      case RetryStrategy.IMMEDIATE:
        delay = 0
        break

      case RetryStrategy.EXPONENTIAL:
        // 指数退避: baseDelay * 2^attempt
        delay = this.config?.baseDelay * 2 ** attempt
        break

      case RetryStrategy.LINEAR:
        // 线性退避: baseDelay * attempt
        delay = this.config?.baseDelay * attempt
        break

      case RetryStrategy.FIXED:
        // 固定延迟
        delay = this.config?.baseDelay
        break

      default:
        delay = 0
    }

    // 添加随机抖动，避免雷鸣效应
    delay = this.addJitter(delay)

    // 限制最大延迟
    return Math.min(delay, this.config?.maxDelay)
  }

  /**
   * 添加随机抖动（±25%）
   */
  private addJitter(delay: number): number {
    const jitter = delay * 0.25
    return delay + (Math.random() * jitter * 2 - jitter)
  }

  /**
   * 检查是否离线
   */
  private isOffline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return !navigator.onLine
    }
    return false
  }

  /**
   * 获取重试建议
   */
  getRetryAdvice(error: HttpError): string {
    const statusCode = error.response?.status

    if (!statusCode) {
      return '网络连接失败，请检查网络设置后重试'
    }

    if (statusCode === 429) {
      return '请求过于频繁，请稍后再试'
    }

    if (statusCode >= 500) {
      return '服务器暂时不可用，请稍后重试'
    }

    if (statusCode >= 400 && statusCode < 500) {
      return '请求参数有误，请检查后重试'
    }

    return '请求失败，请重试'
  }

  /**
   * 从 Retry-After 响应头获取重试延迟
   * 
   * @param error HTTP 错误对象
   * @returns 延迟时间（毫秒），如果没有 Retry-After 头则返回 null
   */
  getRetryAfterDelay(error: HttpError): number | null {
    if (!this.config.respectRetryAfter) {
      return null
    }

    const retryAfter = error.response?.headers?.['retry-after']
    if (!retryAfter) {
      return null
    }

    // Retry-After 可能是秒数或日期
    const retryAfterNum = Number(retryAfter)
    if (!Number.isNaN(retryAfterNum)) {
      // 是秒数
      return retryAfterNum * 1000
    }

    // 是日期
    const retryDate = new Date(retryAfter)
    if (!Number.isNaN(retryDate.getTime())) {
      return Math.max(0, retryDate.getTime() - Date.now())
    }

    return null
  }

  /**
   * 自适应重试决策
   * 
   * 基于历史成功率动态调整重试策略
   */
  adaptiveRetryDecision(error: HttpError, attempt: number): RetryDecision | null {
    if (!this.config.adaptive) {
      return null
    }

    const url = error.config?.url || ''
    const history = this.adaptiveHistory.get(url)

    if (!history) {
      // 没有历史记录，使用默认策略
      return null
    }

    // 计算成功率
    const total = history.successCount + history.failureCount
    const successRate = total > 0 ? history.successCount / total : 0

    // 根据成功率调整重试策略
    if (successRate < 0.3) {
      // 成功率低于 30%，减少重试次数
      return {
        shouldRetry: attempt < Math.floor(this.config.maxRetries / 2),
        delay: this.config.maxDelay, // 使用更长的延迟
        strategy: RetryStrategy.EXPONENTIAL,
        reason: `历史成功率较低 (${(successRate * 100).toFixed(1)}%)，减少重试`,
      }
    }

    if (successRate > 0.9) {
      // 成功率高于 90%，可以更积极地重试
      return {
        shouldRetry: attempt < this.config.maxRetries,
        delay: this.config.baseDelay / 2, // 使用更短的延迟
        strategy: RetryStrategy.FIXED,
        reason: `历史成功率较高 (${(successRate * 100).toFixed(1)}%)，积极重试`,
      }
    }

    return null
  }

  /**
   * 记录请求结果（用于自适应重试）
   */
  recordRequestResult(url: string, success: boolean, responseTime?: number): void {
    if (!this.config.adaptive) {
      return
    }

    let history = this.adaptiveHistory.get(url)

    if (!history) {
      history = {
        url,
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
        lastSuccess: 0,
        lastFailure: 0,
      }
      this.adaptiveHistory.set(url, history)
    }

    if (success) {
      history.successCount++
      history.lastSuccess = Date.now()

      if (responseTime) {
        // 更新平均响应时间（移动平均）
        history.avgResponseTime = history.avgResponseTime === 0
          ? responseTime
          : (history.avgResponseTime * 0.9 + responseTime * 0.1)
      }
    } else {
      history.failureCount++
      history.lastFailure = Date.now()
    }

    // 限制历史记录数量
    if (this.adaptiveHistory.size > 1000) {
      const firstKey = this.adaptiveHistory.keys().next().value
      if (firstKey) {
        this.adaptiveHistory.delete(firstKey)
      }
    }
  }

  /**
   * 获取降级配置
   * 
   * 根据重试次数返回应该应用的降级配置
   */
  getDegradationConfig(attempt: number): DegradationLevel['changes'] | null {
    if (!this.config.degradation?.enabled || !this.config.degradation.levels) {
      return null
    }

    // 找到适用的降级级别（倒序查找，使用最高的适用级别）
    const levels = [...this.config.degradation.levels].sort((a, b) => b.after - a.after)

    for (const level of levels) {
      if (attempt >= level.after) {
        return level.changes
      }
    }

    return null
  }

  /**
   * 应用降级配置
   * 
   * 将降级配置应用到请求配置上
   */
  applyDegradation(config: any, degradationChanges: DegradationLevel['changes']): any {
    return {
      ...config,
      ...degradationChanges,
    }
  }

  /**
   * 获取自适应历史统计
   */
  getAdaptiveStats(): Map<string, AdaptiveHistory> {
    return new Map(this.adaptiveHistory)
  }

  /**
   * 清空自适应历史
   */
  clearAdaptiveHistory(): void {
    this.adaptiveHistory.clear()
  }
}

/**
 * 创建智能重试管理器
 */
export function createSmartRetryManager(config?: SmartRetryConfig): SmartRetryManager {
  return new SmartRetryManager(config)
}

/**
 * 全局智能重试管理器
 */
export const globalSmartRetryManager = new SmartRetryManager()

/**
 * 智能重试拦截器
 *
 * 自动为失败的请求应用智能重试策略
 */
export function createSmartRetryInterceptor(config?: SmartRetryConfig) {
  const retryManager = new SmartRetryManager(config)
  const pendingRetries = new Map<string, number>()

  return {
    onRejected: async (error: HttpError): Promise<any> => {
      const requestKey = `${error.config?.method}:${error.config?.url}`
      const attempt = pendingRetries.get(requestKey) ?? 0

      const decision = retryManager.shouldRetry(error, attempt)

      if (decision.shouldRetry) {
        pendingRetries.set(requestKey, attempt + 1)

        // 等待延迟
        await new Promise(resolve => setTimeout(resolve, decision.delay))

        // 这里需要返回一个重试的promise
        // 实际使用时应该通过拦截器系统重新发起请求
        throw error // 暂时抛出错误，实际应该重试
      }

      // 清理重试记录
      pendingRetries.delete(requestKey)

      throw error
    },
  }
}
