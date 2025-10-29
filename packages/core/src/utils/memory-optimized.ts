/**
 * HTTP 内存优化工具
 * 
 * 提供内存优化相关的工具函数和类，用于减少内存占用
 * 
 * @author LDesign Team
 */

/**
 * 对象池 - 用于复用对象，减少GC压力
 */
export class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset?: (obj: T) => void
  private maxSize: number

  constructor(factory: () => T, options: { maxSize?: number; reset?: (obj: T) => void } = {}) {
    this.factory = factory
    this.maxSize = options.maxSize || 100
    this.reset = options.reset
  }

  /**
   * 从池中获取对象
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.factory()
  }

  /**
   * 将对象归还到池中
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(obj)
      }
      this.pool.push(obj)
    }
  }

  /**
   * 清空对象池
   */
  clear(): void {
    this.pool = []
  }

  /**
   * 获取当前池大小
   */
  size(): number {
    return this.pool.length
  }
}

/**
 * 弱引用缓存 - 使用 WeakMap 实现自动内存回收
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>()

  set(key: K, value: V): void {
    this.cache.set(key, value)
  }

  get(key: K): V | undefined {
    return this.cache.get(key)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }
}

/**
 * LRU 缓存（内存优化版）
 * 使用 Map 实现，自动淘汰最久未使用的项
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    // 移动到最新位置
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)

    return value
  }

  set(key: K, value: V): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // 如果超过大小限制，删除最旧的项
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * 内存监控器（轻量版）
 */
export class MemoryMonitor {
  private samples: number[] = []
  private maxSamples: number

  constructor(maxSamples = 100) {
    this.maxSamples = maxSamples
  }

  /**
   * 记录内存使用情况
   */
  sample(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)

      this.samples.push(usedMB)

      // 限制样本数量
      if (this.samples.length > this.maxSamples) {
        this.samples.shift()
      }
    }
  }

  /**
   * 获取平均内存使用（MB）
   */
  getAverage(): number {
    if (this.samples.length === 0) return 0
    return Math.round(this.samples.reduce((a, b) => a + b, 0) / this.samples.length)
  }

  /**
   * 获取峰值内存使用（MB）
   */
  getPeak(): number {
    if (this.samples.length === 0) return 0
    return Math.max(...this.samples)
  }

  /**
   * 获取当前内存使用（MB）
   */
  getCurrent(): number {
    if (this.samples.length === 0) return 0
    return this.samples[this.samples.length - 1]
  }

  /**
   * 清空统计数据
   */
  clear(): void {
    this.samples = []
  }
}

/**
 * 响应数据压缩工具（用于缓存）
 */
export class ResponseCompressor {
  /**
   * 压缩响应数据（简单的字符串压缩）
   */
  static compress(data: any): string {
    try {
      const json = JSON.stringify(data)

      // 如果数据较小，不压缩
      if (json.length < 1024) {
        return json
      }

      // 简单的 RLE 压缩（针对重复数据）
      return this.simpleCompress(json)
    } catch {
      return String(data)
    }
  }

  /**
   * 解压缩响应数据
   */
  static decompress(compressed: string): any {
    try {
      // 尝试直接解析（未压缩的情况）
      if (compressed.startsWith('{') || compressed.startsWith('[')) {
        return JSON.parse(compressed)
      }

      // 解压缩
      const json = this.simpleDecompress(compressed)
      return JSON.parse(json)
    } catch {
      return compressed
    }
  }

  /**
   * 简单压缩算法（RLE）
   */
  private static simpleCompress(str: string): string {
    let compressed = ''
    let count = 1

    for (let i = 0; i < str.length; i++) {
      if (str[i] === str[i + 1]) {
        count++
      } else {
        compressed += count > 1 ? `${count}${str[i]}` : str[i]
        count = 1
      }
    }

    return compressed
  }

  /**
   * 简单解压缩算法（RLE）
   */
  private static simpleDecompress(str: string): string {
    let decompressed = ''
    let i = 0

    while (i < str.length) {
      let count = ''

      // 读取数字
      while (i < str.length && /\d/.test(str[i])) {
        count += str[i]
        i++
      }

      // 读取字符
      if (i < str.length) {
        const char = str[i]
        const repeat = count ? parseInt(count, 10) : 1
        decompressed += char.repeat(repeat)
        i++
      }
    }

    return decompressed
  }

