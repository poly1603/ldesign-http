/**
 * SSE 事件类型
 */
export interface SSEEvent {
  /** 事件类型 */
  type: string
  /** 事件数据 */
  data: string
  /** 事件 ID */
  id?: string
  /** 重连延迟 */
  retry?: number
  /** 时间戳 */
  timestamp?: number
}

/**
 * 重连策略类型
 */
export enum ReconnectStrategy {
  /** 线性重连 - 固定延迟 */
  LINEAR = 'linear',
  /** 指数退避 - 延迟倍增 */
  EXPONENTIAL = 'exponential',
  /** 随机延迟 - 避免同时重连 */
  RANDOM = 'random',
}

/**
 * 连接质量等级
 */
export enum ConnectionQuality {
  /** 优秀 - 事件接收率 > 95% */
  EXCELLENT = 'excellent',
  /** 良好 - 事件接收率 80-95% */
  GOOD = 'good',
  /** 一般 - 事件接收率 60-80% */
  FAIR = 'fair',
  /** 较差 - 事件接收率 < 60% */
  POOR = 'poor',
  /** 未知 - 数据不足 */
  UNKNOWN = 'unknown',
}

/**
 * 事件过滤器类型
 */
export type SSEEventFilter = (event: SSEEvent) => boolean

/**
 * 事件过滤配置
 */
export interface SSEEventFilterConfig {
  /** 允许的事件类型列表 */
  allowedTypes?: string[]
  /** 拒绝的事件类型列表 */
  deniedTypes?: string[]
  /** 数据内容正则匹配 */
  dataPattern?: RegExp
  /** 自定义过滤函数 */
  customFilter?: SSEEventFilter
}

/**
 * SSE 连接统计信息
 */
export interface SSEConnectionStats {
  /** 连接持续时间（毫秒） */
  connectedDuration: number
  /** 接收的事件总数 */
  eventsReceived: number
  /** 过滤掉的事件数 */
  eventsFiltered: number
  /** 重连次数 */
  reconnectCount: number
  /** 连接质量 */
  quality: ConnectionQuality
  /** 平均事件间隔（毫秒） */
  averageEventInterval: number
  /** 最后接收事件的时间戳 */
  lastEventTime: number
  /** 丢失的心跳次数 */
  missedHeartbeats: number
}

/**
 * SSE 客户端配置
 */
export interface SSEClientConfig {
  /** SSE 端点 URL */
  url: string
  /** 请求配置 */
  withCredentials?: boolean
  /** 自定义请求头 */
  headers?: Record<string, string>
  /** 自动重连 */
  autoReconnect?: boolean
  /** 重连延迟（毫秒） */
  reconnectDelay?: number
  /** 最大重连延迟（毫秒，用于指数退避） */
  maxReconnectDelay?: number
  /** 最大重连次数 */
  maxReconnectAttempts?: number
  /** 重连策略 */
  reconnectStrategy?: ReconnectStrategy
  /** 心跳超时（毫秒） */
  heartbeatTimeout?: number
  /** 事件过滤配置 */
  eventFilter?: SSEEventFilterConfig
  /** 消息缓冲区大小（断线期间缓存的事件数） */
  bufferSize?: number
  /** 是否启用消息缓冲 */
  enableBuffer?: boolean
  /** 调试模式 */
  debug?: boolean
}

/**
 * SSE 连接状态
 */
export enum SSEStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * SSE 事件监听器
 */
export type SSEEventListener<T = any> = (event: T) => void

/**
 * SSE 客户端
 *
 * 提供 Server-Sent Events (SSE) 连接管理，支持自动重连、心跳检测等功能
 *
 * @example
 * ```typescript
 * const sseClient = new SSEClient({
 *   url: 'http://localhost:3000/events',
 *   autoReconnect: true,
 * })
 *
 * // 监听消息
 * sseClient.on('message', (event) => {
 *   
 * })
 *
 * // 监听自定义事件
 * sseClient.addEventListener('notification', (event) => {
 *   
 * })
 *
 * // 连接
 * await sseClient.connect()
 *
 * // 断开连接
 * sseClient.disconnect()
 * ```
 */
