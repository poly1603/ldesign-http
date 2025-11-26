import type { RequestConfig, HttpError } from '../../types/http'
import type { Component } from 'vue'

/**
 * HttpLoader 组件的 Props
 */
export interface HttpLoaderProps<T = any> {
  /**
   * 请求 URL
   */
  url: string

  /**
   * HTTP 方法
   * @default 'GET'
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

  /**
   * 请求参数（用于 GET 请求的查询字符串）
   */
  params?: Record<string, any>

  /**
   * 请求体数据（用于 POST/PUT/PATCH 请求）
   */
  data?: any

  /**
   * 是否立即执行请求
   * @default true
   */
  immediate?: boolean

  /**
   * 是否启用缓存
   * @default false
   */
  cache?: boolean

  /**
   * 缓存时间（毫秒）
   * @default 5 * 60 * 1000
   */
  cacheTtl?: number

  /**
   * 重试配置
   */
  retry?: {
    retries?: number
    retryDelay?: number
  }

  /**
   * 加载状态的自定义内容
   */
  loading?: string | Component

  /**
   * 错误状态的自定义内容
   */
  error?: string | Component

  /**
   * 空数据状态的自定义内容
   */
  empty?: string | Component

  /**
   * 是否显示重试按钮
   * @default true
   */
  retryable?: boolean

  /**
   * 请求配置
   */
  requestConfig?: RequestConfig

  /**
   * 轮询间隔（毫秒），设置后会自动轮询
   */
  pollingInterval?: number

  /**
   * 数据转换函数
   */
  transform?: (data: any) => T

  /**
   * 空数据判断函数
   */
  isEmpty?: (data: T) => boolean
}

/**
 * HttpLoader 插槽 Props
 */
export interface HttpLoaderSlotProps<T = any> {
  /**
   * 响应数据
   */
  data: T | null

  /**
   * 加载状态
   */
  loading: boolean

  /**
   * 错误对象
   */
  error: HttpError | null

  /**
   * 刷新函数
   */
  refresh: () => Promise<void>

  /**
   * 重试函数（使用指数退避）
   */
  retry: () => Promise<void>

  /**
   * 取消请求函数
   */
  cancel: () => void

  /**
   * 是否为空数据
   */
  isEmpty: boolean
}