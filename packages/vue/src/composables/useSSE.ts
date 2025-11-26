/**
 * useSSE - Server-Sent Events 封装
 * 
 * 提供响应式的 SSE 连接管理，支持自动重连、事件过滤、错误恢复等功能
 */

import { ref, onUnmounted, watch, computed, type Ref } from 'vue'

export interface UseSSEOptions {
  /** 是否立即连接 */
  immediate?: boolean
  /** 自动重连 */
  autoReconnect?: boolean
  /** 重连延迟（毫秒） */
  reconnectDelay?: number
  /** 最大重连次数 */
  maxReconnectAttempts?: number
  /** withCredentials */
  withCredentials?: boolean
  /** 连接成功回调 */
  onConnected?: (event: Event) => void
  /** 断开连接回调 */
  onDisconnected?: () => void
  /** 错误回调 */
  onError?: (event: Event) => void
  /** 消息回调 */
  onMessage?: (data: any, event: MessageEvent) => void
}

export interface UseSSEReturn<T = any> {
  /** EventSource 实例 */
  eventSource: Ref<EventSource | null>
  /** 连接状态 */
  status: Ref<'CONNECTING' | 'OPEN' | 'CLOSED'>
  /** 最新消息 */
  data: Ref<T | null>
  /** 是否已连接 */
  isConnected: Ref<boolean>
  /** 接收的消息数 */
  receivedMessageCount: Ref<number>
  /** 重连次数 */
  reconnectAttempts: Ref<number>
  /** 最后一个事件 ID */
  lastEventId: Ref<string>
  /** 打开连接 */
  open: () => void
  /** 关闭连接 */
  close: () => void
  /** 重新连接 */
  reconnect: () => void
  /** 监听特定事件类型 */
  on: (eventType: string, handler: (event: MessageEvent) => void) => () => void
}

/**
 * useSSE Hook
 */
export function useSSE<T = any>(
  url: string | Ref<string>,
  options: UseSSEOptions = {}
): UseSSEReturn<T> {
  const {
    immediate = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    withCredentials = false,
    onConnected,
    onDisconnected,
    onError,
    onMessage,
  } = options

  // 响应式状态
  const eventSource = ref<EventSource | null>(null)
  const status = ref<'CONNECTING' | 'OPEN' | 'CLOSED'>('CLOSED')
  const data = ref(null) as Ref<T | null>
  const receivedMessageCount = ref(0)
  const reconnectAttempts = ref(0)
  const lastEventId = ref('')

  // 计算属性
  const isConnected = computed(() => status.value === 'OPEN')

  // 内部状态
  let reconnectTimer: number | undefined
  let explicitlyClosed = false
  const eventHandlers = new Map<string, Set<(event: MessageEvent) => void>>()

  /**
   * 解析消息数据
   */
  function parseMessageData(rawData: string): any {
    try {
      return JSON.parse(rawData)
    } catch {
      return rawData
    }
  }

  /**
   * 触发事件处理器
   */
  function triggerEventHandlers(eventType: string, event: MessageEvent) {
    const handlers = eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`[useSSE] 事件处理器错误 (${eventType}):`, error)
        }
      })
    }
  }

  /**
   * 监听特定事件类型
   */
  function on(eventType: string, handler: (event: MessageEvent) => void): () => void {
    // 添加处理器到映射
    if (!eventHandlers.has(eventType)) {
      eventHandlers.set(eventType, new Set())
    }
    eventHandlers.get(eventType)!.add(handler)

    // 如果 EventSource 已存在，立即注册
    if (eventSource.value) {
      eventSource.value.addEventListener(eventType, handler as EventListener)
    }

    // 返回取消订阅函数
    return () => {
      const handlers = eventHandlers.get(eventType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          eventHandlers.delete(eventType)
        }
      }

      if (eventSource.value) {
        eventSource.value.removeEventListener(eventType, handler as EventListener)
      }
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
      console.warn('[useSSE] 已达到最大重连次数')
      return
    }

    reconnectAttempts.value++
    console.log(`[useSSE] 尝试重连 (${reconnectAttempts.value}/${maxReconnectAttempts})`)

    reconnectTimer = window.setTimeout(() => {
      open()
    }, reconnectDelay)
  }

  /**
   * 打开连接
   */
  function open() {
    if (eventSource.value && eventSource.value.readyState !== EventSource.CLOSED) {
      return
    }

    explicitlyClosed = false
    const urlValue = typeof url === 'string' ? url : url.value

    try {
      // 创建 EventSource
      eventSource.value = new EventSource(urlValue, {
        withCredentials,
      })

      status.value = 'CONNECTING'

      // 连接成功
      eventSource.value.onopen = (event) => {
        status.value = 'OPEN'
        reconnectAttempts.value = 0
        onConnected?.(event)
      }

      // 接收消息
      eventSource.value.onmessage = (event) => {
        try {
          const parsedData = parseMessageData(event.data)
          data.value = parsedData
          receivedMessageCount.value++
          lastEventId.value = event.lastEventId

          onMessage?.(parsedData, event)
          triggerEventHandlers('message', event)
        } catch (error) {
          console.error('[useSSE] 解析消息失败:', error)
        }
      }

      // 连接错误
      eventSource.value.onerror = (event) => {
        console.error('[useSSE] SSE 错误:', event)
        onError?.(event)

        // 连接失败，尝试重连
        if (eventSource.value?.readyState === EventSource.CLOSED) {
          status.value = 'CLOSED'
          if (!explicitlyClosed && autoReconnect) {
            reconnect()
          }
        }
      }

      // 注册所有已存在的事件处理器
      eventHandlers.forEach((handlers, eventType) => {
        handlers.forEach(handler => {
          eventSource.value?.addEventListener(eventType, handler as EventListener)
        })
      })
    } catch (error) {
      console.error('[useSSE] 创建 EventSource 失败:', error)
      status.value = 'CLOSED'
    }
  }

  /**
   * 关闭连接
   */
  function close() {
    explicitlyClosed = true

    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer)
      reconnectTimer = undefined
    }

    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
      status.value = 'CLOSED'
      onDisconnected?.()
    }
  }

  // 监听 URL 变化
  if (typeof url !== 'string') {
    watch(url, (newUrl, oldUrl) => {
      if (newUrl !== oldUrl && eventSource.value) {
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
    eventHandlers.clear()
  })

  return {
    eventSource,
    status,
    data,
    isConnected,
    receivedMessageCount,
    reconnectAttempts,
    lastEventId,
    open,
    close,
    reconnect,
    on,
  }
}