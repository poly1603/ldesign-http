/**
 * 请求录制、回放和 Mock 生成功能
 *
 * 用于开发和测试场景，录制真实的 HTTP 请求和响应
 * 后续可以回放这些录制内容，实现离线开发和测试
 * 支持智能 Mock 数据生成和场景管理
 *
 * @example
 * ```typescript
 * import { createHttpClient, RequestRecorder } from '@ldesign/http'
 *
 * const recorder = new RequestRecorder()
 * const client = await createHttpClient({
 *   baseURL: 'https://api.example.com'
 * })
 *
 * // 添加录制拦截器
 * recorder.attachToClient(client)
 *
 * // 开始录制
 * recorder.startRecording()
 * await client.get('/users')
 * await client.post('/users', { name: 'John' })
 *
 * // 停止录制并保存
 * const recordings = recorder.stopRecording()
 * await recorder.saveToFile('./recordings.json')
 *
 * // 回放录制
 * recorder.enableReplayMode()
 * const response = await client.get('/users') // 返回录制的响应
 *
 * // 生成 Mock 数据
 * const mockData = recorder.generateMockData()
 * await recorder.exportAsMockJS('./mocks.js')
 * ```
 */

import type { HttpClient, RequestConfig, ResponseData } from '../types'

/**
 * 匹配策略
 */
export enum MatchStrategy {
  /** 精确匹配 - URL、方法、参数、请求体都必须完全匹配 */
  EXACT = 'exact',
  /** URL 匹配 - 只匹配 URL 和方法 */
  URL = 'url',
  /** 模式匹配 - 支持 URL 模式（通配符） */
  PATTERN = 'pattern',
  /** 自定义匹配 - 使用自定义匹配函数 */
  CUSTOM = 'custom',
}

/**
 * Mock 数据类型
 */
export enum MockDataType {
  /** 静态数据 - 使用录制的真实数据 */
  STATIC = 'static',
  /** 动态数据 - 使用模板生成随机数据 */
  DYNAMIC = 'dynamic',
  /** 函数 - 使用函数生成数据 */
  FUNCTION = 'function',
}

/**
 * 场景配置
 */
export interface ScenarioConfig {
  /** 场景名称 */
  name: string
  /** 场景描述 */
  description?: string
  /** 场景包含的录制 ID 列表 */
  recordingIds: string[]
  /** 场景标签 */
  tags?: string[]
}

/**
 * 录制项
 */
export interface RecordingItem {
  /**
   * 录制ID
   */
  id: string

  /**
   * 录制时间
   */
  timestamp: number

  /**
   * 请求配置
   */
  request: {
    method: string
    url: string
    headers: Record<string, string>
    params?: Record<string, unknown>
    data?: unknown
  }

  /**
   * 响应数据
   */
  response: {
    status: number
    statusText: string
    headers: Record<string, string>
    data: unknown
    duration: number
  }

  /**
   * 元数据
   */
  metadata?: {
    tags?: string[]
    description?: string
    [key: string]: unknown
  }
}

/**
 * 录制配置
 */
export interface RecorderConfig {
  /**
   * 是否启用录制
   */
  enabled?: boolean

  /**
   * 最大录制数量
   */
  maxRecordings?: number

  /**
   * 是否自动保存
   */
  autoSave?: boolean

  /**
   * 保存路径
   */
  savePath?: string

  /**
   * 过滤器：决定是否录制某个请求
   */
  filter?: (config: RequestConfig) => boolean

  /**
   * 是否录制响应体（大文件可能很占空间）
   */
  recordResponseBody?: boolean

  /**
   * 最大响应体大小（字节）
   */
  maxResponseBodySize?: number
}

/**
 * 录制统计
 */
export interface RecorderStats {
  /**
   * 总录制数
   */
  totalRecordings: number

  /**
   * 录制的数据大小（估计）
   */
  estimatedSize: number

  /**
   * 录制时间范围
   */
  timeRange: {
    start: number
    end: number
  }

  /**
   * 按方法分类
   */
  byMethod: Record<string, number>

  /**
   * 按状态码分类
   */
  byStatus: Record<number, number>
}

/**
 * 请求录制器
 */
export class RequestRecorder {
  private recordings: RecordingItem[] = []
  private config: Required<RecorderConfig>
  private isRecording = false
  private isReplaying = false
  private replayIndex = new Map<string, RecordingItem>()
  private requestInterceptorId?: number
  private responseInterceptorId?: number

