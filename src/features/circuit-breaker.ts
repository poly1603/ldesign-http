/**
 * 断路器模式（Circuit Breaker Pattern）
 *
 * 断路器是一种用于防止系统雪崩的保护机制。
 * 当服务频繁失败时，断路器会"断开"，快速失败而不是继续尝试，
 * 给后端服务恢复的时间。
 *
 * 核心价值：
 * - 🛡️ **系统保护**：防止级联失败和雪崩效应
 * - ⚡ **快速失败**：避免浪费资源在注定失败的请求上
 * - 🔄 **自动恢复**：定期尝试恢复，无需人工干预
 * - 📊 **状态监控**：清晰的状态转换和统计
 *
 * 三种状态：
 * - CLOSED（关闭）：正常状态，请求正常通过
 * - OPEN（断开）：断路状态，请求快速失败
 * - HALF_OPEN（半开）：尝试恢复，部分请求通过测试
 *
 * 状态转换：
 * ```
 * CLOSED --[失败次数>=阈值]--> OPEN
 * OPEN --[超时后]--> HALF_OPEN
 * HALF_OPEN --[成功次数>=阈值]--> CLOSED
 * HALF_OPEN --[失败]--> OPEN
 * ```
 *
 * @example 基础用法
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,    // 5次失败后断路
 *   successThreshold: 2,    // 2次成功后恢复
 *   timeout: 60000,         // 60秒后尝试恢复
 *   windowSize: 10000       // 10秒统计窗口
 * })
 *
 * try {
 *   const response = await breaker.execute(() =>
 *     client.get('/api/unstable-service')
 *   )
 * } catch (error) {
 *   if (error.message === 'Circuit breaker is OPEN') {
 *     // 服务已降级，使用fallback
 *     return getFallbackData()
 *   }
 *   throw error
 * }
 * ```
 */

import type { HttpClient, ResponseData } from '../types'

/**
 * 断路器状态枚举
 */
export enum CircuitState {
  /** 关闭状态：正常工作，所有请求通过 */
  CLOSED = 'closed',
  /** 断开状态：服务异常，请求快速失败 */
  OPEN = 'open',
  /** 半开状态：尝试恢复，部分请求用于测试 */
  HALF_OPEN = 'half_open',
}

/**
 * 断路器配置接口
 */
export interface CircuitBreakerConfig {
  /** 失败阈值：连续失败多少次后触发断路（默认5） */
  failureThreshold?: number
  /** 成功阈值：半开状态下连续成功多少次后恢复（默认2） */
  successThreshold?: number
  /** 超时时间：断路后多久尝试恢复（默认60秒） */
  timeout?: number
  /** 统计窗口大小：统计最近多少毫秒内的请求（默认10秒） */
  windowSize?: number
  /** 半开状态允许通过的请求数（默认3） */
  halfOpenMaxCalls?: number
}

/**
 * 断路器统计信息
 */
export interface CircuitBreakerStats {
  /** 当前状态 */
  state: CircuitState
  /** 总请求数 */
  totalCalls: number
  /** 成功次数 */
  successCount: number
  /** 失败次数 */
  failureCount: number
  /** 拒绝次数（断路器打开时） */
  rejectedCount: number
  /** 上次状态变更时间 */
  lastStateChange: number
  /** 下次尝试恢复时间（仅OPEN状态） */
  nextAttempt?: number
}

/**
 * 断路器实现
 *
 * 实现了完整的断路器模式，包括三种状态和自动恢复机制。
 *
 * @example 在HTTP客户端中使用
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   timeout: 60000
 * })
 *
 * async function fetchWithCircuitBreaker(url: string) {
 *   return breaker.execute(async () => {
 *     const response = await client.get(url)
 *     return response.data
 *   })
 * }
 * ```
 *
 * @example 与降级策略配合
 * ```typescript
 * async function fetchData() {
 *   try {
 *     return await breaker.execute(() => 
 *       client.get('/api/primary')
 *     )
 *   } catch (error) {
 *     if (breaker.getState() === CircuitState.OPEN) {
 *       // 断路器打开，使用降级方案
 *       console.warn('主服务不可用，使用备用方案')
 *       return getFallbackData()
 *     }
 *     throw error
 *   }
 * }
 * ```
 */
export class CircuitBreaker {
  /** 当前状态 */
  private state: CircuitState = CircuitState.CLOSED

  /** 连续失败次数 */
  private failures: number = 0

  /** 连续成功次数（半开状态） */
  private successes: number = 0

  /** 下次尝试恢复的时间戳 */
  private nextAttempt: number = 0

  /** 半开状态下的请求计数 */
  private halfOpenCalls: number = 0

  /** 配置 */
  private config: Required<CircuitBreakerConfig>

  /** 统计信息 */
  private stats = {
    totalCalls: 0,
    successCount: 0,
    failureCount: 0,
    rejectedCount: 0,
    lastStateChange: Date.now(),
  }

