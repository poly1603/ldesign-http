/**
 * 响应数据验证（Response Validation）
 *
 * 提供运行时的响应数据验证功能，确保API返回的数据符合预期格式。
 * 这是TypeScript静态类型检查的重要补充。
 *
 * 核心价值：
 * - 🛡️ **运行时保护**：捕获API返回的意外数据
 * - 📝 **契约验证**：确保API遵守约定的数据格式
 * - 🐛 **提早发现问题**：在数据使用前就发现错误
 * - 📊 **数据质量监控**：统计验证失败情况
 *
 * 应用场景：
 * - 第三方API集成（数据格式不可控）
 * - 多团队协作（后端可能变更）
 * - 关键业务数据（需要额外保障）
 * - 开发调试阶段（快速发现问题）
 *
 * @example 基础用法
 * ```typescript
 * // 定义验证规则
 * const userValidator = {
 *   id: (v: any) => typeof v === 'number',
 *   name: (v: any) => typeof v === 'string' && v.length > 0,
 *   email: (v: any) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
 * }
 *
 * // 验证响应数据
 * const validator = new ResponseValidator()
 * const result = validator.validate(responseData, userValidator)
 *
 * if (!result.valid) {
 *   console.error('验证失败:', result.errors)
 * }
 * ```
 */

import type { HttpClient, RequestConfig, ResponseData } from '../types'

/**
 * 验证规则类型
 */
export type ValidationRule<T = any> = (value: T) => boolean | string

/**
 * 验证模式（字段 → 验证规则）
 */
export type ValidationSchema<T = any> = {
  [K in keyof T]?: ValidationRule<T[K]> | ValidationRule<T[K]>[]
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean
  /** 错误信息列表 */
  errors: ValidationError[]
  /** 验证的字段数 */
  fieldsChecked: number
  /** 失败的字段数 */
  fieldsFailed: number
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 字段路径 */
  field: string
  /** 错误消息 */
  message: string
  /** 实际值 */
  value: any
}

/**
 * 响应验证器
 *
 * 提供灵活的响应数据验证功能。
 *
 * @example 创建验证器
 * ```typescript
 * const validator = new ResponseValidator({
 *   strict: true, // 严格模式：验证失败抛出错误
 *   onValidationError: (errors) => {
 *     console.error('数据验证失败:', errors)
 *   }
 * })
 * ```
 */
export class ResponseValidator {
  private config: {
    strict: boolean
    onValidationError?: (errors: ValidationError[]) => void
  }

  /**
   * 构造函数
   *
   * @param config - 验证器配置
   */
  constructor(config: {
    strict?: boolean
    onValidationError?: (errors: ValidationError[]) => void
  } = {}) {
    this.config = {
      strict: config.strict ?? false,
      onValidationError: config.onValidationError,
    }
  }

  /**
   * 验证数据
   *
   * @template T - 数据类型
   * @param data - 要验证的数据
   * @param schema - 验证模式
   * @returns ValidationResult - 验证结果
   *
   * @example
   * ```typescript
   * const schema = {
   *   id: (v: any) => typeof v === 'number',
   *   name: (v: any) => typeof v === 'string'
   * }
   *
   * const result = validator.validate(data, schema)
   * if (!result.valid) {
   *   console.error(result.errors)
   * }
   * ```
   */
  validate<T = any>(
    data: any,
    schema: ValidationSchema<T>,
  ): ValidationResult {
    const errors: ValidationError[] = []
    let fieldsChecked = 0
    let fieldsFailed = 0

    // 遍历验证模式
    for (const field in schema) {
      const rules = schema[field]
      if (!rules)
        continue

      const value = data[field]
      const ruleArray = Array.isArray(rules) ? rules : [rules]

      fieldsChecked++

      // 执行所有规则
      for (const rule of ruleArray) {
        const result = rule(value)

        if (result === false) {
          fieldsFailed++
          errors.push({
            field,
            message: `Validation failed for field '${field}'`,
            value,
          })
        }
        else if (typeof result === 'string') {
          fieldsFailed++
          errors.push({
            field,
            message: result,
            value,
          })
        }
      }
    }

    const validationResult: ValidationResult = {
      valid: errors.length === 0,
      errors,
      fieldsChecked,
      fieldsFailed,
    }

    // 触发回调
    if (!validationResult.valid && this.config.onValidationError) {
      this.config.onValidationError(errors)
    }

    // 严格模式：验证失败抛出错误
    if (this.config.strict && !validationResult.valid) {
      throw new Error(
        `Response validation failed: ${errors.map(e => e.message).join(', ')}`,
      )
    }

    return validationResult
  }
}

/**
 * 常用验证规则
 */
