<template>
  <div class="file-uploader">
    <!-- 拖拽上传区域 -->
    <div 
      class="upload-zone"
      :class="{ 
        'drag-over': isDragOver,
        'has-files': files.length > 0
      }"
      @drop="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @click="selectFiles"
    >
      <input 
        ref="fileInput"
        type="file" 
        multiple
        :accept="acceptedTypes"
        @change="handleFileSelect"
        style="display: none"
      />
      
      <div v-if="files.length === 0" class="upload-prompt">
        <div class="upload-icon">📁</div>
        <p class="upload-text">点击选择文件或拖拽文件到此处</p>
        <p class="upload-hint">
          支持多文件上传，最大 {{ formatFileSize(maxFileSize) }}
        </p>
        <p class="upload-types" v-if="acceptedTypes">
          支持格式: {{ acceptedTypes }}
        </p>
      </div>
      
      <div v-else class="file-list">
        <div 
          v-for="(file, index) in files" 
          :key="index" 
          class="file-item"
          :class="{ 'uploading': file.uploading, 'error': file.error }"
        >
          <!-- 文件预览 -->
          <div class="file-preview">
            <img 
              v-if="file.preview && file.type.startsWith('image/')" 
              :src="file.preview" 
              :alt="file.name"
              class="image-preview"
            />
            <div v-else class="file-icon">
              {{ getFileIcon(file.type) }}
            </div>
          </div>
          
          <!-- 文件信息 -->
          <div class="file-info">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-type">{{ file.type || 'unknown' }}</span>
            </div>
            
            <!-- 上传进度 -->
            <div v-if="file.uploading" class="upload-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${file.progress || 0}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ (file.progress || 0).toFixed(1) }}%</span>
            </div>
            
            <!-- 错误信息 -->
            <div v-if="file.error" class="file-error">
              {{ file.error }}
            </div>
            
            <!-- 成功状态 -->
            <div v-if="file.uploaded" class="file-success">
              ✅ 上传成功
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="file-actions">
            <button 
              v-if="!file.uploading && !file.uploaded"
              @click.stop="uploadFile(index)"
              class="action-btn upload-btn"
              title="上传文件"
            >
              ⬆️
            </button>
            
            <button 
              v-if="file.uploading"
              @click.stop="cancelUpload(index)"
              class="action-btn cancel-btn"
              title="取消上传"
            >
              ⏹️
            </button>
            
            <button 
              @click.stop="removeFile(index)"
              class="action-btn remove-btn"
              title="移除文件"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 批量操作 -->
    <div v-if="files.length > 0" class="batch-actions">
      <button 
        @click="uploadAllFiles"
        :disabled="allFilesUploaded || isUploading"
        class="batch-btn upload-all-btn"
      >
        {{ isUploading ? '上传中...' : '上传所有文件' }}
      </button>
      
      <button 
        @click="clearAllFiles"
        :disabled="isUploading"
        class="batch-btn clear-all-btn"
      >
        清空所有文件
      </button>
      
      <div class="upload-stats">
        <span>总计: {{ files.length }} 个文件</span>
        <span>大小: {{ formatFileSize(totalSize) }}</span>
        <span v-if="uploadedCount > 0">已上传: {{ uploadedCount }}</span>
      </div>
    </div>
    
    <!-- Base64 预览 -->
    <div v-if="showBase64Preview && base64Files.length > 0" class="base64-preview">
      <h4>Base64 编码预览</h4>
      <div class="base64-list">
        <div v-for="(file, index) in base64Files" :key="index" class="base64-item">
          <div class="base64-header">
            <span class="file-name">{{ file.name }}</span>
            <button @click="copyBase64(file.base64)" class="copy-btn">复制 Base64</button>
          </div>
          <textarea 
            :value="file.base64" 
            readonly 
            class="base64-textarea"
            rows="3"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface FileItem {
  file: File
  name: string
  size: number
  type: string
  preview?: string
  base64?: string
  uploading?: boolean
  uploaded?: boolean
  progress?: number
  error?: string
  cancelToken?: any
}

