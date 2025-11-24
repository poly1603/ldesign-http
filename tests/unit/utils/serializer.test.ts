/**
 * 请求序列化器单元测试
 */

import { describe, expect, it } from 'vitest'
import type { RequestConfig } from '../../../packages/core/src/types'
import {
  RequestSerializer,
  defaultSerializer,
  generateRequestFingerprint,
  generateRequestKey,
} from '../../../packages/core/src/utils/serializer'

describe('RequestSerializer', () => {
  describe('基础功能', () => {
    it('应该正确生成请求键（默认配置）', () => {
      const serializer = new RequestSerializer()
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
        params: { page: 1, size: 10 },
        data: { name: 'test' },
      }

      const key = serializer.generateKey(config)

      expect(key).toBe('GET:/api/users:{"page":1,"size":10}:{"name":"test"}')
    })

    it('应该处理空参数', () => {
      const serializer = new RequestSerializer()
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
      }

      const key = serializer.generateKey(config)

      expect(key).toBe('GET:/api/users::')
    })

    it('应该使用默认方法 GET', () => {
      const serializer = new RequestSerializer()
      const config: RequestConfig = {
        url: '/api/users',
      }

      const key = serializer.generateKey(config)

      expect(key).toBe('GET:/api/users::')
    })

    it('应该正确处理复杂对象', () => {
      const serializer = new RequestSerializer()
      const config: RequestConfig = {
        method: 'POST',
        url: '/api/users',
        data: {
          user: {
            name: 'John',
            age: 30,
            tags: ['developer', 'typescript'],
          },
        },
      }

      const key = serializer.generateKey(config)

      expect(key).toContain('POST:/api/users')
      expect(key).toContain('"name":"John"')
      expect(key).toContain('"age":30')
    })
  })

  describe('配置选项', () => {
    it('应该支持不包含方法', () => {
      const serializer = new RequestSerializer({ includeMethod: false })
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
      }

      const key = serializer.generateKey(config)

      expect(key).toBe('/api/users::')
      expect(key).not.toContain('GET')
    })

    it('应该支持不包含 URL', () => {
      const serializer = new RequestSerializer({ includeUrl: false })
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
      }

      const key = serializer.generateKey(config)

      // 当不包含 URL 时，只有 method 和两个空字符串（params 和 data）
      expect(key).toBe('GET::')
      expect(key).not.toContain('/api/users')
    })

    it('应该支持不包含参数', () => {
      const serializer = new RequestSerializer({ includeParams: false })
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
        params: { page: 1 },
      }

      const key = serializer.generateKey(config)

      expect(key).toBe('GET:/api/users:')
      expect(key).not.toContain('page')
    })

    it('应该支持不包含请求体', () => {
      const serializer = new RequestSerializer({ includeData: false })
      const config: RequestConfig = {
        method: 'POST',
        url: '/api/users',
        data: { name: 'test' },
      }

      const key = serializer.generateKey(config)

      expect(key).toBe('POST:/api/users:')
      expect(key).not.toContain('name')
    })

    it('应该支持包含特定请求头', () => {
      const serializer = new RequestSerializer({
        includeHeaders: true,
        specificHeaders: ['Authorization', 'X-Custom-Header'],
      })
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
        headers: {
          'Authorization': 'Bearer token',
          'X-Custom-Header': 'value',
          'Content-Type': 'application/json',
        },
      }

      const key = serializer.generateKey(config)

      expect(key).toContain('Authorization')
      expect(key).toContain('X-Custom-Header')
      expect(key).not.toContain('Content-Type')
    })
  })

  describe('请求指纹', () => {
    it('应该生成一致的指纹', () => {
      const serializer = new RequestSerializer()
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
        params: { page: 1 },
      }

      const fingerprint1 = serializer.generateFingerprint(config)
      const fingerprint2 = serializer.generateFingerprint(config)

      expect(fingerprint1).toBe(fingerprint2)
      expect(fingerprint1).toMatch(/^[0-9a-f]+$/)
    })

    it('不同的请求应该生成不同的指纹', () => {
      const serializer = new RequestSerializer()
      const config1: RequestConfig = {
        method: 'GET',
        url: '/api/users',
      }
      const config2: RequestConfig = {
        method: 'POST',
        url: '/api/users',
      }

      const fingerprint1 = serializer.generateFingerprint(config1)
      const fingerprint2 = serializer.generateFingerprint(config2)

      expect(fingerprint1).not.toBe(fingerprint2)
    })
  })

  describe('快捷函数', () => {
    it('generateRequestKey 应该使用默认序列化器', () => {
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
      }

      const key = generateRequestKey(config)

      expect(key).toBe('GET:/api/users::')
    })

    it('generateRequestFingerprint 应该使用默认序列化器', () => {
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
      }

      const fingerprint = generateRequestFingerprint(config)

      expect(fingerprint).toMatch(/^[0-9a-f]+$/)
    })
  })

  describe('边界情况', () => {
    it('应该处理空配置', () => {
      const serializer = new RequestSerializer()
      const config: RequestConfig = {}

      const key = serializer.generateKey(config)

      expect(key).toBe('GET:::')
    })

    it('应该处理无法序列化的对象', () => {
      const serializer = new RequestSerializer()
      const circular: any = {}
      circular.self = circular

      const config: RequestConfig = {
        method: 'POST',
        url: '/api/test',
        data: circular,
      }

      const key = serializer.generateKey(config)

      // 应该返回空字符串而不是抛出错误
      expect(key).toBe('POST:/api/test::')
    })

    it('应该处理 null 和 undefined', () => {
      const serializer = new RequestSerializer()
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
        params: null as any,
        data: undefined,
      }

      const key = serializer.generateKey(config)

      expect(key).toBe('GET:/api/users::')
    })
  })

  describe('性能', () => {
    it('应该快速生成键（1000次调用 < 100ms）', () => {
      const serializer = new RequestSerializer()
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
        params: { page: 1, size: 10 },
      }

      const startTime = Date.now()
      for (let i = 0; i < 1000; i++) {
        serializer.generateKey(config)
      }
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('默认序列化器', () => {
    it('应该提供默认实例', () => {
      expect(defaultSerializer).toBeInstanceOf(RequestSerializer)
    })

    it('默认实例应该可用', () => {
      const config: RequestConfig = {
        method: 'GET',
        url: '/api/users',
      }

      const key = defaultSerializer.generateKey(config)

      expect(key).toBe('GET:/api/users::')
    })
  })
})

