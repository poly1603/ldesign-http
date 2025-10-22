/**
 * 类型安全的辅助类型
 * 
 * 用于替代 any 类型，提供更安全的类型定义
 */

/**
 * 未知对象类型（比 any 更安全）
 */
export type UnknownObject = Record<string, unknown>

/**
 * 未知数组类型
 */
export type UnknownArray = unknown[]

/**
 * 未知记录类型
 */
export type UnknownRecord<K extends string | number | symbol = string> = Record<K, unknown>

/**
 * JSON 值类型
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray

export interface JsonObject {
  [key: string]: JsonValue
}

export interface JsonArray extends Array<JsonValue> { }

/**
 * 可序列化类型
 */
export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable }

/**
 * HTTP 响应数据类型（安全版本）
 */
export type SafeResponseData =
  | JsonValue
  | Blob
  | ArrayBuffer
  | string
  | null

/**
 * HTTP 请求数据类型（安全版本）
 */
export type SafeRequestData =
  | JsonValue
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | string
  | null

/**
 * 函数类型（安全版本）
 */
export type SafeFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  ...args: TArgs
) => TReturn

/**
 * 异步函数类型
 */
export type AsyncFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  ...args: TArgs
) => Promise<TReturn>

/**
 * 回调函数类型
 */
export type Callback<T = void> = (value: T) => void

/**
 * 错误回调类型
 */
export type ErrorCallback = (error: Error) => void

/**
 * 可选的回调函数
 */
export type MaybeCallback<T = void> = Callback<T> | undefined

/**
 * 类型守卫函数
 */
export type TypeGuard<T> = (value: unknown) => value is T

/**
 * 验证器函数
 */
export type Validator<T> = (value: T) => boolean

/**
 * 转换器函数
 */
export type Transformer<TInput, TOutput> = (value: TInput) => TOutput

/**
 * 过滤器函数
 */
export type FilterPredicate<T> = (value: T, index: number, array: T[]) => boolean

/**
 * 映射函数
 */
export type MapFunction<TInput, TOutput> = (value: TInput, index: number, array: TInput[]) => TOutput

/**
 * 归约函数
 */
export type ReduceFunction<T, TAcc> = (accumulator: TAcc, value: T, index: number, array: T[]) => TAcc

/**
 * 可为空的类型
 */
export type Nullable<T> = T | null

/**
 * 可为 undefined 的类型
 */
export type Maybe<T> = T | undefined

/**
 * 可为 null 或 undefined 的类型
 */
export type Optional<T> = T | null | undefined

/**
 * 非空类型
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * 提取数组元素类型
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never

/**
 * 提取 Promise 的结果类型
 */
export type PromiseValue<T> = T extends Promise<infer U> ? U : T

/**
 * 递归只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
  ? DeepReadonly<T[P]>
  : T[P]
}

/**
 * 递归可选类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
  ? DeepPartial<T[P]>
  : T[P]
}

/**
 * 递归必需类型
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object
  ? DeepRequired<T[P]>
  : T[P]
}

/**
 * 提取对象的值类型
 */
export type ValueOf<T> = T[keyof T]

/**
 * 排除 undefined
 */
export type ExcludeUndefined<T> = T extends undefined ? never : T

/**
 * 排除 null
 */
export type ExcludeNull<T> = T extends null ? never : T

/**
 * 排除 null 和 undefined
 */
export type ExcludeNullish<T> = ExcludeNull<ExcludeUndefined<T>>

/**
 * 可调用的类型
 */
export type Callable = (...args: unknown[]) => unknown

/**
 * 构造函数类型
 */
export type Constructor<T = unknown> = new (...args: unknown[]) => T

/**
 * 抽象构造函数类型
 */
export type AbstractConstructor<T = unknown> = abstract new (...args: unknown[]) => T

/**
 * 类类型
 */
export type Class<T = unknown> = Constructor<T> | AbstractConstructor<T>

