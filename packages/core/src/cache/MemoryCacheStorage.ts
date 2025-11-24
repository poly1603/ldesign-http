import type { CacheStorage } from '../types'

interface CacheEntry<T = unknown> {
  value: T
  expiry: number
  accessTime: number  // 最后访问时间，用于 LRU
}

/**
 * 内存缓存存储配置
 */
export interface MemoryCacheStorageConfig {
  /** 最大缓存项数量，默认 100 */
  maxSize?: number
  /** 是否启用 LRU 淘汰策略，默认 true */
  enableLRU?: boolean
}

/**
 * 内存缓存存储（LRU 实现）
 *
 * 特性：
 * 1. 真正的 LRU（Least Recently Used）淘汰策略
 * 2. 自动过期检查
 * 3. 大小限制，防止内存无限增长
 * 4. O(1) 时间复杂度的 get/set 操作
 *
 * @example
 * ```typescript
 * const storage = new MemoryCacheStorage({ maxSize: 100 })
 * storage.set('key1', 'value1', 60000) // 60秒 TTL
 * const value = storage.get('key1')
 * ```
 */
export class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private enableLRU: boolean

  constructor(config: MemoryCacheStorageConfig = {}) {
    this.maxSize = config.maxSize || 100
    this.enableLRU = config.enableLRU !== false
  }

  /**
   * 获取缓存
   *
   * 如果启用 LRU，会更新访问时间
   */
  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // 检查是否过期
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    // 更新访问时间（LRU）
    if (this.enableLRU) {
      entry.accessTime = Date.now()
      // 重新插入到 Map 末尾（Map 保持插入顺序）
      this.cache.delete(key)
      this.cache.set(key, entry)
    }

    return entry.value as T
  }

  /**
   * 设置缓存
   *
   * 如果缓存已满，会淘汰最少使用的项（LRU）
   */
  set<T = unknown>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    const expiry = Date.now() + ttl
    const accessTime = Date.now()

    // 如果键已存在，先删除（更新位置）
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // 如果缓存已满，淘汰最少使用的项
    else if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, { value, expiry, accessTime })
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

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number
    maxSize: number
    usage: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: this.cache.size / this.maxSize,
    }
  }

  /**
   * 淘汰最少使用的项（LRU）
   *
   * Map 保持插入顺序，第一个元素就是最久未访问的
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return

    // Map 的第一个键就是最久未访问的（因为每次访问都会重新插入到末尾）
    const firstKey = this.cache.keys().next().value
    if (firstKey !== undefined) {
      this.cache.delete(firstKey)
    }
  }

  /**
   * 清理过期的缓存项
   *
   * 可以定期调用此方法清理过期项
   */
  cleanupExpired(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}
