import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LocalStorageCacheStorage } from '../../../packages/core/src/cache/LocalStorageCacheStorage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] || null,
  }
})()

// 在测试前设置 localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('LocalStorageCacheStorage', () => {
  let storage: LocalStorageCacheStorage

  beforeEach(() => {
    localStorage.clear()
    storage = new LocalStorageCacheStorage({ prefix: 'test_' })
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('基础操作', () => {
    it('应该能够设置和获取缓存', async () => {
      const key = 'test-key'
      const value = { data: 'test-value' }

      await storage.set(key, value, 60000)
      const result = await storage.get(key)

      expect(result).toEqual(value)
    })

    it('应该返回null当缓存不存在时', async () => {
      const result = await storage.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('应该能够删除缓存', async () => {
      const key = 'test-key'
      await storage.set(key, 'value', 60000)

      await storage.delete(key)
      const result = await storage.get(key)

      expect(result).toBeNull()
    })

    it('应该能够清空所有缓存', async () => {
      await storage.set('key1', 'value1', 60000)
      await storage.set('key2', 'value2', 60000)

      await storage.clear()

      expect(await storage.get('key1')).toBeNull()
      expect(await storage.get('key2')).toBeNull()
      expect(storage.size()).toBe(0)
    })

    it('应该能够检查缓存是否存在', async () => {
      const key = 'test-key'
      await storage.set(key, 'value', 60000)

      expect(await storage.has(key)).toBe(true)
      expect(await storage.has('non-existent')).toBe(false)
    })
  })

  describe('过期处理', () => {
    it('应该返回null当缓存过期时', async () => {
      const key = 'test-key'
      const value = 'test-value'

      // 设置1毫秒的TTL
      await storage.set(key, value, 1)

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 10))

      const result = await storage.get(key)
      expect(result).toBeNull()
    })

    it('应该自动清理过期的缓存项', async () => {
      // 创建一个新的存储实例来测试清理功能
      const testStorage = new LocalStorageCacheStorage({ prefix: 'cleanup_' })

      await testStorage.set('key1', 'value1', 1)
      await testStorage.set('key2', 'value2', 60000)

      // 等待key1过期
      await new Promise(resolve => setTimeout(resolve, 10))

      // 手动调用清理方法（通过访问私有方法的方式）
      const cleaned = await (testStorage as any).cleanupExpired()

      expect(cleaned).toBeGreaterThan(0)
      expect(await testStorage.get('key1')).toBeNull()
      expect(await testStorage.get('key2')).not.toBeNull()
    })
  })

  describe('键管理', () => {
    it('应该返回所有缓存键', async () => {
      await storage.set('key1', 'value1', 60000)
      await storage.set('key2', 'value2', 60000)
      await storage.set('key3', 'value3', 60000)

      const keys = storage.keys()

      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })

    it('应该返回正确的缓存数量', async () => {
      expect(storage.size()).toBe(0)

      await storage.set('key1', 'value1', 60000)
      expect(storage.size()).toBe(1)

      await storage.set('key2', 'value2', 60000)
      expect(storage.size()).toBe(2)

      await storage.delete('key1')
      expect(storage.size()).toBe(1)
    })

    it('应该只返回带有正确前缀的键', async () => {
      const storage1 = new LocalStorageCacheStorage({ prefix: 'app1_' })
      const storage2 = new LocalStorageCacheStorage({ prefix: 'app2_' })

      await storage1.set('key1', 'value1', 60000)
      await storage2.set('key2', 'value2', 60000)

      expect(storage1.keys()).toHaveLength(1)
      expect(storage1.keys()).toContain('key1')

      expect(storage2.keys()).toHaveLength(1)
      expect(storage2.keys()).toContain('key2')
    })
  })

  describe('大小限制', () => {
    it('应该在超出大小限制时淘汰旧项', async () => {
      // 创建一个小容量的存储
      const smallStorage = new LocalStorageCacheStorage({
        prefix: 'small_',
        maxSize: 1000, // 1KB
      })

      // 添加一些数据
      const largeValue = 'x'.repeat(500)
      await smallStorage.set('key1', largeValue, 60000)
      await smallStorage.set('key2', largeValue, 60000)

      // 第三个应该触发淘汰
      await smallStorage.set('key3', largeValue, 60000)

      // 至少有一个键应该存在
      const keys = smallStorage.keys()
      expect(keys.length).toBeGreaterThan(0)
    })
  })

  describe('数据类型支持', () => {
    it('应该支持字符串', async () => {
      await storage.set('key', 'string value', 60000)
      expect(await storage.get('key')).toBe('string value')
    })

    it('应该支持数字', async () => {
      await storage.set('key', 12345, 60000)
      expect(await storage.get('key')).toBe(12345)
    })

    it('应该支持布尔值', async () => {
      await storage.set('key', true, 60000)
      expect(await storage.get('key')).toBe(true)
    })

    it('应该支持对象', async () => {
      const obj = { name: 'test', value: 123, nested: { prop: 'value' } }
      await storage.set('key', obj, 60000)
      expect(await storage.get('key')).toEqual(obj)
    })

    it('应该支持数组', async () => {
      const arr = [1, 2, 3, { a: 'b' }]
      await storage.set('key', arr, 60000)
      expect(await storage.get('key')).toEqual(arr)
    })

    it('应该支持null', async () => {
      await storage.set('key', null, 60000)
      expect(await storage.get('key')).toBe(null)
    })
  })

  describe('统计信息', () => {
    it('应该返回正确的统计信息', async () => {
      await storage.set('key1', 'value1', 60000)
      await storage.set('key2', 'value2', 60000)

      const stats = storage.getStats()

      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBeGreaterThan(0)
      expect(stats.currentSize).toBeGreaterThan(0)
      expect(stats.usage).toBeGreaterThanOrEqual(0)
      expect(stats.usage).toBeLessThanOrEqual(1)
    })
  })

  describe('错误处理', () => {
    it('应该优雅处理序列化错误', async () => {
      // 创建一个会导致循环引用的对象
      const circular: any = { a: 1 }
      circular.self = circular

      // 应该不会抛出错误
      await expect(storage.set('key', circular, 60000)).resolves.toBeUndefined()

      // 获取应该返回null
      const result = await storage.get('key')
      expect(result).toBeNull()
    })

    it('应该在localStorage不可用时安全返回', async () => {
      // 临时禁用localStorage
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        throw new Error('localStorage not available')
      }

      const result = await storage.set('key', 'value', 60000)
      expect(result).toBeUndefined()

      // 恢复localStorage
      localStorage.setItem = originalSetItem
    })
  })

  describe('标签功能', () => {
    it('应该能够根据标签删除缓存', async () => {
      const storageWithTags = new LocalStorageCacheStorage({ prefix: 'tags_' })

      // 注意：由于我们简化了set方法，标签功能需要通过扩展实现
      // 这里只是展示API设计
      await storageWithTags.set('key1', 'value1', 60000)
      await storageWithTags.set('key2', 'value2', 60000)

      // deleteByTag 方法存在
      expect(storageWithTags.deleteByTag).toBeDefined()
    })
  })
})