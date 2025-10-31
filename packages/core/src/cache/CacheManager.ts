import type { CacheConfig, CacheStorage, RequestConfig, ResponseData } from '../types'
import { MemoryCacheStorage } from './MemoryCacheStorage'

/**
 * 缓存管理器
 */
export class CacheManager {
  private storage: CacheStorage
  private config: CacheConfig

  constructor(config: CacheConfig = {}) {
    this.config = {
      enabled: false,
      ttl: 5 * 60 * 1000, // 默认5分钟
      ...config,
    }
    this.storage = config.storage || new MemoryCacheStorage()
  }

  /**
   * 生成缓存键
   */
  private generateKey(config: RequestConfig): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(config)
    }

    // 默认键生成策略
    const { method = 'GET', url = '', params = {}, data } = config
    const paramsStr = JSON.stringify(params)
    const dataStr = data ? JSON.stringify(data) : ''
    return `${method}:${url}:${paramsStr}:${dataStr}`
  }

  /**
   * 获取缓存
   */
  async get<T = any>(config: RequestConfig): Promise<ResponseData<T> | null> {
    if (!this.config.enabled) {
      return null
    }

    const key = this.generateKey(config)
    return await this.storage.get<ResponseData<T>>(key)
  }

  /**
   * 设置缓存
   */
  async set<T = any>(config: RequestConfig, response: ResponseData<T>): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    const key = this.generateKey(config)
    const ttl = config.cache?.ttl || this.config.ttl
    await this.storage.set(key, response, ttl)
  }

  /**
   * 删除缓存
   */
  async delete(config: RequestConfig): Promise<void> {
    const key = this.generateKey(config)
    await this.storage.delete(key)
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    await this.storage.clear()
  }
}
