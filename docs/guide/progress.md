# 进度监控

进度监控让用户了解长时间运行操作的进度，提升用户体验。@ldesign/http 支持上传和下载进度监控。

## 📊 进度监控概览

### 支持的操作

- **上传进度** - 文件上传、表单提交
- **下载进度** - 文件下载、大数据获取
- **请求进度** - 长时间运行的请求

### 进度信息

```typescript
interface ProgressEvent {
  loaded: number      // 已传输字节数
  total: number       // 总字节数
  percentage: number  // 进度百分比 (0-100)
  rate: number        // 传输速率 (字节/秒)
  estimated: number   // 预计剩余时间 (毫秒)
}
```

## 📤 上传进度

### 基础文件上传

```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progress) => {
        console.log(`上传进度: ${progress.percentage}%`)
        console.log(`已上传: ${progress.loaded} / ${progress.total} 字节`)
        console.log(`传输速率: ${(progress.rate / 1024).toFixed(2)} KB/s`)
        console.log(`预计剩余: ${(progress.estimated / 1000).toFixed(1)} 秒`)
      }
    })
    
    console.log('上传完成:', response.data)
    return response.data
  } catch (error) {
    console.error('上传失败:', error)
    throw error
  }
}

// 使用示例
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
const file = fileInput.files?.[0]

if (file) {
  await uploadFile(file)
}
```

### 多文件上传

```typescript
const uploadMultipleFiles = async (files: FileList) => {
  const uploads = Array.from(files).map((file, index) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return client.post('/upload', formData, {
      onUploadProgress: (progress) => {
        console.log(`文件 ${index + 1} 上传进度: ${progress.percentage}%`)
        updateProgressBar(index, progress.percentage)
      }
    })
  })
  
  try {
    const responses = await Promise.all(uploads)
    console.log('所有文件上传完成:', responses.map(r => r.data))
    return responses.map(r => r.data)
  } catch (error) {
    console.error('批量上传失败:', error)
    throw error
  }
}

function updateProgressBar(fileIndex: number, percentage: number) {
  const progressBar = document.querySelector(`#progress-${fileIndex}`) as HTMLElement
  if (progressBar) {
    progressBar.style.width = `${percentage}%`
  }
}
```

### 分块上传

```typescript
class ChunkedUploader {
  private chunkSize = 1024 * 1024 // 1MB chunks
  
  async uploadFile(file: File, onProgress?: (progress: ProgressEvent) => void): Promise<any> {
    const totalChunks = Math.ceil(file.size / this.chunkSize)
    let uploadedBytes = 0
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize
      const end = Math.min(start + this.chunkSize, file.size)
      const chunk = file.slice(start, end)
      
      await this.uploadChunk(chunk, i, totalChunks, file.name)
      
      uploadedBytes += chunk.size
      
      // 报告进度
      if (onProgress) {
        onProgress({
          loaded: uploadedBytes,
          total: file.size,
          percentage: (uploadedBytes / file.size) * 100,
          rate: 0, // 可以计算实际速率
          estimated: 0 // 可以计算预计时间
        })
      }
    }
    
    // 完成上传
    return this.completeUpload(file.name, totalChunks)
  }
  
  private async uploadChunk(
    chunk: Blob, 
    index: number, 
    total: number, 
    filename: string
  ): Promise<void> {
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('index', index.toString())
    formData.append('total', total.toString())
    formData.append('filename', filename)
    
    await client.post('/upload/chunk', formData)
  }
  
  private async completeUpload(filename: string, totalChunks: number): Promise<any> {
    const response = await client.post('/upload/complete', {
      filename,
      totalChunks
    })
    return response.data
  }
}

// 使用分块上传
const uploader = new ChunkedUploader()
await uploader.uploadFile(file, (progress) => {
  console.log(`分块上传进度: ${progress.percentage}%`)
})
```

## 📥 下载进度

### 基础文件下载

```typescript
const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await client.get(url, {
      responseType: 'blob',
      onDownloadProgress: (progress) => {
        console.log(`下载进度: ${progress.percentage}%`)
        console.log(`已下载: ${progress.loaded} / ${progress.total} 字节`)
        updateDownloadProgress(progress.percentage)
      }
    })
    
    // 创建下载链接
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    console.log('下载完成')
  } catch (error) {
    console.error('下载失败:', error)
    throw error
  }
}

