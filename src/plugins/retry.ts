/**
 * 重试插件
 * 提供请求重试功能
 */

import type {
  HttpClientInstance,
  HttpError,
  HttpPlugin,
  RequestConfig,
  RetryConfig,
} from '../types'

/**
 * 重试策略枚举
 */
export enum RetryStrategy {
  /** 固定延迟 */
  FIXED = 'fixed',
  /** 指数退避 */
  EXPONENTIAL = 'exponential',
  /** 线性增长 */
  LINEAR = 'linear',
  /** 自定义 */
  CUSTOM = 'custom',
}

/**
 * 扩展的重试配置
 */
export interface ExtendedRetryConfig extends RetryConfig {
  /** 重试策略 */
  strategy?: RetryStrategy
  /** 最大延迟时间（毫秒） */
  maxDelay?: number
  /** 延迟抖动因子 (0-1) */
  jitter?: number
  /** 重试前的回调 */
  onRetry?: (error: HttpError, retryCount: number) => void
  /** 重试失败的回调 */
  onRetryFailed?: (error: HttpError, retryCount: number) => void
}

/**
 * 重试管理器
 */
export class RetryManager {
  private config: Required<ExtendedRetryConfig>

  constructor(config: ExtendedRetryConfig = {}) {
    this.config = {
      retries: 3,
      retryDelay: 1000,
      strategy: RetryStrategy.EXPONENTIAL,
      maxDelay: 30000,
      jitter: 0.1,
      retryCondition: this.defaultRetryCondition,
      retryDelayCalculator: this.createDelayCalculator(),
      onRetry: () => {},
      onRetryFailed: () => {},
      ...config,
    }

    // 如果没有提供自定义延迟计算器，根据策略创建
    if (!config.retryDelayCalculator) {
      this.config.retryDelayCalculator = this.createDelayCalculator()
    }
  }

  /**
   * 默认重试条件
   */
  private defaultRetryCondition(error: HttpError): boolean {
    // 网络错误或5xx服务器错误才重试
    if (error.isNetworkError || error.isTimeoutError) {
      return true
    }

    if (error.response) {
      const status = error.response.status
      return status >= 500 && status < 600
    }

    return false
  }

  /**
   * 创建延迟计算器
   */
  private createDelayCalculator() {
    return (retryCount: number, error: HttpError): number => {
      let delay: number

      switch (this.config.strategy) {
        case RetryStrategy.FIXED:
          delay = this.config.retryDelay
          break
        case RetryStrategy.LINEAR:
          delay = this.config.retryDelay * retryCount
          break
        case RetryStrategy.EXPONENTIAL:
          delay = this.config.retryDelay * 2 ** (retryCount - 1)
          break
        default:
          delay = this.config.retryDelay
      }

      // 应用最大延迟限制
      delay = Math.min(delay, this.config.maxDelay)

      // 添加抖动
      if (this.config.jitter > 0) {
        const jitterAmount = delay * this.config.jitter
        const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount
        delay += randomJitter
      }

      return Math.max(0, Math.round(delay))
    }
  }

  /**
   * 执行重试
   */
  async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    config?: RequestConfig,
  ): Promise<T> {
    let lastError: HttpError
    let retryCount = 0

    while (retryCount <= this.config.retries) {
      try {
        return await requestFn()
      }
 catch (error: any) {
        lastError = error as HttpError

        // 如果不满足重试条件或已达到最大重试次数，直接抛出错误
        if (retryCount >= this.config.retries || !this.config.retryCondition(lastError)) {
          if (retryCount > 0) {
            this.config.onRetryFailed(lastError, retryCount)
          }
          throw lastError
        }

        retryCount++

        // 触发重试回调
        this.config.onRetry(lastError, retryCount)

        // 计算延迟时间
        const delay = this.config.retryDelayCalculator(retryCount, lastError)

        // 等待延迟
        if (delay > 0) {
          await this.delay(delay)
        }
      }
    }

    throw lastError!
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ExtendedRetryConfig>): void {
    this.config = { ...this.config, ...config }

    // 如果策略改变了，重新创建延迟计算器
    if (config.strategy && !config.retryDelayCalculator) {
      this.config.retryDelayCalculator = this.createDelayCalculator()
    }
  }

  /**
   * 获取配置
   */
  getConfig(): Required<ExtendedRetryConfig> {
    return { ...this.config }
  }
}

/**
 * 重试插件
 */
export function createRetryPlugin(config: ExtendedRetryConfig = {}): HttpPlugin {
  return {
    name: 'retry',
    install(client: HttpClientInstance) {
      const retryManager = new RetryManager(config)

      // 保存原始请求方法
      const originalRequest = client.request.bind(client)

      // 重写请求方法以支持重试
      client.request = async function<T>(requestConfig: any): Promise<T> {
        return retryManager.executeWithRetry(
          () => originalRequest<T>(requestConfig),
          requestConfig,
        )
      }

      // 扩展客户端方法
      ;(client as any).retry = {
        updateConfig: (newConfig: Partial<ExtendedRetryConfig>) => retryManager.updateConfig(newConfig),
        getConfig: () => retryManager.getConfig(),
      }
    },
  }
}

/**
 * 创建固定延迟重试配置
 */
export function createFixedRetryConfig(
  retries: number = 3,
  delay: number = 1000,
): ExtendedRetryConfig {
  return {
    retries,
    retryDelay: delay,
    strategy: RetryStrategy.FIXED,
  }
}

/**
 * 创建指数退避重试配置
 */
export function createExponentialRetryConfig(
  retries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 30000,
): ExtendedRetryConfig {
  return {
    retries,
    retryDelay: initialDelay,
    strategy: RetryStrategy.EXPONENTIAL,
    maxDelay,
  }
}

/**
 * 创建线性增长重试配置
 */
export function createLinearRetryConfig(
  retries: number = 3,
  delay: number = 1000,
): ExtendedRetryConfig {
  return {
    retries,
    retryDelay: delay,
    strategy: RetryStrategy.LINEAR,
  }
}

/**
 * 创建自定义重试配置
 */
export function createCustomRetryConfig(
  retries: number,
  delayCalculator: (retryCount: number, error: HttpError) => number,
  retryCondition?: (error: HttpError) => boolean,
): ExtendedRetryConfig {
  return {
    retries,
    strategy: RetryStrategy.CUSTOM,
    retryDelayCalculator: delayCalculator,
    retryCondition,
  }
}
