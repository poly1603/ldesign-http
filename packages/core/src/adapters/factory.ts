/**
 * 适配器工厂 - 支持动态导入以优化包体积
 * 
 * 优化点：
 * 1. 延迟加载适配器，只在实际使用时导入
 * 2. 减少初始包体积，提升首屏加载速度
 * 3. 缓存已加载的适配器实例
 */

import type { HttpAdapter } from '../types'

/**
 * 适配器加载器类型
 */
type AdapterLoader = () => Promise<{ default?: HttpAdapter } | HttpAdapter>

/**
 * 适配器工厂类（优化版 - 支持动态导入）
 */
export class AdapterFactory {
  // 已加载的适配器缓存
  private static adapterCache = new Map<string, HttpAdapter>()

  // 可用性检查缓存
  private static availabilityCache = new Map<string, boolean>()

  // 适配器加载器映射
  private static loaders = new Map<string, AdapterLoader>([
    ['fetch', async () => {
      const { FetchAdapter } = await import('./fetch')
      return new FetchAdapter()
    }],
    ['axios', async () => {
      const { AxiosAdapter } = await import('./axios')
      return new AxiosAdapter()
    }],
    ['alova', async () => {
      const { AlovaAdapter } = await import('./alova')
      return new AlovaAdapter()
    }],
  ])

  /**
   * 注册自定义适配器加载器
   */
  static register(name: string, loader: AdapterLoader): void {
    this.loaders.set(name, loader)
    // 清除相关缓存
    this.availabilityCache.delete(name)
  }

  /**
   * 创建适配器（异步，支持动态导入）
   */
  static async create(name: string): Promise<HttpAdapter> {
    // 检查缓存
    if (this.adapterCache.has(name)) {
      return this.adapterCache.get(name)!
    }

    const loader = this.loaders.get(name)
    if (!loader) {
      throw new Error(`Unknown adapter: ${name}`)
    }

    try {
      // 动态加载适配器
      const result = await loader()
      const adapter: HttpAdapter = 'default' in result ? result.default! : result

      // 验证适配器是否可用
      if (!adapter.isSupported()) {
        throw new Error(
          `Adapter '${name}' is not supported in current environment`,
        )
      }

      // 缓存适配器实例
      this.adapterCache.set(name, adapter)
      return adapter
    }
    catch (error) {
      throw new Error(
        `Failed to load adapter '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * 同步创建适配器（需要提前加载）
   * 如果适配器未加载，将抛出错误
   */
  static createSync(name: string): HttpAdapter {
    const cached = this.adapterCache.get(name)
    if (!cached) {
      throw new Error(
        `Adapter '${name}' not loaded. Use create() or preload() first.`,
      )
    }
    return cached
  }

  /**
   * 预加载适配器（用于优化首次使用）
   */
  static async preload(names: string[]): Promise<void> {
    const tasks = names.map(name => this.create(name).catch(() => {
      // 忽略加载失败的适配器
    }))
    await Promise.all(tasks)
  }

  /**
   * 检查适配器是否可用（异步）
   */
  static async isAvailable(name: string): Promise<boolean> {
    // 检查缓存
    if (this.availabilityCache.has(name)) {
      return this.availabilityCache.get(name)!
    }

    try {
      const adapter = await this.create(name)
      const isSupported = adapter.isSupported()
      this.availabilityCache.set(name, isSupported)
      return isSupported
    }
    catch {
      this.availabilityCache.set(name, false)
      return false
    }
  }

  /**
   * 获取所有可用的适配器（异步）
   */
  static async getAvailable(): Promise<string[]> {
    const names = Array.from(this.loaders.keys())
    const results = await Promise.all(
      names.map(async name => ({
        name,
        available: await this.isAvailable(name),
      })),
    )

    return results
      .filter(r => r.available)
      .map(r => r.name)
  }

  /**
   * 获取默认适配器（异步）
   */
  static async getDefault(): Promise<HttpAdapter> {
    const available = await this.getAvailable()

    if (available.length === 0) {
      throw new Error('No available HTTP adapter found')
    }

    // 优先级：fetch > axios > alova
    const priority = ['fetch', 'axios', 'alova']

    for (const name of priority) {
      if (available.includes(name)) {
        return this.create(name)
      }
    }

    // 如果没有找到优先的适配器，使用第一个可用的
    return this.create(available[0]!)
  }

  /**
   * 同步获取默认适配器（需要提前加载）
   */
  static getDefaultSync(): HttpAdapter {
    // 优先级：fetch > axios > alova
    const priority = ['fetch', 'axios', 'alova']

    for (const name of priority) {
      if (this.adapterCache.has(name)) {
        return this.adapterCache.get(name)!
      }
    }

    throw new Error(
      'No adapter loaded. Use preload() or create() before calling getDefaultSync().',
    )
  }

  /**
   * 检测浏览器环境，返回推荐的适配器名称
   */
  static detectBestAdapter(): string {
    // 浏览器环境优先使用 fetch
    if (typeof window !== 'undefined' && 'fetch' in window) {
      return 'fetch'
    }

    // Node.js 环境优先使用 axios
    if (typeof process !== 'undefined' && process.versions?.node) {
      return 'axios'
    }

    // 默认 fetch
    return 'fetch'
  }

  /**
   * 获取所有注册的适配器名称
   */
  static getRegistered(): string[] {
    return Array.from(this.loaders.keys())
  }

  /**
   * 清理缓存（用于测试或重置）
   */
  static clearCache(): void {
    this.adapterCache.clear()
    this.availabilityCache.clear()
  }
}

/**
 * 创建 HTTP 适配器（异步版本）
 */
export async function createAdapter(
  adapter?: string | HttpAdapter,
): Promise<HttpAdapter> {
  // 如果已经是适配器实例，直接返回
  if (
    adapter
    && typeof adapter === 'object'
    && 'request' in adapter
    && 'isSupported' in adapter
  ) {
    return adapter
  }

  // 如果指定了适配器名称
  if (typeof adapter === 'string') {
    return AdapterFactory.create(adapter)
  }

  // 使用默认适配器
  return AdapterFactory.getDefault()
}

/**
 * 创建 HTTP 适配器（同步版本，需要提前加载）
 */
export function createAdapterSync(
  adapter?: string | HttpAdapter,
): HttpAdapter {
  // 如果已经是适配器实例，直接返回
  if (
    adapter
    && typeof adapter === 'object'
    && 'request' in adapter
    && 'isSupported' in adapter
  ) {
    return adapter
  }

  // 如果指定了适配器名称
  if (typeof adapter === 'string') {
    return AdapterFactory.createSync(adapter)
  }

  // 使用默认适配器
  return AdapterFactory.getDefaultSync()
}

/**
 * 检查适配器是否可用
 */
export async function isAdapterAvailable(name: string): Promise<boolean> {
  return AdapterFactory.isAvailable(name)
}

/**
 * 预加载适配器（建议在应用启动时调用）
 */
export async function preloadAdapters(names?: string[]): Promise<void> {
  const adaptersToLoad = names || ['fetch'] // 默认预加载 fetch
  await AdapterFactory.preload(adaptersToLoad)
}


