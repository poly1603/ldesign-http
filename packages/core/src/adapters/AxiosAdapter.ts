import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { RequestAdapter, RequestConfig, ResponseData } from '../types'
import { HttpError } from '../types'

/**
 * Axios适配器
 */
export const AxiosAdapter: RequestAdapter = async (config: RequestConfig): Promise<ResponseData> => {
  try {
    // 将RequestConfig转换为AxiosRequestConfig
    const axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: config.method?.toLowerCase() as any,
      baseURL: config.baseURL,
      headers: config.headers,
      params: config.params,
      data: config.data,
      timeout: config.timeout,
      responseType: config.responseType as any,
      withCredentials: config.withCredentials,
    }

    // 处理取消令牌
    if (config.cancelToken) {
      const source = axios.CancelToken.source()
      axiosConfig.cancelToken = source.token

      config.cancelToken.promise.then((cancel) => {
        source.cancel(cancel.message)
      })
    }

    // 发送请求
    const response: AxiosResponse = await axios(axiosConfig)

    // 转换为ResponseData
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      config,
      request: response.request,
    }
  }
  catch (error: any) {
    // 转换Axios错误
    if (axios.isAxiosError(error)) {
      throw new HttpError(
        error.message,
        error.code,
        config,
        error.request,
        error.response
          ? {
              data: error.response.data,
              status: error.response.status,
              statusText: error.response.statusText,
              headers: error.response.headers as Record<string, string>,
              config,
            }
          : undefined,
      )
    }
    throw error
  }
}
