<template>
  <div class="api-tester">
    <!-- 快速示例按钮 -->
    <div class="quick-examples">
      <h4>🚀 快速示例</h4>
      <div class="example-buttons">
        <button
          v-for="(example, key) in examples"
          :key="key"
          @click="loadExample(key)"
          class="example-btn"
        >
          {{ example.name }}
        </button>
      </div>
    </div>

    <!-- 请求配置区域 -->
    <div class="request-section">
      <div class="method-url-row">
        <select v-model="requestConfig.method" class="method-select">
          <option v-for="method in httpMethods" :key="method" :value="method">
            {{ method }}
          </option>
        </select>

        <input
          v-model="requestConfig.url"
          placeholder="输入 API URL (例如: https://jsonplaceholder.typicode.com/users)"
          class="url-input"
          @keyup.enter="sendRequest"
        />

        <button
          @click="sendRequest"
          :disabled="loading"
          class="send-button"
          :class="{ loading }"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '发送中...' : '发送请求' }}
        </button>
      </div>

      <!-- 标签页 -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="['tab', { active: activeTab === tab.key }]"
        >
          {{ tab.label }}
          <span v-if="getTabCount(tab.key)" class="tab-count">{{ getTabCount(tab.key) }}</span>
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 查询参数 -->
        <div v-if="activeTab === 'params'" class="params-section">
          <div class="section-header">
            <h4>查询参数</h4>
            <button @click="addParam" class="add-btn">+ 添加</button>
          </div>
          <div class="param-list">
            <div v-for="(param, index) in queryParams" :key="index" class="param-row">
              <input
                v-model="param.key"
                placeholder="参数名"
                class="param-input"
                @input="updateParamCount"
              />
              <input
                v-model="param.value"
                placeholder="参数值"
                class="param-input"
                @input="updateParamCount"
              />
              <button @click="removeParam(index)" class="remove-btn" title="删除">×</button>
            </div>
          </div>
        </div>

        <!-- 请求头 -->
        <div v-if="activeTab === 'headers'" class="headers-section">
          <div class="section-header">
            <h4>请求头</h4>
            <button @click="addHeader" class="add-btn">+ 添加</button>
          </div>
          <div class="header-list">
            <div v-for="(header, index) in requestHeaders" :key="index" class="param-row">
              <input
                v-model="header.key"
                placeholder="Header 名称"
                class="param-input"
                @input="updateHeaderCount"
              />
              <input
                v-model="header.value"
                placeholder="Header 值"
                class="param-input"
                @input="updateHeaderCount"
              />
              <button @click="removeHeader(index)" class="remove-btn" title="删除">×</button>
            </div>
          </div>
        </div>

        <!-- 请求体 -->
        <div v-if="activeTab === 'body'" class="body-section">
          <div class="section-header">
            <h4>请求体</h4>
            <div class="body-type-selector">
              <label v-for="type in bodyTypes" :key="type.value">
                <input
                  type="radio"
                  v-model="bodyType"
                  :value="type.value"
                  @change="onBodyTypeChange"
                />
                {{ type.label }}
              </label>
            </div>
          </div>

          <!-- JSON 格式 -->
          <div v-if="bodyType === 'json'" class="json-body">
            <div class="json-toolbar">
              <button @click="formatJson" class="format-btn">格式化</button>
              <button @click="minifyJson" class="format-btn">压缩</button>
              <button @click="clearBody" class="format-btn">清空</button>
            </div>
            <textarea
              v-model="requestBody"
              placeholder='输入 JSON 数据，例如: {"title": "新文章", "body": "文章内容"}'
              class="body-textarea json-textarea"
              rows="8"
              @input="validateJson"
            ></textarea>
            <div v-if="jsonError" class="json-error">{{ jsonError }}</div>
          </div>

          <!-- Form Data 格式 -->
          <div v-if="bodyType === 'form'" class="form-data">
            <div class="section-header">
              <span>表单数据</span>
              <button @click="addFormField" class="add-btn">+ 添加字段</button>
            </div>
            <div v-for="(field, index) in formData" :key="index" class="param-row">
              <input
                v-model="field.key"
                placeholder="字段名"
                class="param-input"
              />
              <input
                v-model="field.value"
                placeholder="字段值"
                class="param-input"
              />
              <button @click="removeFormField(index)" class="remove-btn" title="删除">×</button>
            </div>
          </div>

          <!-- 文件上传 -->
          <div v-if="bodyType === 'file'" class="file-upload">
            <FileUploader
              v-model="uploadedFiles"
              @upload-progress="onUploadProgress"
              @upload-complete="onUploadComplete"
              @upload-error="onUploadError"
            />
          </div>

          <!-- Raw Text 格式 -->
          <div v-if="bodyType === 'raw'" class="raw-body">
            <textarea
              v-model="rawText"
              placeholder="输入原始文本数据"
              class="body-textarea"
              rows="8"
            ></textarea>
          </div>
        </div>

        <!-- 配置选项 -->
        <div v-if="activeTab === 'config'" class="config-section">
          <h4>请求配置</h4>
          <div class="config-grid">
            <div class="config-item">
              <label>超时时间 (毫秒):</label>
              <input
                v-model.number="requestConfig.timeout"
                type="number"
                class="config-input"
                min="1000"
                max="60000"
              />
            </div>

            <div class="config-item">
              <label>响应类型:</label>
              <select v-model="requestConfig.responseType" class="config-select">
                <option value="json">JSON</option>
                <option value="text">Text</option>
                <option value="blob">Blob</option>
                <option value="arraybuffer">ArrayBuffer</option>
              </select>
            </div>

            <div class="config-item checkbox-item">
              <label>
                <input type="checkbox" v-model="requestConfig.withCredentials" />
                包含凭据 (withCredentials)
              </label>
            </div>

            <div class="config-item checkbox-item">
              <label>
                <input type="checkbox" v-model="enableCache" />
                启用缓存
              </label>
            </div>

            <div class="config-item checkbox-item">
              <label>
                <input type="checkbox" v-model="enableRetry" />
                启用重试
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 响应区域 -->
    <ResponseViewer
      v-if="response || error"
      :response="response"
      :error="error"
      :response-time="responseTime"
      :request-config="lastRequestConfig"
      @copy-curl="copyCurlCommand"
      @download-response="downloadResponse"
    />

    <!-- 请求历史 -->
    <RequestHistory
      v-if="requestHistory.length > 0"
      :history="requestHistory"
      :favorites="favorites"
      @load-request="loadFromHistory"
      @toggle-favorite="toggleFavorite"
      @clear-history="clearHistory"
    />

    <!-- 全局错误提示 -->
    <ErrorToast
      v-if="showErrorToast"
      :error="lastError"
      @close="showErrorToast = false"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useErrorHandler } from '../composables/useErrorHandler'
