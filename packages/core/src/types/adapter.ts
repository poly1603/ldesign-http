/**
 * 适配器类型定义
 */

import type { RequestConfig, ResponseData } from './base'

/**
 * HTTP 适配器接口
 */
export interface HttpAdapter {
  /** 适配器名称 */
  name: string

  /** 发送请求 */
  request: <T = unknown>(config: RequestConfig) => Promise<ResponseData<T>>

  /** 是否支持当前环境 */
  isSupported: () => boolean
}

/**
 * 适配器工厂函数类型
 */
export type AdapterFactory = () => HttpAdapter


