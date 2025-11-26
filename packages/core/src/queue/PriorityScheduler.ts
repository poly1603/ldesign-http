import type { RequestConfig } from '../types'

/**
 * 优先级类型
 */
export type PriorityLevel = 'critical' | 'high' | 'normal' | 'low' | number

/**
 * 调度任务接口
 */
export interface ScheduledTask<T = any> {
  id: string
  priority: number
  config: RequestConfig
  executor: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: any) => void
  timestamp: number
  timeout?: number
}

/**
 * 调度器配置
 */
export interface SchedulerConfig {
  /** 最大并发数，默认6 */
  maxConcurrency?: number
  /** 是否启用优先级调度，默认true */
  enablePriority?: boolean
  /** 默认优先级，默认50 */
  defaultPriority?: number
  /** 任务超时时间(ms)，默认30秒 */
  taskTimeout?: number
}

/**
 * 请求优先级调度器
 *
 * 功能：
 * 1. 管理请求并发数
 * 2. 按优先级调度请求执行顺序
 * 3. 支持任务取消和超时
 * 4. 提供调度统计信息
 *
 * 优先级映射：
 * - critical: 100
 * - high: 75
 * - normal: 50
 * - low: 25
 * - number: 自定义值
 *
 * @example
 * ```typescript
 * const scheduler = new PriorityScheduler({ maxConcurrency: 6 })
 *
 * // 添加高优先级任务
 * const result = await scheduler.schedule(
 *   () => fetch('/api/critical'),
 *   { priority: 'critical' }
 * )
 *
 * // 添加普通任务
 * const data = await scheduler.schedule(
 *   () => fetch('/api/data'),
 *   { priority: 'normal' }
 * )
 * ```
 */
export class PriorityScheduler {
  private maxConcurrency: number
  private enablePriority: boolean
  private defaultPriority: number
  private taskTimeout: number

  private queue: ScheduledTask[] = []
  private running = new Map<string, ScheduledTask>()
  private taskIdCounter = 0

  // 统计信息
  private stats = {
    totalScheduled: 0,
    totalCompleted: 0,
    totalFailed: 0,
    totalCanceled: 0,
    totalTimeout: 0,
  }

  constructor(config: SchedulerConfig = {}) {
    this.maxConcurrency = config.maxConcurrency ?? 6
    this.enablePriority = config.enablePriority ?? true
    this.defaultPriority = config.defaultPriority ?? 50
    this.taskTimeout = config.taskTimeout ?? 30000
  }

  /**
   * 调度任务执行
   *
   * @param executor - 任务执行函数
   * @param options - 调度选项
   * @returns Promise<T> - 任务结果
   */
  async schedule<T = any>(
    executor: () => Promise<T>,
    options: {
      priority?: PriorityLevel
      config?: RequestConfig
      timeout?: number
    } = {}
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: ScheduledTask<T> = {
        id: `task_${++this.taskIdCounter}`,
        priority: this.normalizePriority(options.priority),
        config: options.config || {},
        executor,
        resolve,
        reject,
        timestamp: Date.now(),
        timeout: options.timeout || this.taskTimeout,
      }

      this.stats.totalScheduled++
      this.enqueue(task)
      this.processQueue()
    })
  }

  /**
   * 将任务加入队列
   */
  private enqueue(task: ScheduledTask): void {
    if (this.enablePriority) {
      // 按优先级插入(高优先级在前)
      let inserted = false
      for (let i = 0; i < this.queue.length; i++) {
        if (task.priority > this.queue[i]!.priority) {
          this.queue.splice(i, 0, task)
          inserted = true
          break
        }
      }
      if (!inserted) {
        this.queue.push(task)
      }
    }
    else {
      // FIFO队列
      this.queue.push(task)
    }
  }

  /**
   * 处理队列
   */
  private processQueue(): void {
    // 如果达到并发限制，不处理新任务
    if (this.running.size >= this.maxConcurrency) {
      return
    }

    // 从队列取出任务
    const task = this.queue.shift()
    if (!task) {
      return
    }

    // 执行任务
    this.executeTask(task)

    // 继续处理队列
    if (this.queue.length > 0 && this.running.size < this.maxConcurrency) {
      this.processQueue()
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    this.running.set(task.id, task)

    // 设置超时
    const timeoutId = task.timeout
      ? setTimeout(() => {
          this.handleTimeout(task)
        }, task.timeout)
      : null

    try {
      const result = await task.executor()
      if (timeoutId) clearTimeout(timeoutId)

      // 只有任务仍在运行中才resolve
      if (this.running.has(task.id)) {
        task.resolve(result)
        this.stats.totalCompleted++
      }
    }
    catch (error) {
      if (timeoutId) clearTimeout(timeoutId)

      // 只有任务仍在运行中才reject
      if (this.running.has(task.id)) {
        task.reject(error)
        this.stats.totalFailed++
      }
    }
    finally {
      this.running.delete(task.id)
      this.processQueue()
    }
  }

  /**
   * 处理任务超时
   */
  private handleTimeout(task: ScheduledTask): void {
    if (this.running.has(task.id)) {
      this.running.delete(task.id)
      task.reject(new Error(`Task timeout after ${task.timeout}ms`))
      this.stats.totalTimeout++
      this.processQueue()
    }
  }

  /**
   * 标准化优先级值
   */
  private normalizePriority(priority?: PriorityLevel): number {
    if (typeof priority === 'number') {
      return priority
    }

    switch (priority) {
      case 'critical':
        return 100
      case 'high':
        return 75
      case 'low':
        return 25
      case 'normal':
      default:
        return this.defaultPriority
    }
  }

  /**
   * 取消指定任务
   */
  cancel(taskId: string): boolean {
    // 从队列中移除
    const queueIndex = this.queue.findIndex(t => t.id === taskId)
    if (queueIndex !== -1) {
      const task = this.queue.splice(queueIndex, 1)[0]
      task!.reject(new Error('Task canceled'))
      this.stats.totalCanceled++
      return true
    }

    // 取消正在运行的任务
    const runningTask = this.running.get(taskId)
    if (runningTask) {
      this.running.delete(taskId)
      runningTask.reject(new Error('Task canceled'))
      this.stats.totalCanceled++
      this.processQueue()
      return true
    }

    return false
  }

  /**
   * 取消所有任务
   */
  cancelAll(): number {
    let canceled = 0

    // 取消队列中的任务
    while (this.queue.length > 0) {
      const task = this.queue.shift()!
      task.reject(new Error('All tasks canceled'))
      canceled++
    }

    // 取消运行中的任务
    for (const task of this.running.values()) {
      task.reject(new Error('All tasks canceled'))
      canceled++
    }
    this.running.clear()

    this.stats.totalCanceled += canceled
    return canceled
  }

  /**
   * 获取队列大小
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * 获取运行中任务数
   */
  getRunningSize(): number {
    return this.running.size
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      runningSize: this.running.size,
      maxConcurrency: this.maxConcurrency,
      successRate:
        this.stats.totalCompleted /
        (this.stats.totalCompleted + this.stats.totalFailed || 1),
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalScheduled: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalCanceled: 0,
      totalTimeout: 0,
    }
  }

  /**
   * 设置最大并发数
   */
  setMaxConcurrency(max: number): void {
    this.maxConcurrency = Math.max(1, max)
    this.processQueue()
  }

  /**
   * 等待所有任务完成
   */
  async waitForAll(): Promise<void> {
    while (this.queue.length > 0 || this.running.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  /**
   * 清空队列但不取消运行中的任务
   */
  clearQueue(): number {
    const cleared = this.queue.length
    this.queue = []
    return cleared
  }
}