import { useHttpClient } from '../composables/useHttpClient'
import { useRequestHistory } from '../composables/useRequestHistory'
import ErrorToast from './ErrorToast.vue'
import FileUploader from './FileUploader.vue'
import RequestHistory from './RequestHistory.vue'
import ResponseViewer from './ResponseViewer.vue'

// 组合式函数
const { client, loading, sendHttpRequest } = useHttpClient()
const { requestHistory, favorites, addToHistory, toggleFavorite, clearHistory } = useRequestHistory()
const { handleError, showErrorToast, lastError } = useErrorHandler()

// HTTP 方法
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

// 请求体类型
const bodyTypes = [
  { value: 'json', label: 'JSON' },
  { value: 'form', label: 'Form Data' },
  { value: 'file', label: '文件上传' },
  { value: 'raw', label: 'Raw Text' }
]

// 标签页
const tabs = [
  { key: 'params', label: '查询参数' },
  { key: 'headers', label: '请求头' },
  { key: 'body', label: '请求体' },
  { key: 'config', label: '配置' }
]

// 响应式数据
const activeTab = ref('params')
const bodyType = ref('json')
const enableCache = ref(false)
const enableRetry = ref(false)

const requestConfig = reactive({
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/users',
  timeout: 10000,
  withCredentials: false,
  responseType: 'json'
})

const queryParams = ref([{ key: '', value: '' }])
const requestHeaders = ref([{ key: '', value: '' }])
const formData = ref([{ key: '', value: '' }])
const uploadedFiles = ref([])

const requestBody = ref('')
const rawText = ref('')
const jsonError = ref('')

const response = ref(null)
const error = ref(null)
const responseTime = ref(0)
const lastRequestConfig = ref(null)

