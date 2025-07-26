<template>
  <div class="response-viewer">
    <h3 class="response-title">📥 响应结果</h3>
    
    <!-- 错误响应 -->
    <div v-if="error" class="error-response">
      <div class="error-header">
        <h4>❌ 请求失败</h4>
        <div class="error-meta">
          <span class="error-time">{{ responseTime }}ms</span>
        </div>
      </div>
      
      <div class="error-details">
        <div class="error-info">
          <div class="error-row">
            <strong>错误类型:</strong> 
            <span>{{ getErrorType(error) }}</span>
          </div>
          <div class="error-row">
            <strong>状态码:</strong> 
            <span>{{ error.status || 'N/A' }}</span>
          </div>
          <div class="error-row">
            <strong>错误消息:</strong> 
            <span>{{ error.message }}</span>
          </div>
          <div v-if="error.response?.statusText" class="error-row">
            <strong>状态文本:</strong> 
            <span>{{ error.response.statusText }}</span>
          </div>
        </div>
        
        <div v-if="error.response?.data" class="error-data">
          <h5>响应数据:</h5>
          <pre class="error-data-content"><code>{{ formatJSON(error.response.data) }}</code></pre>
        </div>
        
        <div v-if="error.response?.headers" class="error-headers">
          <h5>响应头:</h5>
          <div class="headers-list">
            <div v-for="(value, key) in error.response.headers" :key="key" class="header-item">
              <strong>{{ key }}:</strong> <span>{{ value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 成功响应 -->
    <div v-if="response" class="success-response">
      <!-- 响应元信息 -->
      <div class="response-meta">
        <div class="status-info">
          <span class="status-badge" :class="getStatusClass(response.status)">
            {{ response.status }} {{ response.statusText }}
          </span>
          <span class="response-time">{{ responseTime }}ms</span>
          <span class="response-size">{{ getResponseSize() }}</span>
        </div>
        
        <div class="response-actions">
          <button @click="copyResponse" class="action-btn copy-btn" title="复制响应数据">
            📋 复制
          </button>
          <button @click="downloadResponse" class="action-btn download-btn" title="下载响应">
            💾 下载
          </button>
          <button @click="shareResponse" class="action-btn share-btn" title="分享响应">
            🔗 分享
          </button>
        </div>
      </div>
      
      <!-- 响应标签页 -->
      <div class="response-tabs">
        <button 
          v-for="tab in responseTabs" 
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="['response-tab', { active: activeTab === tab.key }]"
        >
          {{ tab.label }}
          <span v-if="getTabBadge(tab.key)" class="tab-badge">{{ getTabBadge(tab.key) }}</span>
        </button>
      </div>
      
      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 响应数据 -->
        <div v-if="activeTab === 'data'" class="response-data">
          <div class="data-toolbar">
            <div class="data-info">
              <span>数据类型: {{ getDataType() }}</span>
              <span v-if="isJsonData">格式: JSON</span>
            </div>
            <div class="data-actions">
              <button 
                v-if="isJsonData"
                @click="toggleJsonFormat" 
                class="format-btn"
              >
                {{ isJsonFormatted ? '压缩' : '格式化' }}
              </button>
              <button @click="copyData" class="format-btn">复制数据</button>
            </div>
          </div>
          
          <div class="data-content">
            <pre v-if="isJsonData" class="json-content"><code>{{ formattedJsonData }}</code></pre>
            <pre v-else-if="isTextData" class="text-content"><code>{{ response.data }}</code></pre>
            <div v-else-if="isBinaryData" class="binary-content">
              <div class="binary-info">
                <p>二进制数据 ({{ getResponseSize() }})</p>
                <button @click="downloadBinary" class="download-binary-btn">下载文件</button>
              </div>
            </div>
            <div v-else class="unknown-content">
              <p>未知数据类型</p>
              <pre><code>{{ String(response.data) }}</code></pre>
            </div>
          </div>
        </div>
        
        <!-- 响应头 -->
        <div v-if="activeTab === 'headers'" class="response-headers">
          <div class="headers-toolbar">
            <div class="headers-info">
              <span>共 {{ Object.keys(response.headers || {}).length }} 个响应头</span>
            </div>
            <button @click="copyHeaders" class="copy-headers-btn">复制所有响应头</button>
          </div>
          
          <div class="headers-content">
            <div v-for="(value, key) in response.headers" :key="key" class="header-item">
              <div class="header-key">{{ key }}</div>
              <div class="header-value">{{ value }}</div>
              <button @click="copyHeader(key, value)" class="copy-header-btn" title="复制此响应头">📋</button>
            </div>
          </div>
        </div>
        
        <!-- 原始响应 -->
        <div v-if="activeTab === 'raw'" class="raw-response">
          <div class="raw-toolbar">
            <div class="raw-info">
              <span>完整响应对象</span>
            </div>
            <button @click="copyRawResponse" class="copy-raw-btn">复制原始数据</button>
          </div>
          
          <pre class="raw-content"><code>{{ formatJSON(response) }}</code></pre>
        </div>
        
        <!-- cURL 命令 -->
        <div v-if="activeTab === 'curl'" class="curl-command">
          <div class="curl-toolbar">
            <div class="curl-info">
              <span>等效的 cURL 命令</span>
            </div>
            <button @click="copyCurl" class="copy-curl-btn">复制 cURL</button>
          </div>
          
          <pre class="curl-content"><code>{{ curlCommand }}</code></pre>
        </div>
        
        <!-- 时间线 -->
        <div v-if="activeTab === 'timeline'" class="response-timeline">
          <div class="timeline-info">
            <h4>请求时间线</h4>
            <p>总耗时: {{ responseTime }}ms</p>
          </div>
          
          <div class="timeline-chart">
            <div class="timeline-item">
              <div class="timeline-label">DNS 解析</div>
              <div class="timeline-bar dns-bar" :style="{ width: '10%' }"></div>
              <div class="timeline-time">~{{ Math.round(responseTime * 0.1) }}ms</div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-label">TCP 连接</div>
              <div class="timeline-bar tcp-bar" :style="{ width: '15%' }"></div>
              <div class="timeline-time">~{{ Math.round(responseTime * 0.15) }}ms</div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-label">TLS 握手</div>
              <div class="timeline-bar tls-bar" :style="{ width: '20%' }"></div>
              <div class="timeline-time">~{{ Math.round(responseTime * 0.2) }}ms</div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-label">请求发送</div>
              <div class="timeline-bar request-bar" :style="{ width: '5%' }"></div>
              <div class="timeline-time">~{{ Math.round(responseTime * 0.05) }}ms</div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-label">等待响应</div>
              <div class="timeline-bar waiting-bar" :style="{ width: '40%' }"></div>
              <div class="timeline-time">~{{ Math.round(responseTime * 0.4) }}ms</div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-label">内容下载</div>
              <div class="timeline-bar download-bar" :style="{ width: '10%' }"></div>
              <div class="timeline-time">~{{ Math.round(responseTime * 0.1) }}ms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  response?: any
  error?: any
  responseTime?: number
  requestConfig?: any
}

const props = withDefaults(defineProps<Props>(), {
  response: null,
  error: null,
  responseTime: 0,
  requestConfig: null
})

const emit = defineEmits<{
  'copy-curl': [command: string]
  'download-response': [data: any, filename: string]
}>()

const activeTab = ref('data')
const isJsonFormatted = ref(true)

// 响应标签页
const responseTabs = [
  { key: 'data', label: '响应数据' },
  { key: 'headers', label: '响应头' },
  { key: 'raw', label: '原始数据' },
  { key: 'curl', label: 'cURL' },
  { key: 'timeline', label: '时间线' }
]

// 计算属性
const isJsonData = computed(() => {
  if (!props.response?.data) return false
  return typeof props.response.data === 'object' || 
         (typeof props.response.data === 'string' && isValidJson(props.response.data))
})

const isTextData = computed(() => {
  return typeof props.response?.data === 'string' && !isJsonData.value
})

const isBinaryData = computed(() => {
  return props.response?.data instanceof ArrayBuffer || 
         props.response?.data instanceof Blob
})

const formattedJsonData = computed(() => {
  if (!isJsonData.value) return ''
  
  try {
    const data = typeof props.response.data === 'string' 
      ? JSON.parse(props.response.data) 
      : props.response.data
    
    return isJsonFormatted.value 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data)
  } catch (e) {
    return String(props.response.data)
  }
})

