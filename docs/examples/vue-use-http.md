# useHttp 示例

useHttp 组合式函数的完整示例。

## 基础用法

```vue
<script setup lang="ts">
import { useHttp } from '@ldesign/http-vue'

interface User {
  id: number
  name: string
  email: string
}

const { data, loading, error, execute } = useHttp<User[]>('/api/users', {
  immediate: true
})
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <ul v-else>
      <li v-for="user in data" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
```

## 手动执行

```vue
<script setup>
const { data, loading, execute } = useHttp('/api/users', {
  immediate: false
})

const loadData = () => {
  execute()
}
</script>

<template>
  <button @click="loadData">加载数据</button>
</template>
```

## 下一步

- [useRequest](/examples/vue-use-request) - useRequest 示例
- [Vue 集成](/packages/vue) - Vue 文档