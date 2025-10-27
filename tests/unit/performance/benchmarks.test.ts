/**
 * 性能基准测试
 *
 * 测试各个核心功能的性能表现，建立性能基线。
 */

import { describe, expect, it } from 'vitest'
import { buildQueryString, combineURLs, isAbsoluteURL } from '../../../src/utils'
import { OptimizedLRUCache } from '../../../src/utils/cache-lru-optimized'
import { BloomFilterCache } from '../../../src/utils/cache-bloom-filter'
import { REGEX_CACHE, RegexUtils } from '../../../src/utils/regex-cache'

describe('Performance Benchmarks', () => {
  describe('buildQueryString 性能测试', () => {
    it('应该在20ms内处理1000个小对象（≤5键）', () => {
      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        buildQueryString({
          id: i,
          name: 'test',
          active: true,
          page: 1,
          size: 10,
        })
      }

      const duration = performance.now() - start
      expect(duration).toBeLessThan(20)
    })

    it('应该在30ms内处理1000个大对象（>5键）', () => {
      const start = performance.now()

      const largeObject = {
        id: 1,
        name: 'test',
        email: 'test@example.com',
        age: 30,
        city: 'Beijing',
        country: 'China',
        active: true,
        verified: true,
        role: 'user',
        permissions: 'read,write',
      }

      for (let i = 0; i < 1000; i++) {
        buildQueryString(largeObject)
      }

      const duration = performance.now() - start
      expect(duration).toBeLessThan(30)
    })

    it('小对象应该比大对象快', () => {
      const smallObject = { id: 1, name: 'test' }
      const largeObject = {
        a: 1, b: 2, c: 3, d: 4, e: 5,
        f: 6, g: 7, h: 8, i: 9, j: 10,
      }

      // 小对象测试
      const start1 = performance.now()
      for (let i = 0; i < 1000; i++) {
        buildQueryString(smallObject)
      }
      const smallDuration = performance.now() - start1

      // 大对象测试
      const start2 = performance.now()
      for (let i = 0; i < 1000; i++) {
        buildQueryString(largeObject)
      }
      const largeDuration = performance.now() - start2

      // 小对象应该更快
      expect(smallDuration).toBeLessThan(largeDuration)
    })
  })

  describe('LRU缓存性能测试', () => {
    it('优化版LRU应该在20ms内完成10000次操作', () => {
      const cache = new OptimizedLRUCache<string>(1000)
      const start = performance.now()

      // 插入
      for (let i = 0; i < 5000; i++) {
        cache.set(`key${i}`, `value${i}`, 300000)
      }

      // 查询
      for (let i = 0; i < 5000; i++) {
        cache.get(`key${i}`)
      }

      const duration = performance.now() - start
      expect(duration).toBeLessThan(20)
    })

    it('LRU淘汰操作应该非常快（<1ms for 100次）', () => {
      const cache = new OptimizedLRUCache<string>(100)

      // 填满缓存
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`, 300000)
      }

      // 测试淘汰性能
      const start = performance.now()
      for (let i = 100; i < 200; i++) {
        cache.set(`key${i}`, `value${i}`, 300000)
      }
      const duration = performance.now() - start

      expect(duration).toBeLessThan(1)
    })
  })

  describe('布隆过滤器性能测试', () => {
    it('布隆过滤器查询不存在的键应该非常快', () => {
      const cache = new BloomFilterCache<string>(1000)

      // 添加一些数据
      for (let i = 0; i < 100; i++) {
        cache.set(`exists${i}`, `value${i}`, 300000)
      }

      // 测试查询不存在的键（应该被布隆过滤器快速拦截）
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        cache.get(`nonexistent${i}`)
      }
      const duration = performance.now() - start

      // 应该非常快（<2ms）
      expect(duration).toBeLessThan(2)
    })

    it('布隆过滤器对存在的键性能影响应该很小', () => {
      const normalCache = new OptimizedLRUCache<string>(100)
      const bloomCache = new BloomFilterCache<string>(100)

      // 填充相同数据
      for (let i = 0; i < 100; i++) {
        normalCache.set(`key${i}`, `value${i}`, 300000)
        bloomCache.set(`key${i}`, `value${i}`, 300000)
      }

      // 测试普通LRU
      const start1 = performance.now()
      for (let i = 0; i < 100; i++) {
        normalCache.get(`key${i}`)
      }
      const normalDuration = performance.now() - start1

      // 测试布隆LRU
      const start2 = performance.now()
      for (let i = 0; i < 100; i++) {
        bloomCache.get(`key${i}`)
      }
      const bloomDuration = performance.now() - start2

      // 性能差异应该很小（<20%）
      expect(bloomDuration / normalDuration).toBeLessThan(1.2)
    })
  })

  describe('正则表达式缓存性能测试', () => {
    it('缓存的正则应该比每次创建快', () => {
      const testUrl = 'https://example.com/api/users'

      // 使用缓存正则
      const start1 = performance.now()
      for (let i = 0; i < 10000; i++) {
        REGEX_CACHE.ABSOLUTE_URL.test(testUrl)
      }
      const cachedDuration = performance.now() - start1

      // 每次创建正则
      const start2 = performance.now()
      for (let i = 0; i < 10000; i++) {
        /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(testUrl)
      }
      const newRegexDuration = performance.now() - start2

      // 缓存版本应该更快
      expect(cachedDuration).toBeLessThan(newRegexDuration)
    })

    it('RegexUtils应该高效执行', () => {
      const urls = Array.from({ length: 1000 }, (_, i) =>
        i % 2 === 0 ? `https://example.com/api/${i}` : `/api/${i}`,
      )

      const start = performance.now()
      const absoluteUrls = urls.filter(url => RegexUtils.isAbsoluteURL(url))
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
      expect(absoluteUrls.length).toBe(500)
    })
  })

  describe('URL操作性能测试', () => {
    it('isAbsoluteURL应该快速执行', () => {
      const testUrls = [
        'https://example.com',
        'http://example.com',
        '//example.com',
        '/api/users',
        'api/users',
      ]

      const start = performance.now()
      for (let i = 0; i < 10000; i++) {
        testUrls.forEach(url => isAbsoluteURL(url))
      }
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
    })

    it('combineURLs应该快速执行', () => {
      const baseURL = 'https://example.com'
      const relativePath = '/api/users'

      const start = performance.now()
      for (let i = 0; i < 10000; i++) {
        combineURLs(baseURL, relativePath)
      }
      const duration = performance.now() - start

      expect(duration).toBeLessThan(15)
    })
  })
})