// 快速示例
const examples = {
  users: {
    name: '获取用户列表',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users',
    params: [],
    headers: []
  },
  posts: {
    name: '获取文章列表',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: [{ key: '_limit', value: '5' }],
    headers: []
  },
  createPost: {
    name: '创建文章',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: [],
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: JSON.stringify({
      title: '新文章标题',
      body: '这是文章的内容...',
      userId: 1
    }, null, 2)
  },
  github: {
    name: 'GitHub 用户',
    method: 'GET',
    url: 'https://api.github.com/users/octocat',
    params: [],
    headers: [{ key: 'Accept', value: 'application/vnd.github.v3+json' }]
  }
}

// 计算属性
const getTabCount = (tabKey: string) => {
  switch (tabKey) {
    case 'params':
      return queryParams.value.filter(p => p.key && p.value).length || null
    case 'headers':
      return requestHeaders.value.filter(h => h.key && h.value).length || null
    case 'body':
      if (bodyType.value === 'json' && requestBody.value.trim()) return '1'
      if (bodyType.value === 'form' && formData.value.some(f => f.key && f.value)) return '1'
      if (bodyType.value === 'file' && uploadedFiles.value.length) return uploadedFiles.value.length
      if (bodyType.value === 'raw' && rawText.value.trim()) return '1'
      return null
    default:
      return null
  }
}

// 方法
const addParam = () => {
  queryParams.value.push({ key: '', value: '' })
}

const removeParam = (index: number) => {
  queryParams.value.splice(index, 1)
  if (queryParams.value.length === 0) {
    queryParams.value.push({ key: '', value: '' })
  }
}

const addHeader = () => {
  requestHeaders.value.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  requestHeaders.value.splice(index, 1)
  if (requestHeaders.value.length === 0) {
    requestHeaders.value.push({ key: '', value: '' })
  }
}

const addFormField = () => {
  formData.value.push({ key: '', value: '' })
}

const removeFormField = (index: number) => {
  formData.value.splice(index, 1)
  if (formData.value.length === 0) {
    formData.value.push({ key: '', value: '' })
  }
}

const updateParamCount = () => {
  // 触发响应式更新
}

const updateHeaderCount = () => {
  // 触发响应式更新
}

const onBodyTypeChange = () => {
  jsonError.value = ''
}

const validateJson = () => {
  if (!requestBody.value.trim()) {
    jsonError.value = ''
    return
  }

  try {
    JSON.parse(requestBody.value)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = '无效的 JSON 格式'
  }
}

const formatJson = () => {
  try {
    const parsed = JSON.parse(requestBody.value)
    requestBody.value = JSON.stringify(parsed, null, 2)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = '无法格式化：无效的 JSON'
  }
}

const minifyJson = () => {
  try {
    const parsed = JSON.parse(requestBody.value)
    requestBody.value = JSON.stringify(parsed)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = '无法压缩：无效的 JSON'
  }
}

const clearBody = () => {
  requestBody.value = ''
  jsonError.value = ''
}

const loadExample = (exampleKey: string) => {
  const example = examples[exampleKey]
  if (!example) return

  requestConfig.method = example.method
  requestConfig.url = example.url

  queryParams.value = example.params.length > 0 ? [...example.params] : [{ key: '', value: '' }]
  requestHeaders.value = example.headers.length > 0 ? [...example.headers] : [{ key: '', value: '' }]

  if (example.body) {
    requestBody.value = example.body
    bodyType.value = 'json'
    activeTab.value = 'body'
  }
}

const sendRequest = async () => {
  try {
    const startTime = Date.now()

    // 构建请求配置
    const config = {
      method: requestConfig.method,
      url: requestConfig.url,
      timeout: requestConfig.timeout,
      withCredentials: requestConfig.withCredentials,
      responseType: requestConfig.responseType
    }

    // 添加查询参数
    const params = {}
    queryParams.value.forEach(param => {
      if (param.key && param.value) {
        params[param.key] = param.value
      }
    })
    if (Object.keys(params).length > 0) {
      config.params = params
    }

    // 添加请求头
    const headers = {}
    requestHeaders.value.forEach(header => {
      if (header.key && header.value) {
        headers[header.key] = header.value
      }
    })
    if (Object.keys(headers).length > 0) {
      config.headers = headers
    }

    // 添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(requestConfig.method)) {
      if (bodyType.value === 'json' && requestBody.value.trim()) {
        try {
          config.data = JSON.parse(requestBody.value)
        } catch (e) {
          config.data = requestBody.value
        }
      } else if (bodyType.value === 'form') {
        const formDataObj = {}
        formData.value.forEach(field => {
          if (field.key && field.value) {
            formDataObj[field.key] = field.value
          }
        })
        config.data = formDataObj
      } else if (bodyType.value === 'file' && uploadedFiles.value.length > 0) {
        const formDataObj = new FormData()
        uploadedFiles.value.forEach((file, index) => {
          formDataObj.append(`file_${index}`, file)
        })
        config.data = formDataObj
      } else if (bodyType.value === 'raw' && rawText.value.trim()) {
        config.data = rawText.value
      }
    }

    // 发送请求
    const result = await sendHttpRequest(config, { enableCache: enableCache.value, enableRetry: enableRetry.value })

    response.value = result
    error.value = null
    responseTime.value = Date.now() - startTime
    lastRequestConfig.value = config

    // 添加到历史记录
    addToHistory({
      method: config.method,
      url: config.url,
      status: result.status,
      timestamp: Date.now(),
      config
    })

  } catch (err) {
    error.value = err
    response.value = null
    responseTime.value = Date.now() - startTime

    // 处理错误
    handleError(err)

    // 添加错误到历史记录
    addToHistory({
      method: requestConfig.method,
      url: requestConfig.url,
      status: null,
      timestamp: Date.now(),
      error: err.message
    })
  }
}