interface Props {
  maxFileSize?: number
  maxFiles?: number
  acceptedTypes?: string
  showBase64Preview?: boolean
  autoUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  acceptedTypes: '',
  showBase64Preview: false,
  autoUpload: false
})

const emit = defineEmits<{
  'update:modelValue': [files: File[]]
  'upload-progress': [progress: { file: FileItem; percentage: number }]
  'upload-complete': [files: FileItem[]]
  'upload-error': [error: { file: FileItem; message: string }]
  'files-changed': [files: FileItem[]]
}>()

const fileInput = ref<HTMLInputElement>()
const files = ref<FileItem[]>([])
const isDragOver = ref(false)

// 计算属性
const totalSize = computed(() => 
  files.value.reduce((total, file) => total + file.size, 0)
)

const uploadedCount = computed(() => 
  files.value.filter(file => file.uploaded).length
)

const allFilesUploaded = computed(() => 
  files.value.length > 0 && files.value.every(file => file.uploaded)
)

const isUploading = computed(() => 
  files.value.some(file => file.uploading)
)

const base64Files = computed(() => 
  files.value.filter(file => file.base64)
)

// 方法
const selectFiles = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
    target.value = '' // 清空input，允许重复选择同一文件
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const addFiles = async (newFiles: File[]) => {
  for (const file of newFiles) {
    // 检查文件数量限制
    if (files.value.length >= props.maxFiles) {
      alert(`最多只能上传 ${props.maxFiles} 个文件`)
      break
    }
    
    // 检查文件大小
    if (file.size > props.maxFileSize) {
      alert(`文件 "${file.name}" 大小超过限制 (${formatFileSize(props.maxFileSize)})`)
      continue
    }
    
    // 检查文件类型
    if (props.acceptedTypes && !isFileTypeAccepted(file)) {
      alert(`文件 "${file.name}" 类型不支持`)
      continue
    }
    
    const fileItem: FileItem = {
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }
    
    // 生成预览
    if (file.type.startsWith('image/')) {
      fileItem.preview = await createImagePreview(file)
      
      if (props.showBase64Preview) {
        fileItem.base64 = await createBase64(file)
      }
    }
    
    files.value.push(fileItem)
    
    // 自动上传
    if (props.autoUpload) {
      uploadFile(files.value.length - 1)
    }
  }
  
  emitFilesChanged()
}

const removeFile = (index: number) => {
  const file = files.value[index]
  
  // 如果正在上传，先取消
  if (file.uploading && file.cancelToken) {
    file.cancelToken.cancel('用户取消上传')
  }
  
  files.value.splice(index, 1)
  emitFilesChanged()
}

const clearAllFiles = () => {
  // 取消所有正在上传的文件
  files.value.forEach(file => {
    if (file.uploading && file.cancelToken) {
      file.cancelToken.cancel('用户清空文件')
    }
  })
  
  files.value = []
  emitFilesChanged()
}

const uploadFile = async (index: number) => {
  const fileItem = files.value[index]
  if (!fileItem || fileItem.uploading || fileItem.uploaded) return
  
  fileItem.uploading = true
  fileItem.progress = 0
  fileItem.error = ''
  
  try {
    // 模拟上传过程
    await simulateUpload(fileItem, (progress) => {
      fileItem.progress = progress
      emit('upload-progress', { file: fileItem, percentage: progress })
    })
    
    fileItem.uploaded = true
    fileItem.uploading = false
    
  } catch (error: any) {
    fileItem.error = error.message
    fileItem.uploading = false
    
    emit('upload-error', { file: fileItem, message: error.message })
  }
}

const uploadAllFiles = async () => {
  const unuploadedFiles = files.value
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => !file.uploaded && !file.uploading)
  
  for (const { index } of unuploadedFiles) {
    await uploadFile(index)
  }
  
  emit('upload-complete', files.value.filter(f => f.uploaded))
}

