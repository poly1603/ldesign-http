/**
 * @ldesign/http 预设配置
 * 
 * 提供开箱即用的配置预设，适用于不同场景
 * 
 * @example
 * ```typescript
 * import { createHttpClient, presets } from '@ldesign/http'
 * 
 * // 使用 REST API 预设
 * const client = await createHttpClient(presets.restful)
 * 
 * // 或者基于预设进行自定义
 * const client = await createHttpClient({
 *   ...presets.restful,
 *   baseURL: 'https://api.example.com',
 *   timeout: 15000
 * })
 * ```
 */

import type { HttpClientConfig } from '../types'

/**
 * REST API 预设（推荐）
 * 
 * 适用于传统的 RESTful API 应用
 * 特点：
 * - 启用智能缓存（5分钟）
 * - 自动重试（3次，指数退避）
 * - 请求去重
 * - 性能监控
 */
export const restful: HttpClientConfig = {
  timeout: 10000,
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5分钟
  },
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      // 只重试网络错误和 5xx 错误
      return Boolean(
        error.isNetworkError
        || (error.status && error.status >= 500),
      )
    },
  },
  concurrency: {
    maxConcurrent: 10,
    deduplication: true,
  },
  monitor: {
    enabled: true,
    slowRequestThreshold: 3000,
  },
}

/**
 * GraphQL 预设
 * 
 * 适用于 GraphQL API
 * 特点：
 * - 启用智能缓存（标准化缓存策略）
 * - 少量重试（GraphQL 通常在应用层处理）
 * - 强制请求去重（GraphQL 查询容易重复）
 * - 批量请求支持
 */
export const graphql: HttpClientConfig = {
  timeout: 15000,
  cache: {
    enabled: true,
    ttl: 10 * 60 * 1000, // 10分钟
  },
  retry: {
    retries: 1, // GraphQL 通常在应用层处理重试
    retryDelay: 500,
  },
  concurrency: {
    maxConcurrent: 6,
    deduplication: true, // 强制去重
  },
  monitor: {
    enabled: true,
  },
}

/**
 * 实时应用预设
 * 
 * 适用于需要实时数据的应用（配合 WebSocket/SSE）
 * 特点：
 * - 禁用缓存（实时数据）
 * - 积极重试（5次）
 * - Keep-Alive 连接
 * - 更长的超时时间
 */
export const realtime: HttpClientConfig = {
  timeout: 30000, // 更长的超时
  cache: {
    enabled: false, // 禁用缓存
  },
  retry: {
    retries: 5,
    retryDelay: 2000,
    retryCondition: (error) => {
      // 实时应用需要更积极的重试
      return Boolean(
        error.isNetworkError
        || error.isTimeoutError
        || (error.status && error.status >= 500),
      )
    },
  },
  concurrency: {
    maxConcurrent: 20, // 更高的并发
  },
  connectionPool: {
    keepAlive: true,
    maxConnections: 20,
  },
}

/**
 * 低功耗模式预设
 * 
 * 适用于移动设备或需要节省资源的场景
 * 特点：
 * - 积极的缓存策略
 * - 低并发数
 * - 启用请求优先级
 * - 减少监控开销
 */
export const lowPower: HttpClientConfig = {
  timeout: 8000,
  cache: {
    enabled: true,
    ttl: 15 * 60 * 1000, // 15分钟（更长的缓存）
  },
  retry: {
    retries: 2, // 减少重试次数
    retryDelay: 1500,
  },
  concurrency: {
    maxConcurrent: 3, // 低并发
    deduplication: true,
  },
  priorityQueue: {
    maxConcurrent: 3,
    priorityBoost: true, // 启用优先级提升
  },
  monitor: {
    enabled: true,
    enableSampling: true, // 启用采样
    samplingRate: 0.1, // 10% 采样率
  },
}

/**
 * 批量操作预设
 * 
 * 适用于需要批量处理请求的场景（如数据导入、批量更新）
 * 特点：
 * - 高并发
 * - 请求队列管理
 * - 禁用缓存（批量操作通常是一次性的）
 * - 详细的性能监控
 */
