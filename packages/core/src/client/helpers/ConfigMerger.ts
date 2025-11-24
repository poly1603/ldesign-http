import type { HttpClientConfig, RequestConfig } from '../../types'

/**
 * 配置合并器
 *
 * 负责合并默认配置和请求配置，提供优化的配置合并策略。
 *
 * 优化策略：
 * - 只对 headers 和 params 进行深度合并
 * - 其他字段使用浅合并，性能更好
 * - 空配置快速返回
 *
 * @example
 * ```typescript
 * const merger = new ConfigMerger(defaultConfig)
 * const merged = merger.merge(requestConfig)
 * ```
 */
export class ConfigMerger {
  /**
   * @param defaultConfig - 默认配置
   */
  constructor(private defaultConfig: HttpClientConfig) {}

  /**
   * 合并默认配置和请求配置（优化版）
   *
   * 性能优化：
   * 1. 空配置快速返回
   * 2. 只对 headers 和 params 进行深度合并
   * 3. 其他字段浅合并，性能更好
   *
   * @param config - 请求配置
   * @returns 合并后的配置
   *
   * @example
   * ```typescript
   * const merged = merger.merge({
   *   url: '/api/users',
   *   headers: { 'X-Custom': 'value' }
   * })
   * ```
   */
  merge(config: RequestConfig): RequestConfig {
    // 如果请求配置为空，直接返回默认配置副本
    if (!config || Object.keys(config).length === 0) {
      return { ...this.defaultConfig }
    }

    // 直接创建新对象（现代JS引擎优化很好）
    const merged: RequestConfig = { ...this.defaultConfig, ...config }

    // 只有在两者都有 headers 时才进行深度合并
    if (this.defaultConfig?.headers && config.headers) {
      merged.headers = { ...this.defaultConfig.headers, ...config.headers }
    }

    // 只有在两者都有 params 时才进行深度合并
    if (this.defaultConfig?.params && config.params) {
      merged.params = { ...this.defaultConfig.params, ...config.params }
    }

    return merged
  }

  /**
   * 快速合并配置（浅合并）
   *
   * 用于快速路径，只进行浅合并，性能最优。
   *
   * @param config - 请求配置
   * @returns 合并后的配置
   *
   * @example
   * ```typescript
   * const merged = merger.fastMerge({ url: '/api/users' })
   * ```
   */
  fastMerge(config: RequestConfig): RequestConfig {
    return { ...this.defaultConfig, ...config }
  }

  /**
   * 更新默认配置
   *
   * @param config - 新的默认配置
   *
   * @example
   * ```typescript
   * merger.updateDefault({ timeout: 5000 })
   * ```
   */
  updateDefault(config: HttpClientConfig): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }
  }

  /**
   * 获取当前默认配置
   *
   * @returns 默认配置的副本
   */
  getDefault(): HttpClientConfig {
    return { ...this.defaultConfig }
  }
}

