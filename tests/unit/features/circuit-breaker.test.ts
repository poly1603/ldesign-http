/**
 * 断路器模式测试
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { CircuitBreaker, CircuitState } from '../../../src/features/circuit-breaker'

describe('CircuitBreaker 断路器测试', () => {
  let breaker: CircuitBreaker

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
    })
  })

  describe('状态转换测试', () => {
    it('初始状态应该是CLOSED', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('连续失败应该触发断路（CLOSED → OPEN）', async () => {
      const failingFn = () => Promise.reject(new Error('Failed'))

      // 连续3次失败
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn)
        }
        catch {
          // 忽略错误
        }
      }

      // 应该进入OPEN状态
      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })

    it('OPEN状态应该快速失败', async () => {
      // 先触发断路
      const failingFn = () => Promise.reject(new Error('Failed'))
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn)
        }
        catch {
          // 忽略
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)

      // 后续请求应该立即被拒绝
      await expect(breaker.execute(() => Promise.resolve('success')))
        .rejects.toThrow('Circuit breaker is OPEN')
    })

    it('超时后应该转换到HALF_OPEN', async () => {
      const failingFn = () => Promise.reject(new Error('Failed'))

      // 触发断路
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn)
        }
        catch {
          // 忽略
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)

      // 等待超时时间
      await new Promise(resolve => setTimeout(resolve, 1100))

      // 下一次请求应该触发HALF_OPEN
      const successFn = () => Promise.resolve('success')

      try {
        await breaker.execute(successFn)
      }
      catch {
        // 可能失败
      }

      // 应该进入HALF_OPEN或CLOSED状态
      const state = breaker.getState()
      expect([CircuitState.HALF_OPEN, CircuitState.CLOSED]).toContain(state)
    })

    it('HALF_OPEN状态连续成功应该恢复CLOSED', async () => {
      // 创建配置成功阈值为2的断路器
      const breaker2 = new CircuitBreaker({
        failureThreshold: 2,
        successThreshold: 2,
        timeout: 100,
      })

      // 触发断路
      const failingFn = () => Promise.reject(new Error('Failed'))
      for (let i = 0; i < 2; i++) {
        try {
          await breaker2.execute(failingFn)
        }
        catch {
          // 忽略
        }
      }

      // 等待超时
      await new Promise(resolve => setTimeout(resolve, 150))

      // 连续2次成功
      const successFn = () => Promise.resolve('success')
      await breaker2.execute(successFn)
      await breaker2.execute(successFn)

      // 应该恢复到CLOSED
      expect(breaker2.getState()).toBe(CircuitState.CLOSED)
    })

    it('HALF_OPEN状态失败应该立即回到OPEN', async () => {
      const breaker2 = new CircuitBreaker({
        failureThreshold: 2,
        successThreshold: 2,
        timeout: 100,
      })

      // 触发断路
      for (let i = 0; i < 2; i++) {
        try {
          await breaker2.execute(() => Promise.reject(new Error('Failed')))
        }
        catch {
          // 忽略
        }
      }

      // 等待超时
      await new Promise(resolve => setTimeout(resolve, 150))

      // HALF_OPEN状态下失败
      try {
        await breaker2.execute(() => Promise.reject(new Error('Failed again')))
      }
      catch {
        // 忽略
      }

      // 应该立即回到OPEN
      expect(breaker2.getState()).toBe(CircuitState.OPEN)
    })
  })

  describe('统计功能测试', () => {
    it('应该正确统计请求数', async () => {
      const successFn = () => Promise.resolve('success')
      const failingFn = () => Promise.reject(new Error('Failed'))

      // 5次成功
      for (let i = 0; i < 5; i++) {
        await breaker.execute(successFn)
      }

      // 2次失败
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(failingFn)
        }
        catch {
          // 忽略
        }
      }

      const stats = breaker.getStats()

      expect(stats.totalCalls).toBe(7)
      expect(stats.successCount).toBe(5)
      expect(stats.failureCount).toBe(2)
    })

    it('应该正确统计拒绝次数', async () => {
      // 触发断路
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('Failed')))
        }
        catch {
          // 忽略
        }
      }

      // 尝试更多请求（会被拒绝）
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(() => Promise.resolve('success'))
        }
        catch {
          // 被拒绝
        }
      }

      const stats = breaker.getStats()
      expect(stats.rejectedCount).toBe(5)
    })
  })

  describe('手动控制测试', () => {
    it('应该支持手动打开断路器', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED)

      breaker.open()

      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })

    it('应该支持手动关闭断路器', async () => {
      // 触发断路
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('Failed')))
        }
        catch {
          // 忽略
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)

      // 手动关闭
      breaker.close()

      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('应该支持重置统计', async () => {
      await breaker.execute(() => Promise.resolve('success'))

      let stats = breaker.getStats()
      expect(stats.totalCalls).toBe(1)

      breaker.resetStats()

      stats = breaker.getStats()
      expect(stats.totalCalls).toBe(0)
      expect(stats.successCount).toBe(0)
      expect(stats.failureCount).toBe(0)
    })
  })

  describe('配置测试', () => {
    it('应该使用默认配置', () => {
      const defaultBreaker = new CircuitBreaker()

      // 应该能正常工作
      expect(defaultBreaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('应该支持自定义配置', () => {
      const customBreaker = new CircuitBreaker({
        failureThreshold: 10,
        successThreshold: 5,
        timeout: 30000,
      })

      expect(customBreaker.getState()).toBe(CircuitState.CLOSED)
    })
  })
})

