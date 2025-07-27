/**
 * @ldesign/http 基础使用示例
 */

import {
  createAlovaHttpClient,
  createAuthInterceptor,
  createAxiosHttpClient,
  createCachePlugin,
  createFetchHttpClient,
  createHttpClient,
  createLogInterceptor,
  createQuickClient,
  createRetryPlugin,
} from '../src'

// 1. 基础使用
console.log('=== 基础使用 ===')

const basicClient = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
})

// GET 请求
async function fetchUsers() {
  try {
    const response = await basicClient.get('/users')
    console.log('用户列表:', response.data)
  }
 catch (error) {
    console.error('获取用户失败:', error)
  }
}

// POST 请求
async function createUser() {
  try {
    const response = await basicClient.post('/users', {
      name: 'John Doe',
      email: 'john@example.com',
    })
    console.log('创建用户成功:', response.data)
  }
 catch (error) {
    console.error('创建用户失败:', error)
  }
}

// 2. 不同适配器使用
console.log('=== 不同适配器使用 ===')

// Fetch 适配器
const fetchClient = createFetchHttpClient({
  baseURL: 'https://api.example.com',
})

// Axios 适配器
const axiosClient = createAxiosHttpClient({
  baseURL: 'https://api.example.com',
})

// Alova 适配器
const alovaClient = createAlovaHttpClient({
  baseURL: 'https://api.example.com',
})

// 3. 快速创建客户端
console.log('=== 快速创建客户端 ===')

const quickClient = createQuickClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  adapter: 'fetch',
  enableCache: true,
  enableRetry: true,
  enableLog: true,
  authToken: () => localStorage.getItem('token') || '',
})

// 4. 手动配置插件
console.log('=== 手动配置插件 ===')

const advancedClient = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
})

// 添加缓存插件
const cachePlugin = createCachePlugin({
  enabled: true,
  ttl: 5 * 60 * 1000, // 5分钟
})
cachePlugin.install(advancedClient)

// 添加重试插件
const retryPlugin = createRetryPlugin({
  retries: 3,
  retryDelay: 1000,
  strategy: 'exponential',
})
retryPlugin.install(advancedClient)

// 添加日志拦截器
const logInterceptors = createLogInterceptor({
  logRequests: true,
  logResponses: true,
  logErrors: true,
})
advancedClient.addRequestInterceptor(logInterceptors.request)
advancedClient.addResponseInterceptor(logInterceptors.response)

// 添加认证拦截器
const authInterceptor = createAuthInterceptor({
  getToken: () => localStorage.getItem('token') || '',
  tokenType: 'Bearer',
})
advancedClient.addRequestInterceptor(authInterceptor)

// 5. 错误处理示例
console.log('=== 错误处理示例 ===')

async function handleErrors() {
  try {
    const response = await advancedClient.get('/protected-resource')
    console.log('受保护资源:', response.data)
  }
 catch (error: any) {
    if (error.isNetworkError) {
      console.error('网络错误:', error.message)
    }
 else if (error.isTimeoutError) {
      console.error('请求超时:', error.message)
    }
 else if (error.response?.status === 401) {
      console.error('未授权，请重新登录')
    }
 else if (error.response?.status >= 500) {
      console.error('服务器错误:', error.response.status)
    }
 else {
      console.error('其他错误:', error.message)
    }
  }
}

// 6. 请求取消示例
console.log('=== 请求取消示例 ===')

async function cancelableRequest() {
  const cancelToken = advancedClient.createCancelToken()

  // 5秒后取消请求
  setTimeout(() => {
    cancelToken.cancel('用户取消了请求')
  }, 5000)

  try {
    const response = await advancedClient.get('/slow-endpoint', {
      cancelToken,
    })
    console.log('慢速请求完成:', response.data)
  }
 catch (error: any) {
    if (error.isCancelError) {
      console.log('请求被取消:', error.message)
    }
 else {
      console.error('请求失败:', error.message)
    }
  }
}

// 7. 事件监听示例
console.log('=== 事件监听示例 ===')

// 监听请求事件
advancedClient.on('request', (event) => {
  console.log('📤 发送请求:', event.config.method, event.config.url)
})

// 监听响应事件
advancedClient.on('response', (event) => {
  console.log('📥 收到响应:', event.response.status, event.response.config.url)
})

// 监听错误事件
advancedClient.on('error', (event) => {
  console.log('❌ 请求错误:', event.error.message)
})

// 监听重试事件
advancedClient.on('retry', (event) => {
  console.log('🔄 重试请求:', `第${event.retryCount}次重试`)
})

// 监听缓存事件
advancedClient.on('cache-hit', (event) => {
  console.log('💾 缓存命中:', event.config.url)
})

advancedClient.on('cache-miss', (event) => {
  console.log('🔍 缓存未命中:', event.config.url)
})

// 8. 进度监控示例
console.log('=== 进度监控示例 ===')

async function uploadWithProgress(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await advancedClient.post('/upload', formData, {
      onUploadProgress: (progress) => {
        console.log(`上传进度: ${progress.percentage}%`)
      },
    })
    console.log('上传完成:', response.data)
  }
 catch (error) {
    console.error('上传失败:', error)
  }
}

async function downloadWithProgress(url: string) {
  try {
    const response = await advancedClient.get(url, {
      responseType: 'blob',
      onDownloadProgress: (progress) => {
        console.log(`下载进度: ${progress.percentage}%`)
      },
    })
    console.log('下载完成:', response.data)
  }
 catch (error) {
    console.error('下载失败:', error)
  }
}

// 执行示例
async function runExamples() {
  console.log('开始执行示例...')

  await fetchUsers()
  await createUser()
  await handleErrors()
  await cancelableRequest()

  console.log('示例执行完成!')
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  runExamples()
}

export {
  basicClient,
  fetchClient,
  axiosClient,
  alovaClient,
  quickClient,
  advancedClient,
  runExamples,
}
