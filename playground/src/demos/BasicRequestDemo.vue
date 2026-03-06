<script setup lang="ts">
import { ref } from 'vue'
import { Send, ArrowDown, ArrowUp, Trash2, RefreshCw } from 'lucide-vue-next'
import { useHttp } from '@ldesign/http-vue'

const { data, loading, error, get, post, put, delete: del, reset } = useHttp()
const responseJson = ref('')

async function doGet() {
  try {
    const res = await get('/api/users')
    responseJson.value = JSON.stringify(res, null, 2)
  } catch (e: any) {
    responseJson.value = `Error: ${e.message}`
  }
}

async function doPost() {
  try {
    const res = await post('/api/users', { name: 'New User', email: 'new@example.com', role: 'viewer' })
    responseJson.value = JSON.stringify(res, null, 2)
  } catch (e: any) {
    responseJson.value = `Error: ${e.message}`
  }
}

async function doPut() {
  try {
    const res = await put('/api/users/1', { name: 'Updated Alice', role: 'superadmin' })
    responseJson.value = JSON.stringify(res, null, 2)
  } catch (e: any) {
    responseJson.value = `Error: ${e.message}`
  }
}

async function doDelete() {
  try {
    const res = await del('/api/users/3')
    responseJson.value = JSON.stringify(res, null, 2)
  } catch (e: any) {
    responseJson.value = `Error: ${e.message}`
  }
}

function doReset() {
  reset()
  responseJson.value = ''
}
</script>

<template>
  <div class="demo-page">
    <h2>useHttp 基础请求</h2>
    <p class="page-desc">
      基础 HTTP 请求组合式函数。自动管理 loading / error / data 响应式状态。
    </p>

    <div class="card">
      <h3><Send :size="18" /> 发送请求</h3>
      <div class="btn-group">
        <button class="btn btn-primary" :disabled="loading" @click="doGet">
          <ArrowDown :size="14" /> GET /api/users
        </button>
        <button class="btn btn-success" :disabled="loading" @click="doPost">
          <ArrowUp :size="14" /> POST /api/users
        </button>
        <button class="btn" :disabled="loading" @click="doPut">
          <RefreshCw :size="14" /> PUT /api/users/1
        </button>
        <button class="btn btn-error" :disabled="loading" @click="doDelete">
          <Trash2 :size="14" /> DELETE /api/users/3
        </button>
        <button class="btn" @click="doReset">重置</button>
      </div>

      <div class="flex items-center gap-2 mb-2">
        <span v-if="loading" class="badge badge-loading"><span class="spinner" /> 加载中...</span>
        <span v-if="error" class="badge badge-error">错误: {{ error.message }}</span>
        <span v-if="data && !loading" class="badge badge-success">成功</span>
      </div>

      <div v-if="responseJson" class="result-panel">
        <div class="result-label">响应结果</div>
        <pre class="code-block">{{ responseJson }}</pre>
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useHttp</code> 是 <code>@ldesign/http-vue</code> 提供的核心组合式函数，
        封装了 HTTP 请求的完整生命周期管理。它返回响应式状态（<code>data</code>、<code>loading</code>、<code>error</code>）
        和请求方法（<code>get</code>、<code>post</code>、<code>put</code>、<code>delete</code>），
        让你无需手动管理加载状态和错误处理。
      </p>
      <p class="text-sm text-secondary mb-2">
        <strong>来源：</strong><code>@ldesign/http-vue</code> 的 <code>useHttpStandalone</code> 模块。
        它内部会自动创建 <code>HttpClientImpl</code>（基于 <code>@ldesign/http-core</code>），
        并使用 Fetch 适配器发送请求。无需手动注入或配置。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { useHttp } from '@ldesign/http-vue'

// 解构返回的响应式状态和方法
const { data, loading, error, get, post, put, delete: del, reset, clearError } = useHttp()

// GET 请求 —— 返回解析后的数据（response.data）
const users = await get('/api/users')
console.log(users) // [{ id: 1, name: 'Alice' }, ...]

