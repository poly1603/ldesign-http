/**
 * @ldesign/http 简单演示
 * 展示基本功能
 */

console.log('🚀 @ldesign/http 简单演示\n')

// 模拟HTTP客户端（简化版）
function createSimpleHttpClient(config = {}) {
  const baseURL = config.baseURL || ''

  return {
    async get(url, options = {}) {
      const fullUrl = baseURL + url
      console.log(`📤 GET ${fullUrl}`)

      // 模拟响应
      return {
        data: { message: 'GET request successful', url: fullUrl },
        status: 200,
        statusText: 'OK',
      }
    },

    async post(url, data, options = {}) {
      const fullUrl = baseURL + url
      console.log(`📤 POST ${fullUrl}`)
      console.log(`📄 Data:`, JSON.stringify(data, null, 2))

      // 模拟响应
      return {
        data: { message: 'POST request successful', id: Math.floor(Math.random() * 1000), ...data },
        status: 201,
        statusText: 'Created',
      }
    },

    addRequestInterceptor(interceptor) {
      console.log('🔧 添加请求拦截器')
      return 1
    },

    addResponseInterceptor(interceptor) {
      console.log('🔧 添加响应拦截器')
      return 1
    },

    getAdapterInfo() {
      return { name: 'mock', isCustom: false }
    },
  }
}

// 演示函数
async function demo() {
  console.log('=== 基础功能演示 ===')

  // 创建客户端
  const client = createSimpleHttpClient({
    baseURL: 'https://api.example.com',
  })

  try {
    // GET 请求
    console.log('1. GET 请求演示:')
    const getResponse = await client.get('/users')
    console.log('✅ 响应:', getResponse.data.message)
    console.log('')

    // POST 请求
    console.log('2. POST 请求演示:')
    const postResponse = await client.post('/users', {
      name: 'John Doe',
      email: 'john@example.com',
    })
    console.log('✅ 响应:', postResponse.data.message)
    console.log('📄 创建的用户ID:', postResponse.data.id)
    console.log('')

    // 拦截器演示
    console.log('3. 拦截器演示:')
    client.addRequestInterceptor({
      onFulfilled: (config) => {
        console.log('  🔧 请求拦截器被调用')
        return config
      },
    })

    client.addResponseInterceptor({
      onFulfilled: (response) => {
        console.log('  🔧 响应拦截器被调用')
        return response
      },
    })
    console.log('')

    // 适配器信息
    console.log('4. 适配器信息:')
    const adapterInfo = client.getAdapterInfo()
    console.log('  🔧 适配器名称:', adapterInfo.name)
    console.log('  🔧 是否自定义:', adapterInfo.isCustom)
    console.log('')

    console.log('🎉 演示完成!')
    console.log('')
    console.log('📚 查看完整文档:')
    console.log('  - 本地文档: http://localhost:5173')
    console.log('  - 在线演示: http://localhost:5173/examples/live-demo')
    console.log('  - API参考: http://localhost:5173/api/')
    console.log('  - Vue集成: http://localhost:5173/vue/')
  }
 catch (error) {
    console.error('❌ 演示失败:', error.message)
  }
}

// 运行演示
demo()

console.log(`\n${'='.repeat(60)}`)
console.log('🌟 @ldesign/http 特性概览:')
console.log('  ✅ 多适配器支持 (Fetch, Axios, Alova)')
console.log('  ✅ Vue3 深度集成')
console.log('  ✅ TypeScript 优先')
console.log('  ✅ 智能缓存系统')
console.log('  ✅ 智能重试机制')
console.log('  ✅ 强大的拦截器')
console.log('  ✅ 进度监控')
console.log('  ✅ 请求取消')
console.log('  ✅ 插件系统')
console.log('  ✅ 事件系统')
console.log('='.repeat(60))
