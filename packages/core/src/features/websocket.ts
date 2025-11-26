/**
 * WebSocket 连接状态
 */
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * WebSocket 消息类型
 */
export interface WebSocketMessage<T = any> {
  type: string
  data: T
  timestamp?: number
  id?: string
}

/**
 * WebSocket 客户端配置
 */
export interface WebSocketClientConfig {
  /** WebSocket URL */
  url: string
  /** 子协议 */
  protocols?: string | string[]
  /** 自动重连 */
  autoReconnect?: boolean
  /** 重连延迟（毫秒） */
  reconnectDelay?: number
  /** 最大重连次数 */
  maxReconnectAttempts?: number
  /** 重连策略 */
  reconnectStrategy?: 'linear' | 'exponential' | 'random'
  /** 最大重连延迟（毫秒），用于指数退避 */
  maxReconnectDelay?: number
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number
  /** 心跳消息 */
  heartbeatMessage?: any
  /** 心跳超时时间（毫秒） */
  heartbeatTimeout?: number
  /** 期望的心跳响应消息类型 */
  heartbeatResponseType?: string
  /** 连接超时（毫秒） */
  connectionTimeout?: number
  /** 消息确认超时（毫秒） */
  messageAckTimeout?: number
  /** 是否启用消息确认 */
  enableMessageAck?: boolean
  /** 调试模式 */
  debug?: boolean
  /** 自定义请求头（仅 Node.js 环境） */
  headers?: Record<string, string>
  /** 连接质量检查间隔（毫秒） */
  qualityCheckInterval?: number
}

/**
 * WebSocket 事件���型
 */
export type WebSocketEventType =
  | 'open'
  | 'close'
  | 'error'
  | 'message'
  | 'reconnect'
  | 'reconnecting'
  | 'reconnect_failed'
  | 'heartbeat_timeout'
  | 'quality_change'
  | 'message_ack'
  | 'message_timeout'

/**
 * WebSocket 事件监听器
 */
export type WebSocketEventListener<T = any> = (data?: T) => void

/**
 * 连接质量等级
 */
export enum ConnectionQuality {
  EXCELLENT = 'excellent',  // 延迟 < 100ms
  GOOD = 'good',            // 延迟 100-300ms
  FAIR = 'fair',            // 延迟 300-500ms
  POOR = 'poor',            // 延迟 > 500ms
  UNKNOWN = 'unknown'
}

/**
 * 连接统计信息
 */
export interface ConnectionStats {
  /** 连接时长（毫秒） */
  connectedDuration: number
  /** 发送消息数 */
  messagesSent: number
  /** 接收消息数 */
  messagesReceived: number
  /** 重连次数 */
  reconnectCount: number
  /** 平均延迟（毫秒） */
  averageLatency: number
  /** 当前延迟（毫秒） */
  currentLatency: number
  /** 连接质量 */
  quality: ConnectionQuality
  /** 丢失心跳数 */
  missedHeartbeats: number
}

/**
 * 待确认消息
 */
interface PendingMessage {
  id: string
  data: any
  timestamp: number
  resolve: (value: any) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

/**
 * WebSocket 客户端
 *
 * 提供 WebSocket 连接管理，支持自动重连、心跳检测、消息队列等功能
 *
 * @example
 * ```typescript
 * const wsClient = new WebSocketClient({
 *   url: 'ws://localhost:3000',
 *   autoReconnect: true,
 *   heartbeatInterval: 30000,
 * })
 *
 * // 监听消息
 * wsClient.on('message', (message) => {
 *   
 * })
 *
 * // 连接
 * await wsClient.connect()
 *
 * // 发送消息
 * wsClient.send({ type: 'chat', data: 'Hello' })
 *
 * // 断开连接
 * wsClient.disconnect()
 * ```
 */
export class WebSocketClient {
  private config: Omit<Required<WebSocketClientConfig>, 'protocols' | 'heartbeatResponseType'> & {
    protocols?: string | string[]
    heartbeatResponseType?: string
  }
  private ws: WebSocket | null = null
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED
  private eventListeners: Map<WebSocketEventType, Set<WebSocketEventListener>> = new Map()
  private messageQueue: any[] = []
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null
  private connectionTimer: ReturnType<typeof setTimeout> | null = null
  private qualityCheckTimer: ReturnType<typeof setInterval> | null = null
  
  // 连接统计
  private connectedAt: number = 0
  private messagesSent: number = 0
  private messagesReceived: number = 0
  private latencyHistory: number[] = []
  private lastHeartbeatSent: number = 0
  private lastHeartbeatReceived: number = 0
  private missedHeartbeats: number = 0
  private currentQuality: ConnectionQuality = ConnectionQuality.UNKNOWN
  
