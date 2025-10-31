import type { RetryConfig } from '../types'

/**
 * 重试管理器
 */
export class RetryManager {
  private config: RetryConfig

  constructor(config: RetryConfig = {}) {
    this.config = {
      retries: 3,
      retryDelay: 1000,
      retryDelayStrategy: 'exponential',
      shouldRetry: (error: any) => {
        // 默认只重试网络错误和5xx服务器错误
        if (!error.response) {
          return true // 网络错误
        }
        return error.response.status >= 500 && error.response.status < 600
      },
      ...config,
    }
  }

  /**
   * 计算重试延迟
   */
  private calculateDelay(attemptNumber: number): number {
    const { retryDelay = 1000, retryDelayStrategy = 'exponential' } = this.config

    if (retryDelayStrategy === 'exponential') {
      // 指数退避: delay * 2^attempt
      return retryDelay * 2 ** attemptNumber
    }

    // 固定延迟
    return retryDelay
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 执行请求（带重试）
   */
  async execute<T>(
    requestFn: () => Promise<T>,
    retryConfig?: RetryConfig,
  ): Promise<T> {
    const config = { ...this.config, ...retryConfig }
    const { retries = 3, shouldRetry } = config

    let lastError: any
    let attemptNumber = 0

    while (attemptNumber <= retries) {
      try {
        return await requestFn()
      }
      catch (error: any) {
        lastError = error
        attemptNumber++

        // 检查是否应该重试
        const shouldRetryRequest = shouldRetry ? shouldRetry(error) : true
        if (attemptNumber > retries || !shouldRetryRequest) {
          break
        }

        // 计算延迟并等待
        const delayMs = this.calculateDelay(attemptNumber - 1)
        await this.delay(delayMs)
      }
    }

    throw lastError
  }
}
