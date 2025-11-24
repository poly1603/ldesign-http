import type { RequestConfig, ResponseData } from '../../types'
import type {
  DownloadConfig,
  DownloadResult,
} from '../../utils/download'
import type {
  UploadConfig,
  UploadResult,
} from '../../utils/upload'
import {
  DownloadProgressCalculator,
  getFilenameFromResponse,
  getFilenameFromURL,
  getMimeTypeFromFilename,
  saveFileToLocal,
} from '../../utils/download'
import { createUploadFormData, ProgressCalculator, validateFile } from '../../utils/upload'

/**
 * 文件操作处理器
 *
 * 负责处理文件上传和下载操作。
 *
 * 功能：
 * - 单文件上传
 * - 多文件上传
 * - 文件下载
 * - 进度跟踪
 * - 文件验证
 *
 * @example
 * ```typescript
 * const handler = new FileOperationHandler(requestExecutor)
 * const result = await handler.upload('/upload', file, { onProgress: (p) => console.log(p) })
 * ```
 */
export class FileOperationHandler {
  /**
   * @param requestExecutor - 请求执行函数
   */
  constructor(
    private requestExecutor: <T = unknown>(config: RequestConfig) => Promise<ResponseData<T>>,
  ) { }

  /**
   * 上传文件
   *
   * 支持单文件和多文件上传。
   *
   * @param url - 上传地址
   * @param file - 文件或文件数组
   * @param config - 上传配置
   * @returns 上传结果
   *
   * @example
   * ```typescript
   * const result = await handler.upload('/upload', file, {
   *   onProgress: (progress) => {
   *     console.log(`上传进度: ${progress.percentage}%`)
   *   }
   * })
   * ```
   */
  async upload<T = unknown>(
    url: string,
    file: File | File[],
    config: UploadConfig = {},
  ): Promise<UploadResult<T>> {
    const files = Array.isArray(file) ? file : [file]

    if (files.length === 1) {
      return this.uploadSingleFile<T>(url, files[0], config)
    }
    else {
      return this.uploadMultipleFiles<T>(url, files, config)
    }
  }

  /**
   * 上传单个文件
   *
   * @param url - 上传地址
   * @param file - 文件
   * @param config - 上传配置
   * @returns 上传结果
   */
  private async uploadSingleFile<T = unknown>(
    url: string,
    file: File,
    config: UploadConfig,
  ): Promise<UploadResult<T>> {
    // 验证文件
    validateFile(file, config)

    const startTime = Date.now()
    const progressCalculator = new ProgressCalculator()

    // 创建表单数据
    const formData = createUploadFormData(file, config)

    // 配置请求
    const requestConfig: RequestConfig = {
      method: 'POST',
      url,
      data: formData,
      headers: {
        ...(config.headers || {}),
        // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
      },
      ...(config || {}),
      onUploadProgress: config.onProgress
        ? (progressEvent: { loaded: number, total?: number }) => {
          const progress = progressCalculator.calculate(
            progressEvent.loaded,
            progressEvent.total || 0,
            file,
          )
          config.onProgress?.(progress)
        }
        : undefined,
    }

    const response = await this.requestExecutor<T>(requestConfig)

    return {
      ...response,
      file,
      duration: Date.now() - startTime,
    }
  }

  /**
   * 上传多个文件
   *
   * @param url - 上传地址
   * @param files - 文件数组
   * @param config - 上传配置
   * @returns 上传结果
   */
  private async uploadMultipleFiles<T = unknown>(
    url: string,
    files: File[],
    config: UploadConfig,
  ): Promise<UploadResult<T>> {
    // 验证所有文件
    files.forEach(file => validateFile(file, config))

    const startTime = Date.now()
    const progressCalculator = new ProgressCalculator()

    // 创建表单数据
    const formData = new FormData()

    // 添加所有文件
    const fileField = config.fileField || 'files'
    files.forEach((file, index) => {
      formData.append(`${fileField}[${index}]`, file)
    })

    // 添加额外的表单数据
    if (config.formData) {
      Object.entries(config.formData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    // 配置请求
    const requestConfig: RequestConfig = {
      method: 'POST',
      url,
      data: formData,
      headers: {
        ...(config.headers || {}),
      },
      ...(config || {}),
      onUploadProgress: config.onProgress
        ? (progressEvent: { loaded: number, total?: number }) => {
          const progress = progressCalculator.calculate(
            progressEvent.loaded,
            progressEvent.total || 0,
          )
          config.onProgress?.(progress)
        }
        : undefined,
    }

    const response = await this.requestExecutor<T>(requestConfig)

    return {
      ...response,
      file: files[0], // 返回第一个文件作为代表
      duration: Date.now() - startTime,
    }
  }

  /**
   * 下载文件
   *
   * @param url - 下载地址
   * @param config - 下载配置
   * @returns 下载结果
   *
   * @example
   * ```typescript
   * const result = await handler.download('/download/file.pdf', {
   *   filename: 'document.pdf',
   *   onProgress: (progress) => {
   *     console.log(`下载进度: ${progress.percentage}%`)
   *   }
   * })
   * ```
   */
  async download(
    url: string,
    config: DownloadConfig = {},
  ): Promise<DownloadResult> {
    const startTime = Date.now()
    const progressCalculator = new DownloadProgressCalculator()

    // 配置请求
    const requestConfig: RequestConfig = {
      method: 'GET',
      url,
      responseType: 'blob',
      ...(config || {}),
      onDownloadProgress: config.onProgress
        ? (progressEvent: { loaded: number, total?: number }) => {
          const progress = progressCalculator.calculate(
            progressEvent.loaded,
            progressEvent.total || 0,
            config.filename,
          )
          config.onProgress?.(progress)
        }
        : undefined,
    }

    const response = await this.requestExecutor<Blob>(requestConfig)

    // 确定文件名
    let filename = config.filename
    if (!filename) {
      filename = getFilenameFromResponse(response.headers)
        || getFilenameFromURL(response.config.url || url)
        || 'download'
    }

    // 确定文件类型
    const type = response.data?.type || getMimeTypeFromFilename(filename)

    // 自动保存文件（浏览器环境）
    let downloadUrl: string | undefined
    if (config.autoSave !== false && typeof window !== 'undefined') {
      saveFileToLocal(response.data, filename)
      downloadUrl = URL.createObjectURL(response.data)
    }

    return {
      data: response.data,
      filename,
      size: response.data.size,
      type,
      duration: Date.now() - startTime,
      url: downloadUrl,
    }
  }
}

