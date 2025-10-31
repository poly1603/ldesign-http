import type { InjectionKey } from 'vue'
import type { HttpClient } from '@ldesign/http-core'

/**
 * HTTP客户端注入键
 */
export const HTTP_CLIENT_KEY: InjectionKey<HttpClient> = Symbol('HTTP_CLIENT')
