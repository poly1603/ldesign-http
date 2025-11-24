import type { InjectionKey, Ref } from 'vue'
import type { HttpClient, RequestConfig } from '@ldesign/http-core'

/**
 * HTTP 客户端注入键
 */
export const HTTP_CLIENT_KEY: InjectionKey<HttpClient> = Symbol('HTTP_CLIENT')

/**
 * HTTP 配置注入键
 */
export const HTTP_CONFIG_KEY: InjectionKey<Ref<RequestConfig>> = Symbol('HTTP_CONFIG')
