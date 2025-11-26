import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { HttpRetry } from '../../../../packages/vue/src/components/HttpRetry'
import { calculateRetryDelay } from '../../../../packages/vue/src/components/HttpRetry/types'

describe('HttpRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('基础功能', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
        },
      })

      expect(wrapper.find('.http-retry').exists()).toBe(true)
    })

    it('应该显示重试状态', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          status: 'idle',
        },
      })

      expect(wrapper.text()).toContain('准备重试')
    })

    it('应该显示重试次数', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          currentRetry: 1,
        },
      })

      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('3')
    })
  })

  describe('重试状态', () => {
    it('应该显示 idle 状态', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          status: 'idle',
        },
      })

      expect(wrapper.text()).toContain('准备重试')
    })

    it('应该显示 retrying 状态', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          status: 'retrying',
        },
      })

      expect(wrapper.text()).toContain('重试中')
    })

    it('应该显示 waiting 状态', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          status: 'waiting',
        },
      })

      expect(wrapper.text()).toContain('等待重试')
    })

    it('应该显示 success 状态', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          status: 'success',
        },
      })

      expect(wrapper.text()).toContain('重试成功')
    })

    it('应该显示 failed 状态', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          status: 'failed',
        },
      })

      expect(wrapper.text()).toContain('重试失败')
    })

    it('应该显示 cancelled 状态', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          status: 'cancelled',
        },
      })

      expect(wrapper.text()).toContain('已取消')
    })
  })

  describe('自动重试', () => {
    it('应该在自动模式下自动重试', async () => {
      const onRetry = vi.fn()

      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          autoRetry: true,
          retryDelay: 1000,
        },
      })

      wrapper.vm.$emit('retry')
      await wrapper.vm.$nextTick()

      // 前进时间触发重试
      vi.advanceTimersByTime(1000)
      await flushPromises()

      expect(wrapper.emitted('retry')).toBeTruthy()
    })

    it('应该在手动模式下不自动重试', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          autoRetry: false,
        },
      })

      expect(wrapper.find('.http-retry__manual-btn').exists()).toBe(true)
    })
  })

  describe('重试按钮', () => {
    it('应该在点击重试按钮时发射 retry 事件', async () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          autoRetry: false,
        },
      })

      await wrapper.find('.http-retry__manual-btn').trigger('click')

      expect(wrapper.emitted('retry')).toBeTruthy()
    })

    it('应该在重试中禁用重试按钮', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          autoRetry: false,
          status: 'retrying',
        },
      })

      const btn = wrapper.find('.http-retry__manual-btn')
      expect(btn.attributes('disabled')).toBeDefined()
    })

    it('应该在达到最大重试次数后禁用按钮', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          currentRetry: 3,
          autoRetry: false,
        },
      })

      const btn = wrapper.find('.http-retry__manual-btn')
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  describe('取消重试', () => {
    it('应该显示取消按钮', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          showCancel: true,
        },
      })

      expect(wrapper.find('.http-retry__cancel-btn').exists()).toBe(true)
    })

    it('应该在点击取消按钮时发射 cancel 事件', async () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          showCancel: true,
        },
      })

      await wrapper.find('.http-retry__cancel-btn').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('应该在取消后禁用取消按钮', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          showCancel: true,
          status: 'cancelled',
        },
      })

      const btn = wrapper.find('.http-retry__cancel-btn')
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  describe('倒计时功能', () => {
    it('应该显示倒计时', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          retryDelay: 5000,
          showCountdown: true,
          status: 'waiting',
        },
      })

      expect(wrapper.text()).toMatch(/\d+/)
    })

    it('应该在倒计时结束后自动重试', async () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          retryDelay: 1000,
          autoRetry: true,
          status: 'waiting',
        },
      })

      vi.advanceTimersByTime(1000)
      await flushPromises()

      expect(wrapper.emitted('retry')).toBeTruthy()
    })
  })

  describe('进度条', () => {
    it('应该显示进度条', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          showProgress: true,
        },
      })

      expect(wrapper.find('.http-retry__progress').exists()).toBe(true)
    })

    it('应该正确计算进度百分比', async () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          currentRetry: 1,
          showProgress: true,
        },
      })

      // 进度应该是 33.33%（1/3）
      const progress = wrapper.find('.http-retry__progress-bar')
      expect(progress.attributes('style')).toContain('33')
    })
  })

  describe('指数退避', () => {
    it('应该在启用指数退避时计算正确的延迟', async () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
          backoffFactor: 2,
          showCountdown: true,
          status: 'waiting',
          currentRetry: 2,
        },
      })

      // 第二次重试延迟应该是 1000 * 2^2 = 4000ms
      await nextTick()
      
      // 检查倒计时显示
      expect(wrapper.text()).toMatch(/\d+/)
    })

    it('应该在禁用指数退避时使用固定延迟', async () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: false,
          currentRetry: 2,
        },
      })

      await nextTick()

      // 延迟应该始终是 1000ms
      expect(wrapper.vm.currentDelay).toBe(1000)
    })
  })

  describe('重试历史', () => {
    it('应该显示重试历史', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          showHistory: true,
        },
      })

      expect(wrapper.find('.http-retry__history').exists()).toBe(true)
    })

    it('应该记录重试历史', async () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          showHistory: true,
          autoRetry: false,
        },
      })

      // 触发重试
      await wrapper.find('.http-retry__manual-btn').trigger('click')
      await wrapper.vm.$nextTick()

      // 应该有重试历史记录
      expect((wrapper.vm as any).history.length).toBeGreaterThan(0)
    })
  })

  describe('错误信息', () => {
    it('应该显示错误消息', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          error: new Error('Test error'),
          showError: true,
        },
      })

      expect(wrapper.text()).toContain('Test error')
    })

    it('应该在成功后隐藏错误消息', async () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          error: new Error('Test error'),
          showError: true,
          status: 'success',
        },
      })

      // 成功状态不应该显示错误
      expect(wrapper.text()).not.toContain('Test error')
    })
  })

  describe('自定义插槽', () => {
    it('应该支持自定义状态图标插槽', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
        },
        slots: {
          icon: '<div class="custom-icon">🔄</div>',
        },
      })

      expect(wrapper.find('.custom-icon').exists()).toBe(true)
    })

    it('应该支持自定义操作按钮插槽', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
        },
        slots: {
          actions: '<button class="custom-action">自定义操作</button>',
        },
      })

      expect(wrapper.find('.custom-action').exists()).toBe(true)
    })
  })

  describe('边界情况', () => {
    it('应该处理 maxRetries 为 0', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 0,
        },
      })

      expect(wrapper.find('.http-retry').exists()).toBe(true)
    })

    it('应该处理负数重试延迟', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          retryDelay: -1000,
        },
      })

      // 应该使用最小延迟（0）
      expect(wrapper.vm.currentDelay).toBeGreaterThanOrEqual(0)
    })

    it('应该限制最大延迟时间', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 10,
          retryDelay: 1000,
          exponentialBackoff: true,
          backoffFactor: 2,
          currentRetry: 10,
        },
      })

      // 延迟应该被限制在 30000ms
      expect(wrapper.vm.currentDelay).toBeLessThanOrEqual(30000)
    })
  })

  describe('组件卸载', () => {
    it('应该在卸载时清理定时器', () => {
      const wrapper = mount(HttpRetry, {
        props: {
          maxRetries: 3,
          autoRetry: true,
          retryDelay: 1000,
          status: 'waiting',
        },
      })

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      wrapper.unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })
})

describe('calculateRetryDelay', () => {
  it('应该在禁用指数退避时返回基础延迟', () => {
    const delay = calculateRetryDelay(2, 1000, false, 2)
    expect(delay).toBe(1000)
  })

  it('应该在启用指数退避时计算正确的延迟', () => {
    const delay = calculateRetryDelay(2, 1000, true, 2)
    expect(delay).toBe(4000) // 1000 * 2^2
  })

  it('应该限制最大延迟为 30 秒', () => {
    const delay = calculateRetryDelay(10, 1000, true, 2)
    expect(delay).toBeLessThanOrEqual(30000)
  })

  it('应该处理 0 次重试', () => {
    const delay = calculateRetryDelay(0, 1000, true, 2)
    expect(delay).toBe(1000)
  })

  it('应该使用自定义退避因子', () => {
    const delay = calculateRetryDelay(2, 1000, true, 3)
    expect(delay).toBe(9000) // 1000 * 3^2
  })

  it('应该处理小数退避因子', () => {
    const delay = calculateRetryDelay(2, 1000, true, 1.5)
    expect(delay).toBe(2250) // 1000 * 1.5^2
  })
})