// POST 请求 —— 第二个参数为请求体
const newUser = await post('/api/users', {
  name: 'Bob',
  email: 'bob@example.com'
})

// PUT 请求 —— 更新资源
await put('/api/users/1', { name: 'Updated Name' })

// DELETE 请求
await del('/api/users/3')

// 重置所有状态（data = null, loading = false, error = null）
reset()</pre>
    </div>

    <div class="card">
      <h3>返回值 API</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>属性/方法</th>
            <th>类型</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>data</code></td>
            <td><code>Ref&lt;unknown&gt;</code></td>
            <td>最近一次请求的响应数据</td>
          </tr>
          <tr>
            <td><code>loading</code></td>
            <td><code>ComputedRef&lt;boolean&gt;</code></td>
            <td>当前是否有请求进行中</td>
          </tr>
          <tr>
            <td><code>error</code></td>
            <td><code>Ref&lt;Error | null&gt;</code></td>
            <td>请求失败时的错误对象</td>
          </tr>
          <tr>
            <td><code>get(url, config?)</code></td>
            <td><code>Promise&lt;T | null&gt;</code></td>
            <td>发送 GET 请求，返回数据或 null</td>
          </tr>
          <tr>
            <td><code>post(url, data?, config?)</code></td>
            <td><code>Promise&lt;T | null&gt;</code></td>
            <td>发送 POST 请求</td>
          </tr>
          <tr>
            <td><code>put(url, data?, config?)</code></td>
            <td><code>Promise&lt;T | null&gt;</code></td>
            <td>发送 PUT 请求</td>
          </tr>
          <tr>
            <td><code>delete(url, config?)</code></td>
            <td><code>Promise&lt;T | null&gt;</code></td>
            <td>发送 DELETE 请求</td>
          </tr>
          <tr>
            <td><code>reset()</code></td>
            <td><code>void</code></td>
            <td>重置 data/loading/error 到初始值</td>
          </tr>
          <tr>
            <td><code>clearError()</code></td>
            <td><code>void</code></td>
            <td>仅清除错误状态</td>
          </tr>
          <tr>
            <td><code>client</code></td>
            <td><code>Promise&lt;HttpClientImpl&gt;</code></td>
            <td>底层 HTTP 客户端实例（Promise）</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>在模板中使用响应式状态</h3>
      <pre v-pre class="code-block">&lt;template&gt;
  &lt;!-- 加载指示器 --&gt;
  &lt;div v-if="loading"&gt;加载中...&lt;/div&gt;

  &lt;!-- 错误展示 --&gt;
  &lt;div v-else-if="error" class="error"&gt;
    请求失败: {{ error.message }}
    &lt;button @click="clearError"&gt;关闭&lt;/button&gt;
  &lt;/div&gt;

  &lt;!-- 数据展示 --&gt;
  &lt;ul v-else-if="data"&gt;
    &lt;li v-for="user in data" :key="user.id"&gt;{{ user.name }}&lt;/li&gt;
  &lt;/ul&gt;
&lt;/template&gt;</pre>
    </div>

    <div class="card">
      <h3>带自定义配置的请求</h3>
      <pre class="code-block">// 传入第三个参数作为 RequestConfig
const result = await get('/api/users', {
  params: { page: 1, limit: 10 },
  headers: { 'X-Custom-Header': 'value' },
  timeout: 5000,
})

// 带请求体和配置的 POST
await post('/api/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 30000,
})</pre>
    </div>

    <div class="card">
      <h3>错误处理模式</h3>
      <pre class="code-block">// 方式一：通过 try/catch
try {
  const users = await get('/api/users')
  // 处理数据...
} catch (e) {
  console.error('请求失败:', e.message)
}

// 方式二：通过响应式 error 状态（推荐）
// useHttp 内部自动捕获错误并更新 error.value
await get('/api/bad-url') // 不会抛出异常
if (error.value) {
  console.log('出错了:', error.value.message)
}</pre>
    </div>
  </div>
</template>
