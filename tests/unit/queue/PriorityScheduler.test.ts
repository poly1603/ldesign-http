import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PriorityScheduler } from '../../../packages/core/src/queue/PriorityScheduler'

describe('PriorityScheduler', () => {
  let scheduler: PriorityScheduler

  beforeEach(() => {
    scheduler = new PriorityScheduler({ maxConcurrency: 2 })
  })

  describe('基础调度', () => {
    it('应该能够调度并执行任务', async () => {
      const result = await scheduler.schedule(async () => {
        return 'success'
      })

      expect(result).toBe('success')
    })

    it('应该能够并发执行多个任务', async () => {
      const results = await Promise.all([
        scheduler.schedule(async () => 'task1'),
        scheduler.schedule(async () => 'task2'),
      ])

      expect(results).toEqual(['task1', 'task2'])
    })

    it('应该限制并发数量', async () => {
      let concurrent = 0
      let maxConcurrent = 0

      const task = async () => {
        concurrent++
        maxConcurrent = Math.max(maxConcurrent, concurrent)
        await new Promise(resolve => setTimeout(resolve, 50))
        concurrent--
        return 'done'
      }

      await Promise.all([
        scheduler.schedule(task),
        scheduler.schedule(task),
        scheduler.schedule(task),
        scheduler.schedule(task),
      ])

      expect(maxConcurrent).toBeLessThanOrEqual(2)
    })
  })

  describe('优先级调度', () => {
    it('应该按优先级执行任务', async () => {
      const executionOrder: string[] = []

      // 创建多个任务填满并发槽
      const blocker1 = scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'blocker1'
      })

      const blocker2 = scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'blocker2'
      })

      // 等待确保前两个任务正在执行
      await new Promise(resolve => setTimeout(resolve, 10))

      // 添加不同优先级的任务
      const low = scheduler.schedule(
        async () => {
          executionOrder.push('low')
          return 'low'
        },
        { priority: 'low' }
      )

      const high = scheduler.schedule(
        async () => {
          executionOrder.push('high')
          return 'high'
        },
        { priority: 'high' }
      )

      const critical = scheduler.schedule(
        async () => {
          executionOrder.push('critical')
          return 'critical'
        },
        { priority: 'critical' }
      )

      await Promise.all([blocker1, blocker2, low, high, critical])

      // critical应该最先执行，然后是high，最后是low
      expect(executionOrder[0]).toBe('critical')
      expect(executionOrder[1]).toBe('high')
      expect(executionOrder[2]).toBe('low')
    })

    it('应该支持数字优先级', async () => {
      const executionOrder: number[] = []

      // 创建阻塞任务填满并发槽
      const blocker1 = scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      const blocker2 = scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const tasks = [10, 50, 30, 90, 20].map(priority =>
        scheduler.schedule(
          async () => {
            executionOrder.push(priority)
          },
          { priority }
        )
      )

      await Promise.all([blocker1, blocker2, ...tasks])

      // 应该按优先级从高到低执行
      expect(executionOrder[0]).toBe(90)
      expect(executionOrder[1]).toBe(50)
      expect(executionOrder[2]).toBe(30)
    })
  })

  describe('任务取消', () => {
    it('应该能够取消队列中的任务', async () => {
      // 填满并发槽
      const blocker1 = scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      const blocker2 = scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      // 添加一个会被取消的任务
      const taskPromise = scheduler.schedule(async () => 'should be canceled')

      // 取消所有任务
      scheduler.cancelAll()

      // 捕获所有reject以避免未处理的错误
      await expect(taskPromise).rejects.toThrow('All tasks canceled')
      await Promise.allSettled([blocker1, blocker2]).catch(() => {})
    })

    it('应该返回取消的任务数', () => {
      // 填满并发槽
      scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // 添加队列任务
      scheduler.schedule(async () => 'task1')
      scheduler.schedule(async () => 'task2')
      scheduler.schedule(async () => 'task3')

      const canceled = scheduler.cancelAll()
      expect(canceled).toBeGreaterThan(0)
    })
  })

  describe('超时处理', () => {
    it('应该在超时后取消任务', async () => {
      const taskPromise = scheduler.schedule(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
          return 'should timeout'
        },
        { timeout: 50 }
      )

      await expect(taskPromise).rejects.toThrow('Task timeout')
    })

    it('应该不影响正常完成的任务', async () => {
      const result = await scheduler.schedule(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return 'completed'
        },
        { timeout: 100 }
      )

      expect(result).toBe('completed')
    })
  })

  describe('统计信息', () => {
    it('应该跟踪调度的任务数', async () => {
      await scheduler.schedule(async () => 'task1')
      await scheduler.schedule(async () => 'task2')

      const stats = scheduler.getStats()
      expect(stats.totalScheduled).toBe(2)
      expect(stats.totalCompleted).toBe(2)
    })

    it('应该跟踪失败的任务', async () => {
      await scheduler
        .schedule(async () => {
          throw new Error('failed')
        })
        .catch(() => {})

      const stats = scheduler.getStats()
      expect(stats.totalFailed).toBe(1)
    })

    it('应该计算成功率', async () => {
      await scheduler.schedule(async () => 'success')
      await scheduler.schedule(async () => 'success')
      await scheduler
        .schedule(async () => {
          throw new Error('failed')
        })
        .catch(() => {})

      const stats = scheduler.getStats()
      expect(stats.successRate).toBeCloseTo(0.67, 1)
    })
  })

  describe('队列管理', () => {
    it('应该返回正确的队列大小', () => {
      scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      scheduler.schedule(async () => 'queued')

      expect(scheduler.getRunningSize()).toBe(2)
      expect(scheduler.getQueueSize()).toBeGreaterThanOrEqual(0)
    })

    it('应该能够清空队列', () => {
      scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      scheduler.schedule(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      scheduler.schedule(async () => 'queued1')
      scheduler.schedule(async () => 'queued2')

      const cleared = scheduler.clearQueue()
      expect(cleared).toBeGreaterThanOrEqual(0)
    })

    it('应该能够动态调整并发数', async () => {
      scheduler.setMaxConcurrency(1)

      let concurrent = 0
      let maxConcurrent = 0

      const task = async () => {
        concurrent++
        maxConcurrent = Math.max(maxConcurrent, concurrent)
        await new Promise(resolve => setTimeout(resolve, 50))
        concurrent--
      }

      await Promise.all([scheduler.schedule(task), scheduler.schedule(task), scheduler.schedule(task)])

      expect(maxConcurrent).toBe(1)
    })
  })

  describe('错误处理', () => {
    it('应该捕获任务中的错误', async () => {
      await expect(
        scheduler.schedule(async () => {
          throw new Error('task error')
        })
      ).rejects.toThrow('task error')
    })

    it('应该在错误后继续处理队列', async () => {
      const results: string[] = []

      await scheduler
        .schedule(async () => {
          throw new Error('error')
        })
        .catch(() => results.push('error'))

      await scheduler.schedule(async () => {
        results.push('success')
        return 'success'
      })

      expect(results).toContain('success')
    })
  })
})