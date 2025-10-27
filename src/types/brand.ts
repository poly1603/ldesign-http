/**
 * 品牌类型（Brand Types）- TypeScript 类型安全增强
 * 
 * 品牌类型是一种高级TypeScript模式，用于创建名义类型（Nominal Types）。
 * 它可以防止结构相同但语义不同的类型被错误互换使用。
 *
 * 核心价值：
 * - 🛡️ **类型安全**：编译时防止类型误用
 * - 📝 **语义明确**：类型名称体现业务含义
 * - 🔍 **易于调试**：类型错误更容易定位
 * - 🎯 **重构安全**：类型系统帮助保证正确性
 *
 * 应用场景：
 * - 不同类型的ID（UserId vs ProductId）
 * - 不同单位的数值（Milliseconds vs Seconds）
 * - 不同格式的字符串（Email vs Url）
 * - 敏感信息（Token vs ApiKey）
 *
 * 工作原理：
 * - 使用交叉类型（&）添加唯一的品牌标记
 * - 品牌标记是一个 symbol，运行时不存在
 * - TypeScript 编译器识别品牌，强制类型检查
 *
 * @example 基础用法
 * ```typescript
 * // 定义品牌类型
 * type UserId = Brand<number, 'UserId'>
 * type ProductId = Brand<number, 'ProductId'>
 * 
 * // 创建值（需要显式转换）
 * const userId: UserId = 123 as UserId
 * const productId: ProductId = 456 as ProductId
 * 
 * // ✅ 正确：相同类型
 * const user1: UserId = userId
 * 
 * // ❌ 错误：不能将 ProductId 赋值给 UserId
 * const user2: UserId = productId // 编译错误！
 * ```
 *
 * @example 函数参数类型安全
 * ```typescript
 * function getUserById(id: UserId): User {
 *   return users.find(u => u.id === id)
 * }
 * 
 * const userId = 123 as UserId
 * const productId = 456 as ProductId
 * 
 * getUserById(userId)     // ✅ 正确
 * getUserById(productId)  // ❌ 编译错误！
 * getUserById(789)        // ❌ 编译错误！需要 UserId 类型
 * ```
 *
 * @see {@link https://egghead.io/blog/using-branded-types-in-typescript} Branded Types 详解
 */

/**
 * 品牌标记 Symbol
 * 
 * 使用 unique symbol 确保每个品牌类型都是唯一的。
 * 这个 symbol 只在类型层面存在，编译后的JavaScript中不包含。
 */
declare const __brand: unique symbol

/**
 * 品牌类型工具类型
 *
 * 通过交叉类型为基础类型添加品牌标记，创建名义类型。
 *
 * @template T - 基础类型（如 string、number）
 * @template TBrand - 品牌名称（用于区分不同的品牌类型）
 *
 * @example
 * ```typescript
 * // 创建自定义品牌类型
 * type Email = Brand<string, 'Email'>
 * type PhoneNumber = Brand<string, 'PhoneNumber'>
 * 
 * // 虽然都是string，但类型系统会将它们视为不同类型
 * const email: Email = 'user@example.com' as Email
 * const phone: PhoneNumber = '13800138000' as PhoneNumber
 * 
 * // ❌ 不能互相赋值
 * const test: Email = phone // 编译错误！
 * ```
 */
export type Brand<T, TBrand extends string> = T & {
  readonly [__brand]: TBrand
}

/**
 * 创建品牌类型值的辅助函数
 *
 * 将普通值转换为品牌类型值。
 * 这是一个类型断言的封装，使代码更简洁。
 *
 * @template T - 基础类型
 * @template TBrand - 品牌名称
 * @param value - 要转换的原始值
 * @returns Brand<T, TBrand> - 品牌类型值
 *
 * @example
 * ```typescript
 * type UserId = Brand<number, 'UserId'>
 * 
 * // 使用 brand 函数
 * const userId = brand<number, 'UserId'>(123)
 * 
 * // 等同于
 * const userId = 123 as UserId
 * ```
 */
export function brand<T, TBrand extends string>(value: T): Brand<T, TBrand> {
  return value as Brand<T, TBrand>
}

/**
 * 从品牌类型中提取原始值
 *
 * 将品牌类型值转换回普通值。
 * 在需要与非类型安全的第三方库交互时使用。
 *
 * @template T - 基础类型
 * @template TBrand - 品牌名称
 * @param value - 品牌类型值
 * @returns T - 原始值
 *
 * @example
 * ```typescript
 * type UserId = Brand<number, 'UserId'>
 * const userId: UserId = 123 as UserId
 * 
 * // 提取原始值
 * const rawId: number = unbrand(userId) // 123
 * 
 * // 用于第三方库
 * thirdPartyLib.process(unbrand(userId))
 * ```
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

