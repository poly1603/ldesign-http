import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { HttpError } from '../../../../packages/vue/src/components/HttpError'
import { getErrorTypeConfig } from '../../../../packages/vue/src/components/HttpError/types'

describe('HttpError', () => {
  describe('基础功能', () => {
    it('应该正确渲染错误信息', () => {
      const error = new Error('Test error message')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.text()).toContain('Test error message')
    })

    it('应该显示默认错误图标', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.find('.http-error__icon').exists()).toBe(true)
    })

    it('应该显示错误标题', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          title: '自定义错误标题',
        },
      })

      expect(wrapper.text()).toContain('自定义错误标题')
    })
  })

  describe('错误类型识别', () => {
    it('应该识别网络错误', () => {
      const error = new Error('Network Error')
      error.name = 'NetworkError'
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.text()).toContain('网络错误')
    })

    it('应该识别超时错误', () => {
      const error = new Error('Timeout')
      error.name = 'TimeoutError'
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.text()).toContain('请求超时')
    })

    it('应该识别 401 未授权错误', () => {
      const error: any = new Error('Unauthorized')
      error.statusCode = 401
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.text()).toContain('未授权')
    })

    it('应该识别 403 禁止访问错误', () => {
      const error: any = new Error('Forbidden')
      error.statusCode = 403
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.text()).toContain('禁止访问')
    })

    it('应该识别 404 资源不存在错误', () => {
      const error: any = new Error('Not Found')
      error.statusCode = 404
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.text()).toContain('资源不存在')
    })

    it('应该识别 5xx 服务器错误', () => {
      const error: any = new Error('Internal Server Error')
      error.statusCode = 500
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.text()).toContain('服务器错误')
    })

    it('应该识别取消请求错误', () => {
      const error: any = new Error('Request canceled')
      error.code = 'CANCELED'
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.text()).toContain('请求已取消')
    })
  })

  describe('重试功能', () => {
    it('应该显示重试按钮', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showRetry: true,
        },
      })

      expect(wrapper.find('.http-error__retry-btn').exists()).toBe(true)
    })

    it('应该在点击重试按钮时发射 retry 事件', async () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showRetry: true,
        },
      })

      await wrapper.find('.http-error__retry-btn').trigger('click')

      expect(wrapper.emitted('retry')).toBeTruthy()
      expect(wrapper.emitted('retry')![0]).toEqual([])
    })

    it('应该显示重试次数', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          retryCount: 3,
        },
      })

      expect(wrapper.text()).toContain('重试次数')
      expect(wrapper.text()).toContain('3')
    })

    it('应该禁用处于加载状态的重试按钮', async () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showRetry: true,
          retrying: true,
        },
      })

      const retryBtn = wrapper.find('.http-error__retry-btn')
      expect(retryBtn.attributes('disabled')).toBeDefined()
    })
  })

  describe('错误详情', () => {
    it('应该支持显示错误详情', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showDetails: true,
        },
      })

      expect(wrapper.find('.http-error__details').exists()).toBe(true)
    })

    it('应该支持折叠/展开错误详情', async () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showDetails: true,
        },
      })

      // 初始应该是折叠状态
      expect(wrapper.vm.isExpanded).toBe(false)

      // 点击展开按钮
      const toggleBtn = wrapper.find('.http-error__details-toggle')
      await toggleBtn.trigger('click')
      await nextTick()

      expect(wrapper.vm.isExpanded).toBe(true)
    })

    it('应该显示错误堆栈', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n  at test.js:1:1'
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showDetails: true,
          showStack: true,
        },
      })

      // 展开详情
      ;(wrapper.vm as any).isExpanded = true
      nextTick()

      expect(wrapper.html()).toContain('test.js')
    })

    it('应该显示错误代码', () => {
      const error: any = new Error('Test error')
      error.code = 'ERR_NETWORK'
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showDetails: true,
        },
      })

      ;(wrapper.vm as any).isExpanded = true
      nextTick()

      expect(wrapper.html()).toContain('ERR_NETWORK')
    })
  })

  describe('联系支持', () => {
    it('应该显示联系支持按钮', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showContact: true,
          contactText: '联系客服',
        },
      })

      expect(wrapper.find('.http-error__contact-btn').exists()).toBe(true)
      expect(wrapper.text()).toContain('联系客服')
    })

    it('应该在点击联系支持时发射 contact 事件', async () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showContact: true,
        },
      })

      await wrapper.find('.http-error__contact-btn').trigger('click')

      expect(wrapper.emitted('contact')).toBeTruthy()
    })
  })

  describe('自定义样式', () => {
    it('应该应用自定义样式', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          style: { backgroundColor: 'red' },
        },
      })

      const errorElement = wrapper.find('.http-error')
      expect(errorElement.attributes('style')).toContain('background-color')
    })

    it('应该应用自定义类名', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          class: 'custom-error-class',
        },
      })

      expect(wrapper.classes()).toContain('custom-error-class')
    })
  })

  describe('自定义插槽', () => {
    it('应该支持自定义图标插槽', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
        slots: {
          icon: '<div class="custom-icon">🚨</div>',
        },
      })

      expect(wrapper.find('.custom-icon').exists()).toBe(true)
      expect(wrapper.text()).toContain('🚨')
    })

    it('应该支持自定义操作按钮插槽', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
        slots: {
          actions: '<button class="custom-action">自定义操作</button>',
        },
      })

      expect(wrapper.find('.custom-action').exists()).toBe(true)
      expect(wrapper.text()).toContain('自定义操作')
    })

    it('应该支持自定义详情插槽', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showDetails: true,
        },
        slots: {
          details: '<div class="custom-details">自定义详情内容</div>',
        },
      })

      ;(wrapper.vm as any).isExpanded = true
      nextTick()

      expect(wrapper.html()).toContain('自定义详情内容')
    })
  })

  describe('边界情况', () => {
    it('应该处理 null 错误', () => {
      const wrapper = mount(HttpError, {
        props: {
          error: null,
        },
      })

      expect(wrapper.text()).toContain('未知错误')
    })

    it('应该处理 undefined 错误', () => {
      const wrapper = mount(HttpError, {
        props: {
          error: undefined,
        },
      })

      expect(wrapper.text()).toContain('未知错误')
    })

    it('应该处理字符串错误', () => {
      const wrapper = mount(HttpError, {
        props: {
          error: 'String error message' as any,
        },
      })

      expect(wrapper.text()).toContain('String error message')
    })

    it('应该处理没有 message 属性的对象', () => {
      const wrapper = mount(HttpError, {
        props: {
          error: { foo: 'bar' } as any,
        },
      })

      expect(wrapper.find('.http-error').exists()).toBe(true)
    })
  })

  describe('可访问性', () => {
    it('应该有正确的 ARIA 标签', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
        },
      })

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })

    it('重试按钮应该有正确的 aria-label', () => {
      const error = new Error('Test error')
      
      const wrapper = mount(HttpError, {
        props: {
          error,
          showRetry: true,
        },
      })

      const retryBtn = wrapper.find('.http-error__retry-btn')
      expect(retryBtn.attributes('aria-label')).toBeTruthy()
    })
  })
})

