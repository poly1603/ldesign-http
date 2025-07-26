import { ref, reactive } from 'vue'

// 模拟 HTTP 客户端
interface HttpResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: any
}

interface HttpError extends Error {
  status?: number
  response?: HttpResponse
  request?: any
  isNetworkError?: boolean
  isTimeoutError?: boolean
  isCancelError?: boolean
}

interface RequestConfig {
  method: string
  url: string
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
  withCredentials?: boolean
  responseType?: string
}

interface RequestOptions {
  enableCache?: boolean
  enableRetry?: boolean
  retryCount?: number
  retryDelay?: number
}

// 请求状态
interface RequestState {
  id: string
  config: RequestConfig
  status: 'pending' | 'success' | 'error' | 'cancelled'
  startTime: number
  endTime?: number
  response?: HttpResponse
  error?: HttpError
  retryCount: number
  cacheHit: boolean
}

// 全局状态
const requestStates = reactive<Map<string, RequestState>>(new Map())
const networkStatus = ref<'online' | 'offline'>('online')
const globalStats = reactive({
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  cacheHits: 0,
  retryAttempts: 0
})

// 简单的缓存实现
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// 模拟网络状态监听
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    networkStatus.value = 'online'
  })
  
  window.addEventListener('offline', () => {
    networkStatus.value = 'offline'
  })
  
  networkStatus.value = navigator.onLine ? 'online' : 'offline'
}

