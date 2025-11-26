# useForm 示例

useForm 组合式函数的完整示例。

## 基础用法

```vue
<script setup lang="ts">
import { useForm } from '@ldesign/http-vue'

interface UserForm {
  name: string
  email: string
}

const { data, errors, submitting, submit, setValidationRules } = useForm<UserForm>({
  initialData: { name: '', email: '' },
  url: '/api/users',
  method: 'POST'
})

setValidationRules({
  name: [{ required: true, message: '姓名必填' }],
  email: [
    { required: true, message: '邮箱必填' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }
  ]
})
</script>

<template>
  <form @submit.prevent="submit">
    <div>
      <input v-model="data.name" placeholder="姓名" />
      <span v-if="errors.name">{{ errors.name }}</span>
    </div>
    <div>
      <input v-model="data.email" type="email" placeholder="邮箱" />
      <span v-if="errors.email">{{ errors.email }}</span>
    </div>
    <button type="submit" :disabled="submitting">
      {{ submitting ? '提交中...' : '提交' }}
    </button>
  </form>
</template>
```

## 下一步

- [usePagination](/examples/vue-use-pagination) - usePagination 示例
- [Vue 集成](/packages/vue) - Vue 文档