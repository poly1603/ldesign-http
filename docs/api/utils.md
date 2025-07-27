# 工具函数

@ldesign/http 提供了一系列实用的工具函数，帮助你更好地处理HTTP请求和响应。

## 🔧 URL 工具

### buildURL

构建完整的URL，支持查询参数。

```typescript
function buildURL(url: string, params?: Record<string, any>): string
```

**示例:**
```typescript
import { buildURL } from '@ldesign/http'

// 基础URL
const url1 = buildURL('/users')
// 结果: '/users'

// 带查询参数
const url2 = buildURL('/users', { page: 1, limit: 10 })
// 结果: '/users?page=1&limit=10'

// 复杂参数
const url3 = buildURL('/search', {
  q: 'javascript',
  tags: ['vue', 'react'],
  filters: { active: true, verified: true }
})
// 结果: '/search?q=javascript&tags=vue&tags=react&filters[active]=true&filters[verified]=true'
```

### parseURL

解析URL，提取各个组成部分。

```typescript
interface ParsedURL {
  protocol: string
  host: string
  pathname: string
  search: string
  hash: string
  params: Record<string, string>
}

function parseURL(url: string): ParsedURL
```

**示例:**
```typescript
import { parseURL } from '@ldesign/http'

const parsed = parseURL('https://api.example.com/users?page=1&limit=10#section')

console.log(parsed)
// {
//   protocol: 'https:',
//   host: 'api.example.com',
//   pathname: '/users',
//   search: '?page=1&limit=10',
//   hash: '#section',
//   params: { page: '1', limit: '10' }
// }
```

### combineURLs

合并基础URL和相对URL。

```typescript
function combineURLs(baseURL: string, relativeURL: string): string
```

**示例:**
```typescript
import { combineURLs } from '@ldesign/http'

const url1 = combineURLs('https://api.example.com', '/users')
// 结果: 'https://api.example.com/users'

const url2 = combineURLs('https://api.example.com/', 'users')
// 结果: 'https://api.example.com/users'

const url3 = combineURLs('https://api.example.com/v1', '../v2/users')
// 结果: 'https://api.example.com/v2/users'
```

## 📊 数据工具

### serialize

序列化对象为查询字符串。

```typescript
function serialize(obj: Record<string, any>, options?: SerializeOptions): string

interface SerializeOptions {
  arrayFormat?: 'indices' | 'brackets' | 'repeat' | 'comma'
  encode?: boolean
  delimiter?: string
}
```

**示例:**
```typescript
import { serialize } from '@ldesign/http'

// 基础序列化
const query1 = serialize({ name: 'John', age: 30 })
// 结果: 'name=John&age=30'

// 数组处理
const query2 = serialize({ tags: ['vue', 'react'] }, { arrayFormat: 'brackets' })
// 结果: 'tags[]=vue&tags[]=react'

const query3 = serialize({ tags: ['vue', 'react'] }, { arrayFormat: 'comma' })
// 结果: 'tags=vue,react'

// 嵌套对象
const query4 = serialize({ user: { name: 'John', age: 30 } })
// 结果: 'user[name]=John&user[age]=30'
```

### deserialize

反序列化查询字符串为对象。

```typescript
function deserialize(str: string): Record<string, any>
```

**示例:**
```typescript
import { deserialize } from '@ldesign/http'

const obj1 = deserialize('name=John&age=30')
// 结果: { name: 'John', age: '30' }

const obj2 = deserialize('tags[]=vue&tags[]=react')
// 结果: { tags: ['vue', 'react'] }

const obj3 = deserialize('user[name]=John&user[age]=30')
// 结果: { user: { name: 'John', age: '30' } }
```

## 🔍 类型检查

### isHttpError

检查是否为HTTP错误。

```typescript
function isHttpError(error: any): error is HttpError
```

**示例:**
```typescript
import { isHttpError } from '@ldesign/http'

try {
  await client.get('/api/data')
}
 catch (error) {
  if (isHttpError(error)) {
    console.log('HTTP错误:', error.status, error.message)
    console.log('响应数据:', error.response?.data)
  }
 else {
    console.log('其他错误:', error)
  }
}
```

### isCancel

检查是否为取消错误。

```typescript
function isCancel(error: any): boolean
```

**示例:**
```typescript
import { isCancel } from '@ldesign/http'

try {
  await client.get('/api/data', { cancelToken })
}
 catch (error) {
  if (isCancel(error)) {
    console.log('请求被取消')
  }
 else {
    console.log('其他错误:', error)
  }
}
```

### isNetworkError

检查是否为网络错误。

```typescript
function isNetworkError(error: any): boolean
```

**示例:**
```typescript
import { isNetworkError } from '@ldesign/http'

try {
  await client.get('/api/data')
}
 catch (error) {
  if (isNetworkError(error)) {
    console.log('网络连接失败')
  }
}
```

## 🎯 配置工具

### mergeConfig

合并配置对象。

```typescript
function mergeConfig(
  config1: RequestConfig,
  config2: RequestConfig
): RequestConfig
```

**示例:**
```typescript
import { mergeConfig } from '@ldesign/http'

const baseConfig = {
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
}

const requestConfig = {
  timeout: 5000,
  headers: { Authorization: 'Bearer token' }
}

const merged = mergeConfig(baseConfig, requestConfig)
// 结果: {
//   timeout: 5000,
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': 'Bearer token'
//   }
// }
```

### normalizeConfig

标准化配置对象。

```typescript
function normalizeConfig(config: RequestConfig): RequestConfig
```