export function useHttpClient() {
  const loading = ref(false)
  const activeRequests = ref<Set<string>>(new Set())

  // 生成请求ID
  const generateRequestId = (): string => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 生成缓存键
  const generateCacheKey = (config: RequestConfig): string => {
    const { method, url, params, data } = config
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
  }

  // 检查缓存
  const checkCache = (cacheKey: string): any | null => {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    if (cached) {
      cache.delete(cacheKey)
    }
    return null
  }

  // 设置缓存
  const setCache = (cacheKey: string, data: any, ttl = 5 * 60 * 1000): void => {
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  // 模拟网络请求
  const simulateRequest = async (config: RequestConfig): Promise<HttpResponse> => {
    // 检查网络状态
    if (networkStatus.value === 'offline') {
      throw createError('网络连接不可用', 0, true)
    }

    // 构建完整URL
    let fullUrl = config.url
    if (config.params && Object.keys(config.params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
      }
    }

    // 构建请求选项
    const fetchOptions: RequestInit = {
      method: config.method.toUpperCase(),
      headers: {},
      signal: AbortSignal.timeout(config.timeout || 10000)
    }

    // 添加请求头
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          (fetchOptions.headers as Record<string, string>)[key] = String(value)
        }
      })
    }

    // 添加请求体
    if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method.toUpperCase())) {
      if (config.data instanceof FormData) {
        fetchOptions.body = config.data
      } else if (typeof config.data === 'string') {
        fetchOptions.body = config.data
      } else {
        fetchOptions.body = JSON.stringify(config.data)
        if (!(fetchOptions.headers as Record<string, string>)['Content-Type']) {
          (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json'
        }
      }
    }

    try {
      const response = await fetch(fullUrl, fetchOptions)
      
      // 解析响应数据
      let responseData: any
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else if (config.responseType === 'blob') {
        responseData = await response.blob()
      } else if (config.responseType === 'arraybuffer') {
        responseData = await response.arrayBuffer()
      } else {
        responseData = await response.text()
      }

      // 构建响应对象
      const httpResponse: HttpResponse = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config
      }

      // 检查响应状态
      if (!response.ok) {
        throw createError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          false,
          httpResponse
        )
      }

      return httpResponse
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw createError('请求超时', 0, false, undefined, true)
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw createError('网络连接失败', 0, true)
      }
      
      throw error
    }
  }

  // 创建错误对象
  const createError = (
    message: string,
    status?: number,
    isNetworkError = false,
    response?: HttpResponse,
    isTimeoutError = false
  ): HttpError => {
    const error = new Error(message) as HttpError
    error.status = status
    error.response = response
    error.isNetworkError = isNetworkError
    error.isTimeoutError = isTimeoutError
    return error
  }

  // 重试逻辑
  const retryRequest = async (
    config: RequestConfig,
    options: RequestOptions,
    attempt = 1
  ): Promise<HttpResponse> => {
    try {
      return await simulateRequest(config)
    } catch (error: any) {
      const maxRetries = options.retryCount || 3
      const shouldRetry = attempt < maxRetries && (
        error.isNetworkError ||
        error.isTimeoutError ||
        (error.status && error.status >= 500)
      )

      if (shouldRetry) {
        globalStats.retryAttempts++
        
        // 指数退避延迟
        const delay = (options.retryDelay || 1000) * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return retryRequest(config, options, attempt + 1)
      }
      
      throw error
    }
  }

  // 发送HTTP请求
  const sendHttpRequest = async (
    config: RequestConfig,
    options: RequestOptions = {}
  ): Promise<HttpResponse> => {
    const requestId = generateRequestId()
    const cacheKey = generateCacheKey(config)
    
    // 创建请求状态
    const requestState: RequestState = {
      id: requestId,
      config,
      status: 'pending',
      startTime: Date.now(),
      retryCount: 0,
      cacheHit: false
    }
    
    requestStates.set(requestId, requestState)
    activeRequests.value.add(requestId)
    loading.value = true
    globalStats.totalRequests++

    try {
      // 检查缓存
      if (options.enableCache && config.method.toUpperCase() === 'GET') {
        const cachedData = checkCache(cacheKey)
        if (cachedData) {
          requestState.status = 'success'
          requestState.response = cachedData
          requestState.cacheHit = true
          requestState.endTime = Date.now()
          globalStats.successRequests++
          globalStats.cacheHits++
          return cachedData
        }
      }

      // 发送请求
      let response: HttpResponse
      if (options.enableRetry) {
        response = await retryRequest(config, options)
      } else {
        response = await simulateRequest(config)
      }

      // 更新请求状态
      requestState.status = 'success'
      requestState.response = response
      requestState.endTime = Date.now()
      globalStats.successRequests++

      // 设置缓存
      if (options.enableCache && config.method.toUpperCase() === 'GET') {
        setCache(cacheKey, response)
      }

      return response
    } catch (error: any) {
      // 更新请求状态
      requestState.status = 'error'
      requestState.error = error
      requestState.endTime = Date.now()
      globalStats.errorRequests++
      
      throw error
    } finally {
      activeRequests.value.delete(requestId)
      if (activeRequests.value.size === 0) {
        loading.value = false
      }
    }
  }

  // 取消所有请求
  const cancelAllRequests = () => {
    activeRequests.value.forEach(requestId => {
      const state = requestStates.get(requestId)
      if (state && state.status === 'pending') {
        state.status = 'cancelled'
        state.endTime = Date.now()
      }
    })
    activeRequests.value.clear()
    loading.value = false
  }

  // 获取请求统计
  const getRequestStats = () => {
    return {
      ...globalStats,
      activeRequests: activeRequests.value.size,
      networkStatus: networkStatus.value,
      cacheSize: cache.size
    }
  }

  // 获取请求历史
  const getRequestHistory = () => {
    return Array.from(requestStates.values())
      .sort((a, b) => b.startTime - a.startTime)
  }

  // 清除缓存
  const clearCache = () => {
    cache.clear()
  }

  // 清除请求历史
  const clearRequestHistory = () => {
    requestStates.clear()
  }

  // 模拟客户端对象
  const client = {
    get: (url: string, config?: Partial<RequestConfig>) => 
      sendHttpRequest({ method: 'GET', url, ...config }),
    
    post: (url: string, data?: any, config?: Partial<RequestConfig>) => 
      sendHttpRequest({ method: 'POST', url, data, ...config }),
    
    put: (url: string, data?: any, config?: Partial<RequestConfig>) => 
      sendHttpRequest({ method: 'PUT', url, data, ...config }),
    
    delete: (url: string, config?: Partial<RequestConfig>) => 
      sendHttpRequest({ method: 'DELETE', url, ...config }),
    
    patch: (url: string, data?: any, config?: Partial<RequestConfig>) => 
      sendHttpRequest({ method: 'PATCH', url, data, ...config }),
    
    head: (url: string, config?: Partial<RequestConfig>) => 
      sendHttpRequest({ method: 'HEAD', url, ...config }),
    
    options: (url: string, config?: Partial<RequestConfig>) => 
      sendHttpRequest({ method: 'OPTIONS', url, ...config }),

    request: (config: RequestConfig) => sendHttpRequest(config)
  }

  return {
    client,
    loading,
    activeRequests,
    networkStatus,
    sendHttpRequest,
    cancelAllRequests,
    getRequestStats,
    getRequestHistory,
    clearCache,
    clearRequestHistory
  }
}
