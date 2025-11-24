/**
 * @ldesign/http-vue 插件系统
 *
 * 提供两种插件：
 * 1. 标准 Vue 插件 - 用于普通 Vue 应用
 * 2. Engine 插件 - 用于 LDesign Engine 集成
 */

import type { App, Plugin } from 'vue'
import type { HttpClient } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { HTTP_CLIENT_KEY } from './symbols'

// ==================== 类型定义 ====================

/**
 * HTTP 插件配置选项
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

// ==================== Vue 插件 ====================

/**
 * 创建 HTTP Vue 插件
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

// ==================== Engine 插件 ====================

/**
 * 创建 HTTP Engine 插件
 * 用于与 @ldesign/engine 集成
 *
 * @param options - Engine 插件配置选项
 * @returns Engine 插件实例
 *
 * @example
 * ```ts
 * import { createEngine } from '@ldesign/engine'
 * import { createHttpEnginePlugin } from '@ldesign/http-vue'
 *
 * const engine = createEngine({
 *   plugins: [
 *     createHttpEnginePlugin({
 *       baseURL: 'https://api.example.com',
 *       timeout: 10000,
 *     }),
 *   ],
 * })
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
      // 从 context 中提取 engine（兼容不同的插件系统）
      const engine: any = context?.engine || context

      if (!engine) {
        throw new Error('[HTTP Plugin] Engine instance not found in context')
      }

      console.log('[HTTP Plugin] Installing with engine:', {
        hasGetApp: typeof engine.getApp === 'function',
        hasEvents: !!engine.events,
        hasApi: !!engine.api,
      })

      // 创建或使用提供的 HTTP 客户端
      const client = providedClient || await createHttpClient({
        baseURL,
        timeout,
        headers,
        adapter,
        cache: enableCache ? { enabled: true } : undefined,
        retry: enableRetry ? { maxRetries: retryCount } : undefined,
      })

      // 注册到 Engine API 注册表
      if (engine.api && typeof engine.api.register === 'function') {
        engine.api.register({
          name: 'http',
          version: '1.0.0',
          client,
          // 提供便捷方法
          get: client.get.bind(client),
          post: client.post.bind(client),
          put: client.put.bind(client),
          delete: client.delete.bind(client),
          request: client.request.bind(client),
        })
        console.log('[HTTP Plugin] Registered to Engine API')
      }

      // 等待 Vue 应用创建
      const installToVueApp = (app: any) => {
        // 提供 HTTP 客户端到 Vue 应用
        app.provide(HTTP_CLIENT_KEY, client)

        // 添加全局属性
        if (globalProperties) {
          app.config.globalProperties.$http = client
        }
      }

      // 如果 Vue 应用已经创建，立即安装
      const vueApp = engine.getApp?.()
      console.log('[HTTP Plugin] Checking Vue app:', {
        hasApp: !!vueApp,
        hasEvents: !!engine.events,
        hasOnce: !!(engine.events && typeof engine.events.once === 'function'),
      })

      if (vueApp) {
        console.log('[HTTP Plugin] Vue app already exists, installing immediately')
        installToVueApp(vueApp)
      }
      else if (engine.events && typeof engine.events.once === 'function') {
        // 否则等待 app:created 事件
        console.log('[HTTP Plugin] Waiting for app:created event')
        engine.events.once('app:created', ({ app }: any) => {
          console.log('[HTTP Plugin] app:created event received, installing to Vue app')
          installToVueApp(app)
        })
      }
      else {
        console.warn('[HTTP Plugin] Engine does not have events API, cannot install to Vue app')
      }
    },
  }
}

/**
 * 创建默认 HTTP Engine 插件
 *
 * @returns 默认配置的 Engine 插件实例
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
 * import { createEngine } from '@ldesign/engine'
 * import { httpPlugin } from '@ldesign/http-vue'
 *
 * const engine = createEngine({
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
