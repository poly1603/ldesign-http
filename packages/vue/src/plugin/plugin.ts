/**
 * @ldesign/http-vue 插件系统
 *
 * 提供两种插件：
 * 1. createHttpPlugin - 标准 Vue 插件，用于普通 Vue 3 应用
 * 2. createHttpEnginePlugin - Engine 适配器插件，用于 @ldesign/engine-vue3 集成
 */

import type { App, Plugin } from 'vue'
import type { HttpClient } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { HTTP_CLIENT_KEY } from '../lib/symbols'

// ==================== 类型定义 ====================

/**
 * HTTP 插件配置选项（原生 Vue 插件）
 */
export interface HttpPluginOptions {
  /**
   * HTTP 客户端实例（可选）
   * 如果不提供，将使用默认配置创建新实例
   */
  client?: HttpClient

  /**
   * 基础 URL
   */
  baseURL?: string

  /**
   * 请求超时时间（毫秒）
   * @default 10000
   */
  timeout?: number

  /**
   * 默认请求头
   */
  headers?: Record<string, string>

  /**
   * 是否添加全局属性 $http
   * @default true
   */
  globalProperties?: boolean

  /**
   * 是否启用缓存
   * @default false
   */
  enableCache?: boolean

  /**
   * 是否启用重试
   * @default false
   */
  enableRetry?: boolean

  /**
   * 重试次数
   * @default 3
   */
  retryCount?: number

  /**
   * 适配器类型
   * @default 'fetch'
   */
  adapter?: 'fetch' | 'axios' | 'alova'
}

/**
 * Engine 插件配置选项
 */
export interface HttpEnginePluginOptions extends HttpPluginOptions {
  /**
   * 插件名称
   * @default 'http'
   */
  name?: string

  /**
   * 插件优先级
   * @default 100
   */
  priority?: number
}

// ==================== 原生 Vue 插件 ====================

/**
 * 创建 HTTP Vue 插件（原生 Vue 应用）
 *
 * 适用于标准 Vue 3 应用，通过 `app.use()` 安装。
 * 安装后可通过 `inject(HTTP_CLIENT_KEY)` 或 `$http` 全局属性访问客户端。
 *
 * @param options - 插件配置选项
 * @returns Vue 插件实例
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { createHttpPlugin } from '@ldesign/http-vue'
 *
 * const app = createApp(App)
 *
 * app.use(createHttpPlugin({
 *   baseURL: 'https://api.example.com',
 *   timeout: 10000,
 *   enableCache: true,
 *   enableRetry: true,
 * }))
 * ```
 */
export function createHttpPlugin(options: HttpPluginOptions = {}): Plugin {
  return {
    install(app: App) {
      const {
        client: providedClient,
        globalProperties = true,
        baseURL,
        timeout = 10000,
        headers,
        enableCache = false,
        enableRetry = false,
        retryCount = 3,
        adapter = 'fetch',
      } = options

      // 创建或使用提供的 HTTP 客户端
      const client = providedClient || createHttpClient({
        baseURL,
        timeout,
        headers,
        adapter,
        cache: enableCache ? { enabled: true } : undefined,
        retry: enableRetry ? { maxRetries: retryCount } : undefined,
      })

      // 提供依赖注入
      app.provide(HTTP_CLIENT_KEY, client)

      // 添加全局属性
      if (globalProperties) {
        app.config.globalProperties.$http = client
      }
    },
  }
}

/**
 * HTTP Vue 插件（默认实例）
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { HttpPlugin } from '@ldesign/http-vue'
 *
 * const app = createApp(App)
 * app.use(HttpPlugin)
 * ```
 */
export const HttpPlugin: Plugin = createHttpPlugin()

// ==================== Engine 适配器插件 ====================

/**
 * 安装 HTTP 客户端到 Vue 应用实例
 */
function installToVueApp(
  app: any,
  client: HttpClient,
  globalProperties: boolean,
): void {
  app.provide(HTTP_CLIENT_KEY, client)
  if (globalProperties) {
    app.config.globalProperties.$http = client
  }
}

/**
 * 创建 HTTP Engine 插件
 *
 * 适用于 @ldesign/engine-vue3 集成。遵循 Engine 插件接口，
 * 会自动检测 Vue 应用状态并注入 HTTP 客户端。
 *
 * @param options - Engine 插件配置选项
 * @returns Engine 插件实例
 *
 * @example
 * ```ts
 * import { createVueEngine } from '@ldesign/engine-vue3'
 * import { createHttpEnginePlugin } from '@ldesign/http-vue'
 *
 * const engine = createVueEngine({
 *   plugins: [
 *     createHttpEnginePlugin({
 *       baseURL: 'https://api.example.com',
 *       timeout: 10000,
 *     }),
 *   ],
 * })
 *
 * await engine.mount('#app')
 * ```
 */
export function createHttpEnginePlugin(options: HttpEnginePluginOptions = {}) {
  const {
    name = 'http',
    priority = 100,
    client: providedClient,
    baseURL,
    timeout = 10000,
    headers,
    enableCache = false,
    enableRetry = false,
    retryCount = 3,
    adapter = 'fetch',
    globalProperties = true,
  } = options

  return {
    name,
    priority,
    async install(context: any) {
      const engine: any = context?.engine || context

      if (!engine) {
        throw new Error('[HTTP Plugin] Engine instance not found in context')
      }

      // 创建或使用提供的 HTTP 客户端
      const client = providedClient || await createHttpClient({
        baseURL,
        timeout,
        headers,
        adapter,
        cache: enableCache ? { enabled: true } : undefined,
        retry: enableRetry ? { maxRetries: retryCount } : undefined,
      })

      // 注册到 Engine API（如果可用）
      if (engine.api && typeof engine.api.register === 'function') {
        engine.api.register({
          name: 'http',
          version: '1.0.0',
          client,
          get: client.get.bind(client),
          post: client.post.bind(client),
          put: client.put.bind(client),
          delete: client.delete.bind(client),
          request: client.request.bind(client),
        })
      }

      // 注册到 Engine 容器（如果可用）
      if (context.container && typeof context.container.singleton === 'function') {
        context.container.singleton('httpClient', client)
      }

      // 安装到 Vue 应用
      const vueApp = engine.getApp?.()
      if (vueApp) {
        installToVueApp(vueApp, client, globalProperties)
      } else if (engine.events && typeof engine.events.once === 'function') {
        engine.events.once('app:created', ({ app }: any) => {
          installToVueApp(app, client, globalProperties)
        })
      }
    },
  }
}

/**
 * 创建默认 HTTP Engine 插件
 */
export function createDefaultHttpEnginePlugin() {
  return createHttpEnginePlugin({
    name: 'http',
    priority: 100,
    timeout: 10000,
    enableCache: true,
    enableRetry: true,
    retryCount: 3,
    adapter: 'fetch',
  })
}

/**
 * HTTP Engine 插件（默认实例）
 *
 * @example
 * ```ts
 * import { createVueEngine } from '@ldesign/engine-vue3'
 * import { httpPlugin } from '@ldesign/http-vue'
 *
 * const engine = createVueEngine({
 *   plugins: [httpPlugin],
 * })
 * ```
 */
export const httpPlugin = createDefaultHttpEnginePlugin()

// ==================== 类型扩展 ====================

/**
 * 扩展 Vue 全局属性类型
 */
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    /**
     * HTTP 客户端实例
     */
    $http: HttpClient
  }
}
