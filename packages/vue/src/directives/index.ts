/**
 * Vue 指令集合
 */

export { vHttp, type HttpDirectiveOptions, type HttpDirectiveElement } from './http'
export { vLoading, type LoadingDirectiveOptions, type LoadingDirectiveElement } from './loading'
export { vRetry, type RetryDirectiveOptions, type RetryDirectiveElement } from './retry'
export { vDebounce, type DebounceDirectiveOptions, type DebounceDirectiveElement } from './debounce'
export { vThrottle, type ThrottleDirectiveOptions, type ThrottleDirectiveElement } from './throttle'

// 默认导出所有指令
export { default as http } from './http'
export { default as loading } from './loading'
export { default as retry } from './retry'
export { default as debounce } from './debounce'
export { default as throttle } from './throttle'
