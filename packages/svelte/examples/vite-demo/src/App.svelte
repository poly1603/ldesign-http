<script lang="ts">
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

  let message = 'Hello HTTP Svelte!'
  let loading = false
  let data: any = null
  let error: string | null = null

  async function fetchUser() {
    loading = true
    error = null
    
    try {
      const response = await client.get('/users/1')
      data = response.data
    } catch (e) {
      error = (e as Error).message
    } finally {
      loading = false
    }
  }

  async function fetchUsers() {
    loading = true
    error = null
    
    try {
      const response = await client.get('/users', {
        params: { _limit: 5 }
      })
      data = response.data
    } catch (e) {
      error = (e as Error).message
    } finally {
      loading = false
    }
  }

  async function createUser() {
    loading = true
    error = null
    
    try {
      const response = await client.post('/users', {
        name: 'John Doe',
        email: 'john@example.com'
      })
      data = response.data
    } catch (e) {
      error = (e as Error).message
    } finally {
      loading = false
    }
  }
</script>

<div>
  <h1>{message}</h1>
  <p>Svelte HTTP 集成演示 - 使用 @ldesign/http-core</p>
  
  <div class="demo-section">
    <h2>HTTP 请求演示</h2>
    
    <div class="button-group">
      <button on:click={fetchUser} disabled={loading}>
        获取单个用户
      </button>
      <button on:click={fetchUsers} disabled={loading}>
        获取用户列表
      </button>
      <button on:click={createUser} disabled={loading}>
        创建用户
      </button>
    </div>
    
    {#if loading}
      <div class="loading">⏳ 加载中...</div>
    {/if}
    
    {#if error}
      <div class="error">❌ 错误: {error}</div>
    {/if}
    
    {#if data && !loading}
      <div class="data">
        <h3>响应数据:</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    {/if}
  </div>
</div>

<style>
  .button-group {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  h3 {
    margin-bottom: 0.5rem;
    color: #666;
  }

  pre {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9rem;
    line-height: 1.5;
  }
</style>
