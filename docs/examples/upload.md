# 文件上传示例

本页面展示了使用 @ldesign/http 进行文件上传的各种方式和最佳实践。

## 🚀 基础文件上传

### 单文件上传

```typescript
import { createHttpClient } from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://httpbin.org'
})

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('description', '用户上传的文件')

  try {
    const response = await client.post('/post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progress) => {
        console.log(`上传进度: ${progress.percentage.toFixed(1)}%`)
        console.log(`已上传: ${progress.loaded} / ${progress.total} 字节`)
        console.log(`上传速度: ${(progress.rate / 1024).toFixed(2)} KB/s`)

        if (progress.estimated > 0) {
          console.log(`预计剩余时间: ${(progress.estimated / 1000).toFixed(1)} 秒`)
        }
      }
    })

    console.log('上传成功:', response.data)
    return response.data
  } catch (error) {
    console.error('上传失败:', error)
    throw error
  }
}
```

### 多文件上传

```typescript
async function uploadMultipleFiles(files: FileList) {
  const formData = new FormData()

  // 添加多个文件
  Array.from(files).forEach((file, index) => {
    formData.append(`file_${index}`, file)
  })

  formData.append('total_files', files.length.toString())

  const response = await client.post('/post', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progress) => {
      updateProgressBar(progress.percentage)
    }
  })

  return response.data
}

function updateProgressBar(percentage: number) {
  const progressBar = document.querySelector('#progress-bar') as HTMLElement
  if (progressBar) {
    progressBar.style.width = `${percentage}%`
    progressBar.textContent = `${percentage.toFixed(1)}%`
  }
}
```

## 📊 带进度监控的上传

### Vue 3 上传组件

```vue
<template>
  <div class="upload-container">
    <div class="upload-area" @drop="handleDrop" @dragover.prevent>
      <input
        ref="fileInput"
        type="file"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />

      <div v-if="!uploading" class="upload-prompt" @click="selectFiles">
        <div class="upload-icon">📁</div>
        <p>点击选择文件或拖拽文件到此处</p>
        <p class="upload-hint">支持多文件上传</p>
      </div>

      <div v-else class="upload-progress">
        <div class="progress-circle">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path
              class="circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="circle"
              :stroke-dasharray="`${progress.percentage}, 100`"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="percentage">{{ progress.percentage.toFixed(1) }}%</div>
        </div>

        <div class="upload-info">
          <p>正在上传 {{ selectedFiles.length }} 个文件</p>
          <p>{{ formatBytes(progress.loaded) }} / {{ formatBytes(progress.total) }}</p>
          <p>速度: {{ formatSpeed(progress.rate) }}</p>
          <p v-if="progress.estimated > 0">
            剩余时间: {{ formatTime(progress.estimated) }}
          </p>
        </div>

        <button @click="cancelUpload" class="cancel-btn">取消上传</button>
      </div>
    </div>

    <div v-if="uploadResults.length > 0" class="upload-results">
      <h3>上传结果</h3>
      <div v-for="(result, index) in uploadResults" :key="index" class="result-item">
        <span class="file-name">{{ result.filename }}</span>
        <span class="file-status" :class="result.status">
          {{ result.status === 'success' ? '✅ 成功' : '❌ 失败' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useHttp } from '@ldesign/http'

const http = useHttp()
const fileInput = ref<HTMLInputElement>()
const selectedFiles = ref<File[]>([])
const uploading = ref(false)
const uploadResults = ref<any[]>([])

const progress = reactive({
  loaded: 0,
  total: 0,
  percentage: 0,
  rate: 0,
  estimated: 0
})

let cancelToken: any = null

const selectFiles = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = Array.from(target.files)
    uploadFiles()
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files) {
    selectedFiles.value = Array.from(event.dataTransfer.files)
    uploadFiles()
  }
}

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return

  uploading.value = true
  uploadResults.value = []

  // 重置进度
  Object.assign(progress, {
    loaded: 0,
    total: 0,
    percentage: 0,
    rate: 0,
    estimated: 0
  })

  const formData = new FormData()
  selectedFiles.value.forEach((file, index) => {
    formData.append(`file_${index}`, file)
  })

  cancelToken = http.createCancelToken()

  try {
    const response = await http.post('https://httpbin.org/post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      cancelToken,
      onUploadProgress: (progressEvent) => {
        Object.assign(progress, progressEvent)
      }
    })

    // 模拟上传结果
    uploadResults.value = selectedFiles.value.map(file => ({
      filename: file.name,
      status: 'success',
      size: file.size
    }))

  } catch (error: any) {
    if (!error.isCancelError) {
      console.error('上传失败:', error)
      uploadResults.value = selectedFiles.value.map(file => ({
        filename: file.name,
        status: 'error',
        error: error.message
      }))
    }
  } finally {
    uploading.value = false
    cancelToken = null
    selectedFiles.value = []
  }
}

const cancelUpload = () => {
  if (cancelToken) {
    cancelToken.cancel('用户取消上传')
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond) + '/s'
}

const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
  } else if (minutes > 0) {
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  } else {
    return `${seconds}s`
  }
}
</script>

<style scoped>
.upload-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #4299e1;
}

.upload-prompt {
  cursor: pointer;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-hint {
  color: #666;
  font-size: 14px;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.progress-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.circular-chart {
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: #eee;
  stroke-width: 2;
}

.circle {
  fill: none;
  stroke: #4299e1;
  stroke-width: 2;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s;
}

.percentage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: bold;
  color: #4299e1;
}

.upload-info {
  text-align: center;
}

.upload-info p {
  margin: 4px 0;
  color: #666;
}

.cancel-btn {
  padding: 8px 16px;
  background: #f56565;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-results {
  margin-top: 30px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 8px;
}

.file-status.success {
  color: #48bb78;
}

.file-status.error {
  color: #f56565;
}
</style>
```