export class SSEClient {
  private config: Required<SSEClientConfig>
  private eventSource: EventSource | null = null
  private status: SSEStatus = SSEStatus.DISCONNECTED
  private eventListeners: Map<string, Set<SSEEventListener>> = new Map()
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null
  private lastEventId: string | null = null
  
  // 统计信息
  private connectedAt: number = 0
  private eventsReceived: number = 0
  private eventsFiltered: number = 0
  private lastEventTime: number = 0
  private eventIntervals: number[] = []
  private missedHeartbeats: number = 0
  
  // 消息缓冲区
  private eventBuffer: SSEEvent[] = []

  constructor(config: SSEClientConfig) {
    this.config = {
      url: config.url,
      withCredentials: config.withCredentials ?? false,
      headers: config.headers || {},
      autoReconnect: config.autoReconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 3000,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      reconnectStrategy: config.reconnectStrategy ?? ReconnectStrategy.EXPONENTIAL,
      heartbeatTimeout: config.heartbeatTimeout ?? 30000,
      eventFilter: config.eventFilter,
      bufferSize: config.bufferSize ?? 100,
      enableBuffer: config.enableBuffer ?? true,
      debug: config.debug ?? false,
    }
  }

  /**
   * 连接 SSE
   */
  async connect(): Promise<void> {
    if (this.status === SSEStatus.CONNECTED || this.status === SSEStatus.CONNECTING) {
      this.log('Already connected or connecting')
      return
    }

    return new Promise((resolve, reject) => {
      this.status = SSEStatus.CONNECTING
      this.log(`Connecting to ${this.config.url}`)

      try {
        // 构建 URL（添加 lastEventId 如果存在）
        let url = this.config.url
        if (this.lastEventId) {
          const separator = url.includes('?') ? '&' : '?'
          url += `${separator}lastEventId=${encodeURIComponent(this.lastEventId)}`
        }

        // 创建 EventSource
        this.eventSource = new EventSource(url, {
          withCredentials: this.config.withCredentials,
        })

        // 连接打开
        this.eventSource.onopen = () => {
          this.status = SSEStatus.CONNECTED
          this.reconnectAttempts = 0
          this.connectedAt = Date.now()
          this.missedHeartbeats = 0
          this.log('Connected')

          // 启动心跳检测
          this.startHeartbeat()

          // 触发 open 事件
          this.emit('open', {
            timestamp: this.connectedAt,
            url: this.config.url,
          })
          resolve()
        }

        // 接收消息
        this.eventSource.onmessage = (event: MessageEvent) => {
          this.handleMessage(event)
        }

        // 错误处理
        this.eventSource.onerror = (error) => {
          this.log('Error:', error)

          if (this.status === SSEStatus.CONNECTING) {
            // 连接失败
            this.status = SSEStatus.ERROR
            this.emit('error', error)
            reject(error)
          }
          else {
            // 连接断开
            this.handleDisconnection()
          }
        }
      }
      catch (error) {
        this.status = SSEStatus.ERROR
        this.emit('error', error)
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.log('Disconnecting')

    // 清除定时器
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    // 关闭连接
    if (this.eventSource) {
      this.status = SSEStatus.DISCONNECTING
      this.eventSource.close()
      this.eventSource = null
    }

    this.status = SSEStatus.DISCONNECTED
    this.emit('close')
  }

  /**
   * 监听默认消息事件
   */
  on(event: 'message' | 'open' | 'close' | 'error' | 'reconnect' | 'reconnecting' | 'reconnect_failed', listener: SSEEventListener): () => void {
    return this.addEventListener(event, listener)
  }

  /**
   * 监听自定义事件
   */
  addEventListener(event: string, listener: SSEEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)

    // 如果已连接，注册到 EventSource
    if (this.eventSource && event !== 'open' && event !== 'close' && event !== 'error') {
      this.eventSource.addEventListener(event, listener as any)
    }

    // 返回取消监听函数
    return () => this.removeEventListener(event, listener)
  }

  /**
   * 取消监听
   */
  removeEventListener(event: string, listener: SSEEventListener): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }

    // 从 EventSource 移除
    if (this.eventSource) {
      this.eventSource.removeEventListener(event, listener as any)
    }
  }

