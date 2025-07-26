/**
 * 拦截器插件
 * 提供常用的请求和响应拦截器
 */

import type {
  RequestInterceptor,
  ResponseInterceptor,
  HttpClientInstance,
  HttpPlugin,
  RequestConfig,
  HttpResponse,
  HttpError
} from '../types'

/**
 * 认证拦截器配置
 */
export interface AuthInterceptorConfig {
  /** 获取token的函数 */
  getToken: () => string | Promise<string>
  /** token类型 */
  tokenType?: 'Bearer' | 'Basic' | string
  /** 自定义header名称 */
  headerName?: string
  /** token刷新函数 */
  refreshToken?: () => Promise<string>
  /** 需要认证的URL模式 */
  urlPatterns?: RegExp[]
}

/**
 * 日志拦截器配置
 */
export interface LogInterceptorConfig {
  /** 是否启用请求日志 */
  logRequests?: boolean
  /** 是否启用响应日志 */
  logResponses?: boolean
  /** 是否启用错误日志 */
  logErrors?: boolean
  /** 自定义日志函数 */
  logger?: {
    info: (message: string, data?: any) => void
    error: (message: string, data?: any) => void
    warn: (message: string, data?: any) => void
  }
}

/**
 * 创建认证拦截器
 */
export function createAuthInterceptor(config: AuthInterceptorConfig): RequestInterceptor {
  const {
    getToken,
    tokenType = 'Bearer',
    headerName = 'Authorization',
    urlPatterns = []
  } = config

  return {
    onFulfilled: async (requestConfig: RequestConfig) => {
      // 检查是否需要认证
      if (urlPatterns.length > 0) {
        const needsAuth = urlPatterns.some(pattern => pattern.test(requestConfig.url))
        if (!needsAuth) {
          return requestConfig
        }
      }

      try {
        const token = await getToken()
        if (token) {
          requestConfig.headers = {
            ...requestConfig.headers,
            [headerName]: `${tokenType} ${token}`
          }
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error)
      }

      return requestConfig
    }
  }
}

/**
 * 创建token刷新拦截器
 */
export function createTokenRefreshInterceptor(config: AuthInterceptorConfig): ResponseInterceptor {
  const { refreshToken, getToken, tokenType = 'Bearer', headerName = 'Authorization' } = config

  return {
    onRejected: async (error: HttpError) => {
      const originalRequest = error.config

      // 检查是否是401错误且有刷新token的方法
      if (error.response?.status === 401 && refreshToken && originalRequest) {
        try {
          // 刷新token
          const newToken = await refreshToken()
          
          // 更新请求头
          originalRequest.headers = {
            ...originalRequest.headers,
            [headerName]: `${tokenType} ${newToken}`
          }

          // 重新发送请求（这里需要客户端实例，实际使用时需要传入）
          // 这是一个简化版本，实际实现可能需要更复杂的逻辑
          return Promise.reject(error) // 暂时还是拒绝，让上层处理
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          return Promise.reject(error)
        }
      }

      return Promise.reject(error)
    }
  }
}

/**
 * 创建日志拦截器
 */
export function createLogInterceptor(config: LogInterceptorConfig = {}): {
  request: RequestInterceptor
  response: ResponseInterceptor
} {
  const {
    logRequests = true,
    logResponses = true,
    logErrors = true,
    logger = console
  } = config

  const requestInterceptor: RequestInterceptor = {
    onFulfilled: (requestConfig: RequestConfig) => {
      if (logRequests) {
        logger.info(`🚀 HTTP Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`, {
          headers: requestConfig.headers,
          params: requestConfig.params,
          data: requestConfig.data
        })
      }
      return requestConfig
    },
    onRejected: (error: any) => {
      if (logErrors) {
        logger.error('❌ Request Error:', error)
      }
      return Promise.reject(error)
    }
  }

  const responseInterceptor: ResponseInterceptor = {
    onFulfilled: <T>(response: HttpResponse<T>) => {
      if (logResponses) {
        logger.info(`✅ HTTP Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        })
      }
      return response
    },
    onRejected: (error: HttpError) => {
      if (logErrors) {
        logger.error(`❌ HTTP Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        })
      }
      return Promise.reject(error)
    }
  }

  return {
    request: requestInterceptor,
    response: responseInterceptor
  }
}

/**
 * 创建基础URL拦截器
 */
export function createBaseURLInterceptor(baseURL: string): RequestInterceptor {
  return {
    onFulfilled: (requestConfig: RequestConfig) => {
      if (!requestConfig.baseURL && !isAbsoluteURL(requestConfig.url)) {
        requestConfig.baseURL = baseURL
      }
      return requestConfig
    }
  }
}

/**
 * 创建超时拦截器
 */
export function createTimeoutInterceptor(timeout: number): RequestInterceptor {
  return {
    onFulfilled: (requestConfig: RequestConfig) => {
      if (!requestConfig.timeout) {
        requestConfig.timeout = timeout
      }
      return requestConfig
    }
  }
}

/**
 * 创建内容类型拦截器
 */
export function createContentTypeInterceptor(contentType: string = 'application/json'): RequestInterceptor {
  return {
    onFulfilled: (requestConfig: RequestConfig) => {
      if (requestConfig.data && !requestConfig.headers?.['Content-Type'] && !requestConfig.headers?.['content-type']) {
        requestConfig.headers = {
          ...requestConfig.headers,
          'Content-Type': contentType
        }
      }
      return requestConfig
    }
  }
}

/**
 * 创建错误处理拦截器
 */
export function createErrorHandlerInterceptor(
  errorHandler: (error: HttpError) => void | Promise<void>
): ResponseInterceptor {
  return {
    onRejected: async (error: HttpError) => {
      try {
        await errorHandler(error)
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError)
      }
      return Promise.reject(error)
    }
  }
}

/**
 * 创建响应转换拦截器
 */
export function createResponseTransformInterceptor<T, R>(
  transformer: (data: T) => R
): ResponseInterceptor {
  return {
    onFulfilled: <T>(response: HttpResponse<T>) => {
      try {
        response.data = transformer(response.data) as any
      } catch (error) {
        console.error('Error in response transformer:', error)
      }
      return response
    }
  }
}

/**
 * 创建请求ID拦截器
 */
export function createRequestIdInterceptor(headerName: string = 'X-Request-ID'): RequestInterceptor {
  return {
    onFulfilled: (requestConfig: RequestConfig) => {
      if (!requestConfig.headers?.[headerName]) {
        requestConfig.headers = {
          ...requestConfig.headers,
          [headerName]: generateRequestId()
        }
      }
      return requestConfig
    }
  }
}

/**
 * 拦截器插件
 */
export function createInterceptorsPlugin(interceptors: {
  request?: RequestInterceptor[]
  response?: ResponseInterceptor[]
}): HttpPlugin {
  return {
    name: 'interceptors',
    install(client: HttpClientInstance) {
      // 添加请求拦截器
      if (interceptors.request) {
        interceptors.request.forEach(interceptor => {
          client.addRequestInterceptor(interceptor)
        })
      }

      // 添加响应拦截器
      if (interceptors.response) {
        interceptors.response.forEach(interceptor => {
          client.addResponseInterceptor(interceptor)
        })
      }
    }
  }
}

/**
 * 工具函数：检查是否为绝对URL
 */
function isAbsoluteURL(url: string): boolean {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url)
}

/**
 * 工具函数：生成请求ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
