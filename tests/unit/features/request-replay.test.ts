/**
 * 请求重放功能测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequestReplayer } from '../../../packages/core/src/features/request-replay'
import type { HttpClient, HttpError } from '../../../packages/core/src/types'

describe('RequestReplayer 请求重放测试', () => {
  let mockClient: HttpClient
  let replayer: RequestReplayer

  beforeEach(() => {
    // 创建模拟的HTTP客户端
    mockClient = {
      request: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    } as any

    replayer = new RequestReplayer(mockClient, {
      maxAttempts: 3,
      delay: 10, // 缩短延迟以加快测试
    })
  })

  describe('基础功能测试', () => {
    it('应该能创建重放器实例', () => {
      expect(replayer).toBeDefined()
      expect(replayer.isEnabled()).toBe(true)
    })

    it('应该能添加请求到队列', async () => {
      const config = { url: '/api/test', method: 'GET' }
      const error: HttpError = {
        name: 'HttpError',
        message: 'Network error',
        isNetworkError: true,
      } as any

      // 不等待结果，只测试入队
      const promise = replayer.enqueue(config, error)

      expect(replayer.getQueueSize()).toBe(1)
    })

    it('应该拒绝非网络错误的请求', async () => {
      const config = { url: '/api/test', method: 'GET' }
      const error: HttpError = {
        name: 'HttpError',
        message: 'HTTP 404',
        status: 404,
        isNetworkError: false,
      } as any

      await expect(replayer.enqueue(config, error)).rejects.toThrow()
    })
  })

  describe('重放功能测试', () => {
    it('应该成功重放请求', async () => {
      const config = { url: '/api/test', method: 'GET' }
      const error: HttpError = {
        name: 'HttpError',
        message: 'Network error',
        isNetworkError: true,
      } as any

      const mockResponse = { data: 'success', status: 200 }
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse as any)

      const promise = replayer.enqueue(config, error)

      // 触发重放
      await replayer.replayAll()

      const result = await promise
      expect(result).toEqual(mockResponse)
      expect(replayer.getQueueSize()).toBe(0)
    })

    it('应该正确处理重放失败', async () => {
      const config = { url: '/api/test', method: 'GET' }
      const error: HttpError = {
        name: 'HttpError',
        message: 'Network error',
        isNetworkError: true,
      } as any

      // 模拟持续失败
      vi.mocked(mockClient.request).mockRejectedValue(new Error('Still failing'))

      const promise = replayer.enqueue(config, error)

      // 触发重放（会失败并重新入队）
      await replayer.replayAll()

      // 第一次重放失败，请求应该重新入队
      expect(replayer.getQueueSize()).toBeGreaterThan(0)
    })

    it('达到最大重试次数应该拒绝请求', async () => {
      const config = { url: '/api/test', method: 'GET' }
      const error: HttpError = {
        name: 'HttpError',
        message: 'Network error',
        isNetworkError: true,
      } as any

      vi.mocked(mockClient.request).mockRejectedValue(new Error('Always failing'))

      const promise = replayer.enqueue(config, error)

      // 重放3次（达到maxAttempts）
      for (let i = 0; i < 3; i++) {
        await replayer.replayAll()
      }

      // 应该最终拒绝
      await expect(promise).rejects.toThrow()
      expect(replayer.getQueueSize()).toBe(0)
    })
  })

  describe('优先级测试', () => {
    it('应该按优先级排序', async () => {
      const error: HttpError = {
        name: 'HttpError',
        message: 'Network error',
        isNetworkError: true,
      } as any

      // 添加不同优先级的请求
      replayer.enqueue({ url: '/low', method: 'GET', priority: 1 }, error)
      replayer.enqueue({ url: '/high', method: 'GET', priority: 10 }, error)
      replayer.enqueue({ url: '/medium', method: 'GET', priority: 5 }, error)

      const callOrder: string[] = []

      vi.mocked(mockClient.request).mockImplementation((config: any) => {
        callOrder.push(config.url)
        return Promise.resolve({ data: 'success' } as any)
      })

      await replayer.replayAll()

      // 应该按优先级执行：high → medium → low
      expect(callOrder).toEqual(['/high', '/medium', '/low'])
    })
  })

  describe('队列管理测试', () => {
    it('应该限制队列大小', async () => {
      const smallReplayer = new RequestReplayer(mockClient, {
        maxQueueSize: 5,
      })

      const error: HttpError = {
        name: 'HttpError',
        message: 'Network error',
        isNetworkError: true,
      } as any

      // 尝试添加6个请求
      const promises = []
      for (let i = 0; i < 6; i++) {
        promises.push(
          smallReplayer.enqueue({ url: `/api/${i}`, method: 'GET' }, error)
            .catch(() => 'queue full'),
        )
      }

      await Promise.all(promises)

      // 队列大小不应超过限制
      expect(smallReplayer.getQueueSize()).toBeLessThanOrEqual(5)
    })

    it('应该能清空队列', async () => {
      const error: HttpError = {
        name: 'HttpError',
        message: 'Network error',
        isNetworkError: true,
      } as any

      for (let i = 0; i < 5; i++) {
        replayer.enqueue({ url: `/api/${i}`, method: 'GET' }, error)
      }

      expect(replayer.getQueueSize()).toBe(5)

      replayer.clearQueue(true)

      expect(replayer.getQueueSize()).toBe(0)
    })
  })

  describe('统计功能测试', () => {
    it('应该正确统计重放结果', async () => {
      const error: HttpError = {
        name: 'HttpError',
        message: 'Network error',
        isNetworkError: true,
      } as any

      // 添加2个请求
      replayer.enqueue({ url: '/api/1', method: 'GET' }, error)
      replayer.enqueue({ url: '/api/2', method: 'GET' }, error)

      // 模拟一个成功一个失败
      let callCount = 0
      vi.mocked(mockClient.request).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({ data: 'success' } as any)
        }
        return Promise.reject(new Error('Failed'))
      })

      await replayer.replayAll()

      const stats = replayer.getStats()
      expect(stats.replayedSuccess).toBe(1)
    })
  })

  describe('启用/禁用测试', () => {
    it('应该支持禁用重放', async () => {
      replayer.disable()

      expect(replayer.isEnabled()).toBe(false)

      const error: HttpError = {
        name: 'HttpError',
        message: 'Network error',
        isNetworkError: true,
      } as any

      // 禁用后应该拒绝入队
      await expect(
        replayer.enqueue({ url: '/api/test', method: 'GET' }, error),
      ).rejects.toThrow()
    })

    it('应该支持重新启用', () => {
      replayer.disable()
      expect(replayer.isEnabled()).toBe(false)

      replayer.enable()
      expect(replayer.isEnabled()).toBe(true)
    })
  })
})

