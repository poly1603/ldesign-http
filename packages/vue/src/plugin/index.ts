/**
 * Vue 3 HTTP Plugin
 */

import type { App, Plugin } from 'vue'
import type { HttpClient, HttpClientConfig } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-core/adapters'

/**
 * HTTP 客户端符号
 */
export const HTTP_CLIENT_KEY = Symbol('http-client')

/**
 * 插件选项
 */
export interface HttpPluginOptions extends HttpClientConfig {
  /** 自定义适配器 */
  adapter?: any
}

/**
 * 创建 HTTP 插件
 * 
 * @param options - 插件选项
 * @returns Vue 插件
 * 
 * @example
 * ```typescript
 * import { createApp } from 'vue'
 * import { createHttpPlugin } from '@ldesign/http-vue'
 * 
 * const app = createApp(App)
 * app.use(createHttpPlugin({
 *   baseURL: 'https://api.example.com'
 * }))
 * ```
 */
export function createHttpPlugin(options: HttpPluginOptions = {}): Plugin {
  return {
    install(app: App) {
      const adapter = options.adapter || new FetchAdapter()
      const client = createHttpClient(options, adapter)

      // 提供全局 HTTP 客户端
      app.provide(HTTP_CLIENT_KEY, client)

      // 添加全局属性
      app.config.globalProperties.$http = client
    },
  }
}

/**
 * 使用 HTTP 客户端
 * 
 * @returns HTTP 客户端实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useHttpClient } from '@ldesign/http-vue'
 * 
 * const client = useHttpClient()
 * const data = await client.get('/users')
 * </script>
 * ```
 */
export function useHttpClient(): HttpClient {
  const client = inject<HttpClient>(HTTP_CLIENT_KEY)
  if (!client) {
    throw new Error('HTTP client not provided. Please install the HTTP plugin.')
  }
  return client
}

// 需要导入 inject
import { inject } from 'vue'