  /**
   * 构造函数
   *
   * @param config - 断路器配置
   *
   * @example
   * ```typescript
   * const breaker = new CircuitBreaker({
   *   failureThreshold: 5,
   *   successThreshold: 2,
   *   timeout: 60000
   * })
   * ```
   */
  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      timeout: config.timeout ?? 60000,
      windowSize: config.windowSize ?? 10000,
      halfOpenMaxCalls: config.halfOpenMaxCalls ?? 3,
    }
  }

  /**
   * 执行受保护的函数
   *
   * 根据断路器状态决定是否执行函数。
   *
   * @template T - 返回值类型
   * @param fn - 要执行的函数
   * @returns Promise<T> - 函数执行结果
   *
   * @throws {Error} 当断路器处于OPEN状态时抛出错误
   *
   * @example
   * ```typescript
   * const result = await breaker.execute(async () => {
   *   return await someAsyncOperation()
   * })
   * ```
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.totalCalls++

    // 状态1：断开状态
    if (this.state === CircuitState.OPEN) {
      const now = Date.now()

      if (now < this.nextAttempt) {
        // 还在断路期间，快速失败
        this.stats.rejectedCount++
        throw new Error('Circuit breaker is OPEN')
      }

      // 超时了，尝试恢复
      this.transitionTo(CircuitState.HALF_OPEN)
      this.successes = 0
      this.halfOpenCalls = 0
    }

    // 状态2：半开状态
    if (this.state === CircuitState.HALF_OPEN) {
      // 限制半开状态下的请求数
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.stats.rejectedCount++
        throw new Error('Circuit breaker is HALF_OPEN and at max calls')
      }

      this.halfOpenCalls++
    }

    // 执行函数
    try {
      const result = await fn()
      this.onSuccess()
      return result
    }
    catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * 处理成功情况
   *
   * @private
   */
  private onSuccess(): void {
    this.stats.successCount++
    this.failures = 0

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++

      // 达到成功阈值，恢复正常
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED)
      }
    }
  }

  /**
   * 处理失败情况
   *
   * @private
   */
  private onFailure(): void {
    this.stats.failureCount++
    this.failures++
    this.successes = 0

    // 半开状态下失败，立即断路
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN)
      this.nextAttempt = Date.now() + this.config.timeout
      return
    }

    // 关闭状态下达到失败阈值，触发断路
    if (this.state === CircuitState.CLOSED && this.failures >= this.config.failureThreshold) {
      this.transitionTo(CircuitState.OPEN)
      this.nextAttempt = Date.now() + this.config.timeout
    }
  }

  /**
   * 状态转换
   *
   * @param newState - 新状态
   * @private
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state
    this.state = newState
    this.stats.lastStateChange = Date.now()

    console.log(`Circuit Breaker: ${oldState} → ${newState}`)
  }

  /**
   * 获取当前状态
   *
   * @returns CircuitState - 当前断路器状态
   *
   * @example
   * ```typescript
   * const state = breaker.getState()
   * if (state === CircuitState.OPEN) {
   *   console.log('服务已降级')
   * }
   * ```
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * 获取统计信息
   *
   * @returns CircuitBreakerStats - 统计信息
   *
   * @example
   * ```typescript
   * const stats = breaker.getStats()
   * console.log(`成功率: ${(stats.successCount / stats.totalCalls * 100).toFixed(2)}%`)
   * console.log(`当前状态: ${stats.state}`)
   * ```
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      totalCalls: this.stats.totalCalls,
      successCount: this.stats.successCount,
      failureCount: this.stats.failureCount,
      rejectedCount: this.stats.rejectedCount,
      lastStateChange: this.stats.lastStateChange,
      nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : undefined,
    }
  }

  /**
   * 手动打开断路器
   *
   * @example
   * ```typescript
   * // 维护时手动断路
   * breaker.open()
   * ```
   */
  open(): void {
    this.transitionTo(CircuitState.OPEN)
    this.nextAttempt = Date.now() + this.config.timeout
  }

  /**
   * 手动关闭断路器（恢复）
   *
   * @example
   * ```typescript
   * // 维护完成后手动恢复
   * breaker.close()
   * ```
   */
  close(): void {
    this.transitionTo(CircuitState.CLOSED)
    this.failures = 0
    this.successes = 0
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalCalls: 0,
      successCount: 0,
      failureCount: 0,
      rejectedCount: 0,
      lastStateChange: Date.now(),
    }
  }
}

/**
 * 创建断路器实例
 *
 * @param config - 断路器配置
 * @returns CircuitBreaker - 断路器实例
 *
 * @example
 * ```typescript
 * const breaker = createCircuitBreaker({
 *   failureThreshold: 5,
 *   timeout: 60000
 * })
 * ```
 */
export function createCircuitBreaker(
  config?: CircuitBreakerConfig,
): CircuitBreaker {
  return new CircuitBreaker(config)
}

/**
 * 为HTTP客户端添加断路器保护
 *
 * @param client - HTTP客户端实例
 * @param config - 断路器配置
 * @returns 带断路器保护的客户端包装器
 *
 * @example
 * ```typescript
 * const client = await createHttpClient(config)
 * const protectedClient = withCircuitBreaker(client, {
 *   failureThreshold: 5
 * })
 *
 * // 使用保护的客户端
 * const data = await protectedClient.get('/api/data')
 * ```
 */
export function withCircuitBreaker(
  client: HttpClient,
  config?: CircuitBreakerConfig,
) {
  const breaker = new CircuitBreaker(config)

  return {
    ...client,

    async get<T = unknown>(url: string, requestConfig?: any): Promise<ResponseData<T>> {
      return breaker.execute(() => client.get<T>(url, requestConfig))
    },

    async post<T = unknown, D = unknown>(url: string, data?: D, requestConfig?: any): Promise<ResponseData<T>> {
      return breaker.execute(() => client.post<T, D>(url, data, requestConfig))
    },

    async put<T = unknown, D = unknown>(url: string, data?: D, requestConfig?: any): Promise<ResponseData<T>> {
      return breaker.execute(() => client.put<T, D>(url, data, requestConfig))
    },

    async delete<T = unknown>(url: string, requestConfig?: any): Promise<ResponseData<T>> {
      return breaker.execute(() => client.delete<T>(url, requestConfig))
    },

    async patch<T = unknown, D = unknown>(url: string, data?: D, requestConfig?: any): Promise<ResponseData<T>> {
      return breaker.execute(() => client.patch<T, D>(url, data, requestConfig))
    },

    // 暴露断路器状态
    circuitBreaker: breaker,
  }
}


