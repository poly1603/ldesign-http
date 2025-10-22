/**
 * 优化的缓存存储实现
 * 
 * 特性：
 * 1. 内存限制和自动清理
 * 2. 大对象自动压缩
 * 3. 紧凑的数据结构
 * 4. LRU 淘汰策略
 */

import type { CacheStorage } from '../types'
import { createCompressor } from './compressor'
import type { Compressor } from './compressor'

/**
 * 优化的缓存项
 */
interface OptimizedCacheItem {
  /** 数据（可能已压缩） */
  data: unknown
  /** 创建时间戳（相对时间，节省空间） */
  timestamp: number
  /** TTL */
  ttl: number
  /** 数据大小（字节） */
  size: number
  /** 是否已压缩 */
  compressed: boolean
  /** 访问次数 */
  accessCount: number
  /** 最后访问时间 */
  lastAccess: number
}

/**
 * 优化的内存缓存配置
 */
export interface OptimizedCacheConfig {
  /**
   * 最大缓存大小（字节）
   */
  maxSize?: number

  /**
   * 最大缓存项数
   */
  maxItems?: number

  /**
   * 压缩阈值（字节），超过此大小的数据会被压缩
   */
  compressionThreshold?: number

  /**
   * 是否启用压缩
   */
  enableCompression?: boolean

  /**
   * 压缩器
   */
  compressor?: Compressor

  /**
   * 清理间隔（毫秒）
   */
  cleanupInterval?: number
}

/**
 * 优化的内存缓存存储
 * 
 * @example
 * ```typescript
 * const storage = new OptimizedMemoryStorage({
 *   maxSize: 50 * 1024 * 1024,  // 50MB
 *   compressionThreshold: 10240,  // 10KB
 *   enableCompression: true
 * })
 * 
 * await storage.set('key', largeData)  // 自动压缩
 * const data = await storage.get('key')  // 自动解压
 * ```
 */
export class OptimizedMemoryStorage implements CacheStorage {
  private cache = new Map<string, OptimizedCacheItem>()
  private config: Required<OptimizedCacheConfig>
  private currentSize = 0 // 当前总大小（字节）
  private cleanupTimer?: NodeJS.Timeout
  private baseTimestamp: number // 基准时间戳

  constructor(config: OptimizedCacheConfig = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxItems: 1000,
      compressionThreshold: 10240, // 10KB
      enableCompression: true,
      compressor: createCompressor('lz'),
      cleanupInterval: 60000, // 1分钟
      ...config,
    }

