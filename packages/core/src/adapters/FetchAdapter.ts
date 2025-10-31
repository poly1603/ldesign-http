import type { RequestAdapter, RequestConfig, ResponseData } from '../types'
import { HttpError } from '../types'

/**
 * Fetch API适配器
 */
export const FetchAdapter: RequestAdapter = async (config: RequestConfig): Promise<ResponseData> => {
  try {
    const { url, method = 'GET', headers, data, timeout = 30000 } = config

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // 处理取消令牌
    if (config.cancelToken) {
      config.cancelToken.promise.then((cancel) => {
        controller.abort()
      })
    }

    // 构建请求选项
    const fetchOptions: RequestInit = {
      method,
      headers: headers as HeadersInit,
      signal: controller.signal,
      credentials: config.withCredentials ? 'include' : 'same-origin',
    }

    // 添加请求体
    if (data) {
      if (data instanceof FormData) {
        fetchOptions.body = data
      }
      else if (typeof data === 'object') {
        fetchOptions.body = JSON.stringify(data)
        fetchOptions.headers = {
          ...fetchOptions.headers as Record<string, string>,
          'Content-Type': 'application/json',
        }
      }
      else {
        fetchOptions.body = data
      }
    }

    // 构建完整URL
    let fullUrl = url!
    if (config.baseURL) {
      fullUrl = `${config.baseURL}${url}`
    }
    if (config.params) {
      const searchParams = new URLSearchParams(config.params)
      fullUrl = `${fullUrl}?${searchParams.toString()}`
    }

    // 发送请求
    const response = await fetch(fullUrl, fetchOptions)
    clearTimeout(timeoutId)

    // 处理响应
    let responseData: any
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      responseData = await response.json()
    }
    else if (config.responseType === 'blob') {
      responseData = await response.blob()
    }
    else if (config.responseType === 'arraybuffer') {
      responseData = await response.arrayBuffer()
    }
    else {
      responseData = await response.text()
    }

    // 构建响应对象
    const result: ResponseData = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
    }

    // 检查响应状态
    if (!response.ok) {
      throw new HttpError(
        `Request failed with status ${response.status}`,
        response.status.toString(),
        config,
        undefined,
        result,
      )
    }

    return result
  }
  catch (error: any) {
    if (error.name === 'AbortError') {
      throw new HttpError(
        'Request timeout or cancelled',
        'ECONNABORTED',
        config,
      )
    }
    if (error instanceof HttpError) {
      throw error
    }
    throw new HttpError(
      error.message || 'Request failed',
      'UNKNOWN_ERROR',
      config,
    )
  }
}