function updateDownloadProgress(percentage: number) {
  const progressBar = document.querySelector('#download-progress') as HTMLElement
  if (progressBar) {
    progressBar.style.width = `${percentage}%`
    progressBar.textContent = `${percentage.toFixed(1)}%`
  }
}

// 使用示例
await downloadFile('/files/large-file.zip', 'large-file.zip')
```

### 流式下载

```typescript
const streamDownload = async (url: string, onProgress?: (progress: ProgressEvent) => void) => {
  const response = await fetch(url)
  
  if (!response.body) {
    throw new Error('Response body is null')
  }
  
  const contentLength = response.headers.get('Content-Length')
  const total = contentLength ? parseInt(contentLength, 10) : 0
  let loaded = 0
  
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  
  while (true) {
    const { done, value } = await reader.read()
    
    if (done) break
    
    chunks.push(value)
    loaded += value.length
    
    if (onProgress && total > 0) {
      onProgress({
        loaded,
        total,
        percentage: (loaded / total) * 100,
        rate: 0,
        estimated: 0
      })
    }
  }
  
  // 合并所有块
  const allChunks = new Uint8Array(loaded)
  let position = 0
  for (const chunk of chunks) {
    allChunks.set(chunk, position)
    position += chunk.length
  }
  
  return allChunks
}
```

## 🎨 Vue 集成

### 上传组件

```vue
<template>
  <div class="upload-component">
    <input 
      ref="fileInput"
      type="file" 
      @change="handleFileSelect"
      :disabled="uploading"
    />
    
    <div v-if="uploading" class="progress-container">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${progress.percentage}%` }"
        ></div>
      </div>
      <div class="progress-info">
        <span>{{ progress.percentage.toFixed(1) }}%</span>
        <span>{{ formatBytes(progress.loaded) }} / {{ formatBytes(progress.total) }}</span>
        <span>{{ formatSpeed(progress.rate) }}</span>
        <span>剩余: {{ formatTime(progress.estimated) }}</span>
      </div>
      <button @click="cancelUpload">取消上传</button>
    </div>
    
    <div v-if="uploadResult" class="upload-result">
      上传成功: {{ uploadResult.filename }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUpload } from '@/composables/useUpload'

const fileInput = ref<HTMLInputElement>()
const { 
  uploading, 
  progress, 
  uploadResult, 
  uploadFile, 
  cancelUpload 
} = useUpload()

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    uploadFile(file)
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
.upload-component {
  max-width: 500px;
  margin: 0 auto;
}

.progress-container {
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.upload-result {
  margin-top: 20px;
  padding: 10px;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
}
</style>
```

### 上传组合式函数

```typescript
// composables/useUpload.ts
import { ref, reactive } from 'vue'
import { useHttp } from '@ldesign/http'

export function useUpload() {
  const http = useHttp()
  const uploading = ref(false)
  const uploadResult = ref<any>(null)
  const progress = reactive({
    loaded: 0,
    total: 0,
    percentage: 0,
    rate: 0,
    estimated: 0
  })
  
  let cancelToken: any = null
  
  const uploadFile = async (file: File) => {
    uploading.value = true
    uploadResult.value = null
    
    // 重置进度
    Object.assign(progress, {
      loaded: 0,
      total: 0,
      percentage: 0,
      rate: 0,
      estimated: 0
    })
    
    const formData = new FormData()
    formData.append('file', file)
    
    cancelToken = http.createCancelToken()
    
    try {
      const response = await http.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        cancelToken,
        onUploadProgress: (progressEvent) => {
          Object.assign(progress, progressEvent)
        }
      })
      
      uploadResult.value = response.data
    } catch (error: any) {
      if (!error.isCancelError) {
        console.error('上传失败:', error)
        throw error
      }
    } finally {
      uploading.value = false
      cancelToken = null
    }
  }
  
  const cancelUpload = () => {
    if (cancelToken) {
      cancelToken.cancel('用户取消上传')
    }
  }
  
  return {
    uploading,
    progress,
    uploadResult,
    uploadFile,
    cancelUpload
  }
}
```

## 📊 进度可视化