  constructor(config: RecorderConfig = {}) {
    this.config = {
      enabled: true,
      maxRecordings: 1000,
      autoSave: false,
      savePath: './recordings.json',
      filter: () => true,
      recordResponseBody: true,
      maxResponseBodySize: 10 * 1024 * 1024, // 10MB
      ...config,
    }
  }

  /**
   * 附加到 HTTP 客户端
   */
  attachToClient(client: HttpClient): void {
    // 添加请求拦截器
    this.requestInterceptorId = client.addRequestInterceptor((config) => {
      if (this.isReplaying) {
        // 回放模式：标记请求以便在响应拦截器中处理
        return {
          ...config,
          metadata: {
            ...config.metadata,
            __replay: true,
          },
        }
      }
      return config
    })

    // 添加响应拦截器
    this.responseInterceptorId = client.addResponseInterceptor(
      (response) => {
        if (this.isReplaying) {
          // 回放模式：尝试从录制中获取响应
          const recorded = this.findRecording(response.config)
          if (recorded) {
            return this.buildResponseFromRecording(recorded, response.config)
          }
        }

        if (this.isRecording && this.config.enabled) {
          // 录制模式：记录请求和响应
          this.recordRequest(response.config, response)
        }

        return response
      },
    )
  }

  /**
   * 从客户端分离
   */
  detachFromClient(client: HttpClient): void {
    if (this.requestInterceptorId !== undefined) {
      client.removeRequestInterceptor(this.requestInterceptorId)
    }
    if (this.responseInterceptorId !== undefined) {
      client.removeResponseInterceptor(this.responseInterceptorId)
    }
  }

  /**
   * 开始录制
   */
  startRecording(): void {
    this.isRecording = true
    this.isReplaying = false
    console.log('[RequestRecorder] 开始录制请求')
  }

  /**
   * 停止录制
   */
  stopRecording(): RecordingItem[] {
    this.isRecording = false
    console.log(`[RequestRecorder] 停止录制，共录制 ${this.recordings.length} 个请求`)
    return this.getRecordings()
  }

  /**
   * 启用回放模式
   */
  enableReplayMode(): void {
    this.isReplaying = true
    this.isRecording = false
    this.buildReplayIndex()
    console.log(`[RequestRecorder] 启用回放模式，共 ${this.recordings.length} 个录制`)
  }

  /**
   * 禁用回放模式
   */
  disableReplayMode(): void {
    this.isReplaying = false
    console.log('[RequestRecorder] 禁用回放模式')
  }

  /**
   * 录制请求
   */
  private recordRequest(config: RequestConfig, response: ResponseData): void {
    // 应用过滤器
    if (this.config.filter && !this.config.filter(config)) {
      return
    }

    // 检查最大录制数
    if (this.recordings.length >= this.config.maxRecordings) {
      // 移除最旧的录制
      this.recordings.shift()
    }

    // 检查响应体大小
    let responseData = response.data
    if (this.config.recordResponseBody) {
      const size = this.estimateSize(responseData)
      if (size > this.config.maxResponseBodySize) {
        responseData = '[响应体过大，未录制]'
      }
    }
    else {
      responseData = null
    }

    const recording: RecordingItem = {
      id: this.generateId(),
      timestamp: Date.now(),
      request: {
        method: config.method || 'GET',
        url: config.url || '',
        headers: { ...config.headers },
        params: config.params ? { ...config.params } : undefined,
        data: config.data,
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: { ...response.headers },
        data: responseData,
        duration: response.duration || 0,
      },
    }

    this.recordings.push(recording)
  }

  /**
   * 查找匹配的录制
   */
  private findRecording(config: RequestConfig): RecordingItem | undefined {
    const key = this.generateRecordingKey(config)
    return this.replayIndex.get(key)
  }

  /**
   * 从录制构建响应
   */
  private buildResponseFromRecording(
    recording: RecordingItem,
    config: RequestConfig,
  ): ResponseData {
    return {
      data: recording.response.data,
      status: recording.response.status,
      statusText: recording.response.statusText,
      headers: recording.response.headers,
      config,
      duration: recording.response.duration,
      fromCache: false,
    }
  }

  /**
   * 构建回放索引
   */
  private buildReplayIndex(): void {
    this.replayIndex.clear()

    for (const recording of this.recordings) {
      const key = this.generateRecordingKey({
        method: recording.request.method,
        url: recording.request.url,
        params: recording.request.params,
        data: recording.request.data,
      })

      // 使用最后一个匹配的录制（覆盖旧的）
      this.replayIndex.set(key, recording)
    }
  }

