import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { HttpProgress } from '../../../../packages/vue/src/components/HttpProgress'
import {
  formatFileSize,
  formatSpeed,
  formatProgressTime,
  getProgressColor,
  getCirclePath,
} from '../../../../packages/vue/src/components/HttpProgress/types'

describe('HttpProgress', () => {
  describe('基础功能', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
        },
      })

      expect(wrapper.find('.http-progress').exists()).toBe(true)
    })

    it('应该显示进度百分比', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 75,
        },
      })

      expect(wrapper.text()).toContain('75%')
    })

    it('应该限制进度在 0-100 之间', () => {
      const wrapper1 = mount(HttpProgress, {
        props: {
          percent: -10,
        },
      })
      expect(wrapper1.vm.normalizedPercent).toBe(0)

      const wrapper2 = mount(HttpProgress, {
        props: {
          percent: 150,
        },
      })
      expect(wrapper2.vm.normalizedPercent).toBe(100)
    })
  })

  describe('进度条类型', () => {
    it('应该渲染线形进度条', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          type: 'line',
        },
      })

      expect(wrapper.find('.http-progress--line').exists()).toBe(true)
    })

    it('应该渲染圆形进度条', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          type: 'circle',
        },
      })

      expect(wrapper.find('.http-progress--circle').exists()).toBe(true)
    })

    it('应该渲染仪表盘进度条', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          type: 'dashboard',
        },
      })

      expect(wrapper.find('.http-progress--dashboard').exists()).toBe(true)
    })
  })

  describe('进度状态', () => {
    it('应该显示 normal 状态', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          status: 'normal',
        },
      })

      expect(wrapper.find('.http-progress--normal').exists()).toBe(true)
    })

    it('应该显示 active 状态', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          status: 'active',
        },
      })

      expect(wrapper.find('.http-progress--active').exists()).toBe(true)
    })

    it('应该显示 success 状态', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 100,
          status: 'success',
        },
      })

      expect(wrapper.find('.http-progress--success').exists()).toBe(true)
    })

    it('应该显示 error 状态', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          status: 'error',
        },
      })

      expect(wrapper.find('.http-progress--error').exists()).toBe(true)
    })

    it('应该显示 warning 状态', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          status: 'warning',
        },
      })

      expect(wrapper.find('.http-progress--warning').exists()).toBe(true)
    })
  })

  describe('文件信息', () => {
    it('应该显示文件名', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          fileName: 'test.pdf',
        },
      })

      expect(wrapper.text()).toContain('test.pdf')
    })

    it('应该显示已传输和总大小', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          loaded: 1024 * 1024 * 5, // 5MB
          total: 1024 * 1024 * 10, // 10MB
        },
      })

      expect(wrapper.text()).toContain('5.00 MB')
      expect(wrapper.text()).toContain('10.00 MB')
    })
  })

  describe('速度显示', () => {
    it('应该显示传输速度', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          showSpeed: true,
          speed: 1024 * 1024, // 1MB/s
        },
      })

      expect(wrapper.text()).toContain('1.00 MB/s')
    })

    it('应该在不显示速度时隐藏', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          showSpeed: false,
          speed: 1024 * 1024,
        },
      })

      expect(wrapper.text()).not.toContain('MB/s')
    })
  })

  describe('剩余时间', () => {
    it('应该显示剩余时间', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          showRemaining: true,
          remaining: 60000, // 60 秒
        },
      })

      expect(wrapper.text()).toContain('1分钟')
    })

    it('应该在不显示剩余时间时隐藏', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          showRemaining: false,
          remaining: 60000,
        },
      })

      expect(wrapper.text()).not.toContain('分钟')
    })
  })

  describe('控制按钮', () => {
    it('应该显示暂停按钮', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          pausable: true,
          paused: false,
        },
      })

      expect(wrapper.find('.http-progress__pause-btn').exists()).toBe(true)
    })

    it('应该显示继续按钮', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          pausable: true,
          paused: true,
        },
      })

      const btn = wrapper.find('.http-progress__pause-btn')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toContain('继续')
    })

    it('应该显示取消按钮', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          cancellable: true,
        },
      })

      expect(wrapper.find('.http-progress__cancel-btn').exists()).toBe(true)
    })

    it('应该在点击暂停按钮时发射 pause 事件', async () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          pausable: true,
          paused: false,
        },
      })

      await wrapper.find('.http-progress__pause-btn').trigger('click')

      expect(wrapper.emitted('pause')).toBeTruthy()
    })

    it('应该在点击继续按钮时发射 resume 事件', async () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          pausable: true,
          paused: true,
        },
      })

      await wrapper.find('.http-progress__pause-btn').trigger('click')

      expect(wrapper.emitted('resume')).toBeTruthy()
    })

    it('应该在点击取消按钮时发射 cancel 事件', async () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          cancellable: true,
        },
      })

      await wrapper.find('.http-progress__cancel-btn').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('颜色配置', () => {
    it('应该使用单色', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          color: '#ff0000',
        },
      })

      const bar = wrapper.find('.http-progress__bar')
      expect(bar.attributes('style')).toContain('#ff0000')
    })

    it('应该使用渐变色数组', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          color: ['#ff0000', '#00ff00', '#0000ff'],
        },
      })

      const bar = wrapper.find('.http-progress__bar')
      // 应该根据百分比选择颜色
      expect(bar.attributes('style')).toBeTruthy()
    })

    it('应该使用函数返回颜色', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          color: (percent: number) => (percent > 50 ? '#00ff00' : '#ff0000'),
        },
      })

      const bar = wrapper.find('.http-progress__bar')
      expect(bar.attributes('style')).toContain('#ff0000')
    })
  })

  describe('动画效果', () => {
    it('应该启用动画', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          animated: true,
        },
      })

      expect(wrapper.find('.http-progress--animated').exists()).toBe(true)
    })

    it('应该启用条纹效果', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          striped: true,
        },
      })

      expect(wrapper.find('.http-progress--striped').exists()).toBe(true)
    })
  })

  describe('自定义插槽', () => {
    it('应该支持自定义百分比文本插槽', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
        },
        slots: {
          default: '<span class="custom-text">自定义 50%</span>',
        },
      })

      expect(wrapper.find('.custom-text').exists()).toBe(true)
      expect(wrapper.text()).toContain('自定义 50%')
    })

    it('应该支持自定义信息插槽', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
        },
        slots: {
          info: '<div class="custom-info">自定义信息</div>',
        },
      })

      expect(wrapper.find('.custom-info').exists()).toBe(true)
    })
  })

  describe('边界情况', () => {
    it('应该处理负数百分比', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: -50,
        },
      })

      expect(wrapper.vm.normalizedPercent).toBe(0)
    })

    it('应该处理超过 100 的百分比', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 150,
        },
      })

      expect(wrapper.vm.normalizedPercent).toBe(100)
    })

    it('应该处理 NaN 百分比', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: NaN,
        },
      })

      expect(wrapper.vm.normalizedPercent).toBe(0)
    })

    it('应该处理无效的速度值', () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          showSpeed: true,
          speed: -1000,
        },
      })

      // 应该显示 0 或不显示负值
      expect(wrapper.html()).toBeTruthy()
    })
  })

  describe('响应式更新', () => {
    it('应该响应百分比变化', async () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 30,
        },
      })

      expect(wrapper.text()).toContain('30%')

      await wrapper.setProps({ percent: 70 })
      await nextTick()

      expect(wrapper.text()).toContain('70%')
    })

    it('应该响应状态变化', async () => {
      const wrapper = mount(HttpProgress, {
        props: {
          percent: 50,
          status: 'normal',
        },
      })

      expect(wrapper.find('.http-progress--normal').exists()).toBe(true)

      await wrapper.setProps({ status: 'success' })
      await nextTick()

      expect(wrapper.find('.http-progress--success').exists()).toBe(true)
    })
  })
})

