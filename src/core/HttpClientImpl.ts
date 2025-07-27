/**
 * HTTP客户端具体实现
 * 支持多种适配器的HTTP客户端
 */

import { createFetchAdapter, isFetchSupported } from '../adapters/FetchAdapter'
import { createAxiosAdapter, isAxiosSupported } from '../adapters/AxiosAdapter'
import { createAlovaAdapter, isAlovaSupported } from '../adapters/AlovaAdapter'
import type {
  AdapterFactory,
  HttpAdapter,
  HttpClientConfig,
} from '../types'
import { BaseHttpClient } from './HttpClient'

/**
 * 适配器工厂实现
 */
class HttpAdapterFactory implements AdapterFactory {
  constructor(
    private adapterType: 'fetch' | 'axios' | 'alova',
    private config: HttpClientConfig,
  ) {}

  create(config: HttpClientConfig): HttpAdapter {
    switch (this.adapterType) {
      case 'fetch':
        return createFetchAdapter()
      case 'axios':
        return createAxiosAdapter(config)
      case 'alova':
        return createAlovaAdapter(config)
      default:
        throw new Error(`Unsupported adapter type: ${this.adapterType}`)
    }
  }

  getName(): string {
    return this.adapterType
  }

  isSupported(): boolean {
    switch (this.adapterType) {
      case 'fetch':
        return isFetchSupported()
      case 'axios':
        return isAxiosSupported()
      case 'alova':
        return isAlovaSupported()
      default:
        return false
    }
  }
}

/**
 * HTTP客户端实现类
 */
export class HttpClient extends BaseHttpClient {
  constructor(config: HttpClientConfig = {}) {
    super(config)
  }

  /**
   * 创建适配器实例
   */
  protected createAdapter(): HttpAdapter {
    // 如果提供了自定义适配器，直接使用
    if (this.config.customAdapter) {
      return this.config.customAdapter
    }

    const adapterType = this.config.adapter || 'fetch'
    const factory = new HttpAdapterFactory(adapterType, this.config)

    // 检查适配器是否支持
    if (!factory.isSupported()) {
      // 如果指定的适配器不支持，尝试使用备用适配器
      const fallbackAdapters: Array<'fetch' | 'axios' | 'alova'> = ['fetch', 'axios', 'alova']

      for (const fallback of fallbackAdapters) {
        if (fallback !== adapterType) {
          const fallbackFactory = new HttpAdapterFactory(fallback, this.config)
          if (fallbackFactory.isSupported()) {
            console.warn(`Adapter '${adapterType}' is not supported, falling back to '${fallback}'`)
            return fallbackFactory.create(this.config)
          }
        }
      }

      throw new Error(`No supported HTTP adapter found. Please ensure at least one of fetch, axios, or alova is available.`)
    }

    return factory.create(this.config)
  }

  /**
   * 切换适配器
   */
  switchAdapter(adapterType: 'fetch' | 'axios' | 'alova' | HttpAdapter): void {
    if (typeof adapterType === 'string') {
      const factory = new HttpAdapterFactory(adapterType, this.config)
      if (!factory.isSupported()) {
        throw new Error(`Adapter '${adapterType}' is not supported`)
      }
      this.adapter = factory.create(this.config)
      this.config.adapter = adapterType
    }
 else {
      this.adapter = adapterType
      this.config.customAdapter = adapterType
    }
  }

  /**
   * 获取当前适配器信息
   */
  getAdapterInfo(): { name: string, isCustom: boolean } {
    return {
      name: this.adapter.getName(),
      isCustom: !!this.config.customAdapter,
    }
  }

  /**
   * 检查适配器是否支持
   */
  static isAdapterSupported(adapterType: 'fetch' | 'axios' | 'alova'): boolean {
    switch (adapterType) {
      case 'fetch':
        return isFetchSupported()
      case 'axios':
        return isAxiosSupported()
      case 'alova':
        return isAlovaSupported()
      default:
        return false
    }
  }

  /**
   * 获取所有支持的适配器
   */
  static getSupportedAdapters(): Array<'fetch' | 'axios' | 'alova'> {
    const adapters: Array<'fetch' | 'axios' | 'alova'> = []

    if (isFetchSupported())
adapters.push('fetch')
    if (isAxiosSupported())
adapters.push('axios')
    if (isAlovaSupported())
adapters.push('alova')

    return adapters
  }

  /**
   * 创建新的HTTP客户端实例
   */
  static create(config: HttpClientConfig = {}): HttpClient {
    return new HttpClient(config)
  }

  /**
   * 创建带有指定适配器的HTTP客户端实例
   */
  static createWithAdapter(
    adapterType: 'fetch' | 'axios' | 'alova',
    config: HttpClientConfig = {},
  ): HttpClient {
    return new HttpClient({
      ...config,
      adapter: adapterType,
    })
  }

  /**
   * 创建带有自定义适配器的HTTP客户端实例
   */
  static createWithCustomAdapter(
    adapter: HttpAdapter,
    config: HttpClientConfig = {},
  ): HttpClient {
    return new HttpClient({
      ...config,
      customAdapter: adapter,
    })
  }
}

/**
 * 创建默认的HTTP客户端实例
 */
export function createHttpClient(config: HttpClientConfig = {}): HttpClient {
  return HttpClient.create(config)
}

/**
 * 创建Fetch HTTP客户端实例
 */
export function createFetchHttpClient(config: HttpClientConfig = {}): HttpClient {
  return HttpClient.createWithAdapter('fetch', config)
}

/**
 * 创建Axios HTTP客户端实例
 */
export function createAxiosHttpClient(config: HttpClientConfig = {}): HttpClient {
  return HttpClient.createWithAdapter('axios', config)
}

/**
 * 创建Alova HTTP客户端实例
 */
export function createAlovaHttpClient(config: HttpClientConfig = {}): HttpClient {
  return HttpClient.createWithAdapter('alova', config)
}