const curlCommand = computed(() => {
  if (!props.requestConfig) return ''
  
  const config = props.requestConfig
  let curl = `curl -X ${config.method?.toUpperCase() || 'GET'}`
  
  // 添加URL
  curl += ` "${config.url}"`
  
  // 添加请求头
  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      curl += ` \\\n  -H "${key}: ${value}"`
    })
  }
  
  // 添加请求体
  if (config.data) {
    const dataStr = typeof config.data === 'string' 
      ? config.data 
      : JSON.stringify(config.data)
    curl += ` \\\n  -d '${dataStr}'`
  }
  
  // 添加查询参数
  if (config.params) {
    const params = new URLSearchParams(config.params).toString()
    if (params) {
      const separator = config.url.includes('?') ? '&' : '?'
      curl = curl.replace(config.url, `${config.url}${separator}${params}`)
    }
  }
  
  return curl
})

// 方法
const getErrorType = (error: any): string => {
  if (error.isNetworkError) return '网络错误'
  if (error.isTimeoutError) return '超时错误'
  if (error.isCancelError) return '请求取消'
  if (error.status) return 'HTTP 错误'
  return '未知错误'
}

const getStatusClass = (status: number): string => {
  if (status >= 200 && status < 300) return 'status-success'
  if (status >= 300 && status < 400) return 'status-redirect'
  if (status >= 400 && status < 500) return 'status-client-error'
  return 'status-server-error'
}