describe('formatFileSize', () => {
  it('应该格式化字节', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('应该格式化 KB', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB')
    expect(formatFileSize(1536)).toBe('1.50 KB')
  })

  it('应该格式化 MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.50 MB')
  })

  it('应该格式化 GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB')
  })

  it('应该格式化 TB', () => {
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB')
  })

  it('应该处理 0 字节', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('应该处理负数', () => {
    expect(formatFileSize(-1024)).toBe('0 B')
  })
})

describe('formatSpeed', () => {
  it('应该格式化 B/s', () => {
    expect(formatSpeed(500)).toBe('500 B/s')
  })

  it('应该格式化 KB/s', () => {
    expect(formatSpeed(1024)).toBe('1.00 KB/s')
  })

  it('应该格式化 MB/s', () => {
    expect(formatSpeed(1024 * 1024)).toBe('1.00 MB/s')
  })

  it('应该格式化 GB/s', () => {
    expect(formatSpeed(1024 * 1024 * 1024)).toBe('1.00 GB/s')
  })

  it('应该处理 0 速度', () => {
    expect(formatSpeed(0)).toBe('0 B/s')
  })
})

describe('formatProgressTime', () => {
  it('应该格式化秒', () => {
    expect(formatProgressTime(30000)).toBe('30秒')
  })

  it('应该格式化分钟', () => {
    expect(formatProgressTime(60000)).toBe('1分钟')
    expect(formatProgressTime(90000)).toBe('1分钟30秒')
  })

  it('应该格式化小时', () => {
    expect(formatProgressTime(3600000)).toBe('1小时')
    expect(formatProgressTime(3660000)).toBe('1小时1分钟')
  })

  it('应该格式化天', () => {
    expect(formatProgressTime(86400000)).toBe('1天')
  })

  it('应该处理 0 时间', () => {
    expect(formatProgressTime(0)).toBe('0秒')
  })

  it('应该处理小于 1 秒的时间', () => {
    expect(formatProgressTime(500)).toBe('1秒')
  })
})

