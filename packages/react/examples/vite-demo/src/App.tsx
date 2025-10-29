import React, { useState } from 'react'
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

function App() {
  const [message] = useState('Hello HTTP React!')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchUser() {
    setLoading(true)
    setError(null)

    try {
      const response = await client.get('/users/1')
      setData(response.data)
    }
    catch (e) {
      setError((e as Error).message)
    }
    finally {
      setLoading(false)
    }
  }

  async function fetchUsers() {
    setLoading(true)
    setError(null)

    try {
      const response = await client.get('/users', {
        params: { _limit: 5 }
      })
      setData(response.data)
    }
    catch (e) {
      setError((e as Error).message)
    }
    finally {
      setLoading(false)
    }
  }

  async function createUser() {
    setLoading(true)
    setError(null)

    try {
      const response = await client.post('/users', {
        name: 'John Doe',
        email: 'john@example.com'
      })
      setData(response.data)
    }
    catch (e) {
      setError((e as Error).message)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>{message}</h1>
      <p>React HTTP 集成演示 - 使用 @ldesign/http-core</p>

      <div className="demo-section">
        <h2>HTTP 请求演示</h2>

        <div className="button-group">
          <button onClick={fetchUser} disabled={loading}>
            获取单个用户
          </button>
          <button onClick={fetchUsers} disabled={loading}>
            获取用户列表
          </button>
          <button onClick={createUser} disabled={loading}>
            创建用户
          </button>
        </div>

        {loading && <div className="loading">⏳ 加载中...</div>}
        {error && <div className="error">❌ 错误: {error}</div>}
        {data && !loading && (
          <div className="data">
            <h3>响应数据:</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