  /**
   * 生成录制键（用于匹配）
   */
  private generateRecordingKey(config: RequestConfig | {
    method: string
    url: string
    params?: Record<string, unknown>
    data?: unknown
  }): string {
    const method = config.method || 'GET'
    const url = config.url || ''
    const params = config.params ? JSON.stringify(config.params) : ''
    const data = config.data ? JSON.stringify(config.data) : ''

    return `${method}:${url}:${params}:${data}`
  }

  /**
   * 获取所有录制
   */
  getRecordings(): RecordingItem[] {
    return [...this.recordings]
  }

  /**
   * 加载录制
   */
  loadRecordings(recordings: RecordingItem[]): void {
    this.recordings = [...recordings]
    if (this.isReplaying) {
      this.buildReplayIndex()
    }
  }

  /**
   * 清空录制
   */
  clearRecordings(): void {
    this.recordings = []
    this.replayIndex.clear()
  }

  /**
   * 保存到文件（浏览器环境）
   */
  async saveToFile(filename?: string): Promise<void> {
    const data = JSON.stringify(this.recordings, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename || this.config.savePath
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 从文件加载（浏览器环境）
   */
  async loadFromFile(file: File): Promise<void> {
    const text = await file.text()
    const recordings = JSON.parse(text) as RecordingItem[]
    this.loadRecordings(recordings)
  }

  /**
   * 导出为 JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(this.recordings, null, 2)
  }

  /**
   * 从 JSON 导入
   */
  importFromJSON(json: string): void {
    const recordings = JSON.parse(json) as RecordingItem[]
    this.loadRecordings(recordings)
  }

  /**
   * 获取录制统计
   */
  getStats(): RecorderStats {
    const byMethod: Record<string, number> = {}
    const byStatus: Record<number, number> = {}
    let totalSize = 0
    let minTime = Infinity
    let maxTime = 0

    for (const recording of this.recordings) {
      // 按方法统计
      const method = recording.request.method
      byMethod[method] = (byMethod[method] || 0) + 1

      // 按状态码统计
      const status = recording.response.status
      byStatus[status] = (byStatus[status] || 0) + 1

      // 估算大小
      totalSize += this.estimateSize(recording)

      // 时间范围
      if (recording.timestamp < minTime) {
        minTime = recording.timestamp
      }
      if (recording.timestamp > maxTime) {
        maxTime = recording.timestamp
      }
    }

    return {
      totalRecordings: this.recordings.length,
      estimatedSize: totalSize,
      timeRange: {
        start: minTime,
        end: maxTime,
      },
      byMethod,
      byStatus,
    }
  }

  /**
   * 按条件过滤录制
   */
  filterRecordings(predicate: (recording: RecordingItem) => boolean): RecordingItem[] {
    return this.recordings.filter(predicate)
  }

  /**
   * 添加标签
   */
  addTagToRecordings(tag: string, filter?: (recording: RecordingItem) => boolean): void {
    for (const recording of this.recordings) {
      if (!filter || filter(recording)) {
        if (!recording.metadata) {
          recording.metadata = {}
        }
        if (!recording.metadata.tags) {
          recording.metadata.tags = []
        }
        if (!recording.metadata.tags.includes(tag)) {
          (recording.metadata.tags as string[]).push(tag)
        }
      }
    }
  }

  /**
   * 按标签获取录制
   */
  getRecordingsByTag(tag: string): RecordingItem[] {
    return this.recordings.filter(r =>
      r.metadata?.tags && (r.metadata.tags as string[]).includes(tag),
    )
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 估算对象大小（字节）
   */
  private estimateSize(obj: unknown): number {
    try {
      return new Blob([JSON.stringify(obj)]).size
    }
    catch {
      return 0
    }
  }
}

/**
 * 创建请求录制器
 */
export function createRequestRecorder(config?: RecorderConfig): RequestRecorder {
  return new RequestRecorder(config)
}

/**
 * 录制拦截器工厂
 * 
 * 创建一个拦截器，自动录制所有请求
 */
export function createRecorderInterceptor(recorder: RequestRecorder) {
  return {
    request: (config: RequestConfig) => {
      // 标记请求开始时间
      return {
        ...config,
        metadata: {
          ...config.metadata,
          __recordStartTime: Date.now(),
        },
      }
    },
    response: <T>(response: ResponseData<T>) => {
      // 录制会在 recorder 的拦截器中处理
      return response
    },
  }
}

