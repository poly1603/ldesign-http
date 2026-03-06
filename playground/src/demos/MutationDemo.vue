<script setup lang="ts">
import { ref, inject } from 'vue'
import { GitPullRequest, Plus, Check } from 'lucide-vue-next'
import { useMutation, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
import type { HttpClient } from '@ldesign/http-core'

const client = inject<HttpClient>(HTTP_CLIENT_KEY)!

const newName = ref('Frank Zhou')
const newEmail = ref('frank@example.com')
const log = ref<string[]>([])

const { data, loading, error, mutate, reset } = useMutation<any, any>(
  client,
  (variables) => client.post('/api/users', variables),
  {
    onMutate: (vars) => {
      log.value.push(`[mutate] Starting with: ${JSON.stringify(vars)}`)
    },
    onSuccess: (data) => {
      log.value.push(`[success] Created user #${data.id}: ${data.name}`)
    },
    onError: (err) => {
      log.value.push(`[error] ${err.message}`)
    },
    onSettled: () => {
      log.value.push(`[settled] Mutation completed`)
    },
  },
)

async function createUser() {
  await mutate({ name: newName.value, email: newEmail.value, role: 'viewer' })
}

function clearLog() {
  log.value = []
  reset()
}
</script>

<template>
  <div class="demo-page">
    <h2>useMutation 变更操作</h2>
    <p class="page-desc">
      用于数据修改操作 (POST/PUT/DELETE)，支持生命周期回调。
    </p>

    <div class="card">
      <h3><GitPullRequest :size="18" /> 创建用户</h3>
      <div class="form-group">
        <label>姓名</label>
        <input v-model="newName" class="input" placeholder="用户名" />
      </div>
      <div class="form-group">
        <label>邮箱</label>
        <input v-model="newEmail" class="input" placeholder="邮箱地址" />
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" :disabled="loading" @click="createUser">
          <Plus :size="14" /> 创建用户
        </button>
        <button class="btn" @click="clearLog">清空</button>
      </div>

      <div class="flex items-center gap-2 mb-2">
        <span v-if="loading" class="badge badge-loading"><span class="spinner" /> 提交中...</span>
        <span v-if="data && !loading" class="badge badge-success"><Check :size="12" /> 完成</span>
        <span v-if="error" class="badge badge-error">失败</span>
      </div>

      <div v-if="data" class="result-panel">
        <div class="result-label">已创建用户</div>
        <pre class="code-block">{{ JSON.stringify(data, null, 2) }}</pre>
      </div>
    </div>

    <div class="card">
      <h3>生命周期日志</h3>
      <div v-if="log.length" class="code-block">
        <div v-for="(entry, i) in log" :key="i">{{ entry }}</div>
      </div>
      <p v-else class="text-sm text-secondary">点击「创建用户」查看生命周期回调。</p>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useMutation</code> 专门用于数据变更操作（POST/PUT/DELETE），
        与 <code>useQuery</code>（查询）互补。它提供了完整的变更生命周期回调。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { inject } from 'vue'
import { useMutation, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
import type { HttpClient } from '@ldesign/http-core'

const client = inject&lt;HttpClient&gt;(HTTP_CLIENT_KEY)!

// useMutation&lt;响应类型, 参数类型&gt;(client, 变更函数, 选项)
const { data, loading, error, mutate, reset } = useMutation&lt;User, CreateUserInput&gt;(
  client,
  (variables) => client.post('/api/users', variables),
  {
    onMutate: (vars) => {
      // 变更开始前调用，可用于乐观更新
      console.log('开始变更:', vars)
    },
    onSuccess: (data, variables, response) => {
      // 变更成功后调用
      console.log('创建成功:', data)
    },
    onError: (error, variables) => {
      // 变更失败时调用
      console.error('创建失败:', error.message)
    },
    onSettled: (data, error, variables) => {
      // 无论成功或失败都会调用
      console.log('变更完成')
    },
  },
)

// 触发变更
await mutate({ name: 'Alice', email: 'alice@test.com' })</pre>
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
            <td><code>Ref&lt;T | null&gt;</code></td>
            <td>变更后返回的数据</td>
          </tr>
          <tr>
            <td><code>loading</code></td>
            <td><code>Ref&lt;boolean&gt;</code></td>
            <td>变更是否进行中</td>
          </tr>
          <tr>
            <td><code>error</code></td>
            <td><code>Ref&lt;HttpError | null&gt;</code></td>
            <td>变更失败时的错误</td>
          </tr>
          <tr>
            <td><code>finished</code></td>
            <td><code>Ref&lt;boolean&gt;</code></td>
            <td>变更是否已完成</td>
          </tr>
          <tr>
            <td><code>mutate(vars, config?)</code></td>
            <td><code>Promise&lt;ResponseData&gt;</code></td>
            <td>执行变更操作</td>
          </tr>
          <tr>
            <td><code>reset()</code></td>
            <td><code>void</code></td>
            <td>重置所有状态</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>生命周期顺序</h3>
      <pre class="code-block">// 调用 mutate(variables) 后的执行顺序：
//
// 1. onMutate(variables)    ← 变更开始前
// 2. mutationFn(variables)  ← 执行实际请求
// 3a. onSuccess(data)       ← 请求成功
// 3b. onError(error)        ← 请求失败
// 4. onSettled(data, error) ← 无论成功或失败都会调用
//
// 组件卸载时自动取消未完成的变更请求</pre>
    </div>
  </div>
</template>
