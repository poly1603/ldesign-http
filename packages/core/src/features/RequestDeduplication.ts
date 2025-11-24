import type { RequestConfig, ResponseData } from '../types'
import { generateRequestKey } from '../utils/serializer'

/**
 * 请求去重管理器
 *
 * 使用统一的序列化器生成请求键，避免代码重复
 */
export class RequestDeduplication {
  private pendingRequests = new Map<string, Promise<ResponseData>>()

  /**
   * 生成请求键
   *
   * 使用统一的序列化器
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
    return this.pendingRequests.get(key) as Promise<ResponseData<T>> | undefined
  }

  /**
   * 添加待处理请求
   */
  addPending<T = any>(
    config: RequestConfig,
    promise: Promise<ResponseData<T>>,
  ): Promise<ResponseData<T>> {
    const key = this.generateKey(config)
    this.pendingRequests.set(key, promise as Promise<ResponseData>)

    // 请求完成后删除
    promise.finally(() => {
      this.pendingRequests.delete(key)
    })

    return promise
  }

  /**
   * 执行请求（带去重）
   */
  async execute<T = any>(
    config: RequestConfig,
    executor: () => Promise<ResponseData<T>>,
  ): Promise<ResponseData<T>> {
    // 检查是否有相同的待处理请求
    const pending = this.getPending<T>(config)
    if (pending) {
      return pending
    }

    // 创建新请求
    const promise = executor()
    return this.addPending(config, promise)
  }

  /**
   * 清空所有待处理请求
   */
  clear(): void {
    this.pendingRequests.clear()
  }

  /**
   * 获取待处理请求数量
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }
}
