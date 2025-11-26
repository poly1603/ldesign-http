/**
 * useDownloadManager - 下载管理器
 * 
 * 提供文件下载管理，支持并发控制、断点续传、进度追踪等功能
 */

import { ref, computed, type Ref } from 'vue'
import type { HttpClient } from '@ldesign/http-core'

export interface DownloadTask {
  /** 任务 ID */
  id: string
  /** 下载 URL */
  url: string
  /** 文件名 */
  filename: string
  /** 任务状态 */
  status: 'pending' | 'downloading' | 'success' | 'error' | 'paused' | 'cancelled'
  /** 下载进度 (0-100) */
  progress: number
  /** 已下载字节数 */
  downloadedBytes: number
  /** 文件总大小 */
  totalBytes: number
  /** 下载速度 (bytes/s) */
  speed: number
  /** 预计剩余时间 (秒) */
  remainingTime: number
  /** 错误信息 */
  error?: Error
  /** Blob 数据 */
  blob?: Blob
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

export interface UseDownloadManagerOptions {
  /** HTTP 客户端实例 */
  httpClient: HttpClient
  /** 最大并发数 */
  maxConcurrent?: number
  /** 自动开始下载 */
  autoStart?: boolean
  /** 自动保存文件 */
  autoSave?: boolean
  /** 重试次数 */
  retryCount?: number
  /** 重试延迟 (毫秒) */
  retryDelay?: number
  /** 下载前钩子 */
  beforeDownload?: (task: DownloadTask) => boolean | Promise<boolean>
  /** 下载完成钩子 */
  onComplete?: (task: DownloadTask) => void
  /** 下载失败钩子 */
  onError?: (task: DownloadTask, error: Error) => void
  /** 进度更新钩子 */
  onProgress?: (task: DownloadTask) => void
}

export interface UseDownloadManagerReturn {
  /** 任务列表 */
  tasks: Ref<DownloadTask[]>
  /** 下载中的任务数 */
  downloadingCount: Ref<number>
  /** 总进度 (0-100) */
  totalProgress: Ref<number>
  /** 总下载速度 (bytes/s) */
  totalSpeed: Ref<number>
  /** 是否全部完成 */
  allCompleted: Ref<boolean>
  /** 添加任务 */
  addTask: (url: string, filename?: string, priority?: number) => string
  /** 批量添加任务 */
  addTasks: (urls: string[]) => string[]
  /** 开始下载 */
  start: (taskId?: string) => void
  /** 暂停下载 */
  pause: (taskId?: string) => void
  /** 继续下载 */
  resume: (taskId: string) => void
  /** 取消下载 */
  cancel: (taskId: string) => void
  /** 重试下载 */
  retry: (taskId: string) => void
  /** 移除任务 */
  remove: (taskId: string) => void
  /** 清空队列 */
  clear: () => void
  /** 保存文件 */
  saveFile: (taskId: string) => void
  /** 获取任务 */
  getTask: (taskId: string) => DownloadTask | undefined
}

/**
 * useDownloadManager Hook
 */
export function useDownloadManager(
  options: UseDownloadManagerOptions
): UseDownloadManagerReturn {
  const {
    httpClient,
    maxConcurrent = 3,
    autoStart = true,
    autoSave = true,
    retryCount = 3,
    retryDelay = 1000,
    beforeDownload,
    onComplete,
    onError,
    onProgress,
  } = options

  // 响应式状态
  const tasks = ref<DownloadTask[]>([])

  // 计算属性
  const downloadingCount = computed(() => 
    tasks.value.filter(t => t.status === 'downloading').length
  )

  const totalProgress = computed(() => {
    if (tasks.value.length === 0) return 0
    const total = tasks.value.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(total / tasks.value.length)
  })

  const totalSpeed = computed(() => 
    tasks.value
      .filter(t => t.status === 'downloading')
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
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 从 URL 提取文件名
   */
  function extractFilename(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1)
      return filename || `download_${Date.now()}`
    } catch {
      return `download_${Date.now()}`
    }
  }

  /**
   * 计算下载速度和剩余时间
   */
  function calculateSpeedAndTime(task: DownloadTask, downloadedBytes: number) {
    const now = Date.now()
    const elapsed = (now - (task.startedAt || now)) / 1000 // 秒

    if (elapsed > 0) {
      task.speed = Math.round(downloadedBytes / elapsed)
      const remainingBytes = task.totalBytes - downloadedBytes
      task.remainingTime = task.speed > 0 ? Math.round(remainingBytes / task.speed) : 0
    }
  }

