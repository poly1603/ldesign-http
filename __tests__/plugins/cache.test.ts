/**
 * 缓存插件测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CacheManager,
  LocalStorageCacheStorage,
  MemoryCacheStorage,
  createCachePlugin,
} from '../../src/plugins/cache'
import { createHttpClient } from '../../src/core/HttpClientImpl'
import { createMockResponse, delay, resetAllMocks } from '../setup'
import { HttpMethod } from '../../src/types'

describe('缓存插件', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('memoryCacheStorage', () => {
    let storage: MemoryCacheStorage

    beforeEach(() => {
      storage = new MemoryCacheStorage()
    })

    it('应该能够存储和获取数据', async () => {
      const testData = { id: 1, name: 'test' }

      await storage.set('test-key', testData)
      const result = await storage.get('test-key')

      expect(result).toEqual(testData)
    })

    it('应该能够处理过期数据', async () => {
      const testData = { id: 1, name: 'test' }

      await storage.set('test-key', testData, 10) // 10ms TTL
      await delay(20) // 等待过期

      const result = await storage.get('test-key')
      expect(result).toBeNull()
    })

    it('应该能够删除数据', async () => {
      const testData = { id: 1, name: 'test' }

      await storage.set('test-key', testData)
      await storage.delete('test-key')

      const result = await storage.get('test-key')
      expect(result).toBeNull()
    })

    it('应该能够清空所有数据', async () => {
      await storage.set('key1', 'value1')
      await storage.set('key2', 'value2')

      await storage.clear()

      expect(await storage.get('key1')).toBeNull()
      expect(await storage.get('key2')).toBeNull()
    })

    it('应该能够获取缓存大小', async () => {
      expect(storage.size()).toBe(0)

      await storage.set('key1', 'value1')
      await storage.set('key2', 'value2')

      expect(storage.size()).toBe(2)
    })

    it('应该能够清理过期缓存', async () => {
      await storage.set('key1', 'value1', 10) // 10ms TTL
      await storage.set('key2', 'value2', 1000) // 1s TTL

      await delay(20) // 等待第一个过期
      storage.cleanup()

      expect(storage.size()).toBe(1)
      expect(await storage.get('key2')).toBe('value2')
    })
  })

  describe('localStorageCacheStorage', () => {
    let storage: LocalStorageCacheStorage
    let mockLocalStorage: any

    beforeEach(() => {
      mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      }
      global.localStorage = mockLocalStorage
      storage = new LocalStorageCacheStorage('test_')
    })

    it('应该能够存储数据到localStorage', async () => {
      const testData = { id: 1, name: 'test' }

      await storage.set('test-key', testData, 1000)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test_test-key',
        expect.stringContaining('"value":{"id":1,"name":"test"}'),
      )
    })

    it('应该能够从localStorage获取数据', async () => {
      const testData = { id: 1, name: 'test' }
      const expiry = Date.now() + 1000
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ value: testData, expiry }),
      )

      const result = await storage.get('test-key')

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test_test-key')
      expect(result).toEqual(testData)
    })

    it('应该能够处理过期数据', async () => {
      const testData = { id: 1, name: 'test' }
      const expiry = Date.now() - 1000 // 已过期
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ value: testData, expiry }),
      )

      const result = await storage.get('test-key')

      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_test-key')
    })
  })

  describe('cacheManager', () => {
    let cacheManager: CacheManager

    beforeEach(() => {
      cacheManager = new CacheManager({
        enabled: true,
        ttl: 1000,
      })
    })

    it('应该能够生成缓存键', async () => {
      const config1 = { url: '/users', method: HttpMethod.GET }
      const config2 = { url: '/users', method: HttpMethod.GET, params: { page: 1 } }

      // 通过设置和获取来间接测试键生成
      const mockResponse = { data: 'test', status: 200, statusText: 'OK', headers: {}, config: config1 }

      await cacheManager.set(config1, mockResponse as any)
      const result1 = await cacheManager.get(config1)

      await cacheManager.set(config2, mockResponse as any)
      const result2 = await cacheManager.get(config2)

      expect(result1).toBeTruthy()
      expect(result2).toBeTruthy()
      // 不同的配置应该生成不同的缓存键
      expect(result1).not.toBe(result2)
    })

    it('应该能够更新配置', () => {
      const newConfig = { enabled: false, ttl: 2000 }

      cacheManager.updateConfig(newConfig)
      const config = cacheManager.getConfig()

      expect(config.enabled).toBe(false)
      expect(config.ttl).toBe(2000)
    })

    it('应该在禁用时不缓存', async () => {
      cacheManager.updateConfig({ enabled: false })

      const config = { url: '/test', method: HttpMethod.GET }
      const mockResponse = { data: 'test', status: 200, statusText: 'OK', headers: {}, config }

      await cacheManager.set(config, mockResponse as any)
      const result = await cacheManager.get(config)

      expect(result).toBeNull()
    })
  })

  describe('缓存插件集成', () => {
    let client: any
    let mockFetch: any

    beforeEach(() => {
      mockFetch = vi.fn()
      global.fetch = mockFetch
      client = createHttpClient()

      const cachePlugin = createCachePlugin({
        enabled: true,
        ttl: 1000,
      })
      cachePlugin.install(client)
    })

    it('应该能够缓存GET请求', async () => {
      const mockData = { id: 1, name: 'test' }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      // 第一次请求
      const response1 = await client.get('/users/1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(response1.data).toEqual(mockData)

      // 第二次请求应该从缓存返回
      const response2 = await client.get('/users/1')
      expect(mockFetch).toHaveBeenCalledTimes(1) // 仍然是1次，说明使用了缓存
      expect(response2.data).toEqual(mockData)
    })

    it('应该不缓存非GET请求', async () => {
      const mockData = { id: 1, name: 'test' }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      // POST请求
      await client.post('/users', { name: 'test' })
      await client.post('/users', { name: 'test' })

      expect(mockFetch).toHaveBeenCalledTimes(2) // 两次都发送了请求
    })

    it('应该能够清空缓存', async () => {
      const mockData = { id: 1, name: 'test' }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      // 发送请求并缓存
      await client.get('/users/1')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // 清空缓存
      await client.cache.clear()

      // 再次请求应该重新发送
      await client.get('/users/1')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('应该能够删除特定缓存', async () => {
      const mockData = { id: 1, name: 'test' }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      // 发送请求并缓存
      await client.get('/users/1')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // 删除特定缓存
      await client.cache.delete({ url: '/users/1', method: 'GET' })

      // 再次请求应该重新发送
      await client.get('/users/1')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
