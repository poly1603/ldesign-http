import type { CacheStorage } from '../types'

interface CacheEntry<T = unknown> {
  value: T
  expiry: number
  metadata?: Record<string, any>
  tags?: string[]
}

interface CacheSetOptions {
  /** 过期时间（毫秒） */
  ttl?: number
  /** 标签 */
  tags?: string[]
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * LocalStorage 缓存存储配置
 */
export interface LocalStorageCacheStorageConfig {
  /** 缓存键前缀，默认 'http_cache_' */
  prefix?: string
  /** 最大缓存大小（字节），默认 5MB */
  maxSize?: number
  /** 是否启用压缩（对于大数据），默认 false */
  enableCompression?: boolean
  /** 序列化函数 */
  serializer?: (value: any) => string
  /** 反序列化函数 */
  deserializer?: (value: string) => any
}

/**
 * LocalStorage 持久化缓存存储
 *
 * 特性：
 * 1. 使用 localStorage 实现持久化缓存
 * 2. 自动过期检查
 * 3. 大小限制，防止超出 localStorage 限额
 * 4. 支持序列化/反序列化
 * 5. 支持标签和元数据
 * 6. 自动清理过期项
 *
 * 注意事项：
 * - localStorage 有容量限制（通常 5-10MB）
 * - 仅支持浏览器环境
 * - 数据以字符串形式存储
 *
 * @example
 * ```typescript
 * const storage = new LocalStorageCacheStorage({ prefix: 'myapp_' })
 * await storage.set('key1', { data: 'value' }, { ttl: 60000 })
 * const value = await storage.get('key1')
 * ```
 */
export class LocalStorageCacheStorage implements CacheStorage {
  private prefix: string
  private maxSize: number
  private enableCompression: boolean
  private serializer: (value: any) => string
  private deserializer: (value: string) => any

  constructor(config: LocalStorageCacheStorageConfig = {}) {
    this.prefix = config.prefix || 'http_cache_'
    this.maxSize = config.maxSize || 5 * 1024 * 1024 // 5MB
    this.enableCompression = config.enableCompression || false
    this.serializer = config.serializer || JSON.stringify
    this.deserializer = config.deserializer || JSON.parse

    // 检查 localStorage 是否可用
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage is not available, cache will not persist')
    }

    // 初始化时清理过期项
    this.cleanupExpired()
  }

