import { afterEach, vi } from 'vitest'
import { config } from '@vue/test-utils'

// 配置 Vue Test Utils 全局选项
config.global.config.errorHandler = (err) => {
  // 在测试中捕获但不抛出错误，避免干扰测试流程
  if (process.env.DEBUG) {
    console.error('Vue Error in Test:', err)
  }
}

config.global.config.warnHandler = (msg) => {
  // 静默某些预期的警告
  if (process.env.DEBUG) {
    console.warn('Vue Warning in Test:', msg)
  }
}

// 配置全局 stubs，处理常见的Vue内置组件
config.global.stubs = {
  transition: false,
  'transition-group': false,
}

// Mock fetch API
globalThis.fetch = vi.fn()

// Mock AbortController
globalThis.AbortController = vi.fn().mockImplementation(() => ({
  signal: {
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  abort: vi.fn(),
})) as any

// Mock console methods in tests
globalThis.console = {
  ...console,
  // 在测试中静默 console.log
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// 设置测试超时
vi.setConfig({
  testTimeout: 10000,
})

// 全局测试工具函数
export function createMockResponse<T = any>(
  data: T,
  status = 200,
  statusText = 'OK',
  headers: Record<string, string> = {},
) {
  return {
    data,
    status,
    statusText,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    config: {},
    raw: null,
  }
}

export function createMockError(
  message: string,
  code?: string,
  status?: number,
) {
  const error = new Error(message) as any
  error.code = code
  error.status = status
  error.isNetworkError = false
  error.isTimeoutError = false
  error.isCancelError = false
  return error
}

// 延迟函数，用于测试异步操作
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 清理函数，在每个测试后执行
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})