**示例:**
```typescript
import { normalizeConfig } from '@ldesign/http'

const config = normalizeConfig({
  url: '/users',
  method: 'get',
  headers: { 'content-type': 'application/json' }
})

// 标准化后:
// {
//   url: '/users',
//   method: 'GET',
//   headers: { 'Content-Type': 'application/json' }
// }
```

## 📝 格式化工具

### formatBytes

格式化字节大小。

```typescript
function formatBytes(bytes: number, decimals?: number): string
```

**示例:**
```typescript
import { formatBytes } from '@ldesign/http'

console.log(formatBytes(1024)) // '1 KB'
console.log(formatBytes(1048576)) // '1 MB'
console.log(formatBytes(1073741824)) // '1 GB'
console.log(formatBytes(1536, 2)) // '1.50 KB'
```

### formatDuration

格式化时间间隔。

```typescript
function formatDuration(milliseconds: number): string
```

**示例:**
```typescript
import { formatDuration } from '@ldesign/http'

console.log(formatDuration(1000)) // '1s'
console.log(formatDuration(60000)) // '1m'
console.log(formatDuration(3661000)) // '1h 1m 1s'
```

### formatSpeed

格式化传输速度。

```typescript
function formatSpeed(bytesPerSecond: number): string
```

**示例:**
```typescript
import { formatSpeed } from '@ldesign/http'

console.log(formatSpeed(1024)) // '1 KB/s'
console.log(formatSpeed(1048576)) // '1 MB/s'
```

## 🔄 异步工具

### delay

延迟执行。

```typescript
function delay(ms: number): Promise<void>
```

**示例:**
```typescript
import { delay } from '@ldesign/http'

// 延迟1秒
await delay(1000)
console.log('1秒后执行')

// 在重试中使用
for (let i = 0; i < 3; i++) {
  try {
    const response = await client.get('/api/data')
    break
  }
 catch (error) {
    if (i < 2) {
      await delay(1000 * 2 ** i) // 指数退避
    }
  }
}
```

### timeout

为Promise添加超时。

```typescript
function timeout<T>(promise: Promise<T>, ms: number): Promise<T>
```

**示例:**
```typescript
import { timeout } from '@ldesign/http'

try {
  // 5秒超时
  const result = await timeout(
    fetch('/slow-api'),
    5000
  )
}
 catch (error) {
  if (error.message === 'Timeout') {
    console.log('请求超时')
  }
}
```

### retry

重试函数。

```typescript
function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>

interface RetryOptions {
  retries?: number
  delay?: number
  factor?: number
  maxDelay?: number
  condition?: (error: any) => boolean
}
```

**示例:**
```typescript
import { retry } from '@ldesign/http'

const result = await retry(
  () => client.get('/unreliable-api'),
  {
    retries: 3,
    delay: 1000,
    factor: 2,
    condition: error => error.status >= 500
  }
)
```

## 🛠️ 调试工具

### createLogger

创建日志记录器。

```typescript
function createLogger(options?: LoggerOptions): Logger

interface LoggerOptions {
  level?: 'debug' | 'info' | 'warn' | 'error'
  prefix?: string
  timestamp?: boolean
}

interface Logger {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}
```

**示例:**
```typescript
import { createLogger } from '@ldesign/http'

const logger = createLogger({
  level: 'debug',
  prefix: '[HTTP]',
  timestamp: true
})

logger.info('发送请求', { url: '/users', method: 'GET' })
logger.error('请求失败', error)
```

### debugRequest

调试请求信息。

```typescript
function debugRequest(config: RequestConfig): void
```

**示例:**
```typescript
import { debugRequest } from '@ldesign/http'

const config = {
  method: 'POST',
  url: '/users',
  data: { name: 'John' },
  headers: { 'Content-Type': 'application/json' }
}

debugRequest(config)
// 输出详细的请求信息
```

## 📚 使用示例

### 综合示例

```typescript
import {
  buildURL,
  createLogger,
  formatBytes,
  formatDuration,
  isHttpError,
  retry,
  serialize
} from '@ldesign/http'

// 创建日志记录器
const logger = createLogger({ prefix: '[API]' })

// 构建API客户端
class ApiClient {
  private baseURL = 'https://api.example.com'

  async request(endpoint: string, options: any = {}) {
    // 构建URL
    const url = buildURL(
      this.baseURL + endpoint,
      options.params
    )

    logger.info('发送请求', { url, method: options.method || 'GET' })

    const startTime = Date.now()

    try {
      // 使用重试机制
      const response = await retry(
        () => fetch(url, options),
        {
          retries: 3,
          delay: 1000,
          condition: error => isHttpError(error) && error.status >= 500
        }
      )

      const duration = Date.now() - startTime
      const size = response.headers.get('content-length')

      logger.info('请求成功', {
        status: response.status,
        duration: formatDuration(duration),
        size: size ? formatBytes(Number.parseInt(size)) : 'unknown'
      })

      return response
    }
 catch (error) {
      const duration = Date.now() - startTime

      if (isHttpError(error)) {
        logger.error('HTTP错误', {
          status: error.status,
          message: error.message,
          duration: formatDuration(duration)
        })
      }
 else {
        logger.error('请求失败', {
          message: error.message,
          duration: formatDuration(duration)
        })
      }

      throw error
    }
  }
}
```

## 📚 下一步

了解工具函数后，你可以继续学习：

- [HttpClient API](/api/http-client) - 核心客户端API
- [类型定义](/api/types) - 完整的类型定义
- [插件开发](/plugins/development) - 使用工具函数开发插件
- [最佳实践](/guide/best-practices) - 工具函数使用最佳实践
