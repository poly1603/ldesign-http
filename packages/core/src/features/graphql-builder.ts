/**
 * GraphQL 查询构建器
 * 
 * 提供流式 API 来构建 GraphQL 查询、变更和订阅
 */

/**
 * GraphQL 操作类型
 */
export type GraphQLOperationType = 'query' | 'mutation' | 'subscription'

/**
 * 字段选择配置
 */
export interface FieldSelection {
  /** 字段名 */
  name: string
  /** 字段别名 */
  alias?: string
  /** 字段参数 */
  arguments?: Record<string, any>
  /** 子字段选择 */
  fields?: FieldSelection[]
  /** 指令 */
  directives?: Directive[]
}

/**
 * GraphQL 指令
 */
export interface Directive {
  /** 指令名 */
  name: string
  /** 指令参数 */
  arguments?: Record<string, any>
}

/**
 * Fragment 定义
 */
export interface FragmentDefinition {
  /** Fragment 名称 */
  name: string
  /** 类型条件 */
  typeCondition: string
  /** 字段选择 */
  fields: FieldSelection[]
}

/**
 * 变量定义
 */
export interface VariableDefinition {
  /** 变量名 */
  name: string
  /** 变量类型 */
  type: string
  /** 默认值 */
  defaultValue?: any
}

/**
 * GraphQL 查询构建器
 */
export class GraphQLQueryBuilder {
  private operationType: GraphQLOperationType
  private operationName?: string
  private variableDefinitions: VariableDefinition[] = []
  private fields: FieldSelection[] = []
  private fragments: Map<string, FragmentDefinition> = new Map()
  private directives: Directive[] = []

  constructor(operationType: GraphQLOperationType = 'query') {
    this.operationType = operationType
  }

  /**
   * 设置操作名称
   */
  name(name: string): this {
    this.operationName = name
    return this
  }

  /**
   * 添加变量定义
   */
  variable(name: string, type: string, defaultValue?: any): this {
    this.variableDefinitions.push({ name, type, defaultValue })
    return this
  }

  /**
   * 批量添加变量
   */
  variables(vars: Record<string, string>): this {
    Object.entries(vars).forEach(([name, type]) => {
      this.variable(name, type)
    })
    return this
  }

  /**
   * 选择字段
   */
  field(name: string, config?: Partial<FieldSelection>): this {
    this.fields.push({
      name,
      ...config,
    })
    return this
  }

  /**
   * 选择带参数的字段
   */
  fieldWithArgs(name: string, args: Record<string, any>, fields?: FieldSelection[]): this {
    return this.field(name, { arguments: args, fields })
  }

  /**
   * 选择带别名的字段
   */
  fieldWithAlias(alias: string, name: string, config?: Partial<FieldSelection>): this {
    return this.field(name, { alias, ...config })
  }

  /**
   * 选择嵌套字段
   */
  fieldWithNested(name: string, builder: (b: FieldBuilder) => void): this {
    const fieldBuilder = new FieldBuilder(name)
    builder(fieldBuilder)
    this.fields.push(fieldBuilder.build())
    return this
  }

  /**
   * 添加指令
   */
  directive(name: string, args?: Record<string, any>): this {
    this.directives.push({ name, arguments: args })
    return this
  }

  /**
   * 添加 Fragment
   */
  fragment(name: string, typeCondition: string, builder: (b: FieldBuilder) => void): this {
    const fieldBuilder = new FieldBuilder('')
    builder(fieldBuilder)
    this.fragments.set(name, {
      name,
      typeCondition,
      fields: fieldBuilder.build().fields || [],
    })
    return this
  }

  /**
   * 使用 Fragment
   */
  useFragment(name: string): this {
    this.fields.push({
      name: `...${name}`,
    })
    return this
  }

  /**
   * 内联 Fragment
   */
  inlineFragment(typeCondition: string, builder: (b: FieldBuilder) => void): this {
    const fieldBuilder = new FieldBuilder('')
    builder(fieldBuilder)
    this.fields.push({
      name: `... on ${typeCondition}`,
      fields: fieldBuilder.build().fields,
    })
    return this
  }

  /**
   * 构建查询字符串
   */
  build(): string {
    const parts: string[] = []

    // 操作定义
    let operation = this.operationType
    if (this.operationName) {
      operation += ` ${this.operationName}`
    }

    // 变量定义
    if (this.variableDefinitions.length > 0) {
      const varDefs = this.variableDefinitions.map(v => {
        let def = `$${v.name}: ${v.type}`
        if (v.defaultValue !== undefined) {
          def += ` = ${this.stringifyValue(v.defaultValue)}`
        }
        return def
      }).join(', ')
      operation += `(${varDefs})`
    }

    // 指令
    if (this.directives.length > 0) {
      operation += this.buildDirectives(this.directives)
    }

    parts.push(operation)

    // 字段选择
    if (this.fields.length > 0) {
      parts.push(this.buildFields(this.fields, 1))
    }

    // Fragment 定义
    if (this.fragments.size > 0) {
      parts.push('')
      this.fragments.forEach(fragment => {
        parts.push(`fragment ${fragment.name} on ${fragment.typeCondition} {`)
        parts.push(this.buildFieldList(fragment.fields, 1))
        parts.push('}')
      })
    }

    return parts.join('\n')
  }

