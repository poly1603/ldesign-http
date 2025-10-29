import './style.css'
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-core/adapters'

// 创建 HTTP 客户端
const client = createHttpClient(
  {
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
  },
  new FetchAdapter()
)

const app = document.getElementById('app')!

app.innerHTML = `
  <div>
    <h1>Hello HTTP Core!</h1>
    <p>HTTP 核心功能演示 - 框架无关</p>
    
    <div class="demo-section">
      <h2>HTTP 请求演示</h2>
      
      <div class="button-group">
        <button id="fetch-user-btn">获取单个用户</button>
        <button id="fetch-users-btn">获取用户列表</button>
        <button id="create-user-btn">创建用户</button>
      </div>
      
      <div id="output"></div>
    </div>
  </div>
`

const fetchUserBtn = document.getElementById('fetch-user-btn')!
const fetchUsersBtn = document.getElementById('fetch-users-btn')!
const createUserBtn = document.getElementById('create-user-btn')!
const output = document.getElementById('output')!

// 禁用所有按钮
function disableButtons() {
  fetchUserBtn.setAttribute('disabled', 'true')
  fetchUsersBtn.setAttribute('disabled', 'true')
  createUserBtn.setAttribute('disabled', 'true')
}

// 启用所有按钮
function enableButtons() {
  fetchUserBtn.removeAttribute('disabled')
  fetchUsersBtn.removeAttribute('disabled')
  createUserBtn.removeAttribute('disabled')
}

// 获取单个用户
fetchUserBtn.addEventListener('click', async () => {
  disableButtons()
  output.innerHTML = '<div class="loading">⏳ 加载中...</div>'

  try {
    const response = await client.get('/users/1')
    output.innerHTML = `
      <div class="data">
        <h3>响应数据:</h3>
        <pre>${JSON.stringify(response.data, null, 2)}</pre>
      </div>
    `
  }
  catch (e) {
    output.innerHTML = `<div class="error">❌ 错误: ${(e as Error).message}</div>`
  }
  finally {
    enableButtons()
  }
})

// 获取用户列表
fetchUsersBtn.addEventListener('click', async () => {
  disableButtons()
  output.innerHTML = '<div class="loading">⏳ 加载中...</div>'

  try {
    const response = await client.get('/users', {
      params: { _limit: 5 }
    })
    output.innerHTML = `
      <div class="data">
        <h3>响应数据:</h3>
        <pre>${JSON.stringify(response.data, null, 2)}</pre>
      </div>
    `
  }
  catch (e) {
    output.innerHTML = `<div class="error">❌ 错误: ${(e as Error).message}</div>`
  }
  finally {
    enableButtons()
  }
})

// 创建用户
createUserBtn.addEventListener('click', async () => {
  disableButtons()
  output.innerHTML = '<div class="loading">⏳ 加载中...</div>'

  try {
    const response = await client.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    })
    output.innerHTML = `
      <div class="data">
        <h3>响应数据:</h3>
        <pre>${JSON.stringify(response.data, null, 2)}</pre>
      </div>
    `
  }
  catch (e) {
    output.innerHTML = `<div class="error">❌ 错误: ${(e as Error).message}</div>`
  }
  finally {
    enableButtons()
  }
})
