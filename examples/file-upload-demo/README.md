# 文件上传下载示例

这个示例展示了如何使用 @ldesign/http 实现文件上传和下载功能。

## 功能特性

- ✅ 单文件上传
- ✅ 多文件上传
- ✅ 大文件分片上传
- ✅ 上传进度显示
- ✅ 断点续传
- ✅ 文件下载
- ✅ 下载进度显示
- ✅ 文件预览
- ✅ 拖拽上传

## 安装依赖

```bash
pnpm install
```

## 运行示例

```bash
pnpm dev
```

## 实现原理

### 1. 单文件上传

```typescript
import { createHttpClient } from '@ldesign/http'

const client = await createHttpClient({
  baseURL: 'https://api.example.com'
})

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', file.name)

  try {
    const response = await client.upload('/upload', formData, {
      onUploadProgress: (progress) => {
        console.log(`上传进度: ${progress.percentage}%`)
        console.log(`已上传: ${progress.loaded} / ${progress.total} 字节`)
      },
      timeout: 60000 // 60秒超时
    })

    console.log('上传成功:', response.data)
    return response.data
  } catch (error) {
    console.error('上传失败:', error)
    throw error
  }
}
```

### 2. 多文件上传

```typescript
async function uploadMultipleFiles(files: File[]) {
  const formData = new FormData()

  files.forEach((file, index) => {
    formData.append(`files[${index}]`, file)
  })

  try {
    const response = await client.upload('/upload/multiple', formData, {
      onUploadProgress: (progress) => {
        console.log(`总进度: ${progress.percentage}%`)
      }
    })

    return response.data
  } catch (error) {
    console.error('批量上传失败:', error)
    throw error
  }
}
```

### 3. 大文件分片上传

```typescript
import { createFileChunks, generateFileHash } from '@ldesign/http'

async function uploadLargeFile(file: File) {
  const chunkSize = 5 * 1024 * 1024 // 5MB per chunk

  // 生成文件哈希（用于断点续传）
  const fileHash = await generateFileHash(file)

  // 创建文件分片
  const chunks = createFileChunks(file, chunkSize)

  console.log(`文件大小: ${file.size} 字节`)
  console.log(`分片数量: ${chunks.length}`)

  // 检查是否有已上传的分片
  const uploadedChunks = await checkUploadedChunks(fileHash)

  // 上传每个分片
  for (let i = 0; i < chunks.length; i++) {
    // 跳过已上传的分片
    if (uploadedChunks.includes(i)) {
      console.log(`跳过分片 ${i + 1}/${chunks.length}`)
      continue
    }

    const formData = new FormData()
    formData.append('chunk', chunks[i])
    formData.append('chunkIndex', String(i))
    formData.append('totalChunks', String(chunks.length))
    formData.append('fileHash', fileHash)
    formData.append('fileName', file.name)

    try {
      await client.upload('/upload/chunk', formData, {
        onUploadProgress: (progress) => {
          const totalProgress = ((i + progress.percentage / 100) / chunks.length) * 100
          console.log(`总进度: ${totalProgress.toFixed(2)}%`)
        }
      })

      console.log(`分片 ${i + 1}/${chunks.length} 上传成功`)
    } catch (error) {
      console.error(`分片 ${i + 1} 上传失败:`, error)
      throw error
    }
  }

  // 合并分片
  const response = await client.post('/upload/merge', {
    fileHash,
    fileName: file.name,
    totalChunks: chunks.length
  })

  console.log('文件上传完成:', response.data)
  return response.data
}

// 检查已上传的分片
async function checkUploadedChunks(fileHash: string): Promise<number[]> {
  try {
    const response = await client.get(`/upload/check/${fileHash}`)
    return response.data.uploadedChunks || []
  } catch (error) {
    return []
  }
}
```

### 4. 断点续传

