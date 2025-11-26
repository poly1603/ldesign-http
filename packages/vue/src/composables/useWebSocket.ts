/**
 * useWebSocket - WebSocket 封装
 * 
 * 提供响应式的 WebSocket 连接管理，支持自动重连、心跳检测、消息队列等功能
 */

import { ref, onUnmounted, watch, computed, type Ref } from 'vue'

export interface UseWebSocketOptions {
  /** 是否立即连接 */
  immediate?: boolean
  /** 自动重连 */
  autoReconnect?: boolean
  /** 重连延迟（毫秒） */
  reconnectDelay?: number
  /** 最大重连次数 */
  maxReconnectAttempts?: number
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number
  /** 心跳消息 */
  heartbeatMessage?: string | (() => string)
  /** 连接超时（毫秒） */
  connectionTimeout?: number
  /** 支持的协议 */
  protocols?: string | string[]
  /** 消息序列化 */
  serializer?: (data: any) => string
  /** 消息反序列化 */
  deserializer?: (data: string) => any
  /** 连接成功回调 */
  onConnected?: (event: Event) => void
  /** 断开连接回调 */
  onDisconnected?: (event: CloseEvent) => void
  /** 错误回调 */
  onError?: (event: Event) => void
  /** 消息回调 */
  onMessage?: (data: any, event: MessageEvent) => void
}

export interface UseWebSocketReturn<T = any> {
  /** WebSocket 实例 */
  ws: Ref<WebSocket | null>
  /** 连接状态 */
  status: Ref<'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'>
  /** 最新消息 */
  data: Ref<T | null>
  /** 是否已连接 */
  isConnected: Ref<boolean>
  /** 发送的消息数 */
  sentMessageCount: Ref<number>
  /** 接收的消息数 */
  receivedMessageCount: Ref<number>
  /** 重连次数 */
  reconnectAttempts: Ref<number>
  /** 发送消息 */
  send: (data: any, useQueue?: boolean) => boolean
  /** 打开连接 */
  open: () => void
  /** 关闭连接 */
  close: (code?: number, reason?: string) => void
  /** 重新连接 */
  reconnect: () => void
}

/**
 * 默认序列化器
 */
function defaultSerializer(data: any): string {
  if (typeof data === 'string') {
    return data
  }
  return JSON.stringify(data)
}

/**
 * 默认反序列化器
 */
