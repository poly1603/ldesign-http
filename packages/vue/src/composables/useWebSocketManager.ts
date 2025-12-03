/**
 * useWebSocketManager - 全局 WebSocket 管理器
 * 
 * 提供全局 WebSocket 连接管理、消息订阅/发布机制
 * 
 * @module composables/useWebSocketManager
 */

import { ref, reactive, onUnmounted, type Ref } from 'vue'
import { useWebSocket, type UseWebSocketOptions, type UseWebSocketReturn } from './useWebSocket'

/**
 * 消息订阅回调函数类型
 */
export type MessageSubscriber<T = any> = (data: T, event: MessageEvent) => void

/**
 * WebSocket 连接配置
 */
export interface WebSocketConnectionConfig extends UseWebSocketOptions {
  /** 连接 ID */
  id: string
  /** WebSocket URL */
  url: string
}

/**
 * WebSocket 管理器配置
 */
export interface WebSocketManagerOptions {
  /** 是否自动清理未使用的连接 */
  autoCleanup?: boolean
  /** 清理间隔（毫秒） */
  cleanupInterval?: number
  /** 最大连接数 */
  maxConnections?: number
}

/**
 * WebSocket 连接信息
 */
interface ConnectionInfo<T = any> {
  /** 连接实例 */
  instance: UseWebSocketReturn<T>
  /** 订阅者列表 */
  subscribers: Set<MessageSubscriber<T>>
  /** 最后活跃时间 */
  lastActiveAt: number
  /** 引用计数 */
  refCount: number
}

/**
 * 全局 WebSocket 管理器实例
 */
let globalManager: WebSocketManager | null = null

/**
 * WebSocket 管理器类
 * 
 * 特点：
 * - 管理多个 WebSocket 连接
 * - 消息订阅/发布机制
 * - 连接池管理
 * - 自动清理未使用的连接
 * 
 * @example
 * ```typescript
 * const manager = new WebSocketManager({
 *   autoCleanup: true,
 *   cleanupInterval: 60000,
 *   maxConnections: 10
 * })
 * 
 * // 创建连接
 * const connection = manager.connect('chat', 'ws://localhost:3000/chat', {
 *   autoReconnect: true
 * })
 * 
 * // 订阅消息
 * const unsubscribe = manager.subscribe('chat', (data) => {
 *   console.log('收到消息:', data)
 * })
 * 
 * // 发送消息
 * manager.send('chat', { type: 'message', content: 'Hello' })
 * 
 * // 取消订阅
 * unsubscribe()
 * 
 * // 断开连接
 * manager.disconnect('chat')
 * ```
 */
export class WebSocketManager {
  private connections = new Map<string, ConnectionInfo>()
  private options: Required<WebSocketManagerOptions>
  private cleanupTimer?: ReturnType<typeof setInterval>

  constructor(options: WebSocketManagerOptions = {}) {
    this.options = {
      autoCleanup: true,
      cleanupInterval: 60000, // 1 分钟
      maxConnections: 10,
      ...options,
    }

    // 启动自动清理
    if (this.options.autoCleanup) {
      this.startAutoCleanup()
    }
  }

  /**
   * 创建或获取 WebSocket 连接
   * 
   * @param id - 连接 ID
   * @param url - WebSocket URL
   * @param options - 连接配置
   * @returns WebSocket 连接实例
   */
  connect<T = any>(
    id: string,
    url: string,
    options: UseWebSocketOptions = {}
  ): UseWebSocketReturn<T> {
    // 如果连接已存在，增加引用计数并返回
    const existing = this.connections.get(id)
    if (existing) {
      existing.refCount++
      existing.lastActiveAt = Date.now()
      return existing.instance as UseWebSocketReturn<T>
    }

    // 检查连接数限制
    if (this.connections.size >= this.options.maxConnections) {
      throw new Error(`[WebSocketManager] 连接数已达上限 (${this.options.maxConnections})`)
    }

    // 创建新连接
    const instance = useWebSocket<T>(url, {
      ...options,
      onMessage: (data, event) => {
        // 触发所有订阅者
        const conn = this.connections.get(id)
        if (conn) {
          conn.subscribers.forEach(subscriber => subscriber(data, event))
        }
        // 调用原始回调
        options.onMessage?.(data, event)
      },
    })

    // 保存连接信息
    this.connections.set(id, {
      instance,
      subscribers: new Set(),
      lastActiveAt: Date.now(),
      refCount: 1,
    })

    return instance
  }

  /**
   * 订阅消息
   *
   * @param id - 连接 ID
   * @param subscriber - 订阅回调函数
   * @returns 取消订阅函数
   */
  subscribe<T = any>(id: string, subscriber: MessageSubscriber<T>): () => void {
    const conn = this.connections.get(id)
    if (!conn) {
      throw new Error(`[WebSocketManager] 连接不存在: ${id}`)
    }

    conn.subscribers.add(subscriber as MessageSubscriber)
    conn.lastActiveAt = Date.now()

    // 返回取消订阅函数
    return () => {
      conn.subscribers.delete(subscriber as MessageSubscriber)
    }
  }

  /**
   * 发送消息
   *
   * @param id - 连接 ID
   * @param data - 消息数据
   * @param useQueue - 是否使用队列
   * @returns 是否发送成功
   */
  send(id: string, data: any, useQueue = true): boolean {
    const conn = this.connections.get(id)
    if (!conn) {
      console.warn(`[WebSocketManager] 连接不存在: ${id}`)
      return false
    }

    conn.lastActiveAt = Date.now()
    return conn.instance.send(data, useQueue)
  }

