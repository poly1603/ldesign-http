import { ref, reactive, computed } from 'vue'

interface ErrorConfig {
  showToast?: boolean
  showModal?: boolean
  logToConsole?: boolean
  reportToService?: boolean
  autoRetry?: boolean
  retryCount?: number
  retryDelay?: number
  customHandler?: (error: any) => void
}

interface ErrorLog {
  id: string
  timestamp: number
  error: any
  context?: string
  userAgent?: string
  url?: string
  handled: boolean
  retryCount: number
}

interface ErrorStats {
  totalErrors: number
  networkErrors: number
  timeoutErrors: number
  httpErrors: number
  unknownErrors: number
  resolvedErrors: number
  retryAttempts: number
}

// 全局错误配置
const globalErrorConfig = reactive<ErrorConfig>({
  showToast: true,
  showModal: false,
  logToConsole: true,
  reportToService: false,
  autoRetry: false,
  retryCount: 3,
  retryDelay: 1000
})

// 错误日志存储
const errorLogs = ref<ErrorLog[]>([])
const maxLogSize = 1000

// 错误统计
const errorStats = reactive<ErrorStats>({
  totalErrors: 0,
  networkErrors: 0,
  timeoutErrors: 0,
  httpErrors: 0,
  unknownErrors: 0,
  resolvedErrors: 0,
  retryAttempts: 0
})

