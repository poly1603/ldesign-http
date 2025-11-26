# 文件上传示例

文件上传的完整示例。

## 基础上传

```typescript
const formData = new FormData()
formData.append('file', file)

const response = await client.upload('/upload', formData)
```

## 带进度

```typescript
const response = await client.upload('/upload', formData, {
  onUploadProgress: (progress) => {
    console.log(`上传进度: ${progress.percentage}%`)
  }
})
```

## Vue 示例

```vue
<script setup>
import { ref } from 'vue'
import { useHttpClient } from '@ldesign/http-vue'

const client = useHttpClient()
const progress = ref(0)

const handleUpload = async (event) => {
  const file = event.target.files[0]
  const formData = new FormData()
  formData.append('file', file)
  
  await client.upload('/upload', formData, {
    onUploadProgress: (p) => {
      progress.value = p.percentage
    }
  })
}
</script>

<template>
  <div>
    <input type="file" @change="handleUpload" />
    <progress :value="progress" max="100">{{ progress }}%</progress>
  </div>
</template>
```

## 下一步

- [文件下载](/examples/download) - 下载示例
- [进度跟踪](/guide/progress) - 进度功能