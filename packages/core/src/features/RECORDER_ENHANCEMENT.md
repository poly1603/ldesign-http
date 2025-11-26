# 请求录制、回放和 Mock 生成增强文档

## 概述

RequestRecorder 提供了强大的请求录制和回放功能，支持：
- 📹 录制真实的 HTTP 请求和响应
- 🔄 回放录制内容，实现离线开发
- 🎭 生成 Mock 数据用于测试
- 🏷️ 场景管理和标签分类
- 📊 详细的统计分析

## 快速开始

### 基础录制

```typescript
import { RequestRecorder, createHttpClient } from '@ldesign/http-core'

const recorder = new RequestRecorder({
  enabled: true,
  maxRecordings: 1000,
})

const client = await createHttpClient({
  baseURL: 'https://api.example.com',
})

recorder.attachToClient(client)
recorder.startRecording()

await client.get('/users')
await client.post('/users', { name: 'John' })

const recordings = recorder.stopRecording()
await recorder.saveToFile('./recordings.json')
```

### 回放录制

```typescript
recorder.enableReplayMode()
const response = await client.get('/users') // 返回录制的响应
```

## Mock 数据生成

### 方法 1: 直接回放

```typescript
recorder.enableReplayMode()
// 所有请求返回录制的数据
```

### 方法 2: 导出为 Mock 模块

```typescript
const recordings = recorder.getRecordings()

const mockCode = `
export const mocks = ${JSON.stringify(recordings.map(r => ({
  url: r.request.url,
  method: r.request.method,
  response: r.response.data,
  status: r.response.status,
})), null, 2)}

export function getMock(method, url) {
  return mocks.find(m => m.method === method && m.url === url)
}
`

await writeFile('./mocks.ts', mockCode)
```

### 方法 3: MSW 集成

```typescript
import { setupWorker, rest } from 'msw'

const handlers = recorder.getRecordings().map(r => {
  return rest[r.request.method.toLowerCase()](r.request.url, (req, res, ctx) => {
    return res(ctx.status(r.response.status), ctx.json(r.response.data))
  })
})

const worker = setupWorker(...handlers)
worker.start()
```

## 实战场景

### 场景 1: E2E 测试

```typescript
// 录制
recorder.startRecording()
await client.post('/auth/login', { username: 'test' })
await client.get('/user/profile')
recorder.stopRecording()
recorder.addTagToRecordings('login-flow')
await recorder.saveToFile('./login-flow.json')

// 测试中使用
beforeEach(() => {
  recorder.loadRecordings(savedRecordings)
  recorder.enableReplayMode()
})
```

### 场景 2: 离线开发

```typescript
if (process.env.NODE_ENV === 'development') {
  try {
    const saved = await loadRecordings('./dev-recordings.json')
    recorder.loadRecordings(saved)
    recorder.enableReplayMode()
  } catch {
    recorder.startRecording()
  }
}
```

### 场景 3: API 文档生成

```typescript
const doc = recorder.getRecordings().map(r => `
## ${r.request.method} ${r.request.url}
**响应:** ${r.response.status}
\`\`\`json
${JSON.stringify(r.response.data, null, 2)}
\`\`\`
`).join('\n')
```

## 高级功能

### 过滤录制

```typescript
// 只录制特定请求
const recorder = new RequestRecorder({
  filter: (config) => config.url?.startsWith('/api/')
})

// 查询录制
const userRequests = recorder.filterRecordings(r => 
  r.request.url.includes('/users')
)
```

### 标签管理

```typescript
recorder.addTagToRecordings('scenario-1')
recorder.addTagToRecordings('errors', r => r.response.status >= 400)
const tagged = recorder.getRecordingsByTag('scenario-1')
```

### 统计信息

```typescript
const stats = recorder.getStats()
console.log(`
  总数: ${stats.totalRecordings}
  大小: ${stats.estimatedSize} bytes
  按方法: ${JSON.stringify(stats.byMethod)}
  按状态: ${JSON.stringify(stats.byStatus)}
`)
```

### 数据编辑

```typescript
const recordings = recorder.getRecordings()
recordings.forEach(r => {
  if (r.request.headers.Authorization) {
    r.request.headers.Authorization = 'Bearer ***'
  }
})
recorder.loadRecordings(recordings)
```

## 最佳实践

1. **使用有意义的文件名**
   ```typescript
   await recorder.saveToFile(`./recordings/${scenarioName}-${Date.now()}.json`)
   ```

2. **添加描述性标签**
   ```typescript
   recorder.addTagToRecordings('v1.0.0')
   recorder.addTagToRecordings('critical-path')
   ```

3. **限制录制数量**
   ```typescript
   const recorder = new RequestRecorder({
     maxRecordings: 100,
     maxResponseBodySize: 5 * 1024 * 1024,
   })
   ```

4. **敏感数据处理**
   ```typescript
   const recorder = new RequestRecorder({
     filter: (config) => {
       // 不录制包含敏感数据的请求
       return !config.url?.includes('/password')
     }
   })
   ```

## API 参考

### RequestRecorder 类

```typescript
class RequestRecorder {
  // 连接管理
  attachToClient(client: HttpClient): void
  detachFromClient(client: HttpClient): void
  
  // 录制控制
  startRecording(): void
  stopRecording(): RecordingItem[]
  
  // 回放控制
  enableReplayMode(): void
  disableReplayMode(): void
  
  // 数据管理
  getRecordings(): RecordingItem[]
  loadRecordings(recordings: RecordingItem[]): void
  clearRecordings(): void
  
  // 导入导出
  exportAsJSON(): string
  importFromJSON(json: string): void
  saveToFile(filename?: string): Promise<void>
  loadFromFile(file: File): Promise<void>
  
  // 查询和过滤
  filterRecordings(predicate: (r: RecordingItem) => boolean): RecordingItem[]
  getRecordingsByTag(tag: string): RecordingItem[]
  
  // 标签管理
  addTagToRecordings(tag: string, filter?: Function): void
  
  // 统计
  getStats(): RecorderStats
}
```

### 配置选项

```typescript
interface RecorderConfig {
  enabled?: boolean                    // 是否启用
  maxRecordings?: number              // 最大录制数
  autoSave?: boolean                  // 自动保存
  savePath?: string                   // 保存路径
  filter?: (config: RequestConfig) => boolean  // 过滤器
  recordResponseBody?: boolean        // 是否录制响应体
  maxResponseBodySize?: number        // 最大响应体大小
}
```

## 总结

RequestRecorder 提供了完整的录制和回放解决方案：

✅ **功能完整**: 录制、回放、过滤、标签、统计  
✅ **易于使用**: 简单的 API，清晰的流程  
✅ **灵活集成**: 支持多种 Mock 方案  
✅ **生产就绪**: 经过测试，可靠稳定  

可直接用于开发、测试和文档生成场景！