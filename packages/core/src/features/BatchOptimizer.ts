import type { RequestConfig, ResponseData } from '../types'

export interface BatchConfig {
  /** 批量间隔时间(ms) */
  interval?: number
  /** 最大批量大小 */
  maxSize?: number
  /** 是否启用 */
  enabled?: boolean
}

export interface BatchRequest<T = any> {
  config: RequestConfig
  resolve: (value: ResponseData<T>) => void
  reject: (error: any) => void
}

/**
 * 批量请求优化器
 */
export class BatchOptimizer {
  private queue: BatchRequest[] = []
  private timer: NodeJS.Timeout | null = null
  private config: Required<BatchConfig>

  constructor(
    private executor: (configs: RequestConfig[]) => Promise<ResponseData[]>,
    config: BatchConfig = {},
  ) {
    this.config = {
      interval: 50,
      maxSize: 10,
      enabled: true,
      ...config,
    }
  }

  /**
   * 添加请求到批量队列
   */
  add<T = any>(config: RequestConfig): Promise<ResponseData<T>> {
    if (!this.config.enabled) {
      return this.executor([config]).then(results => results[0] as ResponseData<T>)
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ config, resolve, reject })

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

    if (this.queue.length === 0)
      return

    const batch = this.queue.splice(0, this.config.maxSize)
    const configs = batch.map(item => item.config)

    try {
      const results = await this.executor(configs)

      // 将结果分发给对应的Promise
      batch.forEach((item, index) => {
        if (results[index]) {
          item.resolve(results[index])
        }
        else {
          item.reject(new Error('No result for request'))
        }
      })
    }
    catch (error) {
      // 批量失败，所有请求都失败
      batch.forEach(item => item.reject(error))
    }

    // 如果队列中还有请求，继续处理
    if (this.queue.length > 0) {
      this.timer = setTimeout(() => {
        this.flush()
      }, this.config.interval)
    }
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
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      pending: this.queue.length,
      enabled: this.config.enabled,
    }
  }
}
