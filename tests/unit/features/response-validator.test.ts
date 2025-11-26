/**
 * 响应验证功能测试
 */

import { describe, expect, it } from 'vitest'
import { ResponseValidator, Validators } from '../../../packages/core/src/features/response-validator'

describe('ResponseValidator 响应验证测试', () => {
  describe('基础验证测试', () => {
    it('应该能创建验证器', () => {
      const validator = new ResponseValidator()
      expect(validator).toBeDefined()
    })

    it('应该通过有效数据的验证', () => {
      const validator = new ResponseValidator()

      const schema = {
        id: (v: any) => typeof v === 'number',
        name: (v: any) => typeof v === 'string',
      }

      const data = {
        id: 123,
        name: 'John',
      }

      const result = validator.validate(data, schema)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测无效数据', () => {
      const validator = new ResponseValidator()

      const schema = {
        id: (v: any) => typeof v === 'number',
        name: (v: any) => typeof v === 'string',
      }

      const data = {
        id: '123', // 应该是number
        name: 'John',
      }

      const result = validator.validate(data, schema)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('id')
    })

    it('应该检测多个字段错误', () => {
      const validator = new ResponseValidator()

      const schema = {
        id: (v: any) => typeof v === 'number',
        name: (v: any) => typeof v === 'string',
        email: (v: any) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      }

      const data = {
        id: '123', // 错误
        name: 123, // 错误
        email: 'invalid', // 错误
      }

      const result = validator.validate(data, schema)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(3)
    })
  })

  describe('严格模式测试', () => {
    it('严格模式下验证失败应该抛出错误', () => {
      const validator = new ResponseValidator({ strict: true })

      const schema = {
        id: (v: any) => typeof v === 'number',
      }

      const data = {
        id: 'invalid',
      }

      expect(() => {
        validator.validate(data, schema)
      }).toThrow('Response validation failed')
    })

    it('非严格模式下验证失败不应该抛出错误', () => {
      const validator = new ResponseValidator({ strict: false })

      const schema = {
        id: (v: any) => typeof v === 'number',
      }

      const data = {
        id: 'invalid',
      }

      expect(() => {
        const result = validator.validate(data, schema)
        expect(result.valid).toBe(false)
      }).not.toThrow()
    })
  })

  describe('内置验证规则测试', () => {
    it('Validators.required 应该正确工作', () => {
      const rule = Validators.required()

      expect(rule('')).not.toBe(true)
      expect(rule(null)).not.toBe(true)
      expect(rule(undefined)).not.toBe(true)
      expect(rule('value')).toBe(true)
      expect(rule(0)).toBe(true)
      expect(rule(false)).toBe(true)
    })

    it('Validators.string 应该正确工作', () => {
      const rule = Validators.string()

      expect(rule('text')).toBe(true)
      expect(rule('')).toBe(true)
      expect(rule(123)).not.toBe(true)
      expect(rule(null)).not.toBe(true)
    })

    it('Validators.number 应该正确工作', () => {
      const rule = Validators.number()

      expect(rule(123)).toBe(true)
      expect(rule(0)).toBe(true)
      expect(rule(-1)).toBe(true)
      expect(rule('123')).not.toBe(true)
      expect(rule(null)).not.toBe(true)
    })

    it('Validators.email 应该正确工作', () => {
      const rule = Validators.email()

      expect(rule('user@example.com')).toBe(true)
      expect(rule('test@test.co')).toBe(true)
      expect(rule('invalid')).not.toBe(true)
      expect(rule('@example.com')).not.toBe(true)
      expect(rule(123)).not.toBe(true)
    })

    it('Validators.minLength 应该正确工作', () => {
      const rule = Validators.minLength(5)

      expect(rule('12345')).toBe(true)
      expect(rule('123456')).toBe(true)
      expect(rule('1234')).not.toBe(true)
      expect(rule([1, 2, 3, 4, 5])).toBe(true)
      expect(rule([1, 2])).not.toBe(true)
    })

    it('Validators.maxLength 应该正确工作', () => {
      const rule = Validators.maxLength(5)

      expect(rule('123')).toBe(true)
      expect(rule('12345')).toBe(true)
      expect(rule('123456')).not.toBe(true)
      expect(rule([1, 2, 3])).toBe(true)
      expect(rule([1, 2, 3, 4, 5, 6])).not.toBe(true)
    })

    it('Validators.range 应该正确工作', () => {
      const rule = Validators.range(1, 10)

      expect(rule(1)).toBe(true)
      expect(rule(5)).toBe(true)
      expect(rule(10)).toBe(true)
      expect(rule(0)).not.toBe(true)
      expect(rule(11)).not.toBe(true)
      expect(rule('5')).not.toBe(true)
    })

    it('Validators.pattern 应该正确工作', () => {
      const rule = Validators.pattern(/^\d{3}-\d{4}$/, '格式应为 XXX-XXXX')

      expect(rule('123-4567')).toBe(true)
      expect(rule('12-345')).not.toBe(true)
      expect(rule(123)).not.toBe(true)
    })

    it('Validators.enum 应该正确工作', () => {
      const rule = Validators.enum(['admin', 'user', 'guest'])

      expect(rule('admin')).toBe(true)
      expect(rule('user')).toBe(true)
      expect(rule('guest')).toBe(true)
      expect(rule('invalid')).not.toBe(true)
      expect(rule(123)).not.toBe(true)
    })

    it('Validators.array 应该正确工作', () => {
      const rule = Validators.array()

      expect(rule([])).toBe(true)
      expect(rule([1, 2, 3])).toBe(true)
      expect(rule('not array')).not.toBe(true)
      expect(rule({})).not.toBe(true)
    })

    it('Validators.object 应该正确工作', () => {
      const rule = Validators.object()

      expect(rule({})).toBe(true)
      expect(rule({ a: 1 })).toBe(true)
      expect(rule([])).not.toBe(true)
      expect(rule(null)).not.toBe(true)
      expect(rule('string')).not.toBe(true)
    })
  })

  describe('多规则验证测试', () => {
    it('应该支持多个验证规则', () => {
      const validator = new ResponseValidator()

      const schema = {
        name: [
          Validators.required(),
          Validators.string(),
          Validators.minLength(3),
        ],
      }

      // 通过所有规则
      let result = validator.validate({ name: 'John' }, schema)
      expect(result.valid).toBe(true)

      // 失败：空值
      result = validator.validate({ name: '' }, schema)
      expect(result.valid).toBe(false)

      // 失败：太短
      result = validator.validate({ name: 'Jo' }, schema)
      expect(result.valid).toBe(false)

      // 失败：类型错误
      result = validator.validate({ name: 123 }, schema)
      expect(result.valid).toBe(false)
    })
  })

  describe('统计功能测试', () => {
    it('应该正确统计验证字段数', () => {
      const validator = new ResponseValidator()

      const schema = {
        id: Validators.number(),
        name: Validators.string(),
        email: Validators.email(),
      }

      const data = {
        id: 123,
        name: 'John',
        email: 'john@example.com',
      }

      const result = validator.validate(data, schema)

      expect(result.fieldsChecked).toBe(3)
      expect(result.fieldsFailed).toBe(0)
    })

    it('应该正确统计失败字段数', () => {
      const validator = new ResponseValidator()

      const schema = {
        id: Validators.number(),
        name: Validators.string(),
        email: Validators.email(),
      }

      const data = {
        id: 'invalid',
        name: 123,
        email: 'invalid',
      }

      const result = validator.validate(data, schema)

      expect(result.fieldsChecked).toBe(3)
      expect(result.fieldsFailed).toBe(3)
    })
  })

  describe('错误回调测试', () => {
    it('应该触发错误回调', () => {
      let callbackCalled = false
      let callbackErrors: any[] = []

      const validator = new ResponseValidator({
        onValidationError: (errors) => {
          callbackCalled = true
          callbackErrors = errors
        },
      })

      const schema = {
        id: Validators.number(),
      }

      const data = {
        id: 'invalid',
      }

      validator.validate(data, schema)

      expect(callbackCalled).toBe(true)
      expect(callbackErrors).toHaveLength(1)
    })
  })
})