export const Validators = {
  /** 必填字段 */
  required: () => (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '该字段为必填项'
    }
    return true
  },

  /** 字符串类型 */
  string: () => (value: any) => {
    if (typeof value !== 'string') {
      return '该字段必须是字符串'
    }
    return true
  },

  /** 数字类型 */
  number: () => (value: any) => {
    if (typeof value !== 'number') {
      return '该字段必须是数字'
    }
    return true
  },

  /** 邮箱格式 */
  email: () => (value: any) => {
    if (typeof value !== 'string') {
      return '邮箱必须是字符串'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return '邮箱格式不正确'
    }
    return true
  },

  /** 最小长度 */
  minLength: (min: number) => (value: any) => {
    if (typeof value === 'string' && value.length < min) {
      return `长度不能少于 ${min} 个字符`
    }
    if (Array.isArray(value) && value.length < min) {
      return `数组长度不能少于 ${min}`
    }
    return true
  },

  /** 最大长度 */
  maxLength: (max: number) => (value: any) => {
    if (typeof value === 'string' && value.length > max) {
      return `长度不能超过 ${max} 个字符`
    }
    if (Array.isArray(value) && value.length > max) {
      return `数组长度不能超过 ${max}`
    }
    return true
  },

  /** 数值范围 */
  range: (min: number, max: number) => (value: any) => {
    if (typeof value !== 'number') {
      return '该字段必须是数字'
    }
    if (value < min || value > max) {
      return `数值必须在 ${min} 到 ${max} 之间`
    }
    return true
  },

  /** 正则匹配 */
  pattern: (regex: RegExp, message: string = '格式不正确') => (value: any) => {
    if (typeof value !== 'string') {
      return '该字段必须是字符串'
    }
    if (!regex.test(value)) {
      return message
    }
    return true
  },

  /** 枚举值 */
  enum: <T>(allowedValues: T[]) => (value: any) => {
    if (!allowedValues.includes(value)) {
      return `值必须是以下之一: ${allowedValues.join(', ')}`
    }
    return true
  },

  /** 数组类型 */
  array: () => (value: any) => {
    if (!Array.isArray(value)) {
      return '该字段必须是数组'
    }
    return true
  },

  /** 对象类型 */
  object: () => (value: any) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return '该字段必须是对象'
    }
    return true
  },
}

/**
 * 为HTTP客户端添加响应验证
 *
 * @param client - HTTP客户端实例
 * @param schema - 验证模式
 * @param config - 验证器配置
 * @returns 带验证的客户端包装器
 *
 * @example
 * ```typescript
 * const userSchema = {
 *   id: Validators.number(),
 *   name: [Validators.required(), Validators.string()],
 *   email: [Validators.required(), Validators.email()]
 * }
 *
 * const validatedClient = withResponseValidation(client, userSchema, {
 *   strict: true
 * })
 *
 * // 自动验证响应
 * const response = await validatedClient.get<User>('/api/user/1')
 * // 如果数据不符合schema，会抛出错误
 * ```
 */
export function withResponseValidation<T>(
  client: HttpClient,
  schema: ValidationSchema<T>,
  config?: {
    strict?: boolean
    onValidationError?: (errors: ValidationError[]) => void
  },
) {
  const validator = new ResponseValidator(config)

  return {
    ...client,

    async get<TData = T>(url: string, requestConfig?: RequestConfig): Promise<ResponseData<TData>> {
      const response = await client.get<TData>(url, requestConfig)
      validator.validate(response.data, schema as ValidationSchema)
      return response
    },

    async post<TData = T, D = unknown>(url: string, data?: D, requestConfig?: RequestConfig): Promise<ResponseData<TData>> {
      const response = await client.post<TData, D>(url, data, requestConfig)
      validator.validate(response.data, schema as ValidationSchema)
      return response
    },

    async put<TData = T, D = unknown>(url: string, data?: D, requestConfig?: RequestConfig): Promise<ResponseData<TData>> {
      const response = await client.put<TData, D>(url, data, requestConfig)
      validator.validate(response.data, schema as ValidationSchema)
      return response
    },

    async delete<TData = T>(url: string, requestConfig?: RequestConfig): Promise<ResponseData<TData>> {
      const response = await client.delete<TData>(url, requestConfig)
      validator.validate(response.data, schema as ValidationSchema)
      return response
    },

    async patch<TData = T, D = unknown>(url: string, data?: D, requestConfig?: RequestConfig): Promise<ResponseData<TData>> {
      const response = await client.patch<TData, D>(url, data, requestConfig)
      validator.validate(response.data, schema as ValidationSchema)
      return response
    },
  }
}

/**
 * 创建响应验证器
 *
 * @param config - 验证器配置
 * @returns ResponseValidator - 验证器实例
 *
 * @example
 * ```typescript
 * const validator = createResponseValidator({
 *   strict: true,
 *   onValidationError: (errors) => {
 *     console.error('验证失败:', errors)
 *   }
 * })
 * ```
 */
export function createResponseValidator(config?: {
  strict?: boolean
  onValidationError?: (errors: ValidationError[]) => void
}): ResponseValidator {
  return new ResponseValidator(config)
}


