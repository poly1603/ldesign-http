/**
 * 请求序列化工具模块
 * 提供统一的请求配置序列化和指纹生成功能
 */

import type { RequestConfig } from '../types'

/**
 * 序列化配置选项
 */
export interface SerializerOptions {
  /** 是否包含请求方法，默认 true */
  includeMethod?: boolean
  /** 是否包含 URL，默认 true */
  includeUrl?: boolean
  /** 是否包含查询参数，默认 true */
  includeParams?: boolean
  /** 是否包含请求体，默认 true */
  includeData?: boolean
  /** 是否包含请求头，默认 false */
  includeHeaders?: boolean
  /** 要包含的特定请求头 */
  specificHeaders?: string[]
}

/**
 * 请求序列化器
 *
 * 提供统一的请求配置序列化功能，用于：
 * - 缓存键生成
 * - 请求去重
 * - 请求指纹生成
 *
 * @example
 * ```typescript
 * const serializer = new RequestSerializer()
 * const key = serializer.generateKey(config)
 * const fingerprint = serializer.generateFingerprint(config)
 * ```
 */
export class RequestSerializer {
  private options: Required<Omit<SerializerOptions, 'specificHeaders'>> & Pick<SerializerOptions, 'specificHeaders'>

  constructor(options: SerializerOptions = {}) {
    this.options = {
      includeMethod: options.includeMethod !== false,
      includeUrl: options.includeUrl !== false,
      includeParams: options.includeParams !== false,
      includeData: options.includeData !== false,
      includeHeaders: options.includeHeaders || false,
      specificHeaders: options.specificHeaders,
    }
  }

  /**
   * 生成请求键
   *
   * 用于缓存和去重，格式：`method:url:params:data`
   *
   * @param config - 请求配置
   * @returns 请求键字符串
   *
   * @example
   * ```typescript
   * const key = serializer.generateKey({
   *   method: 'GET',
   *   url: '/api/users',
   *   params: { page: 1 }
   * })
   * // 返回: 'GET:/api/users:{"page":1}:'
   * ```
   */
  generateKey(config: RequestConfig): string {
    const parts: string[] = []

    if (this.options.includeMethod) {
      parts.push(config.method || 'GET')
    }

    if (this.options.includeUrl) {
      parts.push(config.url || '')
    }

    if (this.options.includeParams && config.params) {
      parts.push(this.stringify(config.params))
    }
    else if (this.options.includeParams) {
      parts.push('')
    }

    if (this.options.includeData && config.data) {
      parts.push(this.stringify(config.data))
    }
    else if (this.options.includeData) {
      parts.push('')
    }

    if (this.options.includeHeaders && config.headers) {
      if (this.options.specificHeaders && this.options.specificHeaders.length > 0) {
        // 只包含特定的请求头
        const selectedHeaders: Record<string, unknown> = {}
        for (const header of this.options.specificHeaders) {
          if (config.headers[header] !== undefined) {
            selectedHeaders[header] = config.headers[header]
          }
        }
        parts.push(this.stringify(selectedHeaders))
      }
      else {
        parts.push(this.stringify(config.headers))
      }
    }

    return parts.join(':')
  }

  /**
   * 生成请求指纹（哈希值）
   *
   * 用于快速比较请求是否相同
   *
   * @param config - 请求配置
   * @returns 请求指纹（简单哈希）
   */
  generateFingerprint(config: RequestConfig): string {
    const key = this.generateKey(config)
    return this.simpleHash(key)
  }

  /**
   * 序列化对象为 JSON 字符串
   *
   * @param obj - 要序列化的对象
   * @returns JSON 字符串，失败时返回空字符串
   */
  private stringify(obj: unknown): string {
    try {
      return JSON.stringify(obj)
    }
    catch {
      return ''
    }
  }

  /**
   * 简单哈希函数（DJB2 算法）
   *
   * @param str - 要哈希的字符串
   * @returns 哈希值（十六进制字符串）
   */
  private simpleHash(str: string): string {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i)
    }
    return (hash >>> 0).toString(16)
  }
}

/**
 * 默认序列化器实例
 */
export const defaultSerializer = new RequestSerializer()

/**
 * 生成请求键（快捷函数）
 *
 * @param config - 请求配置
 * @returns 请求键字符串
 */
export function generateRequestKey(config: RequestConfig): string {
  return defaultSerializer.generateKey(config)
}

/**
 * 生成请求指纹（快捷函数）
 *
 * @param config - 请求配置
 * @returns 请求指纹
 */
export function generateRequestFingerprint(config: RequestConfig): string {
  return defaultSerializer.generateFingerprint(config)
}

