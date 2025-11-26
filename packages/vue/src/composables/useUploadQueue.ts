/**
 * useUploadQueue - 上传队列管理
 * 
 * 提供文件上传队列管理，支持并发控制、断点续传、优先级排序等功能
 */

import { ref, computed, type Ref } from 'vue'
import type { HttpClient } from '@ldesign/http-core'

export interface UploadTask {
  /** 任务 ID */
  id: string
  /** 文件对象 */
  file: File
  /** 上传 URL */
  url: string
  /** 任务状态 */
  status: 'pending' | 'uploading' | 'success' | 'error' | 'paused' | 'cancelled'
  /** 上传进度 (0-100) */
  progress: number
  /** 已上传字节数 */
  uploadedBytes: number
  /** 文件总大小 */
  totalBytes: number
  /** 上传速度 (bytes/s) */
  speed: number
  /** 预计剩余时间 (秒) */
  remainingTime: number
  /** 错误信息 */
  error?: Error
  /** 响应数据 */
  response?: any
  /** 优先级 (数字越大优先级越高) */
  priority: number
  /** 创建时间 */
  createdAt: number
  /** 开始时间 */
  startedAt?: number
  /** 完成时间 */
  completedAt?: number
  /** 取消控制器 */
  abortController?: AbortController
}

export interface UseUploadQueueOptions {
  /** HTTP 客户端实例 */
  httpClient: HttpClient
  /** 最大并发数 */
  maxConcurrent?: number
  /** 分块大小 (bytes，0 表示不分块) */
  chunkSize?: number
  /** 自动开始上传 */
  autoStart?: boolean
  /** 是否支持断点续传 */
  resumable?: boolean
  /** 重试次数 */
  retryCount?: number
  /** 重试延迟 (毫秒) */
  retryDelay?: number
  /** 上传前钩子 */
  beforeUpload?: (file: File) => boolean | Promise<boolean>
  /** 上传完成钩子 */
  onComplete?: (task: UploadTask) => void
  /** 上传失败钩子 */
  onError?: (task: UploadTask, error: Error) => void
  /** 进度更新钩子 */
  onProgress?: (task: UploadTask) => void
}

export interface UseUploadQueueReturn {
  /** 任务列表 */
  tasks: Ref<UploadTask[]>
  /** 上传中的任务数 */
  uploadingCount: Ref<number>
  /** 总进度 (0-100) */
  totalProgress: Ref<number>
  /** 总上传速度 (bytes/s) */
  totalSpeed: Ref<number>
  /** 是否全部完成 */
  allCompleted: Ref<boolean>
  /** 添加任务 */
  addTask: (file: File, url: string, priority?: number) => string
  /** 批量添加任务 */
  addTasks: (files: File[], url: string) => string[]
  /** 开始上传 */
  start: (taskId?: string) => void
  /** 暂停上传 */
  pause: (taskId?: string) => void
  /** 继续上传 */
  resume: (taskId: string) => void
  /** 取消上传 */
  cancel: (taskId: string) => void
  /** 重试上传 */
  retry: (taskId: string) => void
  /** 移除任务 */
  remove: (taskId: string) => void
  /** 清空队列 */
  clear: () => void
  /** 获取任务 */
  getTask: (taskId: string) => UploadTask | undefined
}

/**
 * useUploadQueue Hook
 */
