/**
 * 进度事件
 */
export interface ProgressEvent {
  /** 已加载字节数 */
  loaded: number
  /** 总字节数 */
  total: number
  /** 进度百分比 */
  percentage: number
  /** 速率 (bytes/s) */
  rate: number
  /** 预计剩余时间 (秒) */
  estimated: number
}

/**
 * 进度回调
 */
export type ProgressCallback = (event: ProgressEvent) => void

/**
 * 进度跟踪器
 */
export class ProgressTracker {
  private loaded = 0
  private total = 0
  private startTime = Date.now()
  private lastLoaded = 0
  private lastTime = Date.now()

  constructor(
    private onProgress?: ProgressCallback,
  ) {}

  /**
   * 更新进度
   */
  update(loaded: number, total: number): void {
    this.loaded = loaded
    this.total = total

    if (this.onProgress) {
      const now = Date.now()
      const elapsed = (now - this.lastTime) / 1000 // 秒
      const loadedDiff = loaded - this.lastLoaded

      // 计算速率
      const rate = elapsed > 0 ? loadedDiff / elapsed : 0

      // 计算预计剩余时间
      const remaining = total - loaded
      const estimated = rate > 0 ? remaining / rate : 0

      // 计算百分比
      const percentage = total > 0 ? (loaded / total) * 100 : 0

      this.onProgress({
        loaded,
        total,
        percentage,
        rate,
        estimated,
      })

      this.lastLoaded = loaded
      this.lastTime = now
    }
  }

  /**
   * 重置
   */
  reset(): void {
    this.loaded = 0
    this.total = 0
    this.startTime = Date.now()
    this.lastLoaded = 0
    this.lastTime = Date.now()
  }

  /**
   * 创建XMLHttpRequest进度监听器
   */
  static createXHRProgressListener(
    xhr: XMLHttpRequest,
    onProgress?: ProgressCallback,
  ): ProgressTracker {
    const tracker = new ProgressTracker(onProgress)

    // 上传进度
    if (xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          tracker.update(e.loaded, e.total)
        }
      })
    }

    // 下载进度
    xhr.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        tracker.update(e.loaded, e.total)
      }
    })

    return tracker
  }
}

/**
 * 上传文件辅助函数
 */
export async function uploadWithProgress(
  url: string,
  file: File | Blob,
  onProgress?: ProgressCallback,
  options?: RequestInit,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const tracker = ProgressTracker.createXHRProgressListener(xhr, onProgress)

    xhr.open(options?.method || 'POST', url)

    // 设置请求头
    if (options?.headers) {
      Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
        }))
      }
      else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.onabort = () => reject(new Error('Upload aborted'))

    // 发送文件
    const formData = new FormData()
    formData.append('file', file)
    xhr.send(formData)
  })
}

/**
 * 下载文件辅助函数
 */
export async function downloadWithProgress(
  url: string,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const contentLength = Number(response.headers.get('content-length'))
  const tracker = new ProgressTracker(onProgress)

  const chunks: Uint8Array[] = []
  let loaded = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done)
      break

    chunks.push(value)
    loaded += value.length
    tracker.update(loaded, contentLength)
  }

  // 合并chunks
  const blob = new Blob(chunks)
  return blob
}
