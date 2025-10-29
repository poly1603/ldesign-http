# HTTP 包重构方案

## 📋 目录
- [当前结构分析](#当前结构分析)
- [问题诊断](#问题诊断)
- [目标架构](#目标架构)
- [重构计划](#重构计划)
- [核心API设计](#核心api设计)
- [框架适配层设计](#框架适配层设计)
- [实施步骤](#实施步骤)

---

## 📊 当前结构分析

### 现有目录结构

```
packages/http/
├── src/                          # 主包源代码
│   ├── adapters/                 # HTTP适配器
│   ├── core/                     # 核心功能
│   ├── devtools/                 # 开发工具
│   ├── features/                 # 高级特性
│   ├── interceptors/             # 拦截器
│   ├── presets/                  # 预设配置
│   ├── types/                    # 类型定义
│   ├── utils/                    # 工具函数
│   └── vue/                      # Vue集成
│
├── packages/                     # 子包目录
│   ├── core/                     # ✅ 核心包(新架构)
│   ├── react/                    # ✅ React适配器(新架构)
│   ├── vue/                      # ✅ Vue适配器(新架构)
│   ├── solid/                    # ✅ Solid适配器(新架构)
│   ├── svelte/                   # ✅ Svelte适配器(新架构)
│   ├── http-core/                # ❌ 重复的核心包(旧架构)
│   ├── http-adapters/            # ❌ 重复的适配器包
│   ├── http-interceptors/        # ❌ 重复的拦截器包
│   ├── http-features/            # ❌ 重复的特性包
│   ├── http-utils/               # ❌ 重复的工具包
│   ├── http-vue/                 # ❌ 重复的Vue包
│   ├── http-devtools/            # ❌ 重复的开发工具包
│   └── http-presets/             # ❌ 重复的预设包
```

### 功能分布

#### 1. **核心功能** (应该在 `core/` 中)
- HTTP客户端实现 (`src/client.ts`)
- 适配器系统 (`src/adapters/`)
- 拦截器管理 (`src/interceptors/`)
- 缓存系统 (`src/features/cache.ts`)
- 重试机制 (`src/features/retry.ts`)
- 错误处理 (`src/utils/error.ts`)
- 类型定义 (`src/types/`)

#### 2. **框架适配** (应该在各框架目录中)
- Vue 3: `src/vue/` 和 `packages/vue/`
- React: `packages/react/`
- Solid: `packages/solid/`
- Svelte: `packages/svelte/`

#### 3. **重复的包** (需要合并或删除)
- `packages/http-core/` vs `packages/core/`
- `packages/http-vue/` vs `packages/vue/`
- `packages/http-adapters/` (应合并到 `core/`)
- `packages/http-interceptors/` (应合并到 `core/`)
- `packages/http-features/` (应合并到 `core/`)
- `packages/http-utils/` (应合并到 `core/`)
- `packages/http-devtools/` (应合并到 `core/`)
- `packages/http-presets/` (应合并到 `core/`)

---

## 🔍 问题诊断

### 主要问题

1. **结构混乱**
   - 存在两套并行的包结构 (`core/` vs `http-core/`)
   - 功能重复,维护困难
   - 命名不一致

2. **职责不清**
   - `src/` 目录包含了所有功能
   - 框架无关代码和Vue特定代码混在一起
   - 缺乏清晰的分层

3. **依赖关系复杂**
   - 主包依赖关系不明确
   - 子包之间可能存在循环依赖

4. **文档过多**
   - 大量重复的文档文件
   - 缺乏统一的文档结构

---

## 🎯 目标架构

### 理想的目录结构

```
packages/http/
├── packages/
│   ├── core/                     # 核心包 (@ldesign/http-core)
│   │   ├── src/
│   │   │   ├── client/          # HTTP客户端
│   │   │   ├── adapters/        # 适配器系统
│   │   │   ├── interceptors/    # 拦截器
│   │   │   ├── cache/           # 缓存系统
│   │   │   ├── retry/           # 重试机制
│   │   │   ├── middleware/      # 中间件
│   │   │   ├── features/        # 高级特性
│   │   │   ├── devtools/        # 开发工具
│   │   │   ├── presets/         # 预设配置
│   │   │   ├── types/           # 类型定义
│   │   │   ├── utils/           # 工具函数
│   │   │   └── index.ts         # 主入口
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── react/                    # React适配器 (@ldesign/http-react)
│   │   ├── src/
│   │   │   ├── hooks/           # React Hooks
│   │   │   ├── provider/        # Context Provider
│   │   │   ├── components/      # React组件
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── vue/                      # Vue适配器 (@ldesign/http-vue)
│   │   ├── src/
│   │   │   ├── composables/     # 组合式函数
│   │   │   ├── plugin/          # Vue插件
│   │   │   ├── components/      # Vue组件
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── solid/                    # Solid适配器 (@ldesign/http-solid)
│   │   ├── src/
│   │   │   ├── hooks/           # Solid Hooks
│   │   │   ├── provider/        # Context Provider
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── svelte/                   # Svelte适配器 (@ldesign/http-svelte)
│       ├── src/
│       │   ├── stores/          # Svelte Stores
│       │   ├── actions/         # Svelte Actions
│       │   └── index.ts
│       ├── package.json
│       └── README.md
│
├── docs/                         # 统一文档
├── examples/                     # 示例项目
├── scripts/                      # 构建脚本
├── package.json                  # 主包配置
└── README.md                     # 主文档
```

### 包依赖关系

```
@ldesign/http (主包)
  └── 导出所有子包

@ldesign/http-core (核心包)
  └── 零依赖,框架无关

@ldesign/http-react
  └── 依赖: @ldesign/http-core, react

@ldesign/http-vue
  └── 依赖: @ldesign/http-core, vue

@ldesign/http-solid
  └── 依赖: @ldesign/http-core, solid-js

@ldesign/http-svelte
  └── 依赖: @ldesign/http-core, svelte
```

---

## 📝 重构计划

### 阶段一: 清理重复包 (优先级: 🔴 高)

#### 需要删除的目录
```
packages/http-core/          → 合并到 packages/core/
packages/http-adapters/      → 合并到 packages/core/src/adapters/
packages/http-interceptors/  → 合并到 packages/core/src/interceptors/
packages/http-features/      → 合并到 packages/core/src/features/
packages/http-utils/         → 合并到 packages/core/src/utils/
packages/http-vue/           → 合并到 packages/vue/
packages/http-devtools/      → 合并到 packages/core/src/devtools/
packages/http-presets/       → 合并到 packages/core/src/presets/
```

#### 需要合并的代码
1. **从 `src/` 移动到 `packages/core/src/`**
   - `src/adapters/` → `packages/core/src/adapters/`
   - `src/core/` → `packages/core/src/`
   - `src/interceptors/` → `packages/core/src/interceptors/`
   - `src/features/` → `packages/core/src/features/`
   - `src/utils/` → `packages/core/src/utils/`
   - `src/types/` → `packages/core/src/types/`
   - `src/devtools/` → `packages/core/src/devtools/`
   - `src/presets/` → `packages/core/src/presets/`

2. **从 `src/vue/` 移动到 `packages/vue/src/`**
   - `src/vue/` → `packages/vue/src/composables/`

### 阶段二: 完善核心包 (优先级: 🔴 高)

#### 核心包结构优化
```
packages/core/src/
├── client/                   # HTTP客户端核心
│   ├── HttpClient.ts        # 主客户端类
│   ├── factory.ts           # 工厂函数
│   └── index.ts
│
├── adapters/                 # 适配器系统
│   ├── base.ts              # 基础适配器接口
│   ├── fetch.ts             # Fetch适配器
│   ├── axios.ts             # Axios适配器
│   ├── alova.ts             # Alova适配器
│   ├── factory.ts           # 适配器工厂
│   └── index.ts
│
├── interceptors/             # 拦截器系统
│   ├── manager.ts           # 拦截器管理器
│   ├── common.ts            # 通用拦截器
│   ├── auth.ts              # 认证拦截器
│   ├── logging.ts           # 日志拦截器
│   ├── retry.ts             # 重试拦截器
│   └── index.ts
│
├── cache/                    # 缓存系统
│   ├── CacheManager.ts      # 缓存管理器
│   ├── strategies.ts        # 缓存策略
│   ├── storage.ts           # 存储适配器
│   └── index.ts
│
├── retry/                    # 重试机制
│   ├── RetryManager.ts      # 重试管理器
│   ├── strategies.ts        # 重试策略
│   └── index.ts
│
├── middleware/               # 中间件系统
│   ├── types.ts             # 中间件类型
│   ├── compose.ts           # 中间件组合
│   └── index.ts
│
├── features/                 # 高级特性
│   ├── circuit-breaker.ts   # 熔断器
│   ├── rate-limit.ts        # 限流
│   ├── concurrency.ts       # 并发控制
│   ├── deduplication.ts     # 请求去重
│   ├── mock.ts              # Mock功能
│   ├── graphql.ts           # GraphQL支持
│   ├── sse.ts               # Server-Sent Events
│   ├── websocket.ts         # WebSocket
│   └── index.ts
│
├── devtools/                 # 开发工具
│   ├── DevTools.ts          # 开发工具主类
│   ├── logger.ts            # 日志工具
│   ├── monitor.ts           # 监控工具
│   └── index.ts
│
├── presets/                  # 预设配置
│   ├── restful.ts           # RESTful预设
│   ├── graphql.ts           # GraphQL预设
│   ├── microservice.ts      # 微服务预设
│   └── index.ts
│
├── types/                    # 类型定义
│   ├── base.ts              # 基础类型
│   ├── client.ts            # 客户端类型
│   ├── adapter.ts           # 适配器类型
│   ├── interceptor.ts       # 拦截器类型
│   ├── cache.ts             # 缓存类型
│   ├── retry.ts             # 重试类型
│   └── index.ts
│
├── utils/                    # 工具函数
│   ├── error.ts             # 错误处理
│   ├── helpers.ts           # 辅助函数
│   ├── validators.ts        # 验证器
│   └── index.ts
│
└── index.ts                  # 主入口
```

### 阶段三: 完善框架适配层 (优先级: 🟡 中)

#### React 适配器增强
```typescript
// packages/react/src/hooks/
- useHttp.ts              # 基础HTTP请求
- useQuery.ts             # 查询数据
- useMutation.ts          # 修改数据
- usePagination.ts        # 分页
- useInfiniteScroll.ts    # 无限滚动
- usePolling.ts           # 轮询
- useWebSocket.ts         # WebSocket
- useSSE.ts               # Server-Sent Events
```

#### Vue 适配器增强
```typescript
// packages/vue/src/composables/
- useHttp.ts              # 基础HTTP请求
- useQuery.ts             # 查询数据
- useMutation.ts          # 修改数据
- usePagination.ts        # 分页
- useInfiniteScroll.ts    # 无限滚动
- usePolling.ts           # 轮询
- useWebSocket.ts         # WebSocket
- useSSE.ts               # Server-Sent Events
```

#### Solid 适配器增强
```typescript
// packages/solid/src/hooks/
- createHttp.ts           # 基础HTTP请求
- createQuery.ts          # 查询数据
- createMutation.ts       # 修改数据
- createPagination.ts     # 分页
- createInfiniteScroll.ts # 无限滚动
```

#### Svelte 适配器增强
```typescript
// packages/svelte/src/stores/
- httpStore.ts            # HTTP状态存储
- queryStore.ts           # 查询存储
- mutationStore.ts        # 修改存储
- paginationStore.ts      # 分页存储
```

### 阶段四: 文档整理 (优先级: 🟢 低)

#### 需要删除的文档
```
CHANGELOG_v0.3.0.md
DEVELOPMENT.md
HTTP包优化总结报告.md
HTTP包优化记录.md
HTTP包全面分析总结.md
MIGRATION_GUIDE.md
NEW_STRUCTURE_GUIDE.md
QUICK_START.md
QUICK_START_NEW.md
README_优化完成.md
REORGANIZATION_SUMMARY.md
✅_全部优化完成.md
优化功能使用指南.md
优化完成总结.md
优化工作完成.md
优化工作进度.md
优化建议和最佳实践.md
使用指南.md
性能优化指南.md
最终优化报告.md
🎉_优化完成报告.md
🎯_所有任务100%完成.md
packages/COMPLETION_REPORT.md
packages/OPTIMIZATION_REPORT.md
packages/SUMMARY.md
```

#### 保留的文档结构
```
docs/
├── guide/                # 使用指南
│   ├── getting-started.md
│   ├── core-concepts.md
│   ├── adapters.md
│   ├── interceptors.md
│   ├── caching.md
│   └── retry.md
├── api/                  # API文档
│   ├── core.md
│   ├── react.md
│   ├── vue.md
│   ├── solid.md
│   └── svelte.md
├── examples/             # 示例
│   ├── basic.md
│   ├── advanced.md
│   └── framework-specific.md
└── migration/            # 迁移指南
    └── v0.3.0.md
```

---

## 🎨 核心API设计

### 1. HTTP客户端核心

```typescript
// packages/core/src/client/HttpClient.ts

import type {
  HttpClientConfig,
  RequestConfig,
  ResponseData,
  HttpAdapter,
  InterceptorManager,
} from '../types'

/**
 * HTTP 客户端
 */
export class HttpClient {
  private config: HttpClientConfig
  private adapter: HttpAdapter
  private interceptors: InterceptorManager

  constructor(config: HttpClientConfig, adapter?: HttpAdapter) {
    this.config = config
    this.adapter = adapter || this.selectAdapter()
    this.interceptors = new InterceptorManagerImpl()
  }

  /**
   * 发送请求
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    // 1. 合并配置
    const finalConfig = this.mergeConfig(config)

    // 2. 执行请求拦截器
    const processedConfig = await this.interceptors.processRequest(finalConfig)

    // 3. 发送请求
    try {
      const response = await this.adapter.request<T>(processedConfig)

      // 4. 执行响应拦截器
      return await this.interceptors.processResponse(response)
    }
    catch (error) {
      // 5. 执行错误拦截器
      throw await this.interceptors.processError(error)
    }
  }

  /**
   * GET 请求
   */
  async get<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'GET' })
  }

  /**
   * POST 请求
   */
  async post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data })
  }

  /**
   * PUT 请求
   */
  async put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', data })
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' })
  }

  /**
   * PATCH 请求
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', data })
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: RequestInterceptor): number {
    return this.interceptors.addRequest(interceptor)
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): number {
    return this.interceptors.addResponse(interceptor)
  }

  /**
   * 添加错误拦截器
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): number {
    return this.interceptors.addError(interceptor)
  }

  /**
   * 移除拦截器
   */
  removeInterceptor(id: number): void {
    this.interceptors.remove(id)
  }

  /**
   * 取消请求
   */
  cancel(reason?: string): void {
    // 实现取消逻辑
  }

  private selectAdapter(): HttpAdapter {
    // 自动选择适配器
    if (typeof fetch !== 'undefined') {
      return new FetchAdapter()
    }
    throw new Error('No suitable adapter found')
  }

  private mergeConfig(config: RequestConfig): RequestConfig {
    return {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    }
  }
}
```

### 2. 工厂函数

```typescript
// packages/core/src/client/factory.ts

import { HttpClient } from './HttpClient'
import type { HttpClientConfig, HttpAdapter } from '../types'

/**
 * 创建 HTTP 客户端
 */
export async function createHttpClient(
  config: HttpClientConfig = {},
  adapter?: HttpAdapter,
): Promise<HttpClient> {
  return new HttpClient(config, adapter)
}

/**
 * 创建 HTTP 客户端 (同步)
 */
export function createHttpClientSync(
  config: HttpClientConfig = {},
  adapter?: HttpAdapter,
): HttpClient {
  return new HttpClient(config, adapter)
}
```

### 3. 拦截器系统

```typescript
// packages/core/src/interceptors/manager.ts

import type {
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RequestConfig,
  ResponseData,
} from '../types'

/**
 * 拦截器管理器
 */
export class InterceptorManager {
  private requestInterceptors: Map<number, RequestInterceptor> = new Map()
  private responseInterceptors: Map<number, ResponseInterceptor> = new Map()
  private errorInterceptors: Map<number, ErrorInterceptor> = new Map()
  private nextId = 0

  /**
   * 添加请求拦截器
   */
  addRequest(interceptor: RequestInterceptor): number {
    const id = this.nextId++
    this.requestInterceptors.set(id, interceptor)
    return id
  }

  /**
   * 添加响应拦截器
   */
  addResponse(interceptor: ResponseInterceptor): number {
    const id = this.nextId++
    this.responseInterceptors.set(id, interceptor)
    return id
  }

  /**
   * 添加错误拦截器
   */
  addError(interceptor: ErrorInterceptor): number {
    const id = this.nextId++
    this.errorInterceptors.set(id, interceptor)
    return id
  }

  /**
   * 移除拦截器
   */
  remove(id: number): void {
    this.requestInterceptors.delete(id)
    this.responseInterceptors.delete(id)
    this.errorInterceptors.delete(id)
  }

  /**
   * 处理请求
   */
  async processRequest(config: RequestConfig): Promise<RequestConfig> {
    let result = config
    for (const interceptor of this.requestInterceptors.values()) {
      result = await interceptor(result)
    }
    return result
  }

  /**
   * 处理响应
   */
  async processResponse<T>(response: ResponseData<T>): Promise<ResponseData<T>> {
    let result = response
    for (const interceptor of this.responseInterceptors.values()) {
      result = await interceptor(result)
    }
    return result
  }

  /**
   * 处理错误
   */
  async processError(error: unknown): Promise<unknown> {
    let result = error
    for (const interceptor of this.errorInterceptors.values()) {
      result = await interceptor(result)
    }
    return result
  }
}
```

### 4. 缓存系统

```typescript
// packages/core/src/cache/CacheManager.ts

import type { CacheConfig, CacheStrategy, CacheStorage } from '../types'

/**
 * 缓存管理器
 */
export class CacheManager {
  private storage: CacheStorage
  private strategy: CacheStrategy
  private config: CacheConfig

  constructor(config: CacheConfig) {
    this.config = config
    this.storage = config.storage || new MemoryStorage()
    this.strategy = config.strategy || new LRUStrategy()
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.storage.get(key)

    if (!cached) {
      return null
    }

    // 检查是否过期
    if (this.isExpired(cached)) {
      await this.storage.delete(key)
      return null
    }

    return cached.data as T
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl : undefined
    await this.storage.set(key, { data, expiresAt })

    // 应用缓存策略
    await this.strategy.apply(this.storage)
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    await this.storage.delete(key)
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    await this.storage.clear()
  }

  /**
   * 检查是否过期
   */
  private isExpired(cached: { expiresAt?: number }): boolean {
    if (!cached.expiresAt) {
      return false
    }
    return Date.now() > cached.expiresAt
  }
}
```

### 5. 重试机制

```typescript
// packages/core/src/retry/RetryManager.ts

import type { RetryConfig, RetryStrategy } from '../types'

/**
 * 重试管理器
 */
export class RetryManager {
  private config: RetryConfig
  private strategy: RetryStrategy

  constructor(config: RetryConfig) {
    this.config = config
    this.strategy = config.strategy || new ExponentialBackoffStrategy()
  }

  /**
   * 执行重试
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: { attempt: number },
  ): Promise<T> {
    const maxAttempts = this.config.maxAttempts || 3
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      }
      catch (error) {
        lastError = error as Error

        // 检查是否应该重试
        if (!this.shouldRetry(error, attempt, maxAttempts)) {
          throw error
        }

        // 计算延迟时间
        const delay = this.strategy.getDelay(attempt)

        // 等待后重试
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: unknown, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) {
      return false
    }

    // 检查错误类型
    if (this.config.retryCondition) {
      return this.config.retryCondition(error)
    }

    // 默认重试网络错误和5xx错误
    const httpError = error as { status?: number }
    return !httpError.status || httpError.status >= 500
  }

  /**
   * 延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 指数退避策略
 */
export class ExponentialBackoffStrategy implements RetryStrategy {
  getDelay(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000)
  }
}
```

### 6. 适配器系统

```typescript
// packages/core/src/adapters/fetch.ts

import type { HttpAdapter, RequestConfig, ResponseData } from '../types'

/**
 * Fetch 适配器
 */
export class FetchAdapter implements HttpAdapter {
  name = 'fetch'

  /**
   * 发送请求
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    const url = this.buildURL(config)
    const options = this.buildOptions(config)

    try {
      const response = await fetch(url, options)

      // 解析响应
      const data = await this.parseResponse<T>(response, config)

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
        config,
      }
    }
    catch (error) {
      throw this.handleError(error, config)
    }
  }

  /**
   * 检查是否支持
   */
  isSupported(): boolean {
    return typeof fetch !== 'undefined'
  }

  /**
   * 构建URL
   */
  private buildURL(config: RequestConfig): string {
    const { baseURL = '', url = '', params } = config
    let fullURL = baseURL + url

    if (params) {
      const queryString = new URLSearchParams(params as Record<string, string>).toString()
      fullURL += (fullURL.includes('?') ? '&' : '?') + queryString
    }

    return fullURL
  }

  /**
   * 构建请求选项
   */
  private buildOptions(config: RequestConfig): RequestInit {
    const { method = 'GET', headers, data, timeout, signal } = config

    const options: RequestInit = {
      method,
      headers: headers as HeadersInit,
      signal,
    }

    // 添加请求体
    if (data && method !== 'GET' && method !== 'HEAD') {
      if (data instanceof FormData) {
        options.body = data
      }
      else {
        options.body = JSON.stringify(data)
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json',
        }
      }
    }

    // 处理超时
    if (timeout) {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), timeout)
      options.signal = controller.signal
    }

    return options
  }

  /**
   * 解析响应
   */
  private async parseResponse<T>(response: Response, config: RequestConfig): Promise<T> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      return await response.json()
    }

    if (contentType?.includes('text/')) {
      return await response.text() as T
    }

    if (config.responseType === 'blob') {
      return await response.blob() as T
    }

    if (config.responseType === 'arraybuffer') {
      return await response.arrayBuffer() as T
    }

    return await response.json()
  }

  /**
   * 解析响应头
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown, config: RequestConfig): Error {
    if (error instanceof Error) {
      return Object.assign(error, { config })
    }
    return new Error(String(error))
  }
}
```

---

## 🔌 框架适配层设计

### React 适配器

```typescript
// packages/react/src/hooks/useQuery.ts

import { useState, useEffect, useCallback } from 'react'
import type { HttpClient, RequestConfig } from '@ldesign/http-core'

export interface UseQueryOptions<T> extends RequestConfig {
  enabled?: boolean
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface UseQueryReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  isStale: boolean
}

/**
 * 查询数据 Hook
 */
export function useQuery<T = unknown>(
  key: string | string[],
  fetcher: () => Promise<T>,
  options: UseQueryOptions<T> = {},
): UseQueryReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isStale, setIsStale] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      setIsStale(false)
      options.onSuccess?.(result)
    }
    catch (e) {
      const err = e as Error
      setError(err)
      options.onError?.(err)
    }
    finally {
      setLoading(false)
    }
  }, [fetcher, options])

  // 自动获取
  useEffect(() => {
    if (options.enabled !== false) {
      fetch()
    }
  }, [fetch, options.enabled])

  // 定时刷新
  useEffect(() => {
    if (options.refetchInterval) {
      const timer = setInterval(fetch, options.refetchInterval)
      return () => clearInterval(timer)
    }
  }, [fetch, options.refetchInterval])

  // 窗口聚焦时刷新
  useEffect(() => {
    if (options.refetchOnWindowFocus) {
      const handleFocus = () => {
        setIsStale(true)
        fetch()
      }
      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }
  }, [fetch, options.refetchOnWindowFocus])

  return {
    data,
    loading,
    error,
    refetch: fetch,
    isStale,
  }
}
```

### Vue 适配器

```typescript
// packages/vue/src/composables/useQuery.ts

import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { HttpClient, RequestConfig } from '@ldesign/http-core'

export interface UseQueryOptions<T> extends RequestConfig {
  enabled?: Ref<boolean> | boolean
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface UseQueryReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  refetch: () => Promise<void>
  isStale: Ref<boolean>
}

/**
 * 查询数据组合式函数
 */
export function useQuery<T = unknown>(
  key: string | Ref<string> | string[],
  fetcher: () => Promise<T>,
  options: UseQueryOptions<T> = {},
): UseQueryReturn<T> {
  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const isStale = ref(false)

  async function fetch(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const result = await fetcher()
      data.value = result
      isStale.value = false
      options.onSuccess?.(result)
    }
    catch (e) {
      error.value = e as Error
      options.onError?.(e as Error)
    }
    finally {
      loading.value = false
    }
  }

  // 监听 enabled 变化
  const enabled = typeof options.enabled === 'boolean'
    ? ref(options.enabled)
    : options.enabled || ref(true)

  watch(enabled, (val) => {
    if (val) {
      fetch()
    }
  }, { immediate: true })

  // 定时刷新
  let refetchTimer: NodeJS.Timeout | null = null
  if (options.refetchInterval) {
    onMounted(() => {
      refetchTimer = setInterval(fetch, options.refetchInterval)
    })
    onUnmounted(() => {
      if (refetchTimer) {
        clearInterval(refetchTimer)
      }
    })
  }

  // 窗口聚焦时刷新
  if (options.refetchOnWindowFocus) {
    const handleFocus = () => {
      isStale.value = true
      fetch()
    }
    onMounted(() => {
      window.addEventListener('focus', handleFocus)
    })
    onUnmounted(() => {
      window.removeEventListener('focus', handleFocus)
    })
  }

  return {
    data,
    loading,
    error,
    refetch: fetch,
    isStale,
  }
}
```

### Solid 适配器

```typescript
// packages/solid/src/hooks/createQuery.ts

import { createSignal, createEffect, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'
import type { HttpClient, RequestConfig } from '@ldesign/http-core'

export interface CreateQueryOptions<T> extends RequestConfig {
  enabled?: Accessor<boolean> | boolean
  refetchInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface CreateQueryReturn<T> {
  data: Accessor<T | null>
  loading: Accessor<boolean>
  error: Accessor<Error | null>
  refetch: () => Promise<void>
}

/**
 * 查询数据 Hook
 */
export function createQuery<T = unknown>(
  key: string | Accessor<string>,
  fetcher: () => Promise<T>,
  options: CreateQueryOptions<T> = {},
): CreateQueryReturn<T> {
  const [data, setData] = createSignal<T | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  async function fetch(): Promise<void> {
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(() => result)
      options.onSuccess?.(result)
    }
    catch (e) {
      setError(e as Error)
      options.onError?.(e as Error)
    }
    finally {
      setLoading(false)
    }
  }

  // 自动获取
  createEffect(() => {
    const enabled = typeof options.enabled === 'function'
      ? options.enabled()
      : options.enabled !== false

    if (enabled) {
      fetch()
    }
  })

  // 定时刷新
  if (options.refetchInterval) {
    const timer = setInterval(fetch, options.refetchInterval)
    onCleanup(() => clearInterval(timer))
  }

  return {
    data,
    loading,
    error,
    refetch: fetch,
  }
}
```

### Svelte 适配器

```typescript
// packages/svelte/src/stores/queryStore.ts

import { writable, derived } from 'svelte/store'
import type { Readable, Writable } from 'svelte/store'
import type { HttpClient, RequestConfig } from '@ldesign/http-core'

export interface QueryStoreOptions<T> extends RequestConfig {
  enabled?: boolean
  refetchInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface QueryStore<T> extends Readable<{
  data: T | null
  loading: boolean
  error: Error | null
}> {
  refetch: () => Promise<void>
}

/**
 * 创建查询存储
 */
export function createQueryStore<T = unknown>(
  key: string,
  fetcher: () => Promise<T>,
  options: QueryStoreOptions<T> = {},
): QueryStore<T> {
  const data = writable<T | null>(null)
  const loading = writable(false)
  const error = writable<Error | null>(null)

  async function fetch(): Promise<void> {
    loading.set(true)
    error.set(null)

    try {
      const result = await fetcher()
      data.set(result)
      options.onSuccess?.(result)
    }
    catch (e) {
      error.set(e as Error)
      options.onError?.(e as Error)
    }
    finally {
      loading.set(false)
    }
  }

  // 自动获取
  if (options.enabled !== false) {
    fetch()
  }

  // 定时刷新
  let refetchTimer: NodeJS.Timeout | null = null
  if (options.refetchInterval) {
    refetchTimer = setInterval(fetch, options.refetchInterval)
  }

  const store = derived(
    [data, loading, error],
    ([$data, $loading, $error]) => ({
      data: $data,
      loading: $loading,
      error: $error,
    }),
  )

  return {
    subscribe: store.subscribe,
    refetch: fetch,
  }
}
```

---

## 📋 实施步骤

### 第一步: 备份和准备 (1天)

1. **创建备份分支**
   ```bash
   git checkout -b backup/before-refactoring
   git push origin backup/before-refactoring
   ```

2. **创建重构分支**
   ```bash
   git checkout -b refactor/http-structure
   ```

3. **分析依赖关系**
   - 列出所有包的依赖
   - 确定迁移顺序
   - 标记需要更新的引用

### 第二步: 合并核心包 (2-3天)

1. **合并 `http-*` 包到 `core/`**
   ```bash
   # 1. 合并适配器
   cp -r packages/http-adapters/src/* packages/core/src/adapters/

   # 2. 合并拦截器
   cp -r packages/http-interceptors/src/* packages/core/src/interceptors/

   # 3. 合并特性
   cp -r packages/http-features/src/* packages/core/src/features/

   # 4. 合并工具
   cp -r packages/http-utils/src/* packages/core/src/utils/

   # 5. 合并开发工具
   cp -r packages/http-devtools/src/* packages/core/src/devtools/

   # 6. 合并预设
   cp -r packages/http-presets/src/* packages/core/src/presets/
   ```

2. **移动 `src/` 到 `packages/core/src/`**
   ```bash
   # 移动核心代码
   cp -r src/adapters/* packages/core/src/adapters/
   cp -r src/core/* packages/core/src/
   cp -r src/interceptors/* packages/core/src/interceptors/
   cp -r src/features/* packages/core/src/features/
   cp -r src/utils/* packages/core/src/utils/
   cp -r src/types/* packages/core/src/types/
   ```

3. **更新导入路径**
   - 使用 IDE 的重构功能
   - 批量替换导入路径
   - 验证所有引用

4. **更新 `package.json`**
   - 更新导出配置
   - 更新依赖关系
   - 更新构建脚本

### 第三步: 合并框架适配器 (1-2天)

1. **合并 Vue 适配器**
   ```bash
   # 合并 src/vue/ 到 packages/vue/
   cp -r src/vue/* packages/vue/src/composables/

   # 合并 http-vue 到 packages/vue/
   cp -r packages/http-vue/src/* packages/vue/src/
   ```

2. **验证框架适配器**
   - 检查 React 适配器
   - 检查 Vue 适配器
   - 检查 Solid 适配器
   - 检查 Svelte 适配器

### 第四步: 删除重复包 (1天)

1. **删除旧包**
   ```bash
   rm -rf packages/http-core
   rm -rf packages/http-adapters
   rm -rf packages/http-interceptors
   rm -rf packages/http-features
   rm -rf packages/http-utils
   rm -rf packages/http-vue
   rm -rf packages/http-devtools
   rm -rf packages/http-presets
   ```

2. **清理 `src/` 目录**
   ```bash
   # 保留主入口文件
   # 删除已迁移的代码
   rm -rf src/adapters
   rm -rf src/core
   rm -rf src/interceptors
   rm -rf src/features
   rm -rf src/utils
   rm -rf src/vue
   ```

### 第五步: 更新文档 (1-2天)

1. **删除过时文档**
   ```bash
   rm CHANGELOG_v0.3.0.md
   rm DEVELOPMENT.md
   rm HTTP包*.md
   rm MIGRATION_GUIDE.md
   rm NEW_STRUCTURE_GUIDE.md
   rm QUICK_START*.md
   rm README_优化完成.md
   rm REORGANIZATION_SUMMARY.md
   rm *.md (所有优化相关的文档)
   ```

2. **创建新文档**
   - 更新主 README.md
   - 创建迁移指南
   - 更新 API 文档
   - 添加示例代码

### 第六步: 测试和验证 (2-3天)

1. **运行测试**
   ```bash
   # 测试核心包
   cd packages/core && pnpm test

   # 测试框架适配器
   cd packages/react && pnpm test
   cd packages/vue && pnpm test
   cd packages/solid && pnpm test
   cd packages/svelte && pnpm test
   ```

2. **构建验证**
   ```bash
   # 构建所有包
   pnpm -r build

   # 验证构建产物
   pnpm build:validate
   ```

3. **示例验证**
   ```bash
   # 运行示例项目
   cd examples/react && pnpm dev
   cd examples/vue3 && pnpm dev
   ```

### 第七步: 发布 (1天)

1. **更新版本号**
   ```bash
   pnpm version minor
   ```

2. **生成变更日志**
   ```bash
   pnpm changelog
   ```

3. **发布包**
   ```bash
   pnpm publish -r
   ```

---

## 📊 预期成果

### 代码质量提升
- ✅ 消除重复代码
- ✅ 清晰的职责分离
- ✅ 更好的可维护性
- ✅ 统一的代码风格

### 包体积优化
- ✅ 核心包: ~30KB (gzipped)
- ✅ React 适配器: ~5KB (gzipped)
- ✅ Vue 适配器: ~5KB (gzipped)
- ✅ Solid 适配器: ~5KB (gzipped)
- ✅ Svelte 适配器: ~5KB (gzipped)

### 开发体验改善
- ✅ 更清晰的 API
- ✅ 更好的类型提示
- ✅ 更完善的文档
- ✅ 更多的示例

### 性能提升
- ✅ 更快的构建速度
- ✅ 更小的包体积
- ✅ 更好的 Tree-shaking
- ✅ 更优的运行时性能

---

## ⚠️ 风险和注意事项

### 破坏性变更
- 导入路径变化
- API 可能有调整
- 需要提供迁移指南

### 兼容性
- 确保向后兼容
- 提供过渡期
- 保留旧版本支持

### 测试覆盖
- 增加测试用例
- 确保功能完整
- 性能回归测试

---

## 📚 参考资料

- [Monorepo 最佳实践](https://monorepo.tools/)
- [包设计原则](https://github.com/mattpocock/pkg-size)
- [TypeScript 项目结构](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [@ldesign/engine 架构参考](../../engine/README.md)


