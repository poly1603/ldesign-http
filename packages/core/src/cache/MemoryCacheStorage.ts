import type { CacheStorage } from '../types'

interface CacheEntry<T = any> {
  value: T
  expiry: number
}

/**
 * 内存缓存存储
 */
export class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, CacheEntry>()

  /**
   * 获取缓存
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // 检查是否过期
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * 设置缓存
   */
  set<T = any>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    const expiry = Date.now() + ttl
    this.cache.set(key, { value, expiry })
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }
}
