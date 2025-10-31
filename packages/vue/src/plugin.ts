import type { App, Plugin } from 'vue'
import type { HttpClient, HttpClientConfig } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { HTTP_CLIENT_KEY } from './symbols'

export interface HttpPluginOptions extends HttpClientConfig {
  /** 是否提供全局$http */
  globalProperties?: boolean
}

/**
 * Vue HTTP插件
 */
export const HttpPlugin: Plugin = {
  install(app: App, options: HttpPluginOptions = {}) {
    const { globalProperties = true, ...clientConfig } = options

    // 创建HTTP客户端
    const client: HttpClient = createHttpClient(clientConfig)

    // 提供依赖注入
    app.provide(HTTP_CLIENT_KEY, client)

    // 添加全局属性
    if (globalProperties) {
      app.config.globalProperties.$http = client
    }
  },
}

// 扩展全局属性类型
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $http: HttpClient
  }
}