function defaultDeserializer(data: string): any {
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

/**
 * useWebSocket Hook
 */
export function useWebSocket<T = any>(
  url: string | Ref<string>,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn<T> {
  const {
    immediate = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    heartbeatMessage = 'ping',
    connectionTimeout = 10000,
    protocols,
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
    onConnected,
    onDisconnected,
    onError,
    onMessage,
  } = options

  // 响应式状态
  const ws = ref<WebSocket | null>(null)
  const status = ref<'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'>('CLOSED')
  const data = ref<T | null>(null)
  const sentMessageCount = ref(0)
  const receivedMessageCount = ref(0)
  const reconnectAttempts = ref(0)

  // 计算属性
  const isConnected = computed(() => status.value === 'OPEN')

  // 内部状态
  let heartbeatTimer: number | undefined
  let reconnectTimer: number | undefined
  let connectionTimer: number | undefined
  let messageQueue: any[] = []
  let explicitlyClosed = false

  /**
   * 启动心跳
   */
  function startHeartbeat() {
    if (!heartbeatInterval || heartbeatInterval <= 0) return

    stopHeartbeat()
    heartbeatTimer = window.setInterval(() => {
      if (ws.value && ws.value.readyState === WebSocket.OPEN) {
        const message = typeof heartbeatMessage === 'function'
          ? heartbeatMessage()
          : heartbeatMessage
        send(message, false)
      }
    }, heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  function stopHeartbeat() {
    if (heartbeatTimer !== undefined) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = undefined
    }
  }

  /**
   * 发送消息队列中的消息
   */
  function sendQueuedMessages() {
    if (messageQueue.length === 0 || !ws.value || ws.value.readyState !== WebSocket.OPEN) {
      return
    }

    const queue = [...messageQueue]
    messageQueue = []

    queue.forEach(item => {
      send(item, false)
    })
  }

  /**
   * 发送消息
   */
  function send(message: any, useQueue = true): boolean {
    if (!ws.value) {
      if (useQueue) {
        messageQueue.push(message)
      }
      return false
    }

    if (ws.value.readyState === WebSocket.CONNECTING) {
      if (useQueue) {
        messageQueue.push(message)
      }
      return false
    }

    if (ws.value.readyState !== WebSocket.OPEN) {
      return false
    }

    try {
      const serialized = serializer(message)
      ws.value.send(serialized)
      sentMessageCount.value++
      return true
    } catch (error) {
      console.error('[useWebSocket] 发送消息失败:', error)
      return false
    }
  }

  /**
   * 重新连接
   */
  function reconnect() {
    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer)
      reconnectTimer = undefined
    }

    if (!autoReconnect || reconnectAttempts.value >= maxReconnectAttempts) {
      console.warn('[useWebSocket] 已达到最大重连次数')
      return
    }

    reconnectAttempts.value++
    console.log(`[useWebSocket] 尝试重连 (${reconnectAttempts.value}/${maxReconnectAttempts})`)

    reconnectTimer = window.setTimeout(() => {
      open()
    }, reconnectDelay)
  }

  /**
   * 打开连接
   */
  function open() {
    if (ws.value && ws.value.readyState !== WebSocket.CLOSED) {
      return
    }

    explicitlyClosed = false
    const urlValue = typeof url === 'string' ? url : url.value

    try {
      ws.value = protocols
        ? new WebSocket(urlValue, protocols)
        : new WebSocket(urlValue)

      status.value = 'CONNECTING'

      // 连接超时
      if (connectionTimeout > 0) {
        connectionTimer = window.setTimeout(() => {
          if (ws.value && ws.value.readyState === WebSocket.CONNECTING) {
            console.warn('[useWebSocket] 连接超时')
            ws.value.close()
          }
        }, connectionTimeout)
      }

      // 连接成功
      ws.value.onopen = (event) => {
        if (connectionTimer !== undefined) {
          clearTimeout(connectionTimer)
          connectionTimer = undefined
        }

        status.value = 'OPEN'
        reconnectAttempts.value = 0
        onConnected?.(event)

        // 启动心跳
        startHeartbeat()

        // 发送队列中的消息
        sendQueuedMessages()
      }

      // 接收消息
      ws.value.onmessage = (event) => {
        try {
          const parsedData = deserializer(event.data)
          data.value = parsedData
          receivedMessageCount.value++
          onMessage?.(parsedData, event)
        } catch (error) {
          console.error('[useWebSocket] 解析消息失败:', error)
        }
      }

      // 连接关闭
      ws.value.onclose = (event) => {
        status.value = 'CLOSED'
        stopHeartbeat()
        onDisconnected?.(event)

        if (!explicitlyClosed && autoReconnect) {
          reconnect()
        }
      }

      // 连接错误
      ws.value.onerror = (event) => {
        console.error('[useWebSocket] WebSocket 错误:', event)
        onError?.(event)
      }
    } catch (error) {
      console.error('[useWebSocket] 创建 WebSocket 失败:', error)
      status.value = 'CLOSED'
    }
  }

  /**
   * 关闭连接
   */
  function close(code?: number, reason?: string) {
    explicitlyClosed = true
    stopHeartbeat()

    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer)
      reconnectTimer = undefined
    }

    if (connectionTimer !== undefined) {
      clearTimeout(connectionTimer)
      connectionTimer = undefined
    }

    if (ws.value) {
      status.value = 'CLOSING'
      ws.value.close(code, reason)
      ws.value = null
    }

    messageQueue = []
  }

  // 监听 URL 变化
  if (typeof url !== 'string') {
    watch(url, (newUrl, oldUrl) => {
      if (newUrl !== oldUrl && ws.value) {
        close()
        open()
      }
    })
  }

  // 立即连接
  if (immediate) {
    open()
  }

  // 组件卸载时清理
  onUnmounted(() => {
    close()
  })

  return {
    ws,
    status,
    data,
    isConnected,
    sentMessageCount,
    receivedMessageCount,
    reconnectAttempts,
    send,
    open,
    close,
    reconnect,
  }
}