const loadFromHistory = (item) => {
  if (item.config) {
    requestConfig.method = item.config.method
    requestConfig.url = item.config.url

    // 重置参数
    queryParams.value = [{ key: '', value: '' }]
    requestHeaders.value = [{ key: '', value: '' }]

    // 加载参数
    if (item.config.params) {
      queryParams.value = Object.entries(item.config.params).map(([key, value]) => ({ key, value }))
    }

    // 加载请求头
    if (item.config.headers) {
      requestHeaders.value = Object.entries(item.config.headers).map(([key, value]) => ({ key, value }))
    }

    // 加载请求体
    if (item.config.data) {
      if (typeof item.config.data === 'string') {
        rawText.value = item.config.data
        bodyType.value = 'raw'
      } else {
        requestBody.value = JSON.stringify(item.config.data, null, 2)
        bodyType.value = 'json'
      }
      activeTab.value = 'body'
    }
  }
}

const copyCurlCommand = (curlCommand) => {
  navigator.clipboard.writeText(curlCommand).then(() => {
    // 显示复制成功提示
  })
}

const downloadResponse = (data, filename = 'response.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const onUploadProgress = (progress) => {
  // 处理上传进度
}

const onUploadComplete = (files) => {
  uploadedFiles.value = files
}

const onUploadError = (error) => {
  handleError(error)
}

// 监听器
watch(() => requestConfig.method, (newMethod) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(newMethod)) {
    activeTab.value = 'params'
  }
})

onMounted(() => {
  // 组件挂载后的初始化
})
</script>

<style scoped>
.api-tester {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.quick-examples {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quick-examples h4 {
  margin: 0 0 15px 0;
  color: #2d3748;
}

.example-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.example-btn {
  padding: 8px 16px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.example-btn:hover {
  background: #3182ce;
}

.request-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.method-url-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.method-select {
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  min-width: 100px;
}

.url-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.send-button {
  padding: 10px 20px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.send-button:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.send-button.loading {
  background: #4299e1;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  color: #718096;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab.active {
  color: #4299e1;
  border-bottom-color: #4299e1;
}

.tab:hover {
  color: #4299e1;
}

.tab-count {
  background: #e2e8f0;
  color: #718096;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.tab.active .tab-count {
  background: #bee3f8;
  color: #2b6cb0;
}

.tab-content {
  min-height: 200px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  color: #2d3748;
  font-size: 16px;
}

.param-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.param-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

.remove-btn {
  padding: 8px 12px;
  background: #f56565;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn {
  padding: 8px 16px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.body-type-selector {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.body-type-selector label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 14px;
}

.json-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.format-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
}

.format-btn:hover {
  background: #f3f4f6;
}

.body-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  resize: vertical;
  background: #f8fafc;
}

.json-textarea {
  background: #f8fafc;
}

.json-error {
  margin-top: 8px;
  padding: 8px;
  background: #fed7d7;
  color: #742a2a;
  border-radius: 4px;
  font-size: 12px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.checkbox-item {
  flex-direction: row;
  align-items: center;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.config-input,
.config-select {
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .method-url-row {
    flex-direction: column;
  }

  .example-buttons {
    flex-direction: column;
  }

  .param-row {
    flex-direction: column;
    align-items: stretch;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }

  .body-type-selector {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
