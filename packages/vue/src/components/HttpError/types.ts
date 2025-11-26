import type { HttpError } from '../../types/http'

/**
 * HttpError 组件的 Props
 */
export interface HttpErrorProps {
  /**
   * 错误对象
   */
  error: HttpError | Error | null

  /**
   * 是否显示重试按钮
   * @default true
   */
  retryable?: boolean

  /**
   * 重试按钮文本
   * @default '重试'
   */
  retryText?: string

  /**
   * 是否显示错误详情
   * @default false
   */
  showDetails?: boolean

  /**
   * 是否显示错误代码
   * @default true
   */
  showCode?: boolean

  /**
   * 是否显示错误堆栈
   * @default false
   */
  showStack?: boolean

  /**
   * 自定义错误标题
   */
  title?: string

  /**
   * 自定义错误消息
   */
  message?: string

  /**
   * 错误类型图标
   */
  icon?: string

  /**
   * 最大重试次数提示
   */
  maxRetries?: number

  /**
   * 当前重试次数
   */
  retryCount?: number

  /**
   * 是否显示联系支持按钮
   * @default false
   */
  showSupport?: boolean

  /**
   * 支持链接
   */
  supportUrl?: string

  /**
   * 支持邮箱
   */
  supportEmail?: string
}

/**
 * 错误类型映射
 */
export interface ErrorTypeConfig {
  title: string
  message: string
  icon?: string
  color?: string
}

/**
 * 预定义的错误类型
 */
export const ERROR_TYPES: Record<string, ErrorTypeConfig> = {
  network: {
    title: '网络错误',
    message: '无法连接到服务器，请检查网络连接',
    icon: '🌐',
    color: '#f56c6c',
  },
  timeout: {
    title: '请求超时',
    message: '请求时间过长，请稍后重试',
    icon: '⏱️',
    color: '#e6a23c',
  },
  unauthorized: {
    title: '未授权',
    message: '您没有权限访问此资源',
    icon: '🔒',
    color: '#f56c6c',
  },
  forbidden: {
    title: '禁止访问',
    message: '服务器拒绝了您的请求',
    icon: '⛔',
    color: '#f56c6c',
  },
  notFound: {
    title: '资源不存在',
    message: '请求的资源未找到',
    icon: '🔍',
    color: '#909399',
  },
  serverError: {
    title: '服务器错误',
    message: '服务器遇到了问题，请稍后重试',
    icon: '⚠️',
    color: '#f56c6c',
  },
  cancel: {
    title: '请求已取消',
    message: '请求被用户取消',
    icon: '🚫',
    color: '#909399',
  },
  default: {
    title: '请求失败',
    message: '发生了未知错误',
    icon: '❌',
    color: '#f56c6c',
  },
}

/**
 * 获取错误类型配置
 */
export function getErrorTypeConfig(error: HttpError | Error | null): ErrorTypeConfig {
  if (!error) {
    return ERROR_TYPES.default
  }

  // 类型守卫 - 检查是否为 HttpError
  const httpError = error as any

  // 网络错误
  if (httpError.isNetworkError === true) {
    return ERROR_TYPES.network
  }

  // 超时错误
  if (httpError.isTimeoutError === true) {
    return ERROR_TYPES.timeout
  }

  // 取消错误
  if (httpError.isCancelError === true) {
    return ERROR_TYPES.cancel
  }

  // 根据状态码判断
  const status = httpError.status
  if (typeof status === 'number') {
    if (status === 401) {
      return ERROR_TYPES.unauthorized
    }
    if (status === 403) {
      return ERROR_TYPES.forbidden
    }
    if (status === 404) {
      return ERROR_TYPES.notFound
    }
    if (status >= 500) {
      return ERROR_TYPES.serverError
    }
  }

  return ERROR_TYPES.default
}