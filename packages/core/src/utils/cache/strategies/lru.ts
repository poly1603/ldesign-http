/**
 * LRU (Least Recently Used) 缓存策略
 * 
 * 最近最少使用算法,当缓存满时移除最久未使用的项
 */

/**
 * LRU缓存实现
 * 
 * @example
 * ```typescript
 * const cache = new LRUCache<string, User>(100)
 * cache.set('user:1', { id: 1, name: 'John' })
 * const user = cache.get('user:1') // 移到最近使用
 * ```
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
    this.cache = new Map()
  }

  /**
   * 获取缓存值
   * 访问时会将该项移到末尾(标记为最近使用)
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    // 获取值并重新插入到末尾(Map保持插入顺序)
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)

    return value
  }

  /**
   * 设置缓存值
   * 如果缓存满,移除最旧的项(第一个)
   */
  set(key: K, value: V): void {
    // 如果key已存在,先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 如果达到容量上限,删除最旧的(第一个)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    // 插入到末尾
    this.cache.set(key, value)
  }

  /**
   * 检查key是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key)
  }

  /**
   * 删除指定key
   */
  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取当前缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 获取所有keys
   */
  keys(): IterableIterator<K> {
    return this.cache.keys()
  }

  /**
   * 获取所有values
   */
  values(): IterableIterator<V> {
    return this.cache.values()
  }

  /**
   * 获取所有entries
   */
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries()
  }

  /**
   * 遍历缓存
   */
  forEach(callback: (value: V, key: K, map: Map<K, V>) => void): void {
    this.cache.forEach(callback)
  }
}

/**
 * 创建LRU缓存实例
 */
export function createLRUCache<K, V>(maxSize: number = 100): LRUCache<K, V> {
  return new LRUCache(maxSize)
}