  /**
   * 构建字段列表
   */
  private buildFields(fields: FieldSelection[], indent: number): string {
    return '{\n' + this.buildFieldList(fields, indent) + '\n' + '  '.repeat(indent - 1) + '}'
  }

  /**
   * 构建字段列表内容
   */
  private buildFieldList(fields: FieldSelection[], indent: number): string {
    return fields.map(field => {
      const indentStr = '  '.repeat(indent)
      const parts: string[] = []

      // Fragment spread
      if (field.name.startsWith('...')) {
        parts.push(indentStr + field.name)
        if (field.fields) {
          parts.push(this.buildFields(field.fields, indent + 1))
        }
        return parts.join('\n')
      }

      // 别名
      let fieldStr = indentStr
      if (field.alias) {
        fieldStr += `${field.alias}: `
      }
      fieldStr += field.name

      // 参数
      if (field.arguments && Object.keys(field.arguments).length > 0) {
        const args = Object.entries(field.arguments)
          .map(([key, value]) => `${key}: ${this.stringifyValue(value)}`)
          .join(', ')
        fieldStr += `(${args})`
      }

      // 指令
      if (field.directives && field.directives.length > 0) {
        fieldStr += this.buildDirectives(field.directives)
      }

      parts.push(fieldStr)

      // 子字段
      if (field.fields && field.fields.length > 0) {
        parts.push(this.buildFields(field.fields, indent + 1))
      }

      return parts.join(' ')
    }).join('\n')
  }

  /**
   * 构建指令字符串
   */
  private buildDirectives(directives: Directive[]): string {
    return directives.map(d => {
      let str = ` @${d.name}`
      if (d.arguments && Object.keys(d.arguments).length > 0) {
        const args = Object.entries(d.arguments)
          .map(([key, value]) => `${key}: ${this.stringifyValue(value)}`)
          .join(', ')
        str += `(${args})`
      }
      return str
    }).join('')
  }

  /**
   * 值转字符串
   */
  private stringifyValue(value: any): string {
    if (value === null) {
      return 'null'
    }
    if (value === undefined) {
      return 'null'
    }
    if (typeof value === 'string') {
      // 检查是否是变量引用
      if (value.startsWith('$')) {
        return value
      }
      // 检查是否是枚举值（全大写或包含下划线的大写）
      // 注意：不再匹配普通的PascalCase，避免将 "John" 误识别为枚举
      if (/^[A-Z][A-Z_0-9]*$/.test(value)) {
        return value
      }
      return JSON.stringify(value)
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
    if (Array.isArray(value)) {
      return '[' + value.map(v => this.stringifyValue(v)).join(', ') + ']'
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value)
        .map(([k, v]) => `${k}: ${this.stringifyValue(v)}`)
        .join(', ')
      return `{${entries}}`
    }
    return String(value)
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return this.build()
  }
}

/**
 * 字段构建器
 */
export class FieldBuilder {
  private field: FieldSelection

  constructor(name: string) {
    this.field = { name, fields: [] }
  }

  /**
   * 设置别名
   */
  alias(alias: string): this {
    this.field.alias = alias
    return this
  }

  /**
   * 设置参数
   */
  args(args: Record<string, any>): this {
    this.field.arguments = args
    return this
  }

  /**
   * 添加指令
   */
  directive(name: string, args?: Record<string, any>): this {
    if (!this.field.directives) {
      this.field.directives = []
    }
    this.field.directives.push({ name, arguments: args })
    return this
  }

  /**
   * 选择子字段
   */
  select(name: string, config?: Partial<FieldSelection>): this {
    if (!this.field.fields) {
      this.field.fields = []
    }
    this.field.fields.push({ name, ...config })
    return this
  }

  /**
   * 选择多个字段
   */
  selectMany(...names: string[]): this {
    names.forEach(name => this.select(name))
    return this
  }

  /**
   * 选择嵌套字段
   */
  selectNested(name: string, builder: (b: FieldBuilder) => void): this {
    const fieldBuilder = new FieldBuilder(name)
    builder(fieldBuilder)
    if (!this.field.fields) {
      this.field.fields = []
    }
    this.field.fields.push(fieldBuilder.build())
    return this
  }

  /**
   * 使用 Fragment
   */
  useFragment(name: string): this {
    if (!this.field.fields) {
      this.field.fields = []
    }
    this.field.fields.push({ name: `...${name}` })
    return this
  }

  /**
   * 构建字段
   */
  build(): FieldSelection {
    return this.field
  }
}

/**
 * 创建查询构建器
 */
export function query(name?: string): GraphQLQueryBuilder {
  const builder = new GraphQLQueryBuilder('query')
  if (name) {
    builder.name(name)
  }
  return builder
}

/**
 * 创建变更构建器
 */
export function mutation(name?: string): GraphQLQueryBuilder {
  const builder = new GraphQLQueryBuilder('mutation')
  if (name) {
    builder.name(name)
  }
  return builder
}

/**
 * 创建订阅构建器
 */
export function subscription(name?: string): GraphQLQueryBuilder {
  const builder = new GraphQLQueryBuilder('subscription')
  if (name) {
    builder.name(name)
  }
  return builder
}

/**
 * 创建字段构建器
 */
export function field(name: string): FieldBuilder {
  return new FieldBuilder(name)
}