### 圆形进度条

```vue
<template>
  <div class="circular-progress">
    <svg :width="size" :height="size" class="progress-ring">
      <circle
        class="progress-ring-background"
        :stroke-width="strokeWidth"
        :r="normalizedRadius"
        :cx="size / 2"
        :cy="size / 2"
      />
      <circle
        class="progress-ring-progress"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference + ' ' + circumference"
        :stroke-dashoffset="strokeDashoffset"
        :r="normalizedRadius"
        :cx="size / 2"
        :cy="size / 2"
      />
    </svg>
    <div class="progress-text">
      {{ percentage.toFixed(1) }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  percentage: number
  size?: number
  strokeWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 120,
  strokeWidth: 8
})

const normalizedRadius = computed(() => 
  (props.size - props.strokeWidth * 2) / 2
)

const circumference = computed(() => 
  normalizedRadius.value * 2 * Math.PI
)

const strokeDashoffset = computed(() => 
  circumference.value - (props.percentage / 100) * circumference.value
)
</script>

<style scoped>
.circular-progress {
  position: relative;
  display: inline-block;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-background {
  fill: transparent;
  stroke: #e6e6e6;
}

.progress-ring-progress {
  fill: transparent;
  stroke: #4caf50;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
</style>
```

## 🧪 测试进度监控

### 模拟进度事件

```typescript
describe('进度监控', () => {
  it('应该报告上传进度', async () => {
    const progressEvents: ProgressEvent[] = []
    
    const mockFile = new File(['test content'], 'test.txt', {
      type: 'text/plain'
    })
    
    const formData = new FormData()
    formData.append('file', mockFile)
    
    await client.post('/upload', formData, {
      onUploadProgress: (progress) => {
        progressEvents.push(progress)
      }
    })
    
    expect(progressEvents.length).toBeGreaterThan(0)
    expect(progressEvents[progressEvents.length - 1].percentage).toBe(100)
  })
  
  it('应该报告下载进度', async () => {
    const progressEvents: ProgressEvent[] = []
    
    await client.get('/download/large-file', {
      responseType: 'blob',
      onDownloadProgress: (progress) => {
        progressEvents.push(progress)
      }
    })
    
    expect(progressEvents.length).toBeGreaterThan(0)
    expect(progressEvents[0].total).toBeGreaterThan(0)
  })
})
```

## 📚 最佳实践

### 1. 用户体验优化

```typescript
// ✅ 提供详细的进度信息
const onProgress = (progress: ProgressEvent) => {
  // 显示百分比
  updatePercentage(progress.percentage)
  
  // 显示传输速度
  updateSpeed(progress.rate)
  
  // 显示预计剩余时间
  updateETA(progress.estimated)
  
  // 显示已传输/总大小
  updateSize(progress.loaded, progress.total)
}

// ✅ 防抖更新UI
const debouncedUpdateProgress = debounce((progress: ProgressEvent) => {
  updateUI(progress)
}, 100) // 每100ms最多更新一次
```

### 2. 错误处理

```typescript
// ✅ 处理进度监控中的错误
const uploadWithProgress = async (file: File) => {
  try {
    await client.post('/upload', formData, {
      onUploadProgress: (progress) => {
        try {
          updateProgress(progress)
        } catch (error) {
          console.error('更新进度UI失败:', error)
          // 不影响上传继续进行
        }
      }
    })
  } catch (error) {
    // 重置进度显示
    resetProgress()
    throw error
  }
}
```

### 3. 性能考虑

```typescript
// ✅ 避免频繁的DOM更新
let lastUpdateTime = 0
const MIN_UPDATE_INTERVAL = 100 // 100ms

const onProgress = (progress: ProgressEvent) => {
  const now = Date.now()
  if (now - lastUpdateTime >= MIN_UPDATE_INTERVAL) {
    updateProgressBar(progress.percentage)
    lastUpdateTime = now
  }
}
```

## 📚 下一步

了解进度监控后，你可以继续学习：

- [插件系统](/plugins/) - 扩展功能
- [Vue 集成](/vue/) - 在 Vue 中使用
- [性能优化](/guide/performance) - 性能优化技巧
- [最佳实践](/guide/best-practices) - 最佳实践指南