  /**
   * 保存文件到本地
   */
  function saveFile(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task || !task.blob) {
      console.warn('[useDownloadManager] 任务不存在或没有可用的 Blob 数据')
      return
    }

    try {
      const url = URL.createObjectURL(task.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = task.filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[useDownloadManager] 保存文件失败:', error)
    }
  }

  /**
   * 执行下载
   */
  async function executeDownload(task: DownloadTask, retries = 0): Promise<void> {
    try {
      // 检查下载前钩子
      if (beforeDownload) {
        const shouldContinue = await beforeDownload(task)
        if (!shouldContinue) {
          task.status = 'cancelled'
          return
        }
      }

      // 创建 AbortController
      task.abortController = new AbortController()
      task.status = 'downloading'
      task.startedAt = Date.now()

      // 执行下载
      const response = await httpClient.get(task.url, {
        responseType: 'blob',
        signal: task.abortController.signal,
        onDownloadProgress: (progressEvent) => {
          const { loaded, total = 0 } = progressEvent
          
          if (total > 0) {
            task.totalBytes = total
            task.downloadedBytes = loaded
            task.progress = Math.round((loaded / total) * 100)
            
            calculateSpeedAndTime(task, loaded)
            onProgress?.(task)
          }
        },
      } as any)

      // 下载成功
      task.status = 'success'
      task.progress = 100
      task.completedAt = Date.now()
      task.blob = response.data as Blob

      onComplete?.(task)

      // 自动保存文件
      if (autoSave) {
        saveFile(task.id)
      }
      
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
        console.log(`[useDownloadManager] 重试下载 (${retries + 1}/${retryCount}):`, task.filename)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return executeDownload(task, retries + 1)
      }

      // 下载失败
      task.status = 'error'
      task.error = error
      task.completedAt = Date.now()
      
      onError?.(task, error)
      
      // 继续处理队列
      processQueue()
    }
  }

  /**
   * 处理下载队列
   */
  function processQueue() {
    const downloading = tasks.value.filter(t => t.status === 'downloading').length
    
    if (downloading >= maxConcurrent) {
      return
    }

    // 获取待下载任务（按优先级排序）
    const pendingTasks = tasks.value
      .filter(t => t.status === 'pending')
      .sort((a, b) => b.priority - a.priority)

    const availableSlots = maxConcurrent - downloading
    const tasksToStart = pendingTasks.slice(0, availableSlots)

    tasksToStart.forEach(task => {
      executeDownload(task)
    })
  }

  /**
   * 添加任务
   */
  function addTask(url: string, filename?: string, priority = 0): string {
    const task: DownloadTask = {
      id: generateId(),
      url,
      filename: filename || extractFilename(url),
      status: 'pending',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
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
  function addTasks(urls: string[]): string[] {
    return urls.map((url, index) => addTask(url, undefined, -index))
  }

  /**
   * 开始下载
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
   * 暂停下载
   */
  function pause(taskId?: string) {
    const tasksToStop = taskId
      ? tasks.value.filter(t => t.id === taskId)
      : tasks.value.filter(t => t.status === 'downloading')

    tasksToStop.forEach(task => {
      if (task.status === 'downloading') {
        task.abortController?.abort()
        task.status = 'paused'
      }
    })
  }

  /**
   * 继续下载
   */
  function resume(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.status === 'paused') {
      task.status = 'pending'
      processQueue()
    }
  }

  /**
   * 取消下载
   */
  function cancel(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      if (task.status === 'downloading') {
        task.abortController?.abort()
      }
      task.status = 'cancelled'
    }
  }

  /**
   * 重试下载
   */
  function retry(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.status === 'error') {
      task.status = 'pending'
      task.progress = 0
      task.downloadedBytes = 0
      task.speed = 0
      task.remainingTime = 0
      task.error = undefined
      task.blob = undefined
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
      if (task.status === 'downloading') {
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
      if (task.status === 'downloading') {
        task.abortController?.abort()
      }
    })
    tasks.value = []
  }

  /**
   * 获取任务
   */
  function getTask(taskId: string): DownloadTask | undefined {
    return tasks.value.find(t => t.id === taskId)
  }

  return {
    tasks,
    downloadingCount,
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
    saveFile,
    getTask,
  }
}