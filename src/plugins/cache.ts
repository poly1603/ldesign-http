/**
 * 缓存插件
 * 提供请求缓存功能
 */

import type {
  CacheConfig,
  CacheStorage,
  HttpClientInstance,
  HttpPlugin,
  HttpResponse,
  RequestConfig,
} from '../types'

/**
 * 内存缓存存储
 */
export class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, { value: any, expiry: number }>()

  async get(key: string): Promise<any> {
    const item = this.cache.get(key)
    if (!item)
return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  async set(key: string, value: any, ttl = 5 * 60 * 1000): Promise<void> {
    const expiry = Date.now() + ttl
    this.cache.set(key, { value, expiry })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

/**
 * LocalStorage缓存存储
 */
export class LocalStorageCacheStorage implements CacheStorage {
  private prefix: string

  constructor(prefix = 'http_cache_') {
    this.prefix = prefix
  }

  async get(key: string): Promise<any> {
    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item)
return null

      const parsed = JSON.parse(item)
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(this.prefix + key)
        return null
      }

      return parsed.value
    }
 catch {
      return null
    }
  }

  async set(key: string, value: any, ttl = 5 * 60 * 1000): Promise<void> {
    try {
      const expiry = Date.now() + ttl
      const item = { value, expiry }
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    }
 catch (error) {
      console.warn('Failed to set cache in localStorage:', error)
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key)
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }
}

/**
 * SessionStorage缓存存储
 */
export class SessionStorageCacheStorage implements CacheStorage {
  private prefix: string

  constructor(prefix = 'http_cache_') {
    this.prefix = prefix
  }

  async get(key: string): Promise<any> {
    try {
      const item = sessionStorage.getItem(this.prefix + key)
      if (!item)
return null

      const parsed = JSON.parse(item)
      if (Date.now() > parsed.expiry) {
        sessionStorage.removeItem(this.prefix + key)
        return null
      }

      return parsed.value
    }
 catch {
      return null
    }
  }

  async set(key: string, value: any, ttl = 5 * 60 * 1000): Promise<void> {
    try {
      const expiry = Date.now() + ttl
      const item = { value, expiry }
      sessionStorage.setItem(this.prefix + key, JSON.stringify(item))
    }
 catch (error) {
      console.warn('Failed to set cache in sessionStorage:', error)
    }
  }

  async delete(key: string): Promise<void> {
    sessionStorage.removeItem(this.prefix + key)
  }

  async clear(): Promise<void> {
    const keys = Object.keys(sessionStorage)
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key)
      }
    })
  }
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private storage: CacheStorage
  private config: Required<CacheConfig>

  constructor(config: CacheConfig = {}) {
    this.config = {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5分钟
      keyGenerator: this.defaultKeyGenerator,
      storage: new MemoryCacheStorage(),
      ...config,
    }
    this.storage = this.config.storage
  }

  /**
   * 默认缓存键生成器
   */
  private defaultKeyGenerator(config: RequestConfig): string {
    const { url, method = 'GET', params, data } = config
    const key = `${method.toUpperCase()}:${url}`

    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}=${params[k]}`)
        .join('&')
      return `${key}?${sortedParams}`
    }

    if (data && method.toUpperCase() !== 'GET') {
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data)
      return `${key}:${this.hashCode(dataStr)}`
    }

    return key
  }

  /**
   * 简单哈希函数
   */
  private hashCode(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString(36)
  }

  /**
   * 获取缓存
   */
  async get<T>(config: RequestConfig): Promise<HttpResponse<T> | null> {
    if (!this.config.enabled)
return null

    const key = this.config.keyGenerator(config)
    return await this.storage.get(key)
  }

  /**
   * 设置缓存
   */
  async set<T>(config: RequestConfig, response: HttpResponse<T>): Promise<void> {
    if (!this.config.enabled)
return

    const key = this.config.keyGenerator(config)
    await this.storage.set(key, response, this.config.ttl)
  }

  /**
   * 删除缓存
   */
  async delete(config: RequestConfig): Promise<void> {
    const key = this.config.keyGenerator(config)
    await this.storage.delete(key)
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    await this.storage.clear()
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config }
    if (config.storage) {
      this.storage = config.storage
    }
  }

  /**
   * 获取配置
   */
  getConfig(): Required<CacheConfig> {
    return { ...this.config }
  }
}

/**
 * 缓存插件
 */
export function createCachePlugin(config: CacheConfig = {}): HttpPlugin {
  return {
    name: 'cache',
    install(client: HttpClientInstance) {
      const cacheManager = new CacheManager(config)

      // 添加请求拦截器检查缓存
      client.addRequestInterceptor({
        onFulfilled: async (requestConfig) => {
          // 只缓存GET请求
          if (requestConfig.method?.toUpperCase() === 'GET') {
            const cached = await cacheManager.get(requestConfig)
            if (cached) {
              // 直接返回缓存的响应
              throw { __cached: true, response: cached }
            }
          }
          return requestConfig
        },
      })

      // 添加响应拦截器设置缓存
      client.addResponseInterceptor({
        onFulfilled: async (response) => {
          // 只缓存成功的GET请求
          if (response.config.method?.toUpperCase() === 'GET' && response.status >= 200 && response.status < 300) {
            await cacheManager.set(response.config, response)
          }
          return response
        },
        onRejected: (error) => {
          // 处理缓存命中的情况
          if (error.__cached) {
            return Promise.resolve(error.response)
          }
          return Promise.reject(error)
        },
      })

      // 扩展客户端方法
      ;(client as any).cache = {
        clear: () => cacheManager.clear(),
        delete: (config: RequestConfig) => cacheManager.delete(config),
        updateConfig: (newConfig: Partial<CacheConfig>) => cacheManager.updateConfig(newConfig),
        getConfig: () => cacheManager.getConfig(),
      }
    },
  }
}

/**
 * 创建内存缓存存储
 */
export function createMemoryCache(): MemoryCacheStorage {
  return new MemoryCacheStorage()
}

/**
 * 创建LocalStorage缓存存储
 */
export function createLocalStorageCache(prefix?: string): LocalStorageCacheStorage {
  return new LocalStorageCacheStorage(prefix)
}

/**
 * 创建SessionStorage缓存存储
 */
export function createSessionStorageCache(prefix?: string): SessionStorageCacheStorage {
  return new SessionStorageCacheStorage(prefix)
}
