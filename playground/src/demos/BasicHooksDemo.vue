<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDown, ArrowUp, Pencil, Trash2, RefreshCw } from 'lucide-vue-next'
import { useGet, usePost, usePut, useDelete } from '@ldesign/http-vue'

// useGet — 自动在挂载时发送 GET 请求，并在 URL 变化时自动重新获取
const { data: userData, loading: userLoading, error: userError, execute: refetchUsers } = useGet<any>('/api/users', undefined, { immediate: true })

// usePost — 手动触发
const { data: postResult, loading: postLoading, execute: doPost } = usePost<any>('/api/users')

// usePut — 手动触发
const { data: putResult, loading: putLoading, execute: doPut } = usePut<any>('/api/users/1')

// useDelete — 手动触发
const { data: delResult, loading: delLoading, execute: doDel } = useDelete<any>('/api/users/3')

const responseLog = ref<string[]>([])

async function createUser() {
  const res = await doPost({ name: 'Hook User', email: 'hook@example.com', role: 'viewer' })
  responseLog.value.push(`POST 结果: ${JSON.stringify(res)}`)
}

async function updateUser() {
  const res = await doPut({ name: 'Updated via usePut' })
  responseLog.value.push(`PUT 结果: ${JSON.stringify(res)}`)
}

async function deleteUser() {
  const res = await doDel()
  responseLog.value.push(`DELETE 结果: ${JSON.stringify(res)}`)
}
</script>

<template>
  <div class="demo-page">
    <h2>useGet / usePost / usePut / useDelete</h2>
    <p class="page-desc">
      基础 HTTP 方法 Hooks。每个 hook 绑定一个固定的 URL 和方法，返回响应式状态。
      与 <code>useHttp</code> 的区别在于：这些 hook 是<strong>单一职责</strong>的，每个实例专注于一个请求。
    </p>

    <div class="card">
      <h3><ArrowDown :size="18" /> useGet — 自动获取数据</h3>
      <div class="btn-group">
        <button class="btn btn-primary" :disabled="userLoading" @click="refetchUsers()">
          <RefreshCw :size="14" /> 刷新
        </button>
      </div>
      <div class="flex items-center gap-2 mb-2">
        <span v-if="userLoading" class="badge badge-loading"><span class="spinner" /> 加载中...</span>
        <span v-if="userData && !userLoading" class="badge badge-success">已加载</span>
        <span v-if="userError" class="badge badge-error">错误</span>
      </div>
      <div v-if="userData" class="result-panel">
        <div class="result-label">GET /api/users 响应</div>
        <pre class="code-block">{{ JSON.stringify(userData, null, 2) }}</pre>
      </div>
    </div>

    <div class="card">
      <h3><ArrowUp :size="18" /> usePost / usePut / useDelete</h3>
      <div class="btn-group">
        <button class="btn btn-success" :disabled="postLoading" @click="createUser">
          <ArrowUp :size="14" /> POST 创建用户
        </button>
        <button class="btn" :disabled="putLoading" @click="updateUser">
          <Pencil :size="14" /> PUT 更新用户
        </button>
        <button class="btn btn-error" :disabled="delLoading" @click="deleteUser">
          <Trash2 :size="14" /> DELETE 删除用户
        </button>
      </div>
      <div v-if="responseLog.length" class="result-panel">
        <div class="result-label">操作日志</div>
        <div class="code-block">
          <div v-for="(entry, i) in responseLog" :key="i">{{ entry }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useGet/usePost/usePut/useDelete/usePatch</code> 来自 <code>@ldesign/http-vue</code> 的 <code>useBasicHttp</code> 模块。
        它们的设计理念是：<strong>一个 hook 实例对应一个固定的 URL 和 HTTP 方法</strong>。
      </p>
      <p class="text-sm text-secondary mb-2">
        <strong>与 useHttp 的区别：</strong><br>
        <code>useHttp</code> 返回 <code>get/post/put/delete</code> 多个方法，可以调用不同 URL；<br>
        <code>useGet('/api/users')</code> 专注于这一个端点，并且 GET 会<strong>自动监听 URL 变化</strong>重新获取数据。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { useGet, usePost, usePut, useDelete, usePatch } from '@ldesign/http-vue'

// useGet — 自动获取，URL 变化自动刷新
const { data, loading, error, execute, reset, finished, hasError } = useGet('/api/users')

// usePost — 手动触发
const { data, loading, execute } = usePost('/api/users')
await execute({ name: 'Alice', email: 'alice@test.com' })

// usePut — 手动触发
const { execute: doUpdate } = usePut('/api/users/1')
await doUpdate({ name: 'Updated' })

// useDelete — 手动触发
const { execute: doRemove } = useDelete('/api/users/1')
await doRemove()

// usePatch — 手动触发
const { execute: doPatch } = usePatch('/api/users/1')
await doPatch({ role: 'admin' })</pre>
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
          <tr><td><code>data</code></td><td><code>Ref&lt;T | null&gt;</code></td><td>响应数据</td></tr>
          <tr><td><code>loading</code></td><td><code>Ref&lt;boolean&gt;</code></td><td>请求是否进行中</td></tr>
          <tr><td><code>error</code></td><td><code>Ref&lt;Error | null&gt;</code></td><td>错误对象</td></tr>
          <tr><td><code>finished</code></td><td><code>Ref&lt;boolean&gt;</code></td><td>请求是否已完成</td></tr>
          <tr><td><code>hasError</code></td><td><code>ComputedRef&lt;boolean&gt;</code></td><td>是否有错误</td></tr>
          <tr><td><code>execute(data?)</code></td><td><code>Promise&lt;T | null&gt;</code></td><td>执行请求（POST/PUT/DELETE 传入请求体）</td></tr>
          <tr><td><code>reset()</code></td><td><code>void</code></td><td>重置所有状态到初始值</td></tr>
          <tr><td><code>clearError()</code></td><td><code>void</code></td><td>仅清除错误状态</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>配置选项</h3>
      <pre class="code-block">useGet(url, requestConfig?, options?)

// requestConfig — 请求配置（可选，支持响应式）
const config = ref({ params: { role: 'admin' } })
const { data } = useGet('/api/users', config)
// config 变化时自动重新请求（仅 useGet）

// options
{
  immediate: true,        // useGet 默认 true，自动执行
  cancelOnUnmount: true,  // 组件卸载时自动取消请求
  onSuccess: (data) => {},     // 成功回调
  onError: (error) => {},      // 失败回调
  onFinally: () => {},         // 完成回调（无论成功失败）
}</pre>
    </div>
  </div>
</template>