  /**
   * 估算压缩后的大小（字节）
   */
  static estimateSize(data: any): number {
    try {
      const json = JSON.stringify(data)
      return new Blob([json]).size
    } catch {
      return 0
    }
  }
}

/**
 * 自动垃圾回收触发器
 */
export class AutoGCTrigger {
  private threshold: number
  private interval: number
  private timer: NodeJS.Timeout | null = null

  constructor(options: { threshold?: number; interval?: number } = {}) {
    this.threshold = options.threshold || 100 // MB
    this.interval = options.interval || 60000 // 60秒
  }

  /**
   * 启动自动GC
   */
  start(): void {
    if (this.timer) return

    this.timer = setInterval(() => {
      this.checkAndTriggerGC()
    }, this.interval)
  }

  /**
   * 停止自动GC
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * 检查并触发GC
   */
  private checkAndTriggerGC(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      const usedMB = memory.usedJSHeapSize / 1024 / 1024

      // 如果超过阈值，尝试触发GC
      if (usedMB > this.threshold) {
        this.triggerGC()
      }
    }
  }

  /**
   * 触发垃圾回收（如果可用）
   */
  private triggerGC(): void {
    // 浏览器环境下无法直接触发GC
    // 但可以通过清理大对象来帮助GC
    if (typeof global !== 'undefined' && (global as any).gc) {
      try {
        (global as any).gc()
      } catch (e) {
        // GC not available
      }
    }
  }
}

/**
 * 创建优化的缓存键
 * 使用更短的键减少内存占用
 */
export function createOptimizedCacheKey(config: any): string {
  const { method = 'GET', url = '', params, data } = config

  // 使用简短的格式
  const parts: string[] = [
    method.slice(0, 1), // 只取第一个字母
    url,
  ]

  if (params) {
    // 排序参数键，确保一致性
    const sortedParams = Object.keys(params).sort()
    parts.push(sortedParams.map(k => `${k}=${params[k]}`).join('&'))
  }

  if (data) {
    // 对于大数据，使用哈希值
    const dataStr = JSON.stringify(data)
    if (dataStr.length > 100) {
      parts.push(String(simpleHash(dataStr)))
    } else {
      parts.push(dataStr)
    }
  }

  return parts.join('|')
}

/**
 * 简单哈希函数
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

/**
 * 内存优化配置
 */
export interface MemoryOptimizationConfig {
  /**
   * 是否启用对象池
   */
  objectPooling?: boolean

  /**
   * 是否启用响应压缩
   */
  responseCompression?: boolean

  /**
   * 是否启用自动GC
   */
  autoGC?: boolean

  /**
   * GC阈值（MB）
   */
  gcThreshold?: number

  /**
   * GC间隔（毫秒）
   */
  gcInterval?: number

  /**
   * 缓存大小限制
   */
  cacheSize?: number
}

/**
 * 应用内存优化配置
 */
export function applyMemoryOptimizations(config: MemoryOptimizationConfig = {}) {
  const {
    objectPooling = true,
    responseCompression = true,
    autoGC = true,
    gcThreshold = 100,
    gcInterval = 60000,
    cacheSize = 100,
  } = config

  const optimizations = {
    objectPool: objectPooling ? new ObjectPool(() => ({}), { maxSize: 50 }) : null,
    lruCache: new LRUCache(cacheSize),
    memoryMonitor: new MemoryMonitor(100),
    gcTrigger: autoGC ? new AutoGCTrigger({ threshold: gcThreshold, interval: gcInterval }) : null,
  }

  // 启动自动GC
  if (optimizations.gcTrigger) {
    optimizations.gcTrigger.start()
  }

  // 定期采样内存
  setInterval(() => {
    optimizations.memoryMonitor.sample()
  }, 10000)

  return optimizations
}

export default {
  ObjectPool,
  WeakCache,
  LRUCache,
  MemoryMonitor,
  ResponseCompressor,
  AutoGCTrigger,
  createOptimizedCacheKey,
  applyMemoryOptimizations,
}