## 🔄 分块上传

### 大文件分块上传

```typescript
class ChunkedUploader {
  private chunkSize = 1024 * 1024 // 1MB per chunk
  private client = createHttpClient({
    baseURL: 'https://api.example.com'
  })

  async uploadLargeFile(
    file: File,
    onProgress?: (progress: ProgressEvent) => void
  ): Promise<any> {
    const totalChunks = Math.ceil(file.size / this.chunkSize)
    const uploadId = this.generateUploadId()
    let uploadedBytes = 0

    console.log(`开始分块上传: ${file.name}, 总大小: ${file.size}, 分块数: ${totalChunks}`)

    // 初始化上传
    await this.initializeUpload(uploadId, file.name, file.size, totalChunks)

    // 上传每个分块
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * this.chunkSize
      const end = Math.min(start + this.chunkSize, file.size)
      const chunk = file.slice(start, end)

      await this.uploadChunk(uploadId, chunkIndex, chunk)

      uploadedBytes += chunk.size

      // 报告进度
      if (onProgress) {
        const percentage = (uploadedBytes / file.size) * 100
        const rate = this.calculateUploadRate(uploadedBytes, Date.now())
        const estimated = this.estimateRemainingTime(uploadedBytes, file.size, rate)

        onProgress({
          loaded: uploadedBytes,
          total: file.size,
          percentage,
          rate,
          estimated,
          lengthComputable: true
        })
      }

      console.log(`分块 ${chunkIndex + 1}/${totalChunks} 上传完成`)
    }

    // 完成上传
    const result = await this.completeUpload(uploadId)
    console.log('分块上传完成:', result)

    return result
  }

  private async initializeUpload(
    uploadId: string,
    filename: string,
    fileSize: number,
    totalChunks: number
  ): Promise<void> {
    await this.client.post('/upload/initialize', {
      uploadId,
      filename,
      fileSize,
      totalChunks
    })
  }

  private async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunk: Blob
  ): Promise<void> {
    const formData = new FormData()
    formData.append('uploadId', uploadId)
    formData.append('chunkIndex', chunkIndex.toString())
    formData.append('chunk', chunk)

    await this.client.post('/upload/chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  private async completeUpload(uploadId: string): Promise<any> {
    const response = await this.client.post('/upload/complete', {
      uploadId
    })
    return response.data
  }

  private generateUploadId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private calculateUploadRate(uploadedBytes: number, currentTime: number): number {
    // 简化的速率计算
    return uploadedBytes / ((currentTime - this.startTime) / 1000)
  }

  private estimateRemainingTime(uploaded: number, total: number, rate: number): number {
    const remaining = total - uploaded
    return rate > 0 ? (remaining / rate) * 1000 : 0
  }

  private startTime = Date.now()
}

// 使用示例
const uploader = new ChunkedUploader()

const handleLargeFileUpload = async (file: File) => {
  try {
    const result = await uploader.uploadLargeFile(file, (progress) => {
      console.log(`上传进度: ${progress.percentage.toFixed(1)}%`)
      updateProgressUI(progress)
    })

    console.log('大文件上传成功:', result)
  } catch (error) {
    console.error('大文件上传失败:', error)
  }
}
```

## 📱 图片上传和预览

### 图片上传组件