  // 消息确认
  private pendingMessages: Map<string, PendingMessage> = new Map()
  private messageIdCounter: number = 0

  constructor(config: WebSocketClientConfig) {
    this.config = {
      url: config.url,
      protocols: config.protocols,
      autoReconnect: config.autoReconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      reconnectStrategy: config.reconnectStrategy ?? 'exponential',
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      heartbeatMessage: config.heartbeatMessage ?? { type: 'ping' },
      heartbeatTimeout: config.heartbeatTimeout ?? 5000,
      heartbeatResponseType: config.heartbeatResponseType,
      connectionTimeout: config.connectionTimeout ?? 10000,
      messageAckTimeout: config.messageAckTimeout ?? 5000,
      enableMessageAck: config.enableMessageAck ?? false,
      debug: config.debug ?? false,
      headers: config.headers || {},
      qualityCheckInterval: config.qualityCheckInterval ?? 10000,
    }
  }

  /**
   * 连接 WebSocket
   */
  async connect(): Promise<void> {
    if (this.status === WebSocketStatus.CONNECTED || this.status === WebSocketStatus.CONNECTING) {
      this.log('Already connected or connecting')
      return
    }

    return new Promise((resolve, reject) => {
      this.status = WebSocketStatus.CONNECTING
      this.log(`Connecting to ${this.config?.url}`)

      try {
        this.ws = new WebSocket(this.config?.url, this.config?.protocols)

        // 连接超时处理
        this.connectionTimer = setTimeout(() => {
          if (this.status === WebSocketStatus.CONNECTING) {
            this.ws?.close()
            reject(new Error('Connection timeout'))
          }
        }, this.config?.connectionTimeout)

        this.ws.onopen = () => {
          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer)
            this.connectionTimer = null
          }

          this.status = WebSocketStatus.CONNECTED
          this.reconnectAttempts = 0
          this.connectedAt = Date.now()
          this.log('Connected')

          // 启动心跳
          this.startHeartbeat()
          
          // 启动连接质量检查
          this.startQualityCheck()

          // 发送队列中的消息
          this.flushMessageQueue()

          // 触发 open 事件
          this.emit('open')
          resolve()
        }

        this.ws.onclose = (event) => {
          this.log(`Disconnected: ${event.code} ${event.reason}`)
          this.handleDisconnection(event.code, event.reason)
        }

        this.ws.onerror = (error) => {
          this.log('Error:', error)
          this.status = WebSocketStatus.ERROR
          this.emit('error', error)
          reject(error)
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }
      }
      catch (error) {
        this.status = WebSocketStatus.ERROR
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(code = 1000, reason = 'Normal closure'): void {
    this.log(`Disconnecting: ${code} ${reason}`)

    // 清除定时器
    this.stopHeartbeat()
    this.stopQualityCheck()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }

    // 清除待确认消息
    this.pendingMessages.forEach((msg) => {
      clearTimeout(msg.timeout)
      msg.reject(new Error('Connection closed'))
    })
    this.pendingMessages.clear()

    // 关闭连接
    if (this.ws) {
      this.status = WebSocketStatus.DISCONNECTING
      this.ws.close(code, reason)
      this.ws = null
    }

    this.status = WebSocketStatus.DISCONNECTED
    this.emit('close', { code, reason })
  }

  /**
   * 发送消息
   */
  send(data: any): boolean {
    if (this.status !== WebSocketStatus.CONNECTED) {
      // 如果未连接，添加到队列
      this.messageQueue.push(data)
      this.log('Message queued (not connected)')
      return false
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      this.ws?.send(message)
      this.messagesSent++
      this.log('Message sent:', data)
      return true
    }
    catch (error) {
      this.log('Failed to send message:', error)
      return false
    }
  }

  /**
   * 发送消息并等待确认
   */
  async sendWithAck(data: any, timeout?: number): Promise<any> {
    if (!this.config.enableMessageAck) {
      throw new Error('Message acknowledgment is not enabled')
    }

    if (this.status !== WebSocketStatus.CONNECTED) {
      throw new Error('WebSocket is not connected')
    }

    return new Promise((resolve, reject) => {
      const messageId = `msg_${++this.messageIdCounter}_${Date.now()}`
      const messageWithId = {
        ...data,
        _id: messageId,
      }

      const timeoutMs = timeout || this.config.messageAckTimeout
      const timeoutTimer = setTimeout(() => {
        this.pendingMessages.delete(messageId)
        this.emit('message_timeout', { id: messageId, data })
        reject(new Error(`Message acknowledgment timeout: ${messageId}`))
      }, timeoutMs)

      this.pendingMessages.set(messageId, {
        id: messageId,
        data: messageWithId,
        timestamp: Date.now(),
        resolve,
        reject,
        timeout: timeoutTimer,
      })

      const sent = this.send(messageWithId)
      if (!sent) {
        clearTimeout(timeoutTimer)
        this.pendingMessages.delete(messageId)
        reject(new Error('Failed to send message'))
      }
    })
  }

  /**
   * 监听事件
   */
  on<T = any>(event: WebSocketEventType, listener: WebSocketEventListener<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener as WebSocketEventListener)

    // 返回取消监听函数
    return () => this.off(event, listener)
  }

