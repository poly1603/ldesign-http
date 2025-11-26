import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConnectionQuality,
  ReconnectStrategy,
  SSEClient,
  SSEStatus,
  createBasicSSEClient,
  createSSEClient,
} from '../../../packages/core/src/features/sse'

// Mock EventSource
class MockEventSource {
  url: string
  withCredentials: boolean
  readyState: number = 0
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url
    this.withCredentials = options?.withCredentials ?? false
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  addEventListener(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  removeEventListener(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener)
  }

  close(): void {
    this.readyState = MockEventSource.CLOSED
  }

  simulateMessage(data: string, eventType = 'message', lastEventId = ''): void {
    const event = new MessageEvent(eventType, { data, lastEventId })
    if (this.onmessage) {
      this.onmessage(event)
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

global.EventSource = MockEventSource as any

describe('SSE 功能测试', () => {
  let client: SSEClient

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (client) {
      client.disconnect()
    }
    vi.restoreAllMocks()
  })

  describe('基础连接', () => {
    it('应该成功创建和连接', async () => {
      client = new SSEClient({ url: 'http://localhost:3000/events' })
      const connectPromise = client.connect()
      await vi.advanceTimersByTimeAsync(20)
      await connectPromise
      expect(client.isConnected()).toBe(true)
    })

    it('应该接收消息', async () => {
      client = new SSEClient({ url: 'http://localhost:3000/events' })
      const messages: any[] = []
      client.on('message', (event) => messages.push(event))
      await client.connect()
      await vi.advanceTimersByTimeAsync(20)
      const eventSource = client.getEventSource() as MockEventSource
      eventSource.simulateMessage('test', 'message', '123')
      expect(messages).toHaveLength(1)
      expect(messages[0].data).toBe('test')
    })
  })

  describe('重连策略', () => {
    it('线性重连', async () => {
      client = new SSEClient({
        url: 'http://localhost:3000/events',
        reconnectStrategy: ReconnectStrategy.LINEAR,
        reconnectDelay: 1000,
        autoReconnect: true,
      })
      await client.connect()
      await vi.advanceTimersByTimeAsync(20)
      const eventSource = client.getEventSource() as MockEventSource
      eventSource.simulateError()
      await vi.advanceTimersByTimeAsync(1100)
      expect(client.getReconnectAttempts()).toBe(1)
    })

    it('指数退避重连', async () => {
      client = new SSEClient({
        url: 'http://localhost:3000/events',
        reconnectStrategy: ReconnectStrategy.EXPONENTIAL,
        reconnectDelay: 1000,
        autoReconnect: true,
      })
      await client.connect()
      await vi.advanceTimersByTimeAsync(20)
      const eventSource = client.getEventSource() as MockEventSource
      eventSource.simulateError()
      await vi.advanceTimersByTimeAsync(1100)
      expect(client.getReconnectAttempts()).toBe(1)
    })
  })

  describe('事件过滤', () => {
    it('根据类型过滤', async () => {
      client = new SSEClient({
        url: 'http://localhost:3000/events',
        eventFilter: { allowedTypes: ['notification'] },
      })
      const messages: any[] = []
      client.on('message', (event) => messages.push(event))
      await client.connect()
      await vi.advanceTimersByTimeAsync(20)
      const eventSource = client.getEventSource() as MockEventSource
      eventSource.simulateMessage('allowed', 'notification')
      eventSource.simulateMessage('blocked', 'debug')
      expect(messages).toHaveLength(1)
    })

    it('自定义过滤', async () => {
      client = new SSEClient({
        url: 'http://localhost:3000/events',
        eventFilter: {
          customFilter: (event) => {
            try {
              const data = JSON.parse(event.data)
              return data.importance >= 5
            } catch {
              return false
            }
          },
        },
      })
      const messages: any[] = []
      client.on('message', (event) => messages.push(event))
      await client.connect()
      await vi.advanceTimersByTimeAsync(20)
      const eventSource = client.getEventSource() as MockEventSource
      eventSource.simulateMessage(JSON.stringify({ importance: 8 }))
      eventSource.simulateMessage(JSON.stringify({ importance: 3 }))
      expect(messages).toHaveLength(1)
    })
  })

  describe('连接质量', () => {
    it('统计信息', async () => {
      client = new SSEClient({ url: 'http://localhost:3000/events' })
      await client.connect()
      await vi.advanceTimersByTimeAsync(20)
      const eventSource = client.getEventSource() as MockEventSource
      for (let i = 0; i < 5; i++) {
        eventSource.simulateMessage(`msg${i}`)
        await vi.advanceTimersByTimeAsync(1000)
      }
      const stats = client.getStats()
      expect(stats.eventsReceived).toBe(5)
      expect(stats.connectedDuration).toBeGreaterThan(0)
    })
  })

  describe('消息缓冲', () => {
    it('缓存事件', async () => {
      client = new SSEClient({
        url: 'http://localhost:3000/events',
        enableBuffer: true,
        bufferSize: 10,
      })
      await client.connect()
      await vi.advanceTimersByTimeAsync(20)
      const eventSource = client.getEventSource() as MockEventSource
      for (let i = 0; i < 5; i++) {
        eventSource.simulateMessage(`msg${i}`)
      }
      expect(client.getBufferedEvents()).toHaveLength(5)
    })

    it('限制缓冲区大小', async () => {
      client = new SSEClient({
        url: 'http://localhost:3000/events',
        enableBuffer: true,
        bufferSize: 3,
      })
      await client.connect()
      await vi.advanceTimersByTimeAsync(20)
      const eventSource = client.getEventSource() as MockEventSource
      for (let i = 0; i < 5; i++) {
        eventSource.simulateMessage(`msg${i}`)
      }
      const buffered = client.getBufferedEvents()
      expect(buffered).toHaveLength(3)
      expect(buffered[2].data).toBe('msg4')
    })
  })

  describe('工厂函数', () => {
    it('createSSEClient', () => {
      client = createSSEClient({ url: 'http://localhost:3000/events' })
      expect(client).toBeInstanceOf(SSEClient)
    })

    it('createBasicSSEClient', () => {
      const basicClient = createBasicSSEClient('http://localhost:3000/events')
      expect(basicClient).toBeDefined()
      expect(basicClient.getClient()).toBeInstanceOf(SSEClient)
    })
  })
})