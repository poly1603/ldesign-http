# SSE (Server-Sent Events) 增强功能文档

## 概述

本文档描述了 SSE 客户端的增强功能，包括智能重连策略、事件过滤、连接质量监控和消息缓冲等高级特性。

## 核心功能

### 1. 智能重连策略

提供三种重连策略，适应不同的网络环境和业务需求。

#### 1.1 线性重连 (LINEAR)

固定延迟倍增，适合稳定网络环境。

```typescript
const client = new SSEClient({
  url: 'http://localhost:3000/events',
  reconnectStrategy: ReconnectStrategy.LINEAR,
  reconnectDelay: 3000,
  maxReconnectDelay: 30000,
})
// 重连延迟：3s, 6s, 9s, 12s...
```

#### 1.2 指数退避 (EXPONENTIAL) - 推荐

指数增长延迟，生产环境首选。

```typescript
const client = new SSEClient({
  url: 'http://localhost:3000/events',
  reconnectStrategy: ReconnectStrategy.EXPONENTIAL,
  reconnectDelay: 1000,
  maxReconnectDelay: 32000,
})
// 重连延迟：1s, 2s, 4s, 8s, 16s, 32s
```

#### 1.3 随机延迟 (RANDOM)

避免同步重连，适合大量客户端场景。

```typescript
const client = new SSEClient({
  url: 'http://localhost:3000/events',
  reconnectStrategy: ReconnectStrategy.RANDOM,
  reconnectDelay: 2000,
  maxReconnectDelay: 20000,
})
// 重连延迟：2-4s, 2-6s, 2-8s (随机)
```

### 2. 事件过滤机制

#### 2.1 基于事件类型过滤

```typescript
const client = new SSEClient({
  url: 'http://localhost:3000/events',
  eventFilter: {
    allowedTypes: ['notification', 'update'],
    deniedTypes: ['debug', 'trace'],
  },
})
```

#### 2.2 基于数据内容过滤

```typescript
const client = new SSEClient({
  url: 'http://localhost:3000/events',
  eventFilter: {
    dataPattern: /^{.*"priority":\s*"high"/,
  },
})
```

#### 2.3 自定义过滤函数

```typescript
const client = new SSEClient({
  url: 'http://localhost:3000/events',
  eventFilter: {
    customFilter: (event) => {
      const data = JSON.parse(event.data)
      return data.importance >= 8
    },
  },
})
```

#### 2.4 动态更新过滤器

```typescript
client.updateEventFilter({
  allowedTypes: ['urgent', 'critical'],
})
```

### 3. 连接质量监控

#### 3.1 质量等级

```typescript
enum ConnectionQuality {
  EXCELLENT = 'excellent',  // 接收率 > 95%
  GOOD = 'good',           // 接收率 80-95%
  FAIR = 'fair',           // 接收率 60-80%
  POOR = 'poor',           // 接收率 < 60%
  UNKNOWN = 'unknown',     // 数据不足
}
```

#### 3.2 获取统计信息

```typescript
const stats = client.getStats()
console.log({
  connectedDuration: stats.connectedDuration,
  eventsReceived: stats.eventsReceived,
  eventsFiltered: stats.eventsFiltered,
  reconnectCount: stats.reconnectCount,
  quality: stats.quality,
  averageEventInterval: stats.averageEventInterval,
  lastEventTime: stats.lastEventTime,
  missedHeartbeats: stats.missedHeartbeats,
})
```

### 4. 消息缓冲机制

#### 4.1 启用消息缓冲

```typescript
const client = new SSEClient({
  url: 'http://localhost:3000/events',
  enableBuffer: true,
  bufferSize: 100,
})

client.on('buffer_replay', ({ count }) => {
  console.log(`Replaying ${count} buffered events`)
})
```

#### 4.2 管理缓冲区

```typescript
// 获取缓冲的事件
const buffered = client.getBufferedEvents()

// 清空缓冲区
client.clearBuffer()
```

## API 参考

### SSEClient 类

#### 构造函数

```typescript
constructor(config: SSEClientConfig)
```

#### 主要方法

```typescript
// 连接
async connect(): Promise<void>

// 断开连接
disconnect(): void

// 监听事件
on(event: string, listener: Function): () => void
addEventListener(event: string, listener: Function): () => void
removeEventListener(event: string, listener: Function): void
once(event: string, listener: Function): void

// 状态查询
getStatus(): SSEStatus
isConnected(): boolean
getReconnectAttempts(): number
getLastEventId(): string | null

// 统计信息
getStats(): SSEConnectionStats
resetStats(): void

// 缓冲管理
getBufferedEvents(): SSEEvent[]
clearBuffer(): void

// 配置更新
updateConfig(config: Partial<SSEClientConfig>): void
updateEventFilter(filter: SSEEventFilterConfig): void
```

