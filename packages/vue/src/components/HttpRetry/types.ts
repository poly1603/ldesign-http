import type { HttpError } from '../../types/http'

/**
 * HttpRetry 组件的 Props
 */
export interface HttpRetryProps {
  /**
   * 错误对象
   */
  error: HttpError | Error | null

  /**
   * 当前重试次数
   * @default 0
   */
  retryCount?: number

  /**
   * 最大重试次数
   * @default 3
   */
  maxRetries?: number

  /**
   * 重试延迟（毫秒）
   * @default 1000
   */
  retryDelay?: number

  /**
   * 是否使用指数退避
   * @default true
   */
  exponentialBackoff?: boolean

  /**
   * 退避因子
   * @default 2
   */
  backoffFactor?: number

  /**
   * 是否自动重试
   * @default false
   */
  autoRetry?: boolean

  /**
   * 是否显示进度条
   * @default true
   */
  showProgress?: boolean

  /**
   * 是否显示倒计时
   * @default true
   */
  showCountdown?: boolean

  /**
   * 是否显示重试历史
   * @default false
   */
  showHistory?: boolean

  /**
   * 重试按钮文本
   * @default '立即重试'
   */
  retryText?: string

  /**
   * 取消按钮文本
   * @default '取消重试'
   */
  cancelText?: string

  /**
   * 是否禁用重试
   */
  disabled?: boolean
}

/**
 * 重试状态
 */
export type RetryStatus = 'idle' | 'retrying' | 'waiting' | 'success' | 'failed' | 'cancelled'

/**
 * 重试历史记录
 */
export interface RetryHistoryItem {
  /**
   * 重试次数
   */
  attempt: number

  /**
   * 重试时间戳
   */
  timestamp: number

  /**
   * 重试延迟（毫秒）
   */
  delay: number

  /**
   * 是否成功
   */
  success: boolean

  /**
   * 错误信息
   */
  error?: string

  /**
   * 响应时间（毫秒）
   */
  duration?: number
}

/**
 * 重试事件
 */
export interface RetryEmits {
  /**
   * 重试事件
   */
  retry: []

  /**
   * 取消事件
   */
  cancel: []

  /**
   * 状态变化事件
   */
  'status-change': [status: RetryStatus]

  /**
   * 重试成功事件
   */
  success: []

  /**
   * 重试失败事件（达到最大次数）
   */
  'max-retries-reached': []
}

/**
 * 计算下一次重试延迟
 */
export function calculateRetryDelay(
  retryCount: number,
  baseDelay: number,
  exponentialBackoff: boolean,
  backoffFactor: number
): number {
  if (!exponentialBackoff) {
    return baseDelay
  }

  // 指数退避：delay * (factor ^ retryCount)
  return Math.min(
    baseDelay * Math.pow(backoffFactor, retryCount),
    30000 // 最大 30 秒
  )
}

/**
 * 格式化剩余时间
 */
export function formatRemainingTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }

  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) {
    return `${seconds}秒`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}