  /**
   * 取消监听
   */
  off(event: WebSocketEventType, listener: WebSocketEventListener): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 监听一次事件
   */
  once<T = any>(event: WebSocketEventType, listener: WebSocketEventListener<T>): void {
    const wrappedListener = (data?: T) => {
      listener(data)
      this.off(event, wrappedListener)
    }
    this.on(event, wrappedListener)
  }

  /**
   * 获取连接状态
   */
  getStatus(): WebSocketStatus {
    return this.status
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.status === WebSocketStatus.CONNECTED
  }

  /**
   * 获取队列大小
   */
  getQueueSize(): number {
    return this.messageQueue.length
  }

  /**
   * 清空消息队列
   */
  clearQueue(): void {
    this.messageQueue = []
  }

  /**
   * 获取重连次数
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts
  }

  /**
   * 获取连接统计信息
   */
  getStats(): ConnectionStats {
    const now = Date.now()
    const connectedDuration = this.isConnected() ? now - this.connectedAt : 0
    
    return {
      connectedDuration,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      reconnectCount: this.reconnectAttempts,
      averageLatency: this.calculateAverageLatency(),
      currentLatency: this.latencyHistory[this.latencyHistory.length - 1] || 0,
      quality: this.currentQuality,
      missedHeartbeats: this.missedHeartbeats,
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.messagesSent = 0
    this.messagesReceived = 0
    this.latencyHistory = []
    this.missedHeartbeats = 0
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<WebSocketClientConfig>): void {
    Object.assign(this.config, config)

    // 如果已连接且修改了心跳配置，重新启动心跳
    if (this.isConnected() && (config.heartbeatInterval || config.heartbeatMessage)) {
      this.stopHeartbeat()
      this.startHeartbeat()
    }
    
    // 如果修改了质量检查配置，重新启动
    if (this.isConnected() && config.qualityCheckInterval) {
      this.stopQualityCheck()
      this.startQualityCheck()
    }
  }

  /**
   * 获取原生 WebSocket 实例
   */
  getWebSocket(): WebSocket | null {
    return this.ws
  }
  
  /**
   * 确认消息已接收
   */
  acknowledgeMessage(messageId: string, response?: any): void {
    const pending = this.pendingMessages.get(messageId)
    if (pending) {
      clearTimeout(pending.timeout)
      this.pendingMessages.delete(messageId)
      pending.resolve(response)
      this.emit('message_ack', { id: messageId, response })
    }
  }

  /**
   * 触发事件
   */
  private emit(event: WebSocketEventType, data?: any): void {
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
  private handleMessage(data: string | ArrayBuffer | Blob): void {
    this.messagesReceived++
    
    try {
      let message: any
      if (typeof data === 'string') {
        message = JSON.parse(data)
      }
      else {
        // 处理二进制数据
        message = data
      }

      this.log('Message received:', message)
      
      // 处理心跳响应
      if (this.config.heartbeatResponseType && message.type === this.config.heartbeatResponseType) {
        this.handleHeartbeatResponse()
        return
      }
      
      // 处理消息确认
      if (this.config.enableMessageAck && message._ack && message._id) {
        this.acknowledgeMessage(message._id, message.data)
        return
      }
      
      this.emit('message', message)
    }
    catch (error) {
      this.log('Failed to parse message:', error)
      this.emit('message', data)
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(code: number, reason: string): void {
    this.stopHeartbeat()
    this.status = WebSocketStatus.DISCONNECTED

    // 触发 close 事件
    this.emit('close', { code, reason })

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
    this.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.config?.maxReconnectAttempts})`)

    this.emit('reconnecting', { attempts: this.reconnectAttempts })

    const delay = this.calculateReconnectDelay()
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect()
        this.log('Reconnected successfully')
        this.emit('reconnect')
      }
      catch (error) {
        this.log('Reconnect failed:', error)
        // handleDisconnection 会处理下一次重连
      }
    }, delay)
  }
  
  /**
   * 计算重连延迟
   */
  private calculateReconnectDelay(): number {
    const { reconnectDelay, reconnectStrategy, maxReconnectDelay } = this.config
    
    switch (reconnectStrategy) {
      case 'linear':
        return reconnectDelay * this.reconnectAttempts
        
      case 'exponential':
        return Math.min(
          reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
          maxReconnectDelay
        )
        
      case 'random':
        return reconnectDelay + Math.random() * reconnectDelay * this.reconnectAttempts
        
      default:
        return reconnectDelay
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    if (this.config?.heartbeatInterval <= 0) {
      return
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.lastHeartbeatSent = Date.now()
        this.send(this.config?.heartbeatMessage)
        this.log('Heartbeat sent')
        
        // 设置心跳超时检测
        if (this.config.heartbeatTimeout > 0) {
          if (this.heartbeatTimeoutTimer) {
            clearTimeout(this.heartbeatTimeoutTimer)
          }
          
          this.heartbeatTimeoutTimer = setTimeout(() => {
            this.missedHeartbeats++
            this.log('Heartbeat timeout')
            this.emit('heartbeat_timeout', { missed: this.missedHeartbeats })
            
            // 如果连续丢失多个心跳，断开连接并重连
            if (this.missedHeartbeats >= 3) {
              this.log('Too many missed heartbeats, reconnecting...')
              this.ws?.close(1000, 'Heartbeat timeout')
            }
          }, this.config.heartbeatTimeout)
        }
      }
    }, this.config?.heartbeatInterval)
  }
  
  /**
   * 处理心跳响应
   */
  private handleHeartbeatResponse(): void {
    this.lastHeartbeatReceived = Date.now()
    this.missedHeartbeats = 0
    
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }
    
    // 记录延迟
    if (this.lastHeartbeatSent > 0) {
      const latency = this.lastHeartbeatReceived - this.lastHeartbeatSent
      this.latencyHistory.push(latency)
      
      // 只保留最近100次的延迟记录
      if (this.latencyHistory.length > 100) {
        this.latencyHistory.shift()
      }
    }
    
    this.log('Heartbeat received')
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }
  }
  
  /**
   * 启动连接质量检查
   */
  private startQualityCheck(): void {
    if (this.config.qualityCheckInterval <= 0) {
      return
    }
    
    this.qualityCheckTimer = setInterval(() => {
      const newQuality = this.assessConnectionQuality()
      if (newQuality !== this.currentQuality) {
        const oldQuality = this.currentQuality
        this.currentQuality = newQuality
        this.emit('quality_change', { from: oldQuality, to: newQuality })
        this.log(`Connection quality changed: ${oldQuality} -> ${newQuality}`)
      }
    }, this.config.qualityCheckInterval)
  }
  
  /**
   * 停止连接质量检查
   */
  private stopQualityCheck(): void {
    if (this.qualityCheckTimer) {
      clearInterval(this.qualityCheckTimer)
      this.qualityCheckTimer = null
    }
  }
  
  /**
   * 评估连接质量
   */
  private assessConnectionQuality(): ConnectionQuality {
    if (!this.isConnected()) {
      return ConnectionQuality.UNKNOWN
    }
    
    const avgLatency = this.calculateAverageLatency()
    
    if (avgLatency === 0) {
      return ConnectionQuality.UNKNOWN
    }
    
    if (avgLatency < 100) {
      return ConnectionQuality.EXCELLENT
    }
    else if (avgLatency < 300) {
      return ConnectionQuality.GOOD
    }
    else if (avgLatency < 500) {
      return ConnectionQuality.FAIR
    }
    else {
      return ConnectionQuality.POOR
    }
  }
  
  /**
   * 计算平均延迟
   */
  private calculateAverageLatency(): number {
    if (this.latencyHistory.length === 0) {
      return 0
    }
    
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.latencyHistory.length)
  }

  /**
   * 刷新消息队列
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return
    }

    this.log(`Flushing ${this.messageQueue.length} queued messages`)
    const queue = [...this.messageQueue]
    this.messageQueue = []

    queue.forEach((message) => {
      this.send(message)
    })
  }

  /**
   * 日志输出
   */
  private log(..._args: any[]): void {
    if (this.config?.debug) {
      // console.log('[WebSocket]', ...args)
    }
  }
}

/**
 * 创建 WebSocket 客户端
 */
export function createWebSocketClient(config: WebSocketClientConfig): WebSocketClient {
  return new WebSocketClient(config)
}
