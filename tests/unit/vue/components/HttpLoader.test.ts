import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { HttpLoader } from '../../../../packages/vue/src/components/HttpLoader'
import type { HttpClient } from '../../../../packages/core/src/types'

// 创建模拟 HTTP 客户端
function createMockClient(overrides?: Partial<HttpClient>): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({ data: { items: [1, 2, 3] } }),
    get: vi.fn().mockResolvedValue({ data: { items: [1, 2, 3] } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    head: vi.fn().mockResolvedValue({ data: {} }),
    options: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      error: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    },
    cancelAll: vi.fn(),
    getActiveRequestCount: vi.fn().mockReturnValue(0),
    updateRetryConfig: vi.fn(),
    getConfig: vi.fn().mockReturnValue({}),
    clearCache: vi.fn(),
    getConcurrencyStatus: vi.fn().mockReturnValue({
      activeCount: 0,
      queuedCount: 0,
      maxConcurrent: 10,
      maxQueueSize: 100,
    }),
    cancelQueue: vi.fn(),
    ...overrides,
  } as HttpClient
}

describe('HttpLoader', () => {
  let mockClient: HttpClient

  beforeEach(() => {
    mockClient = createMockClient()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础功能', () => {
    it('应该在加载时显示 loading slot', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/test',
          immediate: true,
        },
        slots: {
          loading: '<div class="loading-state">Loading...</div>',
          default: '<div>Data loaded</div>',
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      // 初始应该显示 loading
      expect(wrapper.find('.loading-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading...')
    })

    it('应该在成功加载后显示数据', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/test',
          immediate: true,
        },
        slots: {
          default: '<div class="data-state">{{ data }}</div>',
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      // 等待请求完成
      await flushPromises()
      await nextTick()

      expect(mockClient.request).toHaveBeenCalledWith({
        url: '/api/test',
        method: 'GET',
      })
      expect(wrapper.find('.data-state').exists()).toBe(true)
    })

    it('应该在错误时显示 error slot', async () => {
      const errorClient = createMockClient({
        request: vi.fn().mockRejectedValue(new Error('Network Error')),
      })

      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/test',
          immediate: true,
        },
        slots: {
          error: '<div class="error-state">Error occurred</div>',
        },
        global: {
          provide: {
            httpClient: errorClient,
          },
        },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Error occurred')
    })

    it('应该在数据为空时显示 empty slot', async () => {
      const emptyClient = createMockClient({
        request: vi.fn().mockResolvedValue({ data: [] }),
      })

      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/test',
          immediate: true,
          isEmpty: (data: any) => Array.isArray(data) && data.length === 0,
        },
        slots: {
          empty: '<div class="empty-state">No data</div>',
        },
        global: {
          provide: {
            httpClient: emptyClient,
          },
        },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No data')
    })
  })

  describe('HTTP 方法', () => {
    it('应该支持 GET 请求', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          method: 'GET',
          immediate: true,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()

      expect(mockClient.request).toHaveBeenCalledWith({
        url: '/api/users',
        method: 'GET',
      })
    })

    it('应该支持 POST 请求', async () => {
      const postData = { name: 'test' }

      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          method: 'POST',
          data: postData,
          immediate: true,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()

      expect(mockClient.request).toHaveBeenCalledWith({
        url: '/api/users',
        method: 'POST',
        data: postData,
      })
    })

    it('应该支持带查询参数的请求', async () => {
      const params = { page: 1, size: 10 }

      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          params,
          immediate: true,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()

      expect(mockClient.request).toHaveBeenCalledWith({
        url: '/api/users',
        method: 'GET',
        params,
      })
    })
  })

  describe('immediate 属性', () => {
    it('immediate=true 时应该立即加载', async () => {
      mount(HttpLoader, {
        props: {
          url: '/api/test',
          immediate: true,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await nextTick()

      expect(mockClient.request).toHaveBeenCalled()
    })

    it('immediate=false 时不应该自动加载', async () => {
      mount(HttpLoader, {
        props: {
          url: '/api/test',
          immediate: false,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await nextTick()

      expect(mockClient.request).not.toHaveBeenCalled()
    })
  })

  describe('响应式参数', () => {
    it('应该在 URL 变化时重新请求', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          immediate: true,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()
      expect(mockClient.request).toHaveBeenCalledTimes(1)

      // 改变 URL
      await wrapper.setProps({ url: '/api/posts' })
      await flushPromises()

      expect(mockClient.request).toHaveBeenCalledTimes(2)
      expect(mockClient.request).toHaveBeenLastCalledWith({
        url: '/api/posts',
        method: 'GET',
      })
    })

    it('应该在 params 变化时重新请求', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          params: { page: 1 },
          immediate: true,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()
      expect(mockClient.request).toHaveBeenCalledTimes(1)

      // 改变 params
      await wrapper.setProps({ params: { page: 2 } })
      await flushPromises()

      expect(mockClient.request).toHaveBeenCalledTimes(2)
      expect(mockClient.request).toHaveBeenLastCalledWith({
        url: '/api/users',
        method: 'GET',
        params: { page: 2 },
      })
    })
  })

  describe('轮询功能', () => {
    it('应该支持轮询请求', async () => {
      vi.useFakeTimers()

      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/status',
          immediate: true,
          pollingInterval: 1000,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()
      expect(mockClient.request).toHaveBeenCalledTimes(1)

      // 前进 1 秒
      vi.advanceTimersByTime(1000)
      await flushPromises()
      expect(mockClient.request).toHaveBeenCalledTimes(2)

      // 前进 1 秒
      vi.advanceTimersByTime(1000)
      await flushPromises()
      expect(mockClient.request).toHaveBeenCalledTimes(3)

      wrapper.unmount()
      vi.useRealTimers()
    })

    it('应该在组件卸载时停止轮询', async () => {
      vi.useFakeTimers()

      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/status',
          immediate: true,
          pollingInterval: 1000,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()
      expect(mockClient.request).toHaveBeenCalledTimes(1)

      // 卸载组件
      wrapper.unmount()

      // 前进时间，不应该再有请求
      vi.advanceTimersByTime(1000)
      await flushPromises()
      expect(mockClient.request).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('缓存功能', () => {
    it('应该支持启用缓存', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          immediate: true,
          cache: true,
          cacheTtl: 5000,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()

      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          cache: true,
          cacheTtl: 5000,
        })
      )
    })
  })

  describe('重试功能', () => {
    it('应该支持重试配置', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          immediate: true,
          retry: {
            retries: 3,
            retryDelay: 1000,
          },
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()

      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          retry: {
            retries: 3,
            retryDelay: 1000,
          },
        })
      )
    })
  })

  describe('数据转换', () => {
    it('应该支持数据转换函数', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          immediate: true,
          transform: (data: any) => data.items.map((item: number) => item * 2),
        },
        slots: {
          default: `
            <template #default="{ data }">
              <div class="transformed-data">{{ data }}</div>
            </template>
          `,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()
      await nextTick()

      // 数据应该被转换为 [2, 4, 6]
      const text = wrapper.text()
      expect(text).toContain('2')
      expect(text).toContain('4')
      expect(text).toContain('6')
    })
  })

  describe('暴露的方法', () => {
    it('应该暴露 refresh 方法', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          immediate: false,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await nextTick()
      expect(mockClient.request).not.toHaveBeenCalled()

      // 调用 refresh 方法
      await (wrapper.vm as any).refresh()
      await flushPromises()

      expect(mockClient.request).toHaveBeenCalledTimes(1)
    })

    it('应该暴露 cancel 方法', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          immediate: true,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      // 调用 cancel 方法（应该不抛出错误）
      expect(() => {
        ;(wrapper.vm as any).cancel()
      }).not.toThrow()
    })
  })

  describe('边界情况', () => {
    it('应该处理没有 httpClient 的情况', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/test',
          immediate: true,
        },
      })

      expect(consoleWarn).toHaveBeenCalled()
      consoleWarn.mockRestore()
    })

    it('应该处理空 URL', () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '',
          immediate: true,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      expect(mockClient.request).not.toHaveBeenCalled()
    })

    it('应该处理网络错误', async () => {
      const errorClient = createMockClient({
        request: vi.fn().mockRejectedValue(new Error('Network Error')),
      })

      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/test',
          immediate: true,
        },
        slots: {
          error: `
            <template #error="{ error }">
              <div class="error-msg">{{ error.message }}</div>
            </template>
          `,
        },
        global: {
          provide: {
            httpClient: errorClient,
          },
        },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.find('.error-msg').text()).toContain('Network Error')
    })
  })

  describe('事件发射', () => {
    it('应该在加载成功时发射 success 事件', async () => {
      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          immediate: true,
        },
        global: {
          provide: {
            httpClient: mockClient,
          },
        },
      })

      await flushPromises()

      const successEvents = wrapper.emitted('success')
      expect(successEvents).toBeTruthy()
      expect(successEvents![0]).toEqual([{ items: [1, 2, 3] }])
    })

    it('应该在加载失败时发射 error 事件', async () => {
      const error = new Error('Network Error')
      const errorClient = createMockClient({
        request: vi.fn().mockRejectedValue(error),
      })

      const wrapper = mount(HttpLoader, {
        props: {
          url: '/api/users',
          immediate: true,
        },
        global: {
          provide: {
            httpClient: errorClient,
          },
        },
      })

      await flushPromises()

      const errorEvents = wrapper.emitted('error')
      expect(errorEvents).toBeTruthy()
      expect(errorEvents![0][0]).toBeInstanceOf(Error)
    })
  })
})