```typescript
class UploadManager {
  private client: HttpClient
  private uploads = new Map<string, UploadTask>()

  async upload(file: File, options?: UploadOptions) {
    const fileHash = await generateFileHash(file)

    // 检查是否有未完成的上传
    const existingTask = this.uploads.get(fileHash)
    if (existingTask) {
      console.log('继续之前的上传...')
      return existingTask.resume()
    }

    // 创建新的上传任务
    const task = new UploadTask(file, fileHash, this.client, options)
    this.uploads.set(fileHash, task)

    return task.start()
  }

  pause(fileHash: string) {
    const task = this.uploads.get(fileHash)
    task?.pause()
  }

  resume(fileHash: string) {
    const task = this.uploads.get(fileHash)
    return task?.resume()
  }

  cancel(fileHash: string) {
    const task = this.uploads.get(fileHash)
    task?.cancel()
    this.uploads.delete(fileHash)
  }
}

class UploadTask {
  private file: File
  private fileHash: string
  private client: HttpClient
  private options?: UploadOptions
  private paused = false
  private cancelled = false
  private currentChunk = 0

  constructor(file: File, fileHash: string, client: HttpClient, options?: UploadOptions) {
    this.file = file
    this.fileHash = fileHash
    this.client = client
    this.options = options
  }

  async start() {
    // 检查已上传的分片
    const uploadedChunks = await this.checkUploadedChunks()
    this.currentChunk = uploadedChunks.length

    return this.upload()
  }

  async resume() {
    this.paused = false
    return this.upload()
  }

  pause() {
    this.paused = true
  }

  cancel() {
    this.cancelled = true
  }

  private async upload() {
    const chunks = createFileChunks(this.file, 5 * 1024 * 1024)

    for (let i = this.currentChunk; i < chunks.length; i++) {
      if (this.cancelled) {
        throw new Error('上传已取消')
      }

      if (this.paused) {
        this.currentChunk = i
        return { paused: true, progress: (i / chunks.length) * 100 }
      }

      // 上传分片
      await this.uploadChunk(chunks[i], i, chunks.length)
    }

    // 合并分片
    return this.mergeChunks(chunks.length)
  }

  private async uploadChunk(chunk: Blob, index: number, total: number) {
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('chunkIndex', String(index))
    formData.append('totalChunks', String(total))
    formData.append('fileHash', this.fileHash)

    await this.client.upload('/upload/chunk', formData, {
      onUploadProgress: (progress) => {
        const totalProgress = ((index + progress.percentage / 100) / total) * 100
        this.options?.onProgress?.(totalProgress)
      }
    })
  }

  private async mergeChunks(totalChunks: number) {
    const response = await this.client.post('/upload/merge', {
      fileHash: this.fileHash,
      fileName: this.file.name,
      totalChunks
    })

    return response.data
  }

  private async checkUploadedChunks(): Promise<number[]> {
    try {
      const response = await this.client.get(`/upload/check/${this.fileHash}`)
      return response.data.uploadedChunks || []
    } catch (error) {
      return []
    }
  }
}
```

### 5. 文件下载

```typescript
async function downloadFile(url: string, fileName?: string) {
  try {
    const response = await client.download(url, {
      onDownloadProgress: (progress) => {
        console.log(`下载进度: ${progress.percentage}%`)
        console.log(`已下载: ${progress.loaded} / ${progress.total} 字节`)
      }
    })

    // 创建下载链接
    const blob = new Blob([response.data])
    const downloadUrl = URL.createObjectURL(blob)

    // 触发下载
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName || response.filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 释放对象 URL
    URL.revokeObjectURL(downloadUrl)

    console.log('下载完成')
  } catch (error) {
    console.error('下载失败:', error)
    throw error
  }
}
```

### 6. 文件预览

```typescript
import { 
  createFilePreviewURL, 
  revokeFilePreviewURL,
  isImageFile,
  isVideoFile,
  isPdfFile
} from '@ldesign/http'

async function previewFile(file: File) {
  const previewUrl = createFilePreviewURL(file)

  if (isImageFile(file)) {
    // 图片预览
    const img = document.createElement('img')
    img.src = previewUrl
    img.onload = () => {
      document.body.appendChild(img)
    }
  } else if (isVideoFile(file)) {
    // 视频预览
    const video = document.createElement('video')
    video.src = previewUrl
    video.controls = true
    document.body.appendChild(video)
  } else if (isPdfFile(file)) {
    // PDF 预览
    window.open(previewUrl, '_blank')
  }

  // 记得在不需要时释放 URL
  // revokeFilePreviewURL(previewUrl)
}
```

### 7. 拖拽上传

```html
<div
  id="dropzone"
  ondrop="handleDrop(event)"
  ondragover="handleDragOver(event)"
  ondragenter="handleDragEnter(event)"
  ondragleave="handleDragLeave(event)"
>
  拖拽文件到这里上传
</div>
```

```typescript
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  const dropzone = event.currentTarget as HTMLElement
  dropzone.classList.add('dragover')
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  const dropzone = event.currentTarget as HTMLElement
  dropzone.classList.remove('dragover')
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  const dropzone = event.currentTarget as HTMLElement
  dropzone.classList.remove('dragover')

  const files = Array.from(event.dataTransfer?.files || [])

  if (files.length === 0) {
    return
  }

  console.log('接收到文件:', files)

  // 上传文件
  for (const file of files) {
    await uploadFile(file)
  }
}
```

### 8. 文件验证

```typescript
import {
  validateFile,
  formatFileSize,
  getFileExtension
} from '@ldesign/http'

function validateFileUpload(file: File) {
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件类型')
  }

  // 验证文件大小（最大 10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error(`文件大小不能超过 ${formatFileSize(maxSize)}`)
  }

  // 验证文件扩展名
  const extension = getFileExtension(file.name)
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf']
  if (!allowedExtensions.includes(extension)) {
    throw new Error('不支持的文件扩展名')
  }

  // 使用内置验证
  const validation = validateFile(file, {
    maxSize,
    allowedTypes,
    allowedExtensions
  })

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  return true
}
```

## 相关链接

- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [@ldesign/http 文档](/README.md)

