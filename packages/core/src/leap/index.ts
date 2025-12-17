/**
 * LEAP RPC 模块
 *
 * 兼容老系统 LEAP.request / leapclient.request 的 RPC 客户端
 *
 * @module @ldesign/http/leap
 *
 * @example
 * ```typescript
 * import { createLeapClient, createLeap } from '@ldesign/http'
 *
 * // 创建客户端
 * const leapClient = await createLeapClient({
 *   serverUrl: 'https://api.example.com',
 *   getSid: () => sessionStorage.getItem('sid') || ''
 * })
 *
 * // 方式1：直接使用
 * const result = await leapClient.request('app_getUserInfo', { userId: '123' })
 *
 * // 方式2：创建兼容对象
 * const LEAP = createLeap(leapClient)
 * const result2 = await LEAP.request('app_getUserInfo', { userId: '123' })
 * ```
 */

// 导出类型
export type {
  LeapCallback,
  LeapClient,
  LeapClientConfig,
  LeapError,
  LeapRequestConfig,
  LeapRequestGroup,
  LeapResponse,
} from './types'

// 导出类型守卫和工厂函数
export { createLeapError, isLeapError } from './types'

// 导出客户端实现
export { createLeapRequestGroup, LeapClientImpl } from './client'

// 导出工厂函数
export {
  createGlobalLeapClient,
  createLeap,
  createLeapClient,
  createLeapClientSync,
} from './factory'