```vue
<template>
  <div class="image-upload">
    <div class="image-preview" v-if="previewUrl">
      <img :src="previewUrl" alt="预览图片" />
      <div class="image-actions">
        <button @click="removeImage" class="remove-btn">删除</button>
        <button @click="uploadImage" :disabled="uploading" class="upload-btn">
          {{ uploading ? '上传中...' : '上传图片' }}
        </button>
      </div>
    </div>

    <div v-else class="image-selector" @click="selectImage">
      <div class="selector-content">
        <div class="upload-icon">🖼️</div>
        <p>点击选择图片</p>
        <p class="format-hint">支持 JPG, PNG, GIF 格式</p>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleImageSelect"
      style="display: none"
    />

    <div v-if="uploading" class="upload-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${uploadProgress}%` }"
        ></div>
      </div>
      <span>{{ uploadProgress.toFixed(1) }}%</span>
    </div>

    <div v-if="uploadResult" class="upload-result">
      <p>✅ 上传成功!</p>
      <p>图片URL: <a :href="uploadResult.url" target="_blank">{{ uploadResult.url }}</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useHttp } from '@ldesign/http'

const http = useHttp()
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref<any>(null)

const selectImage = () => {
  fileInput.value?.click()
}

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    selectedFile.value = file

    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // 重置上传结果
    uploadResult.value = null
  }
}

const removeImage = () => {
  selectedFile.value = null
  previewUrl.value = ''
  uploadResult.value = null
  uploadProgress.value = 0

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const uploadImage = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  uploadProgress.value = 0

  const formData = new FormData()
  formData.append('image', selectedFile.value)
  formData.append('category', 'user_upload')

  try {
    const response = await http.post('https://httpbin.org/post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progress) => {
        uploadProgress.value = progress.percentage
      }
    })

    // 模拟上传结果
    uploadResult.value = {
      url: previewUrl.value,
      filename: selectedFile.value.name,
      size: selectedFile.value.size
    }

  } catch (error) {
    console.error('图片上传失败:', error)
    alert('图片上传失败，请重试')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.image-upload {
  max-width: 400px;
  margin: 0 auto;
}

.image-preview {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  display: flex;
  gap: 10px;
}

.remove-btn, .upload-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.remove-btn {
  background: #f56565;
  color: white;
}

.upload-btn {
  background: #4299e1;
  color: white;
}

.upload-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.image-selector {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.image-selector:hover {
  border-color: #4299e1;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.format-hint {
  color: #666;
  font-size: 12px;
}

.upload-progress {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4299e1;
  transition: width 0.3s;
}

.upload-result {
  margin-top: 15px;
  padding: 15px;
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 4px;
}

.upload-result a {
  color: #4299e1;
  word-break: break-all;
}
</style>
```

## 📚 最佳实践

### 1. 文件验证

```typescript
function validateFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '不支持的文件类型' }
  }

  // 检查文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过10MB' }
  }

  return { valid: true }
}
```

### 2. 上传重试

```typescript
async function uploadWithRetry(file: File, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFile(file)
    } catch (error) {
      console.log(`上传失败，第${attempt}次尝试`)

      if (attempt === maxRetries) {
        throw error
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}
```

### 3. 上传队列

```typescript
class UploadQueue {
  private queue: File[] = []
  private uploading = false
  private maxConcurrent = 3
  private currentUploads = 0

  addFiles(files: File[]) {
    this.queue.push(...files)
    this.processQueue()
  }

  private async processQueue() {
    if (this.uploading || this.queue.length === 0) return

    this.uploading = true

    while (this.queue.length > 0 && this.currentUploads < this.maxConcurrent) {
      const file = this.queue.shift()!
      this.uploadFile(file)
    }
  }

  private async uploadFile(file: File) {
    this.currentUploads++

    try {
      await uploadFile(file)
      console.log(`${file.name} 上传成功`)
    } catch (error) {
      console.error(`${file.name} 上传失败:`, error)
    } finally {
      this.currentUploads--
      this.processQueue()
    }
  }
}
```

## 🎯 交互式演示

### 文件上传组件演示

<FileUploader
  :max-file-size="10485760"
  :max-files="5"
  accepted-types="image/*,.pdf,.doc,.docx"
  :show-base64-preview="true"
  :auto-upload="false"
/>

### 完整的API测试工具

你也可以在API测试工具中测试文件上传功能：

<ApiTester />

## 📚 下一步

了解文件上传后，你可以继续学习：

- [认证示例](/examples/auth) - 认证和授权
- [API测试工具](/examples/api-tester) - 功能完整的测试工具
- [进度监控](/guide/progress) - 详细的进度监控
- [错误处理](/guide/error-handling) - 上传错误处理
- [Vue集成](/vue/) - Vue组件开发