  /**
   * 检查 localStorage 是否可用
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    }
    catch {
      return false
    }
  }

  /**
   * 生成完整的缓存键
   */
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`
  }

  /**
   * 获取缓存
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isLocalStorageAvailable()) {
      return null
    }

    try {
      const fullKey = this.getFullKey(key)
      const data = localStorage.getItem(fullKey)

      if (!data) {
        return null
      }

      const entry: CacheEntry<T> = this.deserializer(data)

      // 检查是否过期
      if (Date.now() > entry.expiry) {
        this.delete(key)
        return null
      }

      return entry.value
    }
    catch (error) {
      console.error('Failed to get cache from localStorage:', error)
      return null
    }
  }

  /**
   * 设置缓存
   */
  async set<T = any>(key: string, value: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    if (!this.isLocalStorageAvailable()) {
      return
    }

    try {
      const expiry = Date.now() + ttl

      const entry: CacheEntry<T> = {
        value,
        expiry,
      }

      const serialized = this.serializer(entry)

      // 检查大小限制
      if (this.getCurrentSize() + serialized.length > this.maxSize) {
        // 尝试清理过期项
        this.cleanupExpired()

        // 如果还是超出限制，清理最旧的项
        if (this.getCurrentSize() + serialized.length > this.maxSize) {
          this.evictOldest()
        }
      }

      const fullKey = this.getFullKey(key)
      localStorage.setItem(fullKey, serialized)
    }
    catch (error) {
      // 如果 localStorage 满了，尝试清理
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupExpired()
        this.evictOldest()

        // 重试一次
        try {
          const expiry = Date.now() + ttl
          const entry: CacheEntry<T> = { value, expiry }
          const fullKey = this.getFullKey(key)
          localStorage.setItem(fullKey, this.serializer(entry))
        }
        catch {
          console.error('Failed to set cache to localStorage: quota exceeded')
        }
      }
      else {
        console.error('Failed to set cache to localStorage:', error)
      }
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    if (!this.isLocalStorageAvailable()) {
      return
    }

    try {
      const fullKey = this.getFullKey(key)
      localStorage.removeItem(fullKey)
    }
    catch (error) {
      console.error('Failed to delete cache from localStorage:', error)
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    if (!this.isLocalStorageAvailable()) {
      return
    }

    try {
      const keys = this.keys()
      for (const key of keys) {
        await this.delete(key)
      }
    }
    catch (error) {
      console.error('Failed to clear cache from localStorage:', error)
    }
  }

  /**
   * 检查缓存是否存在
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  }

  /**
   * 获取所有缓存键（不包含前缀）
   */
  keys(): string[] {
    if (!this.isLocalStorageAvailable()) {
      return []
    }

    const keys: string[] = []
    const prefixLength = this.prefix.length

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.slice(prefixLength))
      }
    }

    return keys
  }

  /**
   * 获取缓存数量
   */
  size(): number {
    return this.keys().length
  }

  /**
   * 获取当前缓存占用大小（字节）
   */
  private getCurrentSize(): number {
    let size = 0
    const keys = this.keys()

    for (const key of keys) {
      const fullKey = this.getFullKey(key)
      const data = localStorage.getItem(fullKey)
      if (data) {
        size += data.length
      }
    }

    return size
  }

  /**
   * 清理过期的缓存项
   */
  private cleanupExpired(): number {
    if (!this.isLocalStorageAvailable()) {
      return 0
    }

    const now = Date.now()
    let cleaned = 0
    const keys = this.keys()

    for (const key of keys) {
      const fullKey = this.getFullKey(key)
      const data = localStorage.getItem(fullKey)

      if (data) {
        try {
          const entry: CacheEntry = this.deserializer(data)
          if (now > entry.expiry) {
            localStorage.removeItem(fullKey)
            cleaned++
          }
        }
        catch {
          // 如果解析失败，删除该项
          localStorage.removeItem(fullKey)
          cleaned++
        }
      }
    }

    return cleaned
  }

  /**
   * 淘汰最旧的缓存项
   */
  private evictOldest(): void {
    if (!this.isLocalStorageAvailable()) {
      return
    }

    const keys = this.keys()
    if (keys.length === 0) {
      return
    }

    let oldestKey: string | null = null
    let oldestExpiry = Infinity

    for (const key of keys) {
      const fullKey = this.getFullKey(key)
      const data = localStorage.getItem(fullKey)

      if (data) {
        try {
          const entry: CacheEntry = this.deserializer(data)
          if (entry.expiry < oldestExpiry) {
            oldestExpiry = entry.expiry
            oldestKey = key
          }
        }
        catch {
          // 如果解析失败，直接删除
          localStorage.removeItem(fullKey)
          return
        }
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  /**
   * 根据标签删除缓存
   */
  async deleteByTag(tag: string): Promise<number> {
    if (!this.isLocalStorageAvailable()) {
      return 0
    }

    let deleted = 0
    const keys = this.keys()

    for (const key of keys) {
      const fullKey = this.getFullKey(key)
      const data = localStorage.getItem(fullKey)

      if (data) {
        try {
          const entry: CacheEntry = this.deserializer(data)
          if (entry.tags?.includes(tag)) {
            await this.delete(key)
            deleted++
          }
        }
        catch {
          // 忽略解析错误
        }
      }
    }

    return deleted
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number
    currentSize: number
    maxSize: number
    usage: number
  } {
    const currentSize = this.getCurrentSize()
    return {
      size: this.size(),
      currentSize,
      maxSize: this.maxSize,
      usage: currentSize / this.maxSize,
    }
  }
}