import type { RequestConfig, ResponseData } from '../types'

export interface QueueConfig {
  /** 最大并发数 */
  concurrency?: number
  /** 队列优先级 */
  priority?: boolean
}

export interface QueueTask<T = any> {
  id: string
  config: RequestConfig
  priority: number
  execute: () => Promise<ResponseData<T>>
  resolve: (value: ResponseData<T>) => void
  reject: (error: any) => void
}

/**
 * 请求队列管理器
 */
export class RequestQueue {
  private queue: QueueTask[] = []
  private running = 0
  private config: Required<QueueConfig>

  constructor(config: QueueConfig = {}) {
    this.config = {
      concurrency: 6,
      priority: false,
      ...config,
    }
  }

  /**
   * 添加请求到队列
   */
  enqueue<T = any>(
    config: RequestConfig,
    execute: () => Promise<ResponseData<T>>,
    priority = 0,
  ): Promise<ResponseData<T>> {
    return new Promise((resolve, reject) => {
      const task: QueueTask<T> = {
        id: Math.random().toString(36).slice(2),
        config,
        priority,
        execute,
        resolve,
        reject,
      }

      // 按优先级插入队列
      if (this.config.priority && priority > 0) {
        const insertIndex = this.queue.findIndex(t => t.priority < priority)
        if (insertIndex === -1) {
          this.queue.push(task)
        }
        else {
          this.queue.splice(insertIndex, 0, task)
        }
      }
      else {
        this.queue.push(task)
      }

      this.processQueue()
    })
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.running >= this.config.concurrency || this.queue.length === 0) {
      return
    }

    const task = this.queue.shift()
    if (!task)
      return

    this.running++

    try {
      const result = await task.execute()
      task.resolve(result)
    }
    catch (error) {
      task.reject(error)
    }
    finally {
      this.running--
      this.processQueue()
    }
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue.forEach(task =>
      task.reject(new Error('Queue cleared')),
    )
    this.queue = []
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      pending: this.queue.length,
      running: this.running,
      concurrency: this.config.concurrency,
    }
  }

  /**
   * 设置并发数
   */
  setConcurrency(concurrency: number): void {
    this.config.concurrency = concurrency
    this.processQueue()
  }
}
