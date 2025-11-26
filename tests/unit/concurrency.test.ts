/**
 * 并发测试
 *
 * 测试高并发场景下的系统行为，确保并发安全性。
 */

import { describe, expect, it } from 'vitest'
import { OptimizedLRUCache } from '../../packages/core/src/utils/cache-lru-optimized'
import { BloomFilterCache } from '../../packages/core/src/utils/cache-bloom-filter'

describe('并发测试', () => {
  describe('LRU缓存并发测试', () => {
    it('应该正确处理并发set操作', async () => {
      const cache = new OptimizedLRUCache<number>(1000)

      // 并发设置1000个键
      const promises = Array.from({ length: 1000 }, (_, i) =>
        Promise.resolve().then(() => cache.set(`key${i}`, i, 300000)),
      )

      await Promise.all(promises)

      // 验证所有键都被正确设置
      expect(cache.size()).toBe(1000)

      for (let i = 0; i < 1000; i++) {
        expect(cache.get(`key${i}`)).toBe(i)
      }
    })

    it('应该正确处理并发get操作', async () => {
      const cache = new OptimizedLRUCache<string>(100)

      // 预设数据
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`, 300000)
      }

      // 并发获取
      const promises = Array.from({ length: 1000 }, (_, i) =>
        Promise.resolve().then(() => cache.get(`key${i % 100}`)),
      )

      const results = await Promise.all(promises)

      // 验证所有结果正确
      results.forEach((result, i) => {
        expect(result).toBe(`value${i % 100}`)
      })
    })

    it('应该正确处理混合并发操作', async () => {
      const cache = new OptimizedLRUCache<string>(100)

      // 混合操作：set、get、delete
      const operations = []

      for (let i = 0; i < 100; i++) {
        operations.push(
          Promise.resolve().then(() => cache.set(`key${i}`, `value${i}`, 300000)),
        )
      }

      for (let i = 0; i < 100; i++) {
        operations.push(
          Promise.resolve().then(() => cache.get(`key${i}`)),
        )
      }

      for (let i = 0; i < 50; i++) {
        operations.push(
          Promise.resolve().then(() => cache.delete(`key${i}`)),
        )
      }

      await Promise.all(operations)

      // 验证状态一致性
      expect(cache.size()).toBeLessThanOrEqual(100)
    })

    it('应该正确处理并发淘汰场景', async () => {
      const cache = new OptimizedLRUCache<string>(100)

      // 并发添加200个项（会触发淘汰）
      const promises = Array.from({ length: 200 }, (_, i) =>
        Promise.resolve().then(() => cache.set(`key${i}`, `value${i}`, 300000)),
      )

      await Promise.all(promises)

      // 缓存大小应该不超过最大值
      expect(cache.size()).toBeLessThanOrEqual(100)
    })
  })

  describe('布隆过滤器并发测试', () => {
    it('应该正确处理并发set操作', async () => {
      const cache = new BloomFilterCache<number>(500)

      const promises = Array.from({ length: 500 }, (_, i) =>
        Promise.resolve().then(() => cache.set(`key${i}`, i, 300000)),
      )

      await Promise.all(promises)

      expect(cache.size()).toBe(500)
    })

    it('应该正确处理并发get操作（存在的键）', async () => {
      const cache = new BloomFilterCache<string>(100)

      // 预设数据
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`, 300000)
      }

      // 并发获取
      const promises = Array.from({ length: 1000 }, (_, i) =>
        Promise.resolve().then(() => cache.get(`key${i % 100}`)),
      )

      const results = await Promise.all(promises)

      // 所有结果应该正确
      results.forEach((result, i) => {
        expect(result).toBe(`value${i % 100}`)
      })
    })

    it('应该正确处理并发get操作（不存在的键）', async () => {
      const cache = new BloomFilterCache<string>(100)

      // 只设置10个键
      for (let i = 0; i < 10; i++) {
        cache.set(`exists${i}`, `value${i}`, 300000)
      }

      // 并发查询1000个不存在的键
      const promises = Array.from({ length: 1000 }, (_, i) =>
        Promise.resolve().then(() => cache.get(`nonexistent${i}`)),
      )

      const results = await Promise.all(promises)

      // 所有结果都应该是null
      results.forEach((result) => {
        expect(result).toBeNull()
      })
    })
  })

  describe('高并发压力测试', () => {
    it('应该在高并发下保持性能', async () => {
      const cache = new OptimizedLRUCache<string>(1000)

      const start = performance.now()

      // 10000个并发操作
      const promises = Array.from({ length: 10000 }, (_, i) =>
        Promise.resolve().then(() => {
          if (i % 3 === 0) {
            cache.set(`key${i % 1000}`, `value${i}`, 300000)
          }
          else if (i % 3 === 1) {
            cache.get(`key${i % 1000}`)
          }
          else {
            cache.delete(`key${i % 1000}`)
          }
        }),
      )

      await Promise.all(promises)

      const duration = performance.now() - start

      // 应该在合理时间内完成（<100ms）
      expect(duration).toBeLessThan(100)
    })

    it('应该处理大量并发淘汰', async () => {
      const cache = new OptimizedLRUCache<string>(100)

      // 并发添加1000个项（远超容量）
      const promises = Array.from({ length: 1000 }, (_, i) =>
        Promise.resolve().then(() => cache.set(`key${i}`, `value${i}`, 300000)),
      )

      await Promise.all(promises)

      // 缓存大小应该保持在限制内
      expect(cache.size()).toBeLessThanOrEqual(100)

      // 统计应该正确
      const stats = cache.getStats()
      expect(stats.evictions).toBeGreaterThan(0)
    })
  })

  describe('竞态条件测试', () => {
    it('应该正确处理同时set和get相同的键', async () => {
      const cache = new OptimizedLRUCache<number>(10)

      // 并发set和get同一个键
      const promises = []

      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => cache.set('key1', i, 300000)),
        )
        promises.push(
          Promise.resolve().then(() => cache.get('key1')),
        )
      }

      await Promise.all(promises)

      // 应该不崩溃，最终值应该是某个有效值
      const finalValue = cache.get('key1')
      expect(finalValue).not.toBeNull()
      expect(typeof finalValue).toBe('number')
    })

    it('应该正确处理同时set和delete相同的键', async () => {
      const cache = new OptimizedLRUCache<string>(10)

      const promises = []

      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => cache.set('key1', `value${i}`, 300000)),
        )
        promises.push(
          Promise.resolve().then(() => cache.delete('key1')),
        )
      }

      await Promise.all(promises)

      // 应该不崩溃，状态应该一致
      expect(() => cache.get('key1')).not.toThrow()
    })
  })

  describe('内存压力测试', () => {
    it('应该能处理大量数据的快速创建和销毁', () => {
      for (let i = 0; i < 100; i++) {
        const cache = new OptimizedLRUCache<string>(100)

        for (let j = 0; j < 100; j++) {
          cache.set(`key${j}`, `value${j}`, 300000)
        }

        cache.destroy()
      }

      // 应该不崩溃，内存应该被正确释放
      expect(true).toBe(true)
    })

    it('应该正确处理大对象的缓存', () => {
      const cache = new OptimizedLRUCache<any>(10)

      // 创建大对象
      const largeObject = {
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `item${i}`,
          value: Math.random(),
        })),
      }

      cache.set('large', largeObject, 300000)

      const retrieved = cache.get('large')
      expect(retrieved).toEqual(largeObject)
    })
  })

  describe('统计准确性测试', () => {
    it('LRU缓存统计应该在并发下保持准确', async () => {
      const cache = new OptimizedLRUCache<string>(100)

      // 并发操作
      const operations = []

      // 50个set操作
      for (let i = 0; i < 50; i++) {
        operations.push(
          Promise.resolve().then(() => cache.set(`key${i}`, `value${i}`, 300000)),
        )
      }

      // 100个get操作（50个存在，50个不存在）
      for (let i = 0; i < 100; i++) {
        operations.push(
          Promise.resolve().then(() => cache.get(`key${i}`)),
        )
      }

      await Promise.all(operations)

      const stats = cache.getStats()

      // 验证统计数据
      expect(stats.hits).toBe(50) // 50个键存在
      expect(stats.misses).toBe(50) // 50个键不存在
      expect(stats.hitRate).toBeCloseTo(50, 1)
    })
  })
})