#### 事件列表

- `open` - 连接成功
- `message` - 接收到消息
- `error` - 发生错误
- `close` - 连接关闭
- `reconnecting` - 正在重连
- `reconnect` - 重连成功
- `reconnect_failed` - 重连失败
- `heartbeat_timeout` - 心跳超时
- `buffer_replay` - 缓冲区重放

## 最佳实践

### 1. 生产环境配置

```typescript
const client = new SSEClient({
  url: 'https://api.example.com/events',
  reconnectStrategy: ReconnectStrategy.EXPONENTIAL,
  reconnectDelay: 1000,
  maxReconnectDelay: 32000,
  maxReconnectAttempts: 10,
  heartbeatTimeout: 30000,
  enableBuffer: true,
  bufferSize: 200,
  debug: false,
})
```

### 2. 错误处理

```typescript
client.on('error', (error) => {
  console.error('SSE Error:', error)
  reportToMonitoring(error)
})

client.on('reconnect_failed', () => {
  console.error('Max reconnect attempts reached')
  notifyUser('连接失败，请刷新页面')
})
```

### 3. 质量监控

```typescript
setInterval(() => {
  const stats = client.getStats()
  
  if (stats.quality === ConnectionQuality.POOR) {
    console.warn('Poor connection quality')
  }
  
  reportMetrics(stats)
}, 60000)
```

## 性能优化

### 1. 事件过滤

使用事件过滤减少不必要的处理：

```typescript
// 只接受高优先级事件
eventFilter: {
  customFilter: (event) => {
    const data = JSON.parse(event.data)
    return data.priority === 'high'
  }
}
```

### 2. 缓冲区大小

根据业务需求调整缓冲区：

```typescript
// 低频事件：小缓冲区
bufferSize: 50

// 高频事件：大缓冲区
bufferSize: 500
```

### 3. 心跳超时

根据网络环境调整：

```typescript
// 稳定网络
heartbeatTimeout: 30000

// 不稳定网络
heartbeatTimeout: 60000
```

## 故障排查

### 1. 连接频繁断开

- 检查 `heartbeatTimeout` 是否过短
- 查看 `missedHeartbeats` 统计
- 考虑使用 EXPONENTIAL 策略

### 2. 事件丢失

- 启用消息缓冲：`enableBuffer: true`
- 增加缓冲区大小：`bufferSize: 200`
- 检查事件过滤配置

### 3. 重连失败

- 增加最大重连次数
- 调整重连延迟
- 检查网络连接

## 示例代码

### 完整示例

```typescript
import { SSEClient, ReconnectStrategy } from '@ldesign/http-core'

const client = new SSEClient({
  url: 'https://api.example.com/events',
  reconnectStrategy: ReconnectStrategy.EXPONENTIAL,
  reconnectDelay: 1000,
  maxReconnectDelay: 32000,
  eventFilter: {
    allowedTypes: ['notification', 'update'],
  },
  enableBuffer: true,
  bufferSize: 100,
})

client.on('message', (event) => {
  console.log('Received:', event.type, event.data)
})

client.on('reconnect', ({ bufferedEvents }) => {
  console.log(`Reconnected, recovered ${bufferedEvents} events`)
})

await client.connect()
```

## 升级指南

### 从旧版本升级

旧的配置：
```typescript
new SSEClient({
  url: 'http://localhost:3000/events',
  autoReconnect: true,
  reconnectDelay: 3000,
})
```

新的配置（推荐）：
```typescript
new SSEClient({
  url: 'http://localhost:3000/events',
  autoReconnect: true,
  reconnectStrategy: ReconnectStrategy.EXPONENTIAL,
  reconnectDelay: 1000,
  maxReconnectDelay: 32000,
  enableBuffer: true,
})
```

## 总结

SSE 增强功能提供了：
- ✅ 三种智能重连策略
- ✅ 灵活的事件过滤机制
- ✅ 实时连接质量监控
- ✅ 消息缓冲和恢复
- ✅ 增强的心跳检测
- ✅ 详细的统计信息

这些功能让 SSE 客户端更加健壮、可靠和易用。