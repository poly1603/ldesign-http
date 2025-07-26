/**
 * @ldesign/http 文档演示脚本
 * 展示文档中的所有示例代码
 */

// 模拟浏览器环境
if (typeof window === 'undefined') {
  const fetch = await import('node-fetch')
  global.fetch = fetch.default
  global.Headers = fetch.Headers
  const AbortController = await import('abort-controller')
  global.AbortController = AbortController.default
  global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { }
  }
}

// 模拟 @ldesign/http 导入
const { createHttpClient, createQuickClient } = await import('./lib/index.js')

console.log('🚀 @ldesign/http 文档演示\n')

// 1. 基础使用示例
async function basicUsageDemo() {
  console.log('=== 1. 基础使用示例 ===')

  const client = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  try {
    // GET 请求
    console.log('📤 发送GET请求...')
    const users = await client.get('/users')
    console.log('✅ 获取用户成功:', users.data.length, '个用户')

    // 显示前3个用户
    users.data.slice(0, 3).forEach(user => {
      console.log(`  - ${user.name} (${user.email})`)
    })

    // POST 请求
    console.log('\n📤 发送POST请求...')
    const newUser = await client.post('/users', {
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe'
    })
    console.log('✅ 创建用户成功:', newUser.data.name)

  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

// 2. 快速客户端示例
async function quickClientDemo() {
  console.log('\n=== 2. 快速客户端示例 ===')

  const client = createQuickClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 5000,
    adapter: 'fetch',
    enableLog: true
  })

  try {
    console.log('📤 使用快速客户端获取文章...')
    const posts = await client.get('/posts?_limit=5')
    console.log('✅ 获取文章成功:', posts.data.length, '篇文章')

    posts.data.forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.title.substring(0, 50)}...`)
    })

  } catch (error) {
    console.error('❌ 快速客户端请求失败:', error.message)
  }
}

// 3. 错误处理示例
async function errorHandlingDemo() {
  console.log('\n=== 3. 错误处理示例 ===')

  const client = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com'
  })

  try {
    console.log('📤 请求不存在的资源...')
    await client.get('/nonexistent-endpoint')
  } catch (error) {
    console.log('✅ 成功捕获错误!')
    console.log('📄 错误信息:')
    console.log(`  - 消息: ${error.message}`)
    console.log(`  - 状态码: ${error.response?.status || 'N/A'}`)
    console.log(`  - 网络错误: ${error.isNetworkError || false}`)
    console.log(`  - 超时错误: ${error.isTimeoutError || false}`)
  }
}

// 4. 拦截器示例
async function interceptorDemo() {
  console.log('\n=== 4. 拦截器示例 ===')

  const client = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com'
  })

  // 添加请求拦截器
  client.addRequestInterceptor({
    onFulfilled: (config) => {
      console.log('🔧 请求拦截器: 添加时间戳')
      config.headers = {
        ...config.headers,
        'X-Timestamp': Date.now().toString(),
        'X-Demo': 'ldesign-http'
      }
      return config
    }
  })

  // 添加响应拦截器
  client.addResponseInterceptor({
    onFulfilled: (response) => {
      console.log('🔧 响应拦截器: 记录响应时间')
      console.log(`  响应状态: ${response.status}`)
      console.log(`  响应大小: ${JSON.stringify(response.data).length} 字符`)
      return response
    }
  })

  try {
    console.log('📤 使用拦截器发送请求...')
    const response = await client.get('/users/1')
    console.log('✅ 拦截器请求成功:', response.data.name)
  } catch (error) {
    console.error('❌ 拦截器请求失败:', error.message)
  }
}

// 5. 多种HTTP方法示例
async function httpMethodsDemo() {
  console.log('\n=== 5. HTTP方法示例 ===')

  const client = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com'
  })

  try {
    // GET
    console.log('📤 GET 请求...')
    const getResponse = await client.get('/posts/1')
    console.log('✅ GET 成功:', getResponse.data.title.substring(0, 30) + '...')

    // POST
    console.log('📤 POST 请求...')
    const postResponse = await client.post('/posts', {
      title: 'Demo Post',
      body: 'This is a demo post from @ldesign/http',
      userId: 1
    })
    console.log('✅ POST 成功: ID', postResponse.data.id)

    // PUT
    console.log('📤 PUT 请求...')
    const putResponse = await client.put('/posts/1', {
      id: 1,
      title: 'Updated Demo Post',
      body: 'This post has been updated',
      userId: 1
    })
    console.log('✅ PUT 成功:', putResponse.data.title.substring(0, 30) + '...')

    // DELETE
    console.log('📤 DELETE 请求...')
    await client.delete('/posts/1')
    console.log('✅ DELETE 成功')

  } catch (error) {
    console.error('❌ HTTP方法请求失败:', error.message)
  }
}

// 6. 参数和数据示例
async function parametersDemo() {
  console.log('\n=== 6. 参数和数据示例 ===')

  const client = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com'
  })

  try {
    // 查询参数
    console.log('📤 带查询参数的请求...')
    const response1 = await client.get('/posts', {
      params: {
        userId: 1,
        _limit: 3
      }
    })
    console.log('✅ 查询参数请求成功:', response1.data.length, '条结果')

    // 请求体数据
    console.log('📤 带请求体的POST请求...')
    const response2 = await client.post('/posts', {
      title: 'New Post with Data',
      body: 'This post contains structured data',
      userId: 2,
      tags: ['demo', 'test', 'ldesign'],
      metadata: {
        source: '@ldesign/http',
        version: '1.0.0'
      }
    })
    console.log('✅ 请求体POST成功: ID', response2.data.id)

  } catch (error) {
    console.error('❌ 参数请求失败:', error.message)
  }
}

// 7. 适配器信息示例
function adapterInfoDemo() {
  console.log('\n=== 7. 适配器信息示例 ===')

  const client = createHttpClient()

  // 获取适配器信息
  const adapterInfo = client.getAdapterInfo()
  console.log('🔧 当前适配器:', adapterInfo.name)
  console.log('🔧 是否自定义:', adapterInfo.isCustom)

  // 获取支持的适配器
  const supportedAdapters = client.constructor.getSupportedAdapters()
  console.log('🔧 支持的适配器:', supportedAdapters.join(', '))
}

// 8. 事件系统示例
async function eventSystemDemo() {
  console.log('\n=== 8. 事件系统示例 ===')

  const client = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com'
  })

  // 监听事件
  client.on('request', (event) => {
    console.log('📡 事件: 发送请求', event.config.method, event.config.url)
  })

  client.on('response', (event) => {
    console.log('📡 事件: 收到响应', event.response.status)
  })

  client.on('error', (event) => {
    console.log('📡 事件: 请求错误', event.error.message)
  })

  try {
    console.log('📤 发送带事件监听的请求...')
    const response = await client.get('/albums/1')
    console.log('✅ 事件请求成功:', response.data.title)
  } catch (error) {
    console.error('❌ 事件请求失败:', error.message)
  }
}

// 9. 综合示例
async function comprehensiveDemo() {
  console.log('\n=== 9. 综合示例 ===')

  const client = createHttpClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 8000,
    headers: {
      'User-Agent': '@ldesign/http-demo',
      'X-Client-Version': '1.0.0'
    }
  })

  // 添加全局拦截器
  client.addRequestInterceptor({
    onFulfilled: (config) => {
      console.log(`🚀 发起请求: ${config.method?.toUpperCase()} ${config.url}`)
      return config
    }
  })

  client.addResponseInterceptor({
    onFulfilled: (response) => {
      console.log(`✅ 请求完成: ${response.status} (${response.statusText})`)
      return response
    },
    onRejected: (error) => {
      console.log(`❌ 请求失败: ${error.message}`)
      return Promise.reject(error)
    }
  })

  try {
    // 获取用户和其文章
    console.log('📤 获取用户信息...')
    const user = await client.get('/users/1')

    console.log('📤 获取用户文章...')
    const posts = await client.get('/posts', {
      params: { userId: user.data.id, _limit: 2 }
    })

    console.log('📤 获取用户相册...')
    const albums = await client.get('/albums', {
      params: { userId: user.data.id, _limit: 2 }
    })

    console.log('\n📊 综合结果:')
    console.log(`  用户: ${user.data.name} (${user.data.email})`)
    console.log(`  公司: ${user.data.company.name}`)
    console.log(`  文章数: ${posts.data.length}`)
    console.log(`  相册数: ${albums.data.length}`)

  } catch (error) {
    console.error('❌ 综合示例失败:', error.message)
  }
}

// 主函数
async function runAllDemos() {
  console.log('🎯 开始运行所有文档演示...\n')

  try {
    await basicUsageDemo()
    await quickClientDemo()
    await errorHandlingDemo()
    await interceptorDemo()
    await httpMethodsDemo()
    await parametersDemo()
    adapterInfoDemo()
    await eventSystemDemo()
    await comprehensiveDemo()

    console.log('\n🎉 所有演示完成!')
    console.log('\n📚 更多信息:')
    console.log('  - 文档: http://localhost:5173')
    console.log('  - GitHub: https://github.com/your-org/ldesign')
    console.log('  - npm: https://www.npmjs.com/package/@ldesign/http')

  } catch (error) {
    console.error('\n💥 演示过程中发生错误:', error.message)
  }
}

// 运行演示
runAllDemos()

export {
  adapterInfoDemo, basicUsageDemo, comprehensiveDemo, errorHandlingDemo, eventSystemDemo, httpMethodsDemo, interceptorDemo, parametersDemo, quickClientDemo, runAllDemos
}
