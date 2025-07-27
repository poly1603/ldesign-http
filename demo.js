/**
 * @ldesign/http 演示脚本
 * 展示基本功能和使用方法
 */

// 模拟浏览器环境
global.fetch = require('node-fetch')
global.Headers = require('node-fetch').Headers
global.AbortController = require('abort-controller')

const { createHttpClient, createQuickClient } = require('./lib/index.js')

async function demo() {
  console.log('🚀 @ldesign/http 演示开始\n')

  // 1. 基础使用
  console.log('=== 1. 基础使用 ===')
  const client = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
  })

  try {
    console.log('📤 发送GET请求...')
    const response = await client.get('/users/1')
    console.log('✅ 请求成功!')
    console.log('📄 响应数据:', {
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
    })
    console.log('📊 响应状态:', response.status)
  }
 catch (error) {
    console.error('❌ 请求失败:', error.message)
  }

  console.log('\n=== 2. POST请求 ===')
  try {
    console.log('📤 发送POST请求...')
    const response = await client.post('/posts', {
      title: 'Test Post',
      body: 'This is a test post created by @ldesign/http',
      userId: 1,
    })
    console.log('✅ POST请求成功!')
    console.log('📄 创建的文章:', {
      id: response.data.id,
      title: response.data.title,
      userId: response.data.userId,
    })
  }
 catch (error) {
    console.error('❌ POST请求失败:', error.message)
  }

  console.log('\n=== 3. 快速创建客户端 ===')
  const quickClient = createQuickClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 5000,
    adapter: 'fetch',
    enableLog: true,
  })

  try {
    console.log('📤 使用快速客户端发送请求...')
    const response = await quickClient.get('/posts?_limit=3')
    console.log('✅ 快速客户端请求成功!')
    console.log('📄 获取到', response.data.length, '篇文章')
  }
 catch (error) {
    console.error('❌ 快速客户端请求失败:', error.message)
  }

  console.log('\n=== 4. 拦截器演示 ===')
  const interceptorClient = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
  })

  // 添加请求拦截器
  interceptorClient.addRequestInterceptor({
    onFulfilled: (config) => {
      console.log('🔧 请求拦截器: 添加自定义头部')
      config.headers = {
        ...config.headers,
        'X-Custom-Header': 'ldesign-http-demo',
      }
      return config
    },
  })

  // 添加响应拦截器
  interceptorClient.addResponseInterceptor({
    onFulfilled: (response) => {
      console.log('🔧 响应拦截器: 处理响应数据')
      return response
    },
  })

  try {
    console.log('📤 使用拦截器客户端发送请求...')
    const response = await interceptorClient.get('/users/2')
    console.log('✅ 拦截器客户端请求成功!')
    console.log('📄 用户信息:', {
      name: response.data.name,
      email: response.data.email,
    })
  }
 catch (error) {
    console.error('❌ 拦截器客户端请求失败:', error.message)
  }

  console.log('\n=== 5. 事件监听演示 ===')
  const eventClient = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
  })

  // 监听请求事件
  eventClient.on('request', (event) => {
    console.log('📡 事件: 发送请求', event.config.method, event.config.url)
  })

  // 监听响应事件
  eventClient.on('response', (event) => {
    console.log('📡 事件: 收到响应', event.response.status)
  })

  // 监听错误事件
  eventClient.on('error', (event) => {
    console.log('📡 事件: 请求错误', event.error.message)
  })

  try {
    console.log('📤 使用事件客户端发送请求...')
    const response = await eventClient.get('/albums/1')
    console.log('✅ 事件客户端请求成功!')
    console.log('📄 专辑信息:', {
      id: response.data.id,
      title: response.data.title,
      userId: response.data.userId,
    })
  }
 catch (error) {
    console.error('❌ 事件客户端请求失败:', error.message)
  }

  console.log('\n=== 6. 错误处理演示 ===')
  try {
    console.log('📤 发送到不存在的端点...')
    await client.get('/nonexistent-endpoint')
  }
 catch (error) {
    console.log('✅ 成功捕获错误!')
    console.log('📄 错误信息:', {
      message: error.message,
      status: error.response?.status,
      isNetworkError: error.isNetworkError,
    })
  }

  console.log('\n=== 7. 适配器信息 ===')
  const adapterInfo = client.getAdapterInfo()
  console.log('🔧 当前适配器:', adapterInfo.name)
  console.log('🔧 是否自定义:', adapterInfo.isCustom)

  const supportedAdapters = client.constructor.getSupportedAdapters()
  console.log('🔧 支持的适配器:', supportedAdapters.join(', '))

  console.log('\n🎉 演示完成!')
  console.log('\n📚 更多功能请查看文档:')
  console.log('   - Vue3 组合式函数')
  console.log('   - 缓存系统')
  console.log('   - 重试机制')
  console.log('   - 进度监控')
  console.log('   - 请求取消')
}

// 运行演示
demo().catch(console.error)
