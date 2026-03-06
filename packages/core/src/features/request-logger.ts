/**
 * RequestLogger - 结构化请求日志记录器
 *
 * 提供请求/响应的结构化日志，支持自定义输出和过滤
 */

export interface RequestLogEntry {
  /** 请求 ID */
  id: string
  /** 时间戳 */
  timestamp: number
  /** 请求方法 */
  method: string
  /** 请求 URL */
  url: string
  /** 请求头 (可选) */
  headers?: Record<string, string>
  /** 请求体大小 (bytes) */
  bodySize?: number
  /** 响应状态码 */
  status?: number
  /** 响应时间 (ms) */
  duration?: number
  /** 响应体大小 (bytes) */
  responseSize?: number
  /** 是否缓存命中 */
  fromCache?: boolean
  /** 错误信息 */
  error?: string
  /** 阶段: request | response | error */
  phase: 'request' | 'response' | 'error'
  /** 自定义标签 */
  tags?: Record<string, string>
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface RequestLoggerConfig {
  /** 是否启用 */
  enabled?: boolean
  /** 日志级别 */
  level?: LogLevel
  /** 是否记录请求头 */
  logHeaders?: boolean
  /** 是否记录请求体大小 */
  logBodySize?: boolean
  /** 最大保留日志条数 */
  maxEntries?: number
  /** URL 过滤 (返回 true 则记录) */
  filter?: (url: string, method: string) => boolean
  /** 自定义输出函数 */
  output?: (entry: RequestLogEntry) => void
  /** 请求头脱敏字段 */
  sensitiveHeaders?: string[]
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

/**
 * RequestLogger 类
 *
 * 结构化的请求日志，适用于开发调试和生产监控
 *
 * @example
 * ```ts
 * const logger = new RequestLogger({
 *   level: 'info',
 *   logHeaders: true,
 *   sensitiveHeaders: ['Authorization', 'Cookie'],
 * })
 *
 * // 记录请求
 * logger.logRequest('req_1', 'GET', '/api/users')
 *
 * // 记录响应
 * logger.logResponse('req_1', 200, 123)
 *
 * // 获取所有日志
 * const entries = logger.getEntries()
 * ```
 */
export class RequestLogger {
  private config: Required<RequestLoggerConfig>
  private entries: RequestLogEntry[] = []
  private counter = 0

  constructor(config: RequestLoggerConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      level: config.level ?? 'info',
      logHeaders: config.logHeaders ?? false,
      logBodySize: config.logBodySize ?? true,
      maxEntries: config.maxEntries ?? 200,
      filter: config.filter ?? (() => true),
      output: config.output ?? this.defaultOutput.bind(this),
      sensitiveHeaders: config.sensitiveHeaders ?? ['authorization', 'cookie', 'x-api-key'],
    }
  }

  /**
   * 生成请求 ID
   */
  generateId(): string {
    return `log_${++this.counter}_${Date.now()}`
  }

  /**
   * 记录请求开始
   */
  logRequest(
    id: string,
    method: string,
    url: string,
    options?: {
      headers?: Record<string, string>
      bodySize?: number
      tags?: Record<string, string>
    },
  ): void {
    if (!this.config.enabled) return
    if (!this.config.filter(url, method)) return

    const entry: RequestLogEntry = {
      id,
      timestamp: Date.now(),
      method: method.toUpperCase(),
      url,
      phase: 'request',
      headers: this.config.logHeaders
        ? this.sanitizeHeaders(options?.headers)
        : undefined,
      bodySize: this.config.logBodySize ? options?.bodySize : undefined,
      tags: options?.tags,
    }

    this.addEntry(entry)
  }

  /**
   * 记录请求响应
   */
  logResponse(
    id: string,
    status: number,
    duration: number,
    options?: {
      responseSize?: number
      fromCache?: boolean
    },
  ): void {
    if (!this.config.enabled) return

    // 查找对应的请求记录
    const requestEntry = this.entries.find(e => e.id === id && e.phase === 'request')
    if (!requestEntry) return

    const entry: RequestLogEntry = {
      id,
      timestamp: Date.now(),
      method: requestEntry.method,
      url: requestEntry.url,
      phase: 'response',
      status,
      duration,
      responseSize: options?.responseSize,
      fromCache: options?.fromCache,
      tags: requestEntry.tags,
    }

    this.addEntry(entry)
  }

  /**
   * 记录请求错误
   */
  logError(
    id: string,
    error: string,
    duration: number,
    status?: number,
  ): void {
    if (!this.config.enabled) return

    const requestEntry = this.entries.find(e => e.id === id && e.phase === 'request')

    const entry: RequestLogEntry = {
      id,
      timestamp: Date.now(),
      method: requestEntry?.method || 'UNKNOWN',
      url: requestEntry?.url || 'unknown',
      phase: 'error',
      status,
      duration,
      error,
      tags: requestEntry?.tags,
    }

    this.addEntry(entry)
  }

  /**
   * 获取所有日志条目
   */
  getEntries(): RequestLogEntry[] {
    return [...this.entries]
  }

  /**
   * 按请求 ID 获取完整生命周期
   */
  getRequestLifecycle(id: string): RequestLogEntry[] {
    return this.entries.filter(e => e.id === id)
  }

  /**
   * 获取错误日志
   */
  getErrors(): RequestLogEntry[] {
    return this.entries.filter(e => e.phase === 'error')
  }

  /**
   * 获取慢请求 (超过阈值)
   */
  getSlowRequests(thresholdMs: number): RequestLogEntry[] {
    return this.entries.filter(
      e => e.phase === 'response' && e.duration !== undefined && e.duration > thresholdMs,
    )
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.entries = []
  }

  /**
   * 设置启用状态
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  private addEntry(entry: RequestLogEntry): void {
    this.entries.push(entry)

    // 限制条目数量
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries)
    }

    this.config.output(entry)
  }

  private sanitizeHeaders(
    headers?: Record<string, string>,
  ): Record<string, string> | undefined {
    if (!headers) return undefined

    const sanitized: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
      if (this.config.sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '***'
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  private defaultOutput(entry: RequestLogEntry): void {
    const levelNum = LOG_LEVELS[this.config.level]

    if (entry.phase === 'request' && levelNum <= LOG_LEVELS.debug) {
      console.debug(
        `[HTTP] --> ${entry.method} ${entry.url}`,
        entry.bodySize ? `(${entry.bodySize}B)` : '',
      )
    } else if (entry.phase === 'response' && levelNum <= LOG_LEVELS.info) {
      const cacheTag = entry.fromCache ? ' [cache]' : ''
      console.info(
        `[HTTP] <-- ${entry.status} ${entry.method} ${entry.url} (${entry.duration}ms)${cacheTag}`,
      )
    } else if (entry.phase === 'error' && levelNum <= LOG_LEVELS.error) {
      console.error(
        `[HTTP] !!! ${entry.method} ${entry.url} - ${entry.error} (${entry.duration}ms)`,
      )
    }
  }
}

/**
 * 创建 RequestLogger 实例
 */
export function createRequestLogger(config?: RequestLoggerConfig): RequestLogger {
  return new RequestLogger(config)
}