const getResponseSize = (): string => {
  if (!props.response?.data) return '0 B'
  
  let size = 0
  if (typeof props.response.data === 'string') {
    size = new Blob([props.response.data]).size
  } else if (props.response.data instanceof ArrayBuffer) {
    size = props.response.data.byteLength
  } else if (props.response.data instanceof Blob) {
    size = props.response.data.size
  } else {
    size = new Blob([JSON.stringify(props.response.data)]).size
  }
  
  return formatFileSize(size)
}

const getDataType = (): string => {
  if (!props.response?.data) return 'empty'
  if (isJsonData.value) return 'JSON'
  if (isTextData.value) return 'Text'
  if (isBinaryData.value) return 'Binary'
  return typeof props.response.data
}

const getTabBadge = (tabKey: string): string | null => {
  switch (tabKey) {
    case 'headers':
      return Object.keys(props.response?.headers || {}).length.toString()
    case 'data':
      return getResponseSize()
    default:
      return null
  }
}

const formatJSON = (data: any): string => {
  try {
    return JSON.stringify(data, null, 2)
  } catch (e) {
    return String(data)
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const isValidJson = (str: string): boolean => {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}

const toggleJsonFormat = () => {
  isJsonFormatted.value = !isJsonFormatted.value
}

const copyData = async () => {
  try {
    const data = isJsonData.value ? formattedJsonData.value : String(props.response.data)
    await navigator.clipboard.writeText(data)
    // 显示复制成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(formatJSON(props.response.data))
    // 显示复制成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const copyHeaders = async () => {
  try {
    const headersText = Object.entries(props.response.headers || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
    await navigator.clipboard.writeText(headersText)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const copyHeader = async (key: string, value: string) => {
  try {
    await navigator.clipboard.writeText(`${key}: ${value}`)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const copyRawResponse = async () => {
  try {
    await navigator.clipboard.writeText(formatJSON(props.response))
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const copyCurl = async () => {
  try {
    await navigator.clipboard.writeText(curlCommand.value)
    emit('copy-curl', curlCommand.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const downloadResponse = () => {
  const filename = `response_${Date.now()}.json`
  emit('download-response', props.response.data, filename)
}

const downloadBinary = () => {
  if (props.response.data instanceof Blob) {
    const url = URL.createObjectURL(props.response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `binary_${Date.now()}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

const shareResponse = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'API 响应数据',
        text: formatJSON(props.response.data)
      })
    } catch (error) {
      console.error('分享失败:', error)
    }
  } else {
    // 降级到复制链接
    copyResponse()
  }
}
</script>

<style scoped>
.response-viewer {
  margin-top: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.response-title {
  margin: 0;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-size: 18px;
}

.error-response {
  padding: 20px;
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.error-header h4 {
  margin: 0;
  color: #dc2626;
}

.error-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}

.error-time {
  background: #fee2e2;
  padding: 4px 8px;
  border-radius: 4px;
  color: #dc2626;
}

.error-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-row {
  display: flex;
  gap: 8px;
}

.error-row strong {
  min-width: 80px;
  color: #374151;
}

.error-data,
.error-headers {
  background: white;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 12px;
}

.error-data h5,
.error-headers h5 {
  margin: 0 0 8px 0;
  color: #dc2626;
  font-size: 14px;
}

.error-data-content {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 8px;
  margin: 0;
  font-size: 12px;
  overflow-x: auto;
}

.success-response {
  background: #f0fff4;
  border-left: 4px solid #10b981;
}

.response-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ecfdf5;
  border-bottom: 1px solid #d1fae5;
}

.status-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-redirect {
  background: #fef3c7;
  color: #92400e;
}

.status-client-error,
.status-server-error {
  background: #fecaca;
  color: #991b1b;
}

.response-time,
.response-size {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.response-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.copy-btn {
  background: #3b82f6;
  color: white;
}

.copy-btn:hover {
  background: #2563eb;
}

.download-btn {
  background: #10b981;
  color: white;
}

.download-btn:hover {
  background: #059669;
}

.share-btn {
  background: #8b5cf6;
  color: white;
}

.share-btn:hover {
  background: #7c3aed;
}

.response-tabs {
  display: flex;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.response-tab {
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.response-tab:hover {
  color: #374151;
  background: #f3f4f6;
}

.response-tab.active {
  color: #10b981;
  border-bottom-color: #10b981;
  background: white;
}

.tab-badge {
  background: #e5e7eb;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.response-tab.active .tab-badge {
  background: #d1fae5;
  color: #065f46;
}

.tab-content {
  padding: 20px;
}

.data-toolbar,
.headers-toolbar,
.raw-toolbar,
.curl-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.data-info,
.headers-info,
.raw-info,
.curl-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
}

.data-actions {
  display: flex;
  gap: 8px;
}

.format-btn,
.copy-headers-btn,
.copy-raw-btn,
.copy-curl-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  transition: all 0.2s ease;
}

.format-btn:hover,
.copy-headers-btn:hover,
.copy-raw-btn:hover,
.copy-curl-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.json-content,
.text-content,
.raw-content,
.curl-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  margin: 0;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.binary-content,
.unknown-content {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.binary-info p {
  margin-bottom: 16px;
  font-size: 16px;
}

.download-binary-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.download-binary-btn:hover {
  background: #2563eb;
}

.headers-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-item {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.header-key {
  font-weight: 500;
  color: #374151;
  word-break: break-all;
}

.header-value {
  color: #6b7280;
  word-break: break-all;
  font-family: monospace;
  font-size: 12px;
}

.copy-header-btn {
  padding: 4px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.copy-header-btn:hover {
  background: #e5e7eb;
}

.timeline-info {
  margin-bottom: 20px;
}

.timeline-info h4 {
  margin: 0 0 8px 0;
  color: #374151;
}

.timeline-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  gap: 12px;
  align-items: center;
}

.timeline-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.timeline-bar {
  height: 8px;
  border-radius: 4px;
  position: relative;
  background: #e5e7eb;
}

.dns-bar { background: #3b82f6; }
.tcp-bar { background: #10b981; }
.tls-bar { background: #f59e0b; }
.request-bar { background: #ef4444; }
.waiting-bar { background: #8b5cf6; }
.download-bar { background: #06b6d4; }

.timeline-time {
  font-size: 12px;
  color: #6b7280;
  text-align: right;
}

@media (max-width: 768px) {
  .response-meta {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .response-tabs {
    overflow-x: auto;
  }
  
  .header-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .timeline-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .data-toolbar,
  .headers-toolbar,
  .raw-toolbar,
  .curl-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