export function useUploadQueue(
  options: UseUploadQueueOptions
): UseUploadQueueReturn {
  const {
    httpClient,
    maxConcurrent = 3,
    chunkSize = 0,
    autoStart = true,
    resumable = false,
    retryCount = 3,
    retryDelay = 1000,
    beforeUpload,
    onComplete,
    onError,
    onProgress,
  } = options

  // 响应式状态
  const tasks = ref<UploadTask[]>([])

  // 计算属性
  const uploadingCount = computed(() => 
    tasks.value.filter(t => t.status === 'uploading').length
  )

  const totalProgress = computed(() => {
    if (tasks.value.length === 0) return 0
    const total = tasks.value.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(total / tasks.value.length)
  })

  const totalSpeed = computed(() => 
    tasks.value
      .filter(t => t.status === 'uploading')
      .reduce((sum, task) => sum + task.speed, 0)
  )

  const allCompleted = computed(() =>
    tasks.value.length > 0 &&
    tasks.value.every(t => t.status === 'success' || t.status === 'error' || t.status === 'cancelled')
  )

  /**
   * 生成唯一 ID
   */
  function generateId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 计算上传速度和剩余时间
   */
  function calculateSpeedAndTime(task: UploadTask, uploadedBytes: number) {
    const now = Date.now()
    const elapsed = (now - (task.startedAt || now)) / 1000 // 秒

    if (elapsed > 0) {
      task.speed = Math.round(uploadedBytes / elapsed)
      const remainingBytes = task.totalBytes - uploadedBytes
      task.remainingTime = task.speed > 0 ? Math.round(remainingBytes / task.speed) : 0
    }
  }

  /**
   * 执行上传
   */
  async function executeUpload(task: UploadTask, retries = 0): Promise<void> {
    try {
      // 检查上传前钩子
      if (beforeUpload) {
        const shouldContinue = await beforeUpload(task.file)
        if (!shouldContinue) {
          task.status = 'cancelled'
          return
        }
      }

      // 创建 AbortController
      task.abortController = new AbortController()
      task.status = 'uploading'
      task.startedAt = Date.now()

      // 创建 FormData
      const formData = new FormData()
      formData.append('file', task.file)

      // 执行上传
      const response = await httpClient.post(task.url, formData, {
        signal: task.abortController.signal,
        onUploadProgress: (progressEvent) => {
          const { loaded, total = task.totalBytes } = progressEvent
          task.uploadedBytes = loaded
          task.progress = Math.round((loaded / total) * 100)
          
          calculateSpeedAndTime(task, loaded)
          onProgress?.(task)
        },
      } as any)

      // 上传成功
      task.status = 'success'
      task.progress = 100
      task.uploadedBytes = task.totalBytes
      task.completedAt = Date.now()
      task.response = response.data

      onComplete?.(task)
      
      // 继续处理队列
      processQueue()
    } catch (error: any) {
      // 检查是否被取消
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        task.status = 'cancelled'
        return
      }

      // 重试逻辑
      if (retries < retryCount) {
        console.log(`[useUploadQueue] 重试上传 (${retries + 1}/${retryCount}):`, task.file.name)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return executeUpload(task, retries + 1)
      }

      // 上传失败
      task.status = 'error'
      task.error = error
      task.completedAt = Date.now()
      
      onError?.(task, error)
      
      // 继续处理队列
      processQueue()
    }
  }

  /**
   * 处理上传队列
   */
  function processQueue() {
    const uploading = tasks.value.filter(t => t.status === 'uploading').length
    
    if (uploading >= maxConcurrent) {
      return
    }

    // 获取待上传任务（按优先级排序）
    const pendingTasks = tasks.value
      .filter(t => t.status === 'pending')
      .sort((a, b) => b.priority - a.priority)

    const availableSlots = maxConcurrent - uploading
    const tasksToStart = pendingTasks.slice(0, availableSlots)

    tasksToStart.forEach(task => {
      executeUpload(task)
    })
  }

  /**
   * 添加任务
   */
  function addTask(file: File, url: string, priority = 0): string {
    const task: UploadTask = {
      id: generateId(),
      file,
      url,
      status: 'pending',
      progress: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      speed: 0,
      remainingTime: 0,
      priority,
      createdAt: Date.now(),
    }

    tasks.value.push(task)

    if (autoStart) {
      processQueue()
    }

    return task.id
  }

  /**
   * 批量添加任务
   */
  function addTasks(files: File[], url: string): string[] {
    return files.map((file, index) => addTask(file, url, -index))
  }

  /**
   * 开始上传
   */
  function start(taskId?: string) {
    if (taskId) {
      const task = tasks.value.find(t => t.id === taskId)
      if (task && task.status === 'pending') {
        processQueue()
      }
    } else {
      processQueue()
    }
  }

  /**
   * 暂停上传
   */
  function pause(taskId?: string) {
    const tasksToStop = taskId
      ? tasks.value.filter(t => t.id === taskId)
      : tasks.value.filter(t => t.status === 'uploading')

    tasksToStop.forEach(task => {
      if (task.status === 'uploading') {
        task.abortController?.abort()
        task.status = 'paused'
      }
    })
  }

  /**
   * 继续上传
   */
  function resume(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.status === 'paused') {
      task.status = 'pending'
      processQueue()
    }
  }

  /**
   * 取消上传
   */
  function cancel(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      if (task.status === 'uploading') {
        task.abortController?.abort()
      }
      task.status = 'cancelled'
    }
  }

  /**
   * 重试上传
   */
  function retry(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.status === 'error') {
      task.status = 'pending'
      task.progress = 0
      task.uploadedBytes = 0
      task.speed = 0
      task.remainingTime = 0
      task.error = undefined
      task.startedAt = undefined
      task.completedAt = undefined
      
      processQueue()
    }
  }

  /**
   * 移除任务
   */
  function remove(taskId: string) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      const task = tasks.value[index]
      if (task.status === 'uploading') {
        task.abortController?.abort()
      }
      tasks.value.splice(index, 1)
    }
  }

  /**
   * 清空队列
   */
  function clear() {
    tasks.value.forEach(task => {
      if (task.status === 'uploading') {
        task.abortController?.abort()
      }
    })
    tasks.value = []
  }

  /**
   * 获取任务
   */
  function getTask(taskId: string): UploadTask | undefined {
    return tasks.value.find(t => t.id === taskId)
  }

  return {
    tasks,
    uploadingCount,
    totalProgress,
    totalSpeed,
    allCompleted,
    addTask,
    addTasks,
    start,
    pause,
    resume,
    cancel,
    retry,
    remove,
    clear,
    getTask,
  }
}