/**
 * LRU 缓存单元测试
 */

import { describe, expect, it } from 'vitest'
import { MemoryCacheStorage } from '../../../packages/core/src/cache/MemoryCacheStorage'

describe('MemoryCacheStorage - LRU 缓存', () => {
  describe('基础功能', () => {
    it('应该能够设置和获取缓存', async () => {
      const cache = new MemoryCacheStorage()

      await cache.set('key1', 'value1', 1000)
      const value = await cache.get('key1')

      expect(value).toBe('value1')
    })

    it('应该在过期后返回 null', async () => {
      const cache = new MemoryCacheStorage()

      await cache.set('key1', 'value1', 10) // 10ms 过期
      await new Promise(resolve => setTimeout(resolve, 20))

      const value = await cache.get('key1')

      expect(value).toBeNull()
    })

    it('应该能够删除缓存', async () => {
      const cache = new MemoryCacheStorage()

      await cache.set('key1', 'value1', 1000)
      await cache.delete('key1')
      const value = await cache.get('key1')

      expect(value).toBeNull()
    })

    it('应该能够清空所有缓存', async () => {
      const cache = new MemoryCacheStorage()

      await cache.set('key1', 'value1', 1000)
      await cache.set('key2', 'value2', 1000)
      await cache.clear()

      const value1 = await cache.get('key1')
      const value2 = await cache.get('key2')

      expect(value1).toBeNull()
      expect(value2).toBeNull()
    })

    it('应该正确检查键是否存在', async () => {
      const cache = new MemoryCacheStorage()

      await cache.set('key1', 'value1', 1000)

      const value1 = await cache.get('key1')
      const value2 = await cache.get('key2')

      expect(value1).not.toBeNull()
      expect(value2).toBeNull()
    })
  })

  describe('LRU 淘汰策略', () => {
    it('应该在达到最大大小时淘汰最少使用的项', async () => {
      const cache = new MemoryCacheStorage({ maxSize: 3 })

      // 添加 3 个项
      await cache.set('key1', 'value1', 10000)
      await cache.set('key2', 'value2', 10000)
      await cache.set('key3', 'value3', 10000)

      // 添加第 4 个项，应该淘汰 key1
      await cache.set('key4', 'value4', 10000)

      const value1 = await cache.get('key1')
      const value4 = await cache.get('key4')

      expect(value1).toBeNull() // key1 被淘汰
      expect(value4).toBe('value4') // key4 存在
    })

    it('访问项应该更新其使用顺序', async () => {
      const cache = new MemoryCacheStorage({ maxSize: 3 })

      await cache.set('key1', 'value1', 10000)
      await cache.set('key2', 'value2', 10000)
      await cache.set('key3', 'value3', 10000)

      // 访问 key1，使其成为最近使用
      await cache.get('key1')

      // 添加 key4，应该淘汰 key2（最少使用）
      await cache.set('key4', 'value4', 10000)

      const value1 = await cache.get('key1')
      const value2 = await cache.get('key2')
      const value4 = await cache.get('key4')

      expect(value1).toBe('value1') // key1 仍然存在
      expect(value2).toBeNull() // key2 被淘汰
      expect(value4).toBe('value4') // key4 存在
    })

    it('更新现有键不应该增加缓存大小', async () => {
      const cache = new MemoryCacheStorage({ maxSize: 2 })

      await cache.set('key1', 'value1', 10000)
      await cache.set('key2', 'value2', 10000)

      // 更新 key1
      await cache.set('key1', 'updated1', 10000)

      const stats = cache.getStats()

      expect(stats.size).toBe(2)
    })
  })

  describe('统计信息', () => {
    it('应该正确统计缓存大小', async () => {
      const cache = new MemoryCacheStorage()

      await cache.set('key1', 'value1', 1000)
      await cache.set('key2', 'value2', 1000)

      const stats = cache.getStats()

      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(100) // 默认值
    })

    it('应该正确计算使用率', async () => {
      const cache = new MemoryCacheStorage({ maxSize: 10 })

      await cache.set('key1', 'value1', 1000)
      await cache.set('key2', 'value2', 1000)

      const stats = cache.getStats()

      expect(stats.usage).toBeCloseTo(0.2, 1) // 2/10 = 0.2
    })

    it('应该返回完整的统计信息', async () => {
      const cache = new MemoryCacheStorage({ maxSize: 5 })

      await cache.set('key1', 'value1', 1000)

      const stats = cache.getStats()

      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('maxSize')
      expect(stats).toHaveProperty('usage')
      expect(stats.size).toBe(1)
      expect(stats.maxSize).toBe(5)
    })
  })
})

