# WebSocket 功能增强文档

## 概述

WebSocket 客户端提供了企业级的连接管理功能，包括智能重连、心跳检测、连接质量监控和消息确认机制。

## 新增功能

### 1. 智能重连策略

支持三种重连策略，适应不同的网络环境和业务需求。

#### 1.1 线性重连 (Linear)
```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:3000',
  autoReconnect: true,
  reconnectStrategy: 'linear',
  reconnectDelay: 3000, // 每次重连延迟 3s
  maxReconnectAttempts: 5,
})

// 重连延迟：3s, 6s, 9s, 12s, 15s
```

#### 1.2 指数退避 (Exponential)
```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:3000',
  autoReconnect: true,
  reconnectStrategy: 'exponential',
  reconnectDelay: 1000, // 初始延迟 1s
  maxReconnectDelay: 30000, // 最大延迟 30s
  maxReconnectAttempts: 10,
})

// 重连延迟：1s, 2s, 4s, 8s, 16s, 30s (达到最大值)
```

#### 1.3 随机延迟 (Random)
```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:3000',
  autoReconnect: true,
  reconnectStrategy: 'random',
  reconnectDelay: 2000, // 基础延迟 2s
  maxReconnectAttempts: 5,
})

// 重连延迟：2s + random(0-2s), 2s + random(0-4s), ...
```

### 2. 心跳检测增强

#### 2.1 心跳超时检测
```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:3000',
  heartbeatInterval: 30000, // 每 30s 发送心跳
  heartbeatTimeout: 5000, // 5s 内未收到响应视为超时
  heartbeatMessage: { type: 'ping' },
  heartbeatResponseType: 'pong', // 期望的响应类型
})

// 监听心跳超时
ws.on('heartbeat_timeout', ({ missed }) => {
  console.log(`心跳超时，已丢失 ${missed} 次`)
})
```

#### 2.2 延迟监控
```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:3000',
  heartbeatInterval: 10000,
  heartbeatResponseType: 'pong',
})

await ws.connect()

const stats = ws.getStats()
console.log(`平均延迟: ${stats.averageLatency}ms`)
console.log(`当前延迟: ${stats.currentLatency}ms`)
```

### 3. 连接质量监控

```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:3000',
  heartbeatInterval: 10000,
  heartbeatResponseType: 'pong',
  qualityCheckInterval: 5000, // 每 5s 检查一次连接质量
})

// 监听质量变化
ws.on('quality_change', ({ from, to }) => {
  console.log(`连接质量从 ${from} 变为 ${to}`)
})

const stats = ws.getStats()
console.log(`连接质量: ${stats.quality}`)
// 可能值: excellent (<100ms), good (100-300ms), 
//         fair (300-500ms), poor (>500ms)
```

### 4. 消息确认机制

```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:3000',
  enableMessageAck: true, // 启用消息确认
  messageAckTimeout: 5000, // 确认超时 5s
})

await ws.connect()

// 发送消息并等待确认
try {
  const response = await ws.sendWithAck({
    type: 'order',
    data: { orderId: '12345' },
  })
  
  console.log('消息已确认，响应:', response)
}
catch (error) {
  console.error('消息发送失败或超时:', error)
}
```

## API 参考

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | `string` | - | WebSocket URL |
| `autoReconnect` | `boolean` | `true` | 自动重连 |
| `reconnectStrategy` | `'linear' \| 'exponential' \| 'random'` | `'exponential'` | 重连策略 |
| `reconnectDelay` | `number` | `3000` | 重连延迟(ms) |
| `maxReconnectDelay` | `number` | `30000` | 最大重连延迟(ms) |
| `maxReconnectAttempts` | `number` | `5` | 最大重连次数 |
| `heartbeatInterval` | `number` | `30000` | 心跳间隔(ms) |
| `heartbeatTimeout` | `number` | `5000` | 心跳超时(ms) |
| `heartbeatMessage` | `any` | `{ type: 'ping' }` | 心跳消息 |
| `heartbeatResponseType` | `string` | - | 心跳响应类型 |
| `qualityCheckInterval` | `number` | `10000` | 质量检查间隔(ms) |
| `enableMessageAck` | `boolean` | `false` | 启用消息确认 |
| `messageAckTimeout` | `number` | `5000` | 消息确认超时(ms) |

