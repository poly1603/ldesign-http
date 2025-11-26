# usePagination 示例

usePagination 组合式函数的完整示例。

## 基础用法

```vue
<script setup lang="ts">
import { usePagination } from '@ldesign/http-vue'

interface User {
  id: number
  name: string
}

const {
  data,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  hasMore,
  nextPage,
  prevPage,
  goToPage
} = usePagination<User>('/api/users', {
  initialPage: 1,
  initialPageSize: 10
})
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <ul v-else>
      <li v-for="user in data" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
    
    <div class="pagination">
      <button @click="prevPage" :disabled="page === 1">上一页</button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button @click="nextPage" :disabled="!hasMore">下一页</button>
    </div>
  </div>
</template>
```

## 下一步

- [useHttp](/examples/vue-use-http) - useHttp 示例
- [Vue 集成](/packages/vue) - Vue 文档