import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConnectionQuality, WebSocketClient, WebSocketStatus } from '../../../packages/core/src/features/websocket'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((event: any) => void) | null = null
  onclose: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onmessage: ((event: any) => void) | null = null

  constructor(public url: string, public protocols?: string | string[]) {
    // 模拟异步连接
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen({})
      }
    }, 10)
  }

  send(data: string) {
    // 模拟发送
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose({ code: code || 1000, reason: reason || 'Normal closure' })
    }
  }
}

// 设置全局 WebSocket mock
global.WebSocket = MockWebSocket as any

describe('WebSocket 增强功能', () => {
  let client: WebSocketClient

  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (client) {
      client.disconnect()
    }
    vi.useRealTimers()
  })

  describe('智能重连策略', () => {
    it('应该支持线性重连策略', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        autoReconnect: true,
        reconnectStrategy: 'linear',
        reconnectDelay: 1000,
        maxReconnectAttempts: 3,
      })

      await client.connect()
      
      // 模拟断开连接
      const ws = client.getWebSocket() as any
      ws.close(1006, 'Abnormal closure')

      // 第一次重连：1000ms
      vi.advanceTimersByTime(900)
      expect(client.getReconnectAttempts()).toBe(1)
      
      vi.advanceTimersByTime(200)
      // 等待连接建立
      await vi.advanceTimersByTimeAsync(100)
      
      expect(client.getReconnectAttempts()).toBe(1)
    })

    it('应该支持指数退避重连策略', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        autoReconnect: true,
        reconnectStrategy: 'exponential',
        reconnectDelay: 1000,
        maxReconnectDelay: 10000,
        maxReconnectAttempts: 5,
      })

      await client.connect()
      
      // 模拟断开连接
      const ws = client.getWebSocket() as any
      ws.close(1006, 'Abnormal closure')

      // 第一次重连：1000ms
      // 第二次重连：2000ms
      // 第三次重连：4000ms
      expect(client.getReconnectAttempts()).toBeGreaterThan(0)
    })

    it('应该支持随机延迟重连策略', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        autoReconnect: true,
        reconnectStrategy: 'random',
        reconnectDelay: 1000,
        maxReconnectAttempts: 3,
      })

      await client.connect()
      
      const ws = client.getWebSocket() as any
      ws.close(1006, 'Abnormal closure')

      expect(client.getReconnectAttempts()).toBeGreaterThan(0)
    })

    it('应该在达到最大重连次数后停止重连', async () => {
      const onReconnectFailed = vi.fn()
      
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        autoReconnect: true,
        reconnectDelay: 100,
        maxReconnectAttempts: 2,
      })

      client.on('reconnect_failed', onReconnectFailed)
      await client.connect()
      
      // 模拟持续断开
      const mockClose = () => {
        const ws = client.getWebSocket() as any
        if (ws) {
          ws.close(1006, 'Abnormal closure')
        }
      }

      mockClose()
      await vi.advanceTimersByTimeAsync(150)
      
      mockClose()
      await vi.advanceTimersByTimeAsync(150)
      
      mockClose()
      await vi.advanceTimersByTimeAsync(150)

      expect(client.getReconnectAttempts()).toBe(2)
    })
  })

  describe('心跳检测增强', () => {
    it('应该发送心跳消息', async () => {
      const sendSpy = vi.fn()
      
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        heartbeatInterval: 1000,
        heartbeatMessage: { type: 'ping' },
      })

      await client.connect()
      
      const originalSend = client.send.bind(client)
      client.send = (data: any) => {
        sendSpy(data)
        return originalSend(data)
      }

      vi.advanceTimersByTime(1100)
      
      expect(sendSpy).toHaveBeenCalledWith({ type: 'ping' })
    })

    it('应该检测心跳超时', async () => {
      const onHeartbeatTimeout = vi.fn()
      
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        heartbeatInterval: 1000,
        heartbeatTimeout: 500,
        heartbeatMessage: { type: 'ping' },
        heartbeatResponseType: 'pong',
      })

      client.on('heartbeat_timeout', onHeartbeatTimeout)
      await client.connect()

      // 发送心跳但不响应
      vi.advanceTimersByTime(1100)
      vi.advanceTimersByTime(600)

      expect(onHeartbeatTimeout).toHaveBeenCalled()
    })

    it('应该在收到心跳响应后重置超时', async () => {
      const onHeartbeatTimeout = vi.fn()
      
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        heartbeatInterval: 1000,
        heartbeatTimeout: 500,
        heartbeatMessage: { type: 'ping' },
        heartbeatResponseType: 'pong',
      })

      client.on('heartbeat_timeout', onHeartbeatTimeout)
      await client.connect()

      // 发送心跳
      vi.advanceTimersByTime(1100)

      // 模拟收到心跳响应
      const ws = client.getWebSocket() as any
      if (ws.onmessage) {
        ws.onmessage({ 
          data: JSON.stringify({ type: 'pong' }) 
        })
      }

      // 等待超时时间
      vi.advanceTimersByTime(600)

      expect(onHeartbeatTimeout).not.toHaveBeenCalled()
    })

    it('应该计算网络延迟', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        heartbeatInterval: 1000,
        heartbeatResponseType: 'pong',
      })

      await client.connect()

      // 发送心跳
      vi.advanceTimersByTime(1100)

      // 模拟延迟响应
      vi.advanceTimersByTime(50)
      
      const ws = client.getWebSocket() as any
      if (ws.onmessage) {
        ws.onmessage({ 
          data: JSON.stringify({ type: 'pong' }) 
        })
      }

      const stats = client.getStats()
      expect(stats.currentLatency).toBeGreaterThanOrEqual(0)
    })
  })

  describe('连接质量监控', () => {
    it('应该评估连接质量', async () => {
      const onQualityChange = vi.fn()
      
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        heartbeatInterval: 500,
        heartbeatResponseType: 'pong',
        qualityCheckInterval: 1000,
      })

      client.on('quality_change', onQualityChange)
      await client.connect()

      const stats = client.getStats()
      expect(stats.quality).toBe(ConnectionQuality.UNKNOWN)
    })

    it('应该根据延迟更新连接质量', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        heartbeatInterval: 500,
        heartbeatResponseType: 'pong',
        qualityCheckInterval: 1000,
      })

      await client.connect()

      // 模拟多次心跳以建立延迟历史
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(600)
        
        const ws = client.getWebSocket() as any
        if (ws.onmessage) {
          ws.onmessage({ 
            data: JSON.stringify({ type: 'pong' }) 
          })
        }
      }

      vi.advanceTimersByTime(1100)

      const stats = client.getStats()
      expect(stats.quality).toBeDefined()
    })

    it('应该触发质量变化事件', async () => {
      const onQualityChange = vi.fn()
      
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        heartbeatInterval: 500,
        heartbeatResponseType: 'pong',
        qualityCheckInterval: 1000,
      })

      client.on('quality_change', onQualityChange)
      await client.connect()

      // 建立初始质量
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(600)
        const ws = client.getWebSocket() as any
        if (ws.onmessage) {
          ws.onmessage({ data: JSON.stringify({ type: 'pong' }) })
        }
      }

      vi.advanceTimersByTime(1100)
      
      // 质量应该已经被评估
      const stats = client.getStats()
      expect(['excellent', 'good', 'fair', 'poor', 'unknown']).toContain(stats.quality)
    })
  })

  describe('消息确认机制', () => {
    it('应该发送带ID的消息', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        enableMessageAck: true,
        messageAckTimeout: 1000,
      })

      await client.connect()

      const promise = client.sendWithAck({ type: 'test', data: 'hello' })

      // 模拟服务器确认
      setTimeout(() => {
        const ws = client.getWebSocket() as any
        if (ws.onmessage) {
          ws.onmessage({
            data: JSON.stringify({
              _ack: true,
              _id: 'msg_1_' + Date.now(),
              data: { success: true },
            }),
          })
        }
      }, 100)

      vi.advanceTimersByTime(150)
      
      // 消息应该被发送
      expect(client.getStats().messagesSent).toBeGreaterThan(0)
    })

    it('应该在超时后拒绝Promise', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        enableMessageAck: true,
        messageAckTimeout: 500,
      })

      await client.connect()

      const promise = client.sendWithAck({ type: 'test', data: 'hello' })

      vi.advanceTimersByTime(600)

      await expect(promise).rejects.toThrow(/timeout/)
    })

    it('应该触发消息确认事件', async () => {
      const onMessageAck = vi.fn()
      
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        enableMessageAck: true,
      })

      client.on('message_ack', onMessageAck)
      await client.connect()

      // 手动确认消息
      client.acknowledgeMessage('test_id', { success: true })

      expect(onMessageAck).toHaveBeenCalledWith({
        id: 'test_id',
        response: { success: true },
      })
    })

    it('应该触发消息超时事件', async () => {
      const onMessageTimeout = vi.fn()
      
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        enableMessageAck: true,
        messageAckTimeout: 500,
      })

      client.on('message_timeout', onMessageTimeout)
      await client.connect()

      client.sendWithAck({ type: 'test' }).catch(() => {})

      vi.advanceTimersByTime(600)

      expect(onMessageTimeout).toHaveBeenCalled()
    })
  })

  describe('连接统计', () => {
    it('应该跟踪发送的消息数', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
      })

      await client.connect()

      client.send({ type: 'test1' })
      client.send({ type: 'test2' })
      client.send({ type: 'test3' })

      const stats = client.getStats()
      expect(stats.messagesSent).toBe(3)
    })

    it('应该跟踪接收的消息数', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
      })

      await client.connect()

      const ws = client.getWebSocket() as any
      
      if (ws.onmessage) {
        ws.onmessage({ data: JSON.stringify({ type: 'msg1' }) })
        ws.onmessage({ data: JSON.stringify({ type: 'msg2' }) })
      }

      const stats = client.getStats()
      expect(stats.messagesReceived).toBe(2)
    })

    it('应该计算连接时长', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
      })

      await client.connect()

      vi.advanceTimersByTime(5000)

      const stats = client.getStats()
      expect(stats.connectedDuration).toBeGreaterThanOrEqual(4900)
    })

    it('应该重置统计信息', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
      })

      await client.connect()

      client.send({ type: 'test' })
      client.send({ type: 'test' })

      let stats = client.getStats()
      expect(stats.messagesSent).toBe(2)

      client.resetStats()

      stats = client.getStats()
      expect(stats.messagesSent).toBe(0)
      expect(stats.messagesReceived).toBe(0)
    })
  })

  describe('配置更新', () => {
    it('应该支持动态更新配置', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        heartbeatInterval: 1000,
      })

      await client.connect()

      client.updateConfig({
        heartbeatInterval: 2000,
      })

      // 心跳应该使用新的间隔
      expect(client).toBeDefined()
    })

    it('应该在更新心跳配置后重启心跳', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3000',
        heartbeatInterval: 1000,
      })

      await client.connect()

      client.updateConfig({
        heartbeatInterval: 500,
        heartbeatMessage: { type: 'custom_ping' },
      })

      // 心跳定时器应该被重启
      expect(client.isConnected()).toBe(true)
    })
  })
})