export const batch: HttpClientConfig = {
  timeout: 60000, // 1分钟超时
  cache: {
    enabled: false, // 批量操作不需要缓存
  },
  retry: {
    retries: 2,
    retryDelay: 2000,
  },
  concurrency: {
    maxConcurrent: 50, // 高并发
    maxQueueSize: 1000, // 大队列
    deduplication: false, // 批量操作通常不需要去重
  },
  monitor: {
    enabled: true,
    maxMetrics: 5000, // 保留更多指标
  },
}

/**
 * 开发模式预设
 * 
 * 适用于开发环境
 * 特点：
 * - 详细的日志
 * - 禁用缓存（避免开发时的缓存问题）
 * - 详细的错误信息
 * - 启用开发工具
 */
export const development: HttpClientConfig = {
  timeout: 30000,
  cache: {
    enabled: false, // 开发时禁用缓存
  },
  retry: {
    retries: 1, // 开发时减少重试，更快暴露问题
  },
  monitor: {
    enabled: true,
    slowRequestThreshold: 1000, // 更严格的慢请求阈值
  },
}

/**
 * 生产模式预设
 * 
 * 适用于生产环境
 * 特点：
 * - 优化的缓存策略
 * - 合理的重试机制
 * - 性能监控采样
 * - 错误恢复
 */
export const production: HttpClientConfig = {
  timeout: 10000,
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000,
  },
  retry: {
    retries: 3,
    retryDelay: 1000,
  },
  concurrency: {
    maxConcurrent: 15,
    deduplication: true,
  },
  monitor: {
    enabled: true,
    enableSampling: true,
    samplingRate: 0.2, // 20% 采样率（生产环境降低开销）
  },
}

/**
 * 离线优先预设
 * 
 * 适用于 PWA 或需要离线支持的应用
 * 特点：
 * - 长期缓存
 * - 离线队列
 * - 网络恢复自动重试
 */
export const offlineFirst: HttpClientConfig = {
  timeout: 5000, // 较短的超时（优先使用缓存）
  cache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24小时
  },
  retry: {
    retries: 5,
    retryDelay: 3000,
  },
  concurrency: {
    maxConcurrent: 5,
  },
}

/**
 * 所有预设的集合
 */
export const presets = {
  restful,
  graphql,
  realtime,
  lowPower,
  batch,
  development,
  production,
  offlineFirst,
} as const

/**
 * 预设类型
 */
export type PresetName = keyof typeof presets

/**
 * 根据名称获取预设
 */
export function getPreset(name: PresetName): HttpClientConfig {
  return presets[name]
}

/**
 * 合并预设和自定义配置
 */
export function mergePreset(
  preset: PresetName | HttpClientConfig,
  customConfig: Partial<HttpClientConfig>,
): HttpClientConfig {
  const baseConfig = typeof preset === 'string' ? presets[preset] : preset

  return {
    ...baseConfig,
    ...customConfig,
    // 深度合并特定字段
    cache: {
      ...baseConfig.cache,
      ...customConfig.cache,
    },
    retry: {
      ...baseConfig.retry,
      ...customConfig.retry,
    },
    concurrency: {
      ...baseConfig.concurrency,
      ...customConfig.concurrency,
    },
    monitor: {
      ...baseConfig.monitor,
      ...customConfig.monitor,
    },
  }
}

/**
 * 根据环境自动选择预设
 */
export function autoPreset(): HttpClientConfig {
  // 检测环境
  const isDev = typeof process !== 'undefined'
    && process.env?.NODE_ENV === 'development'

  const isProd = typeof process !== 'undefined'
    && process.env?.NODE_ENV === 'production'

  // 检测是否为移动设备
  const isMobile = typeof navigator !== 'undefined'
    && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)

  // 根据环境选择预设
  if (isDev) {
    return development
  }

  if (isProd) {
    return isMobile ? lowPower : production
  }

  // 默认使用 restful
  return restful
}


