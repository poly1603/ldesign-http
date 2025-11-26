import type { HttpClient } from '@ldesign/http-core'
import type { InjectionKey, Ref } from 'vue'

/**
 * HttpProvider 组件的 Props
 */
export interface HttpProviderProps {
  /**
   * HTTP 客户端配置
   */
  config?: Record<string, any>
  
  /**
   * 自定义 HttpClient 实例
   */
  client?: HttpClient
  
  /**
   * 是否启用 DevTools
   */
  devtools?: boolean
  
  /**
   * 是否继承父级配置
   */
  inherit?: boolean
}

/**
 * HttpProvider 注入的上下文
 */
export interface HttpProviderContext {
  /**
   * HttpClient 实例
   */
  client: HttpClient
  
  /**
   * 配置对象
   */
  config: Ref<Record<string, any>>
  
  /**
   * 是否启用 DevTools
   */
  devtools: Ref<boolean>
}

/**
 * HttpProvider 注入 Key
 */
export const HTTP_PROVIDER_KEY: InjectionKey<HttpProviderContext> = Symbol('http-provider')