export function useErrorHandler(config?: Partial<ErrorConfig>) {
  // 合并配置
  const errorConfig = reactive({ ...globalErrorConfig, ...config })
  
  // 当前错误状态
  const currentError = ref<any>(null)
  const showErrorToast = ref(false)
  const showErrorModal = ref(false)
  const lastError = ref<any>(null)
  
  // 计算属性
  const hasErrors = computed(() => errorLogs.value.length > 0)
  const recentErrors = computed(() => 
    errorLogs.value
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
  )
  
  const errorRate = computed(() => {
    const total = errorStats.totalErrors
    const resolved = errorStats.resolvedErrors
    return total > 0 ? ((total - resolved) / total) * 100 : 0
  })
  
  // 生成错误ID
  const generateErrorId = (): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // 分类错误类型
  const categorizeError = (error: any): string => {
    if (error.isNetworkError) return 'network'
    if (error.isTimeoutError) return 'timeout'
    if (error.isCancelError) return 'cancel'
    if (error.status) return 'http'
    return 'unknown'
  }
  
  // 记录错误
  const logError = (error: any, context?: string): string => {
    const errorId = generateErrorId()
    const errorLog: ErrorLog = {
      id: errorId,
      timestamp: Date.now(),
      error: {
        message: error.message,
        status: error.status,
        stack: error.stack,
        isNetworkError: error.isNetworkError,
        isTimeoutError: error.isTimeoutError,
        isCancelError: error.isCancelError,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : undefined
      },
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      handled: false,
      retryCount: 0
    }
    
    // 添加到日志
    errorLogs.value.unshift(errorLog)
    
    // 限制日志大小
    if (errorLogs.value.length > maxLogSize) {
      errorLogs.value = errorLogs.value.slice(0, maxLogSize)
    }
    
    // 更新统计
    errorStats.totalErrors++
    const errorType = categorizeError(error)
    switch (errorType) {
      case 'network':
        errorStats.networkErrors++
        break
      case 'timeout':
        errorStats.timeoutErrors++
        break
      case 'http':
        errorStats.httpErrors++
        break
      default:
        errorStats.unknownErrors++
    }
    
    return errorId
  }
  
  // 处理错误
  const handleError = async (error: any, context?: string): Promise<void> => {
    const errorId = logError(error, context)
    
    // 设置当前错误
    currentError.value = error
    lastError.value = error
    
    // 控制台日志
    if (errorConfig.logToConsole) {
      console.group(`🚨 HTTP Error [${errorId}]`)
      console.error('Error:', error)
      if (context) console.info('Context:', context)
      console.info('Timestamp:', new Date().toISOString())
      console.groupEnd()
    }
    
    // 显示Toast通知
    if (errorConfig.showToast) {
      showErrorToast.value = true
    }
    
    // 显示Modal弹窗
    if (errorConfig.showModal) {
      showErrorModal.value = true
    }
    
    // 自动重试
    if (errorConfig.autoRetry && shouldRetry(error)) {
      await attemptRetry(errorId, error)
    }
    
    // 上报错误服务
    if (errorConfig.reportToService) {
      await reportError(errorId, error, context)
    }
    
    // 自定义处理器
    if (errorConfig.customHandler) {
      try {
        errorConfig.customHandler(error)
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError)
      }
    }
    
    // 标记为已处理
    const errorLog = errorLogs.value.find(log => log.id === errorId)
    if (errorLog) {
      errorLog.handled = true
    }
  }
  
  // 判断是否应该重试
  const shouldRetry = (error: any): boolean => {
    // 不重试客户端错误
    if (error.status >= 400 && error.status < 500) {
      return false
    }
    
    // 重试网络错误、超时错误和服务器错误
    return error.isNetworkError || 
           error.isTimeoutError || 
           (error.status >= 500)
  }
  
  // 尝试重试
  const attemptRetry = async (errorId: string, error: any): Promise<void> => {
    const errorLog = errorLogs.value.find(log => log.id === errorId)
    if (!errorLog) return
    
    const maxRetries = errorConfig.retryCount || 3
    if (errorLog.retryCount >= maxRetries) return
    
    errorLog.retryCount++
    errorStats.retryAttempts++
    
    // 计算延迟时间（指数退避）
    const delay = (errorConfig.retryDelay || 1000) * Math.pow(2, errorLog.retryCount - 1)
    
    console.info(`🔄 Retrying request (${errorLog.retryCount}/${maxRetries}) in ${delay}ms...`)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // 这里应该重新发送原始请求，但由于这是演示代码，我们只是模拟
    console.info('🔄 Retry attempt completed')
  }
  
  // 上报错误到服务
  const reportError = async (errorId: string, error: any, context?: string): Promise<void> => {
    try {
      // 模拟错误上报
      const errorReport = {
        id: errorId,
        timestamp: Date.now(),
        message: error.message,
        status: error.status,
        url: error.request?.url,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        context,
        stack: error.stack
      }
      
      console.info('📊 Error reported to service:', errorReport)
      
      // 实际项目中这里会发送到错误监控服务
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // })
    } catch (reportError) {
      console.error('Failed to report error:', reportError)
    }
  }
  
  // 解决错误
  const resolveError = (errorId: string): boolean => {
    const errorLog = errorLogs.value.find(log => log.id === errorId)
    if (!errorLog) return false
    
    errorStats.resolvedErrors++
    
    // 从日志中移除或标记为已解决
    const index = errorLogs.value.indexOf(errorLog)
    if (index !== -1) {
      errorLogs.value.splice(index, 1)
    }
    
    return true
  }
  
  // 清除所有错误
  const clearErrors = (): void => {
    errorLogs.value = []
    currentError.value = null
    lastError.value = null
    showErrorToast.value = false
    showErrorModal.value = false
    
    // 重置统计（保留总数）
    errorStats.resolvedErrors = errorStats.totalErrors
  }
  
  // 获取错误详情
  const getErrorDetails = (errorId: string): ErrorLog | null => {
    return errorLogs.value.find(log => log.id === errorId) || null
  }
  
  // 导出错误日志
  const exportErrorLogs = (format: 'json' | 'csv' = 'json'): string => {
    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Message', 'Status', 'Type', 'URL', 'Handled', 'Retry Count']
      const rows = errorLogs.value.map(log => [
        log.id,
        new Date(log.timestamp).toISOString(),
        log.error.message,
        log.error.status || '',
        categorizeError(log.error),
        log.url || '',
        log.handled.toString(),
        log.retryCount.toString()
      ])
      
      return [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')
    }
    
    return JSON.stringify(errorLogs.value, null, 2)
  }
  
  // 创建错误边界
  const createErrorBoundary = (fallback?: () => void) => {
    return {
      onError: (error: any, context?: string) => {
        handleError(error, context)
        if (fallback) fallback()
      }
    }
  }
  
  // 包装异步函数以自动处理错误
  const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: string
  ): T => {
    return (async (...args: any[]) => {
      try {
        return await fn(...args)
      } catch (error) {
        await handleError(error, context)
        throw error
      }
    }) as T
  }
  
  // 更新配置
  const updateConfig = (newConfig: Partial<ErrorConfig>): void => {
    Object.assign(errorConfig, newConfig)
  }
  
  // 关闭错误提示
  const closeErrorToast = (): void => {
    showErrorToast.value = false
  }
  
  const closeErrorModal = (): void => {
    showErrorModal.value = false
  }
  
  return {
    // 响应式数据
    currentError: computed(() => currentError.value),
    lastError: computed(() => lastError.value),
    showErrorToast: computed(() => showErrorToast.value),
    showErrorModal: computed(() => showErrorModal.value),
    errorLogs: computed(() => errorLogs.value),
    errorStats: computed(() => ({ ...errorStats })),
    errorConfig: computed(() => ({ ...errorConfig })),
    
    // 计算属性
    hasErrors,
    recentErrors,
    errorRate,
    
    // 方法
    handleError,
    resolveError,
    clearErrors,
    getErrorDetails,
    exportErrorLogs,
    createErrorBoundary,
    withErrorHandling,
    updateConfig,
    closeErrorToast,
    closeErrorModal
  }
}

// 全局错误处理器
export const globalErrorHandler = useErrorHandler()

// 设置全局错误配置
export const setGlobalErrorConfig = (config: Partial<ErrorConfig>): void => {
  Object.assign(globalErrorConfig, config)
}

// 全局未捕获错误处理
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    globalErrorHandler.handleError(event.error, 'Global Error')
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    globalErrorHandler.handleError(event.reason, 'Unhandled Promise Rejection')
  })
}