const cancelUpload = (index: number) => {
  const file = files.value[index]
  if (file.uploading && file.cancelToken) {
    file.cancelToken.cancel('用户取消上传')
  }
}

const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

const createBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      resolve(result.split(',')[1]) // 移除 data:image/...;base64, 前缀
    }
    reader.readAsDataURL(file)
  })
}

const simulateUpload = (fileItem: FileItem, onProgress: (progress: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        onProgress(progress)
        resolve()
      } else {
        onProgress(progress)
      }
    }, 200)
    
    // 创建取消令牌
    fileItem.cancelToken = {
      cancel: (reason: string) => {
        clearInterval(interval)
        reject(new Error(reason))
      }
    }
  })
}

const isFileTypeAccepted = (file: File): boolean => {
  if (!props.acceptedTypes) return true
  
  const acceptedTypes = props.acceptedTypes.split(',').map(type => type.trim())
  return acceptedTypes.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    } else {
      return file.type.includes(type)
    }
  })
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (type: string): string => {
  if (type.startsWith('image/')) return '🖼️'
  if (type.startsWith('video/')) return '🎥'
  if (type.startsWith('audio/')) return '🎵'
  if (type.includes('pdf')) return '📄'
  if (type.includes('text')) return '📝'
  if (type.includes('zip') || type.includes('rar')) return '📦'
  return '📁'
}

const copyBase64 = async (base64: string) => {
  try {
    await navigator.clipboard.writeText(base64)
    // 显示复制成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const emitFilesChanged = () => {
  const fileList = files.value.map(item => item.file)
  emit('update:modelValue', fileList)
  emit('files-changed', files.value)
}

// 监听器
watch(() => files.value, () => {
  emitFilesChanged()
}, { deep: true })
</script>

<style scoped>
.file-uploader {
  width: 100%;
}

.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9fafb;
}

.upload-zone:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-zone.drag-over {
  border-color: #10b981;
  background: #ecfdf5;
}

.upload-zone.has-files {
  text-align: left;
  padding: 15px;
}

.upload-prompt {
  padding: 20px;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.upload-types {
  font-size: 12px;
  color: #9ca3af;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.file-item.uploading {
  border-color: #3b82f6;
  background: #eff6ff;
}

.file-item.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.file-preview {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
  background: #f3f4f6;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 24px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 500;
}

.file-error {
  font-size: 12px;
  color: #ef4444;
}

.file-success {
  font-size: 12px;
  color: #10b981;
}

.file-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
}

.upload-btn {
  background: #3b82f6;
  color: white;
}

.upload-btn:hover {
  background: #2563eb;
}

.cancel-btn {
  background: #f59e0b;
  color: white;
}

.cancel-btn:hover {
  background: #d97706;
}

.remove-btn {
  background: #ef4444;
  color: white;
}

.remove-btn:hover {
  background: #dc2626;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.batch-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.upload-all-btn {
  background: #10b981;
  color: white;
}

.upload-all-btn:hover:not(:disabled) {
  background: #059669;
}

.clear-all-btn {
  background: #6b7280;
  color: white;
}

.clear-all-btn:hover:not(:disabled) {
  background: #4b5563;
}

.batch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-stats {
  margin-left: auto;
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
}

.base64-preview {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
}

.base64-preview h4 {
  margin: 0 0 12px 0;
  color: #374151;
}

.base64-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.base64-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 12px;
}

.base64-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.copy-btn {
  padding: 4px 8px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.copy-btn:hover {
  background: #2563eb;
}

.base64-textarea {
  width: 100%;
  font-family: monospace;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px;
  resize: vertical;
  background: #f9fafb;
}

@media (max-width: 768px) {
  .file-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .file-actions {
    align-self: flex-end;
  }
  
  .batch-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .upload-stats {
    margin-left: 0;
    justify-content: space-between;
  }
}
</style>