describe('getErrorTypeConfig', () => {
  it('应该返回网络错误配置', () => {
    const error = new Error('Network Error')
    error.name = 'NetworkError'
    
    const config = getErrorTypeConfig(error)
    
    expect(config.title).toBe('网络错误')
    expect(config.icon).toBe('🌐')
  })

  it('应该返回超时错误配置', () => {
    const error = new Error('Timeout')
    error.name = 'TimeoutError'
    
    const config = getErrorTypeConfig(error)
    
    expect(config.title).toBe('请求超时')
    expect(config.icon).toBe('⏱️')
  })

  it('应该返回 401 错误配置', () => {
    const error: any = new Error('Unauthorized')
    error.statusCode = 401
    
    const config = getErrorTypeConfig(error)
    
    expect(config.title).toBe('未授权')
  })

  it('应该返回 403 错误配置', () => {
    const error: any = new Error('Forbidden')
    error.statusCode = 403
    
    const config = getErrorTypeConfig(error)
    
    expect(config.title).toBe('禁止访问')
  })

  it('应该返回 404 错误配置', () => {
    const error: any = new Error('Not Found')
    error.statusCode = 404
    
    const config = getErrorTypeConfig(error)
    
    expect(config.title).toBe('资源不存在')
  })

  it('应该返回服务器错误配置', () => {
    const error: any = new Error('Internal Server Error')
    error.statusCode = 500
    
    const config = getErrorTypeConfig(error)
    
    expect(config.title).toBe('服务器错误')
  })

  it('应该返回取消请求配置', () => {
    const error: any = new Error('Request canceled')
    error.code = 'CANCELED'
    
    const config = getErrorTypeConfig(error)
    
    expect(config.title).toBe('请求已取消')
  })

  it('应该返回默认错误配置', () => {
    const error = new Error('Unknown error')
    
    const config = getErrorTypeConfig(error)
    
    expect(config.title).toBe('请求失败')
    expect(config.icon).toBe('❌')
  })

  it('应该处理 null 错误', () => {
    const config = getErrorTypeConfig(null)
    
    expect(config.title).toBe('请求失败')
  })
})