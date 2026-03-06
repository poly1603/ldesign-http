<script setup lang="ts">
import { ref } from 'vue'
import { Database, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { useResource } from '@ldesign/http-vue'

const { items, current, loading, error, hasError, list, get, create, update, remove, refresh } =
  useResource<any>('/api/users', { immediate: false })

const editId = ref<number | null>(null)
const editName = ref('')

async function loadList() {
  await list()
}

async function loadUser(id: number) {
  await get(id)
}

async function addUser() {
  await create({ name: 'Resource User', email: 'resource@example.com', role: 'viewer' })
}

function startEdit(user: any) {
  editId.value = user.id
  editName.value = user.name
}

async function saveEdit() {
  if (editId.value != null) {
    await update(editId.value, { name: editName.value })
    editId.value = null
    editName.value = ''
  }
}

async function deleteUser(id: number) {
  await remove(id)
}
</script>

<template>
  <div class="demo-page">
    <h2>useResource 资源管理</h2>
    <p class="page-desc">
      完整的 REST 资源 CRUD 操作，带响应式状态管理。
    </p>

    <div class="card">
      <h3><Database :size="18" /> 用户资源</h3>
      <div class="btn-group">
        <button class="btn btn-primary" :disabled="loading" @click="loadList">
          <RefreshCw :size="14" /> 加载列表
        </button>
        <button class="btn btn-success" :disabled="loading" @click="addUser">
          <Plus :size="14" /> 新增
        </button>
        <button class="btn" :disabled="loading" @click="refresh">
          <RefreshCw :size="14" /> 刷新
        </button>
      </div>

      <div v-if="loading" class="flex items-center gap-2 mb-2">
        <span class="badge badge-loading"><span class="spinner" /> 加载中...</span>
      </div>
      <div v-if="hasError" class="flex items-center gap-2 mb-2">
        <span class="badge badge-error">{{ error?.message }}</span>
      </div>

      <table v-if="items.length" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in items" :key="user.id">
            <td>{{ user.id }}</td>
            <td>
              <template v-if="editId === user.id">
                <input v-model="editName" class="input" style="width: 160px" @keyup.enter="saveEdit" />
              </template>
              <template v-else>{{ user.name }}</template>
            </td>
            <td>{{ user.email }}</td>
            <td><span class="badge badge-success">{{ user.role }}</span></td>
            <td>
              <div class="flex gap-2">
                <button v-if="editId === user.id" class="btn btn-sm btn-success" @click="saveEdit">保存</button>
                <button v-else class="btn btn-sm" @click="startEdit(user)"><Pencil :size="12" /></button>
                <button class="btn btn-sm btn-error" @click="deleteUser(user.id)"><Trash2 :size="12" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="current" class="card">
      <h3>当前项</h3>
      <pre class="code-block">{{ JSON.stringify(current, null, 2) }}</pre>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useResource</code> 将 REST 资源的增删改查操作封装为响应式组合式函数。
        只需传入基础 URL，即可获得完整的 CRUD 方法，
        内部自动维护列表数据和当前项状态。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { useResource } from '@ldesign/http-vue'

const { items, current, loading, error, hasError,
  list, get, create, update, remove, refresh, reset,
} = useResource&lt;User&gt;('/api/users', { immediate: false })

// 获取列表 → GET /api/users
// items.value 自动更新为返回的数组
await list()

// 获取单个资源 → GET /api/users/1
// current.value 自动更新
await get(1)

// 创建 → POST /api/users
// 自动添加到 items 列表
await create({ name: 'New User', email: 'new@example.com' })

// 更新 → PUT /api/users/1
// 自动更新 items 中对应的项
await update(1, { name: 'Updated Name' })

// 删除 → DELETE /api/users/1
// 自动从 items 中移除
await remove(1)

// 刷新 → 重新调用 list()
await refresh()</pre>
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
            <td><code>items</code></td>
            <td><code>Ref&lt;T[]&gt;</code></td>
            <td>资源列表，由 list() 填充</td>
          </tr>
          <tr>
            <td><code>current</code></td>
            <td><code>Ref&lt;T | null&gt;</code></td>
            <td>当前资源项，由 get() 填充</td>
          </tr>
          <tr>
            <td><code>loading</code></td>
            <td><code>Ref&lt;boolean&gt;</code></td>
            <td>是否有操作进行中</td>
          </tr>
          <tr>
            <td><code>error</code></td>
            <td><code>Ref&lt;Error | null&gt;</code></td>
            <td>错误信息</td>
          </tr>
          <tr>
            <td><code>list(config?)</code></td>
            <td><code>Promise&lt;T[]&gt;</code></td>
            <td>GET 列表</td>
          </tr>
          <tr>
            <td><code>get(id, config?)</code></td>
            <td><code>Promise&lt;T | null&gt;</code></td>
            <td>GET 单项</td>
          </tr>
          <tr>
            <td><code>create(data, config?)</code></td>
            <td><code>Promise&lt;T | null&gt;</code></td>
            <td>POST 创建</td>
          </tr>
          <tr>
            <td><code>update(id, data, config?)</code></td>
            <td><code>Promise&lt;T | null&gt;</code></td>
            <td>PUT 更新</td>
          </tr>
          <tr>
            <td><code>remove(id, config?)</code></td>
            <td><code>Promise&lt;boolean&gt;</code></td>
            <td>DELETE 删除</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>配置选项</h3>
      <pre class="code-block">useResource&lt;User&gt;('/api/users', {
  immediate: true,                // 是否立即加载列表
  cancelOnUnmount: true,          // 组件卸载时取消请求
  transform: (data) => data,      // 数据转换函数
  onSuccess: (data, op) => {},    // 成功回调，op 为操作类型
  onError: (error, op) => {},     // 错误回调
})</pre>
    </div>
  </div>
</template>