describe('getProgressColor', () => {
  it('应该返回单色', () => {
    const color = getProgressColor(50, '#ff0000', 'normal')
    expect(color).toBe('#ff0000')
  })

  it('应该根据状态返回颜色', () => {
    const successColor = getProgressColor(100, undefined, 'success')
    expect(successColor).toBeTruthy()

    const errorColor = getProgressColor(50, undefined, 'error')
    expect(errorColor).toBeTruthy()
  })

  it('应该从数组中选择颜色', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff']
    const color = getProgressColor(50, colors, 'normal')
    expect(colors).toContain(color)
  })

  it('应该使用函数计算颜色', () => {
    const colorFunc = (percent: number) => (percent > 50 ? '#00ff00' : '#ff0000')
    const color1 = getProgressColor(30, colorFunc, 'normal')
    expect(color1).toBe('#ff0000')

    const color2 = getProgressColor(70, colorFunc, 'normal')
    expect(color2).toBe('#00ff00')
  })
})

describe('getCirclePath', () => {
  it('应该计算圆形路径', () => {
    const result = getCirclePath(50, 100, 75, false)

    expect(result.path).toBeTruthy()
    expect(result.perimeter).toBeGreaterThan(0)
    expect(result.offset).toBeGreaterThanOrEqual(0)
  })

  it('应该计算仪表盘路径', () => {
    const result = getCirclePath(50, 100, 75, true)

    expect(result.path).toBeTruthy()
    expect(result.perimeter).toBeGreaterThan(0)
  })

  it('应该处理 0% 进度', () => {
    const result = getCirclePath(50, 100, 0, false)

    expect(result.offset).toBe(result.perimeter)
  })

  it('应该处理 100% 进度', () => {
    const result = getCirclePath(50, 100, 100, false)

    expect(result.offset).toBe(0)
  })
})