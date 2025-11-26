import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { HttpProvider } from '../../../../packages/vue/src/components/HttpProvider'
import type { HttpClient } from '../../../../packages/core/src/types'

// 创建模拟 HTTP 客户端
function createMockClient(overrides?: Partial<HttpClient>): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({ data: {} }),
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
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

describe('HttpProvider', () => {
  let mockClient: HttpClient

  beforeEach(() => {
    mockClient = createMockClient()
  })

  describe('基础功能', () => {
    it('应该正确渲染子组件', () => {
      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
        },
        slots: {
          default: '<div class="test-child">Test Content</div>',
        },
      })

      expect(wrapper.html()).toContain('Test Content')
      expect(wrapper.find('.test-child').exists()).toBe(true)
    })

    it('应该提供 HTTP 客户端到子组件', () => {
      const ChildComponent = {
        template: '<div>{{ hasClient ? "Has Client" : "No Client" }}</div>',
        inject: ['httpClient'],
        computed: {
          hasClient() {
            return !!this.httpClient
          },
        },
      }

      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
        },
        slots: {
          default: ChildComponent,
        },
      })

      expect(wrapper.text()).toBe('Has Client')
    })

    it('应该支持不传入 client 属性', () => {
      const wrapper = mount(HttpProvider, {
        slots: {
          default: '<div>Test</div>',
        },
      })

      expect(wrapper.html()).toContain('Test')
    })
  })

  describe('配置管理', () => {
    it('应该正确传递配置对象', () => {
      const config = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'X-Custom-Header': 'test',
        },
      }

      const ChildComponent = {
        template: '<div>{{ configKeys }}</div>',
        inject: ['httpConfig'],
        computed: {
          configKeys() {
            return Object.keys(this.httpConfig || {}).join(',')
          },
        },
      }

      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
          config,
        },
        slots: {
          default: ChildComponent,
        },
      })

      expect(wrapper.text()).toContain('baseURL')
      expect(wrapper.text()).toContain('timeout')
      expect(wrapper.text()).toContain('headers')
    })

    it('应该响应式更新配置', async () => {
      const config = { baseURL: 'https://api.example.com' }

      const ChildComponent = {
        template: '<div>{{ baseURL }}</div>',
        inject: ['httpConfig'],
        computed: {
          baseURL() {
            return this.httpConfig?.baseURL || 'none'
          },
        },
      }

      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
          config,
        },
        slots: {
          default: ChildComponent,
        },
      })

      expect(wrapper.text()).toBe('https://api.example.com')

      // 更新配置
      await wrapper.setProps({
        config: { baseURL: 'https://api2.example.com' },
      })
      await nextTick()

      expect(wrapper.text()).toBe('https://api2.example.com')
    })
  })

  describe('嵌套 Provider', () => {
    it('应该支持嵌套的 Provider（inherit=false）', () => {
      const client1 = createMockClient()
      const client2 = createMockClient()

      const GrandchildComponent = {
        template: '<div>{{ clientId }}</div>',
        inject: ['httpClient'],
        computed: {
          clientId() {
            return this.httpClient === client2 ? 'client2' : 'client1'
          },
        },
      }

      const ChildProvider = {
        template: `
          <HttpProvider :client="client2" :inherit="false">
            <GrandchildComponent />
          </HttpProvider>
        `,
        components: { HttpProvider, GrandchildComponent },
        setup() {
          return { client2 }
        },
      }

      const wrapper = mount(HttpProvider, {
        props: {
          client: client1,
        },
        slots: {
          default: ChildProvider,
        },
        global: {
          components: { HttpProvider },
        },
      })

      expect(wrapper.text()).toBe('client2')
    })

    it('应该支持继承父级配置（inherit=true）', () => {
      const config1 = { baseURL: 'https://api1.example.com' }
      const config2 = { timeout: 5000 }

      const GrandchildComponent = {
        template: '<div>{{ hasBaseURL }}-{{ hasTimeout }}</div>',
        inject: ['httpConfig'],
        computed: {
          hasBaseURL() {
            return !!this.httpConfig?.baseURL
          },
          hasTimeout() {
            return !!this.httpConfig?.timeout
          },
        },
      }

      const ChildProvider = {
        template: `
          <HttpProvider :config="config2" :inherit="true">
            <GrandchildComponent />
          </HttpProvider>
        `,
        components: { HttpProvider, GrandchildComponent },
        setup() {
          return { config2 }
        },
      }

      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
          config: config1,
        },
        slots: {
          default: ChildProvider,
        },
        global: {
          components: { HttpProvider },
        },
      })

      // 应该同时有 baseURL 和 timeout
      expect(wrapper.text()).toBe('true-true')
    })
  })

  describe('DevTools 集成', () => {
    it('应该支持开启 DevTools', () => {
      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
          devtools: true,
        },
        slots: {
          default: '<div>Test</div>',
        },
      })

      expect(wrapper.html()).toContain('Test')
    })

    it('应该支持关闭 DevTools', () => {
      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
          devtools: false,
        },
        slots: {
          default: '<div>Test</div>',
        },
      })

      expect(wrapper.html()).toContain('Test')
    })
  })

  describe('边界情况', () => {
    it('应该处理空的 slots', () => {
      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
        },
      })

      expect(wrapper.html()).toBeTruthy()
    })

    it('应该处理 null 配置', () => {
      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
          config: null as any,
        },
        slots: {
          default: '<div>Test</div>',
        },
      })

      expect(wrapper.html()).toContain('Test')
    })

    it('应该处理 undefined 客户端', () => {
      const wrapper = mount(HttpProvider, {
        props: {
          client: undefined,
        },
        slots: {
          default: '<div>Test</div>',
        },
      })

      expect(wrapper.html()).toContain('Test')
    })
  })

  describe('类型安全', () => {
    it('应该提供正确的 InjectionKey', () => {
      const ChildComponent = {
        template: '<div>{{ clientType }}</div>',
        inject: ['httpClient'],
        computed: {
          clientType() {
            return typeof this.httpClient
          },
        },
      }

      const wrapper = mount(HttpProvider, {
        props: {
          client: mockClient,
        },
        slots: {
          default: ChildComponent,
        },
      })

      expect(wrapper.text()).toBe('object')
    })
  })
})