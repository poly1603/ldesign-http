/**
 * HttpProgress 组件的 Props
 */
export interface HttpProgressProps {
  /**
   * 进度百分比 (0-100)
   */
  percent?: number

  /**
   * 进度类型
   * @default 'line'
   */
  type?: 'line' | 'circle' | 'dashboard'

  /**
   * 进度条状态
   */
  status?: 'normal' | 'active' | 'success' | 'error' | 'warning'

  /**
   * 进度条宽度（像素）
   * @default 6
   */
  strokeWidth?: number

  /**
   * 进度条颜色
   */
  color?: string | string[] | ProgressColorFunc

  /**
   * 未完成部分的颜色
   */
  trailColor?: string

  /**
   * 是否显示进度文字
   * @default true
   */
  showText?: boolean

  /**
   * 进度文字格式化函数
   */
  format?: (percent: number) => string

  /**
   * 是否显示速度
   * @default false
   */
  showSpeed?: boolean

  /**
   * 当前速度（字节/秒）
   */
  speed?: number

  /**
   * 是否显示剩余时间
   * @default false
   */
  showRemaining?: boolean

  /**
   * 预估剩余时间（毫秒）
   */
  remaining?: number

  /**
   * 已传输大小（字节）
   */
  loaded?: number

  /**
   * 总大小（字节）
   */
  total?: number

  /**
   * 文件名称
   */
  fileName?: string

  /**
   * 是否可取消
   * @default false
   */
  cancellable?: boolean

  /**
   * 是否可暂停
   * @default false
   */
  pausable?: boolean

  /**
   * 是否暂停中
   */
  paused?: boolean

  /**
   * 进度条尺寸
   */
  size?: 'small' | 'medium' | 'large' | number

  /**
   * 是否启用动画
   * @default true
   */
  animated?: boolean

  /**
   * 是否启用条纹
   * @default false
   */
  striped?: boolean
}

/**
 * 进度颜色函数
 */
export type ProgressColorFunc = (percent: number) => string

/**
 * 进度事件
 */
export interface HttpProgressEmits {
  /**
   * 取消事件
   */
  cancel: []

  /**
   * 暂停事件
   */
  pause: []

  /**
   * 恢复事件
   */
  resume: []
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  // 处理负数和0
  if (bytes < 0) return '0 B'
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  // 字节单位不显示小数，其他单位保留2位小数
  const size = bytes / Math.pow(k, i)
  return i === 0
    ? `${size} ${sizes[i]}`
    : `${size.toFixed(2)} ${sizes[i]}`
}

/**
 * 格式化速度
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`
}

/**
 * 格式化剩余时间（进度专用）
 */
export function formatProgressTime(ms: number): string {
  // 处理边界情况
  if (ms < 0 || !isFinite(ms)) return '0秒'
  if (ms === 0) return '0秒'
  
  const totalSeconds = Math.ceil(ms / 1000)
  
  // 计算时间单位
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  // 构建结果，隐藏为0的单位
  const parts: string[] = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  if (seconds > 0 && days === 0) parts.push(`${seconds}秒`) // 天数大于0时不显示秒
  
  return parts.length > 0 ? parts.join('') : '0秒'
}

// 保持向后兼容的别名
export const formatRemainingTime = formatProgressTime

/**
 * 获取进度颜色
 */
export function getProgressColor(
  percent: number,
  color?: string | string[] | ProgressColorFunc,
  status?: string
): string {
  // 根据状态返回颜色
  if (status === 'success') return '#67c23a'
  if (status === 'error') return '#f56c6c'
  if (status === 'warning') return '#e6a23c'

  // 自定义颜色函数
  if (typeof color === 'function') {
    return color(percent)
  }

  // 渐变色数组
  if (Array.isArray(color)) {
    if (color.length === 0) return '#409eff'
    if (color.length === 1) return color[0]
    
    const step = 100 / (color.length - 1)
    const index = Math.min(Math.floor(percent / step), color.length - 2)
    return color[index]
  }

  // 单一颜色
  if (color) return color

  // 默认颜色
  return '#409eff'
}

/**
 * 计算圆形进度条路径
 */
export function getCirclePath(
  radius: number,
  strokeWidth: number,
  percent: number
): {
  path: string
  perimeter: number
  offset: number
} {
  const r = radius - strokeWidth / 2
  const perimeter = 2 * Math.PI * r
  const offset = perimeter * (1 - percent / 100)

  return {
    path: `M ${radius},${radius} m 0,-${r} a ${r},${r} 0 1 1 0,${2 * r} a ${r},${r} 0 1 1 0,-${2 * r}`,
    perimeter,
    offset,
  }
}