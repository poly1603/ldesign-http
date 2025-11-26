# useResource 示例

useResource 组合式函数的完整示例。

## 基础用法

```vue
<script setup lang="ts">
import { useResource } from '@ldesign/http-vue'

interface User {
  id: number
  name: string
  email: string
}

const {
  items,
  current,
  loading,
  list,
  get,
  create,
  update,
  remove
} = useResource<User>('/api/users')

// 加载列表
await list()

// 创建用户
await create({ name: 'John', email: 'john@example.com' })

// 更新用户
await update(1, { name: 'Jane' })

// 删除用户
await remove(1)
</script>

<template>
  <div>
    <button @click="list">加载列表</button>
    <ul v-if="!loading">
      <li v-for="user in items" :key="user.id">
        {{ user.name }}
        <button @click="update(user.id, { name: 'Updated' })">更新</button>
        <button @click="remove(user.id)">删除</button>
      </li>
    </ul>
  </div>
</template>
```

## 下一步

- [useForm](/examples/vue-use-form) - useForm 示例
- [Vue 集成](/packages/vue) - Vue 文档