  /**
   * 断开连接
   *
   * @param id - 连接 ID
   * @param force - 是否强制断开（忽略引用计数）
   */
  disconnect(id: string, force = false): void {
    const conn = this.connections.get(id)
    if (!conn) {
      return
    }

    // 减少引用计数
    conn.refCount--

    // 如果引用计数为 0 或强制断开，则关闭连接
    if (force || conn.refCount <= 0) {
      conn.instance.close()
      this.connections.delete(id)
    }
  }

  /**
   * 断开所有连接
   */
  disconnectAll(): void {
    this.connections.forEach((conn, id) => {
      conn.instance.close()
    })
    this.connections.clear()
  }

  /**
   * 获取连接状态
   *
   * @param id - 连接 ID
   * @returns 连接状态
   */
  getStatus(id: string): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | null {
    const conn = this.connections.get(id)
    return conn ? conn.instance.status.value : null
  }

  /**
   * 检查连接是否存在
   *
   * @param id - 连接 ID
   * @returns 是否存在
   */
  hasConnection(id: string): boolean {
    return this.connections.has(id)
  }

  /**
   * 获取所有连接 ID
   *
   * @returns 连接 ID 列表
   */
  getConnectionIds(): string[] {
    return Array.from(this.connections.keys())
  }

  /**
   * 获取连接统计信息
   *
   * @returns 统计信息
   */
  getStats() {
    const stats = {
      totalConnections: this.connections.size,
      activeConnections: 0,
      totalSubscribers: 0,
      connections: [] as Array<{
        id: string
        status: string
        subscribers: number
        refCount: number
        lastActiveAt: number
      }>,
    }

    this.connections.forEach((conn, id) => {
      if (conn.instance.isConnected.value) {
        stats.activeConnections++
      }
      stats.totalSubscribers += conn.subscribers.size

      stats.connections.push({
        id,
        status: conn.instance.status.value,
        subscribers: conn.subscribers.size,
        refCount: conn.refCount,
        lastActiveAt: conn.lastActiveAt,
      })
    })

    return stats
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      const timeout = this.options.cleanupInterval * 2 // 2 倍清理间隔作为超时时间

      this.connections.forEach((conn, id) => {
        // 清理未使用且已超时的连接
        if (
          conn.refCount <= 0
          && conn.subscribers.size === 0
          && now - conn.lastActiveAt > timeout
        ) {
          console.log(`[WebSocketManager] 自动清理连接: ${id}`)
          conn.instance.close()
          this.connections.delete(id)
        }
      })
    }, this.options.cleanupInterval)
  }

  /**
   * 停止自动清理
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stopAutoCleanup()
    this.disconnectAll()
  }
}

/**
 * 获取全局 WebSocket 管理器实例
 *
 * @param options - 管理器配置（仅在首次调用时生效）
 * @returns 管理器实例
 */
export function getWebSocketManager(options?: WebSocketManagerOptions): WebSocketManager {
  if (!globalManager) {
    globalManager = new WebSocketManager(options)
  }
  return globalManager
}

/**
 * useWebSocketManager - 在组件中使用 WebSocket 管理器
 *
 * @param options - 管理器配置
 * @returns 管理器实例和辅助方法
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWebSocketManager } from '@ldesign/http-vue'
 *
 * const { manager, connect, subscribe, send, disconnect } = useWebSocketManager()
 *
 * // 连接
 * const ws = connect('chat', 'ws://localhost:3000/chat', {
 *   autoReconnect: true
 * })
 *
 * // 订阅消息
 * const unsubscribe = subscribe('chat', (data) => {
 *   console.log('收到消息:', data)
 * })
 *
 * // 发送消息
 * function sendMessage(content: string) {
 *   send('chat', { type: 'message', content })
 * }
 * </script>
 * ```
 */
export function useWebSocketManager(options?: WebSocketManagerOptions) {
  const manager = getWebSocketManager(options)

  // 组件卸载时不自动断开连接（由引用计数管理）
  // 但会清理订阅
  const subscriptions: Array<() => void> = []

  onUnmounted(() => {
    subscriptions.forEach(unsubscribe => unsubscribe())
    subscriptions.length = 0
  })

  return {
    /** 管理器实例 */
    manager,

    /**
     * 连接 WebSocket
     */
    connect: <T = any>(id: string, url: string, opts?: UseWebSocketOptions) => {
      return manager.connect<T>(id, url, opts)
    },

    /**
     * 订阅消息
     */
    subscribe: <T = any>(id: string, subscriber: MessageSubscriber<T>) => {
      const unsubscribe = manager.subscribe(id, subscriber)
      subscriptions.push(unsubscribe)
      return unsubscribe
    },

    /**
     * 发送消息
     */
    send: (id: string, data: any, useQueue = true) => {
      return manager.send(id, data, useQueue)
    },

    /**
     * 断开连接
     */
    disconnect: (id: string, force = false) => {
      manager.disconnect(id, force)
    },

    /**
     * 获取连接状态
     */
    getStatus: (id: string) => {
      return manager.getStatus(id)
    },

    /**
     * 获取统计信息
     */
    getStats: () => {
      return manager.getStats()
    },
  }
}

