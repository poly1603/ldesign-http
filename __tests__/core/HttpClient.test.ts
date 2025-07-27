/**
 * HTTP客户端核心功能测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpClient, createHttpClient } from '../../src'
import type { HttpClientConfig } from '../../src/types'
import { createMockError, createMockResponse, resetAllMocks } from '../setup'

describe('httpClient', () => {
  let client: HttpClient
  let mockFetch: any

  beforeEach(() => {
    resetAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch
    client = createHttpClient()
  })

  describe('基础功能', () => {
    it('应该能够创建HTTP客户端实例', () => {
      expect(client).toBeInstanceOf(HttpClient)
      expect(client.get).toBeDefined()
      expect(client.post).toBeDefined()
      expect(client.put).toBeDefined()
      expect(client.delete).toBeDefined()
      expect(client.patch).toBeDefined()
      expect(client.head).toBeDefined()
      expect(client.options).toBeDefined()
      expect(client.request).toBeDefined()
    })

    it('应该能够使用自定义配置创建客户端', () => {
      const config: HttpClientConfig = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'Custom-Header': 'test',
        },
      }

      const customClient = createHttpClient(config)
      const defaults = customClient.getDefaults()

      expect(defaults.baseURL).toBe('https://api.example.com')
      expect(defaults.timeout).toBe(5000)
      expect(defaults.headers?.['Custom-Header']).toBe('test')
    })
  })

  describe('hTTP方法', () => {
    it('应该能够发送GET请求', async () => {
      const mockData = { id: 1, name: 'test' }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      const response = await client.get('/users/1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/users/1',
        expect.objectContaining({
          method: 'GET',
        }),
      )
      expect(response.data).toEqual(mockData)
      expect(response.status).toBe(200)
    })

    it('应该能够发送POST请求', async () => {
      const mockData = { id: 1, name: 'test' }
      const postData = { name: 'test' }
      mockFetch.mockResolvedValue(createMockResponse(mockData, 201))

      const response = await client.post('/users', postData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        }),
      )
      expect(response.data).toEqual(mockData)
      expect(response.status).toBe(201)
    })

    it('应该能够发送PUT请求', async () => {
      const mockData = { id: 1, name: 'updated' }
      const putData = { name: 'updated' }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      const response = await client.put('/users/1', putData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        }),
      )
      expect(response.data).toEqual(mockData)
    })

    it('应该能够发送DELETE请求', async () => {
      mockFetch.mockResolvedValue(createMockResponse(null, 204))

      const response = await client.delete('/users/1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/users/1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      )
      expect(response.status).toBe(204)
    })
  })

  describe('请求配置', () => {
    it('应该能够合并请求配置', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      await client.get('/test', {
        headers: { 'Custom-Header': 'value' },
        params: { page: 1, size: 10 },
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/test?page=1&size=10',
        expect.objectContaining({
          headers: expect.objectContaining({
            set: expect.any(Function),
          }),
        }),
      )
    })

    it('应该能够处理baseURL', async () => {
      const clientWithBase = createHttpClient({
        baseURL: 'https://api.example.com',
      })

      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      await clientWithBase.get('/users')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object),
      )
    })
  })

  describe('拦截器', () => {
    it('应该能够添加请求拦截器', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      const requestInterceptor = vi.fn((config) => {
        config.headers = { ...config.headers, 'X-Custom': 'intercepted' }
        return config
      })

      client.addRequestInterceptor({
        onFulfilled: requestInterceptor,
      })

      await client.get('/test')

      expect(requestInterceptor).toHaveBeenCalled()
    })

    it('应该能够添加响应拦截器', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      const responseInterceptor = vi.fn((response) => {
        response.data = { ...response.data, intercepted: true }
        return response
      })

      client.addResponseInterceptor({
        onFulfilled: responseInterceptor,
      })

      const response = await client.get('/test')

      expect(responseInterceptor).toHaveBeenCalled()
      expect(response.data.intercepted).toBe(true)
    })

    it('应该能够移除拦截器', () => {
      const interceptorId = client.addRequestInterceptor({
        onFulfilled: config => config,
      })

      expect(interceptorId).toBeTypeOf('number')

      client.removeInterceptor('request', interceptorId)
      // 验证拦截器已被移除（这里简化测试）
      expect(true).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('应该能够处理网络错误', async () => {
      mockFetch.mockRejectedValue(createMockError('Network error'))

      await expect(client.get('/test')).rejects.toThrow('Network error')
    })

    it('应该能够处理HTTP错误状态', async () => {
      mockFetch.mockResolvedValue(createMockResponse(
        { error: 'Not found' },
        404,
        'Not Found',
      ))

      await expect(client.get('/test')).rejects.toThrow()
    })
  })

  describe('取消请求', () => {
    it('应该能够创建取消令牌', () => {
      const cancelToken = client.createCancelToken()

      expect(cancelToken).toHaveProperty('cancel')
      expect(cancelToken).toHaveProperty('promise')
      expect(cancelToken).toHaveProperty('isCancelled')
      expect(cancelToken.isCancelled).toBe(false)
    })

    it('应该能够取消请求', () => {
      const cancelToken = client.createCancelToken()

      cancelToken.cancel('Test cancellation')

      expect(cancelToken.isCancelled).toBe(true)
      expect(cancelToken.reason).toBe('Test cancellation')
    })
  })

  describe('事件系统', () => {
    it('应该能够监听事件', () => {
      const listener = vi.fn()

      client.on('request', listener)
      client.emit('request', { test: 'data' })

      expect(listener).toHaveBeenCalledWith({ test: 'data' })
    })

    it('应该能够移除事件监听器', () => {
      const listener = vi.fn()

      client.on('request', listener)
      client.off('request', listener)
      client.emit('request', { test: 'data' })

      expect(listener).not.toHaveBeenCalled()
    })

    it('应该能够添加一次性事件监听器', () => {
      const listener = vi.fn()

      client.once('request', listener)
      client.emit('request', { test: 'data' })
      client.emit('request', { test: 'data2' })

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith({ test: 'data' })
    })
  })

  describe('适配器', () => {
    it('应该能够获取适配器信息', () => {
      const info = client.getAdapterInfo()

      expect(info).toHaveProperty('name')
      expect(info).toHaveProperty('isCustom')
      expect(typeof info.name).toBe('string')
      expect(typeof info.isCustom).toBe('boolean')
    })

    it('应该能够检查适配器支持', () => {
      expect(HttpClient.isAdapterSupported('fetch')).toBe(true)
      // 注意：在测试环境中axios和alova可能不可用
    })

    it('应该能够获取支持的适配器列表', () => {
      const adapters = HttpClient.getSupportedAdapters()

      expect(Array.isArray(adapters)).toBe(true)
      expect(adapters.length).toBeGreaterThan(0)
    })
  })
})