    this.baseTimestamp = Date.now()
    this.startCleanup()
  }

  /**
   * 获取缓存
   */
  async get(key: string): Promise<unknown> {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 检查是否过期（使用相对时间）
    const now = Date.now() - this.baseTimestamp
    if (now - item.timestamp > item.ttl) {
      this.deleteInternal(key, item)
      return null
    }

    // 更新访问信息
    item.accessCount++
    item.lastAccess = now

    // 解压数据（如果需要）
    if (item.compressed) {
      try {
        return await this.config.compressor.decompress(item.data as string)
      }
      catch {
        // 解压失败，删除缓存项
        this.deleteInternal(key, item)
        return null
      }
    }

    return item.data
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: unknown, ttl = 300000): Promise<void> {
    // 估算数据大小
    const size = this.estimateSize(value)

    // 检查是否需要压缩
    let data = value
    let compressed = false
    let finalSize = size

    if (
      this.config.enableCompression
      && size > this.config.compressionThreshold
    ) {
      try {
        data = await this.config.compressor.compress(value)
        finalSize = this.estimateSize(data)
        compressed = true
      }
      catch {
        // 压缩失败，使用原数据
      }
    }

    // 检查是否超过最大大小
    while (
      this.currentSize + finalSize > this.config.maxSize
      || this.cache.size >= this.config.maxItems
    ) {
      // 淘汰最少使用的项（LRU）
      if (!this.evictLRU()) {
        // 无法淘汰，清空所有缓存
        this.clear()
        break
      }
    }

    // 如果键已存在，先删除旧的
    const existing = this.cache.get(key)
    if (existing) {
      this.currentSize -= existing.size
    }

    // 创建缓存项（使用相对时间戳）
    const now = Date.now() - this.baseTimestamp
    const item: OptimizedCacheItem = {
      data,
      timestamp: now,
      ttl,
      size: finalSize,
      compressed,
      accessCount: 0,
      lastAccess: now,
    }

    this.cache.set(key, item)
    this.currentSize += finalSize
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    const item = this.cache.get(key)
    if (item) {
      this.deleteInternal(key, item)
    }
  }

  /**
   * 内部删除方法
   */
  private deleteInternal(key: string, item: OptimizedCacheItem): void {
    this.cache.delete(key)
    this.currentSize -= item.size
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.currentSize = 0
  }

  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取缓存项数量
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 获取当前内存使用量（字节）
   */
  getMemoryUsage(): number {
    return this.currentSize
  }

  /**
   * 获取统计信息
   */
  getStats() {
    let totalAccessCount = 0
    let compressedCount = 0
    let compressedSize = 0
    let uncompressedSize = 0

    for (const item of this.cache.values()) {
      totalAccessCount += item.accessCount

      if (item.compressed) {
        compressedCount++
        compressedSize += item.size
      }
      else {
        uncompressedSize += item.size
      }
    }

    return {
      totalItems: this.cache.size,
      totalSize: this.currentSize,
      maxSize: this.config.maxSize,
      utilizationRate: this.currentSize / this.config.maxSize,
      compressedItems: compressedCount,
      compressedSize,
      uncompressedSize,
      averageAccessCount: this.cache.size > 0 ? totalAccessCount / this.cache.size : 0,
    }
  }

  /**
   * LRU 淘汰策略
   */
  private evictLRU(): boolean {
    if (this.cache.size === 0) {
      return false
    }

    // 找到最少访问的项（LRU）
    let lruKey: string | null = null
    let lruScore = Infinity

    for (const [key, item] of this.cache.entries()) {
      // LRU 评分：结合访问次数和最后访问时间
      const score = item.accessCount / Math.max(1, (Date.now() - this.baseTimestamp - item.lastAccess) / 1000)

      if (score < lruScore) {
        lruScore = score
        lruKey = key
      }
    }

    if (lruKey) {
      const item = this.cache.get(lruKey)!
      this.deleteInternal(lruKey, item)
      return true
    }

    return false
  }

  /**
   * 估算数据大小（字节）
   */
  private estimateSize(data: unknown): number {
    if (data === null || data === undefined) {
      return 8
    }

    if (typeof data === 'string') {
      // 字符串：每个字符 2 字节（UTF-16）
      return data.length * 2
    }

    if (typeof data === 'number') {
      return 8
    }

    if (typeof data === 'boolean') {
      return 4
    }

    if (data instanceof Blob) {
      return data.size
    }

    if (data instanceof ArrayBuffer) {
      return data.byteLength
    }

    // 对象和数组：使用 JSON.stringify 估算
    try {
      const json = JSON.stringify(data)
      return json.length * 2
    }
    catch {
      // 无法序列化，返回估计值
      return 1024
    }
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired()
    }, this.config.cleanupInterval)

    // Node.js 环境：防止阻止进程退出
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  /**
   * 清理过期项
   */
  private cleanupExpired(): void {
    const now = Date.now() - this.baseTimestamp
    const keysToDelete: string[] = []

    // 收集过期的键
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    }

    // 批量删除
    for (const key of keysToDelete) {
      const item = this.cache.get(key)
      if (item) {
        this.deleteInternal(key, item)
      }
    }
  }

  /**
   * 销毁缓存
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
    this.clear()
  }
}

/**
 * 创建优化的内存存储
 */
export function createOptimizedMemoryStorage(
  config?: OptimizedCacheConfig,
): OptimizedMemoryStorage {
  return new OptimizedMemoryStorage(config)
}

