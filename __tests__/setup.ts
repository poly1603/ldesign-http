/**
 * 测试环境设置
 */

import { vi } from 'vitest'

// Mock fetch API
global.fetch = vi.fn()
global.Headers = vi.fn(() => ({
  set: vi.fn(),
  get: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  forEach: vi.fn(),
})) as any

global.AbortController = vi.fn(() => ({
  signal: {},
  abort: vi.fn(),
})) as any

global.URLSearchParams = vi.fn(() => ({
  append: vi.fn(),
  toString: vi.fn(() => ''),
})) as any

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
}
global.localStorage = localStorageMock as any

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
}
global.sessionStorage = sessionStorageMock as any

// Mock console methods
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
}

// 测试工具函数
export function createMockResponse<T>(
  data: T,
  status: number = 200,
  statusText: string = 'OK',
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers(headers) as any,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data)),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    clone: vi.fn().mockReturnThis(),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic',
    url: '',
  } as any
}

export function createMockError(message: string, code?: string): Error {
  const error = new Error(message)
  if (code) {
    (error as any).code = code
  }
  return error
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 重置所有mock
export function resetAllMocks(): void {
  vi.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()

  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
}
