import type { CacheStorage } from '../types'

interface CacheEntry<T = unknown> {
  key: string
  value: T
  expiry: number
  createdAt: number
}

/**
 * IndexedDB 缓存存储配置
 */
export interface IndexedDBCacheStorageConfig {
  /** 数据库名称，默认 'http_cache_db' */
  dbName?: string
  /** 存储名称，默认 'cache_store' */
  storeName?: string
  /** 数据库版本，默认 1 */
  version?: number
  /** 最大缓存项数量，默认 1000 */
  maxItems?: number
}

/**
 * IndexedDB 持久化缓存存储
 *
 * 特性：
 * 1. 使用 IndexedDB 实现大容量持久化缓存
 * 2. 支持异步操作
 * 3. 自动过期检查
 * 4. 支持索引查询
 * 5. 容量限制，防止数据库过大
 * 6. 跨标签页共享缓存
 *
 * 优势：
 * - 比 localStorage 容量更大（通常 50MB+）
 * - 支持结构化数据存储
 * - 异步操作，不阻塞主线程
 * - 支持事务和索引
 *
 * @example
 * ```typescript
 * const storage = new IndexedDBCacheStorage({ dbName: 'myapp_cache' })
 * await storage.init()
 * await storage.set('key1', { data: 'value' }, 60000)
 * const value = await storage.get('key1')
 * ```
 */
export class IndexedDBCacheStorage implements CacheStorage {
  private dbName: string
  private storeName: string
  private version: number
  private maxItems: number
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  constructor(config: IndexedDBCacheStorageConfig = {}) {
    this.dbName = config.dbName || 'http_cache_db'
    this.storeName = config.storeName || 'cache_store'
    this.version = config.version || 1
    this.maxItems = config.maxItems || 1000

    // 自动初始化
    this.initPromise = this.init()
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.db) {
      return
    }

    if (!this.isIndexedDBAvailable()) {
      console.warn('IndexedDB is not available')
      return
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        // 初始化完成后清理过期项
        this.cleanupExpired().catch(console.error)
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 如果存储已存在，先删除
        if (db.objectStoreNames.contains(this.storeName)) {
          db.deleteObjectStore(this.storeName)
        }

        // 创建对象存储
        const store = db.createObjectStore(this.storeName, { keyPath: 'key' })

        // 创建索引
        store.createIndex('expiry', 'expiry', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    })
  }

  /**
   * 检查 IndexedDB 是否可用
   */
  private isIndexedDBAvailable(): boolean {
    try {
      return typeof indexedDB !== 'undefined'
    }
    catch {
      return false
    }
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (this.initPromise) {
      await this.initPromise
    }

    if (!this.db) {
      throw new Error('IndexedDB not initialized')
    }

    return this.db
  }

  /**
   * 获取缓存
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const db = await this.ensureDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)

        request.onsuccess = () => {
          const entry: CacheEntry<T> | undefined = request.result

          if (!entry) {
            resolve(null)
            return
          }

          // 检查是否过期
          if (Date.now() > entry.expiry) {
            this.delete(key).catch(console.error)
            resolve(null)
            return
          }

          resolve(entry.value)
        }
      })
    }
    catch (error) {
      console.error('Failed to get cache from IndexedDB:', error)
      return null
    }
  }

  /**
   * 设置缓存
   */
  async set<T = any>(key: string, value: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    try {
      const db = await this.ensureDB()

      // 检查是否超出最大项数
      const count = await this.size()
      if (count >= this.maxItems) {
        // 清理过期项
        await this.cleanupExpired()

        // 如果还是超出限制，删除最旧的项
        const newCount = await this.size()
        if (newCount >= this.maxItems) {
          await this.evictOldest()
        }
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        expiry: Date.now() + ttl,
        createdAt: Date.now(),
      }

      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(entry)

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    }
    catch (error) {
      console.error('Failed to set cache to IndexedDB:', error)
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      const db = await this.ensureDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    }
    catch (error) {
      console.error('Failed to delete cache from IndexedDB:', error)
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      const db = await this.ensureDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    }
    catch (error) {
      console.error('Failed to clear cache from IndexedDB:', error)
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
   * 获取所有缓存键
   */
  async keys(): Promise<string[]> {
    try {
      const db = await this.ensureDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result as string[])
      })
    }
    catch (error) {
      console.error('Failed to get keys from IndexedDB:', error)
      return []
    }
  }

  /**
   * 获取缓存数量
   */
  async size(): Promise<number> {
    try {
      const db = await this.ensureDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.count()

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })
    }
    catch (error) {
      console.error('Failed to get size from IndexedDB:', error)
      return 0
    }
  }

  /**
   * 清理过期的缓存项
   */
  async cleanupExpired(): Promise<number> {
    try {
      const db = await this.ensureDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('expiry')

      const now = Date.now()
      const range = IDBKeyRange.upperBound(now)
      const request = index.openCursor(range)

      let cleaned = 0

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null

          if (cursor) {
            cursor.delete()
            cleaned++
            cursor.continue()
          }
          else {
            resolve(cleaned)
          }
        }
      })
    }
    catch (error) {
      console.error('Failed to cleanup expired cache from IndexedDB:', error)
      return 0
    }
  }

  /**
   * 淘汰最旧的缓存项
   */
  private async evictOldest(): Promise<void> {
    try {
      const db = await this.ensureDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('createdAt')
      const request = index.openCursor()

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null

          if (cursor) {
            cursor.delete()
            resolve()
          }
          else {
            resolve()
          }
        }
      })
    }
    catch (error) {
      console.error('Failed to evict oldest cache from IndexedDB:', error)
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    size: number
    maxItems: number
    usage: number
    dbName: string
    storeName: string
  }> {
    const size = await this.size()
    return {
      size,
      maxItems: this.maxItems,
      usage: size / this.maxItems,
      dbName: this.dbName,
      storeName: this.storeName,
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /**
   * 删除数据库
   */
  async deleteDatabase(): Promise<void> {
    this.close()

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}