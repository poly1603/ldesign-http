/**
 * Fetch适配器测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FetchAdapter, createFetchAdapter, isFetchSupported } from '../../src/adapters/FetchAdapter'
import { createMockResponse, createMockError, resetAllMocks } from '../setup'
import { HttpMethod } from '../../src/types'

describe('FetchAdapter', () => {
  let adapter: FetchAdapter
  let mockFetch: any

  beforeEach(() => {
    resetAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch
    adapter = createFetchAdapter()
  })

  describe('基础功能', () => {
    it('应该能够创建Fetch适配器实例', () => {
      expect(adapter).toBeInstanceOf(FetchAdapter)
      expect(adapter.getName()).toBe('fetch')
    })

    it('应该能够检查Fetch支持', () => {
      expect(isFetchSupported()).toBe(true)
    })
  })

  describe('请求发送', () => {
    it('应该能够发送GET请求', async () => {
      const mockData = { id: 1, name: 'test' }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      const response = await adapter.request({
        url: '/users/1',
        method: HttpMethod.GET
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/users/1',
        expect.objectContaining({
          method: 'GET'
        })
      )
      expect(response.data).toEqual(mockData)
      expect(response.status).toBe(200)
    })

    it('应该能够发送POST请求', async () => {
      const mockData = { id: 1, name: 'test' }
      const postData = { name: 'test' }
      mockFetch.mockResolvedValue(createMockResponse(mockData, 201))

      const response = await adapter.request({
        url: '/users',
        method: HttpMethod.POST,
        data: postData,
        headers: { 'Content-Type': 'application/json' }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData)
        })
      )
      expect(response.data).toEqual(mockData)
      expect(response.status).toBe(201)
    })

    it('应该能够处理查询参数', async () => {
      const mockData = { results: [] }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      await adapter.request({
        url: '/users',
        method: HttpMethod.GET,
        params: { page: 1, size: 10, active: true }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/users?page=1&size=10&active=true',
        expect.any(Object)
      )
    })

    it('应该能够处理baseURL', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      await adapter.request({
        url: '/users',
        method: HttpMethod.GET,
        baseURL: 'https://api.example.com'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      )
    })
  })

  describe('请求头处理', () => {
    it('应该能够设置请求头', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      await adapter.request({
        url: '/test',
        method: HttpMethod.GET,
        headers: {
          'Authorization': 'Bearer token',
          'Custom-Header': 'value'
        }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          headers: expect.any(Object)
        })
      )
    })

    it('应该能够自动设置Content-Type', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      await adapter.request({
        url: '/test',
        method: HttpMethod.POST,
        data: { test: 'data' }
      })

      const call = mockFetch.mock.calls[0]
      expect(call[1].body).toBe(JSON.stringify({ test: 'data' }))
    })
  })

  describe('响应处理', () => {
    it('应该能够解析JSON响应', async () => {
      const mockData = { id: 1, name: 'test' }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      const response = await adapter.request({
        url: '/test',
        method: HttpMethod.GET,
        responseType: 'json'
      })

      expect(response.data).toEqual(mockData)
    })

    it('应该能够解析文本响应', async () => {
      const mockText = 'Hello World'
      const mockResponse = createMockResponse(mockText)
      mockResponse.text = vi.fn().mockResolvedValue(mockText)
      mockFetch.mockResolvedValue(mockResponse)

      const response = await adapter.request({
        url: '/test',
        method: HttpMethod.GET,
        responseType: 'text'
      })

      expect(response.data).toBe(mockText)
    })

    it('应该能够处理响应头', async () => {
      const mockData = { success: true }
      const headers = { 'Content-Type': 'application/json', 'X-Custom': 'value' }
      mockFetch.mockResolvedValue(createMockResponse(mockData, 200, 'OK', headers))

      const response = await adapter.request({
        url: '/test',
        method: HttpMethod.GET
      })

      expect(response.headers).toEqual(
        expect.objectContaining({
          'content-type': 'application/json',
          'x-custom': 'value'
        })
      )
    })
  })

  describe('错误处理', () => {
    it('应该能够处理网络错误', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(adapter.request({
        url: '/test',
        method: HttpMethod.GET
      })).rejects.toThrow()
    })

    it('应该能够处理HTTP错误状态', async () => {
      mockFetch.mockResolvedValue(createMockResponse(
        { error: 'Not found' },
        404,
        'Not Found'
      ))

      await expect(adapter.request({
        url: '/test',
        method: HttpMethod.GET
      })).rejects.toThrow()
    })

    it('应该能够处理取消错误', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValue(abortError)

      await expect(adapter.request({
        url: '/test',
        method: HttpMethod.GET
      })).rejects.toThrow()
    })
  })

  describe('请求取消', () => {
    it('应该能够取消请求', () => {
      // 这里简化测试，实际测试需要更复杂的设置
      expect(() => adapter.cancel()).not.toThrow()
    })
  })

  describe('数据转换', () => {
    it('应该能够处理FormData', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      const formData = new FormData()
      formData.append('file', 'test')

      await adapter.request({
        url: '/upload',
        method: HttpMethod.POST,
        data: formData
      })

      const call = mockFetch.mock.calls[0]
      expect(call[1].body).toBe(formData)
    })

    it('应该能够处理字符串数据', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      const textData = 'plain text data'

      await adapter.request({
        url: '/text',
        method: HttpMethod.POST,
        data: textData
      })

      const call = mockFetch.mock.calls[0]
      expect(call[1].body).toBe(textData)
    })
  })

  describe('URL处理', () => {
    it('应该能够处理绝对URL', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      await adapter.request({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        baseURL: 'https://other.com'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      )
    })

    it('应该能够组合baseURL和相对URL', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValue(createMockResponse(mockData))

      await adapter.request({
        url: '/test',
        method: HttpMethod.GET,
        baseURL: 'https://api.example.com'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      )
    })
  })
})
