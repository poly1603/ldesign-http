/**
 * 品牌类型（Brand Types）
 * 
 * 用于创建名义类型（Nominal Types），防止不同类型的值被错误使用
 * 
 * @example
 * ```typescript
 * type UserId = Brand<number, 'UserId'>
 * type ProductId = Brand<number, 'ProductId'>
 * 
 * const userId: UserId = 123 as UserId
 * const productId: ProductId = 456 as ProductId
 * 
 * // 类型错误：不能将 ProductId 赋值给 UserId
 * const test: UserId = productId // Error!
 * ```
 */

/**
 * 品牌类型基础接口
 */
declare const __brand: unique symbol

/**
 * 品牌类型工具
 */
export type Brand<T, TBrand extends string> = T & {
  readonly [__brand]: TBrand
}

/**
 * 创建品牌类型的辅助函数
 */
export function brand<T, TBrand extends string>(value: T): Brand<T, TBrand> {
  return value as Brand<T, TBrand>
}

/**
 * 从品牌类型中提取原始值
 */
export function unbrand<T, TBrand extends string>(value: Brand<T, TBrand>): T {
  return value as T
}

// ============ HTTP 相关的品牌类型 ============

/**
 * URL 字符串（品牌类型）
 */
export type Url = Brand<string, 'Url'>

/**
 * 创建 URL 类型
 */
export function createUrl(url: string): Url {
  // 验证 URL 格式
  try {
    new URL(url)
    return brand<string, 'Url'>(url)
  }
  catch {
    // 可能是相对 URL
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return brand<string, 'Url'>(url)
    }
    throw new Error(`Invalid URL: ${url}`)
  }
}

/**
 * 请求 ID（品牌类型）
 */
export type RequestId = Brand<string, 'RequestId'>

/**
 * 创建请求 ID
 */
export function createRequestId(id: string): RequestId {
  return brand<string, 'RequestId'>(id)
}

/**
 * 缓存键（品牌类型）
 */
export type CacheKey = Brand<string, 'CacheKey'>

/**
 * 创建缓存键
 */
export function createCacheKey(key: string): CacheKey {
  return brand<string, 'CacheKey'>(key)
}

/**
 * HTTP 状态码（品牌类型）
 */
export type StatusCode = Brand<number, 'StatusCode'>

/**
 * 创建状态码
 */
export function createStatusCode(code: number): StatusCode {
  if (code < 100 || code >= 600) {
    throw new Error(`Invalid HTTP status code: ${code}`)
  }
  return brand<number, 'StatusCode'>(code)
}

/**
 * 超时时间（品牌类型，毫秒）
 */
export type Timeout = Brand<number, 'Timeout'>

/**
 * 创建超时时间
 */
export function createTimeout(ms: number): Timeout {
  if (ms < 0) {
    throw new Error(`Timeout must be positive: ${ms}`)
  }
  return brand<number, 'Timeout'>(ms)
}

/**
 * TTL（品牌类型，毫秒）
 */
export type TTL = Brand<number, 'TTL'>

/**
 * 创建 TTL
 */
export function createTTL(ms: number): TTL {
  if (ms < 0) {
    throw new Error(`TTL must be positive: ${ms}`)
  }
  return brand<number, 'TTL'>(ms)
}

/**
 * 令牌（品牌类型）
 */
export type Token = Brand<string, 'Token'>

/**
 * 创建令牌
 */
export function createToken(token: string): Token {
  if (!token || token.trim().length === 0) {
    throw new Error('Token cannot be empty')
  }
  return brand<string, 'Token'>(token)
}

/**
 * API 密钥（品牌类型）
 */
export type ApiKey = Brand<string, 'ApiKey'>

/**
 * 创建 API 密钥
 */
export function createApiKey(key: string): ApiKey {
  if (!key || key.trim().length === 0) {
    throw new Error('API key cannot be empty')
  }
  return brand<string, 'ApiKey'>(key)
}

// ============ 类型安全的常量 ============

/**
 * HTTP 方法枚举（类型安全）
 */
export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const

export type HttpMethodType = typeof HttpMethod[keyof typeof HttpMethod]

/**
 * 内容类型常量（类型安全）
 */
export const ContentType = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  BINARY: 'application/octet-stream',
} as const

export type ContentTypeValue = typeof ContentType[keyof typeof ContentType]

/**
 * 响应类型常量（类型安全）
 */
export const ResponseType = {
  JSON: 'json',
  TEXT: 'text',
  BLOB: 'blob',
  ARRAY_BUFFER: 'arrayBuffer',
  STREAM: 'stream',
} as const

export type ResponseTypeValue = typeof ResponseType[keyof typeof ResponseType]

