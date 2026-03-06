<script setup lang="ts">
import { ref } from 'vue'
import { Code, Play, Trash2, RefreshCw } from 'lucide-vue-next'
import {
  createHttpClient,
  CacheManager,
  MemoryCacheStorage,
  RetryManager,
  createCancelTokenSource,
  createNetworkMonitor,
  HttpDevTools,
  buildURL,
  mergeConfig,
  generateRequestKey,
  isHttpError,
  isSuccessStatus,
  isClientError,
  isServerError,
  ErrorClassifier,
  HttpStatus,
  deepClone,
  buildQueryString,
} from '@ldesign/http-core'

const log = ref<string[]>([])
const resultJson = ref('')

function addLog(msg: string) {
  log.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

// 1. createHttpClient 基础用法
async function demoCreateClient() {
  log.value = []
  resultJson.value = ''
  addLog('正在创建 HTTP 客户端...')

  const client = await createHttpClient({ adapter: 'fetch' })
  addLog('客户端创建成功')

  addLog('发送 GET /api/users ...')
  const res = await client.get('/api/users')
  addLog(`响应状态: ${res.status}`)
  addLog(`数据条数: ${(res.data as any)?.data?.length || 0}`)
  resultJson.value = JSON.stringify(res.data, null, 2)
}

// 2. CacheManager
async function demoCacheManager() {
  log.value = []
  resultJson.value = ''

  const storage = new MemoryCacheStorage()
  const cache = new CacheManager(storage, { defaultTTL: 5000 })

  addLog('创建 CacheManager（TTL: 5000ms）')
  addLog('写入缓存: key="users"')
  await cache.set('users', { data: [{ id: 1, name: 'Alice' }] })

  const cached = await cache.get('users')
  addLog(`读取缓存: ${JSON.stringify(cached)}`)

  const has = await cache.has('users')
  addLog(`缓存是否存在: ${has}`)

  await cache.delete('users')
  addLog('已删除缓存')

  const hasAfter = await cache.has('users')
  addLog(`删除后是否存在: ${hasAfter}`)
}

// 3. CancelToken 取消令牌
async function demoCancelToken() {
  log.value = []
  resultJson.value = ''

  addLog('创建取消令牌源...')
  const source = createCancelTokenSource()

  addLog('模拟在 100ms 后取消请求')
  setTimeout(() => {
    source.cancel('用户主动取消')
    addLog('已发送取消信号')
  }, 100)

  try {
    const client = await createHttpClient({ adapter: 'fetch' })
    addLog('发送 GET /api/slow（慢请求，3s）...')
    await client.get('/api/slow', { signal: source.token.promise as any })
    addLog('请求完成（不应执行到此）')
  } catch (e: any) {
    addLog(`请求被取消: ${e.message}`)
  }
}

// 4. RetryManager
async function demoRetryManager() {
  log.value = []
  resultJson.value = ''

  const retry = new RetryManager({
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 2000,
  })

  addLog('RetryManager 配置: maxRetries=3, baseDelay=500ms')

  let attempt = 0
  try {
    const result = await retry.execute(async () => {
      attempt++
      addLog(`第 ${attempt} 次尝试...`)
      if (attempt < 3) {
        throw new Error(`模拟失败 (第 ${attempt} 次)`)
      }
      return { success: true, data: '请求成功' }
    })
    addLog(`最终成功: ${JSON.stringify(result)}`)
    resultJson.value = JSON.stringify(result, null, 2)
  } catch (e: any) {
    addLog(`最终失败: ${e.message}`)
  }
}

// 5. 工具函数
function demoUtilities() {
  log.value = []
  resultJson.value = ''

  // buildURL
  const url = buildURL('/api/users', { page: 1, limit: 10, q: '张' })
  addLog(`buildURL('/api/users', {page:1, limit:10, q:'张'}):`)
  addLog(`  → ${url}`)

  // mergeConfig
  const config = mergeConfig(
    { timeout: 5000, headers: { 'X-App': 'demo' } },
    { timeout: 10000, headers: { 'Authorization': 'Bearer xxx' } },
  )
  addLog(`mergeConfig 结果:`)
  addLog(`  → timeout: ${config.timeout}`)
  addLog(`  → headers: ${JSON.stringify(config.headers)}`)

  // generateRequestKey
  const key = generateRequestKey({ url: '/api/users', method: 'GET', params: { page: 1 } })
  addLog(`generateRequestKey:`)
  addLog(`  → ${key}`)

  // buildQueryString
  const qs = buildQueryString({ name: 'Alice', role: 'admin', tags: ['a', 'b'] })
  addLog(`buildQueryString({name:'Alice', role:'admin', tags:['a','b']}):`)
  addLog(`  → ${qs}`)

  // HttpStatus
  addLog(`HttpStatus.OK = ${HttpStatus.OK}`)
  addLog(`HttpStatus.NOT_FOUND = ${HttpStatus.NOT_FOUND}`)
  addLog(`HttpStatus.INTERNAL_SERVER_ERROR = ${HttpStatus.INTERNAL_SERVER_ERROR}`)

  // 状态码判断
  addLog(`isSuccessStatus(200) = ${isSuccessStatus(200)}`)
  addLog(`isClientError(404) = ${isClientError(404)}`)
  addLog(`isServerError(500) = ${isServerError(500)}`)

  // deepClone
  const original = { a: 1, b: { c: [1, 2, 3] } }
  const cloned = deepClone(original)
  cloned.b.c.push(4)
  addLog(`deepClone: 原始 b.c 长度=${original.b.c.length}, 克隆后 b.c 长度=${cloned.b.c.length}`)
}

// 6. HttpDevTools
async function demoDevTools() {
  log.value = []
  resultJson.value = ''

  addLog('创建 HttpDevTools 实例...')
  const devtools = new HttpDevTools({ enabled: true, logToConsole: false })

  const client = await createHttpClient({ adapter: 'fetch' })
  devtools.attach(client)
  addLog('已附加到 HTTP 客户端')

  addLog('发送 GET /api/users ...')
  await client.get('/api/users')

  addLog('发送 GET /api/server-time ...')
  await client.get('/api/server-time')

  const stats = devtools.getStats()
  addLog(`统计: 总请求=${stats.total}, 成功=${stats.success}, 平均耗时=${stats.averageDuration}ms`)

  const records = devtools.getRecords()
  resultJson.value = JSON.stringify(records.map(r => ({
    url: r.config.url,
    status: r.status,
    duration: r.duration,
  })), null, 2)

  devtools.detach()
  addLog('已分离 DevTools')
}

// 7. NetworkMonitor
function demoNetworkMonitor() {
  log.value = []
  resultJson.value = ''

  addLog('创建 NetworkMonitor ...')
  const monitor = createNetworkMonitor()

  addLog(`在线状态: ${monitor.isOnline()}`)
  addLog(`网络状态: ${JSON.stringify(monitor.getStatus())}`)

  const info = monitor.getNetworkInfo()
  addLog(`网络信息:`)
  addLog(`  在线: ${info.online}`)
  addLog(`  连接类型: ${info.connectionType}`)
  addLog(`  有效类型: ${info.effectiveType}`)
  addLog(`  下行速度: ${info.downlink} Mbps`)
  addLog(`  往返时间: ${info.rtt}ms`)

  monitor.destroy()
  addLog('已销毁 NetworkMonitor')
}

function clearLog() {
  log.value = []
  resultJson.value = ''
}
</script>

<template>
  <div class="demo-page">
    <h2>Core 原生 JS 用法</h2>
    <p class="page-desc">
      <code>@ldesign/http-core</code> 是框架无关的 HTTP 客户端核心库，可在任何 JavaScript 环境中使用，不依赖 Vue。
      以下展示了 Core 包的所有主要功能。
    </p>

    <div class="card">
      <h3><Code :size="18" /> 功能演示</h3>
      <div class="btn-group">
        <button class="btn btn-primary" @click="demoCreateClient">
          <Play :size="14" /> createHttpClient
        </button>
        <button class="btn" @click="demoCacheManager">
          <Play :size="14" /> CacheManager
        </button>
        <button class="btn" @click="demoCancelToken">
          <Play :size="14" /> CancelToken
        </button>
        <button class="btn" @click="demoRetryManager">
          <Play :size="14" /> RetryManager
        </button>
        <button class="btn" @click="demoUtilities">
          <Play :size="14" /> 工具函数
        </button>
        <button class="btn" @click="demoDevTools">
          <Play :size="14" /> HttpDevTools
        </button>
        <button class="btn" @click="demoNetworkMonitor">
          <Play :size="14" /> NetworkMonitor
        </button>
        <button class="btn" @click="clearLog">
          <Trash2 :size="14" /> 清空
        </button>
      </div>

      <div v-if="log.length" class="result-panel mb-4">
        <div class="result-label">执行日志</div>
        <div class="code-block">
          <div v-for="(entry, i) in log" :key="i">{{ entry }}</div>
        </div>
      </div>

      <div v-if="resultJson" class="result-panel">
        <div class="result-label">返回数据</div>
        <pre class="code-block">{{ resultJson }}</pre>
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>@ldesign/http-core</code> 提供框架无关的 HTTP 能力，所有功能都可以在纯 JavaScript/TypeScript 中使用，
        Vue 包 (<code>@ldesign/http-vue</code>) 是在 Core 之上的 Vue 3 适配层。
      </p>
    </div>

    <div class="card">
      <h3>1. createHttpClient — 创建客户端</h3>
      <pre class="code-block">import { createHttpClient } from '@ldesign/http-core'

// 异步创建（推荐）
const client = await createHttpClient({
  adapter: 'fetch',         // 适配器: 'fetch' | 'axios'
  baseURL: 'https://api.example.com',
  timeout: 10000,           // 超时 10 秒
  headers: {                // 默认请求头
    'Content-Type': 'application/json',
  },
})

// 发送请求
const res = await client.get('/users')          // GET
const res2 = await client.post('/users', data)  // POST
const res3 = await client.put('/users/1', data) // PUT
await client.delete('/users/1')                  // DELETE
await client.patch('/users/1', data)             // PATCH

// 通用请求方法
const res4 = await client.request({
  url: '/users',
  method: 'GET',
  params: { page: 1, limit: 10 },
})</pre>
    </div>

    <div class="card">
      <h3>2. 拦截器系统</h3>
      <pre class="code-block">// 请求拦截器 — 发送前修改配置
client.addRequestInterceptor((config) => {
  config.headers = {
    ...config.headers,
    'Authorization': `Bearer ${getToken()}`,
  }
  return config
})

// 响应拦截器 — 收到响应后处理
client.addResponseInterceptor((response) => {
  if (response.data?.code !== 0) {
    throw new Error(response.data.message)
  }
  return response
})

// 错误拦截器 — 统一错误处理
client.interceptors.error.use((error) => {
  if (error.status === 401) {
    redirectToLogin()
  }
  throw error
})</pre>
    </div>

    <div class="card">
      <h3>3. CacheManager — 缓存管理</h3>
      <pre class="code-block">import { CacheManager, MemoryCacheStorage } from '@ldesign/http-core'

const storage = new MemoryCacheStorage()
const cache = new CacheManager(storage, {
  defaultTTL: 5 * 60 * 1000,  // 默认 5 分钟过期
})

// 写入缓存
await cache.set('users', userData)

// 读取缓存
const data = await cache.get('users')

// 检查是否存在
const exists = await cache.has('users')

// 删除
await cache.delete('users')

// 清空所有
await cache.clear()</pre>
    </div>

    <div class="card">
      <h3>4. RetryManager — 重试管理器</h3>
      <pre class="code-block">import { RetryManager } from '@ldesign/http-core'

const retry = new RetryManager({
  maxRetries: 3,       // 最大重试次数
  baseDelay: 1000,     // 基础延迟 1 秒
  maxDelay: 10000,     // 最大延迟 10 秒
  backoffFactor: 2,    // 指数退避因子
  retryCondition: (error) => {
    // 仅在 5xx 或网络错误时重试
    return error.status >= 500 || error.isNetworkError
  },
})

// 执行带自动重试的操作
const result = await retry.execute(async () => {
  return await client.get('/api/unstable-endpoint')
})</pre>
    </div>

    <div class="card">
      <h3>5. CancelToken — 取消令牌</h3>
      <pre class="code-block">import {
  createCancelTokenSource,
  createTimeoutToken,
  combineCancelTokens,
  isCancelError,
} from '@ldesign/http-core'

// 创建取消令牌源
const source = createCancelTokenSource()

// 发送请求时传入令牌
client.get('/api/data', { signal: source.token.promise })

// 取消请求
source.cancel('用户取消操作')

// 判断是否为取消错误
try {
  await client.get('/api/data')
} catch (e) {
  if (isCancelError(e)) {
    console.log('请求已取消')
  }
}

// 超时令牌 — 超过指定时间自动取消
const timeoutToken = createTimeoutToken(5000)</pre>
    </div>

    <div class="card">
      <h3>6. ErrorClassifier — 错误分类</h3>
      <pre class="code-block">import {
  isHttpError,
  isSuccessStatus,
  isClientError,
  isServerError,
  HttpStatus,
  ErrorClassifier,
} from '@ldesign/http-core'

// 状态码常量
HttpStatus.OK              // 200
HttpStatus.NOT_FOUND       // 404
HttpStatus.INTERNAL_SERVER_ERROR  // 500

// 状态码分类判断
isSuccessStatus(200)  // true  (2xx)
isClientError(404)    // true  (4xx)
isServerError(500)    // true  (5xx)

// 错误对象判断
isHttpError(error)    // 是否为 HTTP 错误</pre>
    </div>

    <div class="card">
      <h3>7. HttpDevTools — 开发工具</h3>
      <pre class="code-block">import { HttpDevTools, createDevTools } from '@ldesign/http-core'

const devtools = new HttpDevTools({
  enabled: true,                // 是否启用
  maxRecords: 100,              // 最大记录数
  logToConsole: true,           // 是否在控制台输出
  performanceThreshold: 1000,   // 慢请求阈值 (ms)
})

// 附加到客户端 — 自动拦截所有请求
devtools.attach(client)

// 获取统计
devtools.getStats()
// → { total, pending, success, error, averageDuration, slowRequests }

// 获取所有记录
devtools.getRecords()

// 获取慢请求 / 失败请求
devtools.getSlowRequests()
devtools.getFailedRequests()

// 导出为 JSON 文件
devtools.download()

// 控制台中也可直接使用
// window.httpDevTools.getStats()
// window.httpDevTools.printStats()</pre>
    </div>

    <div class="card">
      <h3>8. NetworkMonitor — 网络监控</h3>
      <pre class="code-block">import { createNetworkMonitor, ConnectionType } from '@ldesign/http-core'

const monitor = createNetworkMonitor()

// 获取在线状态
monitor.isOnline()  // true/false

// 获取详细网络信息
monitor.getNetworkInfo()
// → { online, connectionType, effectiveType, downlink, rtt, metered }

// 监听网络状态变化
monitor.onChange((info) => {
  if (!info.online) {
    showOfflineBanner()
  }
})

// 连接类型枚举
ConnectionType.WIFI       // 'wifi'
ConnectionType.CELLULAR   // 'cellular'
ConnectionType.ETHERNET   // 'ethernet'

// 销毁（移除事件监听）
monitor.destroy()</pre>
    </div>

    <div class="card">
      <h3>9. 工具函数</h3>
      <pre class="code-block">import {
  buildURL,
  buildQueryString,
  mergeConfig,
  generateRequestKey,
  generateRequestFingerprint,
  isAbsoluteURL,
  combineURLs,
  createHttpError,
  deepClone,
  delay,
  generateId,
  isFormData,
  isBlob,
} from '@ldesign/http-core'

// URL 构建
buildURL('/api/users', { page: 1, q: '张' })
// → '/api/users?page=1&q=张'

// 查询字符串
buildQueryString({ a: 1, b: [2, 3] })

// 配置合并（深合并 headers 等）
mergeConfig(defaultConfig, overrideConfig)

// 请求去重键
generateRequestKey({ url: '/api/users', method: 'GET' })

// URL 判断与拼接
isAbsoluteURL('https://api.com')  // true
combineURLs('https://api.com', '/users')  // 'https://api.com/users'

// 创建标准 HTTP 错误
createHttpError(404, '未找到资源', config)

// 通用工具
deepClone(obj)      // 深拷贝
await delay(1000)   // 延迟 1 秒
generateId()        // 生成唯一 ID</pre>
    </div>
  </div>
</template>
