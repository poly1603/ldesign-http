/**
 * 边界情况测试
 *
 * 测试各种边界情况和极端场景，确保代码的健壮性。
 */

import { describe, expect, it } from 'vitest'
import { buildQueryString, combineURLs, isAbsoluteURL } from '../../src/utils'
import { OptimizedLRUCache } from '../../src/utils/cache-lru-optimized'
import { BloomFilterCache } from '../../src/utils/cache-bloom-filter'
import { RegexUtils } from '../../src/utils/regex-cache'

describe('边界情况测试', () => {
  describe('buildQueryString 边界测试', () => {
    it('应该处理空对象', () => {
      expect(buildQueryString({})).toBe('')
    })

    it('应该处理只有null值的对象', () => {
      expect(buildQueryString({ a: null, b: null })).toBe('')
    })

    it('应该处理只有undefined值的对象', () => {
      expect(buildQueryString({ a: undefined, b: undefined })).toBe('')
    })

    it('应该处理null和undefined混合', () => {
      const result = buildQueryString({
        a: null,
        b: undefined,
        c: 'value',
      })
      expect(result).toBe('c=value')
    })

    it('应该处理空数组', () => {
      expect(buildQueryString({ tags: [] })).toBe('')
    })

    it('应该处理包含null的数组', () => {
      const result = buildQueryString({
        tags: ['a', null, 'b', undefined, 'c'],
      })
      expect(result).toBe('tags=a&tags=b&tags=c')
    })

    it('应该处理非常大的对象（1000个键）', () => {
      const largeObject = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`key${i}`, `value${i}`]),
      )

      const result = buildQueryString(largeObject)
      expect(result).toContain('key0=value0')
      expect(result).toContain('key999=value999')
      expect(result.split('&').length).toBe(1000)
    })

    it('应该处理特殊字符', () => {
      const result = buildQueryString({
        name: 'hello world',
        filter: 'a&b=c',
        emoji: '😀',
        chinese: '中文',
      })

      expect(result).toContain('hello+world')
      expect(result).toContain('%26') // &
      expect(result).toContain('%3D') // =
      expect(result).toContain('%F0%9F%98%80') // 😀
    })

    it('应该处理非常长的字符串值', () => {
      const longString = 'a'.repeat(10000)
      const result = buildQueryString({ data: longString })

      expect(result).toContain('data=')
      expect(result.length).toBeGreaterThan(10000)
    })

    it('应该处理布尔值', () => {
      const result = buildQueryString({
        active: true,
        deleted: false,
      })

      expect(result).toContain('active=true')
      expect(result).toContain('deleted=false')
    })

    it('应该处理数字0', () => {
      const result = buildQueryString({
        count: 0,
        index: 0,
      })

      expect(result).toContain('count=0')
      expect(result).toContain('index=0')
    })
  })

  describe('URL操作边界测试', () => {
    it('应该处理空字符串URL', () => {
      expect(isAbsoluteURL('')).toBe(false)
    })

    it('应该处理只有协议的URL', () => {
      expect(isAbsoluteURL('http://')).toBe(true)
      expect(isAbsoluteURL('https://')).toBe(true)
    })

    it('应该处理protocol-relative URL', () => {
      expect(isAbsoluteURL('//example.com')).toBe(true)
    })

    it('应该处理各种相对路径', () => {
      expect(isAbsoluteURL('/api/users')).toBe(false)
      expect(isAbsoluteURL('./api/users')).toBe(false)
      expect(isAbsoluteURL('../api/users')).toBe(false)
      expect(isAbsoluteURL('api/users')).toBe(false)
    })

    it('应该处理多个斜杠', () => {
      const result = combineURLs('https://example.com///', '///api///users///')
      expect(result).toBe('https://example.com/api///users///')
    })

    it('应该处理空的相对URL', () => {
      const result = combineURLs('https://example.com', '')
      expect(result).toBe('https://example.com')
    })

    it('应该处理非常长的URL', () => {
      const longPath = 'a'.repeat(10000)
      const result = combineURLs('https://example.com', longPath)

      expect(result).toContain('https://example.com/')
      expect(result.length).toBeGreaterThan(10000)
    })
  })

  describe('LRU缓存边界测试', () => {
    it('应该处理容量为1的缓存', () => {
      const cache = new OptimizedLRUCache<string>(1)

      cache.set('key1', 'value1', 300000)
      expect(cache.get('key1')).toBe('value1')

      cache.set('key2', 'value2', 300000)
      expect(cache.get('key1')).toBeNull() // 被淘汰
      expect(cache.get('key2')).toBe('value2')
    })

    it('应该处理TTL为0的情况', () => {
      const cache = new OptimizedLRUCache<string>(10)

      cache.set('key1', 'value1', 0)
      // TTL为0，立即过期
      expect(cache.get('key1')).toBeNull()
    })

    it('应该处理非常大的TTL', () => {
      const cache = new OptimizedLRUCache<string>(10)

      const veryLongTTL = Number.MAX_SAFE_INTEGER
      cache.set('key1', 'value1', veryLongTTL)

      expect(cache.get('key1')).toBe('value1')
    })

    it('应该处理重复设置同一个键', () => {
      const cache = new OptimizedLRUCache<string>(10)

      cache.set('key1', 'value1', 300000)
      cache.set('key1', 'value2', 300000)
      cache.set('key1', 'value3', 300000)

      expect(cache.get('key1')).toBe('value3')
      expect(cache.size()).toBe(1)
    })

    it('应该处理删除不存在的键', () => {
      const cache = new OptimizedLRUCache<string>(10)

      expect(() => {
        cache.delete('nonexistent')
      }).not.toThrow()
    })

    it('应该处理空缓存的操作', () => {
      const cache = new OptimizedLRUCache<string>(10)

      expect(cache.get('any')).toBeNull()
      expect(cache.size()).toBe(0)
      expect(cache.keys()).toEqual([])
      expect(() => cache.clear()).not.toThrow()
    })

    it('应该处理销毁后的操作', () => {
      const cache = new OptimizedLRUCache<string>(10)

      cache.set('key1', 'value1', 300000)
      cache.destroy()

      // 销毁后仍应该能安全操作（不抛出错误）
      expect(() => {
        cache.get('key1')
        cache.set('key2', 'value2', 300000)
      }).not.toThrow()
    })
  })

  describe('布隆过滤器缓存边界测试', () => {
    it('应该处理空缓存的查询', () => {
      const cache = new BloomFilterCache<string>(10)

      expect(cache.get('any')).toBeNull()
    })

    it('应该正确处理添加后立即查询', () => {
      const cache = new BloomFilterCache<string>(10)

      cache.set('key1', 'value1', 300000)
      expect(cache.get('key1')).toBe('value1')
    })

    it('应该处理大量不存在的键查询', () => {
      const cache = new BloomFilterCache<string>(100)

      // 只添加少量数据
      for (let i = 0; i < 10; i++) {
        cache.set(`exists${i}`, `value${i}`, 300000)
      }

      // 查询大量不存在的键
      for (let i = 0; i < 1000; i++) {
        const result = cache.get(`nonexistent${i}`)
        expect(result).toBeNull()
      }
    })

    it('应该处理清空后的状态', () => {
      const cache = new BloomFilterCache<string>(10)

      cache.set('key1', 'value1', 300000)
      cache.clear()

      // 清空后，布隆过滤器也应该被清空
      expect(cache.get('key1')).toBeNull()
      expect(cache.size()).toBe(0)
    })
  })

  describe('正则工具边界测试', () => {
    it('应该处理空字符串', () => {
      expect(RegexUtils.isAbsoluteURL('')).toBe(false)
      expect(RegexUtils.isEmail('')).toBe(false)
      expect(RegexUtils.isNumeric('')).toBe(false)
    })

    it('应该处理特殊的邮箱格式', () => {
      expect(RegexUtils.isEmail('user@example.com')).toBe(true)
      expect(RegexUtils.isEmail('user.name@example.com')).toBe(true)
      expect(RegexUtils.isEmail('user+tag@example.com')).toBe(true)
      expect(RegexUtils.isEmail('@example.com')).toBe(false)
      expect(RegexUtils.isEmail('user@')).toBe(false)
      expect(RegexUtils.isEmail('user')).toBe(false)
    })

    it('应该处理特殊的数字格式', () => {
      expect(RegexUtils.isNumeric('123')).toBe(true)
      expect(RegexUtils.isNumeric('-123')).toBe(true)
      expect(RegexUtils.isNumeric('12.34')).toBe(true)
      expect(RegexUtils.isNumeric('-12.34')).toBe(true)
      expect(RegexUtils.isNumeric('0')).toBe(true)
      expect(RegexUtils.isNumeric('abc')).toBe(false)
      expect(RegexUtils.isNumeric('12.34.56')).toBe(false)
    })

    it('应该处理各种文件类型', () => {
      // 图片
      expect(RegexUtils.isImageFile('photo.jpg')).toBe(true)
      expect(RegexUtils.isImageFile('PHOTO.JPG')).toBe(true)
      expect(RegexUtils.isImageFile('image.png')).toBe(true)
      expect(RegexUtils.isImageFile('icon.svg')).toBe(true)

      // 视频
      expect(RegexUtils.isVideoFile('video.mp4')).toBe(true)
      expect(RegexUtils.isVideoFile('movie.avi')).toBe(true)

      // 文档
      expect(RegexUtils.isDocumentFile('report.pdf')).toBe(true)
      expect(RegexUtils.isDocumentFile('sheet.xlsx')).toBe(true)

      // 非法
      expect(RegexUtils.isImageFile('photo')).toBe(false)
      expect(RegexUtils.isImageFile('photo.txt')).toBe(false)
    })

    it('应该处理移除斜杠的边界情况', () => {
      expect(RegexUtils.removeTrailingSlash('')).toBe('')
      expect(RegexUtils.removeTrailingSlash('/')).toBe('')
      expect(RegexUtils.removeTrailingSlash('///')).toBe('')
      expect(RegexUtils.removeTrailingSlash('path')).toBe('path')
      expect(RegexUtils.removeTrailingSlash('path/')).toBe('path')
      expect(RegexUtils.removeTrailingSlash('path///')).toBe('path')

      expect(RegexUtils.removeLeadingSlash('')).toBe('')
      expect(RegexUtils.removeLeadingSlash('/')).toBe('')
      expect(RegexUtils.removeLeadingSlash('///')).toBe('')
      expect(RegexUtils.removeLeadingSlash('path')).toBe('path')
      expect(RegexUtils.removeLeadingSlash('/path')).toBe('path')
      expect(RegexUtils.removeLeadingSlash('///path')).toBe('path')
    })
  })

  describe('类型检查边界测试', () => {
    it('应该正确处理各种假值', () => {
      const falsy = [null, undefined, '', 0, false, NaN]

      falsy.forEach((value) => {
        const result = buildQueryString({ value })
        // null和undefined会被过滤
        if (value === null || value === undefined) {
          expect(result).toBe('')
        }
        else {
          expect(result).toContain('value=')
        }
      })
    })

    it('应该处理嵌套对象', () => {
      const result = buildQueryString({
        nested: { a: 1, b: 2 },
      })

      // 嵌套对象会被字符串化
      expect(result).toContain('nested=')
    })

    it('应该处理数组嵌套', () => {
      const result = buildQueryString({
        matrix: [[1, 2], [3, 4]],
      })

      expect(result).toContain('matrix=')
    })
  })

  describe('缓存极端场景测试', () => {
    it('应该处理快速连续的set和get', () => {
      const cache = new OptimizedLRUCache<number>(100)

      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i % 100}`, i, 300000)
        const value = cache.get(`key${i % 100}`)
        expect(value).toBe(i)
      }
    })

    it('应该处理过期时间边界', () => {
      const cache = new OptimizedLRUCache<string>(10)

      // 设置1ms后过期
      cache.set('key1', 'value1', 1)

      // 立即查询应该成功
      expect(cache.get('key1')).toBe('value1')

      // 等待2ms后查询应该失败
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cache.get('key1')).toBeNull()
          resolve()
        }, 2)
      })
    })

    it('应该处理并发set操作', () => {
      const cache = new OptimizedLRUCache<string>(100)

      // 并发设置
      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve(cache.set(`key${i}`, `value${i}`, 300000)),
      )

      return Promise.all(promises).then(() => {
        expect(cache.size()).toBe(100)
      })
    })

    it('应该处理删除操作中的边界情况', () => {
      const cache = new OptimizedLRUCache<string>(10)

      cache.set('key1', 'value1', 300000)

      // 多次删除同一个键
      expect(cache.delete('key1')).toBe(true)
      expect(cache.delete('key1')).toBe(false)
      expect(cache.delete('key1')).toBe(false)
    })
  })

  describe('RegexUtils 边界测试', () => {
    it('应该处理各种异常输入', () => {
      // 空值处理
      expect(() => RegexUtils.isEmail('')).not.toThrow()
      expect(() => RegexUtils.isNumeric('')).not.toThrow()
      expect(() => RegexUtils.isUUID('')).not.toThrow()

      // 特殊字符
      expect(RegexUtils.isEmail('test@@@example.com')).toBe(false)
      expect(RegexUtils.isNumeric('12.34.56')).toBe(false)
    })

    it('应该处理非常长的字符串', () => {
      const longString = 'a'.repeat(100000)

      expect(() => {
        RegexUtils.isEmail(longString)
        RegexUtils.isNumeric(longString)
      }).not.toThrow()
    })

    it('应该处理Unicode字符', () => {
      expect(RegexUtils.isEmail('用户@example.com')).toBe(true)
      expect(RegexUtils.removeTrailingSlash('路径/')).toBe('路径')
    })
  })

  describe('极端性能测试', () => {
    it('buildQueryString应该能处理极大的对象而不崩溃', () => {
      const hugeObject = Object.fromEntries(
        Array.from({ length: 10000 }, (_, i) => [`key${i}`, i]),
      )

      expect(() => {
        const result = buildQueryString(hugeObject)
        expect(result.length).toBeGreaterThan(0)
      }).not.toThrow()
    })

    it('LRU缓存应该能处理快速的填充和清空', () => {
      const cache = new OptimizedLRUCache<string>(1000)

      for (let round = 0; round < 10; round++) {
        // 填充
        for (let i = 0; i < 1000; i++) {
          cache.set(`key${i}`, `value${i}`, 300000)
        }

        // 清空
        cache.clear()
        expect(cache.size()).toBe(0)
      }
    })

    it('布隆过滤器应该能处理大量数据而不崩溃', () => {
      const cache = new BloomFilterCache<string>(1000)

      expect(() => {
        for (let i = 0; i < 10000; i++) {
          cache.set(`key${i}`, `value${i}`, 300000)
        }
      }).not.toThrow()

      // 验证淘汰机制工作正常
      expect(cache.size()).toBeLessThanOrEqual(1000)
    })
  })

  describe('内存安全测试', () => {
    it('销毁后的缓存应该可以安全访问', () => {
      const cache = new OptimizedLRUCache<string>(10)

      cache.set('key1', 'value1', 300000)
      cache.destroy()

      // 销毁后访问应该不抛出错误
      expect(() => {
        cache.get('key1')
        cache.set('key2', 'value2', 300000)
        cache.clear()
      }).not.toThrow()
    })

    it('多次销毁应该是安全的', () => {
      const cache = new OptimizedLRUCache<string>(10)

      cache.destroy()
      cache.destroy()
      cache.destroy()

      expect(() => cache.destroy()).not.toThrow()
    })
  })
})