  /**
   * 监听一次事件
   */
  once(event: string, listener: SSEEventListener): void {
    const wrappedListener = (data: any) => {
      listener(data)
      this.removeEventListener(event, wrappedListener)
    }
    this.addEventListener(event, wrappedListener)
  }

  /**
   * 获取连接状态
   */
  getStatus(): SSEStatus {
    return this.status
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.status === SSEStatus.CONNECTED
  }

  /**
   * 获取重连次数
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts
  }

  /**
   * 获取最后的事件 ID
   */
  getLastEventId(): string | null {
    return this.lastEventId
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SSEClientConfig>): void {
    Object.assign(this.config, config)

    // 如果已连接且修改了心跳配置，重新启动心跳
    if (this.isConnected() && config.heartbeatTimeout) {
      this.stopHeartbeat()
      this.startHeartbeat()
    }
  }

  /**
   * 获取原生 EventSource 实例
   */
  getEventSource(): EventSource | null {
    return this.eventSource
  }

  /**
   * 获取就绪状态
   */
  getReadyState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data)
        }
        catch (error) {
          this.log('Error in event listener:', error)
        }
      })
    }
  }

  /**
   * 处理消息
   */
  private handleMessage(event: MessageEvent): void {
    // 重置心跳定时器
    this.resetHeartbeat()
    this.missedHeartbeats = 0

    // 保存最后的事件 ID
    if (event.lastEventId) {
      this.lastEventId = event.lastEventId
    }

    // 构建 SSE 事件对象
    const sseEvent: SSEEvent = {
      type: event.type,
      data: event.data,
      id: event.lastEventId,
      timestamp: Date.now(),
    }

    // 应用事件过滤
    if (this.config.eventFilter && !this.shouldAcceptEvent(sseEvent)) {
      this.eventsFiltered++
      this.log('Event filtered:', sseEvent)
      return
    }

    // 更新统计信息
    this.updateStats(sseEvent)

    // 如果启用了缓冲，添加到缓冲区
    if (this.config.enableBuffer) {
      this.addToBuffer(sseEvent)
    }

    this.log('Message received:', event.data)
    this.emit('message', sseEvent)
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(): void {
    this.stopHeartbeat()
    this.status = SSEStatus.DISCONNECTED

    // 触发 close 事件
    this.emit('close')

    // 自动重连
    if (this.config?.autoReconnect && this.reconnectAttempts < this.config?.maxReconnectAttempts) {
      this.reconnect()
    }
    else if (this.reconnectAttempts >= this.config?.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached')
      this.emit('reconnect_failed')
    }
  }

  /**
   * 重连
   */
  private reconnect(): void {
    this.reconnectAttempts++
    this.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`)

    this.emit('reconnecting', {
      attempts: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
      strategy: this.config.reconnectStrategy,
    })

    // 关闭旧连接
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    // 计算重连延迟
    const delay = this.calculateReconnectDelay()
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect()
        this.log('Reconnected successfully')
        
        // 重放缓冲区的事件
        if (this.config.enableBuffer && this.eventBuffer.length > 0) {
          this.log(`Replaying ${this.eventBuffer.length} buffered events`)
          this.emit('buffer_replay', { count: this.eventBuffer.length })
        }
        
        this.emit('reconnect', {
          attempts: this.reconnectAttempts,
          bufferedEvents: this.eventBuffer.length,
        })
      }
      catch (error) {
        this.log('Reconnect failed:', error)
        this.handleDisconnection()
      }
    }, delay)
  }
  
  /**
   * 计算重连延迟
   */
  private calculateReconnectDelay(): number {
    const { reconnectDelay, maxReconnectDelay, reconnectStrategy } = this.config
    
    switch (reconnectStrategy) {
      case ReconnectStrategy.LINEAR:
        // 线性增长：delay * attempts
        return Math.min(reconnectDelay * this.reconnectAttempts, maxReconnectDelay)
      
      case ReconnectStrategy.EXPONENTIAL:
        // 指数退避：delay * 2^(attempts - 1)
        return Math.min(
          reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
          maxReconnectDelay
        )
      
      case ReconnectStrategy.RANDOM:
        // 随机延迟：delay * (1 + random(0, attempts))
        const randomFactor = 1 + Math.random() * this.reconnectAttempts
        return Math.min(reconnectDelay * randomFactor, maxReconnectDelay)
      
      default:
        return reconnectDelay
    }
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    if (this.config.heartbeatTimeout <= 0) {
      return
    }

    this.heartbeatTimer = setTimeout(() => {
      this.missedHeartbeats++
      this.log(`Heartbeat timeout (missed: ${this.missedHeartbeats})`)
      
      // 触发心跳超时事件
      this.emit('heartbeat_timeout', { missedHeartbeats: this.missedHeartbeats })
      
      // 如果连续丢失多次心跳，认为连接已断开
      if (this.missedHeartbeats >= 3) {
        this.log('Too many missed heartbeats, disconnecting')
        this.handleDisconnection()
      } else {
        // 继续心跳检测
        this.startHeartbeat()
      }
    }, this.config.heartbeatTimeout)
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 重置心跳定时器
   */
  private resetHeartbeat(): void {
    this.stopHeartbeat()
    this.startHeartbeat()
  }

  /**
   * 日志输出
   */
  private log(..._args: any[]): void {
    if (this.config.debug) {
      // console.log('[SSE]', ...args)
    }
  }
  
  /**
   * 判断事件是否应该被接受
   */
  private shouldAcceptEvent(event: SSEEvent): boolean {
    const filter = this.config.eventFilter
    if (!filter) return true
    
    // 检查拒绝列表
    if (filter.deniedTypes?.includes(event.type)) {
      return false
    }
    
    // 检查允许列表
    if (filter.allowedTypes && !filter.allowedTypes.includes(event.type)) {
      return false
    }
    
    // 检查数据模式匹配
    if (filter.dataPattern && !filter.dataPattern.test(event.data)) {
      return false
    }
    
    // 应用自定义过滤器
    if (filter.customFilter && !filter.customFilter(event)) {
      return false
    }
    
    return true
  }
  
  /**
   * 更新统计信息
   */
  private updateStats(event: SSEEvent): void {
    this.eventsReceived++
    
    // 计算事件间隔
    if (this.lastEventTime > 0) {
      const interval = event.timestamp! - this.lastEventTime
      this.eventIntervals.push(interval)
      
      // 只保留最近 50 个间隔
      if (this.eventIntervals.length > 50) {
        this.eventIntervals.shift()
      }
    }
    
    this.lastEventTime = event.timestamp!
  }
  
  /**
   * 添加事件到缓冲区
   */
  private addToBuffer(event: SSEEvent): void {
    this.eventBuffer.push(event)
    
    // 限制缓冲区大小
    if (this.eventBuffer.length > this.config.bufferSize) {
      this.eventBuffer.shift()
    }
  }
  
  /**
   * 计算平均事件间隔
   */
  private calculateAverageEventInterval(): number {
    if (this.eventIntervals.length === 0) return 0
    
    const sum = this.eventIntervals.reduce((a, b) => a + b, 0)
    return sum / this.eventIntervals.length
  }
  
  /**
   * 评估连接质量
   */
  private assessConnectionQuality(): ConnectionQuality {
    if (this.eventsReceived < 10) {
      return ConnectionQuality.UNKNOWN
    }
    
    // 计算事件接收率（基于心跳超时和实际接收间隔）
    const avgInterval = this.calculateAverageEventInterval()
    const expectedInterval = this.config.heartbeatTimeout * 0.8 // 80% 的心跳超时时间
    
    if (avgInterval === 0) return ConnectionQuality.UNKNOWN
    
    const receiveRate = expectedInterval / avgInterval
    
    if (receiveRate > 0.95) return ConnectionQuality.EXCELLENT
    if (receiveRate > 0.80) return ConnectionQuality.GOOD
    if (receiveRate > 0.60) return ConnectionQuality.FAIR
    return ConnectionQuality.POOR
  }
  
  /**
   * 获取连接统计信息
   */
  getStats(): SSEConnectionStats {
    const now = Date.now()
    const connectedDuration = this.connectedAt > 0 ? now - this.connectedAt : 0
    
    return {
      connectedDuration,
      eventsReceived: this.eventsReceived,
      eventsFiltered: this.eventsFiltered,
      reconnectCount: this.reconnectAttempts,
      quality: this.assessConnectionQuality(),
      averageEventInterval: this.calculateAverageEventInterval(),
      lastEventTime: this.lastEventTime,
      missedHeartbeats: this.missedHeartbeats,
    }
  }
  
  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.connectedAt = Date.now()
    this.eventsReceived = 0
    this.eventsFiltered = 0
    this.lastEventTime = 0
    this.eventIntervals = []
    this.missedHeartbeats = 0
    this.reconnectAttempts = 0
  }
  
  /**
   * 获取缓冲的事件
   */
  getBufferedEvents(): SSEEvent[] {
    return [...this.eventBuffer]
  }
  
  /**
   * 清空事件缓冲区
   */
  clearBuffer(): void {
    this.eventBuffer = []
  }
  
  /**
   * 更新事件过滤配置
   */
  updateEventFilter(filter: SSEEventFilterConfig | undefined): void {
    this.config.eventFilter = filter
    this.log('Event filter updated:', filter)
  }
}

/**
 * 创建 SSE 客户端
 */
export function createSSEClient(config: SSEClientConfig): SSEClient {
  return new SSEClient(config)
}

/**
 * 基础 SSE 客户端包装器
 */
export class BasicSSEClient {
  private client: SSEClient
  private handlers: Map<string, SSEEventListener[]> = new Map()

  constructor(url: string, options?: Partial<SSEClientConfig>) {
    this.client = new SSEClient({
      url,
      ...options,
    })
  }

  /**
   * 订阅事件流
   */
  async subscribe(eventType: string, handler: SSEEventListener): Promise<() => void> {
    // 保存处理器
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)

    // 连接（如果还未连接）
    if (!this.client.isConnected()) {
      await this.client.connect()
    }

    // 添加事件监听器
    return this.client.addEventListener(eventType, handler)
  }

  /**
   * 取消订阅
   */
  unsubscribe(eventType?: string): void {
    if (eventType) {
      // 取消指定事件的所有监听器
      const handlers = this.handlers.get(eventType)
      if (handlers) {
        handlers.forEach((handler) => {
          this.client.removeEventListener(eventType, handler)
        })
        this.handlers.delete(eventType)
      }
    }
    else {
      // 取消所有事件的监听器
      this.handlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.client.removeEventListener(event, handler)
        })
      })
      this.handlers.clear()
    }

    // 如果没有任何监���器了，断开连接
    if (this.handlers.size === 0) {
      this.client.disconnect()
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.unsubscribe()
    this.client.disconnect()
  }

  /**
   * 获取底层客户端
   */
  getClient(): SSEClient {
    return this.client
  }
}

/**
 * 创建基础 SSE 客户端
 */
export function createBasicSSEClient(url: string, options?: Partial<SSEClientConfig>): BasicSSEClient {
  return new BasicSSEClient(url, options)
}
