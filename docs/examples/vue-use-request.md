# useRequest 示例

useRequest 组合式函数的完整示例。

## 基础用法

```vue
<script setup lang="ts">
import { useRequest } from '@ldesign/http-vue'

const { data, loading, error } = useRequest({
  url: '/api/users',
  method: 'GET',
  immediate: true
})
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error.message }}</div>
    <div v-else>{{ data }}</div>
  </div>
</template>
```

## 带缓存和重试

```vue
<script setup>
const { data, loading, refresh } = useRequest({
  url: '/api/users',
  cache: { enabled: true, ttl: 5000 },
  retry: { enabled: true, maxAttempts: 3 }
})
</script>
```

## 下一步

- [useResource](/examples/vue-use-resource) - useResource 示例
- [Vue 集成](/packages/vue) - Vue 文档