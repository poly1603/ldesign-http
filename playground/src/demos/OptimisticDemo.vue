<script setup lang="ts">
import { ref, inject } from 'vue'
import { Zap, Plus, Trash2, Check } from 'lucide-vue-next'
import { useOptimisticList, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
import type { HttpClient } from '@ldesign/http-core'

const client = inject<HttpClient>(HTTP_CLIENT_KEY)!

interface Todo {
  id: number
  title: string
  completed: boolean
  userId: number
}

const todos = ref<Todo[]>([
  { id: 1, title: '完成文档编写', completed: false, userId: 1 },
  { id: 2, title: '修复登录 Bug', completed: true, userId: 2 },
  { id: 3, title: '添加单元测试', completed: false, userId: 1 },
])

const log = ref<string[]>([])
const newTitle = ref('')

const { add, update, remove } = useOptimisticList<Todo>(client, todos)

let nextId = 100

async function addTodo() {
  if (!newTitle.value.trim()) return
  const todo: Todo = { id: nextId++, title: newTitle.value, completed: false, userId: 1 }
  log.value.push(`[乐观] 立即添加: "${todo.title}"`)
  newTitle.value = ''
  try {
    await add(
      { url: '/api/todos', method: 'POST', data: todo },
      todo,
    )
    log.value.push(`[确认] 服务器已确认添加`)
  } catch (e: any) {
    log.value.push(`[回滚] 添加失败，已撤销: ${e.message}`)
  }
}

async function toggleTodo(todo: Todo) {
  const newCompleted = !todo.completed
  log.value.push(`[乐观] 立即更新 #${todo.id} completed=${newCompleted}`)
  try {
    await update(
      { url: `/api/todos/${todo.id}`, method: 'PUT', data: { completed: newCompleted } },
      todo.id,
      { completed: newCompleted },
    )
    log.value.push(`[确认] 服务器已确认更新`)
  } catch (e: any) {
    log.value.push(`[回滚] 更新失败，已撤销: ${e.message}`)
  }
}

async function removeTodo(id: number) {
  log.value.push(`[乐观] 立即删除 #${id}`)
  try {
    await remove(
      { url: `/api/todos/${id}`, method: 'DELETE' },
      id,
    )
    log.value.push(`[确认] 服务器已确认删除`)
  } catch (e: any) {
    log.value.push(`[回滚] 删除失败，已恢复: ${e.message}`)
  }
}
</script>

<template>
  <div class="demo-page">
    <h2>useOptimisticUpdate 乐观更新</h2>
    <p class="page-desc">
      先立即更新 UI，再发送请求；如果请求失败，自动回滚到之前的状态。提供极致的用户体验。
    </p>

    <div class="card">
      <h3><Zap :size="18" /> Todo 列表（乐观更新）</h3>
      <div class="flex gap-2 mb-2">
        <input v-model="newTitle" class="input" placeholder="新增 Todo..." style="flex:1" @keyup.enter="addTodo" />
        <button class="btn btn-success" @click="addTodo">
          <Plus :size="14" /> 添加
        </button>
      </div>

      <div v-for="todo in todos" :key="todo.id" class="flex items-center gap-2" style="padding: 8px 0; border-bottom: 1px solid var(--color-border);">
        <button class="btn btn-sm" :class="todo.completed ? 'btn-success' : ''" @click="toggleTodo(todo)">
          <Check :size="12" />
        </button>
        <span :style="{ textDecoration: todo.completed ? 'line-through' : 'none', flex: 1 }">
          #{{ todo.id }} {{ todo.title }}
        </span>
        <button class="btn btn-sm btn-error" @click="removeTodo(todo.id)">
          <Trash2 :size="12" />
        </button>
      </div>

      <div v-if="log.length" class="result-panel mt-2">
        <div class="result-label">操作日志</div>
        <div class="code-block" style="max-height: 200px">
          <div v-for="(entry, i) in log" :key="i" :style="{ color: entry.includes('[回滚]') ? 'var(--color-error)' : entry.includes('[确认]') ? 'var(--color-success)' : 'var(--color-primary)' }">{{ entry }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <strong>乐观更新</strong>的核心思想：假设请求会成功，先更新 UI，再异步发送请求。
        如果请求失败，自动<strong>回滚</strong>到之前的数据。这样用户不需要等待网络延迟就能看到即时反馈。
      </p>
      <p class="text-sm text-secondary mb-2">
        <code>useOptimisticUpdate</code> 是通用版本，操作任意 Ref 数据。<br>
        <code>useOptimisticList</code> 是列表专用版本，内置 add/update/remove 操作。
      </p>
    </div>

    <div class="card">
      <h3>useOptimisticList 用法</h3>
      <pre class="code-block">import { useOptimisticList } from '@ldesign/http-vue'

const todos = ref([...])
const { add, update, remove } = useOptimisticList(client, todos)

// 添加 — 立即追加到列表，请求失败自动移除
await add(
  { url: '/api/todos', method: 'POST', data: newTodo },
  newTodo,
)

// 更新 — 立即修改列表中的项，失败自动恢复
await update(
  { url: `/api/todos/${id}`, method: 'PUT', data: updates },
  id,       // 按 id 定位
  updates,  // 合并的字段
)

// 删除 — 立即从列表中移除，失败自动恢复
await remove(
  { url: `/api/todos/${id}`, method: 'DELETE' },
  id,
)</pre>
    </div>

    <div class="card">
      <h3>useOptimisticUpdate 通用版</h3>
      <pre class="code-block">import { useOptimisticUpdate } from '@ldesign/http-vue'

const { execute, rollback, loading, error } = useOptimisticUpdate(
  client,
  dataRef,  // 任意 Ref&lt;T&gt;
  {
    // 乐观更新函数 — 定义如何立即修改数据
    optimisticUpdate: (currentData, input) => {
      return [...currentData, input]
    },
    // 失败回滚回调
    onRollback: (error, previousData) => {
      console.error('操作失败，已回滚:', error)
    },
    // 成功回调
    onSuccess: (data) => {
      console.log('服务器确认:', data)
    },
  },
)

// 执行（先乐观更新，再发请求）
await execute(requestConfig, inputData)</pre>
    </div>
  </div>
</template>