### 方法

#### `connect(): Promise<void>`
连接 WebSocket 服务器。

#### `disconnect(code?: number, reason?: string): void`
断开连接。

#### `send(data: any): boolean`
发送消息。

#### `sendWithAck(data: any, timeout?: number): Promise<any>`
发送消息并等待确认。

#### `getStats(): ConnectionStats`
获取连接统计信息。

#### `resetStats(): void`
重置统计信息。

#### `on(event: WebSocketEventType, listener: Function): Function`
监听事件，返回取消监听函数。

### 事件

| 事件 | 数据 | 说明 |
|------|------|------|
| `open` | - | 连接已建立 |
| `close` | `{ code, reason }` | 连接已关闭 |
| `error` | `Error` | 发生错误 |
| `message` | `any` | 收到消息 |
| `reconnecting` | `{ attempts }` | 正在重连 |
| `reconnect` | - | 重连成功 |
| `reconnect_failed` | - | 重连失败 |
| `heartbeat_timeout` | `{ missed }` | 心跳超时 |
| `quality_change` | `{ from, to }` | 质量变化 |
| `message_ack` | `{ id, response }` | 消息已确认 |
| `message_timeout` | `{ id, data }` | 消息超时 |

### 连接统计

```typescript
interface ConnectionStats {
  connectedDuration: number      // 连接时长(ms)
  messagesSent: number            // 发送消息数
  messagesReceived: number        // 接收消息数
  reconnectCount: number          // 重连次数
  averageLatency: number          // 平均延迟(ms)
  currentLatency: number          // 当前延迟(ms)
  quality: ConnectionQuality      // 连接质量
  missedHeartbeats: number        // 丢失心跳数
}
```

## 最佳实践

### 1. 选择合适的重连策略

- **线性重连**: 适用于稳定的网络环境
- **指数退避**: 适用于生产环境，推荐使用
- **随机延迟**: 适用于大量客户端场景

### 2. 配置合理的超时时间

```typescript
{
  connectionTimeout: 10000,   // 连接超时 10s
  heartbeatInterval: 30000,   // 心跳间隔 30s
  heartbeatTimeout: 5000,     // 心跳响应超时 5s
  messageAckTimeout: 5000,    // 消息确认超时 5s
}
```

### 3. 监控连接健康度

```typescript
setInterval(() => {
  const stats = ws.getStats()
  
  if (stats.connectedDuration > 24 * 60 * 60 * 1000) {
    // 连接时间过长，主动重连
    ws.disconnect()
    ws.connect()
  }
  
  if (stats.averageLatency > 1000) {
    console.warn('网络延迟过高')
  }
}, 60000)
```

### 4. 优雅的错误处理

```typescript
ws.on('error', (error) => {
  logger.error('WebSocket 错误', error)
  notification.error('连接出现问题，正在尝试重连...')
})

ws.on('reconnect_failed', () => {
  logger.error('WebSocket 重连失败')
  notification.error('无法连接到服务器，请检查网络连接')
})
```

### 5. 资源清理

```typescript
// 页面卸载时断开连接
window.addEventListener('beforeunload', () => {
  ws.disconnect()
})

// Vue 组件销毁时清理
onUnmounted(() => {
  ws.disconnect()
})
```

## 性能优化

### 1. 延迟记录限制
只保留最近 100 次延迟记录，避免内存泄漏。

### 2. 自动重连优化
连续丢失 3 次心跳自动触发重连，提前发现连接问题。

### 3. 质量评估算法
基于平均延迟评估连接质量，实时调整策略。

## 更新日志

### v2.0.0
- ✨ 新增智能重连策略（线性/指数/随机）
- ✨ 新增心跳超时检测
- ✨ 新增连接质量监控
- ✨ 新增消息确认机制
- ✨ 新增连接统计功能
- 🔧 优化心跳机制，支持延迟计算
- 🔧 优化重连逻辑，支持指数退避